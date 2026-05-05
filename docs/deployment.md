# Despliegue

## Plataforma

Vercel. URL de producción: https://recetarium-one.vercel.app

El despliegue es automático: cada push a `main` lanza un nuevo build.

## Cómo está configurado

El proyecto es un monorepo con frontend (Vite) y backend (Express). Vercel lo gestiona con un solo `vercel.json` en la raíz:

- Las rutas `/api/*` se redirigen a `server/src/index.js`, que actúa como función serverless.
- El resto de rutas devuelven `index.html` para que React Router funcione en cliente.
- La config `functions.includeFiles` asegura que el JSON de datos se bundlea junto con la función.

```json
{
  "functions": {
    "server/src/index.js": {
      "includeFiles": "server/src/data/**"
    }
  },
  "rewrites": [
    { "source": "/api/:path*", "destination": "/server/src/index.js" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## Variables de entorno

| Variable | Valor en producción | Dónde se configura |
|---|---|---|
| `VITE_API_URL` | `https://recetarium-one.vercel.app/api/v1` | Vercel → Settings → Environment Variables |

Sin esta variable el frontend cae al default `http://localhost:3001/api/v1` y no carga datos en producción.

## Limitación actual

El backend usa un fichero JSON como base de datos (`server/src/data/recetas.json`). En Vercel el sistema de ficheros es de solo lectura en runtime, así que las escrituras (crear, editar, borrar recetas) no persisten entre invocaciones. Las lecturas sí funcionan porque el fichero se bundlea en el despliegue.

La solución prevista para fases posteriores es migrar a una base de datos externa (MongoDB Atlas o similar).

## Pasos para redesplegar desde cero

1. Importar el repositorio en Vercel (o conectarlo si ya existe).
2. El framework se detecta automáticamente como Vite.
3. Añadir la variable `VITE_API_URL` en Settings → Environment Variables.
4. Hacer push a `main` — Vercel despliega solo.
