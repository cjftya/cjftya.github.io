import bpy,bmesh
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
