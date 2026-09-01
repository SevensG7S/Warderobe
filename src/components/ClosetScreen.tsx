import React, { useEffect, useState } from 'react';
import { useWardrobeStore } from '../store/useWardrobeStore';
import { haptic, hapticSuccess } from '../lib/telegram';
import { CATEGORY_LABELS, type Category } from '../types';

const CATEGORIES: Array<Category | 'all'> = ['all', 'top', 'bottom', 'shoes', 'accessory', 'outerwear', 'dress'];

interface ClosetScreenProps {
  onNavigateToAdd: () => void;
}

export const ClosetScreen: React.FC<ClosetScreenProps> = ({ onNavigateToAdd }) => {
  const { items, activeCategory, setActiveCategory, fetchItems, removeItem, loading } = useWardrobeStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filteredItems = activeCategory === 'all' 
    ? items 
    : items.filter((it) => it.category === activeCategory);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    haptic('medium');
    setDeletingId(id);
    try {
      await removeItem(id);
      hapticSuccess();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="screen-content">
      {/* Категории */}
      <div className="chips">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`chip ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => {
              haptic('light');
              setActiveCategory(cat);
            }}
          >
            {cat === 'all' ? 'Всё' : CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Список вещей или Empty State */}
      {loading && items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-dim)', fontSize: '14px' }}>
          Загрузка гардероба…
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state">
          <div className="icon-box">🧥</div>
          <h3>В гардеробе пока пусто</h3>
          <p>
            {activeCategory === 'all'
              ? 'Добавьте первую вещь, чтобы составлять образы'
              : `В категории «${CATEGORY_LABELS[activeCategory as Category]}» пока ничего нет`}
          </p>
          <button className="btn-primary" style={{ marginTop: 0, width: 'auto', padding: '12px 24px' }} onClick={onNavigateToAdd}>
            + Добавить вещь
          </button>
        </div>
      ) : (
        <div className="grid">
          {filteredItems.map((item) => (
            <div key={item.id} className="item-card" onClick={() => haptic('light')}>
              <button
                className="delete-btn"
                title="Удалить"
                disabled={deletingId === item.id}
                onClick={(e) => handleDelete(e, item.id)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="thumb">
                <img src={item.imageUrl} alt={item.name} />
              </div>
              <div className="meta">
                <div className="brand">{item.brand || 'Гардероб'}</div>
                <div className="name">{item.name}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};