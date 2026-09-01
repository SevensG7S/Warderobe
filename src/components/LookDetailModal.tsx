import React from 'react';
import type { Look, ClothingItem } from '../types';
import { haptic } from '../lib/telegram';

interface LookDetailModalProps {
  look: Look;
  items: ClothingItem[];
  onClose: () => void;
  onDelete: () => void;
}

export const LookDetailModal: React.FC<LookDetailModalProps> = ({ look, items, onClose, onDelete }) => {
  const lookItems = look.layers
    .map((l) => items.find((it) => it.id === l.itemId))
    .filter(Boolean) as ClothingItem[];

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
          {look.previewUrl ? (
            <img src={look.previewUrl} alt={look.name} />
          ) : (
            <span style={{ fontSize: '40px' }}>✨</span>
          )}
        </div>
        <div className="detail-title">{look.name}</div>
        <div className="detail-sub">{new Date(look.createdAt).toLocaleDateString('ru-RU')}</div>

        {lookItems.length > 0 && (
          <>
            <div className="section-divider">Вещи в образе ({lookItems.length})</div>
            <div className="tray" style={{ marginTop: 0 }}>
              {lookItems.map((item) => (
                <div key={item.id} className="tray-item checker-bg">
                  <img src={item.imageUrl} alt={item.name} />
                </div>
              ))}
            </div>
          </>
        )}

        <button
          className="btn-secondary"
          style={{ marginTop: 18, color: 'var(--danger)', borderColor: 'var(--danger)' }}
          onClick={() => {
            haptic('medium');
            onDelete();
            onClose();
          }}
        >
          Удалить образ
        </button>
        <button className="btn-primary" style={{ marginTop: 10 }} onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>
  );
};
