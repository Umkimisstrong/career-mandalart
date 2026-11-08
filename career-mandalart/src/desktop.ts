// Windows 데스크톱 앱(desktop/ 의 Electron 껍데기)과 주고받는 다리. 브라우저 · 모바일에서는 undefined.
// 데스크톱 앱이 preload 로 window.gudoDesktop 을 넣어 준다 — desktop/preload.cjs 와 짝을 맞춘다.
import { Platform } from 'react-native';

export type DesktopBridge = {
  // 띄워 둘 목표 id 목록이 바뀌면 알려 준다 → 데스크톱 앱이 작은 창을 열고 닫는다
  setWidgets: (ids: string[]) => void;
  // 작은 창이 자기 내용 크기(CSS px)를 알려 준다
  resize: (width: number, height: number) => void;
  // 작은 창에서 칸을 누르면 큰 창에서 그 목표 · 블록을 연다
  open: (planId: string, block: number | null) => void;
  // 큰 창: 위 open 요청을 받는다
  onOpen: (cb: (planId: string, block: number | null) => void) => void;
  // 큰 창: 작은 창 메뉴에서 「바탕화면에서 내리기」를 누르면 목록 체크를 푼다
  onUnpin: (cb: (planId: string) => void) => void;
};

export const desktop: DesktopBridge | undefined =
  Platform.OS === 'web' && typeof window !== 'undefined' ? (window as unknown as { gudoDesktop?: DesktopBridge }).gudoDesktop : undefined;

// 작은 창 모드 — 주소 ?widget=<목표 id>
export const WIDGET_ID: string | null =
  Platform.OS === 'web' && typeof location !== 'undefined' ? new URLSearchParams(location.search).get('widget') : null;
