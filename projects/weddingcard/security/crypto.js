// Shared by the browser worker and the offline Node.js migration tool.
const encoder = new TextEncoder();
export const ITERATIONS = 600000;
export function validateManifest(m) {
  if (m?.version !== 2 || m.kdf?.name !== 'PBKDF2' || m.kdf.hash !== 'SHA-256' ||
      m.kdf.iterations !== ITERATIONS || !/^[a-f0-9]{32}$/.test(m.salt) ||
      !Array.isArray(m.images) || m.images.length !== 18 || new Set(m.images).size !== 18 ||
      m.images.some(p => !/^assets\/private\/image\/(?:viewer\/)?[a-z0-9_]+\.(?:jpg|png)\.bin$/.test(p))) {
    throw new Error('Unsupported encrypted content format');
  }
  return m;
}
export function newManifest(images) {
  return validateManifest({version: 2, kdf: {name: 'PBKDF2', hash: 'SHA-256', iterations: ITERATIONS},
    salt: Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join(''), images});
}
export async function deriveKey(password, manifest) {
  validateManifest(manifest);
  if (typeof password !== 'string' || !password.trim()) throw new Error('Password required');
  const raw = encoder.encode(password);
  try {
    const material = await crypto.subtle.importKey('raw', raw, 'PBKDF2', false, ['deriveKey']);
    return await crypto.subtle.deriveKey({name: 'PBKDF2', hash: 'SHA-256', iterations: ITERATIONS,
      salt: Uint8Array.from(manifest.salt.match(/../g), h => parseInt(h, 16))},
      material, {name: 'AES-GCM', length: 256}, false, ['encrypt', 'decrypt']);
  } finally { raw.fill(0); }
}
function aad(manifest, path) {
  validateManifest(manifest);
  return encoder.encode(JSON.stringify([manifest.version, manifest.kdf.name, manifest.kdf.hash,
    manifest.kdf.iterations, manifest.salt, manifest.images, path]));
}
export async function encrypt(bytes, key, manifest, path) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = new Uint8Array(await crypto.subtle.encrypt({name: 'AES-GCM', iv, tagLength: 128,
    additionalData: aad(manifest, path)}, key, bytes));
  const result = new Uint8Array(16 + cipher.length);
  result.set(encoder.encode('WCP2')); result.set(iv, 4); result.set(cipher, 16);
  return result;
}
export async function decrypt(bytes, key, manifest, path) {
  bytes = new Uint8Array(bytes);
  if (bytes.length < 32 || new TextDecoder().decode(bytes.slice(0, 4)) !== 'WCP2') {
    throw new Error('Invalid encrypted file');
  }
  return new Uint8Array(await crypto.subtle.decrypt({name: 'AES-GCM', iv: bytes.slice(4, 16),
    tagLength: 128, additionalData: aad(manifest, path)}, key, bytes.slice(16)));
}
