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
| `GOOGLE_CLIENT_ID` | Cliente OAuth de Google, tipo «Aplicación web» | Obligatoria |
| `GOOGLE_CLIENT_SECRET` | Su secreto. Solo lo ve el backend | Obligatoria |
| `URL_API` | Base pública de la API, sin barra final. De ahí sale el `redirect_uri` que Google tiene que tener autorizado | Obligatoria en producción |
| `ORIGENES_PERMITIDOS` | Orígenes que pueden llamar a la API y a los que se puede volver tras entrar, separados por coma | Obligatoria en producción; vacía en local permite localhost |

> **El `redirect_uri` tiene que coincidir carácter a carácter** con uno de los autorizados en Google Cloud: `<URL_API>/auth/google/callback`. En producción,
> `https://recetarium-one.vercel.app/api/v1/auth/google/callback`; en local,
> `http://localhost:3001/api/v1/auth/google/callback`. Si no coincide, Google corta antes de
> enseñar la pantalla de cuentas y el error es suyo, no de la app.

> **`ORIGENES_PERMITIDOS` es la lista blanca de vuelta.** El destino que la landing manda en
> `/auth/google/inicio?destino=...` se valida contra ella: sin eso, cualquiera podría hacerse
> mandar la sesión a un sitio ajeno.

`DATABASE_URL`, `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` se configuran en el panel de Vercel (Settings → Environment Variables). Nunca se commitean al repositorio.

## Pasos para redesplegar desde cero

1. Importar el repositorio en Vercel (o conectarlo si ya existe).
2. El framework se detecta automáticamente como Vite.
3. Añadir `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `URL_API` y `ORIGENES_PERMITIDOS` en Settings → Environment Variables.
4. Aplicar `sql/2026-08-oauth-propio.sql` y dejar la lista blanca sembrada (`server/scripts/invitar.mjs`), o nadie podrá entrar.
4. Hacer push a `main` — Vercel despliega solo.
