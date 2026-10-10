import bpy, math, json, random
from pathlib import Path
from mathutils import Vector
ROOT=Path(r'C:/Users/cjfty/Documents/dev/cjftya.github.io')
OUT=ROOT/'artifacts/jelly-oasis/pond-edge-detail-v1'; OUT.mkdir(parents=True,exist_ok=True)
assert not bpy.data.is_dirty, 'Source has unsaved changes'
assert bpy.data.filepath.endswith('jelly-oasis-landmark-tree-detail-v1.blend')
source=bpy.data.objects['PondEdge_Blockout']
collection=bpy.data.collections.new('PondEdge_Detail_v1'); bpy.context.scene.collection.children.link(collection)
parent=bpy.data.objects.new('PondEdge_Detail_v1',None);collection.objects.link(parent);parent.location=source.location.copy()
earth=bpy.data.materials['JO_PondEdge_Earth']; rock=bpy.data.materials['JO_Rock_GrayBrown']
# Existing tree foliage family supplies the sparse grassy caps.
green=bpy.data.materials['JO_Canopy_Sage']
boundary=[v.co.copy() for v in bpy.data.objects['Pond_Blockout'].data.vertices][1:]
n=len(boundary); vertices=[];faces=[]
for band,t in enumerate([0,.38,1]):
 for i,p in enumerate(boundary):
  angle=2*math.pi*i/n
  entry=max(0,1-abs(i-n/4)/3)
  approach=max(0,math.cos(2*angle))**12
  width=(1.2+.35*math.sin(3*angle+.4)+.22*math.sin(7*angle))* (1-.82*entry)*(1-.45*approach)
  r=Vector((p.x,p.y+7,0)); unit=r.normalized()
  offset=-.18+(width+.18)*t
  vertices.append(tuple(r+unit*offset+Vector((0,0,[-.09,.07,-.06][band]))))
for b in range(2):
 for i in range(n):
  j=(i+1)%n;faces.append((b*n+i,b*n+j,(b+1)*n+j,(b+1)*n+i))
mesh=bpy.data.meshes.new('Shore_Base');mesh.from_pydata(vertices,[],faces);mesh.update()
shore=bpy.data.objects.new('Shore_Base',mesh);collection.objects.link(shore);shore.parent=parent;shore['pond_role']='shore';mesh.materials.append(earth);mesh.materials.append(green)
uv=mesh.uv_layers.new(name='GroundWeight')
for polygon in mesh.polygons:
 i=polygon.index%n
 polygon.material_index=0 if (i in [0,1,23,24,25] or 17<=i<=21 or 33<=i<=38) else 1
 for li in polygon.loop_indices:
  vi=mesh.loops[li].vertex_index; uv.data[li].uv=([0,.38,1][vi//n],(vi%n)/n)
def lump(name,i,radial,size,role,mat):
 p=boundary[i%n]; r=Vector((p.x,p.y+7,0)); center=r+r.normalized()*radial
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=1,location=(0,0,0))
 ob=bpy.context.object;ob.name=name
 for c in list(ob.users_collection):c.objects.unlink(ob)
 collection.objects.link(ob);ob.parent=parent;ob['pond_role']=role
 rng=random.Random(100+i)
 for v in ob.data.vertices:
  q=v.co.copy(); k=1+rng.uniform(-.1,.1)
  v.co=(center.x+q.x*size[0]*k,center.y+q.y*size[1]*k,q.z*size[2]*k+size[2]*.7)
 if role=='bank':
  center=sum((v.co for v in ob.data.vertices),Vector())/len(ob.data.vertices)
  for v in ob.data.vertices:
   v.co.x=center.x+(v.co.x-center.x)*.85;v.co.z*=1.8
  ob.data.update();ob.data.materials.append(earth);ob.data.materials.append(green)
  for f in ob.data.polygons:f.material_index=int(f.normal.z>.55)
 else:ob.data.materials.append(mat)
 if role=='rock':
  ob.data.materials.append(bpy.data.materials['JO_Rock_LightPlane']);ob.data.materials.append(bpy.data.materials['JO_Rock_DarkPlane'])
  for f in ob.data.polygons:f.material_index=1 if f.normal.z>.4 else (2 if f.index%5==0 else 0)
 return ob
# Broad low humps separated by two approaches and the north inlet.
for i,s in [(6,(2.5,.7,.32)),(20,(1.9,.8,.42)),(30,(2.2,.6,.28)),(42,(1.8,.7,.38))]:
 lump('Bank_Upper_'+str(i),i,.65,s,'bank',green)
# Two unequal embedded rock clusters. No ring of stones.
for k,(i,r,sz) in enumerate([(17,.45,(.8,.65,.48)),(18,.8,(1.15,.8,.7)),(20,.8,(.65,.55,.4)),(21,.7,(.8,.6,.48)),(33,.45,(1,.65,.52)),(35,.7,(1.4,.85,.8)),(36,.5,(.8,.6,.46)),(38,.6,(.55,.45,.3)),(39,.8,(.65,.5,.4))]):
 lump('Rocks_A_'+str(k),i,r,sz,'rock',rock)
guide=bpy.data.objects.new('WaterEntry_Guide',None);collection.objects.link(guide);guide.parent=parent;guide.location=(0,10,0);guide['export_excluded']=True
source.hide_set(True);source.hide_render=True
report={'source_file':bpy.data.filepath,'boundary_samples':n,'approaches':2,'rock_zones':2,'inlet_width_m':(shore.data.vertices[10].co-shore.data.vertices[14].co).length,'parts':{}}
for ob in collection.objects:
 if ob.type=='MESH':
  ob.data.calc_loop_triangles();report['parts'][ob.name]={'role':ob['pond_role'],'triangles':len(ob.data.loop_triangles),'materials':[m.name for m in ob.data.materials]}
report['triangles']=sum(p['triangles'] for p in report['parts'].values())
assert report['triangles']<=3000
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'jelly-oasis-pond-edge-detail-v1.blend'))
(OUT/'mesh-audit.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
