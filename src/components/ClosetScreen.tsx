import React, { useEffect } from 'react';
import { useWardrobeStore } from '../store/useWardrobeStore';
import { haptic } from '../lib/telegram';
import { CATEGORY_LABELS, type Category } from '../types';

const CATEGORIES: Array<Category | 'all'> = ['all', 'top', 'bottom', 'shoes', 'accessory', 'outerwear', 'dress'];

export const ClosetScreen: React.FC = () => {
  const { items, activeCategory, setActiveCategory, fetchItems, loading } = useWardrobeStore();

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filteredItems = activeCategory === 'all' 
    ? items 
    : items.filter((it) => it.category === activeCategory);

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

      {/* Сетка вещей */}
      {loading && items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
          Загрузка гардероба...
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
          <p style={{ fontSize: '15px', fontWeight: 600 }}>В этой категории пока пусто</p>
          <p style={{ fontSize: '13px' }}>Добавьте фото вашей первой вещи через вкладку «Добавить»</p>
        </div>
      ) : (
        <div className="grid">
          {filteredItems.map((item, idx) => (
            <div
              key={item.id}
              className="item-card"
              style={{
                '--r': `${(idx % 2 === 0 ? -1 : 1) * ((idx % 3) * 0.6 + 0.6)}deg`,
              } as React.CSSProperties}
              onClick={() => haptic('light')}
            >
              <span className="tag" style={{ backgroundColor: item.color }} />
              <div className="thumb">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  '👕'
                )}
              </div>
              <div className="meta">
                <div className="brand">{item.brand || 'Без бренда'}</div>
                <div className="name">{item.name}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};