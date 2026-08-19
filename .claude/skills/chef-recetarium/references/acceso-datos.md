# Acceso a los datos: SQL, API y Neon MCP

Tres vías para leer/escribir la BD, y **ya no valen lo mismo**. Desde el multiusuario de agosto de 2026 la API exige sesión de usuario en todos sus endpoints, GET incluidos, así que dejó de ser la vía cómoda para el chef.

Orden de preferencia hoy:

| Vía | Sirve para | Necesita |
|---|---|---|
| **`chef-recetas.mjs` con `DATABASE_URL`** | Todo: dedup, auditoría, altas y revisiones | La cadena de conexión en `server/.env` |
| **Neon MCP** | Lecturas con proyección, exploración rápida | El conector instalado y activo en la sesión |
| **API HTTP** | Comprobar lo que ve la app, no el trabajo de chef | Un token de sesión de un usuario real |

La regla práctica: **si tienes `DATABASE_URL`, no toques la API.** Es la única vía que no depende de una sesión de usuario y la única que escribe la ficha nutricional bien (ver abajo).

### En sesiones remotas, la cadena de conexión no basta

En Claude Code web y en las sesiones remotas el contenedor sale a internet por una política de egress con lista blanca. El driver de Neon no habla Postgres por el 5432: hace HTTP contra `api.<región>.aws.neon.tech`, y ese host hay que tenerlo permitido. Si no lo está, el fallo es explícito y no se parece a un problema de credenciales:

```
NeonDbError: Server error (HTTP status 403):
Host not in allowlist: api.<región>.aws.neon.tech
```

El proyecto del recetarium vive en `eu-west-2`, así que el host a permitir es `api.eu-west-2.aws.neon.tech`.

O sea que en remoto hacen falta **las dos cosas**: `DATABASE_URL` y el host de Neon en la configuración de red del entorno. El conector MCP no tiene ese problema, porque no sale por el contenedor.

## Vía `chef-recetas.mjs` (preferente)

Se ejecuta desde `server/` y lee `DATABASE_URL` de `server/.env`. Detalle completo de subcomandos en `validador.md`.

```bash
node scripts/chef-recetas.mjs audit                    # auditoría de toda la BD
node scripts/chef-recetas.mjs check ../ruta/lote.json  # valida sin escribir
node scripts/chef-recetas.mjs apply ../ruta/lote.json  # valida y escribe
```

`apply` hace `INSERT` si el objeto no trae `id` y `UPDATE` si lo trae, y **calcula `hierro`, `sin_gluten` y `micros` desde los ingredientes**, igual que el servidor. Un `INSERT` escrito a mano no hace eso: deja las tres columnas a null y la receta fuera del filtro sin gluten.

Para el dedup, que es lo que más se repite, con el driver del propio proyecto basta:

```bash
node --input-type=module -e "
import 'dotenv/config'
import sql from './src/lib/db.js'
const filas = await sql\`SELECT nombre FROM recetas WHERE borrada_en IS NULL ORDER BY nombre\`
console.log(filas.map(f => f.nombre).join('\n'))
"
```

## Vía Neon MCP

Herramientas `mcp__Neon__*`. Localiza el proyecto con `list_projects` y usa `run_sql`.

⚠️ **No está en todas las sesiones.** Es un conector de claude.ai que se instala por cuenta, no algo del repo: en el proyecto no hay `.mcp.json`, y un `claude mcp add` hecho en la máquina local **no viaja a las sesiones web ni a las remotas**. Si `ListConnectors` no lo devuelve, no está: cae a `DATABASE_URL`, y si tampoco la hay, pídesela a Karim en vez de dar el dedup por hecho.

**Lecturas útiles.** El borrado de recetas es lógico: la fila se queda con `borrada_en` puesto. Toda lectura tiene que filtrar `borrada_en IS NULL` o verás recetas que el usuario ya borró.

```sql
-- Dedup: solo nombres
SELECT nombre FROM recetas WHERE borrada_en IS NULL ORDER BY nombre;

-- Filtro por criterios (ejemplo: principales rápidos y proteicos, baratos)
SELECT r.nombre, r.tiempo_preparacion, r.precio_por_porcion, r.proteinas, r.categoria
FROM recetas r JOIN categories c ON r.category_id = c.id
WHERE r.borrada_en IS NULL AND r.tipo = 'principal' AND r.tiempo_preparacion <= 20 AND r.proteinas >= 25
ORDER BY r.precio_por_porcion;

-- Modo nevera: recetas que usan un ingrediente (JSONB)
SELECT nombre FROM recetas, jsonb_array_elements(ingredientes) AS i
WHERE borrada_en IS NULL
  AND (i->>'nombre' ILIKE '%calabacin%' OR i->>'nombre' ILIKE '%calabacín%');

-- Nombres de ingrediente ya en uso (para reutilizarlos exactos)
SELECT DISTINCT i->>'nombre' AS ingrediente, i->>'familia' AS familia
FROM recetas, jsonb_array_elements(ingredientes) AS i
WHERE borrada_en IS NULL ORDER BY 1;
```

