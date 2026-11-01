const form = {
  link: document.getElementById("linkInput"),
  logoUrl: document.getElementById("logoUrlInput"),
  logoInput: document.getElementById("logoInput"),
  bgColor: document.getElementById("bgColor"),
  transparentBg: document.getElementById("transparentBg"),
  size: document.getElementById("sizeInput"),
  margin: document.getElementById("marginInput"),
  style: document.getElementById("styleSelect"),
  format: document.getElementById("formatSelect"),
  color1: document.getElementById("color1"),
  color2: document.getElementById("color2"),
  color3: document.getElementById("color3"),
};

const canvas = document.getElementById("qrCanvas");
const ctx = canvas.getContext("2d");
let currentLogo = null;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3
    ? clean.split("").map((ch) => ch + ch).join("")
    : clean;

  const num = parseInt(full, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToHex(r, g, b) {
  const toHex = (v) => v.toString(16).padStart(2, "0");
  return "#" + toHex(r) + toHex(g) + toHex(b);
}

function interpolateColor(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);

  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const blue = Math.round(a.b + (b.b - a.b) * t);

  return rgbToHex(r, g, blue);
}

function getGradientColor(x, y, width, height, colors) {
  const validColors = colors.filter(Boolean);

  if (validColors.length === 0) return "#111827";
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
}

function roundedRectPath(context, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + w - radius, y);
  context.quadraticCurveTo(x + w, y, x + w, y + radius);
  context.lineTo(x + w, y + h - radius);
  context.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  context.lineTo(x + radius, y + h);
  context.quadraticCurveTo(x, y + h, x, y + h - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function drawModule(context, x, y, size, shape, color) {
  context.fillStyle = color;

  if (shape === "square") {
    context.fillRect(x, y, size, size);
    return;
  }

  if (shape === "rounded") {
    const pad = size * 0.18;
    roundedRectPath(context, x + pad / 2, y + pad / 2, size - pad, size - pad, size * 0.45);
    context.fill();
    return;
  }

  if (shape === "circle") {
    context.beginPath();
    context.arc(x + size / 2, y + size / 2, size / 2.15, 0, Math.PI * 2);
    context.fill();
    return;
  }

  const inset = size * 0.24;
  roundedRectPath(context, x + inset, y + inset, size - inset * 2, size - inset * 2, size * 0.38);
  context.fill();
}

function drawCenterLogo(context, img, totalSize) {
  if (!img) return;

  const logoSize = totalSize * 0.24;
  const x = (totalSize - logoSize) / 2;
  const y = (totalSize - logoSize) / 2;

  context.save();

  context.fillStyle = "rgba(255,255,255,0.96)";
  roundedRectPath(context, x - 8, y - 8, logoSize + 16, logoSize + 16, 26);
  context.fill();

  context.beginPath();
  roundedRectPath(context, x, y, logoSize, logoSize, 18);
  context.clip();

  context.drawImage(img, x, y, logoSize, logoSize);
  context.restore();
}

function generateQRCode() {
  const link = form.link.value.trim();
  if (!link) {
    alert("Escribe una URL o link antes de generar el QR.");
    form.link.focus();
    return;
  }

  const canvasSize = clamp(Number(form.size.value) || 540, 200, 1200);
  const margin = clamp(Number(form.margin.value) || 18, 0, 100);
  const style = form.style.value;

  canvas.width = canvasSize;
  canvas.height = canvasSize;

  if (!form.transparentBg.checked) {
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    ctx.fillStyle = form.bgColor.value;
    ctx.fillRect(0, 0, canvasSize, canvasSize);
  } else {
    ctx.clearRect(0, 0, canvasSize, canvasSize);
  }

  const qr = qrcode(0, "M");
  qr.addData(link);
  qr.make();

  const moduleCount = qr.getModuleCount();
  const effective = canvasSize - margin * 2;
  const block = effective / moduleCount;

  const colors = [
    form.color1.value,
    form.color2.value,
    form.color3.value,
  ];

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (!qr.isDark(row, col)) continue;

      const x = margin + col * block;
      const y = margin + row * block;

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

  if (currentLogo) {
    drawCenterLogo(ctx, currentLogo, canvasSize);
  }
}

function handleLogoFromFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      currentLogo = img;
      generateQRCode();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function handleLogoFromUrl() {
  const url = form.logoUrl.value.trim();
  if (!url) {
    currentLogo = null;
    generateQRCode();
    return;
  }

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    currentLogo = img;
    generateQRCode();
  };
  img.onerror = () => {
    alert("No se pudo cargar la imagen desde la URL.");
  };
  img.src = url;
}

function downloadImage() {
  const format = form.format.value;
  const mimeTypes = {
    png: "image/png",
    jpeg: "image/jpeg",
    webp: "image/webp",
  };

  const extension = format === "jpeg" ? "jpg" : format;
  const link = document.createElement("a");
  link.download = `qr-custom.${extension}`;
  link.href = canvas.toDataURL(mimeTypes[format], 0.98);
  link.click();
}

async function copyCanvasToClipboard() {
  try {
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("No se pudo crear la imagen.");

    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": blob,
      }),
    ]);

    alert("La imagen del QR se copió al portapapeles.");
  } catch (error) {
    alert("No se pudo copiar la imagen automáticamente. Descárgala desde el botón de descarga.");
  }
}

document.getElementById("generateBtn").addEventListener("click", generateQRCode);
document.getElementById("downloadBtn").addEventListener("click", downloadImage);
document.getElementById("copyBtn").addEventListener("click", copyCanvasToClipboard);
form.logoInput.addEventListener("change", handleLogoFromFile);
form.logoUrl.addEventListener("change", handleLogoFromUrl);

[
  form.link,
  form.bgColor,
  form.transparentBg,
  form.size,
  form.margin,
  form.style,
  form.color1,
  form.color2,
  form.color3,
].forEach((element) => {
  element.addEventListener("input", generateQRCode);
  element.addEventListener("change", generateQRCode);
});

generateQRCode();
