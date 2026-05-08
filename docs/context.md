# Context

Los contextos viven en `src/context/`. Sirven para que cualquier componente acceda al estado global sin tener que pasar props por cada nivel del árbol.

Cada contexto envuelve un hook y expone su valor. La lógica real está en los hooks; el contexto solo la hace accesible globalmente.

---

## RecetasContext

Expone la lista de recetas y las operaciones CRUD. Lo consumen todas las páginas que necesiten leer o modificar recetas.

**Provider:** `<RecetasProvider>` — montado en `main.tsx`, envuelve toda la app.

**Hook de acceso:** `useRecetasContext()`

```tsx
const { recetas, loading, error, cargar, crear, actualizar, eliminar, toggleFavorita } = useRecetasContext()
```

Ver [`docs/hooks.md`](./hooks.md#userecetas) para el detalle de cada valor.

---

## ListaCompraContext

Expone las recetas seleccionadas para la compra (con sus raciones) y la lista de ingredientes fusionada. Lo consumen el catálogo (para seleccionar recetas), el planificador (para sincronizar raciones) y la página de lista de la compra.

**Provider:** `<ListaCompraProvider>` — montado en `main.tsx`, dentro de `RecetasProvider`.

**Hook de acceso:** `useListaCompraContext()`

```tsx
const { seleccionadas, listaCompra, toggleReceta, setRaciones, estaSeleccionada, vaciar } = useListaCompraContext()
```

Ver [`docs/hooks.md`](./hooks.md#uselistacompra) para el detalle de cada valor.

---

## DespensaContext

Gestiona el inventario de ingredientes que el usuario tiene en casa. Persiste en `localStorage`. Lo consume la página de despensa y el planificador.

**Provider:** `<DespensaProvider>` — montado en `main.tsx`.

**Hook de acceso:** `useDespensa()`

```tsx
const { despensa, añadir, quitar, setEstado, tieneIngrediente } = useDespensa()
```

| Valor | Tipo | Descripción |
|---|---|---|
| `despensa` | `IngredienteDespensa[]` | Lista de ingredientes en la despensa |
| `añadir(nombre, familia)` | `void` | Añade un ingrediente en estado `lleno` |
| `quitar(nombre)` | `void` | Elimina un ingrediente de la despensa |
| `setEstado(nombre, estado)` | `void` | Cambia el estado a `lleno` o `poco` |
| `tieneIngrediente(nombre)` | `boolean` | Comprueba si un ingrediente está en la despensa |

---

## PlanificadorContext

Gestiona el plan semanal (qué recetas se cocinan cada día). Cada vez que cambia el plan, sincroniza automáticamente las raciones de la lista de la compra.

**Provider:** `<PlanificadorProvider>` — montado dentro de `ListaCompraProvider` porque depende de él.

**Hook de acceso:** `usePlanificador()`

```tsx
const { plan, dias, añadir, quitar, setRaciones, mover, limpiar } = usePlanificador()
```

| Valor | Tipo | Descripción |
|---|---|---|
| `plan` | `Record<Dia, EntradaPlan[]>` | Recetas asignadas a cada día de la semana |
| `dias` | `Dia[]` | `['Lunes', ..., 'Domingo']` |
| `añadir(dia, receta)` | `void` | Añade una receta a un día con 1 ración |
| `quitar(dia, entradaId)` | `void` | Elimina una entrada del plan |
| `setRaciones(dia, entradaId, n)` | `void` | Cambia las raciones de una entrada (mín. 1, máx. 4) |
| `mover(desde, hasta, entradaId)` | `void` | Mueve una entrada de un día a otro |
| `limpiar()` | `void` | Vacía el plan completo |

---

## Árbol de providers

```tsx
<RecetasProvider>
  <ListaCompraProvider>
    <DespensaProvider>
      <PlanificadorProvider>
        <App />
      </PlanificadorProvider>
    </DespensaProvider>
  </ListaCompraProvider>
</RecetasProvider>
```

## Importar

Todo se exporta desde `src/context/index.ts`:

```ts
import { useRecetasContext, useListaCompraContext, useDespensa, usePlanificador } from '../context'
```
