import { useState } from 'react';
import { CATEGORY_ORDER, CATS, CategoryIcon } from '../../data/categories';
import { Category, Look, LookItems, emptyLookItems } from '../../types';
import { useWardrobe } from '../../context/WardrobeContext';
import { randomLookName } from '../../lib/format';

function rollRandomSelection(wardrobe: ReturnType<typeof useWardrobe>['state']['wardrobe']): LookItems {
  const sel = emptyLookItems();
  CATEGORY_ORDER.forEach((cat) => {
    const items = wardrobe[cat];
    sel[cat] = items.length ? [items[Math.floor(Math.random() * items.length)].id] : [];
  });
  return sel;
}

export function LookSheet({
  editLook,
  random,
  onDone
}: {
  editLook: Look | null;
  random: boolean;
  onDone: (openLookId: string) => void;
}) {
  const { state, allItemsFlat, saveLook } = useWardrobe();
  const hasAny = allItemsFlat().length > 0;
  const isEdit = !!editLook;

  const [name, setName] = useState(() =>
    editLook ? editLook.name : random ? randomLookName() : ''
  );
  const [selection, setSelection] = useState<LookItems>(() => {
    if (editLook) {
      return {
        headwear: [...editLook.items.headwear],
        tops: [...editLook.items.tops],
        bottoms: [...editLook.items.bottoms],
        shoes: [...editLook.items.shoes]
      };
    }
    if (random) return rollRandomSelection(state.wardrobe);
    return emptyLookItems();
  });

  if (!hasAny) {
    return (
      <>
        <h3>{isEdit ? 'Редактирование лука' : 'Новая папка лука'}</h3>
        <div className="empty-hint">Сначала добавь хотя бы одну вещь в гардероб.</div>
      </>
    );
  }

  function togglePick(cat: Category, id: string) {
    setSelection((prev) => {
      const isTop = cat === 'tops';
      if (isTop) {
        const has = prev[cat].includes(id);
        return { ...prev, [cat]: has ? prev[cat].filter((i) => i !== id) : [...prev[cat], id] };
      }
      const has = prev[cat].includes(id);
      return { ...prev, [cat]: has ? [] : [id] };
    });
  }

  function shuffle() {
    setSelection(rollRandomSelection(state.wardrobe));
    setName(randomLookName());
  }

  function onSave() {
    const finalName = name.trim() || randomLookName();
    const id = saveLook(finalName, selection, editLook?.id ?? null);
    onDone(id);
  }

  return (
    <>
      <h3>{isEdit ? 'Редактировать лук' : 'Новая папка лука'}</h3>
      <div className="field-label">Название</div>
      <input
        className="text-input"
        value={name}
        placeholder="Например, «Прогулка в парке»"
        onChange={(e) => setName(e.target.value)}
      />
      <div className="field-label" style={{ marginTop: 18 }}>Выбери или замени вещи</div>
      <div className="pick-groups">
        {CATEGORY_ORDER.map((cat) => {
          const items = state.wardrobe[cat];
          if (items.length === 0) return null;
          const isTop = cat === 'tops';
          return (
            <div className="pick-group" key={cat}>
              <div className="pick-group-title">
                {CATS[cat].label.replace(/^\d\.\s/, '')}
                {isTop && <span style={{ textTransform: 'none', opacity: 0.6, fontSize: 9 }}> (можно несколько)</span>}
              </div>
              <div className="pick-strip">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className={`pick-item${selection[cat].includes(it.id) ? ' selected' : ''}`}
                    onClick={() => togglePick(cat, it.id)}
                  >
                    <div className="icon-circle" style={{ background: '#f4f4f4' }}>
                      {it.image ? <img src={it.image} /> : <CategoryIcon cat={cat} />}
                    </div>
                    <span className="n">{it.name}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <button className="primary-btn" onClick={onSave}>
        {isEdit ? 'Сохранить изменения' : 'Сохранить в «Мои луки»'}
      </button>
      {!isEdit && (
        <button className="secondary-btn" onClick={shuffle}>Перемешать случайно</button>
      )}
    </>
  );
}
