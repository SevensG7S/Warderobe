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
    removeLayer,
    bringToFront,
    clearCanvas,
    selectLayer,
    addLook,
  } = useWardrobeStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const dragRef = useRef<{ itemId: string; startX: number; startY: number; initX: number; initY: number } | null>(null);

  const selectedLayer = builderLayers.find((l) => l.itemId === selectedLayerItemId);

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
    const newScale = Math.max(0.5, Math.min(2.0, selectedLayer.scale + delta));
    updateLayer(selectedLayerItemId, { scale: Number(newScale.toFixed(2)) });
  };

  const handleRotate = (deg: number) => {
    if (!selectedLayerItemId || !selectedLayer) return;
    haptic('light');
    updateLayer(selectedLayerItemId, { rotation: (selectedLayer.rotation + deg) % 360 });
  };

  const handleSaveLook = async () => {
    if (builderLayers.length === 0) return;
    setIsSaving(true);
    haptic('heavy');

    try {
      const saved = await api.saveLook({
        name: `Образ ${new Date().toLocaleDateString('ru-RU')}`,
        layers: builderLayers,
      });
      addLook(saved);
      hapticSuccess();
      tg?.sendData?.(JSON.stringify({ event: 'LOOK_SAVED', lookId: saved.id }));
    } catch (e) {
      console.error(e);
      haptic('rigid');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="screen-content">
      {/* Холст */}
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
            Нажмите на вещь из панели ниже, чтобы добавить её на холст
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

      {/* Инструменты редактирования выделенного элемента */}
      {selectedLayer && (
        <div className="canvas-controls">
          <button className="control-btn" onClick={() => handleScale(0.1)}>+ Масштаб</button>
          <button className="control-btn" onClick={() => handleScale(-0.1)}>- Масштаб</button>
          <button className="control-btn" onClick={() => handleRotate(15)}>⟳ 15°</button>
          <button className="control-btn" style={{ color: 'var(--danger)' }} onClick={() => removeLayer(selectedLayer.itemId)}>
            Удалить
          </button>
        </div>
      )}

      {/* Панель доступных вещей */}
      <div className="sec-label">Добавить из гардероба</div>
      {items.length === 0 ? (
        <div style={{ color: 'var(--text-dim)', fontSize: '12px', padding: '8px 0' }}>
          Гардероб пуст. Загрузите вещи во вкладке «Добавить».
        </div>
      ) : (
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
              <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          ))}
        </div>
      )}

      {/* Действия */}
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
          {isSaving ? 'Сохранение…' : 'Сохранить образ'}
        </button>
      </div>
    </div>
  );
};