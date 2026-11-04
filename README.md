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

## Cuando `hetor.dev` esté en Cloudflare (hetor.dev/tools/qr)

Hoy la app se sirve en la raíz (`wrangler.jsonc`). Para moverla a `hetor.dev/tools/qr/`:

1. En Cloudflare → Worker `qr` → Settings → Build: variable `VITE_BASE_PATH=/tools/qr/`
   y Deploy command `npx wrangler deploy -c wrangler.domain.jsonc`.
2. Lanza un nuevo despliegue. La ruta `hetor.dev/tools/qr*` tiene prioridad sobre el Worker de Hetor.

Probar en local: `VITE_BASE_PATH=/tools/qr/ npm run build`.
