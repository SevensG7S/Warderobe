import { useWardrobe } from '../context/WardrobeContext';

export function Profile() {
  const { state, allItemsFlat } = useWardrobe();

  return (
    <div className="screen active">
      <div className="profile-view">
        <div className="avatar">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="#fff" strokeWidth="1.6" />
            <path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </div>
        <h2>Твой профиль</h2>
        <p>Статистика гардероба и любимые сочетания собираются здесь автоматически.</p>
        <div className="profile-stats">
          <div className="glass-card"><b>{allItemsFlat().length}</b><span>Вещей</span></div>
          <div className="glass-card"><b>{state.looks.length}</b><span>Луков</span></div>
          <div className="glass-card"><b>4</b><span>Категории</span></div>
        </div>
      </div>
    </div>
  );
}
