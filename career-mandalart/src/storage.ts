// DB 대신 기기 로컬 저장소(AsyncStorage)에 JSON 문자열 하나로 보관한다.
// iOS: 앱 샌드박스 파일, Android: 앱 전용 저장소, Web: localStorage.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isStore, samplePlan, Store } from './model';

export const STORE_KEY = 'career-mandalart/store/v1';
const KEY = STORE_KEY;

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
  if (!isStore(parsed)) throw new Error('구도 백업 코드가 아니에요. 처음부터 끝까지 빠짐없이 붙여넣었는지 확인해 주세요.');
  const byId = new Map(current.plans.map(p => [p.id, p]));
  parsed.plans.forEach(p => byId.set(p.id, p));
  // 사용자 카테고리 항목도 합치고, 연령대 설정은 현재 기기 것을 유지
  const custom = { ...parsed.custom, ...current.custom };
  for (const [k, v] of Object.entries(parsed.custom ?? {})) {
    custom[k] = [...new Set([...(current.custom?.[k] ?? []), ...v])];
  }
  // 일정도 같은 id 는 덮어쓴다
  const events = new Map((current.events ?? []).map(e => [e.id, e]));
  parsed.events?.forEach(e => events.set(e.id, e));
  return { ...current, plans: [...byId.values()], custom, ...(events.size ? { events: [...events.values()] } : {}) };
}
