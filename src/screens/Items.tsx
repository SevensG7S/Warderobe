import { useState } from 'react';
import { useWardrobe } from '../context/WardrobeContext';
import { CATEGORY_ORDER, CATS } from '../data/categories';
import { Category } from '../types';
import { ItemCard } from '../components/ItemCard';

type Filter = 'all' | Category;

export function Items({ onAddItem }: { onAddItem: (cat: Category) => void }) {
  const { allItemsFlat, removeItem } = useWardrobe();
  const [filter, setFilter] = useState<Filter>('all');

  let flat = allItemsFlat();
  if (filter !== 'all') flat = flat.filter((i) => i.cat === filter);

  return (
    <div className="screen active">
      <div className="page-head">
        <div>
          <p className="eyebrow">Гардероб</p>
          <h1 className="title" style={{ fontSize: 26 }}>Все вещи</h1>
        </div>
        <button className="pill-btn" onClick={() => onAddItem(filter === 'all' ? 'headwear' : filter)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
          Добавить
        </button>
      </div>
      <div className="filter-row">
        <button className={`filter-chip${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>Все</button>
        {CATEGORY_ORDER.map((c) => (
          <button
            key={c}
            className={`filter-chip${filter === c ? ' active' : ''}`}
            onClick={() => setFilter(c)}
          >
            {CATS[c].label.replace(/^\d\.\s/, '')}
          </button>
        ))}
      </div>
      <div className="items-grid">
        {flat.length === 0 ? (
          <div className="empty-hint" style={{ gridColumn: '1 / -1' }}>В этой категории пока пусто</div>
        ) : (
          flat.map((it) => (
            <ItemCard key={it.id} cat={it.cat} item={it} onDelete={() => removeItem(it.cat, it.id)} />
          ))
        )}
      </div>
    </div>
  );
}
