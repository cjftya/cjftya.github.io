"""Refine the live approved scene. Originals and original GLBs are immutable.

Run through Blender MCP; export candidates only, then review in the runtime.
"""
import bpy
import bmesh
import math
import json
from pathlib import Path
from mathutils import Vector, Matrix

ROOT = Path(r'C:\Users\cjfty\Documents\dev\cjftya.github.io')
OUT = ROOT / 'artifacts/jelly-oasis/ruin-root-night-v1'
OUT.mkdir(parents=True, exist_ok=True)
NAMES = ['Ruin_Arch_A', 'Ruin_Wall_A', 'Ruin_BrokenWall_A', 'Root_Large_A', 'Root_Tree_Base_Blockout']
assert all(n in bpy.data.objects for n in NAMES)
assert not any(n+'_Detail_v1' in bpy.data.objects for n in NAMES), 'Inspect existing detail rather than overwrite.'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'source-preserved.blend'), copy=True)

def enum(owner, prop, value):
    assert value in {i.identifier for i in owner.bl_rna.properties[prop].enum_items}
    setattr(owner, prop, value)

def activate(obj):
    for selected in list(bpy.context.selected_objects): selected.select_set(False)
    obj.hide_set(False)
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

def mesh_object(source, verts, faces):
    mesh=bpy.data.meshes.new(source.name+'_DetailMesh')
    mesh.from_pydata(verts, [], faces)
    bm=bmesh.new(); bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(mesh); bm.free()
    for mat in source.data.materials: mesh.materials.append(mat)
    obj=bpy.data.objects.new(source.name+'_Detail_v1', mesh)
    source.users_collection[0].objects.link(obj)
    obj.matrix_world=source.matrix_world.copy()
    return obj

def stones(source):
    # Preserve every ground foot and the arch intrados. Localized face cuts produce
    # chipped corners, while coherent per-stone shear avoids noisy tessellation.
    obj=source.copy(); obj.data=source.data.copy()
    obj.name=source.name+'_Detail_v1'; source.users_collection[0].objects.link(obj)
    bm=bmesh.new(); bm.from_mesh(obj.data)
    unseen=set(bm.verts); index=0
    while unseen:
        component={unseen.pop()}; todo=list(component)
        while todo:
            for edge in todo.pop().link_edges:
                for v in edge.verts:
                    if v in unseen: unseen.remove(v); component.add(v); todo.append(v)
        index+=1
        center=sum((v.co for v in component), Vector())/len(component)
        for v in component:
            if v.co.z < .24: continue
            if source.name=='Ruin_Arch_A':
                # Do not narrow the passage; crown damage stays outside the opening.
                v.co.y += .07*math.sin(index*2.3) + .035*(v.co.z-center.z)
                if v.co.z > 8.4 and v.co.x > .7:
                    v.co.z -= .2 + .19*math.sin(v.co.x*2)**2
            else:
                v.co.y += .09*math.sin(index*2.1) + .065*(v.co.x-center.x)
                if v.co.z > 4.6: v.co.z -= .12+.16*math.sin(v.co.x*1.8)**2
        # Clip one broad exposed upper corner per stone with a closed plane cut.
        faces={f for v in component for f in v.link_faces}
        corner=max(component, key=lambda v:v.co.z+.5*v.co.x-.4*v.co.y)
        if corner.co.z > .6:
            normal=Vector((.52,-.62,.59)).normalized()
            plane=corner.co-normal*(.13+.07*(index%3))
            edges={e for v in component for e in v.link_edges}
            cut=bmesh.ops.bisect_plane(bm, geom=list(component|edges|faces), dist=.00001,
                plane_co=plane, plane_no=normal, clear_outer=True, clear_inner=False)
            boundary=[e for e in cut['geom_cut'] if isinstance(e,bmesh.types.BMEdge) and e.is_boundary]
            if boundary: bmesh.ops.holes_fill(bm, edges=boundary, sides=0)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(obj.data); bm.free()
    return obj

def root(source, knots, sides=12, subdivisions=3):
    # Centripetal-looking Hermite sweep, oval buttress cross-section and taper.
    samples=[]
    for j in range(len(knots)-1):
        a=Vector(knots[j][:3]); b=Vector(knots[j+1][:3])
        prev=Vector(knots[max(0,j-1)][:3]); nex=Vector(knots[min(len(knots)-1,j+2)][:3])
        for k in range(subdivisions):
            t=k/subdivisions
            p=(2*t**3-3*t*t+1)*a+(t**3-2*t*t+t)*(b-prev)*.5+(-2*t**3+3*t*t)*b+(t**3-t*t)*(nex-a)*.5
            samples.append((p,knots[j][3]*(1-t)+knots[j+1][3]*t))
    samples.append((Vector(knots[-1][:3]),knots[-1][3]))
    verts=[]; faces=[]
    for j,(p,r) in enumerate(samples):
        tangent=(samples[min(j+1,len(samples)-1)][0]-samples[max(j-1,0)][0]).normalized()
        u=tangent.cross(Vector((0,0,1))).normalized(); v=tangent.cross(u).normalized()
        for i in range(sides):
            angle=2*math.pi*i/sides
            rib=1+.055*math.cos(3*angle+j*.18)
            co=p+r*rib*(math.cos(angle)*u+math.sin(angle)*v*.83)
            verts.append(tuple(co-source.location))
    for j in range(len(samples)-1):
        for i in range(sides):
            a=j*sides+i; b=j*sides+(i+1)%sides
            faces.append((a,b,b+sides,a+sides))
    faces.extend([tuple(reversed(range(sides))),tuple((len(samples)-1)*sides+i for i in range(sides))])
    return mesh_object(source,verts,faces)

