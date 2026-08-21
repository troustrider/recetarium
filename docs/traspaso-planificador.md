# Traspaso: lo que queda del planificador

Estado de la rama `claude/recipe-gates-meal-visual-ploj2e` al cerrar la sesión
remota. Lo de arriba está hecho y verificado (`tsc -b` limpio, 414 tests web en
verde). Lo de abajo está diagnosticado pero **sin implementar**.

## Hecho

### 1. La proteína deja de ser puerta y pasa a ser objetivo (`d21b607`)

El umbral duro por receta (35 g en `principal`, 25 g en `desayuno`) hacía el
mismo trabajo que el reparto semanal, y peor: el objetivo de 40 g/día de
`src/utils/semana.ts` ya empuja la proteína a nivel de semana, con la ganancia
topada al objetivo. Un umbral por plato encima de eso solo servía para dejar
fuera recetas veganas y vegetarianas que en una semana bien repartida no
sobran.

Ahora hay dos niveles: un **suelo** bajo (por debajo no es un plato principal,
es una guarnición) y un **objetivo** que sigue siendo 35/25 pero que, cuando no
se alcanza, exige que la receta **declare la palanca** — guarnición proteica o
línea en `consejos` explicando con qué se sube. Eso es lo que hace verificable
el "siempre tratando de maximizar el aporte proteico" sin excluir a nadie.

Tocado: `server/scripts/chef-recetas.mjs` y la prosa de la skill (`SKILL.md`,
`criterio-chef.md`, `contrato-receta.md`, `tandas.md`, `validador.md`,
`compra-nl.md`), como manda el invariante de `validador.md`.

> **Pendiente del invariante:** falta el tercer paso, correr `audit` sobre la BD
> entera. No se pudo aquí: no hay `DATABASE_URL` en el contenedor y el conector
> de Neon pedía aprobación interactiva. **Relajar un criterio no puede romper
> ninguna receta que ya pasaba**, así que no hay deuda que saldar; el `audit`
> sirve para ver qué recetas quedan entre el suelo y su objetivo *sin palanca
> declarada*, que es la única lista accionable que abre este cambio.

### 2. El día tiene tres huecos, y se ven (`10afd9e`)

`desayuno` / `comida` / `cena` como `momento` de cada entrada del plan, no como
tipo de la receta: `tipo` dice qué es el plato, `momento` dice cuándo se come.
Se persiste en el DTO del plan, con derivación retrocompatible para las
entradas antiguas (desayuno si la receta es de tipo desayuno, cena si no —que
es como ya lo leía el propio código).

Cada momento tiene carril propio dentro del día, con icono y color, y solo se
dibuja si tiene algo. Preferencia `comidas` (0-7) simétrica a `desayunos`, por
defecto **0**, para que la auto-semana siga haciendo lo de siempre salvo que se
pida otra cosa.

## Pendiente

### 3. La auto-semana repite las mismas recetas

**Diagnosticado, no implementado.**

Causa: en `src/utils/semana.ts:372-383` la nota de cada candidata es
determinista salvo un `aleatorio() * 0.25`, y el término de despensa
(`0.35 * gananciaDespensa`, hasta 0.7) lo domina con la nevera llena. Los
mismos platos ganan siempre. Además `autollenar` borra lo no cocinado y
recalcula desde cero, así que **quitar una receta a mano no deja ninguna
huella**: la siguiente pasada la vuelve a elegir porque sigue siendo la mejor.

Plan acordado — dos memorias, las dos como penalización y no como filtro (con
el recetario justo, un plato descartado sigue siendo mejor que un día vacío):

- `descartados`: recetas que el usuario ha quitado del plan a mano. Penalización
  fuerte (~5). Se limpian al añadirlas de nuevo a mano, al `limpiar()` la semana
  y al deshacer un quitado (`restaurarPlan`).
