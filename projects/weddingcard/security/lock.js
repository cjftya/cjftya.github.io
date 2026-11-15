import { inspectKeyFile, keyFileErrorMessage } from './key-file.js?v=1';
// Keep key selection unavailable when embedded, including sandboxed frames.
if (window.top !== window.self) {
  document.body.replaceChildren();
  throw new Error('Open Wedding Card in a standalone tab.');
}
document.body.hidden = false;
const form = document.querySelector('#unlock-form');
const input = document.querySelector('#key-file');
const status = document.querySelector('#status');
const urls = new Set();
let worker;
let starting = false;
function trackURL(blob) { const url = URL.createObjectURL(blob); urls.add(url); return url; }
function cleanup() { worker?.terminate(); for (const url of urls) URL.revokeObjectURL(url); urls.clear(); input.value = ''; }
window.addEventListener('pagehide', cleanup);
window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
async function script(src) {
  return new Promise((resolve, reject) => {
    const element = document.createElement('script'); element.src = src;
    element.onload = resolve; element.onerror = reject; document.head.append(element);
  });
}
async function activate(content) {
  starting = true;
  const container = document.createElement('div');
  container.innerHTML = content.body;
  for (const image of container.querySelectorAll('img')) image.loading = 'eager';
  document.body.append(container);
  // The existing loader consumes this worker; it never receives a private key.
  window.WeddingResources = {worker, trackURL};
  await script('security/viewer.min.js');
  for (const entry of content.scripts) {
    if (entry.code !== undefined) {
      const url = trackURL(new Blob([entry.code], {type: 'text/javascript'}));
      await script(url); URL.revokeObjectURL(url); urls.delete(url);
    } else { await script(entry.src); }
  }
  // Load p5 last so its global-mode bootstrap sees the original lifecycle callbacks.
  await script('../../shared/lib/p5.min.js');
  document.querySelector('#lock').remove();
}
function fail(code) {
  cleanup();
  if (starting) {
    status.textContent = '초대장을 시작하지 못했어요. 새로고침 후 다시 시도해 주세요.';
    return;
  }
  status.textContent = keyFileErrorMessage(code);
  for (const element of form.elements) element.disabled = false;
  input.focus();
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  const file = input.files[0];
  if (!file) { status.textContent = '개인키 파일을 선택해 주세요.'; input.focus(); return; }
  if (file.size > 16384 || file.size < 256) { status.textContent = 'weddingcard-private.pem 파일을 선택해 주세요. ZIP은 압축을 풀어야 해요.'; input.value = ''; return; }
  if (!window.crypto?.subtle || !window.Worker) { status.textContent = '최신 브라우저의 HTTPS 또는 localhost에서 열어 주세요.'; return; }
  for (const element of form.elements) element.disabled = true;
  status.textContent = '안전하게 초대장을 여는 중이에요…';
  let keyFile;
  try { keyFile = await file.arrayBuffer(); }
  catch { fail('file_read'); return; }
  input.value = '';
  const formatError = inspectKeyFile(keyFile);
  if (formatError) { new Uint8Array(keyFile).fill(0); fail(formatError); return; }
  try {
    worker?.terminate();
    worker = new Worker(new URL('./unlock-worker.js?v=3.1', import.meta.url), {type: 'module'});
    worker.onerror = () => fail('worker');
    worker.onmessageerror = () => fail('worker');
    worker.onmessage = ({data}) => {
      if (data.type === 'progress') status.textContent = `사진 확인 중 ${data.value}/${data.total}`;
      if (data.type === 'error') fail(data.code);
      if (data.type === 'unlocked') { worker.onmessage = null; activate(data.content).catch(() => fail('initialization')); }
    };
    worker.postMessage({type: 'unlock', keyFile}, [keyFile]);
  } catch {
    if (keyFile.byteLength) new Uint8Array(keyFile).fill(0);
    fail('worker');
  }
});
