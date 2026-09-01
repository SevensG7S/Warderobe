import React, { useRef, useState } from 'react';
import { useWardrobeStore } from '../store/useWardrobeStore';
import { haptic, hapticSuccess, tg } from '../lib/telegram';
import { api } from '../lib/api';
import type { Category, ClothingItem } from '../types';

type BuilderMode = 'slots' | 'canvas';

const SLOT_CONFIG: { category: Category; label: string; icon: string }[] = [
  { category: 'top', label: 'Верх', icon: '👕' },
  { category: 'bottom', label: 'Низ', icon: '👖' },
  { category: 'shoes', label: 'Обувь', icon: '👟' },
  { category: 'accessory', label: 'Аксессуар', icon: '🧢' },
];

export const LookBuilderScreen: React.FC = () => {
  const {
    items,
    builderLayers,
    selectedLayerItemId,
    addToCanvas,
    updateLayer,
    removeLayer,
    bringToFront,
    clearCanvas,
    selectLayer,
    addLook,
  } = useWardrobeStore();

  const [mode, setMode] = useState<BuilderMode>('slots');
  const [selectedSlots, setSelectedSlots] = useState<Record<Category, ClothingItem | null>>({
    top: null,
    bottom: null,
    shoes: null,
    accessory: null,
    outerwear: null,
    dress: null,
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const dragRef = useRef<{ itemId: string; startX: number; startY: number; initX: number; initY: number } | null>(null);

  const selectedLayer = builderLayers.find((l) => l.itemId === selectedLayerItemId);

  // --- ЛОГИКА СЛОТОВ ---
  const handleCycleSlot = (cat: Category, direction: 1 | -1) => {
    haptic('light');
    const catItems = items.filter((i) => i.category === cat);
    if (catItems.length === 0) return;

    const current = selectedSlots[cat];
    const currentIndex = current ? catItems.findIndex((i) => i.id === current.id) : -1;
    let nextIndex = currentIndex + direction;

    if (nextIndex >= catItems.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = catItems.length - 1;

    setSelectedSlots((prev) => ({ ...prev, [cat]: catItems[nextIndex] }));
  };

  const handleRandomizeSlots = () => {
    haptic('medium');
    const newSlots = { ...selectedSlots };
    SLOT_CONFIG.forEach(({ category }) => {
      const catItems = items.filter((i) => i.category === category);
      if (catItems.length > 0) {
        newSlots[category] = catItems[Math.floor(Math.random() * catItems.length)];
      }
    });
    setSelectedSlots(newSlots);
  };

  const handleSaveSlotLook = async () => {
    const activeItems = Object.values(selectedSlots).filter(Boolean) as ClothingItem[];
    if (activeItems.length === 0) return;

    setIsSaving(true);
    haptic('heavy');
    try {
      const layers = activeItems.map((item, index) => ({
        itemId: item.id,
        x: 40 + index * 20,
        y: 40 + index * 40,
        scale: 1,
        rotation: 0,
        zIndex: index + 1,
      }));

      const saved = await api.saveLook({
        name: `Слот-образ ${new Date().toLocaleDateString('ru-RU')}`,
        layers,
      });
      addLook(saved);
      hapticSuccess();
      tg?.sendData?.(JSON.stringify({ event: 'LOOK_SAVED', lookId: saved.id }));
    } finally {
      setIsSaving(false);
    }
  };

  // --- ЛОГИКА КАНВАСА ---
  const handlePointerDown = (e: React.PointerEvent, itemId: string) => {
    const layer = builderLayers.find((l) => l.itemId === itemId);
    if (!layer) return;

    selectLayer(itemId);
    bringToFront(itemId);
    haptic('light');

    dragRef.current = {
      itemId,
      startX: e.clientX,
      startY: e.clientY,
      initX: layer.x,
      initY: layer.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const { itemId, startX, startY, initX, initY } = dragRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    updateLayer(itemId, {
      x: Math.round(initX + dx),
      y: Math.round(initY + dy),
    });
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const handleScale = (delta: number) => {
    if (!selectedLayerItemId || !selectedLayer) return;
    haptic('light');
    const newScale = Math.max(0.4, Math.min(2.2, selectedLayer.scale + delta));
    updateLayer(selectedLayerItemId, { scale: Number(newScale.toFixed(2)) });
  };

  const handleRotate = (deg: number) => {
    if (!selectedLayerItemId || !selectedLayer) return;
    haptic('light');
    updateLayer(selectedLayerItemId, { rotation: (selectedLayer.rotation + deg) % 360 });
  };

  const handleSaveCanvasLook = async () => {
    if (builderLayers.length === 0) return;
    setIsSaving(true);
    haptic('heavy');
    try {
      const saved = await api.saveLook({
        name: `Коллаж ${new Date().toLocaleDateString('ru-RU')}`,
        layers: builderLayers,
      });
      addLook(saved);
      hapticSuccess();
      tg?.sendData?.(JSON.stringify({ event: 'LOOK_SAVED', lookId: saved.id }));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="screen-content">
      {/* Переключатель режимов */}
      <div className="mode-switch">
        <button
          className={`mode-btn ${mode === 'slots' ? 'active' : ''}`}
          onClick={() => {
            haptic('light');
            setMode('slots');
          }}
        >
          По слотам
        </button>
        <button
          className={`mode-btn ${mode === 'canvas' ? 'active' : ''}`}
          onClick={() => {
            haptic('light');
            setMode('canvas');
          }}
        >
          Коллаж (Холст)
        </button>
      </div>

      {mode === 'slots' ? (
        <div>
          {SLOT_CONFIG.map(({ category, label, icon }) => {
            const currentItem = selectedSlots[category];
            const catItems = items.filter((i) => i.category === category);

            return (
              <div key={category} className="slot-card">
                <div className="slot-info">
                  <div className="slot-preview">
                    {currentItem ? (
                      <img src={currentItem.imageUrl} alt={currentItem.name} />
                    ) : (
                      <span style={{ fontSize: '20px' }}>{icon}</span>
                    )}
                  </div>
                  <div>
                    <div className="slot-label">{label}</div>
                    <div className="slot-name">
                      {currentItem ? currentItem.name : catItems.length === 0 ? 'Нет вещей' : 'Не выбрано'}
                    </div>
                  </div>
                </div>

                <div className="slot-actions">
                  <button
                    className="slot-btn"
                    disabled={catItems.length === 0}
                    onClick={() => handleCycleSlot(category, -1)}
                  >
                    ◀
                  </button>
                  <button
                    className="slot-btn"
                    disabled={catItems.length === 0}
                    onClick={() => handleCycleSlot(category, 1)}
                  >
                    ▶
                  </button>
                </div>
              </div>
            );
          })}

          <div className="look-actions">
            <button className="btn-secondary" onClick={handleRandomizeSlots}>
              🎲 Случайно
            </button>
            <button
              className="btn-secondary"
              style={{ background: 'var(--lav)', color: '#171126', borderColor: 'var(--lav)' }}
              disabled={Object.values(selectedSlots).every((v) => v === null) || isSaving}
              onClick={handleSaveSlotLook}
            >
              {isSaving ? 'Сохранение…' : 'Сохранить образ'}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div
            ref={canvasRef}
            className="canvas-wrap"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onClick={(e) => {
              if (e.target === canvasRef.current) selectLayer(null);
            }}
          >
            {builderLayers.length === 0 && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                Выберите вещи из списка ниже, чтобы добавить их на холст
              </div>
            )}

            {builderLayers.map((layer) => {
              const item = items.find((it) => it.id === layer.itemId);
              if (!item) return null;
              const isSelected = selectedLayerItemId === layer.itemId;

              return (
                <div
                  key={layer.itemId}
                  className={`canvas-item ${isSelected ? 'selected' : ''}`}
                  style={{
                    left: `${layer.x}px`,
                    top: `${layer.y}px`,
                    transform: `scale(${layer.scale}) rotate(${layer.rotation}deg)`,
                    zIndex: layer.zIndex,
                  }}
                  onPointerDown={(e) => handlePointerDown(e, layer.itemId)}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
                  />
                </div>
              );
            })}
          </div>

          {selectedLayer && (
            <div className="canvas-controls">
              <button className="control-btn" onClick={() => handleScale(0.15)}>+ Масштаб</button>
              <button className="control-btn" onClick={() => handleScale(-0.15)}>- Масштаб</button>
              <button className="control-btn" onClick={() => handleRotate(15)}>⟳ 15°</button>
              <button className="control-btn" style={{ color: 'var(--danger)' }} onClick={() => removeLayer(selectedLayer.itemId)}>
                Удалить
              </button>
            </div>
          )}

          <div className="sec-label">Добавить на холст</div>
          <div className="tray">
            {items.map((item) => (
              <div
                key={item.id}
                className="tray-item"
                onClick={() => {
                  haptic('light');
                  addToCanvas(item.id);
                }}
              >
                <img src={item.imageUrl} alt={item.name} />
              </div>
            ))}
          </div>

          <div className="look-actions">
            <button
              className="btn-secondary"
              onClick={() => {
                haptic('medium');
                clearCanvas();
              }}
            >
              Очистить
            </button>
            <button
              className="btn-secondary"
              style={{ background: 'var(--lav)', color: '#171126', borderColor: 'var(--lav)' }}
              disabled={builderLayers.length === 0 || isSaving}
              onClick={handleSaveCanvasLook}
            >
              {isSaving ? 'Сохранение…' : 'Сохранить коллаж'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};