- `yaPropuestos`: lo que colocó la pasada anterior. Penalización media (~0.6),
  suficiente para que volver a pulsar dé otra semana sin arrasar con la calidad.
  Solo se recuerda la última pasada, así que alterna entre dos semanas buenas en
  vez de degradarse.

Dónde: ambas como `Iterable<string>` opcionales en `OpcionesReparto`
(`src/utils/semana.ts`), restadas en la nota del bucle de elección. Los dos
`Set` viven en refs de `PlanificadorContext` — `quitar` (solo si la entrada no
estaba cocinada) alimenta el primero, el final de `autollenar` reescribe el
segundo con lo que acaba de colocar.

### 4. La lechuga sale dos veces en la lista de la compra

**Diagnosticado, con el helper ya escrito y sin enchufar.**

Causa: `src/hooks/useListaCompra.ts:133` agrupa por
`claveIngrediente(nombre, unidad)`, que es `nombre__unidad`. La misma lechuga
llega en gramos desde una guarnición (`v('lechuga', 100)` en
`server/scripts/verduras-guarniciones.mjs`) y en hojas desde un plato
(`"lechuga", 4, "hojas"`), y son dos claves distintas: dos filas, `100 g` y
`12 hoja`. Le pasa a cualquier ingrediente que aparezca en dos unidades.

No se puede arreglar convirtiendo: el factor honesto depende del producto —la
tabla `COCINA` de `src/utils/precios.ts` fija `hoja: 0.5 g`, que es correcto
para el laurel y absurdo para la lechuga.

`src/utils/medidas.ts` (**ya escrito y sin usar**) implementa la decisión: una
fila por ingrediente, sumando lo que comparte magnitud (250 g + 1 kg = 1,25 kg)
y dejando lo que no al lado de la principal, en la misma línea. Manda la unidad
que se puede comprobar en la tienda: peso/volumen > pieza > medida de cocina.

Queda por hacer:

1. `src/utils/ingredientes.ts`: `claveNombre(nombre)` =
   `normalizar(canonNombre(nombre))`. `claveIngrediente` se queda como está para
   los extras, que sí son fila aparte a propósito.
2. `src/hooks/useListaCompra.ts`: agrupar por `claveNombre`, acumular las
   contribuciones en `medidas: Medida[]` y resolver con `juntarMedidas` al
   cerrar el mapa. `cantidad`/`unidad` del ítem pasan a ser la principal y se
   añade `otrasMedidas`.
3. `src/components/lista-compra/ResumenIngrediente.tsx`: pintar las otras
   medidas junto a la principal (`100 g · + 12 hoja`).
4. `desglose` solo aplica a carnes y pescados (`seDesglosa`), que van en gramos,
   así que casi nunca se mezcla; aun así **descártalo si el ítem acaba con
   `otrasMedidas`**, porque sus cantidades estarían en unidades distintas.
5. `costeCompra` debe seguir viendo las otras medidas (pasarlas como ítems
   aparte) o dejarán de contar en el total. Aprovecha y deduplica `sinPrecio`.

### 5. El planificador descuadra el layout en móvil

**Diagnosticado, no implementado.** La cabecera de `src/pages/Planificador.tsx`
(~línea 633) es un `flex ... justify-between` sin `wrap`: título más tres
botones no caben en 390 px, "Auto-semana" parte en dos líneas y "Limpiar
semana" se sale por la derecha, y eso es lo que mete scroll horizontal en toda
la página.

Arreglo: apilar en móvil y dejar que la fila de botones envuelva —
`flex-col gap-3 sm:flex-row sm:items-end sm:justify-between` en el contenedor y
`flex-wrap items-center gap-2 sm:gap-3` en el grupo de botones, con
`whitespace-nowrap` en cada botón para que no se parta el texto. Compruébalo a
390 px antes de darlo por bueno: el chip del planificador ya iba justo de ancho
y los carriles de momento le quitan sitio.
