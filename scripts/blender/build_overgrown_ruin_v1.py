"""Run in live Blender via MCP. Creates a separate scene, preserving existing scenes.

No external libraries, textures, generators, or destructive scene reset.
Outputs are finalized by inspect_export_overgrown_ruin_v1.py after visual review.
"""
import bpy
import bmesh
import math
import random
from mathutils import Vector, Matrix
from pathlib import Path

ROOT = Path(r'C:\Users\cjfty\Documents\dev\cjftya.github.io')
OUT = ROOT / 'artifacts/jelly-oasis/overgrown-ruin-v1'
OUT.mkdir(parents=True, exist_ok=True)
SCENE_NAME = 'JellyOasis_OvergrownRuin_v1'
if SCENE_NAME in bpy.data.scenes:
    raise RuntimeError('Scene already exists; inspect it instead of rerunning construction.')

def enum_set(owner, prop, desired):
    valid = {x.identifier for x in owner.bl_rna.properties[prop].enum_items}
    if desired not in valid:
        raise RuntimeError(f'{prop}: {desired} unavailable; valid={valid}')
    setattr(owner, prop, desired)

scene = bpy.data.scenes.new(SCENE_NAME)
bpy.context.window.scene = scene
enum_set(scene.unit_settings, 'system', 'METRIC')
scene.unit_settings.scale_length = 1.0
root = bpy.data.collections.new('JellyOasis_Landmark_v1')
scene.collection.children.link(root)
cols = {}
for key in ['BLOCKOUT', 'CLIFF', 'RUIN', 'TREE', 'POND', 'ACCENT', 'REVIEW']:
    cols[key] = bpy.data.collections.new(key)
    root.children.link(cols[key])
guides = bpy.data.collections.new('CompositionGuides')
cols['BLOCKOUT'].children.link(guides)

def mat(name, color, roughness=0.85):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = roughness
    return m

