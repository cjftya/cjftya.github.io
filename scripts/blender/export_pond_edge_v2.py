import bpy,bmesh,json,ast,re
from pathlib import Path
from mathutils import Vector
ROOT=Path(r'C:/Users/cjfty/Documents/dev/cjftya.github.io'); OUT=ROOT/'artifacts/jelly-oasis/pond-edge-detail-v2'
parent=bpy.data.objects['PondEdge_Detail_v2']; parts=[o for o in parent.children if o.type=='MESH' and not o.get('export_excluded')]
report=json.loads((OUT/'mesh-audit.json').read_text())
for ob in parts:
 ob.data.calc_loop_triangles();report['parts'][ob.name]={'role':ob['pond_role'],'triangles':len(ob.data.loop_triangles),'materials':[m.name for m in ob.data.materials]}
health={}
for ob in parts:
 bm=bmesh.new();bm.from_mesh(ob.data)
 health[ob.name]={'loose_vertices':sum(not v.link_edges for v in bm.verts),'zero_area_faces':sum(f.calc_area()<1e-9 for f in bm.faces),'boundary_edges':sum(e.is_boundary for e in bm.edges),'nonmanifold_interior_edges':sum(not e.is_manifold and not e.is_boundary for e in bm.edges)}
 if ob.get('pond_role')=='shore':
  health[ob.name]['minimum_upward_normal']=min(p.normal.z for p in ob.data.polygons)
  assert health[ob.name]['minimum_upward_normal']>0
 bm.free()
assert all(v['loose_vertices']==0 and v['zero_area_faces']==0 and v['nonmanifold_interior_edges']==0 for v in health.values())
(OUT/'mesh-health.json').write_text(json.dumps(health,indent=2))
bpy.ops.object.select_all(action='DESELECT');parent.select_set(True)
for ob in parts:ob.select_set(True)
bpy.context.view_layer.objects.active=parent
old=parent.location.copy();parent.location=(0,0,0)
points=[ob.matrix_world@v.co for ob in parts for v in ob.data.vertices]
bpy.context.view_layer.update();points=[ob.matrix_world@v.co for ob in parts for v in ob.data.vertices]
report['bounds']=[[min(v[a] for v in points) for a in range(3)],[max(v[a] for v in points) for a in range(3)]]
path=ROOT/'public/assets/jelly-oasis/landmarks/overgrown-ruin/PondEdge_Blockout_Detail_v2.glb'
try:
 options=[i.identifier for i in bpy.ops.export_scene.gltf.get_rna_type().properties['export_format'].enum_items]
 if not options:
  try:bpy.ops.export_scene.gltf(export_format='__QUERY_SUPPORTED_VALUES__')
  except TypeError as error:options=ast.literal_eval(re.search(r'not found in (.*)',str(error)).group(1))
 bpy.ops.export_scene.gltf(filepath=str(path),export_format=next(i for i in options if i=='GLB'),use_selection=True,export_yup=True,export_animations=False,export_extras=True,use_active_scene=True)
finally:parent.location=old
existing=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=str(path));imported=set(bpy.data.objects)-existing;bpy.context.view_layer.update()
tris=0;points=[];roles=[]
for ob in imported:
 if ob.type=='MESH':
  ob.data.calc_loop_triangles();tris+=len(ob.data.loop_triangles);points.extend(ob.matrix_world@v.co for v in ob.data.vertices);roles.append(ob.get('pond_role'))
assert tris==report['triangles'];assert all(r in ['shore','bank','rock'] for r in roles)
assert any(o.get('pond_guide_v2')==parent['pond_guide_v2'] for o in imported)
report['water_guide_preserved']=True
report['reimport_triangles']=tris;report['roles_preserved']=True;report['reimport_bounds']=[[min(v[a] for v in points) for a in range(3)],[max(v[a] for v in points) for a in range(3)]]
for a in range(3):
 for end in range(2):assert abs(report['bounds'][end][a]-report['reimport_bounds'][end][a])<.001
for ob in imported:bpy.data.objects.remove(ob,do_unlink=True)
report['bytes']=path.stat().st_size
(OUT/'mesh-audit.json').write_text(json.dumps(report,indent=2))
print(json.dumps({k:report[k] for k in ['triangles','reimport_triangles','roles_preserved','bounds','bytes']}))
