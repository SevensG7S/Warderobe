import { useEffect, useState } from 'react';
import { WardrobeProvider, useWardrobe } from './context/WardrobeContext';
import { TabBar, Tab } from './components/TabBar';
import { Sheet } from './components/Sheet';
import { Home } from './screens/Home';
import { Items } from './screens/Items';
import { Looks } from './screens/Looks';
import { Profile } from './screens/Profile';
import { AddItemSheet } from './screens/sheets/AddItemSheet';
import { LookSheet } from './screens/sheets/LookSheet';
import { LookDetailSheet } from './screens/sheets/LookDetailSheet';
import { Category, Look } from './types';

type SheetState =
  | { type: 'addItem'; cat: Category }
  | { type: 'lookSheet'; editLook: Look | null; random: boolean }
  | { type: 'lookDetail'; look: Look }
  | null;

function AppShell() {
  const { state, loading } = useWardrobe();
  const [tab, setTab] = useState<Tab>('home');
  const [sheet, setSheet] = useState<SheetState>(null);

  useEffect(() => {
    // Telegram Mini App bootstrap. No-op outside Telegram.
    const tg = (window as any).Telegram?.WebApp;
    tg?.ready?.();
    tg?.expand?.();
  }, []);

  function openLookDetailById(id: string) {
    const look = state.looks.find((l) => l.id === id);
    if (look) setSheet({ type: 'lookDetail', look });
  }

  if (loading) return null;

  return (
    <div className="app-container">
      <div className="mesh" />
      <div className="app">
        {tab === 'home' && (
          <Home
            onGoto={setTab}
            onAddItem={() => setSheet({ type: 'addItem', cat: 'headwear' })}
            onOpenLook={openLookDetailById}
          />
        )}
        {tab === 'items' && (
          <Items onAddItem={(cat) => setSheet({ type: 'addItem', cat })} />
        )}
        {tab === 'looks' && (
          <Looks
            onAddLook={() => setSheet({ type: 'lookSheet', editLook: null, random: false })}
            onRandomLook={() => setSheet({ type: 'lookSheet', editLook: null, random: true })}
            onOpenLook={openLookDetailById}
          />
        )}
        {tab === 'profile' && <Profile />}

        <TabBar active={tab} onChange={setTab} />
      </div>

      <Sheet open={sheet !== null} onClose={() => setSheet(null)}>
        {sheet?.type === 'addItem' && (
          <AddItemSheet defaultCat={sheet.cat} onDone={() => setSheet(null)} />
        )}
        {sheet?.type === 'lookSheet' && (
          <LookSheet
            editLook={sheet.editLook}
            random={sheet.random}
            onDone={(id) => openLookDetailById(id)}
          />
        )}
        {sheet?.type === 'lookDetail' && (
          <LookDetailSheet
            look={sheet.look}
            onEdit={() => setSheet({ type: 'lookSheet', editLook: sheet.look, random: false })}
            onDeleted={() => setSheet(null)}
          />
        )}
      </Sheet>
    </div>
  );
}

export default function App() {
  return (
    <WardrobeProvider>
      <AppShell />
    </WardrobeProvider>
  );
}
