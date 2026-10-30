// DB 대신 기기 로컬 저장소(AsyncStorage)에 JSON 문자열 하나로 보관한다.
// iOS: 앱 샌드박스 파일, Android: 앱 전용 저장소, Web: localStorage.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isStore, samplePlan, Store } from './model';

const KEY = 'career-mandalart/store/v1';

export async function loadStore(): Promise<Store> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isStore(parsed)) return parsed;
    }
  } catch {
    // 손상된 데이터면 아래 기본값으로 시작
  }
  return { version: 1, plans: [samplePlan()] };
}

export async function saveStore(store: Store): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(store));
}

export function exportJson(store: Store): string {
  return JSON.stringify(store, null, 2);
}

// 붙여넣은 JSON 을 검증해 기존 계획과 병합(같은 id 는 덮어씀)
export function importJson(current: Store, text: string): Store {
  const parsed = JSON.parse(text);
  if (!isStore(parsed)) throw new Error('만다라트 백업 형식이 아닙니다.');
  const byId = new Map(current.plans.map(p => [p.id, p]));
  parsed.plans.forEach(p => byId.set(p.id, p));
  return { version: 1, plans: [...byId.values()] };
}
