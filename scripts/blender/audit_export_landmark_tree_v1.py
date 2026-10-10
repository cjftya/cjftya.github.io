import bpy,bmesh,json,ast,re
from pathlib import Path
from mathutils import Vector
ROOT=Path(r'C:/Users/cjfty/Documents/dev/cjftya.github.io'); OUT=ROOT/'artifacts/jelly-oasis/landmark-tree-detail-v1'
parent=bpy.data.objects['Tree_Landmark_Detail_v1']; source=bpy.data.objects['Tree_Landmark_Blockout']; children=list(parent.children)
report={'source_file':str(ROOT/'artifacts/jelly-oasis/ruin-root-night-v1/jelly-oasis-ruin-root-detail-v1.blend'),'parts':{},'origin':list(parent.location),'scale':list(parent.scale)}
for ob in [source]+children:
    me=ob.data; me.calc_loop_triangles(); bm=bmesh.new(); bm.from_mesh(me)
    entry={'triangles':len(me.loop_triangles),'dimensions':list(ob.dimensions),'nonmanifold':sum(not e.is_manifold for e in bm.edges),'loose':sum(not v.link_edges for v in bm.verts),'zero_area':sum(f.calc_area()<1e-9 for f in bm.faces),'winding':sum(e.is_manifold and not e.is_contiguous for e in bm.edges),'duplicates':len(me.vertices)-len({tuple(round(c,6) for c in v.co) for v in me.vertices}),'materials':[m.name for m in me.materials]}
    bm.free(); report['parts'][ob.name]=entry
    if ob!=source: assert not any(entry[k] for k in ['nonmanifold','loose','zero_area','winding']),entry
before_foot={tuple(round(c,5) for c in v.co) for v in source.data.vertices if v.co.z<.35}
new_foot={tuple(round(c,5) for c in v.co) for ob in children for v in ob.data.vertices if v.co.z<.35}
assert before_foot==new_foot
report['support_identical']=True
report['triangles']=sum(report['parts'][ob.name]['triangles'] for ob in children)
assert report['triangles']<=15000
bounds=[v.co for ob in children for v in ob.data.vertices]
report['bounds']=[[min(v[a] for v in bounds) for a in range(3)],[max(v[a] for v in bounds) for a in range(3)]]
bpy.ops.object.select_all(action='DESELECT'); parent.select_set(True)
for ob in children: ob.select_set(True)
bpy.context.view_layer.objects.active=parent
path=ROOT/'public/assets/jelly-oasis/landmarks/overgrown-ruin/Tree_Landmark_Detail_v1.glb'
old=parent.location.copy(); parent.location=(0,0,0)
try:
    options=[i.identifier for i in bpy.ops.export_scene.gltf.get_rna_type().properties['export_format'].enum_items]
    if not options:
        try: bpy.ops.export_scene.gltf(export_format='__QUERY_SUPPORTED_VALUES__')
        except TypeError as error: options=ast.literal_eval(re.search(r'not found in (.*)',str(error)).group(1))
    bpy.ops.export_scene.gltf(filepath=str(path),export_format=next(i for i in options if i=='GLB'),use_selection=True,export_yup=True,export_animations=False,use_active_scene=True)
finally: parent.location=old
existing=set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=str(path)); imported=set(bpy.data.objects)-existing
bpy.context.view_layer.update()
points=[]; tris=0
for ob in imported:
    if ob.type=='MESH':
        ob.data.calc_loop_triangles(); tris+=len(ob.data.loop_triangles)
        points.extend([ob.matrix_world@v.co for v in ob.data.vertices])
report['reimport_triangles']=tris
report['reimport_bounds']=[[min(v[a] for v in points) for a in range(3)],[max(v[a] for v in points) for a in range(3)]]
assert tris==report['triangles']
for a in range(3):
    for end in range(2): assert abs(report['bounds'][end][a]-report['reimport_bounds'][end][a])<.001
for ob in imported: bpy.data.objects.remove(ob,do_unlink=True)
report['bytes']=path.stat().st_size
(OUT/'mesh-audit.json').write_text(json.dumps(report,indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'jelly-oasis-landmark-tree-detail-v1.blend'))
print(json.dumps(report))
