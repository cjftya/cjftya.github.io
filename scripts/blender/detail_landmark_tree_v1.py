"""Build a separate tree candidate from the completed Ruin + Root scene via MCP."""
import bpy, bmesh, math, random, json
from pathlib import Path
from mathutils import Vector, Matrix
ROOT=Path(r'C:/Users/cjfty/Documents/dev/cjftya.github.io')
OUT=ROOT/'artifacts/jelly-oasis/landmark-tree-detail-v1'
source=bpy.data.objects['Tree_Landmark_Blockout']
assert 'Root_Tree_Base_Blockout_Detail_v1' in bpy.data.objects
assert 'Tree_Landmark_Detail_v1' not in bpy.data.objects
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'source-preserved.blend'),copy=True)
collection=bpy.data.collections.new('Tree_Detail_v1'); bpy.context.scene.collection.children.link(collection)
parent=bpy.data.objects.new('Tree_Landmark_Detail_v1',None); collection.objects.link(parent); parent.location=source.location
wood=source.data.materials[0]
parts=[]
def mesh(name,verts,faces,mat):
    data=bpy.data.meshes.new(name); data.from_pydata(verts,[],faces)
    bm=bmesh.new(); bm.from_mesh(data); bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces)); bm.to_mesh(data); bm.free()
    data.materials.append(mat)
    ob=bpy.data.objects.new(name,data); collection.objects.link(ob); ob.parent=parent; parts.append(ob)
    return ob

def sweep(name,knots,sides=12,steps=3,base=False):
    samples=[]
    for j in range(len(knots)-1):
        a,b=Vector(knots[j][:3]),Vector(knots[j+1][:3]); prev=Vector(knots[max(0,j-1)][:3]); nex=Vector(knots[min(len(knots)-1,j+2)][:3])
        for k in range(steps):
            t=k/steps
            p=(2*t**3-3*t*t+1)*a+(t**3-2*t*t+t)*(b-prev)*.5+(-2*t**3+3*t*t)*b+(t**3-t*t)*(nex-a)*.5
            samples.append((p,knots[j][3]*(1-t)+knots[j+1][3]*t))
    samples.append((Vector(knots[-1][:3]),knots[-1][3]))
    verts=[]; faces=[]
    for j,(p,r) in enumerate(samples):
        tangent=(samples[min(j+1,len(samples)-1)][0]-samples[max(j-1,0)][0]).normalized()
        u=tangent.cross(Vector((0,1,0))).normalized(); v=tangent.cross(u).normalized()
        for i in range(sides):
            a=2*math.pi*i/sides; rib=1+.065*math.cos(3*a+j*.11)
            verts.append(tuple(p+r*rib*(math.cos(a)*u+math.sin(a)*v*.94)))
    if base:
        # Exact original twelve-vertex foot retains the nine runtime support samples.
        foot=[tuple(v.co) for v in source.data.vertices if v.co.z<.6]
        assert len(foot)==sides
        verts[:sides]=foot
    for j in range(len(samples)-1):
        for i in range(sides):
            a=j*sides+i; b=j*sides+(i+1)%sides; faces.append((a,b,b+sides,a+sides))
    faces.extend([tuple(reversed(range(sides))),tuple((len(samples)-1)*sides+i for i in range(sides))])
    ob=mesh(name,verts,faces,wood)
    for f in ob.data.polygons: f.use_smooth=True
    return ob
