export type Category = 'top' | 'bottom' | 'shoes' | 'accessory' | 'outerwear' | 'dress';

export const CATEGORY_LABELS: Record<Category, string> = {
  top: 'Верх',
  bottom: 'Низ',
  shoes: 'Обувь',
  accessory: 'Аксессуар',
  outerwear: 'Верхняя одежда',
  dress: 'Платье',
};

export const COLOR_OPTIONS = [
  { label: 'Чёрный', hex: '#1c1c1c' },
  { label: 'Белый', hex: '#f6f3ec' },
  { label: 'Бежевый', hex: '#c9b790' },
  { label: 'Синий', hex: '#3a4a6b' },
  { label: 'Лавандовый', hex: '#b9a6ff' },
  { label: 'Терракот', hex: '#e8895f' },
];

export interface ClothingItem {
  id: string;
  userId: string;
  category: Category;
  color: string;
  brand?: string;
  name: string;
  imageUrl: string;
  thumbUrl?: string;
  createdAt: string;
}

export interface LookLayer {
  itemId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
}

export interface Look {
  id: string;
  userId: string;
  name: string;
  layers: LookLayer[];
  previewUrl?: string;
  createdAt: string;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}