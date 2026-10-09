"""Break the regular blockout coursing in the new candidates only."""
import bpy, bmesh, math, json, shutil
from pathlib import Path
ROOT=Path(r'C:\Users\cjfty\Documents\dev\cjftya.github.io')
OUT=ROOT/'artifacts/jelly-oasis/ruin-root-night-v1'
assets=ROOT/'public/assets/jelly-oasis/landmarks/overgrown-ruin'
report=json.loads((OUT/'mesh-audit.json').read_text())
for name in ['Ruin_Wall_A','Ruin_BrokenWall_A','Ruin_Arch_A']:
    obj=bpy.data.objects[name+'_Detail_v1']
    assert not obj.get('irregular_coursing'), 'Already refined'
    bm=bmesh.new(); bm.from_mesh(obj.data)
    unseen=set(bm.verts)
    while unseen:
        component={unseen.pop()}; todo=list(component)
        while todo:
            for edge in todo.pop().link_edges:
                for v in edge.verts:
                    if v in unseen: unseen.remove(v); component.add(v); todo.append(v)
        center=sum((v.co for v in component), __import__('mathutils').Vector())/len(component)
        if name=='Ruin_Arch_A':
            for v in component:
                # Subtle taper on outside cheeks only, plus asymmetric crown erosion.
                if abs(v.co.x)>3.5 and .3<v.co.z<5.1:
                    v.co.x+=math.copysign(.09*math.sin(v.co.z*2.1),v.co.x)
                if v.co.z>8 and v.co.x<-1: v.co.z-=.2*math.sin(v.co.x*1.7)**2
            continue
        # Use the unrotated wall frame so adjoining edges remain aligned.
        angle=math.radians(25) if name=='Ruin_BrokenWall_A' else 0
        c,s=math.cos(angle),math.sin(angle)
        row=max(0,min(2,int(center.z/1.65)))
        old=[-4.1,-1.325,1.325,4.1]
        new=[[-4.1,-2.05,1.0,4.1],[-4.1,-.55,2.0,4.1],[-4.1,-2.35,.45,4.1]][row]
        for v in component:
            x,y=v.co.x*c-v.co.y*s,v.co.x*s+v.co.y*c
            if center.z<4.9:
                for j in range(3):
                    if x<=old[j+1] or j==2:
                        x=new[j]+(x-old[j])/(old[j+1]-old[j])*(new[j+1]-new[j]); break
            # Broad sloping beds instead of repeated perfectly horizontal layers.
            if v.co.z>.25 and center.z<4.9:
                v.co.z+=.10*math.sin(x*.85+row*.7)
            if name=='Ruin_BrokenWall_A' and v.co.z>4.5:
                v.co.z-=.34*math.sin(x*1.2+.5)**2
            v.co.x=x*c+y*s; v.co.y=-x*s+y*c
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces)); bm.to_mesh(obj.data); bm.free()
    obj['irregular_coursing']=True
    bpy.context.view_layer.update()
    path=assets/(name+'_Detail_v1.glb')
    shutil.copy2(path,OUT/(name+'_candidate-initial.glb'))
    for o in list(bpy.context.selected_objects): o.select_set(False)
    copy=obj.copy(); copy.data=obj.data
    bpy.context.scene.collection.objects.link(copy); copy.location=(0,0,0)
    copy.hide_set(False); copy.select_set(True); bpy.context.view_layer.objects.active=copy
    # GLB was verified from the exporter dynamic enum during the initial export.
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_yup=True)
    bpy.data.objects.remove(copy,do_unlink=True)
    report[name]['dimensions']=list(obj.dimensions)
    report[name]['bytes']=path.stat().st_size
    bm=bmesh.new();bm.from_mesh(obj.data)
    report[name]['signed_volume']=bm.calc_volume(signed=True)
    assert all(e.is_manifold and e.is_contiguous for e in bm.edges)
    bm.free()
(OUT/'mesh-audit.json').write_text(json.dumps(report,indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'jelly-oasis-ruin-root-detail-v1.blend'))
print('Refined candidate coursing; original modules and GLBs untouched')
