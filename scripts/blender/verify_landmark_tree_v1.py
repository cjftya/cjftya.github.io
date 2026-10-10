import bpy,json,bmesh
from pathlib import Path
ROOT=Path(r'C:/Users/cjfty/Documents/dev/cjftya.github.io'); OUT=ROOT/'artifacts/jelly-oasis/landmark-tree-detail-v1'
parent=bpy.data.objects['Tree_Landmark_Detail_v1'];source=bpy.data.objects['Tree_Landmark_Blockout'];report={'parts':{}}
points=[]
for ob in [source]+list(parent.children):
 me=ob.data;me.calc_loop_triangles();bm=bmesh.new();bm.from_mesh(me)
 entry={'triangles':len(me.loop_triangles),'dimensions':list(ob.dimensions),'nonmanifold':sum(not e.is_manifold for e in bm.edges),'loose':sum(not v.link_edges for v in bm.verts),'zero_area':sum(f.calc_area()<1e-9 for f in bm.faces),'winding':sum(e.is_manifold and not e.is_contiguous for e in bm.edges),'duplicates':len(me.vertices)-len({tuple(round(c,6) for c in v.co) for v in me.vertices})}
 bm.free();report['parts'][ob.name]=entry
 if ob!=source:
  assert not any(entry[k] for k in ['nonmanifold','loose','zero_area','winding','duplicates']);points.extend([v.co.copy() for v in me.vertices])
report['bounds']=[[min(v[a] for v in points) for a in range(3)],[max(v[a] for v in points) for a in range(3)]]
foot=lambda obs:{tuple(round(c,5) for c in v.co) for o in obs for v in o.data.vertices if v.co.z<.35}
assert foot([source])==foot(parent.children); report['support_identical']=True
report['origin']=list(parent.location);report['scale']=list(parent.scale)
# Render from saved source before importing the exported copy.
exec(compile((ROOT/'scripts/blender/render_landmark_tree_v1.py').read_text(),'render_tree','exec'))
existing=set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/assets/jelly-oasis/landmarks/overgrown-ruin/Tree_Landmark_Detail_v1.glb'))
imported=set(bpy.data.objects)-existing;points=[];tris=0
bpy.context.view_layer.update()
for ob in imported:
 if ob.type=='MESH':
  ob.data.calc_loop_triangles();tris+=len(ob.data.loop_triangles);points.extend([ob.matrix_world@v.co for v in ob.data.vertices])
report['reimport_triangles']=tris;report['reimport_bounds']=[[min(v[a] for v in points) for a in range(3)],[max(v[a] for v in points) for a in range(3)]]
assert tris==11866
for a in range(3):
 for end in range(2):assert abs(report['bounds'][end][a]-report['reimport_bounds'][end][a])<.001
(OUT/'mesh-audit-background.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
