import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { AppState, Category, Item, Look, LookItems, emptyState } from '../types';
import { loadStateFromDB, saveStateToDB } from '../lib/db';
import { uid, todayLabel } from '../lib/format';

interface WardrobeContextValue {
  state: AppState;
  loading: boolean;
  addItem: (cat: Category, name: string, image: string | null) => void;
  removeItem: (cat: Category, id: string) => void;
  findItem: (cat: Category, id: string) => Item | undefined;
  allItemsFlat: () => (Item & { cat: Category })[];
  saveLook: (name: string, items: LookItems, editingId: string | null) => string;
  deleteLook: (id: string) => void;
  removeItemFromLook: (lookId: string, cat: Category, itemId: string) => void;
}

const WardrobeContext = createContext<WardrobeContextValue | null>(null);

export function WardrobeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(emptyState());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStateFromDB().then((s) => {
      setState(s);
      setLoading(false);
    });
  }, []);

  // Persist on every change after the initial load, mirroring the
  // prototype's save()-after-every-mutation approach.
  useEffect(() => {
    if (!loading) saveStateToDB(state);
  }, [state, loading]);

  const addItem = useCallback((cat: Category, name: string, image: string | null) => {
    setState((prev) => ({
      ...prev,
      wardrobe: {
        ...prev.wardrobe,
        [cat]: [...prev.wardrobe[cat], { id: uid(), name: name || 'Новая вещь', image }]
      }
    }));
  }, []);

  const removeItem = useCallback((cat: Category, id: string) => {
    setState((prev) => ({
      wardrobe: { ...prev.wardrobe, [cat]: prev.wardrobe[cat].filter((i) => i.id !== id) },
      looks: prev.looks.map((look) =>
        look.items[cat]?.includes(id)
          ? { ...look, items: { ...look.items, [cat]: look.items[cat].filter((i) => i !== id) } }
          : look
      )
    }));
  }, []);

  const findItem = useCallback(
    (cat: Category, id: string) => state.wardrobe[cat].find((i) => i.id === id),
    [state.wardrobe]
  );

  const allItemsFlat = useCallback(() => {
    const out: (Item & { cat: Category })[] = [];
    (Object.keys(state.wardrobe) as Category[]).forEach((cat) =>
      state.wardrobe[cat].forEach((it) => out.push({ ...it, cat }))
    );
    return out;
  }, [state.wardrobe]);

  const saveLook = useCallback((name: string, items: LookItems, editingId: string | null) => {
    const id = editingId ?? uid();
    setState((prev) => {
      if (editingId) {
        return {
          ...prev,
          looks: prev.looks.map((l) => (l.id === editingId ? { ...l, name, items } : l))
        };
      }
      const newLook: Look = { id, name, items, dateLabel: todayLabel() };
      return { ...prev, looks: [...prev.looks, newLook] };
    });
    return id;
  }, []);

  const deleteLook = useCallback((id: string) => {
    setState((prev) => ({ ...prev, looks: prev.looks.filter((l) => l.id !== id) }));
  }, []);

  const removeItemFromLook = useCallback((lookId: string, cat: Category, itemId: string) => {
    setState((prev) => ({
      ...prev,
      looks: prev.looks.map((l) =>
        l.id === lookId ? { ...l, items: { ...l.items, [cat]: l.items[cat].filter((i) => i !== itemId) } } : l
      )
    }));
  }, []);

  return (
    <WardrobeContext.Provider
      value={{ state, loading, addItem, removeItem, findItem, allItemsFlat, saveLook, deleteLook, removeItemFromLook }}
    >
      {children}
    </WardrobeContext.Provider>
  );
}

export function useWardrobe() {
  const ctx = useContext(WardrobeContext);
  if (!ctx) throw new Error('useWardrobe must be used within a WardrobeProvider');
  return ctx;
}
