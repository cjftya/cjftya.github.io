import bpy,math,json,random
from pathlib import Path
from mathutils import Vector
ROOT=Path(r'C:/Users/cjfty/Documents/dev/cjftya.github.io');OUT=ROOT/'artifacts/jelly-oasis/pond-edge-detail-v2';OUT.mkdir(parents=True,exist_ok=True)
assert bpy.data.filepath.endswith(('pond-edge-detail-v1.blend','pond-edge-detail-v2.blend'))
assert 'PondEdge_Detail_v2' not in bpy.data.objects, 'v2 already generated'
definition=json.loads((ROOT/'scripts/blender/pond-contour-v2.json').read_text());anchors=definition['anchors'];samples=definition['samplesPerSpan'];points=[];widths=[];regions=[];crests=[]
reliefs=[0,0,.20,.22,.12,0,0,.16,.16,.12,.24,0,0,.12,.22,.28,.22,.18,.15]
def cubic(a,b,c,d,t):return .5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t)
for i,b in enumerate(anchors):
 a=anchors[(i-1)%len(anchors)];c=anchors[(i+1)%len(anchors)];d=anchors[(i+2)%len(anchors)]
 for step in range(samples):
  t=step/samples;points.append(Vector((cubic(a[0],b[0],c[0],d[0],t),cubic(a[1],b[1],c[1],d[1],t),0)));widths.append(b[2]*(1-t)+c[2]*t);regions.append(i);crests.append(reliefs[i]*(1-t)+reliefs[(i+1)%len(anchors)]*t)
n=len(points);coll=bpy.data.collections.new('PondEdge_Detail_v2');bpy.context.scene.collection.children.link(coll)
parent=bpy.data.objects.new('PondEdge_Detail_v2',None);coll.objects.link(parent);parent.location=(0,-7,0)
earth=bpy.data.materials['JO_PondEdge_Earth'];grass=bpy.data.materials['JO_Canopy_Sage'];rock=bpy.data.materials['JO_Rock_GrayBrown']
# A true concave water polygon. Blender triangulates it; the exported extras use Y-up.
waterMesh=bpy.data.meshes.new('PondWaterBoundary_v2');waterMesh.from_pydata([tuple(p) for p in points],[],[tuple(range(n))]);waterMesh.update();waterMesh.calc_loop_triangles()
guide={'positions':[[p.x,0,7-p.y] for p in points],'indices':[[int(v) for v in tri.vertices] for tri in waterMesh.loop_triangles]}
parent['pond_guide_v2']=json.dumps(guide,separators=(',',':'))
water=bpy.data.objects.new('PondWaterBoundary_Guide_v2',waterMesh);coll.objects.link(water);water.parent=parent;water.location.z=.015;water['export_excluded']=True;waterMesh.materials.append(bpy.data.materials['JO_Pond_BlueFootprint_ONLY'])
# Broad integrated slopes. Width is authored per bay, never a noisy radial ring.
vertices=[];faces=[];weights=[]
for band,t in enumerate([0,0,.25,.65,1]):
 for i,p in enumerate(points):
  tangent=(points[(i+1)%n]-points[(i-1)%n]).normalized();normal=Vector((tangent.y,-tangent.x,0))
  offset=[-.16,0,.27*widths[i],.67*widths[i],widths[i]][band]
  q=p+normal*offset
  if band>=2:q.x=max(-13.55,min(14.1,q.x));q.y=max(-12.1,min(11.0,q.y))
  # The low north inlet and east/west approaches have no upper mound.
  crest=crests[i]
  height=[-.07,.018,.08+crest,.02+crest*.65,-.065][band]
  vertices.append((q.x,q.y,height));weights.append(t)
for band in range(4):
 for i in range(n):
  j=(i+1)%n;faces.append(((band+1)*n+i,(band+1)*n+j,band*n+j,band*n+i))
mesh=bpy.data.meshes.new('Shore_Base_Bank_Upper_v2');mesh.from_pydata(vertices,[],faces);mesh.update();mesh.materials.append(earth);mesh.materials.append(grass)
assert all(f.normal.z>0 for f in mesh.polygons), 'Folded slope faces'
shore=bpy.data.objects.new('Shore_Base_Bank_Upper_v2',mesh);coll.objects.link(shore);shore.parent=parent;shore['pond_role']='shore'
uv=mesh.uv_layers.new(name='GroundWeight')
for f in mesh.polygons:
 f.use_smooth=True
 region=regions[f.index%n];band=f.index//n
 # Soil bays fade into wide grass; the outermost row always uses grass.
 f.material_index=0 if band<3 and region in [0,1,8,9,15,16] else 1
 for li in f.loop_indices:
  vi=mesh.loops[li].vertex_index;uv.data[li].uv=(weights[vi],(vi%n)/n)
# Three unequal clusters: west rocky cove, south outcrop, small east pair.
rocks=[(25,.35,(1.15,.8,.70)),(27,.6,(.75,.6,.46)),(28,.35,(.48,.4,.30)),(29,.75,(.55,.42,.36)),(44,.65,(1.45,1.0,.95)),(45,.4,(.9,.65,.52)),(47,.8,(.52,.45,.32)),(2,.5,(.65,.5,.4)),(3,.6,(.4,.32,.28))]
for k,(i,offset,size) in enumerate(rocks):
 tangent=(points[(i+1)%n]-points[(i-1)%n]).normalized();normal=Vector((tangent.y,-tangent.x,0));center=points[i]+normal*offset
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=1,location=(0,0,0));ob=bpy.context.object;ob.name='Rocks_v2_'+str(k)
 for c in list(ob.users_collection):c.objects.unlink(ob)
 coll.objects.link(ob);ob.parent=parent;ob['pond_role']='rock';rng=random.Random(241+k)
 for v in ob.data.vertices:
  q=v.co.copy();jitter=1+rng.uniform(-.12,.12);v.co=(center.x+q.x*size[0]*jitter,center.y+q.y*size[1]*jitter,q.z*size[2]*jitter+size[2]*.75)
 ob.data.materials.append(rock);ob.data.materials.append(bpy.data.materials['JO_Rock_LightPlane']);ob.data.materials.append(bpy.data.materials['JO_Rock_DarkPlane']);ob.data.update()
 for f in ob.data.polygons:f.material_index=1 if f.normal.z>.5 else (2 if f.index%7==0 else 0)
for ob in bpy.data.collections['PondEdge_Detail_v1'].objects:ob.hide_set(True);ob.hide_render=True
bpy.data.objects['Pond_Blockout'].hide_set(True);bpy.data.objects['Pond_Blockout'].hide_render=True
report={'source_file':str(ROOT/'artifacts/jelly-oasis/pond-edge-detail-v1/jelly-oasis-pond-edge-detail-v1.blend'),'contour_source':'scripts/blender/pond-contour-v2.json','contour_samples':n,'water_triangles':len(guide['indices']),'water_guide':guide,'parts':{},'rock_clusters':3}
for ob in parent.children:
 if ob.type=='MESH' and not ob.get('export_excluded'):
  ob.data.calc_loop_triangles();report['parts'][ob.name]={'role':ob['pond_role'],'triangles':len(ob.data.loop_triangles),'materials':[m.name for m in ob.data.materials]}
report['triangles']=sum(p['triangles'] for p in report['parts'].values());assert report['triangles']<1800
(OUT/'mesh-audit.json').write_text(json.dumps(report,indent=2));bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'jelly-oasis-pond-edge-detail-v2.blend'),check_existing=False)
print(json.dumps({'triangles':report['triangles'],'water_triangles':report['water_triangles'],'samples':n}))
