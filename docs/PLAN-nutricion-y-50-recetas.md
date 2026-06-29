# Recetarium: plan de valores nutricionales + 50 recetas nuevas

> Documento de trabajo para continuar desde **Claude Code** en el repo `recetarium/`.
> Ejecutar las fases **en orden**. Cada fase tiene checklist y snippets concretos.

---

## Cómo usar este documento

1. Abre Claude Code en la raíz del repo `recetarium/`.
2. Resuelve primero las **Decisiones pendientes** (abajo).
3. Ejecuta **Fase 0 -> 1 -> 2 -> 3** en orden. No saltes la Fase 0 (sin el fix, crear recetas da 500).

---

## Estado actual (junio 2026)

- **Stack:** React + TS + Vite (frontend) · Express + Neon PostgreSQL + Drizzle ORM (backend).
- **Deploy:** Vercel -> https://recetarium-one.vercel.app · Repo: github.com/troustrider/recetarium
- **BD:** 2 tablas.
  - `categories`: 5 sabores con UUID fijos (`salado`, `dulce`, `amargo`, `umami`, `acido`).
  - `recetas`: desnormalizada. `ingredientes` y `pasos` se guardan como **jsonb**. Columnas: `id, nombre, categoria, tiempo_preparacion, favorita, imagen, precio_por_porcion (NOT NULL CHECK > 0), porciones (default 1), category_id (FK), ingredientes, pasos`.
- **API:** base `/api/v1/recetas` -> `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `PATCH /:id/favorita`, `DELETE /:id`.
- **Bug ya arreglado en local (PENDIENTE de push):** `create()` en `server/src/services/recetasService.js` insertaba `precio_por_porcion = 0`, que viola el `CHECK (> 0)` -> **HTTP 500 en toda alta de receta**. El fix hace que `create()` lea `precioPorPorcion` y `porciones` del payload (default 1). Ver Fase 0.
- **Aviso:** `sql/schema.sql` está **desactualizado** (le faltan columnas que la BD real sí usa). La fuente fiable es `server/src/lib/schema.js` (Drizzle) + el comportamiento real de la API.
- **Sin GitHub MCP:** los push los hace Karim a mano.

### 7 recetas ya diseñadas (sin cargar todavía)

Diseñadas en chat, falta cargarlas (Fase 2). Todas saladas, proteína alta:

| Nombre | Sabor | Min | Proteína base |
|---|---|---|---|
| Shakshuka | salado | 25 | huevos + feta |
| Pollo teriyaki | umami | 20 | pollo |
| Pollo al miso | umami | 25 | pollo |
| Pollo griego (limón y orégano) | salado | 30 | pollo |
| Pollo turco especiado | salado | 30 | pollo + kwark |
| Atún oriental con cúscus perla | umami | 15 | atún |
| Bowl de avena proteico | dulce | 5 | kwark + avena + pindakaas |

(El payload completo de la shakshuka está en el historial; el resto hay que finalizarlo siguiendo el formato de la Fase 2.)

---

## Decisiones tomadas

- **Añadir valores nutricionales** a cada receta (nuevas y las ~20 existentes), **visibles en la app**.
- **Macros por porción:** `calorias` (kcal), `proteinas` (g), `carbohidratos` (g), `grasas` (g).
- **Regla de las recetas nuevas:** fácil, barato, rápido y **>= 30-40 g de proteína por porción**. Todas saladas (el suelo de proteína excluye postres y guarniciones light).

## Decisiones pendientes (resolver antes de Fase 1)

1. **Almacenamiento de la nutrición:** columnas numéricas explícitas (**recomendado**: permite ordenar/filtrar por proteína, útil para el objetivo de >=30 g) vs un único `jsonb nutricion`. Este plan asume **columnas explícitas**.
2. **Por porción** (recomendado) vs por receta. Este plan asume **por porción**.
3. **Validación:** nutrición **opcional** en `validar()` (no rompe altas viejas) pero siempre enviada en las nuevas. La regla de >=30 g se cumple **por diseño**, no se fuerza en código (si no, no podrías editar los postres existentes).
4. **Carga de las 50:** **batch POST por API** (recomendado, ya probado que funciona el endpoint tras el fix) vs `seed.sql`. Este plan asume batch POST.

---

## FASE 0 — Push del fix (lo hace Karim)

```bash
cd "C:\Users\Usuario\OneDrive\Desktop\FFE Corner Estudios\recetarium"
git add server/src/services/recetasService.js
git commit -m "fix: create acepta precioPorPorcion y porciones del payload"
git push
```

Verificar tras el redeploy (debe dar 201, no 500):

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  https://recetarium-one.vercel.app/api/v1/recetas \
  -H "Content-Type: application/json" \
  -d '{"nombre":"PING","sabor":"salado","tiempoPreparacion":1,"ingredientes":[{"nombre":"x","cantidad":1,"unidad":"ud","familia":"otros"}],"pasos":["x"],"precioPorPorcion":1,"porciones":1}'
```

