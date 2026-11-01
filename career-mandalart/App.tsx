import { StatusBar } from 'expo-status-bar';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import InstallBanner from './src/components/InstallBanner';
import { Cell, getCell, newPlan, ohtaniPlan, Plan, setCell, Store } from './src/model';
import { syncReminders } from './src/notify';
import { decodePlan } from './src/qr/codec';
import { pickQrFromImage } from './src/qr/image';
import About from './src/screens/About';
import Backup from './src/screens/Backup';
import BlockEditor from './src/screens/BlockEditor';
import Overview from './src/screens/Overview';
import PlanList from './src/screens/PlanList';
import QrScan from './src/screens/QrScan';
import QrShare from './src/screens/QrShare';
import Story from './src/screens/Story';
import Templates from './src/screens/Templates';
import ThemeSettings from './src/screens/ThemeSettings';
import Today from './src/screens/Today';
import { routineItems, toggleKey } from './src/routine';
import { loadStore, saveStore } from './src/storage';
import { buildTheme, isDark, ThemeProvider } from './src/theme';

type Route =
  | { name: 'list' }
  | { name: 'backup' }
  | { name: 'scan' }
  | { name: 'theme' }
  | { name: 'story' }
  | { name: 'about' }
  | { name: 'templates' }
  | { name: 'today' }
  | { name: 'qr'; id: string }
  | { name: 'plan'; id: string; block: number | null };

export default function App() {
  const [store, setStore] = useState<Store | null>(null);
  const [route, setRoute] = useState<Route>({ name: 'list' });
  const [notice, setNotice] = useState('');
  const loaded = useRef(false);
  const theme = useMemo(() => buildTheme(store?.theme), [store?.theme]);

  useEffect(() => {
    loadStore().then(s => { loaded.current = true; setStore(s); });
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

  // QR 에서 복원한 청사진을 목록에 추가하고 바로 펼친다
  const importPlan = (plan: Plan) => {
    setStore(s => s && { ...s, plans: [...s.plans, plan] });
    setNotice('');
    setRoute({ name: 'plan', id: plan.id, block: null });
  };

  const scanQr = async () => {
    if (Platform.OS !== 'web') return setRoute({ name: 'scan' });
    try {
      const text = await pickQrFromImage();
      if (text) importPlan(decodePlan(text));
    } catch (e) {
      setNotice((e as Error).message);
    }
  };

  let screen: ReactNode = <ActivityIndicator style={{ marginTop: 80 }} />;

  if (store) {
    if (route.name === 'list') {
      screen = (
        <PlanList
          plans={store.plans}
          onOpen={id => setRoute({ name: 'plan', id, block: null })}
          onCreate={title => {
            const p = newPlan(title);
            setStore({ ...store, plans: [...store.plans, p] });
            setRoute({ name: 'plan', id: p.id, block: null });
          }}
          onDelete={id => setStore({ ...store, plans: store.plans.filter(p => p.id !== id) })}
          onBackup={() => setRoute({ name: 'backup' })}
          onScanQr={scanQr}
          onTheme={() => setRoute({ name: 'theme' })}
          onStory={() => setRoute({ name: 'story' })}
          onAbout={() => setRoute({ name: 'about' })}
          onTemplates={() => setRoute({ name: 'templates' })}
          onToday={() => setRoute({ name: 'today' })}
          notice={notice}
        />
      );
    } else if (route.name === 'backup') {
      screen = <Backup store={store} onBack={() => setRoute({ name: 'list' })} onImport={setStore} />;
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
          age={store.age}
          onBack={() => setRoute({ name: 'list' })}
          onUse={(p, age) => {
            setStore(s => s && { ...s, plans: [...s.plans, p], age: s.age ?? age });
            setRoute({ name: 'plan', id: p.id, block: null });
          }}
        />
      );
    } else if (route.name === 'about') {
      screen = <About onBack={() => setRoute({ name: 'list' })} onStory={() => setRoute({ name: 'story' })} />;
    } else if (route.name === 'story') {
      screen = (
        <Story
          onBack={() => setRoute({ name: 'list' })}
          onStart={() => {
            const p = ohtaniPlan();
            setStore(s => s && { ...s, plans: [...s.plans, p] });
            setRoute({ name: 'plan', id: p.id, block: null });
          }}
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
      screen = <QrScan onBack={() => setRoute({ name: 'list' })} onImport={importPlan} />;
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
