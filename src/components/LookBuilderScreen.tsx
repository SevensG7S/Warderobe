import React, { useRef, useState } from 'react';
import { useWardrobeStore } from '../store/useWardrobeStore';
import { haptic, hapticSuccess, tg } from '../lib/telegram';
import { api } from '../lib/api';

export const LookBuilderScreen: React.FC = () => {
  const {
    items,
    builderLayers,
    selectedLayerItemId,
    addToCanvas,
    updateLayer,
    bringToFront,
    clearCanvas,
    selectLayer,
    addLook,
  } = useWardrobeStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [lookName, setLookName] = useState('Образ на сегодня');
  const [isSaving, setIsSaving] = useState(false);

  // Drag-and-Drop / Pointer Events
  const dragRef = useRef<{ itemId: string; startX: number; startY: number; initX: number; initY: number } | null>(null);

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

  const handleSaveLook = async () => {
    if (builderLayers.length === 0) return;
    setIsSaving(true);
    haptic('heavy');

    try {
      const saved = await api.saveLook({
        name: lookName,
        layers: builderLayers,
      });
      addLook(saved);
      hapticSuccess();
      tg?.sendData?.(JSON.stringify({ event: 'LOOK_SAVED', lookId: saved.id, name: saved.name }));
    } catch (e) {
      console.error(e);
      haptic('rigid');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="screen-content">
      {/* Холст конструктора */}
      <div
        ref={canvasRef}
        className="canvas-wrap"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={(e) => {
          if (e.target === canvasRef.current) selectLayer(null);
        }}
      >
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

      {/* Панель добавления вещей из гардероба */}
      <div className="sec-label">Добавить из гардероба</div>
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
            <img
              src={item.imageUrl}
              alt={item.name}
              style={{ width: '80%', height: '80%', objectFit: 'contain' }}
            />
          </div>
        ))}
      </div>

      {/* Действия с холстом */}
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
          onClick={handleSaveLook}
        >
          {isSaving ? 'Сохранение…' : 'Сохранить лук'}
        </button>
      </div>
    </div>
  );
};