"""Build three local-origin flat-shaded candidates, preserving original feet."""
import ast
import hashlib
import json
import math
import re
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix

ROOT = Path(r'C:/Users/cjfty/Documents/dev/cjftya.github.io')
OUT = ROOT / 'artifacts/jelly-oasis/crystal-accent-detail-v1'
PUBLIC_ASSETS = ROOT / 'public/assets/jelly-oasis/landmarks/overgrown-ruin'
ASSETS = OUT / 'verified-assets'
SOURCE = ROOT / 'artifacts/jelly-oasis/pond-edge-detail-v2/jelly-oasis-pond-edge-detail-v2.blend'
CANDIDATE = OUT / 'verified/jelly-oasis-crystal-accent-detail-v1.blend'
OUT.mkdir(parents=True, exist_ok=True)
ASSETS.mkdir(parents=True, exist_ok=True)
CANDIDATE.parent.mkdir(parents=True, exist_ok=True)
collections_only = bpy.app.background and not bpy.data.filepath
if collections_only:
    # Append the actual collection hierarchy without instantiating thousands of
    # unused source scenes. This is an independent new document, not a source edit.
    bpy.ops.wm.read_factory_settings(use_empty=True)
    with bpy.data.libraries.load(str(SOURCE), link=False) as (data_from, data_to):
        data_to.collections = (['JellyOasis_Landmark_v1'] if 'JellyOasis_Landmark_v1' in data_from.collections
                               else list(data_from.collections))
        data_to.worlds = [n for n in data_from.worlds if n == 'JO_Review_World']
    child_names = {child.name for col in data_to.collections for child in col.children}
    for col in data_to.collections:
        if col.name not in child_names:
            bpy.context.scene.collection.children.link(col)
    bpy.context.scene.name = 'JellyOasis_OvergrownRuin_v1'
    # Object hide_set is a view-layer flag and does not travel with appended collections.
    reviewed = json.loads((ROOT/'artifacts/jelly-oasis/modeling-review-before-crystal-v1/blender-scene-audit.json').read_text())
    bpy.context.view_layer.update()
    for entry in reviewed['objects']:
        obj = bpy.data.objects.get(entry['name'])
        if obj and obj.name in bpy.context.view_layer.objects:
            obj.hide_set(entry['hidden'])
            obj.hide_render = entry['hidden']
    if data_to.worlds:
        bpy.context.scene.world = data_to.worlds[0]
    bpy.context.scene.camera = bpy.data.objects.get('CAM_Landmark_Overview')
    bpy.ops.wm.save_as_mainfile(filepath=str(CANDIDATE))
assert Path(bpy.data.filepath).resolve() in [SOURCE.resolve(), CANDIDATE.resolve()]
if Path(bpy.data.filepath).resolve() == SOURCE.resolve():
    assert bpy.app.background or not bpy.data.is_dirty, 'Preserve unsaved user changes before rerunning'
    bpy.ops.wm.save_as_mainfile(filepath=str(CANDIDATE))

# Prior roundtrips accumulated thousands of empty scenes. Clean only the new
# candidate document and export the active scene, never the preserved source.
scene_count_before = len(bpy.data.scenes)
active_scene = bpy.context.scene
empty_scenes = [s for s in bpy.data.scenes if s != active_scene and len(s.objects) == 0]
bpy.data.batch_remove(ids=empty_scenes)

def signature(o):
    return hashlib.sha256(json.dumps({
        'vertices': [list(v.co) for v in o.data.vertices],
        'faces': [list(p.vertices) for p in o.data.polygons],
        'matrix': [list(row) for row in o.matrix_world],
    }, sort_keys=True).encode()).hexdigest()

other_before = {o.name: signature(o) for o in bpy.data.objects
                if o.type == 'MESH' and not o.name.startswith('Crystal_')}
asset_before = {p.name: hashlib.sha256(p.read_bytes()).hexdigest()
                for p in PUBLIC_ASSETS.iterdir() if p.suffix in ['.glb', '.json']
                and not (p.name.startswith('Crystal_Blockout_') and '_Detail_v1' in p.name)}
original_hash = hashlib.sha256(SOURCE.read_bytes()).hexdigest()

