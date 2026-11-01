import { useEffect, useRef, useState } from 'react';
import { drawQR, getScanWarning } from './qrRender';

function App() {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [link, setLink] = useState('https://github.com');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [transparentBg, setTransparentBg] = useState(false);
  const [size, setSize] = useState(540);
  const [margin, setMargin] = useState(18);
  const [shape, setShape] = useState('square');
  const [format, setFormat] = useState('png');
  const [colors, setColors] = useState(['#0f172a', '#0369a1', '#6d28d9']);
  const [logoImage, setLogoImage] = useState(null);

  useEffect(() => {
    try {
      drawQR(canvasRef.current, { link, bgColor, transparentBg, size, margin, shape, colors, logoImage });
    } catch (error) {
      // Texto demasiado largo para un QR: se conserva el último dibujo válido.
    }
  }, [link, bgColor, transparentBg, size, margin, shape, colors, logoImage]);

  const scanWarning = getScanWarning(colors, bgColor, transparentBg);

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

  const clearLogo = () => {
    setLogoImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const mimeTypes = {
      png: 'image/png',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
    };

    let source = canvas;
    if (format === 'jpeg') {
      // JPG no admite transparencia: se pinta sobre blanco para evitar esquinas negras.
      source = document.createElement('canvas');
      source.width = canvas.width;
      source.height = canvas.height;
      const flat = source.getContext('2d');
      flat.fillStyle = '#ffffff';
      flat.fillRect(0, 0, source.width, source.height);
      flat.drawImage(canvas, 0, 0);
    }

    const extension = format === 'jpeg' ? 'jpg' : format;
    const linkTag = document.createElement('a');
    linkTag.download = `qr-custom.${extension}`;
    linkTag.href = source.toDataURL(mimeTypes[format], 0.98);
    linkTag.click();
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
    <div className="min-h-screen px-4 py-10 text-slate-50">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 px-5 py-5 shadow-[0_20px_80px_rgba(15,23,42,0.38)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">QR Studio</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Diseña tu QR premium</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Ready to export
            </span>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[440px_minmax(0,1fr)]">
          <aside className="panel-glass rounded-[28px] p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Personalización</h2>
              <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-300">
                Live
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">URL / Link</label>
                <input
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700/80 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                  placeholder="https://ejemplo.com"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-300">Subir imagen del centro</label>
                  {logoImage && (
                    <button
                      type="button"
                      onClick={clearLogo}
                      className="text-xs font-semibold text-rose-300 transition hover:text-rose-200"
                    >
                      Quitar logo
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="w-full rounded-2xl border border-slate-700/80 bg-slate-950/70 px-3 py-2.5 text-sm text-slate-200 file:mr-3 file:rounded-xl file:border-0 file:bg-sky-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Paleta del QR</label>
                <div className="grid grid-cols-3 gap-3">
                  {colors.map((color, index) => (
                    <input
                      key={index}
                      type="color"
                      value={color}
                      onChange={(e) => updateColor(index, e.target.value)}
                      className="h-12 w-full cursor-pointer rounded-xl border border-slate-700/80 bg-transparent p-1"
                    />
                  ))}
                </div>
              </div>

              {scanWarning && (
                <p className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                  {scanWarning}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Fondo</label>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-12 w-full cursor-pointer rounded-xl border border-slate-700/80 bg-transparent p-1"
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-700/80 bg-slate-950/60 px-3 py-3 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={transparentBg}
                      onChange={(e) => setTransparentBg(e.target.checked)}
                      className="h-4 w-4 accent-sky-500"
                    />
                    Transparente
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Tamaño</label>
                  <input
                    type="number"
                    min="200"
                    max="1200"
                    step="10"
                    value={size}
                    onChange={(e) => setSize(Number(e.target.value))}
                    className="w-full rounded-2xl border border-slate-700/80 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Margen</label>
                  <input
                    type="number"
                    min="0"
                    max="80"
                    step="1"
                    value={margin}
                    onChange={(e) => setMargin(Number(e.target.value))}
                    className="w-full rounded-2xl border border-slate-700/80 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Forma del QR</label>
                  <select
                    value={shape}
                    onChange={(e) => setShape(e.target.value)}
                    disabled={transparentBg}
                    title={transparentBg ? 'Con fondo transparente no hay contorno visible' : undefined}
                    className="w-full rounded-2xl border border-slate-700/80 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="square">Cuadrado</option>
                    <option value="rounded">Redondeado</option>
                    <option value="circle">Circular</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Formato</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full rounded-2xl border border-slate-700/80 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
                  >
                    <option value="png">PNG</option>
                    <option value="jpeg">JPG</option>
                    <option value="webp">WEBP</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={downloadImage}
                className="rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-sky-500 px-4 py-3 font-semibold text-white shadow-[0_12px_28px_rgba(16,185,129,0.4)] transition hover:scale-[1.01] hover:brightness-110"
              >
                Descargar
              </button>
              <button
                type="button"
                onClick={copyImage}
                className="rounded-2xl border border-slate-700/80 bg-slate-900/90 px-4 py-3 font-semibold text-slate-100 transition hover:border-sky-500/60 hover:bg-slate-800"
              >
                Copiar imagen
              </button>
            </div>
          </aside>

          <main className="panel-glass rounded-[32px] p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between px-1">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">Preview</p>
                <h3 className="mt-1 text-xl font-bold text-white">Vista previa en tiempo real</h3>
              </div>
              <div className="flex gap-2">
                <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300">
                  {format.toUpperCase()}
                </span>
                <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300">
                  {transparentBg ? 'Transparent' : 'Solid'}
                </span>
              </div>
            </div>

            <div className="preview-shell rounded-[28px] p-3 sm:p-5">
              <div className="preview-card">
                <canvas ref={canvasRef} className="qr-canvas" />
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="metric-card">
                <span className="metric-label">Tamaño</span>
                <strong>{size}px</strong>
              </div>
              <div className="metric-card">
                <span className="metric-label">Margen</span>
                <strong>{margin}px</strong>
              </div>
              <div className="metric-card">
                <span className="metric-label">Forma</span>
                <strong>{{ square: 'Cuadrado', rounded: 'Redondeado', circle: 'Circular' }[shape]}</strong>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
