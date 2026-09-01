import React, { useEffect, useState } from 'react';
import { useWardrobeStore } from '../store/useWardrobeStore';
import { haptic, hapticSuccess } from '../lib/telegram';
import { LookDetailModal } from './LookDetailModal';
import { LookBuilderScreen } from './LookBuilderScreen';
import type { Look } from '../types';

export const LooksLibraryScreen: React.FC = () => {
  const {
    items,
    looks,
    folders,
    currentFolderId,
    setCurrentFolderId,
    fetchLooks,
    fetchFolders,
    createFolder,
    removeFolder,
    removeLook,
  } = useWardrobeStore();

  const [viewingLook, setViewingLook] = useState<Look | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showBuilder, setShowBuilder] = useState(false);

  useEffect(() => {
    fetchLooks();
    fetchFolders();
  }, [fetchLooks, fetchFolders]);

  if (showBuilder) {
    return (
      <div>
        <div style={{ padding: '0 20px', marginTop: '2px' }}>
          <button
            className="btn-secondary"
            style={{ width: 'auto', display: 'inline-flex', padding: '8px 14px', marginBottom: 4 }}
            onClick={() => {
              haptic('light');
              setShowBuilder(false);
            }}
          >
            ← К папкам
          </button>
        </div>
        <LookBuilderScreen
          folderId={currentFolderId}
          onSaved={() => setShowBuilder(false)}
        />
      </div>
    );
  }

  const childFolders = folders.filter((f) => f.parentId === currentFolderId);
  const folderLooks = looks.filter((l) => (l.folderId ?? null) === currentFolderId);

  // Хлебные крошки от корня до текущей папки
  const crumbs: { id: string | null; name: string }[] = [{ id: null, name: 'Луки' }];
  let cursor = currentFolderId;
  const chain: { id: string; name: string }[] = [];
  while (cursor) {
    const f = folders.find((fl) => fl.id === cursor);
    if (!f) break;
    chain.unshift({ id: f.id, name: f.name });
    cursor = f.parentId;
  }
  crumbs.push(...chain);

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    haptic('medium');
    await createFolder(name, currentFolderId);
    hapticSuccess();
    setNewFolderName('');
    setShowNewFolder(false);
  };

  return (
    <div className="screen-content" style={{ paddingBottom: 90 }}>
      <div className="breadcrumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={c.id ?? 'root'}>
            {i > 0 && <span>/</span>}
            <button
              className={i === crumbs.length - 1 ? 'current' : ''}
              onClick={() => {
                haptic('light');
                setCurrentFolderId(c.id);
              }}
            >
              {c.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {!showNewFolder ? (
        <button
          className="btn-secondary"
          style={{ width: 'auto', display: 'inline-flex', padding: '8px 14px', marginBottom: 14 }}
          onClick={() => {
            haptic('light');
            setShowNewFolder(true);
          }}
        >
          📁 Новая папка
        </button>
      ) : (
        <div className="new-folder-row">
          <input
            className="text-input"
            placeholder="Название папки"
            value={newFolderName}
            autoFocus
            onChange={(e) => setNewFolderName(e.target.value)}
          />
          <button className="btn-secondary" style={{ flex: '0 0 auto' }} onClick={handleCreateFolder}>
            ✓
          </button>
          <button
            className="btn-secondary"
            style={{ flex: '0 0 auto' }}
            onClick={() => {
              setShowNewFolder(false);
              setNewFolderName('');
            }}
          >
            ✕
          </button>
        </div>
      )}

      {childFolders.length > 0 && (
        <>
          <div className="section-divider">Папки</div>
          <div className="grid" style={{ marginBottom: 10 }}>
            {childFolders.map((f) => (
              <div
                key={f.id}
                className="folder-card"
                onClick={() => {
                  haptic('light');
                  setCurrentFolderId(f.id);
                }}
              >
                <span className="folder-icon">📁</span>
                <span className="folder-name">{f.name}</span>
                <button
                  className="delete-btn"
                  style={{ position: 'static', width: 22, height: 22, flexShrink: 0 }}
                  title="Удалить папку"
                  onClick={(e) => {
                    e.stopPropagation();
                    haptic('medium');
                    removeFolder(f.id);
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="section-divider">Образы {folderLooks.length > 0 ? `(${folderLooks.length})` : ''}</div>
      {folderLooks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-dim)', fontSize: '13px' }}>
          Здесь пока нет сохранённых образов
        </div>
      ) : (
        <div className="grid">
          {folderLooks.map((look) => (
            <div
              key={look.id}
              className="item-card look-thumb"
              style={{ padding: 0, aspectRatio: 1 }}
              onClick={() => {
                haptic('light');
                setViewingLook(look);
              }}
            >
              <div className="thumb checker-bg" style={{ height: '100%', borderRadius: 12 }}>
                {look.previewUrl ? (
                  <img src={look.previewUrl} alt={look.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '24px' }}>✨</span>
                )}
              </div>
              <div className="look-name">{look.name}</div>
              <button
                className="delete-btn"
                title="Удалить"
                onClick={(e) => {
                  e.stopPropagation();
                  haptic('medium');
                  removeLook(look.id);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        className="fab"
        title="Собрать новый образ"
        onClick={() => {
          haptic('medium');
          setShowBuilder(true);
        }}
      >
        +
      </button>

      {viewingLook && (
        <LookDetailModal
          look={viewingLook}
          items={items}
          onClose={() => setViewingLook(null)}
          onDelete={() => removeLook(viewingLook.id)}
        />
      )}
    </div>
  );
};