trunk=sweep('Trunk_Main',[(0,0,.25,1.78),(.12,.08,2,1.72),(.65,.18,5.8,1.43),(-.35,.5,9,1.3),(-1.1,.8,12,1.1),(-.35,1,15.5,.85),(1.1,1.1,19,.52),(1.5,1.3,23,.16)],base=True)
branches=[
 [(-.45,.55,9.7,1.12),(-2.5,.7,12.5,.95),(-5.4,.4,14.6,.68),(-8.2,.2,17,.4),(-9,.2,19.3,.13)],
 [(-.3,.9,13,.95),(2.5,.3,14.3,.82),(5.5,-.9,15.2,.61),(8,-1.8,17.2,.39),(9,-2,20,.12)],
 [(-.6,.8,12.1,.85),(-1.6,-1.3,15,.7),(-2.8,-4.3,17.7,.48),(-3.4,-6.1,20.3,.12)],
 [(-.2,1,15.3,.74),(-2.2,3.2,18,.6),(-4.3,5.1,20,.36),(-4.9,5.6,23,.12)],
 [( .5,1.1,17,.65),(2.6,3.2,19,.48),(4.7,4.4,21.8,.3),(5,4.5,24,.1)],
 [(1.2,1.2,19,.45),(.4,.8,22,.34),(-.8,1.1,24.4,.16),(-1,1.2,26,.08)],
]
for i,k in enumerate(branches): sweep('Branch_Primary_%02d'%i,k,12,3)
secondary=[
 [(-5.4,.4,14.6,.45),(-5.8,-2,17,.32),(-6.4,-3.2,20,.08)],
 [(-8.2,.2,17,.32),(-9,2.6,18.3,.22),(-9.4,3.5,20,.07)],
 [(-2.5,.7,12.5,.48),(-3.6,2.5,16.3,.28),(-3.9,3,20,.08)],
 [(5.5,-.9,15.2,.4),(5.4,-3.8,18,.28),(5,-5.1,20,.07)],
 [(8,-1.8,17.2,.3),(8.7,.8,19,.19),(8.6,2.1,21,.06)],
 [(2.5,.3,14.3,.42),(2,-2.4,17.6,.27),(1.2,-3.4,21,.08)],
 [(-2.8,-4.3,17.7,.32),(-.3,-5.5,19,.23),(0,-6.2,21,.06)],
 [(-2.8,-4.3,17.7,.28),(-5,-5.4,19.5,.18),(-5.8,-5.8,21,.06)],
 [(-4.3,5.1,20,.3),(-6.5,4.7,21.2,.2),(-7,4.9,23,.06)],
 [(-2.2,3.2,18,.32),(-1.1,5.3,20.6,.22),(-.8,6,23,.06)],
 [(4.7,4.4,21.8,.23),(3,6,23,.17),(2.3,6.4,24,.06)],
 [(2.6,3.2,19,.3),(4.1,1.3,21.4,.22),(4.3,.5,23,.06)],
 [(.4,.8,22,.26),(-2.1,-.5,23.6,.18),(-3,-.8,25,.06)],
 [(1.2,1.2,19,.28),(2.4,-1,21.6,.18),(2.8,-1.7,24,.06)],
]
for i,k in enumerate(secondary): sweep('Branch_Secondary_%02d'%i,k,8,3)
# Consolidate woody sweeps into one object. Closed overlapping junctions remain
# buried in parent branches; tapered forks are reviewed from below.
bpy.ops.object.select_all(action='DESELECT')
for ob in parts: ob.select_set(True)
bpy.context.view_layer.objects.active=trunk; bpy.ops.object.join(); parts=[trunk]
trunk.name='Trunk_and_Branches'
# Irregular flattened crowns with scalloped edges, layered around branch tips.
clusters=[(-9,.3,20,3.4,3,2.4),(-8.8,3.4,21,3.1,2.7,2),(-6.4,-3.2,21,3.6,2.9,2.5),(-4,3,21.4,3.5,3,2.7),
 (9,-2,21,3.5,2.8,2.5),(8.5,2,22,3.3,3,2.2),(5,-5,21,3.3,3,2.2),(1.1,-3.5,22,3,2.6,2.4),
 (-3.4,-6,21.7,3.5,3.2,2.5),(-.2,-6.1,22,2.8,2.9,2),(-6,-5.7,21.6,2.8,2.4,1.8),
 (-5,5.5,23.4,3.6,3.2,2.3),(-7,4.8,23,2.5,2.8,1.8),(-.8,6,23.8,3.2,2.8,2.6),
 (5,4.4,24.1,3.5,3.1,2.4),(2.3,6.4,24.6,3.1,2.6,2),(4.3,.5,24,3,2.8,2.2),
 (-1,1.2,26,3.7,3.1,2),(-3,-.8,25.3,3.5,3,2),(2.8,-1.7,24.7,3.2,2.6,2.2),
 (-10.1,-1.5,19.3,2.3,2,1.5),(10,-.8,20.5,2.1,2,1.6),(-4.8,-7.3,20.4,2.1,1.9,1.4),(6.9,5.1,23.2,2.3,2.2,1.6)]
rng=random.Random(731)
verts=[]; faces=[]; colors=[]
for ci,(x,y,z,sx,sy,sz) in enumerate(clusters):
    bm=bmesh.new(); bmesh.ops.create_icosphere(bm,subdivisions=3,radius=1)
    bm.verts.ensure_lookup_table(); bm.verts.index_update(); off=len(verts)
    phase=rng.random()*6.28; rot=rng.uniform(-.6,.6)
    for v in bm.verts:
        q=v.co; az=math.atan2(q.y,q.x)
        wobble=1+.105*math.sin(5*az+phase)+.065*math.cos(3*az-q.z*4+phase)
        xx=q.x*sx*wobble; yy=q.y*sy*wobble
        verts.append((x+xx*math.cos(rot)-yy*math.sin(rot),y+xx*math.sin(rot)+yy*math.cos(rot),z+q.z*sz*(1+.09*math.sin(az*3+phase))+.22*math.sin(az*4+phase)*(1-abs(q.z))))
    for f in bm.faces:
        faces.append(tuple(off+v.index for v in f.verts)); colors.append((ci+int(f.calc_center_median().z<-.2))%3)
    bm.free()
# Normalize only foliage to the established 25x20x28 envelope, preserving trunk foot.
mins=[min(v[a] for v in verts) for a in range(3)]; maxs=[max(v[a] for v in verts) for a in range(3)]
verts=[((v[0]-(mins[0]+maxs[0])/2)*25/(maxs[0]-mins[0]),(v[1]-(mins[1]+maxs[1])/2)*20/(maxs[1]-mins[1]),v[2]+28-maxs[2]) for v in verts]
canopy=mesh('Canopy_Clusters',verts,faces,source.data.materials[1])
for mat in source.data.materials[2:]: canopy.data.materials.append(mat)
for f,c in zip(canopy.data.polygons,colors): f.material_index=c
source.hide_render=True; source.hide_set(True)
parent['source']='Tree_Landmark_Blockout'; parent['asset_stage']='detail_v1_candidate'
bpy.context.view_layer.update()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'jelly-oasis-landmark-tree-detail-v1.blend'))
print('Tree created', [(ob.name,len(ob.data.polygons)) for ob in parts])
