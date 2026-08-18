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

Gestiona el inventario de ingredientes que hay en casa. Se sincroniza con el backend a través de `useEstadoCompartido`, así que es el mismo en todos los dispositivos del hogar. Lo consume la página de despensa y el planificador.

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
| `autollenar(recetas, raciones)` | `InformeSemana` | Rellena los días sin plato repartiendo macros y micros (`utils/semana`) según las preferencias del hogar, e incluye los desayunos del cupo. Respeta las entradas marcadas como cocinadas: ni las borra ni vuelve a proponer su receta —tampoco al repetir—, y las cuenta en el reparto del resto. Devuelve qué ha hecho: cuántas cenas y desayunos, qué ha conservado, qué ha repetido, si ha ensanchado el tiempo y qué huecos se han quedado vacíos |

---

## PreferenciasContext

Cómo quiere comer el hogar: lo único que cambia el comportamiento de Auto-semana. Se guarda en `app_estado.preferencias` y lo comparten los dos miembros, como el plan.

**Provider:** `<PreferenciasProvider>` — por encima de `PlanificadorProvider`, que lo lee al generar la semana.

**Hook de acceso:** `usePreferencias()`

```tsx
const { preferencias, alternarPrioridad, alternarCocina, setDesayunos, setLimites } = usePreferencias()
```

| Valor | Tipo | Descripción |
|---|---|---|
| `preferencias.prioridades` | `Prioridad[]` | Máx. 3. Suben un objetivo semanal o bajan un techo; no descartan platos |
| `preferencias.cocinasFavoritas` | `string[]` | Máx. 4. Prioridad, no filtro: si no dan para la semana, entra lo demás |
| `preferencias.desayunos` | `number` | 0-7 desayunos planificados, repartidos por la semana |
| `preferencias.limites` | `LimitesSemana` | Tiempo (entre semana y finde), dieta, sin gluten, ingredientes vetados |
| `alternarPrioridad(p)` | `void` | Al pasar de 3 sale la más antigua, no hay que quitar una a mano |
| `aplicar(prefs)` | `void` | Sustituye el bloque entero (lo usan los presets) |

Los límites excluyen y las prioridades empujan: es la diferencia que evita que una preferencia deje la semana a medias. De los límites, solo el tiempo se ensancha cuando el catálogo no da; la dieta, el gluten y los vetos no se relajan nunca.

---

## Árbol de providers

```tsx
<RecetasProvider>
  <ListaCompraProvider>
    <DespensaProvider>
      <PendientesPlanProvider>
        <PreferenciasProvider>
          <PlanificadorProvider>
            <App />
          </PlanificadorProvider>
        </PreferenciasProvider>
      </PendientesPlanProvider>
    </DespensaProvider>
  </ListaCompraProvider>
</RecetasProvider>
```

## Importar

Todo se exporta desde `src/context/index.ts`:

```ts
import { useRecetasContext, useListaCompraContext, useDespensa, usePlanificador } from '../context'
```
