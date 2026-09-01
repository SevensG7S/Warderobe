export type Category = 'headwear' | 'tops' | 'bottoms' | 'shoes';

export interface Item {
  id: string;
  name: string;
  /** Data URL (PNG) with background removed. Will become a Supabase Storage URL later. */
  image: string | null;
}

export type Wardrobe = Record<Category, Item[]>;

export interface LookItems {
  headwear: string[];
  tops: string[];
  bottoms: string[];
  shoes: string[];
}

export interface Look {
  id: string;
  name: string;
  items: LookItems;
  dateLabel: string;
}

export interface AppState {
  wardrobe: Wardrobe;
  looks: Look[];
}

export function emptyState(): AppState {
  return {
    wardrobe: { headwear: [], tops: [], bottoms: [], shoes: [] },
    looks: []
  };
}

export function emptyLookItems(): LookItems {
  return { headwear: [], tops: [], bottoms: [], shoes: [] };
}
