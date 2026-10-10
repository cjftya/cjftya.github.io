"""Fuse closed branch sweeps while retaining the original foot exactly."""
import bpy, bmesh
ob=bpy.data.objects['Trunk_and_Branches']
bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active=ob
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.separate(type='LOOSE'); bpy.ops.object.mode_set(mode='OBJECT')
objects=list(bpy.context.selected_objects)
base=min(objects,key=lambda o:min(v.co.z for v in o.data.vertices))
for other in objects:
    if other==base: continue
    bpy.context.view_layer.objects.active=base
    mod=base.modifiers.new('Natural fork union','BOOLEAN')
    supported=[i.identifier for i in mod.bl_rna.properties['operation'].enum_items]
    mod.operation=next(v for v in supported if v=='UNION')
    mod.object=other
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(other,do_unlink=True)
base.name='Trunk_and_Branches'
# Very light local relaxation softens fork intersections, with the foundation protected.
group=base.vertex_groups.new(name='Fork smoothing')
for v in base.data.vertices:
    if v.co.z>3: group.add([v.index],.45,'REPLACE')
mod=base.modifiers.new('Soften forks','SMOOTH'); mod.factor=.5; mod.iterations=3; mod.vertex_group=group.name
bpy.ops.object.modifier_apply(modifier=mod.name)
# Boolean junction n-gons can tessellate to paired internal triangles.
import collections
ob=bpy.data.objects['Trunk_and_Branches']; bm=bmesh.new(); bm.from_mesh(ob.data)
bmesh.ops.triangulate(bm,faces=list(bm.faces)); bm.verts.index_update()
groups=collections.defaultdict(list)
for f in bm.faces: groups[tuple(sorted(v.index for v in f.verts))].append(f)
paired=[f for faces in groups.values() if len(faces)>1 for f in faces]
bmesh.ops.delete(bm,geom=paired,context='FACES_ONLY')
bmesh.ops.delete(bm,geom=[e for e in bm.edges if not e.link_faces],context='EDGES')
bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_edges],context='VERTS')
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
assert all(e.is_manifold for e in bm.edges)
assert all(f.calc_area()>1e-9 for f in bm.faces)
bm.to_mesh(ob.data); bm.free()
ob.data.calc_loop_triangles(); print('Clean woody triangles',len(ob.data.loop_triangles))

base.data.calc_loop_triangles(); print('Fused woody triangles',len(base.data.loop_triangles))
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
