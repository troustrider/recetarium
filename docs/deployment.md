# Despliegue

## Plataforma

Vercel. URL de producción: https://recetarium-one.vercel.app

El despliegue es automático: cada push a `main` lanza un nuevo build.

## Cómo está configurado

El proyecto es un monorepo con frontend (Vite) y backend (Express). Vercel lo gestiona con un solo `vercel.json` en la raíz:

- Las rutas `/api/*` se redirigen a `api/index.js`, que actúa como función serverless.
- `api/index.js` es un wrapper ESM que importa el servidor Express desde `server/src/index.js`.
- `includeFiles` bundlea `server/src/**` y `server/package.json` junto con la función.
- `headers` añade la CSP y las cabeceras de seguridad. La CSP no lleva `unsafe-inline` en `script-src`, que es lo que acota tener el token de sesión en `localStorage`.
- El resto de rutas devuelven `index.html` para que React Router funcione en cliente.

```json
{
  "functions": {
    "api/index.js": {
      "includeFiles": "server/src/**,server/package.json"
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
| `VITE_NEON_AUTH_URL` | URL del servicio Neon Auth. La usan el login en el cliente **y** el backend para descargar el JWKS con el que verifica los tokens | Obligatoria |

> **Cuidado con `VITE_NEON_AUTH_URL`.** Tiene que apuntar a la auth de la **misma rama de Neon** que `DATABASE_URL`. Si el bundle mira a la rama de pruebas y la API a producción, el login entra pero `GET /yo` devuelve 401 y la app queda en bucle contra la landing, sin forma de entrar.
>
> No la marques como «Sensitive»: viaja en el bundle igualmente, y marcarla impide releerla para comprobar erratas.

`DATABASE_URL` se configura en el panel de Vercel (Settings → Environment Variables). Nunca se commitea al repositorio.

## Pasos para redesplegar desde cero

1. Importar el repositorio en Vercel (o conectarlo si ya existe).
2. El framework se detecta automáticamente como Vite.
3. Añadir `DATABASE_URL` y `VITE_NEON_AUTH_URL` en Settings → Environment Variables.
4. Provisionar Neon Auth en esa rama y dejar la lista blanca sembrada (`server/scripts/invitar.mjs`), o nadie podrá entrar.
4. Hacer push a `main` — Vercel despliega solo.