rock_mats = [mat('JO_Rock_GrayBrown', (0.25, .28, .25)), mat('JO_Rock_LightPlane', (.34,.37,.32)), mat('JO_Rock_DarkPlane',(.19,.22,.21))]
ruin_mats = [mat('JO_Ruin_WarmGray',(.56,.49,.36)), mat('JO_Ruin_LightStone',(.68,.60,.44)),mat('JO_Ruin_ShadowStone',(.43,.39,.30))]
bark = mat('JO_Tree_DarkBrown',(.20,.115,.065))
leaves = [mat('JO_Canopy_Sage',(.22,.40,.22)),mat('JO_Canopy_Light',(.32,.49,.25)),mat('JO_Canopy_Shadow',(.12,.28,.20))]
ground_mat = mat('JO_Ground_PresentationOnly',(.31,.37,.23))
edge_mat = mat('JO_PondEdge_Earth',(.41,.40,.27))
pond_mat = mat('JO_Pond_BlueFootprint_ONLY',(.12,.39,.47))
crystal_mat = mat('JO_Crystal_VioletPlaceholder',(.43,.23,.65))
p = next(n for n in crystal_mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
p.inputs['Emission Color'].default_value = (.27,.07,.48,1)
p.inputs['Emission Strength'].default_value = .35
route_mat = mat('JO_Debug_PathGreen',(.15,.66,.30))
clear_mat = mat('JO_Debug_ClearanceYellow',(.80,.64,.13))
water_guide_mat = mat('JO_Debug_WaterfallCyan',(.14,.65,.79))

def link_obj(obj, col):
    for old in list(obj.users_collection):
        old.objects.unlink(obj)
    col.objects.link(obj)
    return obj

def mesh_obj(name, verts, faces, col, materials, seed=0):
    data = bpy.data.meshes.new(name + '_Mesh')
    data.from_pydata(verts, [], faces)
    data.update()
    bm = bmesh.new(); bm.from_mesh(data)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(data); bm.free()
    obj = bpy.data.objects.new(name, data)
    col.objects.link(obj)
    for m in materials: data.materials.append(m)
    rng = random.Random(seed)
    for poly in data.polygons:
        poly.material_index = 0 if rng.random() < .78 else rng.randrange(len(materials))
    return obj

def active(obj):
    bpy.ops.object.select_all(action=next(i.identifier for i in bpy.ops.object.select_all.get_rna_type().properties['action'].enum_items if i.identifier == 'DESELECT'))
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

def bevel(obj, width=.1):
    active(obj)
    kind = next(i.identifier for i in bpy.types.Modifier.bl_rna.properties['type'].enum_items if i.identifier == 'BEVEL')
    mod = obj.modifiers.new('Large_Edge_Bevel', kind)
    mod.width = width; mod.segments = 1
    bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj

def box(name, center, size, col, materials, bevel_width=.12):
    x,y,z = (v/2 for v in size)
    verts = [(a*x+center[0],b*y+center[1],c*z+center[2]) for a,b,c in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]]
    faces = [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
    ob = mesh_obj(name, verts, faces,col,materials)
    return bevel(ob,bevel_width) if bevel_width else ob

def join_parts(name, parts, origin, col):
    active(parts[0])
    for ob in parts: ob.select_set(True)
    bpy.ops.object.join()
    ob = bpy.context.object
    ob.name = name; ob.data.name = name+'_Mesh'
    # Geometry is constructed in a local assembly frame. Anchor it without scale.
    ob.data.transform(ob.matrix_world)
    ob.matrix_world = Matrix.Identity(4)
    ob.location = origin
    ob['asset_stage'] = 'blockout_v1'
    ob['unit_meters'] = 1.0
    return link_obj(ob,col)

def rock(name, size, center, col, seed=0, segments=20, rings=9):
    rng = random.Random(seed)
    verts=[]
    for j in range(rings):
        t=j/(rings-1)
        radius = .72 + .28*math.sin(math.pi*t) - .28*t
        ox=.10*math.sin(4*t+seed); oy=.08*math.sin(5*t+seed)
        for i in range(segments):
            a=2*math.pi*i/segments
            f=1+rng.uniform(-.08,.08)
            verts.append((center[0]+size[0]/2*(radius*math.cos(a)*f+ox),center[1]+size[1]/2*(radius*math.sin(a)*f+oy),center[2]+size[2]*(t+(rng.uniform(-.035,.035) if j not in (0,rings-1) else 0))))
    faces=[]
    for j in range(rings-1):
        for i in range(segments):
            a=j*segments+i; b=j*segments+(i+1)%segments; c=b+segments; d=a+segments
            faces.extend([(a,b,c),(a,c,d)])
    faces += [tuple(reversed(range(segments))), tuple((rings-1)*segments+i for i in range(segments))]
    return mesh_obj(name,verts,faces,col,rock_mats,seed)

def tube(name, points, radii, col, material, sides=10):
    verts=[]
    for j,p in enumerate(points):
        tangent = Vector(points[min(j+1,len(points)-1)])-Vector(points[max(j-1,0)])
        tangent.normalize()
        ref = Vector((0,0,1)) if abs(tangent.z)<.9 else Vector((0,1,0))
        u=tangent.cross(ref).normalized(); v=tangent.cross(u).normalized()
        for i in range(sides):
            a=2*math.pi*i/sides
            verts.append(Vector(p)+radii[j]*(math.cos(a)*u+math.sin(a)*v))
    faces=[]
    for j in range(len(points)-1):
        for i in range(sides): faces.append((j*sides+i,j*sides+(i+1)%sides,(j+1)*sides+(i+1)%sides,(j+1)*sides+i))
    faces += [tuple(reversed(range(sides))),tuple((len(points)-1)*sides+i for i in range(sides))]
    return mesh_obj(name,verts,faces,col,[material])

def ellipse_disk(name, center, rx, ry, col, material, n=48, irregular=0):
    verts=[center]
    for i in range(n):
        a=2*math.pi*i/n; f=1+irregular*(.6*math.sin(3*a)+.4*math.cos(5*a))
        verts.append((center[0]+rx*f*math.cos(a),center[1]+ry*f*math.sin(a),center[2]))
    return mesh_obj(name,verts,[(0,i+1,(i+1)%n+1) for i in range(n)],col,[material])

# Ground is a flat composition reference, never an exported world mesh.
ground = ellipse_disk('Ground_Presentation_ONLY',(0,0,-.08),40,38,cols['BLOCKOUT'],ground_mat,64)
ground['export_exclude']=True
bounds=bpy.data.objects.new('LandmarkBounds_80x76m',None); guides.objects.link(bounds)
enum_set(bounds,'empty_display_type','CUBE'); bounds.scale=(40,38,.05)
bounds.hide_render=True; bounds['export_exclude']=True

# The continuous route is an actual 6 m normal-offset ribbon, not radial scaling.
verts=[]; route_points=[]
for i in range(128):
    a=2*math.pi*i/128
    p=Vector((34*math.cos(a),32*math.sin(a),.035))
    normal=Vector((math.cos(a)/34,math.sin(a)/32,0)).normalized()
    route_points.append(tuple(p))
    verts.extend([p-3*normal,p+3*normal])
route=mesh_obj('CreaturePaths_Loop_6m',verts,[(2*i,2*((i+1)%128),2*((i+1)%128)+1,2*i+1) for i in range(128)],guides,[route_mat])
route['width_m']=6.; route['export_exclude']=True; route.hide_render=True
clearing=ellipse_disk('CreatureClearing_Diameter16m',(0,-27,.045),8,8,guides,clear_mat)
clearing['diameter_m']=16.; clearing['export_exclude']=True; clearing.hide_render=True
# East bank approach: six metres into the 4.8 m arch throat.
approach_points=[(19,-26),(20,-18),(19,-8),(16,-1),(15,4)]
approach_verts=[]
for i,p in enumerate(approach_points):
    tangent=Vector((*approach_points[min(i+1,4)],0))-Vector((*approach_points[max(i-1,0)],0))
    normal=Vector((-tangent.y,tangent.x,0)).normalized()
    c=Vector((*p,.04)); approach_verts.extend([c-3*normal,c+3*normal])
approach=mesh_obj('CreaturePaths_ArchApproach_6m',approach_verts,[(2*i,2*i+1,2*i+3,2*i+2) for i in range(4)],guides,[route_mat])
approach.hide_render=True; approach['width_m']=6.; approach['export_exclude']=True

# Waterfall cliff: flank masses, recessed rear spine, elevated shelf; no water mesh.
parts=[]
for i,(sz,pos) in enumerate([((8,10,16),(-6.5,0,0)),((8.5,10.5,17),(6.5,1,0)),((10,5,14),(0,4,0)),((9,7,10),(-7,-2,0)),((8,7,11),(7,-2,0)),((9,6,2.4),(0,2,14))]):
    parts.append(rock('Cliff_Part',sz,pos,cols['CLIFF'],10+i))
cliff=join_parts('Cliff_Waterfall_A',parts,(0,12,0),cols['CLIFF'])
cliff['origin_rule']='placement base center'; cliff['water_groove_width_m']=4.0
cliff['water_shelf_z_m']=16.4
rockA=rock('Rock_Large_A',(8,6,5.5),(0,0,0),cols['CLIFF'],42,22,10)
rockA.location=(-20,-6,0); rockA['origin_rule']='bottom center'
for name,sz,pos,seed in [('Rock_Large_B',(6,5,4),(-22,12,0),53),('Rock_Large_C',(5,4,3.5),(25,-8,0),61),('Rock_Large_D',(7,5,4.2),(-15,-18,0),73),('Rock_Large_E',(5,5,3),(22,15,0),83)]:
    ob=rock(name,sz,(0,0,0),cols['CLIFF'],seed,16,7); ob.location=pos

# Arch: massive piers and nine wedge stones, irregular upper damage.
parts=[]
for side in [-1,1]:
    for j in range(4):
        parts.append(box('Arch_Pier', (side*3.35,0,.65+j*1.3),(1.85+(.22 if j==0 else 0),2.2+(j%2)*.10,1.26),cols['RUIN'],ruin_mats,.11))
    parts.append(box('Arch_Impost',(side*3.35,0,5.35),(2.05,2.35,.40),cols['RUIN'],ruin_mats,.1))
for i in range(11):
    a=i*math.pi/11+.012; b=(i+1)*math.pi/11-.012
    outer=4.05 if i!=3 else 3.68
    polygon=[(2.4*math.cos(a),5.5+2.4*math.sin(a)),(outer*math.cos(a),5.5+outer*math.sin(a)),(outer*math.cos(b),5.5+outer*math.sin(b)),(2.4*math.cos(b),5.5+2.4*math.sin(b))]
    vv=[(x,y,z) for y in [-1.12,1.12] for x,z in polygon]
    ff=[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
    parts.append(bevel(mesh_obj('Arch_Wedge',vv,ff,cols['RUIN'],ruin_mats,i),.07))
arch=join_parts('Ruin_Arch_A',parts,(15,6,0),cols['RUIN'])
arch['origin_rule']='passage center at ground'; arch['passage_width_m']=4.8

def wall(name, broken, loc):
    parts=[]
    for row in range(3):
        for col in range(3):
            if broken and row==2 and col==2: continue
            h=1.6 if not (broken and row==2 and col==1) else .7
            parts.append(box('Wall_Stone',((col-1)*2.65,0,row*1.65+h/2),(2.59,1.3,h),cols['RUIN'],ruin_mats,.10))
    if not broken:
        parts.append(box('Wall_Coping',(0,0,5.1),(8.2,1.48,.4),cols['RUIN'],ruin_mats,.09))
    else:
        # Sloping fractured top chunk, separate from the reusable unbroken kit piece.
        vv=[(-4, -.65,4.95),(-1.4,-.65,4.95),(-1.4,-.65,5.5),(-4,-.65,6.0),(-4,.65,4.95),(-1.4,.65,4.95),(-1.4,.65,5.5),(-4,.65,6.0)]
        parts.append(bevel(mesh_obj('Wall_Fracture',vv,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],cols['RUIN'],ruin_mats),.09))
    ob=join_parts(name,parts,loc,cols['RUIN']); ob['origin_rule']='bottom center'; return ob
wallA=wall('Ruin_Wall_A',False,(-14,2,0))
wallB=wall('Ruin_BrokenWall_A',True,(18,17,0))
wallB.data.transform(Matrix.Rotation(math.radians(-25),4,'Z'))

# Tree: bent trunk, branch gestures, five canopy blobs; no detailed leaves.
parts=[tube('Tree_Trunk',[(0,0,0),(-.7,.3,3),(-1.1,.4,7),(-.4,.6,11),(1.1,.6,15),(2,1,20)],[1.8,1.6,1.35,1.1,.8,.3],cols['TREE'],bark,12)]
for points,radii in [([(-.6,.5,10),(-3,1,14),(-6,1.5,19)],[1,.7,.2]), ([(.1,.6,12),(4,1,16),(7,2,20)],[.9,.6,.18]), ([(1,.6,15),(0,-3,18),(-2,-5,21)],[.75,.45,.16])]:
    parts.append(tube('Tree_Branch',points,radii,cols['TREE'],bark,10))
for i,(center,scale) in enumerate([((1,1,23),(7,6,5)),((-6,1,21),(6,5.5,4.5)),((7,2,21.5),(6,5,4)),((-2,-5,22),(6,5,4)),((1,5,22),(6,5,4.7))]):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3,radius=1)
    ob=bpy.context.object; ob.name='Tree_Canopy_Blob'
    ob.data.transform(Matrix.Translation(Vector(center)) @ Matrix.Diagonal((*scale,1)))
    ob.data.materials.append(leaves[i%3]); link_obj(ob,cols['TREE']); parts.append(ob)