## Vía API

| Entorno | Base URL |
|---|---|
| Producción | `https://recetarium-one.vercel.app/api/v1` |
| Local | `http://localhost:3001/api/v1` (backend desde `server/` con `npm run dev`) |

**Todos los endpoints pasan por `requireUser`** (`server/src/lib/auth.js`). Sin cabecera de sesión devuelven `401 {"error":"Sesión requerida"}`.

```
Authorization: Bearer <token>
```

El token vale de dos formas: un **JWT de Neon Auth** (tres segmentos, se verifica contra el JWKS de `NEON_AUTH_URL`) o un **token de sesión** de la tabla `neon_auth.session` que siga vivo. Los saca la app al iniciar sesión; el chef no puede fabricarlos. Si necesitas uno, lo da Karim desde el navegador.

⚠️ **El header `x-app-key` ya no existe.** Se fue con el multiusuario: no queda ni una referencia en el código. Cualquier ejemplo que lo use está caducado.

**Endpoints:**

| Método | Ruta | Notas |
|---|---|---|
| `GET` | `/recetas` | Filtros `?categoria=` y `?sabor=`, combinables |
| `GET` | `/recetas/:id` | La receta completa |
| `POST` | `/recetas` | Body: JSON del contrato. Devuelve 201 con `id` |
| `PUT` | `/recetas/:id` | **Reemplaza el recurso entero** |
| `PATCH` | `/recetas/:id/favorita` | — |
| `DELETE` | `/recetas/:id` | Borrado lógico: pone `borrada_en` |
| `POST` | `/recetas/:id/restaurar` | Deshace el borrado lógico |

**Dos cosas de la API que cambian lo que ves:**

- **`GET /recetas` devuelve una proyección ligera.** No trae `pasos` ni `consejos`, y de la guarnición quita los suyos (`CAMPOS_LISTA` en `recetasService.js`). Para leer una receta entera, `GET /recetas/:id`. Diagnosticar pasos flojos desde el listado no funciona: no están.
- **Todo va filtrado por hogar.** Cada lectura devuelve las recetas comunes (`hogar_id IS NULL`) más las privadas del hogar de quien pide. Con otra sesión ves otro catálogo, así que un dedup hecho contra la API es un dedup contra *ese* hogar, no contra la BD.

Al crear, `hogar_id` sale del rol: un admin crea receta **común** salvo que mande `privada: true`; el resto crea siempre privada de su hogar.

```bash
curl -s -X POST https://recetarium-one.vercel.app/api/v1/recetas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d @receta.json
```

En PowerShell, `curl.exe`, no el alias.

## Escritura directa por SQL

Último recurso, solo si no hay ni script ni API. Se salta la validación del servidor **y el cálculo de la ficha nutricional**: valida contra `contrato-receta.md` antes, y después pasa `node scripts/chef-recetas.mjs nutricion` para rellenar `hierro`, `sin_gluten` y `micros`.

```sql
INSERT INTO recetas (nombre, categoria, tiempo_preparacion, ingredientes, pasos, consejos,
                     precio_por_porcion, porciones, calorias, proteinas, carbohidratos, grasas,
                     tipo, guarnicion, hogar_id, category_id)
SELECT 'Shakshuka', 'mediooriente', 25, '[...]'::jsonb, '[...]'::jsonb, '[...]'::jsonb,
       2.2, 2, 420, 31, 18, 26, 'principal', NULL, NULL, id
FROM categories WHERE name = 'salado'
RETURNING id, nombre;
```

`hogar_id NULL` = receta común, visible para todo el mundo. Y **`favorita` ya no es columna de `recetas`**: vive en la tabla `favoritas` por hogar, así que no intentes escribirla aquí.

Tras cualquier escritura, verifica con un SELECT/GET, corre `audit` y confirma a Karim nombre e id. No ejecutes nunca UPDATE/DELETE masivos; una receta cada vez.
