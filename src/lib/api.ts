import { getInitDataRaw } from './telegram';
import type { ClothingItem, Look, Category } from '../types';

const API_URL = import.meta.env.VITE_API_URL as string | undefined;
const USE_MOCKS = !API_URL;

// Локальный кэш для автономного тестирования интерфейса
const STORAGE_KEY_ITEMS = 'wardrobe_items_cache';
const STORAGE_KEY_LOOKS = 'wardrobe_looks_cache';

function getStoredItems(): ClothingItem[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_ITEMS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStoredItems(items: ClothingItem[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
  } catch {}
}

function getStoredLooks(): Look[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_LOOKS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStoredLooks(looks: Look[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY_LOOKS, JSON.stringify(looks));
  } catch {}
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

function delay<T>(v: T, ms = 300): Promise<T> {
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
      const url = URL.createObjectURL(file);
      const item: ClothingItem = {
        id: crypto.randomUUID(),
        userId: 'local_user',
        imageUrl: url,
        createdAt: new Date().toISOString(),
        ...meta,
      };
      const existing = getStoredItems();
      const updated = [item, ...existing];
      setStoredItems(updated);
      return delay(item, 800);
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