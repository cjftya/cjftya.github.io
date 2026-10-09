"""Audit the live blockout, export modular GLBs, and round-trip three assets."""
import bpy, bmesh, json, math
from pathlib import Path
from mathutils import Vector, Matrix

BASE=Path(r'C:\Users\cjfty\Documents\dev\cjftya.github.io')
OUT=BASE/'artifacts/jelly-oasis/overgrown-ruin-v1'
EXPORT=OUT/'exports'; EXPORT.mkdir(exist_ok=True)
scene=bpy.data.scenes['JellyOasis_OvergrownRuin_v1']
bpy.context.window.scene=scene

# Finalize local placement anchors while preserving the assembled positions.
for ob in scene.objects:
    if ob.type!='MESH' or ob.get('anchor_finalized'): continue
    delta=Vector((0,0,0))
    if ob.name.startswith('Rock_Large') or ob.name=='Cliff_Waterfall_A':
        delta=Vector(((min(v.co.x for v in ob.data.vertices)+max(v.co.x for v in ob.data.vertices))/2,(min(v.co.y for v in ob.data.vertices)+max(v.co.y for v in ob.data.vertices))/2,min(v.co.z for v in ob.data.vertices)))
    elif ob.name=='Root_Large_A': delta=Vector((0,0,1.3))
    elif ob.name=='PondEdge_Blockout': delta=Vector((0,-7,0))
    elif ob.name=='Tree_Landmark_Blockout':
        for v in ob.data.vertices:
            if v.co.z<0: v.co.z=0
    ob.data.transform(Matrix.Translation(-delta)); ob.location+=delta
    ob['anchor_finalized']=True
bpy.context.view_layer.update()
assets=[o for o in scene.objects if o.type=='MESH' and o.get('export_asset')]

def stats(ob):
    mesh=ob.data; mesh.calc_loop_triangles()
    bm=bmesh.new(); bm.from_mesh(mesh)
    result={'name':ob.name,'collection':ob.users_collection[0].name,'dimensions_m':[round(x,4) for x in ob.dimensions], 'location_blender_m':[round(x,4) for x in ob.location], 'scale':list(ob.scale),'triangles':len(mesh.loop_triangles),'vertices':len(mesh.vertices),'boundary_edges':sum(e.is_boundary for e in bm.edges),'nonmanifold_nonboundary_edges':sum(not e.is_manifold and not e.is_boundary for e in bm.edges),'loose_vertices':sum(not v.link_edges for v in bm.verts),'materials':list(dict.fromkeys(m.name for m in mesh.materials if m)),'origin_rule':ob.get('origin_rule','local placement anchor'),'export_asset':bool(ob.get('export_asset'))}
    bm.free(); return result

inventory=[stats(o) for o in scene.objects if o.type=='MESH']
assert all(all(abs(s-1)<1e-6 for s in o.scale) for o in assets)
assert all(not a['nonmanifold_nonboundary_edges'] and not a['loose_vertices'] for a in inventory if a['export_asset'])
assert all(not a['boundary_edges'] for a in inventory if a['export_asset'] and a['name']!='PondEdge_Blockout')

# Conservative planar occupancy from triangles clipped to a 0.08..3 m creature envelope.
# This is a blockout audit, not a NavMesh or physics implementation.
def clip(poly,z,above):
    result=[]
    if not poly: return result
    for a,b in zip(poly,poly[1:]+poly[:1]):
        ia=a.z>=z if above else a.z<=z; ib=b.z>=z if above else b.z<=z
        if ia: result.append(a)
        if ia!=ib: result.append(a+(b-a)*((z-a.z)/(b.z-a.z)))
    return result

def in_poly(x,y,poly):
    inside=False
    for a,b in zip(poly,poly[1:]+poly[:1]):
        if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]: inside=not inside
    return inside

