import { StatusBar } from 'expo-status-bar';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import InstallBanner from './src/components/InstallBanner';
import { buildPlan } from './src/categories/templates';
import { Cell, getCell, ohtaniPlan, Plan, setCell, Store } from './src/model';
import { syncReminders } from './src/notify';
import { decodePlan } from './src/qr/codec';
import { pickQrFromImage } from './src/qr/image';
import About from './src/screens/About';
import Backup from './src/screens/Backup';
import BlockEditor from './src/screens/BlockEditor';
import Overview from './src/screens/Overview';
import PlanList, { Home } from './src/screens/PlanList';
import QrScan from './src/screens/QrScan';
import QrShare from './src/screens/QrShare';
import Story from './src/screens/Story';
import Templates from './src/screens/Templates';
import ThemeSettings from './src/screens/ThemeSettings';
import Today from './src/screens/Today';
import { routineItems, toggleKey } from './src/routine';
import { desktop, WIDGET_ID } from './src/desktop';
import WidgetApp from './src/screens/Widget';
import { loadStore, saveStore, STORE_KEY } from './src/storage';
import { buildTheme, isDark, ThemeProvider } from './src/theme';
import type { AgeBand } from './src/categories/data';

type Route =
  | { name: 'list' }
  | { name: 'backup' }
  | { name: 'scan' }
  | { name: 'theme' }
  | { name: 'story'; from: 'about' | 'templates' }
  | { name: 'about' }
  | { name: 'templates'; age?: AgeBand }
  | { name: 'today' }
  | { name: 'qr'; id: string }
  | { name: 'plan'; id: string; block: number | null };

// ?widget=<id> 로 열리면 작은 창만 그린다 (저장은 하지 않고 큰 창이 저장한 것을 읽기만)
export default function Root() {
  return WIDGET_ID ? <WidgetApp id={WIDGET_ID} /> : <App />;
}

