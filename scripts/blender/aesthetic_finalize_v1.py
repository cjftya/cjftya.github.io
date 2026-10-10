"""Discard unconvincing ruin edits, restoring the exact baseline in the candidate."""
import bpy, json
from pathlib import Path
ROOT=Path(r'C:/Users/cjfty/Documents/dev/cjftya.github.io')
OUT=ROOT/'artifacts/jelly-oasis/aesthetic-improvement-v1'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'jelly-oasis-aesthetic-refined-v1.blend'))
bpy.context.preferences.filepaths.save_version=0
wall=bpy.data.objects['Ruin_Wall_A_Detail_v1']
with bpy.data.libraries.load(str(OUT/'baseline-source.blend'),link=False) as (available,loaded):
    loaded.objects=['Ruin_Wall_A_Detail_v1']
reference=loaded.objects[0];wall.data=reference.data
bpy.data.objects.remove(reference,do_unlink=True)
visibility=json.loads((ROOT/'artifacts/jelly-oasis/modeling-review-before-crystal-v1/blender-scene-audit.json').read_text())
bpy.context.view_layer.update()
for item in visibility['objects']:
    o=bpy.data.objects.get(item['name'])
    if o and o.name in bpy.context.view_layer.objects:
        o.hide_set(item['hidden']);o.hide_render=item['hidden']
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'jelly-oasis-aesthetic-refined-v1.blend'))
print('RUIN_DISCARDED; exact wall geometry restored in candidate')