def material(name, rgb, emission=0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    m.diffuse_color = (*rgb, 1)
    p = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value = (*rgb, 1)
    p.inputs['Roughness'].default_value = .61
    p.inputs['Metallic'].default_value = .04
    p.inputs['Alpha'].default_value = 1
    p.inputs['Emission Color'].default_value = (.10, .15, .42, 1)
    p.inputs['Emission Strength'].default_value = emission
    return m

mats = [material('JO_Crystal_DeepIndigo', (.085, .055, .18)),
        material('JO_Crystal_BlueViolet', (.18, .105, .34)),
        material('JO_Crystal_CoolFacet', (.16, .24, .38)),
        material('JO_Crystal_QuietGlint', (.26, .31, .46), .18)]
# Main/satellite heights and differing growth vectors in Blender local XY.
specs = {
    'A': [(3.25, (.24, -.13), .92), (1.78, (.18, .03), .78), (1.16, (-.12, .06), .83)],
    'B': [(3.45, (-.22, .12), .84), (1.32, (.16, -.07), .87), (2.04, (-.14, .08), .77)],
    'C': [(3.10, (.16, .17), .90), (2.44, (.02, -.10), .76), (1.00, (-.15, -.03), .91)],
}
report = {'source': str(SOURCE), 'source_sha256': original_hash, 'modules': {},
          'scene_count_before': scene_count_before, 'scene_count_after': len(bpy.data.scenes),
          'source_collections_appended_without_empty_scenes': collections_only}
for label, shards in specs.items():
    source = bpy.data.objects['Crystal_Blockout_' + label]
    name = source.name + '_Detail_v1'
    previous = bpy.data.objects.get(name)
    if previous:
        bpy.data.objects.remove(previous, do_unlink=True)
    verts, faces, face_mats = [], [], []
    for j, (height, tilt, taper) in enumerate(shards):
        # Original closed bottom polygons, not arbitrary replacement offsets.
        cap = source.data.polygons[j * 13]
        feet = [source.data.vertices[i].co.copy() for i in reversed(cap.vertices)]
        center = sum(feet, feet[0] * 0) / 6
        start = len(verts)
        verts.extend(tuple(v) for v in feet)
        for ring, z in enumerate([.48, height * .70]):
            for i, foot in enumerate(feet):
                factor = (1.00 if ring == 0 else taper) * (1 + .095 * math.sin(i * 2.1 + j + ord(label)))
                fraction = z / height
                # Unequal cross sections and oblique shoulder planes break the hex-pillar repetition.
                verts.append((center.x + (foot.x-center.x) * factor + tilt[0]*fraction,
                              center.y + (foot.y-center.y) * factor + tilt[1]*fraction,
                              z + (0 if ring == 0 else .10 * math.sin(i * 1.7 + j))))
        apex = len(verts)
        verts.append((center.x + tilt[0] * 1.65, center.y + tilt[1] * 1.65, height))
        faces.append(tuple(start + i for i in reversed(range(6))))
        face_mats.append(0)
        for ring in range(2):
            for i in range(6):
                a, b = start+ring*6+i, start+ring*6+(i+1)%6
                d, c = a+6, b+6
                faces.extend([(a,b,c),(a,c,d)])
                index = 0 if i in [2,3] else 2 if (i+j+ord(label))%4 == 0 else 1
                face_mats.extend([index,index])
        for i in range(6):
            faces.append((start+12+i,start+12+(i+1)%6,apex))
            face_mats.append(3 if i == (j+ord(label))%6 else (2 if i%3 == 0 else 1))
    mesh = bpy.data.meshes.new(name+'_Mesh')
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    ob = bpy.data.objects.new(name, mesh)
    source.users_collection[0].objects.link(ob)
    ob.matrix_world = source.matrix_world.copy()
    for m in mats:
        mesh.materials.append(m)
    for p, index in zip(mesh.polygons, face_mats):
        p.use_smooth = False
        p.material_index = index
    source.hide_set(True)
    source.hide_render = True
    ob['source_module'] = source.name
    ob['stage_note'] = 'Flat irregular opaque crystal; original 18 support vertices preserved'
    mesh.calc_loop_triangles()
    bm = bmesh.new()
    bm.from_mesh(mesh)
    health = {'nonmanifold_edges': sum(not e.is_manifold for e in bm.edges),
              'inconsistent_winding': sum(e.is_manifold and not e.is_contiguous for e in bm.edges),
              'loose_vertices': sum(not v.link_edges for v in bm.verts),
              'zero_area_faces': sum(f.calc_area() < 1e-9 for f in bm.faces),
              'signed_volume': bm.calc_volume(signed=True)}
    bm.free()
    assert all(health[k] == 0 for k in ['nonmanifold_edges','inconsistent_winding','loose_vertices','zero_area_faces'])
    assert health['signed_volume'] > 0
    points = [v.co for v in mesh.vertices]
    bounds = [[min(v[a] for v in points) for a in range(3)], [max(v[a] for v in points) for a in range(3)]]
    old_support = {tuple(round(c,6) for c in v.co) for v in source.data.vertices if v.co.z <= .35}
    new_support = {tuple(round(c,6) for c in v.co) for v in mesh.vertices if v.co.z <= .35}
    assert new_support == old_support
    entry = {'source_anchor_blender': list(source.location), 'triangles': len(mesh.loop_triangles),
             'height': bounds[1][2], 'bounds_blender': bounds, 'shards':len(shards),
             'support_preserved':True, 'support_count':len(new_support), 'health':health,
             'flat_faces':sum(not p.use_smooth for p in mesh.polygons)}
    # Export a temporary identity-transform copy, leaving the preview anchor intact.
    for selected in list(bpy.context.selected_objects):
        selected.select_set(False)
    copy = ob.copy()
    bpy.context.scene.collection.objects.link(copy)
    copy.matrix_world = Matrix.Identity(4)
    copy.hide_set(False)
    copy.select_set(True)
    bpy.context.view_layer.objects.active = copy
    formats = [i.identifier for i in bpy.ops.export_scene.gltf.get_rna_type().properties['export_format'].enum_items]
    if not formats:
        try:
            bpy.ops.export_scene.gltf(export_format='__QUERY_SUPPORTED_VALUES__')
        except TypeError as e:
            formats = ast.literal_eval(re.search(r'not found in (.*)', str(e)).group(1))
    path = ASSETS / (name+'.glb')
    bpy.ops.export_scene.gltf(filepath=str(path), export_format=next(v for v in formats if v=='GLB'),
                            use_selection=True, use_active_scene=True, export_yup=True,
                            export_animations=False, export_extras=False)
    bpy.data.objects.remove(copy, do_unlink=True)
    before = set(bpy.data.objects)
    before_meshes, before_materials = set(bpy.data.meshes), set(bpy.data.materials)
    bpy.ops.import_scene.gltf(filepath=str(path))
    bpy.context.view_layer.update()
    imported = set(bpy.data.objects)-before
    tris, points = 0, []
    for item in imported:
        if item.type != 'MESH':
            continue
        item.data.calc_loop_triangles()
        tris += len(item.data.loop_triangles)
        points.extend(item.matrix_world @ v.co for v in item.data.vertices)
    re_bounds = [[min(v[a] for v in points) for a in range(3)], [max(v[a] for v in points) for a in range(3)]]
    assert tris == entry['triangles']
    assert all(abs(bounds[end][a]-re_bounds[end][a])<1e-4 for end in range(2) for a in range(3))
    entry.update(reimport_triangles=tris, reimport_bounds_blender=re_bounds, bytes=path.stat().st_size)
    for item in imported:
        bpy.data.objects.remove(item, do_unlink=True)
    for mesh_copy in set(bpy.data.meshes)-before_meshes:
        if mesh_copy.users == 0:
            bpy.data.meshes.remove(mesh_copy)
    for mat_copy in set(bpy.data.materials)-before_materials:
        if mat_copy.users == 0:
            bpy.data.materials.remove(mat_copy)
    report['modules'][source.name] = entry

assert other_before == {name:signature(bpy.data.objects[name]) for name in other_before}
assert original_hash == hashlib.sha256(SOURCE.read_bytes()).hexdigest()
assert all(hashlib.sha256((PUBLIC_ASSETS/name).read_bytes()).hexdigest()==sha for name,sha in asset_before.items())
report['other_models_preserved'] = report['source_file_preserved'] = report['existing_assets_preserved'] = True
(OUT/'mesh-audit.json').write_text(json.dumps(report,indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(CANDIDATE))
print(json.dumps({'saved':str(CANDIDATE),'triangles':{n:e['triangles'] for n,e in report['modules'].items()},'checks':'passed'}))
