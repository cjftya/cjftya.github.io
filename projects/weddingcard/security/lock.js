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
function fail() {
  cleanup();
  if (starting) {
    status.textContent = '초대장을 시작하지 못했어요. 새로고침 후 다시 시도해 주세요.';
    return;
  }
  status.textContent = '열지 못했어요. 개인키 파일과 연결 상태를 확인해 주세요. 파일이 손상된 경우에도 열 수 없어요.';
  for (const element of form.elements) element.disabled = false;
  input.focus();
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  const file = input.files[0];
  if (!file) { status.textContent = '개인키 파일을 선택해 주세요.'; input.focus(); return; }
  if (file.size > 16384 || file.size < 256) { status.textContent = '올바른 개인키 파일을 선택해 주세요.'; input.value = ''; return; }
  if (!window.crypto?.subtle || !window.Worker) { status.textContent = '최신 브라우저의 HTTPS 또는 localhost에서 열어 주세요.'; return; }
  for (const element of form.elements) element.disabled = true;
  status.textContent = '안전하게 초대장을 여는 중이에요…';
  worker?.terminate(); worker = new Worker(new URL('./unlock-worker.js', import.meta.url), {type: 'module'});
  worker.onerror = fail;
  worker.onmessage = ({data}) => {
    if (data.type === 'progress') status.textContent = `사진 확인 중 ${data.value}/${data.total}`;
    if (data.type === 'error') fail();
    if (data.type === 'unlocked') { worker.onmessage = null; activate(data.content).catch(fail); }
  };
  try {
    const keyFile = await file.arrayBuffer();
    input.value = '';
    worker.postMessage({type: 'unlock', keyFile}, [keyFile]);
  } catch { fail(); }
});
