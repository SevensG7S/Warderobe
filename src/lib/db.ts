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
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });
  return dbPromise;
}

export async function dbGetAll<T>(store: string): Promise<T[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const os = tx.objectStore(store);
    const req = os.getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
    tx.onerror = () => reject(tx.error);
  });
}

export async function dbPut<T>(store: string, value: T): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const os = tx.objectStore(store);
    const req = os.put(value);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => resolve(value);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
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
      const putReq = os.put(updated);
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
    tx.oncomplete = () => {};
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
  });
}

export async function dbDelete(store: string, id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const os = tx.objectStore(store);
    const req = os.delete(id);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
  });
}

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