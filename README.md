# QR Designer Pro

Generador avanzado de QR con logo, degradados y exportación. Hecho con React, Vite y Tailwind CSS.

## Desarrollo

```bash
npm install
npm run dev
```

## Build de producción

```bash
npm run build
npm run preview
```

El resultado se genera en `dist/`.

## Deploy en Cloudflare Pages

| Campo | Valor |
|---|---|
| Framework preset | Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |

Opcional: define la variable de entorno `NODE_VERSION=20`.
