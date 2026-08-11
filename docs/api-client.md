# Capa de red

## Cómo está organizado

Todas las llamadas a la API pasan por `src/api/http.ts`. Los hooks y las páginas no usan `fetch` directamente, y los módulos por dominio (`client.ts` para recetas, `estado.ts`, `yo.ts`, `sesiones.ts`, `invitados.ts`) se apoyan en él.

`apiFetch` hace dos cosas que antes decidía cada sitio por su cuenta: pone la cabecera `Authorization` con el token de sesión, y ante un 401 sobrevenido (sesión caducada o revocada con la app abierta) olvida el token y recarga, para que la puerta lleve a la landing sin que ninguna pantalla tenga que saber de sesiones.

`yo.ts` es la excepción deliberada: no usa `apiFetch` porque ahí un 401 es la respuesta normal de "no has entrado", y recargar sería un bucle.

```
Hook (useRecetas, useReceta)
  → src/api/client.ts
    → src/api/http.ts  (token de sesión, manejo del 401)
      → fetch → Express /api/v1/recetas
```

## URL base

La URL base sale de la variable de entorno `VITE_API_URL`. Si no existe, cae a `/api/v1` (ruta relativa), que funciona directamente en Vercel al compartir dominio con la función serverless.

```
# .env (no se sube al repo)
VITE_API_URL=http://localhost:3001/api/v1
```

`VITE_API_URL` solo hace falta si el frontend y el backend están en dominios distintos.

## Funciones del cliente

Todas las funciones son `async` y devuelven tipos de `src/types/receta.ts`. Si la respuesta no es `ok`, lanzan un `Error` con el mensaje del servidor.

| Función | Método | Ruta | Devuelve |
|---------|--------|------|----------|
| `getRecetas(filtros?)` | GET | `/recetas` | `Receta[]` |
| `getReceta(id)` | GET | `/recetas/:id` | `Receta` |
| `createReceta(data)` | POST | `/recetas` | `Receta` |
| `updateReceta(id, data)` | PUT | `/recetas/:id` | `Receta` |
| `toggleFavorita(id)` | PATCH | `/recetas/:id/favorita` | `Receta` |
| `deleteReceta(id)` | DELETE | `/recetas/:id` | `void` |
| `restoreReceta(id)` | POST | `/recetas/:id/restaurar` | `Receta` |

`getRecetas` acepta un objeto `{ categoria?, sabor? }` que se convierte en query params.

## Estados de red en la UI

Los hooks gestionan tres estados:

- **loading** — la petición está en vuelo; la UI muestra `<LoadingSpinner />`
- **error** — la petición falló; la UI muestra `<ErrorMessage />` con opción de reintentar
- **data** — la petición tuvo éxito; la UI renderiza el contenido

## Tipos

Los tipos del contrato de datos están en `src/types/receta.ts` y son los mismos que usa el backend. El cliente usa `Omit<Receta, 'id' | 'favorita'>` para los datos de creación y edición, ya que esos campos los asigna el servidor. `favorita` y `privada` no son columnas de la receta: el servidor los deriva del hogar que pregunta.
