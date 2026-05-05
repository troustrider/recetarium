# Recetarium — Tareas Trello

Tablero: https://trello.com/b/saQXnsUb/recetarium

---

## ToDo

### Lista de la compra

> La agrupación y suma de ingredientes se hace en el cliente (hook `useListaCompra`). No hay endpoint propio — el ítem de backend no aplica.

**Frontend**
- [x] Selector de recetas con checkboxes
- [x] Vista con ingredientes agrupados por familia y cantidades sumadas (lácteos, verduras, carnes, especias, legumbres)

**Backend**
- ~~POST /api/v1/lista-compra recibe array de IDs, devuelve ingredientes fusionados por familia~~ *(descartado: se calcula en el cliente)*

**Capa de red**
- [ ] Función `generateShoppingList(recipeIds[])` tipada

---

### Guardar como favoritas

> Frontend y backend ya están implementados. Los ítems de Trello están sin marcar pero el código está hecho.

**Frontend**
- [x] Icono corazón en RecipeCard para marcar/desmarcar
- [x] ~~FavoritesContext con Provider de estado global~~ *(se usa RecetasContext — el campo `favorita` vive en la receta del servidor)*
- [x] Sección "Mis favoritas" filtrada

**Backend**
- [x] PATCH /api/v1/recetas/:id/favorita alterna el campo `favorita`

**Capa de red**
- [ ] Función `toggleFavorite(id)` tipada

---

## In Progress

### Crear receta

**Frontend**
- [x] Botón nueva receta visible en el catálogo
- [x] Formulario controlado: nombre, ingredientes (nombre + cantidad + unidad), pasos, categorías de cocina, sabor, tiempo de preparación
- [x] Validación: nombre obligatorio, al menos 1 ingrediente y 1 paso
- [x] Mensajes de error inline bajo cada campo inválido
- [x] Al guardar con éxito, redirigir al catálogo

**Backend**
- [x] POST /api/v1/recetas devuelve 201 con la receta creada
- [x] Validación en controlador: nombre obligatorio, arrays de ingredientes y pasos no vacíos
- [x] Servicio asigna id único con `crypto.randomUUID()`

**Capa de red**
- [ ] Función `createRecipe(data)` en `src/api/client.ts` tipada con interfaz `Receta`
- [ ] UI muestra spinner mientras POST está en vuelo
- [ ] UI muestra error si falla

---

### Editar recetas

**Frontend**
- [x] Botón "Editar" en vista detalle
- [x] Formulario precargado con datos actuales (mismo componente que crear)
- [x] Validación idéntica al crear

**Backend**
- [x] PUT /api/v1/recetas/:id devuelve 200 con receta actualizada o 404

**Capa de red**
- [ ] Función `updateRecipe(id, data)` tipada

---

### Ver catálogo de recetas

**Frontend**
- [x] Página principal muestra grid de tarjetas de receta
- [x] Componente RecetaCard reutilizable (nombre, categoría, sabor, tiempo)
- [x] Estado loading mientras carga, estado vacío si no hay recetas

**Backend**
- [x] GET /api/v1/recetas devuelve 200 con array (vacío si no hay)
- [x] Soporte query params: `?categoria=italiana&sabor=salado`

**Capa de red**
- [ ] Función `getRecipes(filters?)` tipada
- [ ] Gestión de estados: loading / data / error con retry

---

### Ver detalle de receta

**Frontend**
- [x] Ruta `/recetas/:id` con React Router
- [x] Página RecetaDetalle: nombre, categoría, sabor, tiempo, ingredientes con cantidad y unidad, pasos numerados
- [x] Botón volver al catálogo
- [x] Estado loading y error si la receta no existe

**Backend**
- [x] GET /api/v1/recetas/:id devuelve 200 o 404

**Capa de red**
- [ ] Función `getRecipeById(id)` tipada

---

### Borrar recetas

**Frontend**
- [x] Botón "Eliminar" en vista detalle con diálogo de confirmación
- [ ] Tras borrar, redirigir al catálogo

**Backend**
- [x] DELETE /api/v1/recetas/:id devuelve 204 o 404

**Capa de red**
- [ ] Función `deleteRecipe(id)` tipada

---

### Buscar y filtrar recetas

**Frontend**
- [x] Componente FiltroBar con selector de categoría (dinámico) y selector de sabor (fijo)
- [x] Custom hook `useFiltros` que aplica filtros al array con `useMemo`
- [x] Botón limpiar filtros

**Backend**
- [x] GET /api/v1/recetas?categoria=...&sabor=... (query params opcionales)

**Capa de red**
- [ ] `getRecipes(filters?)` acepta objeto `{ categoria?, sabor? }`

---

## Bonus (deseable antes de entregar)

- [ ] Animaciones de transición entre páginas
- [ ] Drag & drop para reordenar pasos o ingredientes
- [x] Segundo custom hook reutilizable *(hecho: `useRecetas`, `useReceta`, `useFiltros`, `useListaCompra`)*
- [ ] Lazy loading con `React.lazy` y `Suspense`
- [ ] Tests con React Testing Library
- [ ] Documentación de la API con Swagger / OpenAPI

---

## Funcionalidades opcionales (fuera de scope por ahora)

- [ ] Filtros por ingredientes, tiempo de preparación, dificultad, preferencia alimentaria
- [ ] Despensa (ingredientes disponibles en casa)
- [ ] Sugerencias de recetas con ingredientes similares
- [ ] Ajustar cantidades según número de comensales
- [ ] Modo oscuro
- [ ] Foto por receta
- [ ] Compartir receta
- [ ] Valoración de recetas
- [ ] Planificador semanal