Luego borra el PING con `DELETE /api/v1/recetas/:id`.

---

## FASE 1 — Feature de nutrición

### 1.1 Migración en Neon (BD)

Columnas nullable (para no romper las filas existentes; se rellenan en 1.7):

```sql
ALTER TABLE recetas
  ADD COLUMN calorias      INTEGER,
  ADD COLUMN proteinas     NUMERIC(5,1),
  ADD COLUMN carbohidratos NUMERIC(5,1),
  ADD COLUMN grasas        NUMERIC(5,1);
```

Actualiza también `sql/schema.sql` para que deje de estar desfasado.

### 1.2 Drizzle schema — `server/src/lib/schema.js`

Añade dentro de `recetas`:

```js
calorias:      integer('calorias'),
proteinas:     numeric('proteinas', { precision: 5, scale: 1 }),
carbohidratos: numeric('carbohidratos', { precision: 5, scale: 1 }),
grasas:        numeric('grasas', { precision: 5, scale: 1 }),
```

### 1.3 Service — `server/src/services/recetasService.js`

- En `create()` y `update()`: añade `calorias, proteinas, carbohidratos, grasas` al destructuring y a las columnas/valores del `INSERT` / `UPDATE` (default `null`).
- En los `SELECT` de `getAll()` y `getById()`: añade `r.calorias, r.proteinas, r.carbohidratos, r.grasas`.

### 1.4 Controller — `server/src/controllers/recetasController.js`

En `validar()`, validación opcional (no obligatoria):

```js
const NUTRI = ['calorias', 'proteinas', 'carbohidratos', 'grasas']
NUTRI.forEach((k) => {
  if (data[k] != null && (typeof data[k] !== 'number' || data[k] < 0))
    errores.push(`${k} debe ser un número >= 0`)
})
```

### 1.5 Swagger — `server/src/config/swagger.js`

Añade las 4 propiedades a los schemas `Receta` y `RecetaInput`:

```yaml
calorias:      { type: integer, example: 520 }
proteinas:     { type: number, example: 38.5 }
carbohidratos: { type: number, example: 45 }
grasas:        { type: number, example: 18 }
```

### 1.6 Frontend

Inspecciona `src/types`, `src/api`, `src/components`, `src/pages`:

- Añade los 4 campos a la interfaz `Receta` en `src/types`.
- Muéstralos en la tarjeta y/o detalle de receta (una fila de macros: `kcal · P / C / G`).
- Si hay formulario de crear/editar, añade los 4 inputs.

### 1.7 Backfill de las ~20 recetas existentes

Estima macros por porción de cada receta a partir de sus `ingredientes` y `porciones`, y rellena con `UPDATE` por id en Neon (o un script node que recorra `GET /recetas` y haga `PUT`). Mantén el formato por porción.

### 1.8 Tests — `vitest`

- Test de `validar()`: nutrición ausente = válida; negativa = error.
- Test de `create()`: persiste y devuelve los 4 macros.

---

## FASE 2 — 50 recetas nuevas (+ las 7 pendientes)

### Reparto objetivo (~50)

