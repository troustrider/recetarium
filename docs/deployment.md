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

| Variable | Uso | Cuándo configurarla |
|---|---|---|
| `DATABASE_URL` | Connection string de Neon (PostgreSQL) | Obligatoria en producción y local con BD |
| `VITE_API_URL` | Sobreescribe la URL base de la API | Solo si el frontend y el backend están en dominios distintos |

`DATABASE_URL` se configura en el panel de Vercel (Settings → Environment Variables). Nunca se commitea al repositorio.

## Pasos para redesplegar desde cero

1. Importar el repositorio en Vercel (o conectarlo si ya existe).
2. El framework se detecta automáticamente como Vite.
3. Añadir `DATABASE_URL` en Settings → Environment Variables con la connection string de Neon.
4. Hacer push a `main` — Vercel despliega solo.
