import React from 'react';
import type { ClothingItem } from '../types';
import { CATEGORY_LABELS } from '../types';
import { haptic } from '../lib/telegram';

interface ItemDetailModalProps {
  item: ClothingItem;
  onClose: () => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, onClose }) => {
  return (
    <div
      className="modal-overlay"
      onClick={() => {
        haptic('light');
        onClose();
      }}
    >
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="detail-image checker-bg">
          <img src={item.imageUrl} alt={item.name} />
        </div>
        <div className="detail-title">{item.name}</div>
        <div className="detail-sub">{item.brand || 'Без бренда'}</div>

        <div style={{ marginTop: 14 }}>
          <div className="detail-row">
            <span className="k">Категория</span>
            <span className="v">{CATEGORY_LABELS[item.category]}</span>
          </div>
          <div className="detail-row">
            <span className="k">Цвет</span>
            <span className="v" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: item.color,
                  display: 'inline-block',
                  border: '1px solid var(--line)',
                }}
              />
              {item.color}
            </span>
          </div>
          <div className="detail-row" style={{ borderBottom: 'none' }}>
            <span className="k">Добавлено</span>
            <span className="v">{new Date(item.createdAt).toLocaleDateString('ru-RU')}</span>
          </div>
        </div>

        <button className="btn-primary" style={{ marginTop: 16 }} onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>
  );
};
