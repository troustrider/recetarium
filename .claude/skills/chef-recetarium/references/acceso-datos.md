# Acceso a los datos: API y Neon MCP

Dos vías para leer/escribir la BD. Regla práctica: **lecturas por MCP si está disponible** (SQL con proyecciones = muchos menos tokens que un GET de 230 recetas completas); **escrituras por API** (pasa por la validación del servidor). Si falta una vía, la otra cubre todo.

## Vía API

| Entorno | Base URL |
|---|---|
| Producción | `https://recetarium-one.vercel.app/api/v1` |
| Local | `http://localhost:3001/api/v1` (backend arrancado desde `server/` con `npm run dev`) |

**Endpoints:**
- `GET /recetas` — público. Filtros: `?categoria=japonesa`, `?sabor=salado` (combinables). Devuelve recetas completas — pesado; si solo necesitas nombres para dedup, filtra en local (jq / PowerShell) y no pegues el JSON entero en el contexto.
- `GET /recetas/:id` — público.
- `POST /recetas` — requiere header `x-app-key`. Body: JSON del contrato. Devuelve 201 con la receta creada (incluye `id`).
- `PUT /recetas/:id`, `PATCH /recetas/:id/favorita`, `DELETE /recetas/:id` — también con `x-app-key`.

**La clave `x-app-key`:** es la variable `APP_KEY` (en Vercel para prod; en `server/.env` para local). En local, si `APP_KEY` no está definida, el middleware deja pasar sin clave. Nunca imprimas la clave en la conversación; léela del `.env` directamente al construir el comando. Si no hay forma de obtenerla, entrega el comando curl con `x-app-key: <APP_KEY>` como placeholder para que Karim lo ejecute.

**Ejemplos (PowerShell, usar `curl.exe`, no el alias):**

```powershell
# Solo nombres, para dedup barato
curl.exe -s https://recetarium-one.vercel.app/api/v1/recetas | ConvertFrom-Json | Select-Object nombre, tipo, categoria

# Crear (la receta en receta.json para evitar problemas de quoting)
curl.exe -s -X POST https://recetarium-one.vercel.app/api/v1/recetas -H "Content-Type: application/json" -H "x-app-key: $env:APP_KEY" -d "@receta.json"
```

## Vía Neon MCP

Herramientas `mcp__Neon__*`. Localiza el proyecto con `list_projects` (busca el que contiene la BD del recetarium) y usa `run_sql`.

**Lecturas útiles:**

```sql
-- Dedup: solo nombres
SELECT nombre FROM recetas ORDER BY nombre;

-- Filtro por criterios (ejemplo: principales rápidos y proteicos, baratos)
SELECT r.nombre, r.tiempo_preparacion, r.precio_por_porcion, r.proteinas, r.categoria
FROM recetas r JOIN categories c ON r.category_id = c.id
WHERE r.tipo = 'principal' AND r.tiempo_preparacion <= 20 AND r.proteinas >= 25
ORDER BY r.precio_por_porcion;

-- Modo nevera: recetas que usan un ingrediente (JSONB)
SELECT nombre FROM recetas, jsonb_array_elements(ingredientes) AS i
WHERE i->>'nombre' ILIKE '%calabacin%' OR i->>'nombre' ILIKE '%calabacín%';

-- Nombres de ingrediente ya en uso (para reutilizarlos exactos)
SELECT DISTINCT i->>'nombre' AS ingrediente, i->>'familia' AS familia
FROM recetas, jsonb_array_elements(ingredientes) AS i ORDER BY 1;
```

**Escritura (solo si la vía API no es viable):** el INSERT directo se salta la validación del servidor — valida tú contra el contrato antes. Resuelve `category_id` desde el sabor:

```sql
INSERT INTO recetas (nombre, categoria, tiempo_preparacion, ingredientes, pasos,
                     precio_por_porcion, porciones, calorias, proteinas, carbohidratos, grasas, tipo, category_id)
SELECT 'Shakshuka', 'mediterranea', 25, '[...]'::jsonb, '[...]'::jsonb,
       2.2, 2, 420, 31, 18, 26, 'principal', id
FROM categories WHERE name = 'salado'
RETURNING id, nombre;
```

Tras cualquier escritura (API o MCP), verifica con un SELECT/GET y confirma a Karim nombre e id. No ejecutes nunca UPDATE/DELETE masivos; una receta cada vez.