obstacles=[]
for ob in assets:
    if ob.name=='PondEdge_Blockout': continue
    ob.data.calc_loop_triangles()
    for tri in ob.data.loop_triangles:
        p=[ob.matrix_world@ob.data.vertices[v].co for v in tri.vertices]
        p=clip(clip(p,.08,True),3,False)
        if len(p)>2:
            xy=[(v.x,v.y) for v in p]
            obstacles.append((min(v[0] for v in xy),max(v[0] for v in xy),min(v[1] for v in xy),max(v[1] for v in xy),xy,ob.name))
pond=bpy.data.objects['Pond_Blockout']
pond_poly=[tuple((pond.matrix_world@v.co)[:2]) for v in list(pond.data.vertices)[1:]]
def hits(x,y):
    h=set()
    for xmin,xmax,ymin,ymax,poly,name in obstacles:
        if xmin<=x<=xmax and ymin<=y<=ymax and in_poly(x,y,poly): h.add(name)
    if in_poly(x,y,pond_poly): h.add('Pond_Blockout')
    return h

loop_hits={}; loop_samples=0
for i in range(720):
    a=2*math.pi*i/720; c=Vector((34*math.cos(a),32*math.sin(a)))
    n=Vector((math.cos(a)/34,math.sin(a)/32)).normalized()
    for offset in [-3,-2,-1,0,1,2,3]:
        p=c+offset*n; loop_samples+=1
        for h in hits(*p): loop_hits[h]=loop_hits.get(h,0)+1
clear_hits={}; clear_samples=0
for i in range(-32,33):
    for j in range(-32,33):
        x=i*.25; y=j*.25
        if x*x+y*y<=64:
            clear_samples+=1
            for h in hits(x,y-27): clear_hits[h]=clear_hits.get(h,0)+1
approach=bpy.data.objects['CreaturePaths_ArchApproach_6m']
av=[approach.matrix_world@v.co for v in approach.data.vertices]
approach_hits={}; approach_samples=0
for segment in range(4):
    for i in range(81):
        t=i/80; l=av[segment*2].lerp(av[segment*2+2],t); r=av[segment*2+1].lerp(av[segment*2+3],t)
        for j in range(13):
            p=l.lerp(r,j/12); approach_samples+=1
            for h in hits(p.x,p.y): approach_hits[h]=approach_hits.get(h,0)+1
audit={'loop_width_m':6,'loop_sample_count':loop_samples,'loop_intersections':loop_hits,'clearing_diameter_m':16,'clearing_sample_count':clear_samples,'clearing_intersections':clear_hits,'approach_sample_count':approach_samples,'approach_intersections':approach_hits,'arch_nominal_passage_width_m':4.8,'method':'Projected triangles clipped to 0.08..3 m, plus pond footprint. Loop: 720 x 7 samples; clearing: 0.25 m grid; approach: 81 x 13 samples per segment. Not continuous collision proof or NavMesh.'}
arch=bpy.data.objects['Ruin_Arch_A']
audit['arch_minimum_jamb_clearance_m']=round(2*min(abs(v.co.x) for v in arch.data.vertices if v.co.z<3),4)
loop=bpy.data.objects['CreaturePaths_Loop_6m']
inner=[tuple(v.co[:2]) for v in list(loop.data.vertices)[::2]]
outer=[tuple(v.co[:2]) for v in list(loop.data.vertices)[1::2]]
approach_polys=[[tuple(av[i][:2]) for i in face.vertices] for face in approach.data.polygons]
ground_count=reserved_count=0
for ix in range(160):
    x=-40+(ix+.5)*.5
    for iy in range(152):
        y=-38+(iy+.5)*.5
        if (x/40)**2+(y/38)**2>1: continue
        ground_count+=1
        if (in_poly(x,y,outer) and not in_poly(x,y,inner)) or x*x+(y+27)**2<=64 or in_poly(x,y,pond_poly) or any(in_poly(x,y,p) for p in approach_polys): reserved_count+=1