details=[]
for name in NAMES[:3]: details.append(stones(bpy.data.objects[name]))
# Broad root hugs the rear wall, settles into a notch over the coping, flattens
# against the front face and disappears beneath the earth at its fine end.
details.append(root(bpy.data.objects['Root_Large_A'], [
    (-12,10,1.3,1.16),(-12.7,8.4,1.02,1.02),(-13.7,6.1,1.13,.91),
    (-14.7,4.3,2.6,.78),(-14.55,2.6,4.9,.65),(-14.2,1.85,5.25,.58),
    (-13.65,1.04,4.25,.51),(-13.35,.95,2.5,.42),(-12.6,.45,.65,.29),
    (-11.25,-.5,.13,.19),(-10.15,-1.7,-.15,.045)]))
details.append(root(bpy.data.objects['Root_Tree_Base_Blockout'],[
    (-12,18,1.12,1.36),(-12.8,16, .7,1.05),(-13.3,13.5,.55,.98),
    (-12.8,11.4,.82,1.05),(-12,10,1.3,1.16)],sides=10,subdivisions=3))

report={}
asset_dir=ROOT/'public/assets/jelly-oasis/landmarks/overgrown-ruin'
for source_name,obj in zip(NAMES,details):
    source=bpy.data.objects[source_name]
    obj['source']=source_name; obj['asset_stage']='detail_v1'
    source.hide_render=True; source.hide_set(True)
    obj.hide_render=False; obj.hide_set(False)
    bpy.context.view_layer.update()
    mesh=obj.data; mesh.calc_loop_triangles(); source.data.calc_loop_triangles()
    bm=bmesh.new(); bm.from_mesh(mesh)
    entry={'before_triangles':len(source.data.loop_triangles),'triangles':len(mesh.loop_triangles),
        'before_dimensions':list(source.dimensions),'dimensions':list(obj.dimensions),
        'origin':list(obj.location),'origin_delta':list(obj.location-source.location),'scale':list(obj.scale),
        'nonmanifold_edges':sum(not e.is_manifold for e in bm.edges),
        'loose_vertices':sum(not v.link_edges for v in bm.verts),
        'zero_area_faces':sum(f.calc_area()<1e-9 for f in bm.faces),
        'inconsistent_winding':sum(e.is_manifold and not e.is_contiguous for e in bm.edges),
        'duplicates':len(mesh.vertices)-len({tuple(round(c,6) for c in v.co) for v in mesh.vertices}),
        'signed_volume':bm.calc_volume(signed=True),'materials':[m.name for m in mesh.materials], 'textures':0}
    bm.free()
    assert entry['nonmanifold_edges']==entry['loose_vertices']==entry['zero_area_faces']==entry['inconsistent_winding']==0, entry
    export=obj.copy(); export.data=mesh
    bpy.context.scene.collection.objects.link(export); export.matrix_world=Matrix.Identity(4)
    activate(export)
    path=asset_dir/(source_name+'_Detail_v1.glb')
    assert not path.exists(), 'Never overwrite an existing GLB'
    options=bpy.ops.export_scene.gltf.get_rna_type().properties['export_format'].enum_items
    supported=[i.identifier for i in options]
    if not supported:
        # Dynamic enum items are not exposed in RNA on Blender 5.2.
        import ast, re
        try: bpy.ops.export_scene.gltf(export_format='__QUERY_SUPPORTED_VALUES__')
        except TypeError as error:
            supported=ast.literal_eval(re.search(r'not found in (.*)',str(error)).group(1))
    fmt=next(i for i in supported if i=='GLB')
    bpy.ops.export_scene.gltf(filepath=str(path),export_format=fmt,use_selection=True,export_yup=True)
    bpy.data.objects.remove(export,do_unlink=True)
    entry['bytes']=path.stat().st_size; report[source_name]=entry
    # Import the candidate and compare geometry before removing only that import.
    before=set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(path))
    imported=set(bpy.data.objects)-before
    imported_tris=0
    for imported_obj in imported:
        if imported_obj.type=='MESH':
            imported_obj.data.calc_loop_triangles(); imported_tris+=len(imported_obj.data.loop_triangles)
    entry['reimport_triangles']=imported_tris
    assert imported_tris==entry['triangles']
    for imported_obj in imported: bpy.data.objects.remove(imported_obj,do_unlink=True)
report['notes']=['Runtime broken wall offset remains X+4/Z+11; not baked into GLB.',
    'No new modules. Closed separate stones retain internal mating faces for reuse; no destructive union.',
    'Arch intrados and ground footprint preserved. Root ground fitting verified separately in runtime.']
(OUT/'mesh-audit.json').write_text(json.dumps(report,indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'jelly-oasis-ruin-root-detail-v1.blend'))
print(json.dumps(report))
