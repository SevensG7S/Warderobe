import { create } from 'zustand';
import { api } from '../lib/api';
import type { ClothingItem, Look, Category, LookLayer, LookFolder } from '../types';

interface WardrobeState {
  items: ClothingItem[];
  looks: Look[];
  folders: LookFolder[];
  loading: boolean;
  activeCategory: Category | 'all';
  builderLayers: LookLayer[];
  selectedLayerItemId: string | null;
  currentFolderId: string | null;

  // Actions
  setActiveCategory: (c: Category | 'all') => void;
  fetchItems: () => Promise<void>;
  fetchLooks: () => Promise<void>;
  fetchFolders: () => Promise<void>;
  addItem: (item: ClothingItem) => void;
  removeItem: (id: string) => Promise<void>;
  addLook: (look: Look) => void;
  removeLook: (id: string) => Promise<void>;
  moveLook: (id: string, folderId: string | null) => Promise<void>;
  createFolder: (name: string, parentId: string | null) => Promise<void>;
  removeFolder: (id: string) => Promise<void>;
  setCurrentFolderId: (id: string | null) => void;

  // Builder actions
  addToCanvas: (itemId: string) => void;
  updateLayer: (itemId: string, patch: Partial<LookLayer>) => void;
  removeLayer: (itemId: string) => void;
  bringToFront: (itemId: string) => void;
  clearCanvas: () => void;
  selectLayer: (itemId: string | null) => void;
}

export const useWardrobeStore = create<WardrobeState>((set, get) => ({
  items: [],
  looks: [],
  folders: [],
  loading: false,
  activeCategory: 'all',
  builderLayers: [],
  selectedLayerItemId: null,
  currentFolderId: null,

  setActiveCategory: (c) => set({ activeCategory: c }),

  fetchItems: async () => {
    set({ loading: true });
    try {
      const items = await api.listItems();
      set({ items });
    } finally {
      set({ loading: false });
    }
  },

  fetchLooks: async () => {
    const looks = await api.listLooks();
    set({ looks });
  },

  fetchFolders: async () => {
    const folders = await api.listFolders();
    set({ folders });
  },

  addItem: (item) => set({ items: [item, ...get().items] }),

  removeItem: async (id) => {
    await api.deleteItem(id);
    set({ items: get().items.filter((i) => i.id !== id) });
  },

  addLook: (look) => set({ looks: [look, ...get().looks] }),

  removeLook: async (id) => {
    await api.deleteLook(id);
    set({ looks: get().looks.filter((l) => l.id !== id) });
  },

  moveLook: async (id, folderId) => {
    const updated = await api.moveLook(id, folderId);
    if (!updated) return;
    set({ looks: get().looks.map((l) => (l.id === id ? updated : l)) });
  },

  createFolder: async (name, parentId) => {
    const folder = await api.createFolder(name, parentId);
    set({ folders: [folder, ...get().folders] });
  },

  removeFolder: async (id) => {
    await api.deleteFolder(id);
    // Луки из удалённой папки поднимаем на уровень выше, а не удаляем.
    const removed = get().folders.find((f) => f.id === id);
    set({
      folders: get().folders.filter((f) => f.id !== id),
      looks: get().looks.map((l) =>
        l.folderId === id ? { ...l, folderId: removed?.parentId ?? null } : l
      ),
    });
  },

  setCurrentFolderId: (id) => set({ currentFolderId: id }),

  addToCanvas: (itemId) => {
    const exists = get().builderLayers.some((l) => l.itemId === itemId);
    if (exists) {
      set({ selectedLayerItemId: itemId });
      return;
    }
    const maxZ = get().builderLayers.reduce((acc, curr) => Math.max(acc, curr.zIndex), 0);
    const newLayer: LookLayer = {
      itemId,
      x: 100 + (get().builderLayers.length * 15) % 80,
      y: 80 + (get().builderLayers.length * 25) % 120,
      scale: 1,
      rotation: 0,
      zIndex: maxZ + 1,
    };
    set({
      builderLayers: [...get().builderLayers, newLayer],
      selectedLayerItemId: itemId,
    });
  },

  updateLayer: (itemId, patch) => {
    set({
      builderLayers: get().builderLayers.map((layer) =>
        layer.itemId === itemId ? { ...layer, ...patch } : layer
      ),
    });
  },

  removeLayer: (itemId) => {
    set({
      builderLayers: get().builderLayers.filter((l) => l.itemId !== itemId),
      selectedLayerItemId: get().selectedLayerItemId === itemId ? null : get().selectedLayerItemId,
    });
  },

  bringToFront: (itemId) => {
    const maxZ = get().builderLayers.reduce((acc, curr) => Math.max(acc, curr.zIndex), 0);
    set({
      builderLayers: get().builderLayers.map((l) =>
        l.itemId === itemId ? { ...l, zIndex: maxZ + 1 } : l
      ),
    });
  },

  clearCanvas: () => set({ builderLayers: [], selectedLayerItemId: null }),

  selectLayer: (itemId) => set({ selectedLayerItemId: itemId }),
}));
