import type { Category } from '../types';

export interface CategoryMeta {
  label: string;
  short: string;
  soft: string;
  main: string;
  hex: string;
}

export const CATS: Record<Category, CategoryMeta> = {
  headwear: { label: '1. Головной убор', short: 'Убор', soft: 'var(--violet-soft)', main: 'var(--violet)', hex: '#6C4CFF' },
  tops:     { label: '2. Верх',          short: 'Верх', soft: 'var(--pink-soft)',   main: 'var(--pink)',   hex: '#FF5D8F' },
  bottoms:  { label: '3. Низ',           short: 'Низ',  soft: 'var(--teal-soft)',   main: 'var(--teal)',   hex: '#0FBF9F' },
  shoes:    { label: '4. Обувь',         short: 'Обувь',soft: 'var(--amber-soft)',  main: 'var(--amber)',  hex: '#FFA43D' }
};

export const CATEGORY_ORDER: Category[] = ['headwear', 'tops', 'bottoms', 'shoes'];

// Same placeholder silhouettes as the original prototype (one flat path per category),
// shown when an item has no photo yet.
const SHAPE_PATHS: Record<Category, string> = {
  headwear: 'M15 58c0-20 16-34 35-34s35 14 35 34 M15 58h70v6c0 3-2 5-5 5H20c-3 0-5-2-5-5v-6z M85 58l14-3c3-1 5 1 5 4s-2 5-5 5l-14 1',
  tops: 'M35 18l15-6 15 6 18 12-9 12-9-5v49H30V37l-9 5-9-12z',
  bottoms: 'M32 15h36l3 70h-15l-4-40-4 40H33z',
  shoes: 'M12 62c0-10 8-16 18-18l30-6c8-2 14 2 20 8l14 8c4 2 6 5 6 8 0 3-2 5-6 5H16c-3 0-4-2-4-5z'
};

export function CategoryIcon({ cat }: { cat: Category }) {
  return (
    <svg viewBox="0 0 100 100">
      <path d={SHAPE_PATHS[cat]} fill={CATS[cat].hex} />
    </svg>
  );
}
