"""Build a closed, connected low-poly cliff; preserve the integration original.

Run in the existing JellyOasis_OvergrownRuin_v1 scene through Blender MCP.
The front is local -Y. Dimensions stay within tolerance; the origin is retained.
"""
import bpy
import bmesh
import json
import math
from pathlib import Path
from mathutils import Vector

ROOT = Path(r'C:\Users\cjfty\Documents\dev\cjftya.github.io')
OUT = ROOT / 'artifacts/jelly-oasis/cliff-detail-v1'
OUT.mkdir(parents=True, exist_ok=True)
original = bpy.data.objects['Cliff_Waterfall_A']
name = 'Cliff_Waterfall_A_Detail_v1'
if bpy.data.objects.get(name):
    bpy.data.objects.remove(bpy.data.objects[name], do_unlink=True)

def interp(t, knots):
    for (a, x), (b, y) in zip(knots, knots[1:]):
        if t <= b:
            return x + (y-x) * max(0, (t-a)/(b-a))
    return knots[-1][1]

# Non-uniform section spacing concentrates topology at ledges and channel turns.
xs = [-1,-.96,-.89,-.83,-.75,-.69,-.61,-.54,-.46,-.39,-.31,-.24,
      -.18,-.12,-.06,0,.055,.12,.19,.26,.34,.41,.49,.57,.64,.73,.81,.9,.96,1]
levels = [0,.05,.09,.12,.18,.215,.235,.26,.32,.39,.46,.49,.515,.54,
          .59,.65,.71,.76,.795,.815,.84,.88,.92,.96,1]
verts, faces = [], []
N = len(xs)

def height(u):
    return interp(u,[(-1,13.2),(-.83,15.8),(-.61,17),(-.39,16.4),
                     (-.24,15.1),(.12,14.8),(.34,15.6),(.57,14.7),(.81,13.6),(1,11.8)])

def point(u,t,back=False):
    width = interp(t,[(0,1),(.18,.99),(.32,.95),(.49,.94),(.54,.89),(.76,.85),(1,.76)])
    x = u*10.66*width + .36*math.sin(t*5.5)*(1-u*u)
    h = height(u)
    z = t*h + (.55*math.sin(u*4+t*2)+.24*u)*math.sin(math.pi*t)
    if back:
        x *= .87
        y = 5.15 - 1.25*abs(u)**3 - .45*t + .42*math.sin(u*8+t*4)
        z += .38*t*(1-u*u)
    else:
        # Recess narrows uphill and snakes by 0.9m between the two breaks.
        center = interp(t,[(0,.2),(.26,-.45),(.54,.55),(.84,-.3),(1,-.1)])
        half = interp(t,[(0,3.05),(.3,2.55),(.65,1.95),(1,1.55)])
        channel = max(0,1-abs(x-center)/half)
        recess = 2.0 * min(1,channel*1.65)
        advance = interp(t,[(0,-5.7),(.12,-5.4),(.215,-4.65),(.235,-4.55),
                              (.26,-4.2),(.49,-3.85),(.515,-3.75),(.54,-2.8),
                              (.795,-2.5),(.815,-2.4),(.84,-1.6),(1,-1.15)])
        # Broad asymmetric buttresses; no independent tower meshes or internal faces.
        plane = interp(u,[(-1,2.4),(-.83,.4),(-.61,-.65),(-.39,-.2),(-.18,.12),
                          (.12,0),(.34,-.7),(.57,-.25),(.81,.7),(1,2.5)])
        fracture = .19*math.sin(u*19 + t*6) + .11*math.sin(u*31-t*8)
        ledge = .6*math.sin(u*5+t*3)*math.sin(math.pi*t)
        y = advance + plane + recess + ledge + fracture*math.sin(math.pi*t)
    return (x,y,z)

for t in levels:
    verts.extend(point(u,t) for u in xs)
    verts.extend(point(u,t,True) for u in reversed(xs))
R = 2*N
for j in range(len(levels)-1):
    for i in range(R):
        a=j*R+i; b=j*R+(i+1)%R; c=b+R; d=a+R
        if (i+j)%3:
            faces.extend([(a,b,d),(b,c,d)])
        else:
            faces.extend([(a,b,c),(a,c,d)])

# Close the base with a fan; the support skirt stays within the old footprint.
base=len(verts); verts.append((0,0,.10))
for i in range(R): faces.append((base,(i+1)%R,i))

# Upper shelf: irregular sloping surface with a shallow rear lip and open front entry.
top=(len(levels)-1)*R
rows=[[top+i for i in range(N)]]
for v in [.18,.43,.69,.86]:
    row=[]
    for i,u in enumerate(xs):
        front=Vector(verts[top+i]); back=Vector(verts[top+R-1-i])
        p=front.lerp(back,v)
        p.z += .18*math.sin(u*8+v*3)*math.sin(math.pi*v)
        p.z -= .42*max(0,1-abs(p.x+.1)/3.25)*math.sin(math.pi*v)
        row.append(len(verts));verts.append(tuple(p))
    rows.append(row)
rows.append([top+R-1-i for i in range(N)])
for a,b in zip(rows,rows[1:]):
    for i in range(N-1):
        faces.extend([(a[i],a[i+1],b[i]),(a[i+1],b[i+1],b[i])])
# Cap the ends of the shelf's inserted rows.
for side in [0,N-1]:
    for j in range(1,len(rows)-1):
        faces.append((rows[0][side],rows[j][side],rows[j+1][side]))

