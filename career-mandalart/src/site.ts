// 앱 주소 — 링크 · 캘린더 파일 · 공유 QR 이 쓴다. 바꾸면 desktop/main.cjs 의 BASE 도 같이.
import { inflateSync, strFromU8 } from 'fflate';

export const APP_URL = 'https://gudo.pages.dev';
// 2026-11 까지 쓰던 주소. 지금은 이사 안내 화면(moved/index.html)이 새 주소로 넘겨 준다.
export const OLD_URL = 'https://career-mandalart.vercel.app';

// 옛 주소의 「새 주소로 옮기기」가 이 기기의 저장 데이터를 주소 # 뒤(서버로 안 가는 부분)에 실어 보낸다.
//   #move=<deflate-raw → base64url>  ·  #move0=<UTF-8 → base64url> (압축을 못 하는 브라우저)
// 읽으면 주소에서 지우고 JSON 문자열을 돌려준다. 없거나 깨졌으면 null.
export function takeMove(): string | null {
  if (typeof location === 'undefined') return null;
  const m = /^#(move0?)=(.+)$/.exec(location.hash);
  if (!m) return null;
  history.replaceState(null, '', location.pathname + location.search);
  try {
    const bin = atob(m[2].replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = Uint8Array.from(bin, ch => ch.charCodeAt(0));
    return strFromU8(m[1] === 'move' ? inflateSync(bytes) : bytes);
  } catch {
    return null;
  }
}