tree=join_parts('Tree_Landmark_Blockout',parts,(-12,18,0),cols['TREE'])
tree['origin_rule']='trunk ground center'; tree['stage_note']='canopy blobs only; no leaves or bark detail'
# Root reaches across the top edge of the western wall, then returns to ground.
root_points=[(0,0,1.3),(-.6,-1.5,1.7),(-1.5,-3,2.6),(-2,-5,4.0),(-2,-7,5.1),(-1.6,-8,5.5),(-1,-9,4.8),(0,-10,2.2),(1,-11,.5),(2,-12,.05)]
rootA=tube('Root_Large_A',root_points,[1.15,1.05,.95,.85,.7,.65,.55,.44,.3,.12],cols['TREE'],bark,18)
rootA.location=(-12,10,0); rootA['origin_rule']='connection start, ground reference'; rootA['length_note']='12 m span wrapping west wall'
# Short structural root from trunk to the independent long module.
rootB=tube('Root_Tree_Base_Blockout',[(0,0,1),(-1,-2,.7),(-1,-5,.4),(0,-8,1.3)],[1.2,1,.8,1.15],cols['TREE'],bark,10)
rootB.location=(-12,18,0)

# Asymmetric footprint and edge ring only, blue polygon is explicitly debug.
pond=ellipse_disk('Pond_Blockout',(0,-7,.015),12,10,cols['BLOCKOUT'],pond_mat,48,.08)
pond['export_exclude']=True; pond['not_water_asset']=True
n=48; vv=[]
for i in range(n):
    a=2*math.pi*i/n; f=1+.08*(.6*math.sin(3*a)+.4*math.cos(5*a))
    for r,z in [(1,.03),(1.08,.28),(1.15,-.045)]: vv.append((12*f*r*math.cos(a),-7+10*f*r*math.sin(a),z))