mesh=bpy.data.meshes.new(name+'_Mesh')
mesh.from_pydata(verts,[],faces);mesh.update()
bm=bmesh.new();bm.from_mesh(mesh)
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
bm.to_mesh(mesh);bm.free()
detail=bpy.data.objects.new(name,mesh)
original.users_collection[0].objects.link(detail)
detail.matrix_world=original.matrix_world.copy()
# Match the approved extrema exactly; local axes and origin stay fixed.
lo=[min(v.co[i] for v in mesh.vertices) for i in range(3)]
hi=[max(v.co[i] for v in mesh.vertices) for i in range(3)]
target_lo=[min(v[i] for v in original.bound_box) for i in range(3)]
target_hi=[max(v[i] for v in original.bound_box) for i in range(3)]
for v in mesh.vertices:
    for i in range(3): v.co[i]=target_lo[i]+(v.co[i]-lo[i])/(hi[i]-lo[i])*(target_hi[i]-target_lo[i])
# Keep the approved contact footprint under the two-metre foundation skirt.
# Convex hull of the old ground vertices, with its exact downhill anchor retained.
points=sorted(set((v.co.x,v.co.y) for v in original.data.vertices if v.co.z<.001))
def cross(o,a,b): return (a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0])
lower=[];upper=[]
for p in points:
    while len(lower)>=2 and cross(lower[-2],lower[-1],p)<=0: lower.pop()
    lower.append(p)
for p in reversed(points):
    while len(upper)>=2 and cross(upper[-2],upper[-1],p)<=0: upper.pop()
    upper.append(p)
hull=lower[:-1]+upper[:-1]
for v in mesh.vertices:
    if v.co.z>=2: continue
    x,y,z=v.co
    if abs(x)+abs(y)<.01: continue
    hits=[]
    for a,b in zip(hull,hull[1:]+hull[:1]):
        ex,ey=b[0]-a[0],b[1]-a[1]
        det=x*ey-y*ex
        if abs(det)<1e-8: continue
        ray=(a[0]*ey-a[1]*ex)/det
        edge=(a[0]*y-a[1]*x)/det
        if ray>0 and 0<=edge<=1: hits.append(ray)
    if hits:
        ratio=min(1,min(hits))
        ratio=ratio+(1-ratio)*min(1,z/2)
        v.co.x*=ratio;v.co.y*=ratio
# Inset the pond-side apron between the original feet, keeping the landing open.
for v in mesh.vertices:
    if v.co.z<2 and v.co.y<0:
        v.co.y += .65*max(0,1-abs((v.co.x-2.8)/3.2))*(1-v.co.z/2)
anchor=Vector((5.985085964202881,-5.086786270141602,0))
nearest=min((v for v in mesh.vertices if v.co.z<.001),key=lambda v:(v.co-anchor).length)
nearest.co=anchor
for mat in original.data.materials: mesh.materials.append(mat)
mesh.update()
for f in mesh.polygons:
    f.use_smooth=False
    # Restrained broad plane palette; never random per-triangle colors.
    f.material_index=1 if f.normal.z>.65 and f.center.z>13.8 else 0
original.hide_set(True);original.hide_render=True
detail['design']='Continuous asymmetric bedrock; two erosion ledges; local -Y pond outlet'
detail['source']='Cliff_Waterfall_A (preserved)'
detail['upper_shelf']='~6.5m wide x 4.2m deep, recessed entry and rising rear lip'
bpy.context.view_layer.update()
bm=bmesh.new();bm.from_mesh(mesh)
mesh.calc_loop_triangles();original.data.calc_loop_triangles()
report={'before_triangles':len(original.data.loop_triangles),'after_triangles':len(mesh.loop_triangles),
        'before_dimensions':list(original.dimensions),'after_dimensions':list(detail.dimensions),
        'origin_difference':list(detail.location-original.location),'scale':list(detail.scale),
        'nonmanifold_edges':sum(not e.is_manifold for e in bm.edges),
        'loose_vertices':sum(not v.link_edges for v in bm.verts),
        'signed_volume':bm.calc_volume(signed=True),
        'duplicate_vertices':len(mesh.vertices)-len({tuple(round(c,6) for c in v.co) for v in mesh.vertices}),
        'materials':[m.name for m in mesh.materials],'image_textures':0}
unseen=set(bm.verts);components=0
while unseen:
    components+=1;todo=[unseen.pop()]
    while todo:
        v=todo.pop()
        for e in v.link_edges:
            q=e.other_vert(v)
            if q in unseen: unseen.remove(q);todo.append(q)
report.update({'connected_components':components,
               'zero_area_faces':sum(f.calc_area()<1e-9 for f in bm.faces),
               'inconsistent_winding_edges':sum(e.is_manifold and not e.is_contiguous for e in bm.edges)})
bm.free()
# Selected origin-normalized copy exports with an identity transform.
bpy.ops.object.select_all(action='DESELECT')
detail.name=name+'_Preview'
export_obj=detail.copy();export_obj.data=mesh
export_obj.name=name
bpy.context.scene.collection.objects.link(export_obj)
export_obj.location=(0,0,0);export_obj.hide_set(False);export_obj.select_set(True)
bpy.context.view_layer.objects.active=export_obj
export_path=ROOT/'public/assets/jelly-oasis/landmarks/overgrown-ruin'/f'{name}.glb'
bpy.ops.export_scene.gltf(filepath=str(export_path),export_format='GLB',use_selection=True,export_yup=True)
bpy.data.objects.remove(export_obj,do_unlink=True)
detail.name=name
detail.select_set(True);bpy.context.view_layer.objects.active=detail
report['export_path']=str(export_path)
(OUT/'mesh-audit.json').write_text(json.dumps(report,indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'jelly-oasis-cliff-detail-v1.blend'))
print(json.dumps(report))
