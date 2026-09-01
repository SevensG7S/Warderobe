// Удаление фона с фото вещи — полностью на устройстве пользователя,
// без отправки фото на сервер. Библиотека подтягивается по CDN лениво,
// при первом вызове, чтобы не раздувать основной бандл приложения.

type BgRemovalModule = {
  removeBackground: (
    input: File | Blob,
    options?: {
      progress?: (key: string, current: number, total: number) => void;
      output?: { format?: string; quality?: number };
    }
  ) => Promise<Blob>;
};

let modulePromise: Promise<BgRemovalModule> | null = null;
const CDN_URL = 'https://esm.sh/@imgly/background-removal@1.5.7';

function loadLib(): Promise<BgRemovalModule> {
  if (!modulePromise) {
    // @vite-ignore — специально грузим с CDN как ESM в рантайме браузера,
    // а не как npm-зависимость, которую нужно собирать вместе с приложением.
    modulePromise = import(/* @vite-ignore */ CDN_URL) as Promise<BgRemovalModule>;
  }
  return modulePromise;
}

export interface BgRemovalResult {
  blob: Blob;
  url: string;
}

/**
 * Убирает фон с изображения. Возвращает PNG с прозрачным фоном.
 * Если по какой-то причине (нет сети, не поддерживается устройством и т.д.)
 * обработка не удалась — бросает ошибку, и вызывающий код должен
 * аккуратно откатиться на исходное фото.
 */
export async function removeImageBackground(
  input: File | Blob,
  onProgress?: (key: string, current: number, total: number) => void
): Promise<BgRemovalResult> {
  const { removeBackground } = await loadLib();
  const blob: Blob = await removeBackground(input, {
    progress: onProgress,
    output: { format: 'image/png', quality: 0.9 },
  });
  const url = URL.createObjectURL(blob);
  return { blob, url };
}