edge=mesh_obj('PondEdge_Blockout',vv,[(3*i+j,3*((i+1)%n)+j,3*((i+1)%n)+j+1,3*i+j+1) for i in range(n) for j in range(2)],cols['POND'],[edge_mat])
edge['stage_note']='open terrain-conforming edge ribbon; boundary edges intentional'
for x in [-1.5,1.5]:
    ob=tube('Waterfall_Drop_Guide_'+('L' if x<0 else 'R'),[(x,10,16.4),(x,5,16.4),(x,3,1),(x,1,.08)],[.07]*4,guides,water_guide_mat,5)
    ob.hide_render=True; ob['export_exclude']=True

def crystals(name,pos):
    parts=[]
    for j,(cx,cy,h,r) in enumerate([(0,0,3.4,.65),(1,.3,2.2,.5),(-.7,.7,1.7,.4)]):
        vv=[]
        for z,m in [(0,1),(.75*h,1)]:
            vv.extend([(cx+r*m*math.cos(i*math.pi/3),cy+r*m*math.sin(i*math.pi/3),z) for i in range(6)])
        vv.append((cx+.2,cy-.1,h))
        ff=[tuple(reversed(range(6)))]+[(i,(i+1)%6,(i+1)%6+6,i+6) for i in range(6)]+[(i+6,(i+1)%6+6,12) for i in range(6)]
        parts.append(mesh_obj('Crystal_Part',vv,ff,cols['ACCENT'],[crystal_mat]))
    return join_parts(name,parts,pos,cols['ACCENT'])
