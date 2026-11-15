// Format checks only; possession is verified cryptographically inside the worker.
export function inspectKeyFile(buffer) {
  const bytes = new Uint8Array(buffer);
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) return 'archive';
  let text;
  try { text = new TextDecoder('utf-8', {fatal:true}).decode(bytes).trim(); }
  catch { return 'invalid_key'; }
  if (text.startsWith('-----BEGIN ENCRYPTED PRIVATE KEY-----')) return 'encrypted_key';
  if (text.startsWith('-----BEGIN PUBLIC KEY-----')) return 'public_key';
  if (!/^-----BEGIN PRIVATE KEY-----\s+[A-Za-z0-9+/=\s]+\s+-----END PRIVATE KEY-----$/.test(text)) return 'invalid_key';
  return null;
}
export function keyFileErrorMessage(code) {
  const messages = {
    archive:'ZIP 압축파일은 사용할 수 없어요. 압축을 풀고 weddingcard-private.pem을 선택해 주세요.',
    encrypted_key:'비밀번호가 있는 예전 키 파일이에요. 새로 받은 weddingcard-private.pem을 선택해 주세요.',
    public_key:'공개키 파일이에요. weddingcard-private.pem을 선택해 주세요.',
    invalid_key:'개인키 파일 형식이 맞지 않아요. weddingcard-private.pem 원본 파일을 선택해 주세요.',
    file_read:'선택한 파일을 읽지 못했어요. 기기에 다운로드한 개인키 파일을 다시 선택해 주세요.',
    wrong_key:'이 초대장과 일치하지 않는 개인키예요. 전달받은 weddingcard-private.pem을 확인해 주세요.',
    network:'초대장 파일을 불러오지 못했어요. 연결 상태를 확인하고 다시 시도해 주세요.',
    manifest:'페이지와 암호화 데이터의 버전이 맞지 않아요. 페이지를 새로고침해 주세요.',
    authentication:'초대장 파일의 인증에 실패했어요. 페이지를 새로고침하고 다시 시도해 주세요.',
    worker:'복호화 기능을 시작하지 못했어요. 앱 안의 브라우저라면 외부 브라우저에서 페이지를 열어 주세요.'
  };
  return messages[code] || '초대장을 열지 못했어요. 페이지를 새로고침하고 다시 시도해 주세요.';
}
