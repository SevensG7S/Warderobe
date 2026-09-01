/**
 * Removes a roughly-uniform background from a clothing photo by flood-filling
 * from the image edges. This is the same heuristic the original prototype used —
 * it's fast and needs no model download, but only works well on plain
 * (studio-style) backgrounds and can eat into light-colored fabric.
 *
 * TODO (roadmap step 5): replace the body of this function with
 * `@imgly/background-removal`'s `removeBackground(file)` call, keeping the
 * same `(file: File) => Promise<string>` signature so nothing else changes.
 */
export function removeBackgroundAuto(file: File, maxWidth = 600): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > maxWidth || h > maxWidth) {
          if (w > h) {
            h = Math.round((h * maxWidth) / w);
            w = maxWidth;
          } else {
            w = Math.round((w * maxWidth) / h);
            h = maxWidth;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);

        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        // Sample background color from the four corners.
        const corners = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + (w - 1)) * 4];
        let bgR = 0, bgG = 0, bgB = 0;
        corners.forEach((idx) => {
          bgR += data[idx];
          bgG += data[idx + 1];
          bgB += data[idx + 2];
        });
        bgR /= 4; bgG /= 4; bgB /= 4;

        const tolerance = 18;
        const visited = new Uint8Array(w * h);
        const queue: number[] = [];

        for (let x = 0; x < w; x++) {
          queue.push(x, 0);
          queue.push(x, h - 1);
        }
        for (let y = 0; y < h; y++) {
          queue.push(0, y);
          queue.push(w - 1, y);
        }

        function colorDist(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) {
          return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
        }

        let head = 0;
        while (head < queue.length) {
          const px = queue[head++];
          const py = queue[head++];
          const pIdx = py * w + px;

          if (visited[pIdx]) continue;
          visited[pIdx] = 1;

          const dIdx = pIdx * 4;
          const r = data[dIdx];
          const g = data[dIdx + 1];
          const b = data[dIdx + 2];

          const dist = colorDist(r, g, b, bgR, bgG, bgB);

          if (dist <= tolerance) {
            data[dIdx + 3] = 0; // fully transparent

            if (px > 0 && !visited[pIdx - 1]) queue.push(px - 1, py);
            if (px < w - 1 && !visited[pIdx + 1]) queue.push(px + 1, py);
            if (py > 0 && !visited[pIdx - w]) queue.push(px, py - 1);
            if (py < h - 1 && !visited[pIdx + w]) queue.push(px, py + 1);
          } else if (dist <= tolerance + 8) {
            // Soft edge anti-aliasing.
            const alphaRatio = (dist - tolerance) / 8;
            data[dIdx + 3] = Math.round(data[dIdx + 3] * alphaRatio);
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}
