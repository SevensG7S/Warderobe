import React, { useState, useRef } from 'react';
import { api } from '../lib/api';
import { useWardrobeStore } from '../store/useWardrobeStore';
import { haptic, hapticSuccess } from '../lib/telegram';
import { CATEGORY_LABELS, COLOR_OPTIONS, type Category } from '../types';

interface AddScreenProps {
  onSuccess: () => void;
}

export const AddScreen: React.FC<AddScreenProps> = ({ onSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addItem = useWardrobeStore((s) => s.addItem);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [category, setCategory] = useState<Category>('top');
  const [color, setColor] = useState<string>(COLOR_OPTIONS[0].hex);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setIsProcessing(true);
    setStatusText('Удаляем фон…');
    haptic('medium');

    setTimeout(() => {
      setIsProcessing(false);
      setStatusText('✓ Фон удалён');
      hapticSuccess();
    }, 1200);
  };

  const handleSubmit = async () => {
    if (!file || !name.trim()) return;
    setIsProcessing(true);
    setStatusText('Сохраняем вещь…');
    haptic('heavy');

    try {
      const created = await api.uploadItem(file, {
        category,
        color,
        brand: brand.trim() || undefined,
        name: name.trim(),
      });
      addItem(created);
      hapticSuccess();
      onSuccess();
    } catch (err) {
      console.error(err);
      setStatusText('Ошибка сохранения');
      haptic('rigid');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="screen-content">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div
        className={`upload-zone ${isProcessing ? 'processing' : ''}`}
        onClick={() => fileInputRef.current?.click()}
      >
        {preview ? (
          <div className="preview-img">
            <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            {isProcessing && <div className="scanline" />}
          </div>
        ) : (
          <>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 16V4M12 4L7 9M12 4l5 5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" strokeLinecap="round" />
            </svg>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>Загрузите фото вещи</div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Фон будет удалён автоматически</div>
          </>
        )}
      </div>

      {statusText && (
        <div className="status-pill">
          {isProcessing && <span className="dot-pulse" />}
          {statusText}
        </div>
      )}

      <div className="field">
        <label>Категория</label>
        <div className="field-row">
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((catKey) => (
            <button
              key={catKey}
              type="button"
              className={`pill-select ${category === catKey ? 'sel' : ''}`}
              onClick={() => {
                haptic('light');
                setCategory(catKey);
              }}
            >
              {CATEGORY_LABELS[catKey]}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Цвет</label>
        <div className="field-row">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c.hex}
              type="button"
              className={`pill-select ${color === c.hex ? 'sel' : ''}`}
              onClick={() => {
                haptic('light');
                setColor(c.hex);
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: c.hex }} />
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Название</label>
        <input
          className="text-input"
          placeholder="Например, Оверсайз худи"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="field">
        <label>Бренд</label>
        <input
          className="text-input"
          placeholder="Например, Bershka"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
        />
      </div>

      <button
        className="btn-primary"
        disabled={!file || !name.trim() || isProcessing}
        onClick={handleSubmit}
      >
        {isProcessing ? 'Сохранение…' : 'Сохранить в гардероб'}
      </button>
    </div>
  );
};