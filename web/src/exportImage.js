// Download helpers for the SVG and PNG exports. The SVG comes from core's toSvg (pure); the PNG is that SVG drawn on a canvas.
export const MAX_SIDE = 8192;

export function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Pixel scale for a width x height picture: 2x when it fits, lower when it would pass MAX_SIDE, 0 when even 1x is too big. */
export function pngScale(width, height) {
  const s = Math.min(2, MAX_SIDE / Math.max(width, height));
  return s >= 1 ? Math.min(2, s) : 0;
}

// A data: URL (not a blob: one) because the page's Content-Security-Policy allows data: images only.
export function svgToPng(svg, width, height) {
  const scale = pngScale(width, height);
  if (!scale) return Promise.reject(new Error("too_large"));
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = Math.round(width * scale); c.height = Math.round(height * scale);
      const g = c.getContext("2d");
      g.scale(scale, scale); g.drawImage(img, 0, 0, width, height);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error("encode_failed"))), "image/png");
    };
    img.onerror = () => reject(new Error("render_failed"));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}
