# Context

Los contextos viven en `src/context/`. Sirven para que cualquier componente acceda al estado global sin necesidad de pasar props por cada nivel del árbol.

Cada contexto envuelve un hook y expone su valor. La lógica real está en los hooks (`useRecetas`, `useListaCompra`); el contexto solo la hace accesible globalmente.

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

Expone las recetas seleccionadas para la compra y la lista de ingredientes fusionada. Lo consumen el catálogo (para seleccionar recetas) y la página de lista de la compra (para mostrar el resultado).

**Provider:** `<ListaCompraProvider>` — montado en `main.tsx`, dentro de `RecetasProvider`.

**Hook de acceso:** `useListaCompraContext()`

```tsx
const { seleccionadas, listaCompra, toggleReceta, estaSeleccionada, vaciar } = useListaCompraContext()
```

Ver [`docs/hooks.md`](./hooks.md#uselistacompra) para el detalle de cada valor.

---

## Árbol de providers

```tsx
<RecetasProvider>       // estado global de recetas
  <ListaCompraProvider> // estado global de lista de la compra
    <App />
  </ListaCompraProvider>
</RecetasProvider>
```

Los dos contextos son independientes. Un componente que solo consume `ListaCompraContext` no se re-renderiza cuando cambia la lista de recetas, y viceversa.

---

## Importar

Todo se exporta desde `src/context/index.ts`:

```ts
import { useRecetasContext, useListaCompraContext } from '../context'
```
