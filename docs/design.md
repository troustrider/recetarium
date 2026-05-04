# Arquitectura de la aplicación

## Visión general

Recetarium tiene el frontend en React y el backend en Express. El frontend no guarda nada en localStorage — todo viene de la API. El backend es la única fuente de verdad.

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
| `/` | `Home` | Catálogo de recetas con filtros |
| `/recetas/nueva` | `RecetaForm` | Formulario para crear una receta |
| `/recetas/:id` | `RecetaDetalle` | Detalle de una receta |
| `/recetas/:id/editar` | `RecetaForm` | Formulario para editar una receta |
| `/favoritas` | `Favoritas` | Recetas marcadas como favoritas |
| `/lista-compra` | `ListaCompra` | Lista de la compra generada |
| `*` | `NotFound` | Página 404 |

### Estructura de componentes

Agrupados por funcionalidad:

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
```

### Gestión de estado

**Context API** para el estado global:
- Lista de recetas cargadas desde la API
- Recetas seleccionadas para la lista de la compra

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
  config/      → puerto y variables de entorno
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

### Contrato de datos

Una receta tiene esta forma:

```json
{
  "id": "string",
  "nombre": "string",
  "categoria": "string",
  "sabor": "salado | dulce | amargo | umami",
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

`categoria` es texto libre. El formulario normaliza a minúsculas al salir del campo y sugiere categorías ya existentes. `sabor` sigue siendo enum cerrado: `salado | dulce | amargo | umami`.

## Qué vive dónde

| Dato | Dónde vive |
|------|------------|
| Recetas | Servidor |
| Favoritas | Servidor (campo `favorita` en la receta) |
| Filtros activos | Cliente |
| Recetas seleccionadas para la compra | Cliente |
| Lista de la compra generada | Cliente (se calcula a partir de las recetas seleccionadas) |
