"""Read only source collections into an independent document; never open bloated scenes."""
import bpy, json, hashlib
from pathlib import Path
ROOT = Path(r'C:/Users/cjfty/Documents/dev/cjftya.github.io')
OUT = ROOT / 'artifacts/jelly-oasis/aesthetic-improvement-v1'
OUT.mkdir(parents=True, exist_ok=True)
sources = {
    'verified': ROOT/'artifacts/jelly-oasis/crystal-accent-detail-v1/verified/jelly-oasis-crystal-accent-detail-v1.blend',
    'pond-v2': ROOT/'artifacts/jelly-oasis/pond-edge-detail-v2/jelly-oasis-pond-edge-detail-v2.blend',
}
report = {}
for label, source in sources.items():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.preferences.filepaths.save_version=0
    with bpy.data.libraries.load(str(source), link=False) as (available, loaded):
        loaded.collections = [n for n in available.collections if not n.startswith(('Scene', 'JellyOasis_OvergrownRuin_v1.'))]
    nested = {child.name for col in loaded.collections for child in col.children}
    for col in loaded.collections:
        if col.name not in nested:
            bpy.context.scene.collection.children.link(col)
    bpy.context.view_layer.update()
    objects = {}
    for o in bpy.context.scene.objects:
        if o.type != 'MESH': continue
        o.data.calc_loop_triangles()
        objects[o.name] = {
            'triangles':len(o.data.loop_triangles),
            'smooth_faces':sum(p.use_smooth for p in o.data.polygons),
            'materials':[m.name for m in o.data.materials],
            'location':list(o.location), 'scale':list(o.scale),
            'parent':o.parent.name if o.parent else None,
            'geometry_sha256':hashlib.sha256(repr(([tuple(v.co) for v in o.data.vertices],[tuple(p.vertices) for p in o.data.polygons])).encode()).hexdigest(),
        }
    report[label] = {'sha256':hashlib.sha256(source.read_bytes()).hexdigest(), 'objects':objects,
                     'collections':[c.name for c in bpy.data.collections]}
    if label == 'verified':
        bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'baseline-source.blend'))
report['differences'] = [n for n in sorted(set(report['verified']['objects']) | set(report['pond-v2']['objects'])) if report['verified']['objects'].get(n) != report['pond-v2']['objects'].get(n)]
report['missing_verified_collections'] = sorted(set(report['pond-v2']['collections']) - set(report['verified']['collections']))
bpy.ops.wm.open_mainfile(filepath=str(OUT/'baseline-source.blend'))
with bpy.data.libraries.load(str(sources['pond-v2']), link=False) as (available, loaded):
    loaded.collections = ['Tree_Detail_v1', 'PondEdge_Detail_v2']
for col in loaded.collections:
    bpy.context.scene.collection.children.link(col)
bpy.context.view_layer.update()
visibility = json.loads((ROOT/'artifacts/jelly-oasis/modeling-review-before-crystal-v1/blender-scene-audit.json').read_text())
for item in visibility['objects']:
    o = bpy.data.objects.get(item['name'])
    if o and o.name in bpy.context.view_layer.objects:
        o.hide_set(item['hidden'])
        o.hide_render = item['hidden']
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'baseline-source.blend'))
(OUT/'source-audit.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('SOURCE_AUDIT', report['differences'])
