import qrcode from 'qrcode-generator';

export const SHAPES = ['square', 'rounded', 'circle'];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const hexToRgb = (hex) => {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((ch) => ch + ch).join('') : clean;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
};

const rgbToHex = (r, g, b) => {
  const toHex = (value) => value.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const interpolateColor = (hexA, hexB, t) => {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  return rgbToHex(
    Math.round(a.r + (b.r - a.r) * t),
    Math.round(a.g + (b.g - a.g) * t),
    Math.round(a.b + (b.b - a.b) * t)
  );
};

const getGradientColor = (nx, ny, colors) => {
  const validColors = colors.filter(Boolean);
  if (!validColors.length) return '#111827';
  if (validColors.length === 1) return validColors[0];

  const t = clamp((nx + ny) / 2, 0, 1);
  if (validColors.length === 2) return interpolateColor(validColors[0], validColors[1], t);

  const segments = validColors.length - 1;
  const segment = clamp(t * segments, 0, segments - 0.0001);
  const index = Math.floor(segment);
  return interpolateColor(validColors[index], validColors[index + 1], segment - index);
};

const roundedRectPath = (ctx, x, y, w, h, r) => {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

// Dibuja el "molde" (contorno) del QR: cuadrado, redondeado o circular.
const drawShape = (ctx, shape, size, fill) => {
  ctx.fillStyle = fill;
  if (shape === 'circle') {
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 'rounded') {
    roundedRectPath(ctx, 0, 0, size, size, size * 0.14);
    ctx.fill();
  } else {
    ctx.fillRect(0, 0, size, size);
  }
};

// Área cuadrada disponible para los módulos, de modo que sus esquinas
// (donde están los patrones de posición) nunca queden fuera del molde.
const getInnerSize = (shape, canvasSize, padding) => {
  if (shape === 'circle') {
    return Math.floor(canvasSize / Math.SQRT2 - padding * 2);
  }
  if (shape === 'rounded') {
    const radius = canvasSize * 0.14;
    const safePadding = Math.max(padding, Math.ceil(radius * 0.3));
    return Math.floor(canvasSize - safePadding * 2);
  }
  return Math.floor(canvasSize - padding * 2);
};

const drawCenterLogo = (ctx, img, center, qrSize) => {
  const logoSize = qrSize * 0.2;
  const x = center - logoSize / 2;
  const y = center - logoSize / 2;
  const pad = qrSize * 0.015;

  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.96)';
  roundedRectPath(ctx, x - pad, y - pad, logoSize + pad * 2, logoSize + pad * 2, logoSize * 0.2);
  ctx.fill();

  roundedRectPath(ctx, x, y, logoSize, logoSize, logoSize * 0.15);
  ctx.clip();
  ctx.drawImage(img, x, y, logoSize, logoSize);
  ctx.restore();
};

const luminance = (hex) => {
  const { r, g, b } = hexToRgb(hex);
  const lin = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

const contrastRatio = (hexA, hexB) => {
  const a = luminance(hexA);
  const b = luminance(hexB);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

export const MIN_CONTRAST = 4;

/**
 * Devuelve un aviso si los colores pueden dificultar la lectura del QR,
 * o null si todo está bien. Con fondo transparente no se puede saber.
 */
export const getScanWarning = (colors, bgColor, transparentBg) => {
  if (transparentBg) return null;
  const valid = colors.filter(Boolean);
  if (!valid.length) return null;

  const bgLum = luminance(bgColor);
  const darkerModules = valid.every((color) => luminance(color) < bgLum);
  if (!darkerModules) {
    return 'Los puntos deben ser más oscuros que el fondo; muchos lectores no leen QR invertidos.';
  }

  const worst = Math.min(...valid.map((color) => contrastRatio(color, bgColor)));
  if (worst < MIN_CONTRAST) {
    return 'Contraste bajo entre algún color y el fondo: el QR podría no escanear. Usa tonos más oscuros.';
  }
  return null;
};

/**
 * Dibuja el QR en un canvas. Los módulos son siempre cuadrados (máxima
 * compatibilidad con lectores); `shape` solo cambia el contorno del QR.
 */
export const drawQR = (canvas, options) => {
  const {
    link,
    bgColor = '#ffffff',
    transparentBg = false,
    size = 540,
    margin = 18,
    shape = 'square',
    colors = ['#111827'],
    logoImage = null,
  } = options;

  const text = (link || '').trim();
  if (!canvas || !text) return;

  const ctx = canvas.getContext('2d');
  const canvasSize = clamp(Number(size) || 540, 200, 1200);
  const padding = clamp(Number(margin) || 0, 0, 100);
  // Con fondo transparente no hay molde visible, así que se usa el área completa.
  const activeShape = transparentBg || !SHAPES.includes(shape) ? 'square' : shape;

  // Con logo se sube la corrección de errores para que el QR siga siendo legible.
  const qr = qrcode(0, logoImage ? 'H' : 'M');
  qr.addData(text);
  qr.make();

  const moduleCount = qr.getModuleCount();
  const inner = getInnerSize(activeShape, canvasSize, padding);
  // Módulos de tamaño entero: evita costuras entre cuadros y mejora la lectura.
  const block = Math.max(1, Math.floor(inner / moduleCount));
  const qrSize = block * moduleCount;
  const offset = Math.floor((canvasSize - qrSize) / 2);

  canvas.width = canvasSize;
  canvas.height = canvasSize;
  ctx.clearRect(0, 0, canvasSize, canvasSize);

  if (!transparentBg) {
    drawShape(ctx, activeShape, canvasSize, bgColor);
  }

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (!qr.isDark(row, col)) continue;

      const x = offset + col * block;
      const y = offset + row * block;
      ctx.fillStyle = getGradientColor(
        (col + 0.5) / moduleCount,
        (row + 0.5) / moduleCount,
        colors
      );
      ctx.fillRect(x, y, block, block);
    }
  }

  if (logoImage) {
    drawCenterLogo(ctx, logoImage, canvasSize / 2, qrSize);
  }
};
