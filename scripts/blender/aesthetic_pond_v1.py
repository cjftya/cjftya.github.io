"""Local bank adjustments; preserve every water-guide point and outermost row."""
import bpy, bmesh, json
from pathlib import Path
from mathutils import Vector
ROOT=Path(r'C:/Users/cjfty/Documents/dev/cjftya.github.io')
OUT=ROOT/'artifacts/jelly-oasis/aesthetic-improvement-v1'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'jelly-oasis-aesthetic-refined-v1.blend'))
bpy.context.preferences.filepaths.save_version=0
parent=bpy.data.objects['PondEdge_Detail_v2']
shore=bpy.data.objects['Shore_Base_Bank_Upper_v2']
guide=parent['pond_guide_v2']
n=len(shore.data.vertices)//5
assert n==57
before=[v.co.copy() for v in shore.data.vertices]
changed=[]
for i in range(45,51):
    p=before[n+i]; tangent=(before[n+(i+1)%n]-before[n+(i-1)%n]).normalized()
    normal=Vector((tangent.y,-tangent.x,0))
    for band,offset,lift in [(2,.20,.035),(3,.10,.02)]:
        v=shore.data.vertices[band*n+i]
        v.co += normal*offset;v.co.z+=lift;changed.append(v.index)
shore.data.update()
assert all((shore.data.vertices[i].co-before[i]).length==0 for i in list(range(2*n))+list(range(4*n,5*n)))
assert all(p.normal.z>0 for p in shore.data.polygons)
earth=shore.data.materials[0].copy();earth.name='JO_PondEdge_Earth_Refined'
bsdf=next(n for n in earth.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
color=bsdf.inputs['Base Color'].default_value
bsdf.inputs['Base Color'].default_value=(color[0]*.88,color[1]*.92,color[2]*.97,color[3])
shore.data.materials[0]=earth
parts=[o for o in parent.children if o.type=='MESH' and not o.get('export_excluded')]
bpy.ops.object.select_all(action='DESELECT')
for o in [parent]+parts:o.hide_set(False);o.select_set(True)
bpy.context.view_layer.objects.active=parent
old=parent.location.copy();parent.location=(0,0,0)
try:
    bpy.ops.export_scene.gltf(filepath=str(OUT/'PondEdge_refined_v1.glb'),export_format='GLB',use_selection=True,export_yup=True,export_animations=False,export_extras=True,use_active_scene=True)
finally:parent.location=old
assert parent['pond_guide_v2']==guide
bm=bmesh.new();bm.from_mesh(shore.data)
health={'zero_area':sum(f.calc_area()<1e-9 for f in bm.faces),'loose':sum(not v.link_edges for v in bm.verts),
        'nonmanifold_interior':sum(not e.is_manifold and not e.is_boundary for e in bm.edges),'boundary_edges':sum(e.is_boundary for e in bm.edges)}
bm.free();assert not any(health[k] for k in ['zero_area','loose','nonmanifold_interior'])
report={'changed_vertices':changed,'water_guide_preserved':True,'inner_rows_preserved':True,'outer_row_preserved':True,'smooth_faces':sum(p.use_smooth for p in shore.data.polygons),'health':health}
(OUT/'pond-audit.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'jelly-oasis-aesthetic-refined-v1.blend'))
print(json.dumps(report))
