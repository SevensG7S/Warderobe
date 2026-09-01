import { getInitDataRaw } from './telegram';
import type { ClothingItem, Look, Category } from '../types';

const API_URL = import.meta.env.VITE_API_URL as string | undefined;
const USE_MOCKS = !API_URL;

const STORAGE_KEY_ITEMS = 'tma_wardrobe_items_v3';
const STORAGE_KEY_LOOKS = 'tma_wardrobe_looks_v3';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getStoredItems(): ClothingItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ITEMS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStoredItems(items: ClothingItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
  } catch (err) {
    console.warn('Storage quota exceeded', err);
  }
}

function getStoredLooks(): Look[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOOKS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStoredLooks(looks: Look[]) {
  try {
    localStorage.setItem(STORAGE_KEY_LOOKS, JSON.stringify(looks));
  } catch (err) {
    console.warn('Storage quota exceeded', err);
  }
}

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

function delay<T>(v: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(v), ms));
}

export const api = {
  async listItems(category?: Category): Promise<ClothingItem[]> {
    if (USE_MOCKS) {
      const items = getStoredItems();
      const filtered = category ? items.filter((i) => i.category === category) : items;
      return delay(filtered);
    }
    const qs = category ? `?category=${category}` : '';
    return request<ClothingItem[]>(`/items${qs}`);
  },

  async uploadItem(file: File, meta: { category: Category; color: string; brand?: string; name: string }): Promise<ClothingItem> {
    if (USE_MOCKS) {
      const base64Url = await fileToBase64(file);
      const item: ClothingItem = {
        id: crypto.randomUUID(),
        userId: 'local_user',
        imageUrl: base64Url,
        createdAt: new Date().toISOString(),
        ...meta,
      };
      const existing = getStoredItems();
      const updated = [item, ...existing];
      setStoredItems(updated);
      return delay(item, 400);
    }
    const form = new FormData();
    form.append('file', file);
    form.append('category', meta.category);
    form.append('color', meta.color);
    form.append('name', meta.name);
    if (meta.brand) form.append('brand', meta.brand);
    return request<ClothingItem>('/items/upload', { method: 'POST', body: form });
  },

  async deleteItem(id: string): Promise<void> {
    if (USE_MOCKS) {
      const existing = getStoredItems();
      const updated = existing.filter((i) => i.id !== id);
      setStoredItems(updated);
      return delay(undefined);
    }
    await request<void>(`/items/${id}`, { method: 'DELETE' });
  },

  async listLooks(): Promise<Look[]> {
    if (USE_MOCKS) return delay(getStoredLooks());
    return request<Look[]>('/looks');
  },

  async saveLook(look: Omit<Look, 'id' | 'userId' | 'createdAt'>): Promise<Look> {
    if (USE_MOCKS) {
      const saved: Look = {
        id: crypto.randomUUID(),
        userId: 'local_user',
        createdAt: new Date().toISOString(),
        ...look,
      };
      const existing = getStoredLooks();
      setStoredLooks([saved, ...existing]);
      return delay(saved);
    }
    return request<Look>('/looks', { method: 'POST', body: JSON.stringify(look) });
  },
};