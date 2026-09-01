import { getInitDataRaw } from './telegram';
import { dbGetAll, dbPut, dbDelete, dbUpdate, STORES, migrateFromLocalStorageOnce } from './db';
import type { ClothingItem, Look, Category, LookFolder } from '../types';

const API_URL = import.meta.env.VITE_API_URL as string | undefined;
const USE_MOCKS = !API_URL;

function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const readyPromise = USE_MOCKS ? migrateFromLocalStorageOnce() : Promise.resolve();

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData;
  const headers: Record<string, string> = {
    Authorization: `tma ${getInitDataRaw()}`,
    ...(init?.headers as Record<string, string>),
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`API ${path} failed (${res.status}): ${errText}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  async listItems(category?: Category): Promise<ClothingItem[]> {
    if (USE_MOCKS) {
      await readyPromise;
      const items = await dbGetAll<ClothingItem>(STORES.items);
      items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      return category ? items.filter((i) => i.category === category) : items;
    }
    const qs = category ? `?category=${category}` : '';
    return request<ClothingItem[]>(`/items${qs}`);
  },

  async uploadItem(
    file: File | Blob,
    meta: { category: Category; color: string; brand?: string; name: string }
  ): Promise<ClothingItem> {
    if (USE_MOCKS) {
      await readyPromise;
      const base64Url = await fileToBase64(file);
      const item: ClothingItem = {
        id: crypto.randomUUID(),
        userId: 'local_user',
        imageUrl: base64Url,
        createdAt: new Date().toISOString(),
        ...meta,
      };
      await dbPut(STORES.items, item);
      return item;
    }
    const form = new FormData();
    form.append('file', file, 'item.png');
    form.append('category', meta.category);
    form.append('color', meta.color);
    form.append('name', meta.name);
    if (meta.brand) form.append('brand', meta.brand);
    return request<ClothingItem>('/items/upload', { method: 'POST', body: form });
  },

  async deleteItem(id: string): Promise<void> {
    if (USE_MOCKS) {
      await readyPromise;
      await dbDelete(STORES.items, id);
      return;
    }
    await request<void>(`/items/${id}`, { method: 'DELETE' });
  },

  async listLooks(): Promise<Look[]> {
    if (USE_MOCKS) {
      await readyPromise;
      const looks = await dbGetAll<Look>(STORES.looks);
      looks.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      return looks;
    }
    return request<Look[]>('/looks');
  },

  async saveLook(look: Omit<Look, 'id' | 'userId' | 'createdAt'>): Promise<Look> {
    if (USE_MOCKS) {
      await readyPromise;
      const saved: Look = {
        id: crypto.randomUUID(),
        userId: 'local_user',
        createdAt: new Date().toISOString(),
        folderId: look.folderId ?? null,
        ...look,
      };
      await dbPut(STORES.looks, saved);
      return saved;
    }
    return request<Look>('/looks', { method: 'POST', body: JSON.stringify(look) });
  },

  async deleteLook(id: string): Promise<void> {
    if (USE_MOCKS) {
      await readyPromise;
      await dbDelete(STORES.looks, id);
      return;
    }
    await request<void>(`/looks/${id}`, { method: 'DELETE' });
  },

  async moveLook(id: string, folderId: string | null): Promise<Look | undefined> {
    if (USE_MOCKS) {
      await readyPromise;
      return dbUpdate<Look>(STORES.looks, id, (look) => ({ ...look, folderId }));
    }
    return request<Look>(`/looks/${id}`, { method: 'PATCH', body: JSON.stringify({ folderId }) });
  },

  async listFolders(): Promise<LookFolder[]> {
    if (USE_MOCKS) {
      await readyPromise;
      const folders = await dbGetAll<LookFolder>(STORES.folders);
      folders.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      return folders;
    }
    return request<LookFolder[]>('/folders');
  },

  async createFolder(name: string, parentId: string | null): Promise<LookFolder> {
    if (USE_MOCKS) {
      await readyPromise;
      const folder: LookFolder = {
        id: crypto.randomUUID(),
        userId: 'local_user',
        name,
        parentId,
        createdAt: new Date().toISOString(),
      };
      await dbPut(STORES.folders, folder);
      return folder;
    }
    return request<LookFolder>('/folders', { method: 'POST', body: JSON.stringify({ name, parentId }) });
  },

  async deleteFolder(id: string): Promise<void> {
    if (USE_MOCKS) {
      await readyPromise;
      await dbDelete(STORES.folders, id);
      return;
    }
    await request<void>(`/folders/${id}`, { method: 'DELETE' });
  },
};
