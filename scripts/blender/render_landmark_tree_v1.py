"""Fixed-camera pairs with the actual broken-wall runtime offset applied temporarily."""
import bpy
from pathlib import Path
from mathutils import Vector
scene=bpy.context.scene
out=Path(bpy.data.filepath).parent
names=['Tree_Landmark_Blockout']
def detail(name): return bpy.data.objects['Tree_Landmark_Detail_v1']
def visibility(variant):
    bpy.data.objects['Tree_Landmark_Blockout'].hide_render=variant!='before'
    for ob in detail('').children: ob.hide_render=variant!='after'
saved=(scene.render.engine,scene.camera,scene.render.resolution_x,scene.render.resolution_y,scene.render.filepath)
camera=bpy.data.objects.new('CAM_RuinRoot_Review',bpy.data.cameras.new('RuinRootReview'))
scene.collection.objects.link(camera); camera.data.lens=42
views={
 'tree-front':((-12,-28,14),(-12,18,14)),
 'tree-left':((-48,-9,17),(-12,18,15)),
 'tree-right':((23,2,20),(-12,18,15)),
 'tree-ground':((-12,-5,1.8),(-12,18,13)),
 'tree-under':((-12,12,2),(-12,18,24)),
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
            visibility(variant)
            scene.render.filepath=str(out/f'blender-{variant}-{view}.png')
            bpy.ops.render.render(write_still=True)
finally:
    for name in ['Ruin_BrokenWall_A','Ruin_BrokenWall_A_Detail_v1']: bpy.data.objects[name].location-=offset
    visibility('after')
    scene.render.engine,scene.camera,scene.render.resolution_x,scene.render.resolution_y,scene.render.filepath=saved
    bpy.data.objects.remove(camera,do_unlink=True)
print('Saved 12 tree fixed-camera renders',out)