crystals('Crystal_Blockout_A',(15,-19,0)); crystals('Crystal_Blockout_B',(-15,-12,0)); crystals('Crystal_Blockout_C',(9,20,0))

def camera(name, location, target, ortho=None, lens=40):
    data=bpy.data.cameras.new(name); ob=bpy.data.objects.new(name,data); cols['REVIEW'].objects.link(ob)
    ob.location=location; ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler()
    data.clip_end=500; data.lens=lens
    if ortho: enum_set(data,'type','ORTHO'); data.ortho_scale=ortho
    return ob
overview=camera('CAM_Landmark_Overview',(66,-92,69),(0,2,9),100)
camera('CAM_Ground_Level',(26,-37,2.3),(1,11,12),lens=24)
camera('CAM_Ruin_Close',(30,-14,10),(12,8,5),lens=36)
camera('CAM_Layout_Top',(0,0,110),(0,0,0),100)
scene.camera=overview
world=bpy.data.worlds.new('JO_Review_World'); world.use_nodes=True; scene.world=world
bg=next(n for n in world.node_tree.nodes if n.type=='BACKGROUND')
bg.inputs['Color'].default_value=(.42,.52,.60,1); bg.inputs['Strength'].default_value=.7
light_type=next(i.identifier for i in bpy.types.Light.bl_rna.properties['type'].enum_items if i.identifier=='SUN')
ld=bpy.data.lights.new('JO_Review_Sun',light_type); sun=bpy.data.objects.new('JO_Review_Sun',ld);cols['REVIEW'].objects.link(sun)
sun.rotation_euler=(math.radians(25),math.radians(-25),math.radians(-35));ld.energy=2.5;ld.angle=math.radians(15)
try: scene.render.engine='CYCLES'
except TypeError as error: print(error); raise
scene.cycles.samples=32
scene.cycles.use_denoising=True
scene.render.resolution_x=1400;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
enum_set(scene.render.image_settings,'file_format','PNG')
scene.render.filepath=str(OUT/'overview.png')
scene['landmark_footprint_m']='80 x 76'
scene['circulation_width_m']=6.0
scene['clearing_diameter_m']=16.0
scene['water_policy']='No real water or waterfall asset; footprint and trajectory debug only.'
scene['source_plan']='jelly-oasis-overgrown-ruin-blender-blockout-v1-astra-high-plan.md'
for ob in scene.objects:
    if ob.type=='MESH' and not ob.get('export_exclude'):
        ob['asset_stage']='blockout_v1'
        ob['unit_meters']=1.0
        ob['export_asset']=True
# Hide diagnostic overlays initially, available as one outliner collection toggle.
guides.hide_render=True
guides.hide_viewport=True
active(arch)
for area in bpy.context.screen.areas:
    if area.type=='VIEW_3D':
        area.spaces.active.region_3d.view_perspective='CAMERA'
        area.spaces.active.clip_end=500
        enum_set(area.spaces.active.shading,'color_type','MATERIAL')
bpy.context.view_layer.update()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'jelly-oasis-overgrown-ruin-v1.blend'))
print('CREATED',SCENE_NAME,'objects',len(scene.objects),'saved',bpy.data.filepath)
