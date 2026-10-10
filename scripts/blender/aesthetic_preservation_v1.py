"""Verify final source changes are confined to the intended three meshes."""
import bpy,json,hashlib
from pathlib import Path
ROOT=Path(r'C:/Users/cjfty/Documents/dev/cjftya.github.io')
OUT=ROOT/'artifacts/jelly-oasis/aesthetic-improvement-v1'
def audit(path):
    bpy.ops.wm.open_mainfile(filepath=str(path))
    return {o.name:{'geometry':hashlib.sha256(repr(([tuple(v.co) for v in o.data.vertices],[(tuple(p.vertices),p.use_smooth,p.material_index) for p in o.data.polygons])).encode()).hexdigest(),
                    'location':list(o.location),'scale':list(o.scale),'parent':o.parent.name if o.parent else None}
            for o in bpy.context.scene.objects if o.type=='MESH'}
before=audit(OUT/'baseline-source.blend');after=audit(OUT/'jelly-oasis-aesthetic-refined-v1.blend')
changed=[n for n in before if before[n]!=after.get(n)]
assert set(before)==set(after)
assert set(changed)=={'Trunk_and_Branches','Shore_Base_Bank_Upper_v2','Cliff_Waterfall_A_Detail_v1'}
for n in before:
    for k in ['location','scale','parent']:assert before[n][k]==after[n][k]
sources=json.loads((OUT/'source-audit.json').read_text())
paths={'verified':ROOT/'artifacts/jelly-oasis/crystal-accent-detail-v1/verified/jelly-oasis-crystal-accent-detail-v1.blend',
       'pond-v2':ROOT/'artifacts/jelly-oasis/pond-edge-detail-v2/jelly-oasis-pond-edge-detail-v2.blend'}
for label,path in paths.items():assert hashlib.sha256(path.read_bytes()).hexdigest()==sources[label]['sha256']
report={'changed_meshes':changed,'scene_count':len(bpy.data.scenes),'source_hashes_preserved':True,'all_other_meshes_preserved':True,'all_local_transforms_preserved':True}
(OUT/'preservation-audit.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report))
