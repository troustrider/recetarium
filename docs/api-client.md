# Capa de red

## Cómo está organizado

El frontend se comunica con el backend a través de `src/api/client.ts`. Todas las llamadas a la API pasan por ahí — los hooks no usan `fetch` directamente.

```
Hook (useRecetas, useReceta)
  → src/api/client.ts
    → fetch → Express /api/v1/recetas
```

## URL base

La URL base sale de la variable de entorno `VITE_API_URL`. Si no existe, cae a `http://localhost:3001/api/v1`.

```
# .env (no se sube al repo)
VITE_API_URL=http://localhost:3001/api/v1
```

En producción (Vercel), se configura como variable de entorno en el panel del proyecto.

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

`getRecetas` acepta un objeto `{ categoria?, sabor? }` que se convierte en query params.

## Estados de red en la UI

Los hooks gestionan tres estados:

- **loading** — la petición está en vuelo; la UI muestra `<LoadingSpinner />`
- **error** — la petición falló; la UI muestra `<ErrorMessage />` con opción de reintentar
- **data** — la petición tuvo éxito; la UI renderiza el contenido

## Tipos

Los tipos del contrato de datos están en `src/types/receta.ts` y son los mismos que usa el backend. El cliente usa `Omit<Receta, 'id' | 'favorita'>` para los datos de creación y edición, ya que esos campos los asigna el servidor.
