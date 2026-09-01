import { useWardrobe } from '../context/WardrobeContext';
import { dateLine, greeting, wordVeshi, wordLuki } from '../lib/format';
import { ItemCard } from '../components/ItemCard';
import { LookCard } from '../components/LookCard';
import { Tab } from '../components/TabBar';

export function Home({
  onGoto,
  onAddItem,
  onOpenLook
}: {
  onGoto: (tab: Tab) => void;
  onAddItem: () => void;
  onOpenLook: (id: string) => void;
}) {
  const { state, allItemsFlat } = useWardrobe();
  const flat = allItemsFlat();
  const recent = flat.slice(-8).reverse();
  const recentLooks = state.looks.slice().reverse().slice(0, 2);
  const g = greeting();

  return (
    <div className="screen active">
      <p className="eyebrow">{dateLine()}</p>
      <h1 className="title">
        {g.text} <span className="grad-word">{g.word}</span>
      </h1>
      <div className="stat-row">
        <span>{flat.length} {wordVeshi(flat.length)}</span>
        <span className="dot" />
        <span>{state.looks.length} {wordLuki(state.looks.length)}</span>
      </div>

      <button className="cta-add" onClick={onAddItem}>
        <span className="plus-badge">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </span>
        <span className="txt">
          <b>Добавить вещь</b>
          <span>Новое фото в гардероб</span>
        </span>
      </button>

      <div className="bento">
        <div className="bento-card glass-card" onClick={() => onGoto('items')}>
          <span className="icon-badge" style={{ background: 'var(--violet-soft)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 3h1.4c.6 2 2 2 3.2 0H15l1 5-2.2 1.2c.4 2.6-.2 4.4-1.8 5.8-1.6-1.4-2.2-3.2-1.8-5.8L8 8l1-5z" stroke="var(--violet)" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M9 3L6 9M15 3l3 6" stroke="var(--violet)" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
          <div>
            <b>Все вещи</b><br /><span>{flat.length} предметов</span>
          </div>
        </div>
        <div className="bento-card glass-card" onClick={() => onGoto('looks')}>
          <span className="icon-badge" style={{ background: 'var(--pink-soft)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 3l2.2 5.6L20 10l-4.5 3.6L16.8 20 12 16.6 7.2 20l1.3-6.4L4 10l5.8-1.4L12 3z" stroke="var(--pink)" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </span>
          <div>
            <b>Мои луки</b><br /><span>{state.looks.length} образов</span>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <h2>Недавно добавлено</h2>
          <button className="link-btn" onClick={() => onGoto('items')}>все вещи →</button>
        </div>
        <div className="strip">
          {recent.length === 0 ? (
            <div className="empty-hint" style={{ width: '100%' }}>Добавь первую вещь — она появится здесь</div>
          ) : (
            recent.map((it) => <ItemCard key={it.id} cat={it.cat} item={it} />)
          )}
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <h2>Твои луки</h2>
          <button className="link-btn" onClick={() => onGoto('looks')}>смотреть все →</button>
        </div>
        {recentLooks.length === 0 ? (
          <div className="empty-hint">Пока нет ни одного лука. Нажми «Папка», чтобы собрать первый образ.</div>
        ) : (
          <div className="looks-grid">
            {recentLooks.map((look) => (
              <LookCard key={look.id} look={look} onClick={() => onOpenLook(look.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
