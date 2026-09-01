import React, { useState, useEffect } from 'react';
import { initTelegram, haptic } from './lib/telegram';
import { useWardrobeStore } from './store/useWardrobeStore';
import { ClosetScreen } from './components/ClosetScreen';
import { AddScreen } from './components/AddScreen';
import { LookBuilderScreen } from './components/LookBuilderScreen';
import { ProfileScreen } from './components/ProfileScreen';

type Tab = 'closet' | 'add' | 'looks' | 'profile';

const TAB_CONFIG: Record<Tab, { title: string; sub: (itemCount: number, lookCount: number) => string }> = {
  closet: { title: 'Гардероб', sub: (i) => `${i} шт.` },
  add: { title: 'Новая вещь', sub: () => 'Шаг 1 из 1' },
  looks: { title: 'Конструктор', sub: () => 'Сборка лука' },
  profile: { title: 'Профиль', sub: (_, l) => `${l} образов` },
};

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<Tab>('closet');
  const items = useWardrobeStore((s) => s.items);
  const looks = useWardrobeStore((s) => s.looks);

  useEffect(() => {
    initTelegram();
  }, []);

  const config = TAB_CONFIG[currentTab];

  return (
    <div id="app">
      <header className="topbar">
        <h1 className="display">{config.title}</h1>
        <span className="count">{config.sub(items.length, looks.length)}</span>
      </header>

      <main className="screen-container">
        {currentTab === 'closet' && <ClosetScreen onNavigateToAdd={() => setCurrentTab('add')} />}
        {currentTab === 'add' && <AddScreen onSuccess={() => setCurrentTab('closet')} />}
        {currentTab === 'looks' && <LookBuilderScreen />}
        {currentTab === 'profile' && <ProfileScreen />}
      </main>

      <nav className="tabbar">
        <button
          className={`tab ${currentTab === 'closet' ? 'active' : ''}`}
          onClick={() => {
            haptic('light');
            setCurrentTab('closet');
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 4l3 2 3-2 3 2 3-2v16H6V4z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Гардероб
        </button>
        <button
          className={`tab ${currentTab === 'add' ? 'active' : ''}`}
          onClick={() => {
            haptic('light');
            setCurrentTab('add');
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" strokeLinecap="round" />
            <path d="M12 8v8M8 12h8" strokeLinecap="round" />
          </svg>
          Добавить
        </button>
        <button
          className={`tab ${currentTab === 'looks' ? 'active' : ''}`}
          onClick={() => {
            haptic('light');
            setCurrentTab('looks');
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <path d="M4 14l4-4 4 4 4-6 4 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Луки
        </button>
        <button
          className={`tab ${currentTab === 'profile' ? 'active' : ''}`}
          onClick={() => {
            haptic('light');
            setCurrentTab('profile');
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="8" r="3.4" />
            <path d="M5 20c1.5-4 4.2-6 7-6s5.5 2 7 6" strokeLinecap="round" />
          </svg>
          Профиль
        </button>
      </nav>
    </div>
  );
};

export default App;