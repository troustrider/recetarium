# Hooks

Todos los hooks viven en `src/hooks/`. Encapsulan lógica que de otro modo se repetiría en varios componentes o dejaría las páginas demasiado cargadas.

---

## useRecetas

Carga la lista completa de recetas desde la API y expone las operaciones CRUD.

```ts
const { recetas, loading, error, cargar, crear, actualizar, eliminar, toggleFavorita } = useRecetas()
```

| Retorno | Tipo | Descripción |
|---------|------|-------------|
| `recetas` | `Receta[]` | Lista actual |
| `loading` | `boolean` | `true` mientras hay una petición en curso |
| `error` | `string \| null` | Mensaje de error si la carga falló |
| `cargar` | `() => void` | Recarga la lista desde la API |
| `crear` | `(data) => Promise<Receta \| null>` | Crea una receta nueva |
| `actualizar` | `(id, data) => Promise<boolean>` | Actualiza una receta existente |
| `eliminar` | `(id) => Promise<boolean>` | Elimina una receta |
| `toggleFavorita` | `(id) => Promise<boolean>` | Marca o desmarca como favorita |

Las mutaciones (crear, actualizar, eliminar, toggleFavorita) actualizan el estado local sin recargar toda la lista.

---

## useReceta

Carga una sola receta por ID. Se usa en la página de detalle y en la de edición.

```ts
const { receta, loading, error } = useReceta(id)
```

| Retorno | Tipo | Descripción |
|---------|------|-------------|
| `receta` | `Receta \| null` | La receta cargada, o `null` si no se encontró |
| `loading` | `boolean` | `true` mientras se carga |
| `error` | `string \| null` | Mensaje de error si la petición falló |

Se vuelve a ejecutar automáticamente si cambia el `id`.

---

## useFiltros

Gestiona el estado de los filtros activos y aplica el filtrado sobre una lista de recetas.

```ts
const { filtros, setFiltros, resetFiltros, recetasFiltradas } = useFiltros(recetas)
```

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `recetas` | `Receta[]` | Lista a filtrar |

| Retorno | Tipo | Descripción |
|---------|------|-------------|
| `filtros` | `Filtros` | Estado actual de los filtros |
| `setFiltros` | `(filtros: Filtros) => void` | Actualiza los filtros |
| `resetFiltros` | `() => void` | Limpia todos los filtros |
| `recetasFiltradas` | `Receta[]` | Lista filtrada, memoizada |

El filtrado se recalcula solo cuando cambian `recetas` o `filtros` (usa `useMemo`).

---

## useListaCompra

Gestiona las recetas seleccionadas para la compra y calcula la lista de ingredientes fusionada. No hace llamadas a la API.

```ts
const { seleccionadas, listaCompra, toggleReceta, estaSeleccionada, vaciar } = useListaCompra()
```

| Retorno | Tipo | Descripción |
|---------|------|-------------|
| `seleccionadas` | `Receta[]` | Recetas marcadas para la compra |
| `listaCompra` | `IngredienteAgrupado[]` | Ingredientes fusionados, ordenados por familia y nombre |
| `toggleReceta` | `(receta: Receta) => void` | Añade o quita una receta de la selección |
| `estaSeleccionada` | `(id: string) => boolean` | Comprueba si una receta está seleccionada |
| `vaciar` | `() => void` | Limpia toda la selección |

Cuando el mismo ingrediente aparece en varias recetas con la misma unidad, las cantidades se suman. La fusión se recalcula solo cuando cambia `seleccionadas` (usa `useMemo`).
