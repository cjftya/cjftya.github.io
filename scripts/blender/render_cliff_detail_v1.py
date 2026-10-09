"""Render fixed-camera geometry review pairs from the saved detail scene."""
import bpy
from pathlib import Path
from mathutils import Vector

scene=bpy.context.scene
out=Path(bpy.data.filepath).parent
original=bpy.data.objects['Cliff_Waterfall_A']
detail=bpy.data.objects['Cliff_Waterfall_A_Detail_v1']
saved=(scene.render.engine,scene.camera,scene.render.resolution_x,scene.render.resolution_y,scene.render.resolution_percentage,scene.render.filepath,scene.render.image_settings.file_format)
camera=bpy.data.objects.get('CAM_Cliff_Detail_Review')
if not camera:
    camera=bpy.data.objects.new('CAM_Cliff_Detail_Review',bpy.data.cameras.new('CliffReview'))
    scene.collection.objects.link(camera)
camera.data.lens=48
center=detail.location+Vector((0,0,8.5))
views={'front':((0,-48,8),(0,0,0)),
       'left':((-34,-42,23),(0,0,0)),
       'right':((34,-42,23),(0,0,0)),
       'approach':((0,-29,-5),(0,0,-1)),
       'shelf':((2,-12,42),(0,0,3))}
try:
    scene.render.engine='BLENDER_WORKBENCH'
    scene.render.resolution_x=1100;scene.render.resolution_y=900
    scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG'
    for name,(offset,aim) in views.items():
        camera.location=center+Vector(offset)
        camera.rotation_euler=(center+Vector(aim)-camera.location).to_track_quat('-Z','Y').to_euler()
        scene.camera=camera
        for variant in (['before','after'] if name in ['front','approach'] else ['after']):
            original.hide_render=variant!='before';detail.hide_render=variant=='before'
            scene.render.filepath=str(out/f'blender-{variant}-{name}.png')
            bpy.ops.render.render(write_still=True)
    original.hide_render=True;detail.hide_render=False
    scene.camera=bpy.data.objects['CAM_Landmark_Overview']
    scene.render.filepath=str(out/'blender-after-overview.png')
    bpy.ops.render.render(write_still=True)
finally:
    original.hide_render=True;detail.hide_render=False
    scene.render.engine,scene.camera,scene.render.resolution_x,scene.render.resolution_y,scene.render.resolution_percentage,scene.render.filepath,scene.render.image_settings.file_format=saved
print('Saved 8 Blender review images to',out)
