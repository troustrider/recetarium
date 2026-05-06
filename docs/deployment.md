# Despliegue

## Plataforma

Vercel. URL de producción: https://recetarium-one.vercel.app

El despliegue es automático: cada push a `main` lanza un nuevo build.

## Cómo está configurado

El proyecto es un monorepo con frontend (Vite) y backend (Express). Vercel lo gestiona con un solo `vercel.json` en la raíz:

- Las rutas `/api/*` se redirigen a `api/index.js`, que actúa como función serverless.
- `api/index.js` es un wrapper ESM que importa el servidor Express desde `server/src/index.js`.
- `includeFiles: "server/src/**"` bundlea el código del servidor y el JSON de datos junto con la función.
- El resto de rutas devuelven `index.html` para que React Router funcione en cliente.

```json
{
  "functions": {
    "api/index.js": {
      "includeFiles": "server/src/**"
    }
  },
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/index.js" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## Variables de entorno

No se requieren variables de entorno para el despliegue básico. El frontend usa `/api/v1` como base URL por defecto (URL relativa), lo que funciona directamente en Vercel al compartir dominio con la función serverless.

| Variable | Uso | Cuándo configurarla |
|---|---|---|
| `VITE_API_URL` | Sobreescribe la URL base de la API | Solo si se despliega el frontend y el backend en dominios distintos |

## Limitación actual

El backend usa un fichero JSON como base de datos (`server/src/data/recetas.json`). En Vercel el sistema de ficheros es de solo lectura en runtime, así que las escrituras (crear, editar, borrar recetas) no persisten entre invocaciones. Las lecturas sí funcionan porque el fichero se bundlea en el despliegue.

La solución prevista para fases posteriores es migrar a una base de datos externa (MongoDB Atlas o similar).

## Pasos para redesplegar desde cero

1. Importar el repositorio en Vercel (o conectarlo si ya existe).
2. El framework se detecta automáticamente como Vite.
3. Hacer push a `main` — Vercel despliega solo.
