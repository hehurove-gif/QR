import { useEffect, useRef, useState } from 'react';
import qrcode from 'qrcode-generator';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const hexToRgb = (hex) => {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((ch) => ch + ch).join('') : clean;
  const num = parseInt(full, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
};

const rgbToHex = (r, g, b) => {
  const toHex = (value) => value.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const interpolateColor = (hexA, hexB, t) => {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const blue = Math.round(a.b + (b.b - a.b) * t);
  return rgbToHex(r, g, blue);
};

const getGradientColor = (x, y, width, height, colors) => {
  const validColors = colors.filter(Boolean);
  if (!validColors.length) return '#111827';
  if (validColors.length === 1) return validColors[0];

  const nx = x / width;
  const ny = y / height;
  const t = clamp((nx + ny) / 2, 0, 1);

  if (validColors.length === 2) {
    return interpolateColor(validColors[0], validColors[1], t);
  }

  const segments = validColors.length - 1;
  const segment = clamp(t * segments, 0, segments - 0.0001);
  const index = Math.floor(segment);
  const localT = segment - index;
  return interpolateColor(validColors[index], validColors[index + 1], localT);
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

const drawModule = (ctx, x, y, size, shape, color) => {
  ctx.fillStyle = color;

  if (shape === 'square') {
    ctx.fillRect(x, y, size, size);
    return;
  }

  if (shape === 'rounded') {
    const pad = size * 0.18;
    roundedRectPath(ctx, x + pad / 2, y + pad / 2, size - pad, size - pad, size * 0.45);
    ctx.fill();
    return;
  }

  if (shape === 'circle') {
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2.15, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  const inset = size * 0.24;
  roundedRectPath(ctx, x + inset, y + inset, size - inset * 2, size - inset * 2, size * 0.38);
  ctx.fill();
};

const drawCenterLogo = (ctx, img, totalSize) => {
  if (!img) return;

  const logoSize = totalSize * 0.24;
  const x = (totalSize - logoSize) / 2;
  const y = (totalSize - logoSize) / 2;

  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.96)';
  roundedRectPath(ctx, x - 8, y - 8, logoSize + 16, logoSize + 16, 26);
  ctx.fill();

  ctx.beginPath();
  roundedRectPath(ctx, x, y, logoSize, logoSize, 18);
  ctx.clip();
  ctx.drawImage(img, x, y, logoSize, logoSize);
  ctx.restore();
};

function App() {
  const canvasRef = useRef(null);
  const [link, setLink] = useState('https://github.com');
  const [logoUrl, setLogoUrl] = useState('');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [transparentBg, setTransparentBg] = useState(false);
  const [size, setSize] = useState(540);
  const [margin, setMargin] = useState(18);
  const [style, setStyle] = useState('rounded');
  const [format, setFormat] = useState('png');
  const [colors, setColors] = useState(['#111827', '#0ea5e9', '#8b5cf6']);
  const [logoImage, setLogoImage] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const safeLink = link.trim();
    if (!safeLink) return;

    const qr = qrcode(0, 'M');
    qr.addData(safeLink);
    qr.make();

    const canvasSize = clamp(Number(size) || 540, 200, 1200);
    const padding = clamp(Number(margin) || 18, 0, 100);
    const moduleCount = qr.getModuleCount();
    const effective = canvasSize - padding * 2;
    const block = effective / moduleCount;

    canvas.width = canvasSize;
    canvas.height = canvasSize;

    if (!transparentBg) {
      ctx.clearRect(0, 0, canvasSize, canvasSize);
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvasSize, canvasSize);
    } else {
      ctx.clearRect(0, 0, canvasSize, canvasSize);
    }

    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (!qr.isDark(row, col)) continue;

        const x = padding + col * block;
        const y = padding + row * block;
        const color = getGradientColor(
          x + block / 2,
          y + block / 2,
          canvasSize,
          canvasSize,
          colors
        );

        drawModule(ctx, x, y, block, style, color);
      }
    }

    if (logoImage) {
      drawCenterLogo(ctx, logoImage, canvasSize);
    }
  }, [link, bgColor, transparentBg, size, margin, style, colors, logoImage]);

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => setLogoImage(img);
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUrl = () => {
    const currentUrl = logoUrl.trim();
    if (!currentUrl) {
      setLogoImage(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setLogoImage(img);
    img.onerror = () => {
      alert('No se pudo cargar la imagen desde la URL.');
      setLogoImage(null);
    };
    img.src = currentUrl;
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const mimeTypes = {
      png: 'image/png',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
    };

    const extension = format === 'jpeg' ? 'jpg' : format;
    const link = document.createElement('a');
    link.download = `qr-custom.${extension}`;
    link.href = canvas.toDataURL(mimeTypes[format], 0.98);
    link.click();
  };

  const copyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Unable to create blob');

      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ]);
      alert('La imagen del QR se copió al portapapeles.');
    } catch (error) {
      alert('No se pudo copiar la imagen automáticamente. Descárgala desde el botón de descarga.');
    }
  };

  const updateColor = (index, value) => {
    const next = [...colors];
    next[index] = value;
    setColors(next);
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto grid max-w-6xl gap-6 rounded-3xl border border-slate-700/80 bg-slate-900/70 p-4 shadow-2xl shadow-slate-950/40 backdrop-blur xl:grid-cols-[420px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-700/80 bg-slate-900/80 p-5">
          <h1 className="mb-5 text-3xl font-bold tracking-tight">QR Designer Pro</h1>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-semibold text-slate-300">URL / Link</label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-500"
              placeholder="https://ejemplo.com"
            />
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-semibold text-slate-300">Logo desde URL</label>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              onBlur={handleLogoUrl}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-500"
              placeholder="https://..."
            />
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-semibold text-slate-300">Subir imagen del centro</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-200 file:mr-3 file:rounded-md file:border-0 file:bg-sky-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-semibold text-slate-300">Colores del QR</label>
            <div className="grid grid-cols-3 gap-3">
              {colors.map((color, index) => (
                <input
                  key={index}
                  type="color"
                  value={color}
                  onChange={(e) => updateColor(index, e.target.value)}
                  className="h-12 w-full cursor-pointer rounded-xl border border-slate-700 bg-transparent p-1"
                />
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-semibold text-slate-300">Color de fondo</label>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="h-12 w-full cursor-pointer rounded-xl border border-slate-700 bg-transparent p-1"
            />
          </div>

          <label className="mb-4 flex items-center gap-3 text-sm font-medium text-slate-300">
            <input
              type="checkbox"
              checked={transparentBg}
              onChange={(e) => setTransparentBg(e.target.checked)}
              className="h-4 w-4 accent-sky-500"
            />
            Fondo transparente
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div className="mb-4">
              <label className="mb-2 block text-sm font-semibold text-slate-300">Tamaño</label>
              <input
                type="number"
                min="200"
                max="1200"
                step="10"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-500"
              />
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-semibold text-slate-300">Margen</label>
              <input
                type="number"
                min="0"
                max="80"
                step="1"
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="mb-4">
              <label className="mb-2 block text-sm font-semibold text-slate-300">Estilo</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-500"
              >
                <option value="square">Cuadrado</option>
                <option value="rounded">Redondeado</option>
                <option value="circle">Circular</option>
                <option value="soft">Suave</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-semibold text-slate-300">Formato</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-500"
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPG</option>
                <option value="webp">WEBP</option>
              </select>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                const sanitized = link.trim();
                if (!sanitized) {
                  alert('Escribe una URL o link antes de generar el QR.');
                  return;
                }
                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                const safeLink = sanitized;
                const qr = qrcode(0, 'M');
                qr.addData(safeLink);
                qr.make();
                const canvasSize = clamp(Number(size) || 540, 200, 1200);
                const padding = clamp(Number(margin) || 18, 0, 100);
                const moduleCount = qr.getModuleCount();
                const effective = canvasSize - padding * 2;
                const block = effective / moduleCount;

                canvas.width = canvasSize;
                canvas.height = canvasSize;
                if (!transparentBg) {
                  ctx.clearRect(0, 0, canvasSize, canvasSize);
                  ctx.fillStyle = bgColor;
                  ctx.fillRect(0, 0, canvasSize, canvasSize);
                } else {
                  ctx.clearRect(0, 0, canvasSize, canvasSize);
                }

                for (let row = 0; row < moduleCount; row++) {
                  for (let col = 0; col < moduleCount; col++) {
                    if (!qr.isDark(row, col)) continue;
                    const x = padding + col * block;
                    const y = padding + row * block;
                    const color = getGradientColor(x + block / 2, y + block / 2, canvasSize, canvasSize, colors);
                    drawModule(ctx, x, y, block, style, color);
                  }
                }

                if (logoImage) {
                  drawCenterLogo(ctx, logoImage, canvasSize);
                }
              }}
              className="rounded-xl bg-gradient-to-r from-sky-500 to-violet-600 px-4 py-3 font-semibold text-white shadow-lg shadow-sky-900/30 transition hover:brightness-110"
            >
              Generar QR
            </button>

            <button
              type="button"
              onClick={downloadImage}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:brightness-110"
            >
              Descargar
            </button>
          </div>

          <div className="mt-3">
            <button
              type="button"
              onClick={copyImage}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 font-semibold text-slate-100 transition hover:bg-slate-700"
            >
              Copiar imagen
            </button>
          </div>
        </aside>

        <main className="flex min-h-[620px] items-center justify-center rounded-2xl border border-slate-700/80 bg-slate-900/80 p-5">
          <div className="flex w-full max-w-[620px] flex-col items-center justify-center gap-4">
            <div className="grid w-full place-items-center rounded-3xl border border-slate-700 bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_75%,rgba(255,255,255,0.05)_75%),linear-gradient(45deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_75%,rgba(255,255,255,0.05)_75%)] bg-[length:28px_28px] p-5">
              <canvas ref={canvasRef} className="max-h-[560px] w-full max-w-[560px] rounded-2xl bg-white shadow-[0_16px_32px_rgba(15,23,42,0.35)]" />
            </div>
            <div className="text-sm text-slate-400">Vista previa</div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
