"""Temporary material preview of the saved candidates; never save scene changes."""
import bpy
import ast
import re
from pathlib import Path
from mathutils import Vector

OUT=Path(r'C:/Users/cjfty/Documents/dev/cjftya.github.io/artifacts/jelly-oasis/crystal-accent-detail-v1')
scene=bpy.context.scene
names=['Crystal_Blockout_'+label+'_Detail_v1' for label in 'ABC']
for ob in scene.objects:
    if ob.type=='MESH':
        ob.hide_render=ob.name not in names
for i,name in enumerate(names):
    ob=bpy.data.objects[name]
    ob.location=((i-1)*4,0,0)
    ob.hide_render=False
    ob.hide_set(False)
camera=scene.camera
camera.location=(7,-14,7)
camera.rotation_euler=(Vector((0,0,1.7))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type=next(e.identifier for e in bpy.types.Camera.bl_rna.properties['type'].enum_items if e.identifier=='ORTHO')
camera.data.ortho_scale=12
engines=[e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
if not any('WORKBENCH' in e for e in engines):
    try:
        scene.render.engine='__QUERY_SUPPORTED_VALUES__'
    except TypeError as error:
        engines=ast.literal_eval(re.search(r'not found in (.*)',str(error)).group(1))
scene.render.engine=next(e for e in engines if 'WORKBENCH' in e)
scene.display.shading.light=next(e.identifier for e in scene.display.shading.bl_rna.properties['light'].enum_items if e.identifier=='STUDIO')
scene.display.shading.color_type=next(e.identifier for e in scene.display.shading.bl_rna.properties['color_type'].enum_items if e.identifier=='MATERIAL')
scene.render.resolution_x=1200
scene.render.resolution_y=600
scene.render.resolution_percentage=100
scene.render.image_settings.file_format=next(e.identifier for e in bpy.types.ImageFormatSettings.bl_rna.properties['file_format'].enum_items if e.identifier=='PNG')
scene.render.filepath=str(OUT/'blender-candidates.png')
bpy.ops.render.render(write_still=True)
print('Preview saved, candidate blend unchanged. Workbench material colors; emission assessed in Three.js.')