- **Asiática ~26** (Japón al frente): donburi, gyudon, oyakodon, katsudon, pollo teriyaki, yakitori, salmón teriyaki, tofu agedashi/teriyaki, tamago, onigirazu... + **China** (mapo tofu, kung pao, ternera con brócoli, arroz frito con huevo y pollo, char siu) + **Corea** (bibimbap, bulgogi, dak galbi, tofu jjigae, gyeran) + **Sudeste asiático** (larb, satay, pollo a la albahaca thai, bún de cerdo/pollo). **Sin India.**
- **Mediterránea ~19** (griega y turca al frente): souvlaki, gyros de pollo, bowls de pollo con tzatziki, keftedes + **turca** (köfte, tavuk şiş, menemen, çılbır, kebab de pollo) + **italiana** (pasta al tonno/pollo proteica, piccata) + **española** (atún, pollo, tortilla proteica).
- **Fusión / otras ~5.**

### Reglas (todas)

- Fácil, barato, rápido (idealmente <= 30-40 min).
- **>= 30-40 g de proteína por porción** (asegurar con pollo, huevo, atún, ternera, gambas, tofu, salmón, legumbres + lácteo).
- Saladas. `imagen: null`. `precio_por_porcion` y `porciones` realistas. Macros completos (Fase 1).

### Evitar duplicados

Ya existen en la BD: Paella valenciana, Ramen de pollo, Gyozas de cerdo y col, Pad Thai de gambas, Sopa de miso con tofu, Risotto de setas, Tiramisú, Fabada, Croquetas de jamón, Ensalada griega, Hamburguesa smash, Brownies, Macarons, Tarta de zanahoria, Mousse de chocolate, Leche frita, Tacos al pastor, Sushi rolls de salmón, Pizza margherita, Curry de garbanzos. **No repetir esos nombres** ni los de las 7 ya diseñadas.

### Formato de payload (POST `/api/v1/recetas`)

```json
{
  "nombre": "Gyudon",
  "categoria": "japonesa",
  "sabor": "umami",
  "tiempoPreparacion": 20,
  "imagen": null,
  "precioPorPorcion": 2.8,
  "porciones": 2,
  "calorias": 540,
  "proteinas": 36,
  "carbohidratos": 62,
  "grasas": 14,
  "ingredientes": [
    {"nombre":"ternera en lonchas finas","cantidad":300,"unidad":"g","familia":"carnes"},
    {"nombre":"arroz","cantidad":300,"unidad":"g","familia":"cereales"}
  ],
  "pasos": ["...", "..."]
}
```

- `sabor` debe ser uno de: salado, dulce, amargo, umami, acido.
- Cada ingrediente: `{nombre, cantidad (>0), unidad, familia}` (todos obligatorios).
- `pasos`: array de strings no vacíos.

### Carga (batch)

Script node o bucle de `curl` que recorra un array de recetas y haga `POST`. Cargar también las **7 ya diseñadas**. Manejar errores por receta (loguear el id/nombre que falle, seguir con el resto).

---

## FASE 3 — Debug extensivo (al terminar)

- [ ] `npm run lint` (raíz) sin errores.
- [ ] `npm run build` (tsc -b + vite build) compila.
- [ ] `npm test` (vitest) verde, incluidos los nuevos tests de nutrición.
- [ ] API en prod: probar `GET /recetas`, `GET /recetas/:id`, `POST`, `PUT`, `PATCH /favorita`, `DELETE` (crear+borrar de prueba).
- [ ] Verificar que `GET /recetas` devuelve los 4 macros en todas (existentes backfilleadas + nuevas).
- [ ] Front: las recetas nuevas se ven, filtros por sabor/categoría funcionan, los macros se renderizan.
- [ ] Generación de lista de la compra desde varias recetas sigue funcionando.
- [ ] Logs de Vercel sin errores 500 tras la carga.
- [ ] Conteo final de recetas = ~20 existentes + 7 + 50.
- [ ] `precio_por_porcion` de las nuevas no es 0 (confirma el fix de Fase 0).

---

## Apéndice — contrato y validación actuales

- `POST /api/v1/recetas` valida en `recetasController.js`: `nombre`, `sabor` (enum), `tiempoPreparacion` (num > 0), `ingredientes` (array no vacío, cada uno con nombre/cantidad>0/unidad/familia), `pasos` (array de strings no vacíos). `categoria`, `imagen`, `precioPorPorcion`, `porciones` son opcionales y no se validan.
- El service resuelve `category_id` a partir de `sabor` (`getCategoryId`). Sabor desconocido -> error.
