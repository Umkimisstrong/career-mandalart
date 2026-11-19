// 웹 · Windows 앱: 글 파일 내려받기 · 클립보드 복사
export async function saveText(name: string, text: string, type = 'text/plain'): Promise<void> {
  const url = URL.createObjectURL(new File([text], name, { type: `${type};charset=utf-8` }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* 권한 · 포커스 없음 → 예전 방식 */ }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  try { return document.execCommand('copy'); } catch { return false; } finally { area.remove(); }
}
