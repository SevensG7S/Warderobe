import { useState } from 'react';
import { CATEGORY_ORDER, CATS } from '../../data/categories';
import { Category } from '../../types';
import { useWardrobe } from '../../context/WardrobeContext';
import { removeBackgroundAuto } from '../../lib/bgRemoval';

export function AddItemSheet({ defaultCat, onDone }: { defaultCat: Category; onDone: () => void }) {
  const { addItem } = useWardrobe();
  const [cat, setCat] = useState<Category>(defaultCat);
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setProcessing(true);
    const result = await removeBackgroundAuto(f);
    setPhoto(result);
    setProcessing(false);
  }

  function onSave() {
    addItem(cat, name.trim(), photo);
    onDone();
  }

  return (
    <>
      <h3>Новая вещь</h3>
      <div className="field-label">Категория</div>
      <div className="chip-row">
        {CATEGORY_ORDER.map((c) => (
          <button
            key={c}
            className={`chip${c === cat ? ' active' : ''}`}
            onClick={() => setCat(c)}
          >
            {CATS[c].label.replace(/^\d\.\s/, '')}
          </button>
        ))}
      </div>
      <div className="field-label">Фото (фон удалится автоматически)</div>
      <label className="upload-box">
        <span>
          {processing ? (
            <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>Обработка...</span>
          ) : photo ? (
            <img src={photo} style={{ background: '#f4f4f4', padding: 4, borderRadius: 12 }} />
          ) : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M4 17l4.5-5.5a2 2 0 0 1 3 0L16 17M14 12l1.5-1.8a2 2 0 0 1 3 0L21 13" stroke="#A79E8C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="#A79E8C" strokeWidth="1.5" />
            </svg>
          )}
        </span>
        <span className="hint">Загрузить фото вещи</span>
        <input type="file" accept="image/*" onChange={onFile} />
      </label>
      <div className="field-label">Название</div>
      <input
        className="text-input"
        placeholder="Например, «Бомбер оверсайз»"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button className="primary-btn" onClick={onSave}>Добавить в гардероб</button>
    </>
  );
}
