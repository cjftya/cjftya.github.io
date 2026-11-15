// Browser/Node Web Crypto. The private key file is the credential; no password or storage.
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const rsa = {name: 'RSA-OAEP', hash: 'SHA-256'};
const label = encoder.encode('WeddingCard v3 content key');
export function toBase64(bytes) { return btoa(String.fromCharCode(...new Uint8Array(bytes))); }
function fromBase64(value) { return Uint8Array.from(atob(value), c => c.charCodeAt(0)); }
export function pemBytes(value, kind) {
  const text = typeof value === 'string' ? value : decoder.decode(value);
  if (text.length > 16384) throw new Error('Invalid key file');
  const match = text.trim().match(new RegExp(`^-----BEGIN ${kind}-----\\s+([A-Za-z0-9+/=\\s]+)\\s+-----END ${kind}-----$`));
  if (!match) throw new Error('Invalid key file');
  return fromBase64(match[1].replace(/\s/g, ''));
}
export async function publicKeyId(publicPem) {
  const bytes = pemBytes(publicPem, 'PUBLIC KEY');
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2,'0')).join('');
}
export function validateManifest(m) {
  if (m?.version !== 3 || m.algorithm !== 'RSA-OAEP-256+A256GCM' ||
      !/^[a-f0-9]{64}$/.test(m.keyId) || !/^[A-Za-z0-9+/]{512}$/.test(m.wrappedKey) ||
      !Array.isArray(m.images) || m.images.length !== 18 || new Set(m.images).size !== 18 ||
      m.images.some(p => !/^assets\/private\/image\/(?:viewer\/)?[a-z0-9_]+\.(?:jpg|png)\.bin$/.test(p))) {
    throw new Error('Unsupported encrypted content format');
  }
  return m;
}
export async function createEnvelope(images, publicPem) {
  const publicKey = await crypto.subtle.importKey('spki', pemBytes(publicPem, 'PUBLIC KEY'), rsa, false, ['encrypt']);
  if (publicKey.algorithm.modulusLength !== 3072) throw new Error('RSA-3072 key required');
  const raw = crypto.getRandomValues(new Uint8Array(32));
  try {
    const wrappedKey = toBase64(await crypto.subtle.encrypt({name:'RSA-OAEP', label}, publicKey, raw));
    const manifest = validateManifest({version:3, algorithm:'RSA-OAEP-256+A256GCM', keyId:await publicKeyId(publicPem), wrappedKey, images});
    const key = await crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt','decrypt']);
    return {manifest,key};
  } finally {raw.fill(0);}
}
export async function openEnvelope(privatePem, manifest) {
  validateManifest(manifest);
  const bytes = pemBytes(privatePem, 'PRIVATE KEY');
  let privateKey;
  try { privateKey = await crypto.subtle.importKey('pkcs8', bytes, rsa, false, ['decrypt']); }
  finally {bytes.fill(0);}
  if (privateKey.algorithm.modulusLength !== 3072) throw new Error('RSA-3072 key required');
  const raw = new Uint8Array(await crypto.subtle.decrypt({name:'RSA-OAEP',label},privateKey,fromBase64(manifest.wrappedKey)));
  try {
    if (raw.length !== 32) throw new Error('Invalid content key');
    return await crypto.subtle.importKey('raw',raw,'AES-GCM',false,['decrypt']);
  } finally {raw.fill(0);}
}
function aad(m, path) {
  validateManifest(m);
  return encoder.encode(JSON.stringify([m.version,m.algorithm,m.keyId,m.wrappedKey,m.images,path]));
}
export async function encrypt(bytes, key, manifest, path) {
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,tagLength:128,additionalData:aad(manifest,path)},key,bytes));
  const result=new Uint8Array(16+cipher.length);
  result.set(encoder.encode('WCP3'));result.set(iv,4);result.set(cipher,16);return result;
}
export async function decrypt(bytes, key, manifest, path) {
  bytes=new Uint8Array(bytes);
  if(bytes.length<32 || decoder.decode(bytes.slice(0,4))!=='WCP3') throw new Error('Invalid encrypted file');
  return new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes.slice(4,16),tagLength:128,additionalData:aad(manifest,path)},key,bytes.slice(16)));
}
