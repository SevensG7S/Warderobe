// Простое хранилище на IndexedDB.
// localStorage не годится для фотографий: у него маленькая квота (~5-10МБ),
// и при её превышении запись падает ТИХО (данные просто не сохраняются).
// IndexedDB даёт на порядки больше места и куда надёжнее хранит бинарные данные.

const DB_NAME = 'wardrobe_db';
const DB_VERSION = 1;

export const STORES = {
  items: 'items',
  looks: 'looks',
  folders: 'folders',
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORES.items)) {
        db.createObjectStore(STORES.items, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.looks)) {
        db.createObjectStore(STORES.looks, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.folders)) {
        db.createObjectStore(STORES.folders, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export async function dbGetAll<T>(store: string): Promise<T[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

export async function dbPut<T>(store: string, value: T): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value);
    tx.oncomplete = () => resolve(value);
    tx.onerror = () => reject(tx.error);
  });
}

export async function dbUpdate<T extends { id: string }>(
  store: string,
  id: string,
  updater: (value: T) => T
): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const os = tx.objectStore(store);
    const getReq = os.get(id);
    getReq.onsuccess = () => {
      const current = getReq.result as T | undefined;
      if (!current) {
        resolve(undefined);
        return;
      }
      const updated = updater(current);
      os.put(updated);
      resolve(updated);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function dbDelete(store: string, id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Одноразовая миграция старых данных из localStorage (если приложение
// раньше уже успело туда что-то записать) — чтобы у пользователя ничего не пропало.
export async function migrateFromLocalStorageOnce() {
  try {
    const flag = 'tma_wardrobe_migrated_v1';
    if (localStorage.getItem(flag)) return;

    const oldItemsRaw = localStorage.getItem('tma_wardrobe_items_v3');
    const oldLooksRaw = localStorage.getItem('tma_wardrobe_looks_v3');

    if (oldItemsRaw) {
      const oldItems = JSON.parse(oldItemsRaw);
      for (const it of oldItems) await dbPut(STORES.items, it);
    }
    if (oldLooksRaw) {
      const oldLooks = JSON.parse(oldLooksRaw);
      for (const lk of oldLooks) await dbPut(STORES.looks, lk);
    }
    localStorage.setItem(flag, '1');
  } catch (err) {
    console.warn('Migration skipped', err);
  }
}
