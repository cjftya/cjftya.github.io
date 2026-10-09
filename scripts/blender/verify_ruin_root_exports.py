"""Read-only GLB round-trip validation against the saved authored scene.

May run in a separate background Blender if the interactive MCP stops responding.
Does not replace the live scene or any GLB.
"""
import bpy, json, bmesh
from pathlib import Path
ROOT=Path(r'C:\Users\cjfty\Documents\dev\cjftya.github.io')
OUT=ROOT/'artifacts/jelly-oasis/ruin-root-night-v1'
report=json.loads((OUT/'mesh-audit.json').read_text())
for name,entry in report.items():
    if name=='notes': continue
    source=bpy.data.objects[name+'_Detail_v1']
    source.data.calc_loop_triangles()
    bm=bmesh.new();bm.from_mesh(source.data)
    assert all(e.is_manifold and e.is_contiguous for e in bm.edges)
    assert all(v.link_edges for v in bm.verts)
    bm.free()
    before=set(bpy.data.objects)
    path=ROOT/'public/assets/jelly-oasis/landmarks/overgrown-ruin'/f'{name}_Detail_v1.glb'
    bpy.ops.import_scene.gltf(filepath=str(path))
    bpy.context.view_layer.update()
    imported=set(bpy.data.objects)-before
    meshes=[o for o in imported if o.type=='MESH']
    assert len(meshes)==1
    obj=meshes[0];obj.data.calc_loop_triangles()
    triangles=len(obj.data.loop_triangles)
    assert triangles==len(source.data.loop_triangles)
    assert all(abs(a-b)<1e-4 for a,b in zip(obj.dimensions,source.dimensions))
    entry.update(reimport_triangles=triangles,reimport_dimensions=list(obj.dimensions),
        dimensions=list(source.dimensions),bytes=path.stat().st_size)
    print(name,triangles,list(obj.dimensions),flush=True)
    for obj in imported: bpy.data.objects.remove(obj,do_unlink=True)
report['verification']='Final GLBs reimported in separate background Blender 5.2.2; live MCP timed out during its redundant final audit.'
(OUT/'mesh-audit-final.json').write_text(json.dumps(report,indent=2))
print('FINAL ROUND-TRIP PASSED',flush=True)
