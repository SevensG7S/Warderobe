import { getInitDataRaw } from './telegram';
import type { ClothingItem, Look, Category } from '../types';

const API_URL = import.meta.env.VITE_API_URL as string | undefined;
const USE_MOCKS = !API_URL;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData;
  const headers: Record<string, string> = {
    Authorization: `tma ${getInitDataRaw()}`,
    ...(init?.headers as Record<string, string>),
  };
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`API ${path} failed (${res.status}): ${errText}`);
  }
  return res.json() as Promise<T>;
}

// Начальные мок-данные
const MOCK_ITEMS: ClothingItem[] = [
  { id: '1', userId: 'tg_user', category: 'top', color: '#f6f3ec', brand: 'Uniqlo', name: 'Белая футболка', imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80', createdAt: new Date().toISOString() },
  { id: '2', userId: 'tg_user', category: 'bottom', color: '#3a4a6b', brand: "Levi's", name: 'Джинсы 501', imageUrl: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=500&auto=format&fit=crop&q=80', createdAt: new Date().toISOString() },
  { id: '3', userId: 'tg_user', category: 'outerwear', color: '#c9b790', brand: 'Zara', name: 'Бежевый тренч', imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&auto=format&fit=crop&q=80', createdAt: new Date().toISOString() },
  { id: '4', userId: 'tg_user', category: 'shoes', color: '#e9e5da', brand: 'Nike', name: 'Air Force 1', imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&auto=format&fit=crop&q=80', createdAt: new Date().toISOString() },
];

const MOCK_LOOKS: Look[] = [];

function delay<T>(v: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(v), ms));
}

export const api = {
  async listItems(category?: Category): Promise<ClothingItem[]> {
    if (USE_MOCKS) {
      const filtered = category ? MOCK_ITEMS.filter((i) => i.category === category) : MOCK_ITEMS;
      return delay([...filtered]);
    }
    const qs = category ? `?category=${category}` : '';
    return request<ClothingItem[]>(`/items${qs}`);
  },

  async uploadItem(file: File, meta: { category: Category; color: string; brand?: string; name: string }): Promise<ClothingItem> {
    if (USE_MOCKS) {
      const url = URL.createObjectURL(file);
      const item: ClothingItem = {
        id: crypto.randomUUID(),
        userId: 'tg_user',
        imageUrl: url,
        thumbUrl: url,
        createdAt: new Date().toISOString(),
        ...meta,
      };
      MOCK_ITEMS.unshift(item);
      return delay(item, 1500);
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
      const idx = MOCK_ITEMS.findIndex((i) => i.id === id);
      if (idx >= 0) MOCK_ITEMS.splice(idx, 1);
      return delay(undefined);
    }
    await request<void>(`/items/${id}`, { method: 'DELETE' });
  },

  async listLooks(): Promise<Look[]> {
    if (USE_MOCKS) return delay([...MOCK_LOOKS]);
    return request<Look[]>('/looks');
  },

  async saveLook(look: Omit<Look, 'id' | 'userId' | 'createdAt'>): Promise<Look> {
    if (USE_MOCKS) {
      const saved: Look = {
        id: crypto.randomUUID(),
        userId: 'tg_user',
        createdAt: new Date().toISOString(),
        ...look,
      };
      MOCK_LOOKS.unshift(saved);
      return delay(saved);
    }
    return request<Look>('/looks', { method: 'POST', body: JSON.stringify(look) });
  },
};