"""Render final isolated tree and branch structure in a temporary background scene."""
import bpy
from pathlib import Path
from mathutils import Vector
root=Path(r'C:/Users/cjfty/Documents/dev/cjftya.github.io')
source=root/'artifacts/jelly-oasis/landmark-tree-detail-v1/jelly-oasis-landmark-tree-detail-v1.blend'
with bpy.data.libraries.load(str(source),link=False) as (available,requested):
 assert 'Tree_Detail_v1' in available.collections
 requested.collections=['Tree_Detail_v1']
scene=bpy.data.scenes.new('Tree isolated review');scene.collection.children.link(requested.collections[0])
try:scene.render.engine='BLENDER_WORKBENCH'
except TypeError as e:raise
samples=[i.identifier for i in scene.display.bl_rna.properties['render_aa'].enum_items]
if '8' in samples:scene.display.render_aa='8'
bpy.context.window.scene=scene
camera=bpy.data.objects.new('CAM_Tree_Isolated',bpy.data.cameras.new('Tree_Isolated'));scene.collection.objects.link(camera)
camera.location=(-12,-32,14);camera.rotation_euler=(Vector((-12,18,14))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=42
scene.camera=camera;scene.render.resolution_x=1000;scene.render.resolution_y=800;scene.render.resolution_percentage=100
for name in ['tree-isolated','tree-skeleton']:
 bpy.data.objects['Canopy_Clusters'].hide_render=name=='tree-skeleton'
 scene.render.filepath=str(root/'artifacts/jelly-oasis/landmark-tree-detail-v1'/('blender-after-'+name+'.png'));bpy.ops.render.render(write_still=True)
print('Final isolated tree renders complete')
