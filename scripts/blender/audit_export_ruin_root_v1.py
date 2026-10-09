"""Final candidate export/reimport audit; never touches original assets."""
import bpy, bmesh, json
from pathlib import Path
from mathutils import Matrix
ROOT=Path(r'C:\Users\cjfty\Documents\dev\cjftya.github.io')
OUT=ROOT/'artifacts/jelly-oasis/ruin-root-night-v1'
report=json.loads((OUT/'mesh-audit.json').read_text())
for source_name,entry in report.items():
    if source_name=='notes': continue
    name=source_name+'_Detail_v1'
    obj=bpy.data.objects[name]
    for selected in list(bpy.context.selected_objects): selected.select_set(False)
    obj.name=name+'_Preview'
    copy=obj.copy();copy.name=name
    bpy.context.scene.collection.objects.link(copy)
    copy.matrix_world=Matrix.Identity(4);copy.hide_set(False);copy.select_set(True)
    bpy.context.view_layer.objects.active=copy
    path=ROOT/'public/assets/jelly-oasis/landmarks/overgrown-ruin'/f'{name}.glb'
    # GLB enum was read from this connected Blender's dynamic exporter.
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_yup=True)
    bpy.data.objects.remove(copy,do_unlink=True); obj.name=name
    mesh=obj.data;mesh.calc_loop_triangles()
    bm=bmesh.new();bm.from_mesh(mesh)
    entry.update(triangles=len(mesh.loop_triangles),dimensions=list(obj.dimensions),bytes=path.stat().st_size,
        nonmanifold_edges=sum(not e.is_manifold for e in bm.edges),
        inconsistent_winding=sum(e.is_manifold and not e.is_contiguous for e in bm.edges),
        loose_vertices=sum(not v.link_edges for v in bm.verts),
        zero_area_faces=sum(f.calc_area()<1e-9 for f in bm.faces),
        duplicates=len(mesh.vertices)-len({tuple(round(c,6) for c in v.co) for v in mesh.vertices}),
        signed_volume=bm.calc_volume(signed=True))
    bm.free()
    assert entry['nonmanifold_edges']==entry['inconsistent_winding']==entry['loose_vertices']==entry['zero_area_faces']==0
    before=set(bpy.data.objects); meshes=set(bpy.data.meshes); mats=set(bpy.data.materials)
    bpy.ops.import_scene.gltf(filepath=str(path)); bpy.context.view_layer.update()
    imported=set(bpy.data.objects)-before
    tris=0;dimensions=[]
    for item in imported:
        if item.type=='MESH':
            item.data.calc_loop_triangles(); tris+=len(item.data.loop_triangles);dimensions=list(item.dimensions)
    entry['reimport_triangles']=tris;entry['reimport_dimensions']=dimensions
    assert tris==entry['triangles']
    assert all(abs(a-b)<.0001 for a,b in zip(dimensions,entry['dimensions']))
    for item in imported: bpy.data.objects.remove(item,do_unlink=True)
    for item in set(bpy.data.meshes)-meshes:
        if item.users==0: bpy.data.meshes.remove(item)
    for item in set(bpy.data.materials)-mats:
        if item.users==0: bpy.data.materials.remove(item)
(OUT/'mesh-audit.json').write_text(json.dumps(report,indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'jelly-oasis-ruin-root-detail-v1.blend'))
print('All five final exports passed topology, dimensions and triangle reimport checks.')