audit['reserved_space_grid_m']=.5
audit['reserved_space_union_m2']=reserved_count*.25
audit['reserved_space_percent']=round(100*reserved_count/ground_count,2)
print('MOVEMENT_AUDIT',json.dumps(audit))
(OUT/'movement-audit.json').write_text(json.dumps(audit,indent=2),encoding='utf-8')
if loop_hits or clear_hits or approach_hits:
    raise RuntimeError('Movement overlaps found. Correct placement before export.')

def deselect():
    action=next(i.identifier for i in bpy.ops.object.select_all.get_rna_type().properties['action'].enum_items if i.identifier=='DESELECT')
    bpy.ops.object.select_all(action=action)
def export_glb(path,objects):
    deselect()
    for ob in objects: ob.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    import io_scene_gltf2
    fmt=next(i[0] for i in io_scene_gltf2.get_format_items(None,bpy.context) if i[0]=='GLB')
    bpy.ops.export_scene.gltf(filepath=str(path),export_format=fmt,use_selection=True,export_yup=True,export_apply=True,export_extras=True,export_cameras=False,export_lights=False)

module_names=['Cliff_Waterfall_A','Ruin_Arch_A','Ruin_Wall_A','Ruin_BrokenWall_A','Rock_Large_A','Tree_Landmark_Blockout','Root_Large_A','PondEdge_Blockout','Crystal_Blockout_A']
for name in module_names:
    ob=bpy.data.objects[name]; saved=ob.location.copy()
    try:
        ob.location=(0,0,0); bpy.context.view_layer.update()
        export_glb(EXPORT/(name+'.glb'),[ob])
    finally:
        ob.location=saved; bpy.context.view_layer.update()
export_glb(EXPORT/'Overgrown_Oasis_Ruin_Blockout_v1.glb',assets)

roundtrip=[]
test_scene=bpy.data.scenes.new('JO_GLB_Roundtrip_Temporary')
try:
    bpy.context.window.scene=test_scene
    for name in module_names[:2]+['Rock_Large_A']:
        before=set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=str(EXPORT/(name+'.glb')))
        imported=[o for o in bpy.data.objects if o not in before]
        meshes=[o for o in imported if o.type=='MESH']
        bpy.context.view_layer.update()
        source=bpy.data.objects[name]
        assert len(meshes)==1
        ob=meshes[0]; actual=stats(ob); expected=stats(source)
        dim_error=max(abs(a-b) for a,b in zip(ob.dimensions,source.dimensions))
        assert dim_error<.0001,(name,dim_error)
        assert ob.location.length<.0001
        assert actual['triangles']==expected['triangles']
        assert len(ob.data.materials)==len(source.data.materials)
        roundtrip.append({'asset':name,'passed':True,'dimension_max_error_m':dim_error,'origin_error_m':ob.location.length,'triangles':actual['triangles'],'material_slot_count':len(ob.data.materials)})
        for item in imported: bpy.data.objects.remove(item,do_unlink=True)
finally:
    bpy.context.window.scene=scene
    bpy.data.scenes.remove(test_scene)

report={'blender_version':bpy.app.version_string,'scene':scene.name,'preserved_scene':'Scene','footprint_m':[80,76],'unit_scale':1,'axis':'Blender Z up; glTF Y up via exporter','assets':inventory,'exported_asset_count':len(assets),'total_exported_triangles':sum(a['triangles'] for a in inventory if a['export_asset']),'modules':module_names,'roundtrip':roundtrip,'movement':audit,'textures':0,'collections':[c.name for c in bpy.data.collections['JellyOasis_Landmark_v1'].children]}
(OUT/'asset-manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
scene.camera=bpy.data.objects['CAM_Landmark_Overview']
deselect(); bpy.data.objects['Ruin_Arch_A'].select_set(True); bpy.context.view_layer.objects.active=bpy.data.objects['Ruin_Arch_A']
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'jelly-oasis-overgrown-ruin-v1.blend'))
print('EXPORT_COMPLETE',json.dumps({'assets':len(assets),'triangles':report['total_exported_triangles'],'roundtrip':roundtrip},ensure_ascii=False))
