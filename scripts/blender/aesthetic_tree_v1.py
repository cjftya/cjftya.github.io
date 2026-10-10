"""Compare full flat and local trunk flat while preserving geometry and feet."""
import bpy, bmesh, json
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from pathlib import Path
ROOT=Path(r'C:/Users/cjfty/Documents/dev/cjftya.github.io')
OUT=ROOT/'artifacts/jelly-oasis/aesthetic-improvement-v1'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'baseline-source.blend'))
parent=bpy.data.objects['Tree_Landmark_Detail_v1']
parts=list(parent.children)
wood=bpy.data.objects['Trunk_and_Branches']
report={}
canopy=bpy.data.objects['Canopy_Clusters'].data
canopy.calc_loop_triangles()
bvh=BVHTree.FromPolygons([v.co for v in canopy.vertices],[t.vertices for t in canopy.loop_triangles],all_triangles=True)
tip_changes=[]
for variant in ['flat', 'refined']:
    if variant == 'refined':
        # Four exposed terminal branches only. Extend into the existing canopy,
        # feathering the last 2m; no new foliage or branch topology.
        for xyz in [(-3.9,3,20), (1.2,-3.4,21), (8.6,2.1,21), (-9,.2,19.3)]:
            tip=Vector(xyz)
            hit, normal, face, distance=bvh.ray_cast(tip,Vector((0,0,1)),2)
            if hit is None or distance < .12: continue
            lift=min(distance+.35,1.8)
            count=0
            for v in wood.data.vertices:
                d=(v.co-tip).length
                if d<2 and v.co.z>18:
                    v.co.z += lift*(1-d/2)**2
                    count+=1
            tip_changes.append({'tip':xyz,'gap':distance,'maximum_lift':lift,'vertices':count})
        wood.data.update()
    for p in wood.data.polygons:
        p.use_smooth = False
    bpy.ops.object.select_all(action='DESELECT')
    for o in [parent]+parts:
        o.hide_set(False); o.select_set(True)
    bpy.context.view_layer.objects.active=parent
    old=parent.location.copy(); parent.location=(0,0,0)
    bpy.context.view_layer.update()
    bounds=[o.matrix_world@v.co for o in parts for v in o.data.vertices]
    path=OUT/f'Tree_Landmark_{variant}_v1.glb'
    try:
        bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,
                                  export_yup=True,export_animations=False,use_active_scene=True)
    finally:
        parent.location=old
    bm=bmesh.new(); bm.from_mesh(wood.data)
    health={'nonmanifold':sum(not e.is_manifold for e in bm.edges),
            'winding':sum(e.is_manifold and not e.is_contiguous for e in bm.edges),
            'zero_area':sum(f.calc_area()<1e-9 for f in bm.faces),'loose':sum(not v.link_edges for v in bm.verts)}
    bm.free(); assert not any(health.values())
    wood.data.calc_loop_triangles()
    report[variant]={'wood_triangles':len(wood.data.loop_triangles),'smooth_faces':sum(p.use_smooth for p in wood.data.polygons),
        'bounds':[[min(p[i] for p in bounds) for i in range(3)],[max(p[i] for p in bounds) for i in range(3)]],
        'health':health,'bytes':path.stat().st_size,'geometry_changed':variant=='refined','tip_changes':tip_changes.copy()}
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'jelly-oasis-aesthetic-refined-v1.blend'))
(OUT/'tree-audit.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report))