function App() {
  const [store, setStore] = useState<Store | null>(null);
  const [route, setRoute] = useState<Route>({ name: 'list' });
  const [notice, setNotice] = useState<{ text: string; error?: boolean }>();
  // 메인 화면의 탭 · 목록 필터 — 다른 화면에 다녀와도 유지
  const [home, setHome] = useState<Home>({ tab: 'list', filter: 'all' });
  const loaded = useRef(false);
  const theme = useMemo(() => buildTheme(store?.theme), [store?.theme]);

  useEffect(() => {
    loadStore().then(s => { loaded.current = true; setStore(s); });
  }, []);

  // 다른 창(바탕화면 작은 창)이 저장하면 다시 읽는다 — 같은 내용을 다시 저장해도 이벤트는 생기지 않는다
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onStorage = (e: StorageEvent) => { if (e.key === STORE_KEY) loadStore().then(setStore); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // 변경될 때마다 자동 저장
  useEffect(() => {
    if (store && loaded.current) saveStore(store);
  }, [store]);

  const updatePlan = (id: string, fn: (p: Plan) => Plan) =>
    setStore(s => s && { ...s, plans: s.plans.map(p => (p.id === id ? fn(p) : p)) });

  // 반복 점검 칸의 기간 체크를 켜고 끈다
  const toggleRoutine = (id: string, b: number, c: number, key: string) =>
    updatePlan(id, p => setCell(p, b, c, { log: toggleKey(getCell(p, b, c).log, key) }));

  // 데스크톱 앱: 띄워 둘 목표 목록을 알려 주고, 작은 창에서 누른 칸을 큰 창에서 연다
  useEffect(() => {
    if (store) desktop?.setWidgets((store.widget ?? []).filter(id => store.plans.some(p => p.id === id)));
  }, [store?.widget, store?.plans]);
  useEffect(() => {
    // id 가 비어 있으면 홈(목록)
    desktop?.onOpen((id, block) => setRoute(id ? { name: 'plan', id, block } : { name: 'list' }));
    desktop?.onUnpin(id => setStore(s => s && { ...s, widget: s.widget?.filter(w => w !== id) }));
  }, []);

  // 반복 점검이 바뀌면 알림 · 배지를 다시 맞춘다 (자주 바뀌니 잠깐 모았다가)
  useEffect(() => {
    if (!store) return;
    const timer = setTimeout(() => {
      const items = routineItems(store.plans);
      const remaining = items.filter(i => i.scope === 'day' && i.dueToday && !i.stats.checked).length;
      syncReminders(items, !!store.notify, remaining).catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [store?.plans, store?.notify]);

  // 새 목표를 목록에 추가하고 바로 펼친다 (만들기 · 템플릿 · QR)
  const addPlan = (plan: Plan) => {
    setStore(s => s && { ...s, plans: [...s.plans, plan] });
    setNotice(undefined);
    setHome(h => ({ ...h, tab: 'list' }));
    setRoute({ name: 'plan', id: plan.id, block: null });
  };

  const scanQr = async () => {
    if (Platform.OS !== 'web') return setRoute({ name: 'scan' });
    try {
      const text = await pickQrFromImage();
      if (text) addPlan(decodePlan(text));
    } catch (e) {
      setNotice({ text: (e as Error).message, error: true });
    }
  };

  let screen: ReactNode = <ActivityIndicator style={{ marginTop: 80 }} />;

  if (store) {
    if (route.name === 'list') {
      screen = (
        <PlanList
          plans={store.plans}
          home={home}
          onHome={h => { setHome(h); setNotice(undefined); }}
          age={store.age}
          onOpen={id => setRoute({ name: 'plan', id, block: null })}
          onCreate={(title, size, tpl) => {
            if (tpl && tpl !== 'ohtani' && !store.age) setStore(s => s && { ...s, age: tpl });
            addPlan(buildPlan(title, size, tpl));
          }}
          onDelete={id => setStore({ ...store, plans: store.plans.filter(p => p.id !== id), widget: store.widget?.filter(w => w !== id) })}
          widget={desktop ? store.widget ?? [] : undefined}
          onWidget={id => setStore(s => s && {
            ...s, widget: s.widget?.includes(id) ? s.widget.filter(w => w !== id) : [...(s.widget ?? []), id],
          })}
          onBackup={() => setRoute({ name: 'backup' })}
          onScanQr={scanQr}
          onTheme={() => setRoute({ name: 'theme' })}
          onAbout={() => setRoute({ name: 'about' })}
          onTemplates={age => setRoute({ name: 'templates', age })}
          onToday={() => setRoute({ name: 'today' })}
          notice={notice}
        />
      );
    } else if (route.name === 'backup') {
      screen = (
        <Backup
          store={store}
          onBack={() => setRoute({ name: 'list' })}
          onImport={(next, ids) => {
            setStore(next);
            // 하나면 그 목표를 바로 펼치고, 여러 개면 전체 목록으로
            setHome({ tab: 'list', filter: 'all' });
            setNotice({ text: `백업 코드에서 목표 ${ids.length}개를 불러왔어요.` });
            setRoute(ids.length === 1 ? { name: 'plan', id: ids[0], block: null } : { name: 'list' });
          }}
        />
      );
    } else if (route.name === 'today') {
      screen = (
        <Today
          plans={store.plans}
          notify={!!store.notify}
          onBack={() => setRoute({ name: 'list' })}
          onToggle={toggleRoutine}
          onOpenBlock={(id, block) => setRoute({ name: 'plan', id, block })}
          onNotify={on => setStore(s => s && { ...s, notify: on })}
        />
      );
    } else if (route.name === 'templates') {
      screen = (
        <Templates
          age={route.age ?? store.age}
          onBack={() => setRoute({ name: 'list' })}
          onUse={(p, age) => {
            setStore(s => s && { ...s, age: s.age ?? age });
            addPlan(p);
          }}
          onStory={() => setRoute({ name: 'story', from: 'templates' })}
          onOhtani={() => addPlan(ohtaniPlan())}
        />
      );
    } else if (route.name === 'about') {
      screen = <About onBack={() => setRoute({ name: 'list' })} onStory={() => setRoute({ name: 'story', from: 'about' })} />;
    } else if (route.name === 'story') {
      screen = (
        <Story
          onBack={() => setRoute(route.from === 'templates' ? { name: 'templates' } : { name: 'about' })}
          onStart={() => addPlan(ohtaniPlan())}
        />
      );
    } else if (route.name === 'theme') {
      screen = (
        <ThemeSettings
          setting={store.theme}
          onBack={() => setRoute({ name: 'list' })}
          onChange={theme => setStore(s => s && { ...s, theme })}
        />
      );
    } else if (route.name === 'scan') {
      screen = <QrScan onBack={() => setRoute({ name: 'list' })} onImport={addPlan} />;
    } else if (route.name === 'qr') {
      const plan = store.plans.find(p => p.id === route.id);
      if (plan) {
        screen = <QrShare plan={plan} onBack={() => setRoute({ name: 'plan', id: plan.id, block: null })} />;
      }
    } else {
      const plan = store.plans.find(p => p.id === route.id);
      if (!plan) {
        queueMicrotask(() => setRoute({ name: 'list' }));
      } else if (route.block === null) {
        screen = (
          <Overview
            plan={plan}
            onBack={() => setRoute({ name: 'list' })}
            onRename={title => updatePlan(plan.id, p => ({ ...p, title, updatedAt: Date.now() }))}
            onOpenBlock={block => setRoute({ ...route, block })}
            onQr={() => setRoute({ name: 'qr', id: plan.id })}
          />
        );
      } else {
        screen = (
          <BlockEditor
            plan={plan}
            block={route.block}
            onBack={() => setRoute({ ...route, block: null })}
            onChangeBlock={block => setRoute({ ...route, block })}
            onEdit={(b, c, patch: Partial<Cell>) => updatePlan(plan.id, p => setCell(p, b, c, patch))}
            age={store.age}
            custom={store.custom ?? {}}
            onAge={age => setStore(s => s && { ...s, age })}
            onAddCustom={(catId, label) => setStore(s => s && {
              ...s,
              custom: { ...s.custom, [catId]: [...(s.custom?.[catId] ?? []), label] },
            })}
          />
        );
      }
    }
  }

  return (
    <ThemeProvider value={theme}>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
          <View style={{ flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center' }}>{screen}</View>
          <InstallBanner />
          <StatusBar style={isDark(theme) ? 'light' : 'dark'} />
        </SafeAreaView>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
