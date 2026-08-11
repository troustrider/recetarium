# API

Base URL: `/api/v1`. Esta página cubre el recurso de recetas; el resto de endpoints
(estado del hogar, sesión y administración) están tabulados en [design.md](design.md) y con
detalle en Swagger UI, en `/api/docs`.

## Acceso

**Todos los endpoints exigen sesión.** El token va en la cabecera `Authorization: Bearer`.
Sin ella la respuesta es `401`.

Sobre el catálogo hay además permisos por rol:

| Operación | Quién puede |
|---|---|
| Leer | Cualquiera con sesión. Ve el catálogo común más las recetas privadas de su hogar |
| Crear | Cualquiera. Un admin crea en el catálogo común salvo que mande `privada: true`; el resto solo recetas de su hogar |
| Editar y borrar en el catálogo común | Solo `admin`, si no `403` |
| Editar y borrar una receta privada | Solo su hogar. Si es de otro, `404` y no `403`, para no filtrar que existe |
| Marcar favorita | Cualquiera que vea la receta. Es del hogar, no de la receta |

## Endpoints

### GET /api/v1/recetas

Devuelve todas las recetas. Acepta filtros opcionales por query params.

**Query params opcionales**
- `categoria` — filtra por categoría exacta (ej. `?categoria=italiana`)
- `sabor` — filtra por sabor (ej. `?sabor=salado`)

**Respuesta 200**
```json
[
  {
    "id": "a1b2c3d4-...",
    "nombre": "Pasta carbonara",
    "categoria": "italiana",
    "sabor": "salado",
    "tiempoPreparacion": 25,
    "favorita": false,
    "ingredientes": [
      { "nombre": "huevo", "cantidad": 2, "unidad": "unidades", "familia": "proteínas" }
    ],
    "pasos": ["Cocer la pasta.", "Mezclar con el huevo fuera del fuego."]
  }
]
```

---

### GET /api/v1/recetas/:id

Devuelve una receta por su ID.

**Respuesta 200** — la receta (misma estructura de arriba)
**Respuesta 404** — `{ "error": "Receta no encontrada" }`

---

### POST /api/v1/recetas

Crea una receta nueva. El ID y el campo `favorita` los asigna el servidor.

**Body**
```json
{
  "nombre": "Pasta carbonara",
  "categoria": "italiana",
  "sabor": "salado",
  "tiempoPreparacion": 25,
  "ingredientes": [
    { "nombre": "huevo", "cantidad": 2, "unidad": "unidades", "familia": "proteínas" }
  ],
  "pasos": ["Cocer la pasta.", "Mezclar con el huevo fuera del fuego."]
}
```

**Respuesta 201** — la receta creada (incluye `id` y `favorita: false`)
**Respuesta 400** — `{ "errores": ["nombre es obligatorio", ...] }`

---

### PUT /api/v1/recetas/:id

Sustituye una receta completa. Requiere todos los campos (mismo body que POST).

**Respuesta 200** — la receta actualizada
**Respuesta 400** — errores de validación
**Respuesta 404** — receta no encontrada

---

### PATCH /api/v1/recetas/:id/favorita

Alterna el campo `favorita` de la receta (true → false, false → true).

**Respuesta 200** — la receta actualizada
**Respuesta 404** — receta no encontrada

---

### DELETE /api/v1/recetas/:id

Elimina una receta.

**Respuesta 204** — sin cuerpo
**Respuesta 404** — receta no encontrada

---

## Validación

La validación se aplica en los endpoints POST y PUT. Los campos obligatorios son:

- `nombre` — string no vacío
- `sabor` — uno de: `salado`, `dulce`, `amargo`, `umami`, `acido`
- `tiempoPreparacion` — número mayor que 0
- `ingredientes` — array con al menos un elemento; cada ingrediente necesita `nombre`, `cantidad` (número > 0), `unidad` y `familia`
- `pasos` — array con al menos un string no vacío

`categoria` es opcional.

---

## Persistencia

Los datos se almacenan en PostgreSQL (Neon). La capa de servicio (`recetasService.js`) es la única que conoce este detalle: rutas y controladores son agnósticos a la fuente de datos.

`favorita` y `privada` no son columnas de la receta: el servicio los deriva del hogar que
pregunta, así que la misma receta sale con `favorita` distinta para cada hogar sin que el
contrato cambie de forma.
