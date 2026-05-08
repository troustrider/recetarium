# Arquitectura de la aplicación

## Visión general

Recetarium tiene el frontend en React y el backend en Express. El frontend no guarda nada en localStorage — todo viene de la API. La despensa es la única excepción: persiste en localStorage porque es estado local del usuario, no datos de recetas.

```
Usuario → React (UI) → src/api/client.ts → Express (/api/v1) → datos en fichero (recetas.json)
```

El flujo de vuelta:

```
recetas.json → Express (JSON) → React → actualiza Context → re-renderiza UI
```

## Frontend

### Páginas

| Ruta | Componente | Qué hace |
|------|------------|----------|
| `/` | `Catalogo` | Catálogo de recetas con filtros |
| `/favoritas` | `Favoritas` | Recetas marcadas como favoritas |
| `/lista-compra` | `ListaCompra` | Lista de la compra generada |
| `/planificador` | `Planificador` | Calendario semanal con drag & drop |
| `/despensa` | `Despensa` | Inventario de ingredientes en casa |
| `/recetas/nueva` | `NuevaReceta` | Formulario para crear una receta |
| `/recetas/:id` | `DetalleReceta` | Detalle de una receta |
| `/recetas/:id/editar` | `EditarReceta` | Formulario para editar una receta |
| `*` | `NotFound` | Página 404 |

### Estructura de componentes

```
src/components/
  recetas/
    RecetaCard.tsx       → tarjeta de receta (catálogo y favoritas)
    RecetaForm.tsx       → formulario crear/editar (el mismo, con o sin datos)
    IngredienteItem.tsx  → fila de ingrediente (detalle y formulario)
  lista-compra/
    ResumenIngrediente.tsx  → ingrediente agrupado con cantidad fusionada
  shared/
    FiltroBar.tsx        → filtros de categoría y sabor
    LoadingSpinner.tsx   → estado de carga
    ErrorMessage.tsx     → estado de error con opción de reintentar
    Layout.tsx           → header sticky, navegación, dark mode
```

### Gestión de estado

**Context API** para el estado global:
- Lista de recetas cargadas desde la API (`RecetasContext`)
- Recetas seleccionadas para la lista de la compra con raciones (`ListaCompraContext`)
- Inventario de la despensa, persistido en localStorage (`DespensaContext`)
- Plan semanal de recetas por día (`PlanificadorContext`)

**Estado local** en cada componente:
- Filtros activos (solo afectan a la página donde estás)
- Estado del formulario (vive y muere en `RecetaForm`)
- Estados de red (loading, error, data) en cada página

## Backend

### Estructura por capas

```
server/src/
  routes/      → endpoints y conexión con controladores
  controllers/ → recibe la request, llama al servicio, devuelve la response
  services/    → lógica de negocio y acceso a datos
  config/      → swagger y variables de entorno
```

### Endpoints

| Método | Ruta | Qué hace |
|--------|------|----------|
| GET | `/api/v1/recetas` | Devuelve todas las recetas (filtros por query params) |
| GET | `/api/v1/recetas/:id` | Devuelve una receta por ID |
| POST | `/api/v1/recetas` | Crea una receta nueva |
| PUT | `/api/v1/recetas/:id` | Actualiza una receta completa |
| DELETE | `/api/v1/recetas/:id` | Elimina una receta |
| PATCH | `/api/v1/recetas/:id/favorita` | Marca o desmarca como favorita |

Documentación interactiva en `/api/docs` (Swagger UI).

### Contrato de datos

Una receta tiene esta forma:

```json
{
  "id": "string",
  "nombre": "string",
  "categoria": "string",
  "sabor": "salado | dulce | amargo | umami | acido",
  "tiempoPreparacion": 30,
  "favorita": false,
  "ingredientes": [
    {
      "nombre": "string",
      "cantidad": 200,
      "unidad": "string",
      "familia": "string"
    }
  ],
  "pasos": ["string"]
}
```

`categoria` es texto libre. El formulario normaliza a minúsculas y sugiere categorías existentes. `sabor` es enum cerrado: `salado | dulce | amargo | umami | acido`.

## Qué vive dónde

| Dato | Dónde vive |
|------|------------|
| Recetas | Servidor (recetas.json) |
| Favoritas | Servidor (campo `favorita` en la receta) |
| Filtros activos | Cliente (estado local) |
| Recetas seleccionadas para la compra | Cliente (ListaCompraContext) |
| Lista de la compra generada | Cliente (calculada por useListaCompra) |
| Plan semanal | Cliente (PlanificadorContext) |
| Despensa | Cliente (DespensaContext → localStorage) |
