import { validateManifest, openEnvelope, decrypt } from './crypto.js?v=3.1';
const blobs = new Map();
async function read(path, json=false) {
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),20000);
  try {
    const response=await fetch(new URL('../'+path,import.meta.url),{cache:'no-store',signal:controller.signal});
    if(!response.ok)throw new Error('Resource unavailable');
    return json ? await response.json() : await response.arrayBuffer();
  } finally {clearTimeout(timer);}
}
self.onmessage=async({data})=>{
  let stage='network';
  try{
    if(data.type==='unlock'){
      blobs.clear();
      const rawManifest=await read('protected/manifest.json',true);
      stage='manifest';const manifest=validateManifest(rawManifest);
      stage='wrong_key';const key=await openEnvelope(new Uint8Array(data.keyFile),manifest);
      new Uint8Array(data.keyFile).fill(0);
      stage='network';const encrypted=await read('protected/content.bin');
      stage='authentication';const bytes=await decrypt(encrypted,key,manifest,'content');
      let content;
      try{content=JSON.parse(new TextDecoder().decode(bytes));}finally{bytes.fill(0);}
      for(let i=0;i<manifest.images.length;i++){
        const path=manifest.images[i];
        stage='network';const cipher=await read('protected/'+path);
        stage='authentication';const plain=await decrypt(cipher,key,manifest,path);
        blobs.set(path,new Blob([plain],{type:path.includes('.png')?'image/png':'image/jpeg'}));plain.fill(0);
        self.postMessage({type:'progress',value:i+1,total:manifest.images.length});
      }
      self.postMessage({type:'unlocked',content});
    }else if(data.imgUrl&&blobs.has(data.imgUrl)){
      self.postMessage({imgUrl:data.imgUrl,blob:blobs.get(data.imgUrl)});blobs.delete(data.imgUrl);
      if(!blobs.size)self.close();
    }else{throw new Error('Unknown resource');}
  }catch{
    blobs.clear();self.postMessage({type:'error',code:stage});
  }finally{if(data.type==='unlock')new Uint8Array(data.keyFile).fill(0);}
};
