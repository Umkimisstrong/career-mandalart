// 반복 점검 알림 — iOS · Android: 기기 로컬 알림 (서버 없음).
// 앞으로 35일의 알림을 하나씩 예약하고, 체크한 기간의 알림은 빼고 다시 예약한다 (iOS 예약 한도 64개 → 60개까지).
// 웹은 notify.web.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { RoutineItem, routineLabel, upcoming } from './routine';

export const NOTIFY_KIND: 'native' | 'web' = 'native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: true,
  }),
});

export async function notifyGranted(): Promise<boolean> {
  return (await Notifications.getPermissionsAsync()).granted;
}

export async function requestNotify(): Promise<boolean> {
  return (await Notifications.requestPermissionsAsync()).granted;
}

export async function syncReminders(items: RoutineItem[], enabled: boolean, remainingToday: number): Promise<number> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!enabled || !(await notifyGranted())) {
    await Notifications.setBadgeCountAsync(0).catch(() => {});
    return 0;
  }
  await Notifications.setBadgeCountAsync(remainingToday).catch(() => {});
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('routine', {
      name: '반복 점검', importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const list = upcoming(items);
  for (const { at, item } of list) {
    await Notifications.scheduleNotificationAsync({
      content: { title: `🔁 ${routineLabel(item.routine)}`, body: item.text, data: { planId: item.planId } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: 'routine' },
    });
  }
  return list.length;
}

// 캘린더 파일 내보내기는 웹 전용 (네이티브는 로컬 알림이 직접 울린다)
export async function exportCalendar(_text: string): Promise<void> {}
