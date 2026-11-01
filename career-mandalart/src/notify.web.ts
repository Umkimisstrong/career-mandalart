// 반복 점검 알림 — 웹(iPhone 홈 화면 앱 포함).
// 서버가 없으니 앱이 닫혀 있을 때 알림을 보낼 수 없다. 그래서
//  1) 앱이 열려 있는 동안: 알림 시각에 브라우저 알림
//  2) 홈 화면 앱 아이콘: 오늘 남은 점검 수 배지 (지원하는 브라우저만)
//  3) 닫혀 있을 때: 캘린더 파일(.ics)을 기기 캘린더에 등록해 캘린더가 알림을 울린다 (exportCalendar)
import { RoutineItem, routineLabel, upcoming } from './routine';

export const NOTIFY_KIND: 'native' | 'web' = 'web';

let timers: ReturnType<typeof setTimeout>[] = [];
const supported = () => typeof window !== 'undefined' && 'Notification' in window;

export async function notifyGranted(): Promise<boolean> {
  return supported() && Notification.permission === 'granted';
}

export async function requestNotify(): Promise<boolean> {
  if (!supported()) return false;
  return (await Notification.requestPermission()) === 'granted';
}

// 서비스 워커(sw.js)가 있으면 그쪽으로 띄운다 — iPhone 홈 화면 앱 · Android 는 서비스 워커 알림만 허용
async function show(title: string, opts: NotificationOptions) {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) return await reg.showNotification(title, opts);
    new Notification(title, opts);
  } catch { /* 알림을 띄울 수 없는 환경 */ }
}

type BadgeNavigator = Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };

export async function syncReminders(items: RoutineItem[], enabled: boolean, remainingToday: number): Promise<number> {
  timers.forEach(clearTimeout);
  timers = [];
  const nav = navigator as BadgeNavigator;
  const granted = await notifyGranted();
  try {
    if (enabled && granted && remainingToday > 0) await nav.setAppBadge?.(remainingToday);
    else await nav.clearAppBadge?.();
  } catch { /* 배지를 지원하지 않는 브라우저 */ }
  if (!enabled || !granted) return 0;
  // 열려 있는 동안 24시간 안의 알림만 타이머로
  const soon = upcoming(items, new Date(), 2).filter(u => +u.at - Date.now() < 24 * 3600 * 1000);
  for (const { at, item } of soon) {
    timers.push(setTimeout(() => {
      show(`🔁 ${routineLabel(item.routine)}`, { body: item.text, tag: `${item.planId}-${item.block}-${item.cell}`, icon: '/icon-192.png' });
    }, +at - Date.now()));
  }
  return soon.length;
}

// 파일로 받는다 — iPhone Safari: 다운로드 목록에서 파일을 누르면 「모두 추가」로 캘린더에 들어간다.
// (공유 시트에는 캘린더가 없어서 쓰지 않는다) PC: 받은 파일을 Google · Outlook 캘린더에서 가져오기
export async function exportCalendar(text: string): Promise<void> {
  const name = 'gudo-routine.ics';
  const file = new File([text], name, { type: 'text/calendar' });
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
