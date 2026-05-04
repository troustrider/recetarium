# Componentes

## Estructura

```
src/components/
  recetas/
    RecetaCard.tsx
    RecetaForm.tsx
    IngredienteItem.tsx
  lista-compra/
    ResumenIngrediente.tsx
  shared/
    FiltroBar.tsx
    LoadingSpinner.tsx
    ErrorMessage.tsx
```

Los tipos de datos están en `src/types/receta.ts`.

---

## shared

### LoadingSpinner

Sin props. Un spinner centrado que se usa mientras hay una petición en curso.

```tsx
<LoadingSpinner />
```

### ErrorMessage

Muestra un mensaje de error. Si se le pasa `onRetry`, aparece un botón para reintentar.

```tsx
<ErrorMessage message="No se pudieron cargar las recetas" onRetry={cargarRecetas} />
```

| Prop | Tipo | Requerida |
|------|------|-----------|
| `message` | `string` | Sí |
| `onRetry` | `() => void` | No |

### FiltroBar

Filtros de categoría y sabor como pills. Las categorías son dinámicas (se derivan de las recetas existentes y se pasan como prop). Los sabores son fijos. El valor vacío `''` en cualquier filtro significa sin filtro.

```tsx
const categorias = [...new Set(recetas.map(r => r.categoria))].filter(Boolean).sort()

<FiltroBar filtros={filtros} categorias={categorias} onChange={setFiltros} />
```

| Prop | Tipo | Requerida |
|------|------|-----------|
| `filtros` | `Filtros` | Sí |
| `categorias` | `string[]` | Sí |
| `onChange` | `(filtros: Filtros) => void` | Sí |

---

## recetas

### RecetaCard

Tarjeta de receta para el catálogo y la sección de favoritas. Muestra nombre, categoría, sabor y tiempo de preparación. El corazón activa/desactiva favorita sin navegar a la receta.

```tsx
<RecetaCard
  receta={receta}
  onClick={(id) => navigate(`/recetas/${id}`)}
  onToggleFavorita={(id) => toggleFavorita(id)}
/>
```

| Prop | Tipo | Requerida |
|------|------|-----------|
| `receta` | `Receta` | Sí |
| `onClick` | `(id: string) => void` | Sí |
| `onToggleFavorita` | `(id: string) => void` | Sí |

### IngredienteItem

Fila de un ingrediente con nombre, cantidad y unidad. Si se le pasa `onRemove`, muestra un botón para eliminarlo. Se usa tanto en el detalle de receta (sin `onRemove`) como en el formulario (con `onRemove`).

```tsx
<IngredienteItem ingrediente={ingrediente} onRemove={() => removeIngrediente(i)} />
```

| Prop | Tipo | Requerida |
|------|------|-----------|
| `ingrediente` | `Ingrediente` | Sí |
| `onRemove` | `() => void` | No |

### RecetaForm

Formulario para crear y editar recetas. Si se le pasa `inicial`, carga esos datos (modo edición). Sin `inicial` arranca en blanco (modo creación).

```tsx
// Crear
<RecetaForm onSubmit={crearReceta} onCancel={() => navigate(-1)} />

// Editar
<RecetaForm inicial={recetaExistente} onSubmit={actualizarReceta} onCancel={() => navigate(-1)} />
```

| Prop | Tipo | Requerida |
|------|------|-----------|
| `inicial` | `RecetaFormData` | No |
| `categorias` | `string[]` | No |
| `onSubmit` | `(data: RecetaFormData) => void` | Sí |
| `onCancel` | `() => void` | Sí |

---

## lista-compra

### ResumenIngrediente

Fila de un ingrediente en la lista de la compra. Muestra la familia como etiqueta, el nombre y la cantidad total ya fusionada. La fusión la hace el hook, no este componente.

```tsx
<ResumenIngrediente ingrediente={ingredienteAgrupado} />
```

| Prop | Tipo | Requerida |
|------|------|-----------|
| `ingrediente` | `IngredienteAgrupado` | Sí |
