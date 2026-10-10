import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
const out='artifacts/jelly-oasis/modeling-review-before-crystal-v1/';
const base='http://127.0.0.1:4183/projects/jelly-oasis/';
const asset='public/assets/jelly-oasis/landmarks/overgrown-ruin/';
const layout=JSON.parse(await readFile(asset+'layout.json','utf8'));
const detail=['Ruin_Arch_A','Ruin_Wall_A','Ruin_BrokenWall_A','Root_Large_A','Root_Tree_Base_Blockout','Cliff_Waterfall_A'];
const modules=[];
for(const m of layout.modules){
 const file=m.name==='Tree_Landmark_Blockout'?'Tree_Landmark_Detail_v1.glb':m.name==='PondEdge_Blockout'?'PondEdge_Blockout_Detail_v2.glb':detail.includes(m.name)?m.name+'_Detail_v1.glb':m.name+'.glb';
 const b=await readFile(asset+file), g=JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)));
 let triangles=0,bad=0,degenerate=0,flat=0,total=0;
 const bin=20+b.readUInt32LE(12)+8;
 const get=(a,i,c=0)=>{const ac=g.accessors[a],v=g.bufferViews[ac.bufferView],sz=ac.componentType===5126||ac.componentType===5125?4:ac.componentType===5123?2:1;const n={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[ac.type];const p=bin+(v.byteOffset??0)+(ac.byteOffset??0)+i*(v.byteStride??sz*n)+c*sz;return ac.componentType===5126?b.readFloatLE(p):ac.componentType===5125?b.readUInt32LE(p):ac.componentType===5123?b.readUInt16LE(p):b.readUInt8(p)};
 for(const mesh of g.meshes)for(const p of mesh.primitives){const count=p.indices===undefined?g.accessors[p.attributes.POSITION].count:g.accessors[p.indices].count;triangles+=count/3;for(let i=0;i<count;i+=3){const ids=[0,1,2].map(k=>p.indices===undefined?i+k:get(p.indices,i+k));const pts=ids.map(id=>[0,1,2].map(c=>get(p.attributes.POSITION,id,c)));if(pts.flat().some(v=>!Number.isFinite(v)))bad++;const a=pts[1].map((v,c)=>v-pts[0][c]),d=pts[2].map((v,c)=>v-pts[0][c]);if(Math.hypot(a[1]*d[2]-a[2]*d[1],a[2]*d[0]-a[0]*d[2],a[0]*d[1]-a[1]*d[0])<1e-9)degenerate++;if(p.attributes.NORMAL!==undefined){const ns=ids.map(id=>[0,1,2].map(c=>get(p.attributes.NORMAL,id,c)));if(ns[0].every((v,c)=>Math.abs(v-ns[1][c])<1e-5&&Math.abs(v-ns[2][c])<1e-5))flat++;}total++;}}
 modules.push({name:m.name,file,triangles,bad,degenerate,flatNormalTriangles:flat,totalTriangles:total,materials:g.materials?.map(m=>({name:m.name,...m.pbrMetallicRoughness,doubleSided:m.doubleSided,alphaMode:m.alphaMode})),nodes:g.nodes,anchor:m.position});
}
await writeFile(out+'glb-audit.json',JSON.stringify(modules,null,2));
const browser=await chromium.launch({channel:'msedge',headless:true});
const errors=[],responses=[],views={};
const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),page=await context.newPage();
page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('response',r=>{if(r.url().endsWith('.glb'))responses.push({url:r.url(),status:r.status()})});
const snap=()=>page.evaluate(()=>window.__oasisLandmark.snapshot());
async function capture(name){await page.evaluate(()=>document.querySelectorAll('details').forEach(e=>e.open=false));await page.waitForTimeout(300);await page.screenshot({path:out+name+'.png'});views[name]=await snap();}
async function env(t,w){await page.evaluate(([t,w])=>{for(const [id,v,event] of [['environment-time',t,'input'],['environment-weather',w,'change']]){const e=document.getElementById(id);e.value=String(v);e.dispatchEvent(new Event(event,{bubbles:true}))}},[t,w]);await page.waitForFunction(w=>window.__oasisLandmark.snapshot().weather===w&&window.__oasisLandmark.snapshot().weatherBlend===1,w)}
try{
 await page.goto(base);await page.locator('#landmark-status').waitFor({state:'hidden'});await page.waitForTimeout(800);const production={debug:await page.evaluate(()=>'__oasisLandmark' in window),responses:[...responses]};await page.screenshot({path:out+'production-default.png'});
 await page.goto(base+'?debug');await page.waitForFunction(()=>window.__oasisLandmark?.snapshot().calls>10);await env(12,'CLEAR');
 const audit=await page.evaluate(()=>window.__oasisLandmark.audit());
 for(const view of ['overview','medium','ground']){await page.locator('#landmark-debug').evaluate(e=>e.open=true);await page.locator('[data-view='+view+']').click();await capture(view)}
 const s=await snap(),c=Math.cos(Math.PI/6),w=([x,y,z],h)=>[70+x*c+z*.5,h+y,58-x*.5+z*c];
 const cameras={
 'cliff-front':[[0,8,8],[0,8,-12],s.contact.Cliff_Waterfall_A.y],
 'arch':[[15,2,6],[15,4.4,-7],s.contact.Ruin_Arch_A.y],
 'tree-under':[[-30,1.8,6],[-12,13,-18],s.contact.Tree_Landmark_Blockout.y],
 'root-ruin':[[-29,8,0],[-12,4,-8],s.contact.Ruin_Wall_A.y],
 'pond-top':[[0,35,7],[0,0,7],s.pondHeight],
 'pond-waterfall-facing':[[82,1,93],[66,-3,50],null],
 'crystal-ground':[[21,2,26],[15,1.5,19],s.contact.Crystal_Blockout_A.y]
 };
 for(const [name,[pos,target,h]]of Object.entries(cameras)){await page.evaluate(([p,t])=>window.__oasisLandmark.reviewCamera(p,t),h===null?[pos,target]:[w(pos,h),w(target,h)]);await capture(name)}
 await page.locator('#landmark-debug').evaluate(e=>e.open=true);await page.locator('[data-view=medium]').click();await env(0,'CLEAR');await capture('night');await env(12,'RAIN');await capture('rain');await env(12,'CLEAR');
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),p=await mobile.newPage();await p.goto(base+'?debug');await p.waitForFunction(()=>window.__oasisLandmark?.snapshot().calls>10);for(const view of ['overview','medium']){await p.locator('#landmark-debug').evaluate(e=>e.open=true);await p.locator('[data-view='+view+']').click();await p.evaluate(()=>document.querySelectorAll('details').forEach(e=>e.open=false));await p.waitForTimeout(300);await p.screenshot({path:out+'mobile-'+view+'.png'});views['mobile-'+view]=await p.evaluate(()=>window.__oasisLandmark.snapshot())}await mobile.close();
 await writeFile(out+'review-browser.json',JSON.stringify({production,audit,views,errors,responses},null,2));
 console.log(JSON.stringify({modules:modules.map(m=>({name:m.name,triangles:m.triangles,degenerate:m.degenerate,flat:m.flatNormalTriangles})),audit,errors,productionAssets:production.responses.length}));
}finally{await browser.close()}
