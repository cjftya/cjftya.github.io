"""Fixed-camera pairs with the actual broken-wall runtime offset applied temporarily."""
import bpy
from pathlib import Path
from mathutils import Vector
scene=bpy.context.scene
out=Path(bpy.data.filepath).parent
names=['Ruin_Arch_A','Ruin_Wall_A','Ruin_BrokenWall_A','Root_Large_A','Root_Tree_Base_Blockout']
saved=(scene.render.engine,scene.camera,scene.render.resolution_x,scene.render.resolution_y,scene.render.filepath)
camera=bpy.data.objects.new('CAM_RuinRoot_Review',bpy.data.cameras.new('RuinRootReview'))
scene.collection.objects.link(camera); camera.data.lens=42
views={
 'arch-front':((15,-19,6),(15,6,4)),
 'arch-left':((-3,-13,10),(16,6,4)),
 'arch-right':((38,-13,11),(18,6,4)),
 'arch-ground':((15,-6,1.8),(15,7,4.4)),
 'root-front':((-13,-17,8),(-13,4,3)),
 'root-left':((-30,-8,10),(-13,6,3)),
 'root-right':((0,-9,9),(-13,6,3)),
 'root-ground':((-18,-9,1.8),(-13,4,3)),
 'overview':((66,-92,69),(0,2,9)),
}
offset=Vector((4,-11,0))
try:
    try: scene.render.engine='BLENDER_WORKBENCH'
    except TypeError as e: print(e); raise
    scene.render.resolution_x=1000; scene.render.resolution_y=800
    scene.camera=camera
    for name in ['Ruin_BrokenWall_A','Ruin_BrokenWall_A_Detail_v1']: bpy.data.objects[name].location+=offset
    for view,(pos,target) in views.items():
        camera.location=pos
        camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler()
        for variant in ['before','after']:
            for name in names:
                bpy.data.objects[name].hide_render=variant!='before'
                bpy.data.objects[name+'_Detail_v1'].hide_render=variant!='after'
            scene.render.filepath=str(out/f'blender-{variant}-{view}.png')
            bpy.ops.render.render(write_still=True)
finally:
    for name in ['Ruin_BrokenWall_A','Ruin_BrokenWall_A_Detail_v1']: bpy.data.objects[name].location-=offset
    for name in names:
        bpy.data.objects[name].hide_render=True
        bpy.data.objects[name+'_Detail_v1'].hide_render=False
    scene.render.engine,scene.camera,scene.render.resolution_x,scene.render.resolution_y,scene.render.filepath=saved
    bpy.data.objects.remove(camera,do_unlink=True)
print('Saved 18 fixed-camera before/after renders',out)
