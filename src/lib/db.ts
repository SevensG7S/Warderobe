import { AppState, emptyState } from '../types';

const DB_NAME = 'WardrobeDB';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';
const STATE_KEY = 'current_state';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveStateToDB(state: AppState): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(state, STATE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Best-effort persistence — if IndexedDB is unavailable the app still
    // works for the current session, it just won't survive a reload.
  }
}

export async function loadStateFromDB(): Promise<AppState> {
  try {
    const db = await openDB();
    const saved = await new Promise<AppState | undefined>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(STATE_KEY);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(undefined);
    });
    return saved ?? emptyState();
  } catch {
    return emptyState();
  }
}
