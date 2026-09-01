export type Tab = 'home' | 'items' | 'looks' | 'profile';

const TABS: { id: Tab; label: string; icon: JSX.Element }[] = [
  {
    id: 'home',
    label: 'Главная',
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M4 11.5L12 4l8 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 10v9h12v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    id: 'items',
    label: 'Вещи',
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M9 3h1.4c.6 2 2 2 3.2 0H15l1 5-2.2 1.2c.4 2.6-.2 4.4-1.8 5.8-1.6-1.4-2.2-3.2-1.8-5.8L8 8l1-5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M9 3L6 9M15 3l3 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'looks',
    label: 'Луки',
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M12 3l2.2 5.6L20 10l-4.5 3.6L16.8 20 12 16.6 7.2 20l1.3-6.4L4 10l5.8-1.4L12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    id: 'profile',
    label: 'Профиль',
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.6" />
        <path d="M5 20c1.3-3.6 3.9-5.4 7-5.4S17.7 16.4 19 20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    )
  }
];

export function TabBar({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  return (
    <div className="tabbar">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`tab${active === tab.id ? ' active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
