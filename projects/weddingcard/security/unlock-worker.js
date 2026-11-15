import { validateManifest, deriveKey, decrypt } from './crypto.js';
let blobs = new Map();
async function read(path) {
  const response = await fetch(new URL('../' + path, import.meta.url), {cache: 'no-store'});
  if (!response.ok) throw new Error('Resource unavailable');
  return response;
}
self.onmessage = async ({data}) => {
  try {
    if (data.type === 'unlock') {
      blobs.clear();
      const manifest = validateManifest(await (await read('protected/manifest.json')).json());
      const key = await deriveKey(data.password, manifest);
      data.password = '';
      const bytes = await decrypt(await (await read('protected/content.bin')).arrayBuffer(), key, manifest, 'content');
      let content;
      try { content = JSON.parse(new TextDecoder().decode(bytes)); } finally { bytes.fill(0); }
      // Authenticate every image before starting any legacy code or revealing content.
      for (let i = 0; i < manifest.images.length; i++) {
        const path = manifest.images[i];
        const plain = await decrypt(await (await read('protected/' + path)).arrayBuffer(), key, manifest, path);
        blobs.set(path, new Blob([plain], {type: path.includes('.png') ? 'image/png' : 'image/jpeg'}));
        plain.fill(0);
        self.postMessage({type: 'progress', value: i + 1, total: manifest.images.length});
      }
      self.postMessage({type: 'unlocked', content});
    } else if (data.imgUrl && blobs.has(data.imgUrl)) {
      self.postMessage({imgUrl: data.imgUrl, blob: blobs.get(data.imgUrl)});
      blobs.delete(data.imgUrl);
      if (!blobs.size) self.close();
    } else { throw new Error('Unknown resource'); }
  } catch {
    blobs.clear();
    self.postMessage({type: 'error'});
  } finally { if (data.type === 'unlock') data.password = ''; }
};
