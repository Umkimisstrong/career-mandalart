import { StatusBar } from 'expo-status-bar';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Cell, newPlan, Plan, setCell, Store } from './src/model';
import Backup from './src/screens/Backup';
import BlockEditor from './src/screens/BlockEditor';
import Overview from './src/screens/Overview';
import PlanList from './src/screens/PlanList';
import { loadStore, saveStore } from './src/storage';

type Route =
  | { name: 'list' }
  | { name: 'backup' }
  | { name: 'plan'; id: string; block: number | null };

export default function App() {
  const [store, setStore] = useState<Store | null>(null);
  const [route, setRoute] = useState<Route>({ name: 'list' });
  const loaded = useRef(false);

  useEffect(() => {
    loadStore().then(s => { loaded.current = true; setStore(s); });
  }, []);

  // 변경될 때마다 자동 저장
  useEffect(() => {
    if (store && loaded.current) saveStore(store);
  }, [store]);

  const updatePlan = (id: string, fn: (p: Plan) => Plan) =>
    setStore(s => s && { ...s, plans: s.plans.map(p => (p.id === id ? fn(p) : p)) });

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
        />
      );
    } else if (route.name === 'backup') {
      screen = <Backup store={store} onBack={() => setRoute({ name: 'list' })} onImport={setStore} />;
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
          />
        );
      }
    }
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
        <View style={{ flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center' }}>{screen}</View>
        <StatusBar style="dark" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
