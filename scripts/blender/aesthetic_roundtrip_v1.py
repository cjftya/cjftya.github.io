"""Reimport candidates in fresh documents; audit welded topology, feet and bounds."""
import bpy, bmesh, json, hashlib
from pathlib import Path
ROOT=Path(r'C:/Users/cjfty/Documents/dev/cjftya.github.io')
OUT=ROOT/'artifacts/jelly-oasis/aesthetic-improvement-v1'
PUBLIC=ROOT/'public/assets/jelly-oasis/landmarks/overgrown-ruin'
modules={'Tree_Landmark_Blockout':('Tree_Landmark_Detail_v1.glb','Tree_Landmark_refined_v1.glb'),
         'PondEdge_Blockout':('PondEdge_Blockout_Detail_v2.glb','PondEdge_refined_v1.glb'),
         'Cliff_Waterfall_A':('Cliff_Waterfall_A_Detail_v1.glb','Cliff_refined_v1.glb')}
report={}
for name,(base,candidate) in modules.items():
    variants={}
    for label,path in [('baseline',PUBLIC/base),('refined',OUT/candidate)]:
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.gltf(filepath=str(path))
        bpy.context.view_layer.update()
        points=[];feet=set();health={};triangles=0
        for o in bpy.context.scene.objects:
            if o.type!='MESH':continue
            o.data.calc_loop_triangles();triangles+=len(o.data.loop_triangles)
            world=[o.matrix_world@v.co for v in o.data.vertices];points.extend(world)
            if name!='PondEdge_Blockout':feet.update(tuple(round(c,5) for c in p) for p in world if p.z<.35)
            bm=bmesh.new();bm.from_mesh(o.data)
            bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-6)
            h={'boundary':sum(e.is_boundary for e in bm.edges),'nonmanifold_interior':sum(not e.is_manifold and not e.is_boundary for e in bm.edges),
               'winding':sum(e.is_manifold and not e.is_contiguous for e in bm.edges),'loose':sum(not v.link_edges for v in bm.verts),
               'zero_area':sum(f.calc_area()<1e-9 for f in bm.faces),'signed_volume':bm.calc_volume(signed=True)}
            bm.free();health[o.name]=h
            assert not any(h[k] for k in ['nonmanifold_interior','winding','loose','zero_area'])
            if name!='PondEdge_Blockout':assert h['boundary']==0 and h['signed_volume']>0
        b=path.read_bytes();g=json.loads(b[20:20+int.from_bytes(b[12:16],'little')])
        if label=='refined':assert len(g['scenes'])==1
        for node in g['nodes']:
            assert not node.get('translation') or all(abs(v)<1e-6 for v in node['translation'])
            assert not node.get('scale') or all(abs(v-1)<1e-6 for v in node['scale'])
        variants[label]={'triangles':triangles,'bounds':[[min(p[i] for p in points) for i in range(3)],[max(p[i] for p in points) for i in range(3)]],
                         'feet':sorted(feet),'health':health,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),
                         'primitive_count':sum(len(m['primitives']) for m in g['meshes']),'scenes':len(g['scenes']),
                         'pond_guide':[n.get('extras',{}).get('pond_guide_v2') for n in g['nodes'] if 'pond_guide_v2' in n.get('extras',{})]}
    assert variants['baseline']['triangles']==variants['refined']['triangles']
    assert variants['baseline']['feet']==variants['refined']['feet']
    assert variants['baseline']['pond_guide']==variants['refined']['pond_guide']
    for end in range(2):
        for i in range(3):assert abs(variants['baseline']['bounds'][end][i]-variants['refined']['bounds'][end][i])<.001
    report[name]=variants
(OUT/'roundtrip-audit.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('ROUNDTRIP_PASS', {name:{variant:v['triangles'] for variant,v in variants.items()} for name,variants in report.items()})
