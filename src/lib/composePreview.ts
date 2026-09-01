import type { LookLayer, ClothingItem } from '../types';

const CANVAS_CSS_WIDTH = 480;
const CANVAS_CSS_HEIGHT = 380;
const ITEM_CSS_SIZE = 120;
const RENDER_SCALE = 2; // рендерим в 2x для чёткости превью

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Рисует слои лука на canvas так же, как они выглядят в конструкторе,
 * и возвращает готовую превью-картинку в виде data URL.
 * Используется вместо эмодзи-заглушки для сохранённых образов.
 */
export async function composeLookPreview(
  layers: LookLayer[],
  items: ClothingItem[]
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_CSS_WIDTH * RENDER_SCALE;
  canvas.height = CANVAS_CSS_HEIGHT * RENDER_SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.fillStyle = '#16161a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const sorted = [...layers].sort((a, b) => a.zIndex - b.zIndex);

  for (const layer of sorted) {
    const item = items.find((it) => it.id === layer.itemId);
    if (!item) continue;
    try {
      const img = await loadImage(item.imageUrl);
      const size = ITEM_CSS_SIZE * RENDER_SCALE * layer.scale;
      const cx = (layer.x + ITEM_CSS_SIZE / 2) * RENDER_SCALE;
      const cy = (layer.y + ITEM_CSS_SIZE / 2) * RENDER_SCALE;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 14;
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
      ctx.restore();
    } catch (err) {
      console.warn('Failed to draw layer for preview', err);
    }
  }

  return canvas.toDataURL('image/png', 0.85);
}
