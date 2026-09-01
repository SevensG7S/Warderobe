import { useWardrobe } from '../context/WardrobeContext';
import { LookCard } from '../components/LookCard';

export function Looks({
  onAddLook,
  onRandomLook,
  onOpenLook
}: {
  onAddLook: () => void;
  onRandomLook: () => void;
  onOpenLook: (id: string) => void;
}) {
  const { state } = useWardrobe();
  const list = state.looks.slice().reverse();

  return (
    <div className="screen active">
      <div className="page-head">
        <div>
          <p className="eyebrow">Образы</p>
          <h1 className="title" style={{ fontSize: 26 }}>Твои луки</h1>
        </div>
        <button className="pill-btn" onClick={onAddLook}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
          Папка
        </button>
      </div>
      <button className="link-btn" style={{ marginTop: 10 }} onClick={onRandomLook}>
        🎲 собрать случайный лук
      </button>
      <div className="looks-grid">
        {list.length === 0 ? (
          <div className="empty-hint">Пока нет ни одного лука. Нажми «Папка», чтобы собрать первый образ.</div>
        ) : (
          list.map((look) => <LookCard key={look.id} look={look} onClick={() => onOpenLook(look.id)} />)
        )}
      </div>
    </div>
  );
}
