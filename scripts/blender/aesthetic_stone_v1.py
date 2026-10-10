"""Local stone candidates with unchanged anchors, feet, channel and passage."""
import bpy, bmesh, json, os
from pathlib import Path
ROOT=Path(r'C:/Users/cjfty/Documents/dev/cjftya.github.io')
OUT=ROOT/'artifacts/jelly-oasis/aesthetic-improvement-v1'
phase=os.environ.get('AESTHETIC_PHASE','cliff')
bpy.ops.wm.open_mainfile(filepath=str(OUT/'jelly-oasis-aesthetic-refined-v1.blend'))
bpy.context.preferences.filepaths.save_version=0
report={}
names=['Cliff_Waterfall_A_Detail_v1'] if phase=='cliff' else ['Ruin_Arch_A_Detail_v1','Ruin_Wall_A_Detail_v1']
for name in names:
    ob=bpy.data.objects[name];mesh=ob.data
    before=[v.co.copy() for v in mesh.vertices]
    changed=[]
    if phase=='cliff':
        for v in mesh.vertices:
            x,y,z=v.co
            if y>=-1 or z<2 or abs(x)<3:continue
            delta=0
            for cx,cz,amount in [(-6,3.8,-.24),(6,8,.28),(-6,12,-.20)]:
                weight=max(0,1-abs(x-cx)/2.8)*max(0,1-abs(z-cz)/1.4)*min(1,(-y-1)/2)
                delta+=amount*weight
            if abs(delta)>.001:v.co.z+=delta;changed.append(v.index)
        mesh.update()
    else:
        bm=bmesh.new();bm.from_mesh(mesh);bm.verts.ensure_lookup_table()
        unseen=set(bm.verts);components=[]
        while unseen:
            group=[];todo=[unseen.pop()]
            while todo:
                v=todo.pop();group.append(v)
                for e in v.link_edges:
                    q=e.other_vert(v)
                    if q in unseen:unseen.remove(q);todo.append(q)
            components.append(group)
        for group in components:
            cx=sum(v.co.x for v in group)/len(group);cz=sum(v.co.z for v in group)/len(group)
            selected = (-3.5<cx<-1.6 and 6.5<cz<8.5) if 'Arch' in name else (cx<-2 and cz>2)
            if not selected:continue
            lo=min(v.co.x for v in group);hi=max(v.co.z for v in group)
            for v in group:
                # Weather only the outer upper stone corner. Opening-facing
                # vertices and the wall/root side keep their exact coordinates.
                if v.co.x<lo+.18 and v.co.z>hi-.22:
                    v.co.x+=.09;v.co.z-=.07;changed.append(v.index)
        bm.to_mesh(mesh);bm.free();mesh.update()
    bm=bmesh.new();bm.from_mesh(mesh)
    health={'nonmanifold':sum(not e.is_manifold for e in bm.edges),'winding':sum(e.is_manifold and not e.is_contiguous for e in bm.edges),
            'zero_area':sum(f.calc_area()<1e-9 for f in bm.faces),'loose':sum(not v.link_edges for v in bm.verts)}
    bm.free();assert not any(health.values())
    assert all((v.co-before[v.index]).length==0 for v in mesh.vertices if before[v.index].z<.35)
    bpy.ops.object.select_all(action='DESELECT');ob.hide_set(False);ob.select_set(True);bpy.context.view_layer.objects.active=ob
    old=ob.location.copy();ob.location=(0,0,0)
    filename='Cliff_refined_v1.glb' if phase=='cliff' else ('Ruin_Arch_refined_v1.glb' if 'Arch' in name else 'Ruin_Wall_refined_v1.glb')
    try:
        bpy.ops.export_scene.gltf(filepath=str(OUT/filename),export_format='GLB',use_selection=True,export_yup=True,export_animations=False,use_active_scene=True)
    finally:ob.location=old
    mesh.calc_loop_triangles()
    report[name]={'changes':changed,'change_kind':'local ledge vertices' if phase=='cliff' else 'outer corner vertices',
                  'triangles':len(mesh.loop_triangles),'health':health,'foot_preserved':True,'origin':list(ob.location),'scale':list(ob.scale)}
(OUT/f'{phase}-audit.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'jelly-oasis-aesthetic-refined-v1.blend'))
print(json.dumps(report))
