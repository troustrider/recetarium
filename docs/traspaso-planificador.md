# Traspaso del planificador

Cerrado el 21 de agosto de 2026. Los cinco puntos están implementados y en
`main`: los tres primeros venían de la sesión remota
(`claude/recipe-gates-meal-visual-ploj2e`, ya borrada), y el 3, el 4 y el 5 se
terminaron al traer la rama. `tsc -b` limpio y la suite entera en verde (29
ficheros web y 11 de servidor).

Queda una comprobación que esta máquina no puede hacer, al final del documento.

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

### 3. La auto-semana repetía las mismas recetas

Causa: en `src/utils/semana.ts:372-383` la nota de cada candidata es
determinista salvo un `aleatorio() * 0.25`, y el término de despensa
(`0.35 * gananciaDespensa`, hasta 0.7) lo domina con la nevera llena. Los
mismos platos ganan siempre. Además `autollenar` borra lo no cocinado y
recalcula desde cero, así que **quitar una receta a mano no deja ninguna
huella**: la siguiente pasada la vuelve a elegir porque sigue siendo la mejor.

Hecho — dos memorias, las dos como penalización y no como filtro (con el
recetario justo, un plato descartado sigue siendo mejor que un día vacío):

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
segundo con lo que acaba de colocar. Los descartes se limpian al volver a añadir
el plato a mano, al vaciar la semana y al deshacer, que devuelve el plan
anterior: lo que vuelve a estar puesto no puede pesar en su contra.

### 4. La lechuga salía dos veces en la lista de la compra

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

Hecho, en este orden:

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
   así que casi nunca se mezcla; aun así se descarta si el ítem acaba con
   `otrasMedidas`, porque sus cantidades estarían en unidades distintas.
5. `costeCompra` sigue viendo las otras medidas, que van como ítems aparte, o
   dejarían de contar en el total. `sinPrecio` pasa a ser un `Set`.

### 5. El planificador descuadraba el layout en móvil

La cabecera de `src/pages/Planificador.tsx`
era un `flex ... justify-between` sin `wrap`: título más tres
botones no caben en 390 px, "Auto-semana" parte en dos líneas y "Limpiar
semana" se sale por la derecha, y eso es lo que mete scroll horizontal en toda
la página.

Arreglo aplicado: apilar en móvil y dejar que la fila de botones envuelva —
`flex-col gap-3 sm:flex-row sm:items-end sm:justify-between` en el contenedor y
`flex-wrap items-center gap-2 sm:gap-3` en el grupo de botones, con
`whitespace-nowrap` en cada botón para que no se parta el texto.

## Lo único que queda

**Verlo a 390 px.** Es lo que pedía el punto 5 y esta máquina no puede hacerlo:
sin credenciales de Google en local no hay sesión, y sin sesión la app se queda
en la landing, así que al planificador no se llega desde el navegador. En cuanto
haya login propio funcionando, mirar la cabecera y los carriles de momento a
390 px, que el chip ya iba justo de ancho.

**El `audit` del chef sobre la base de datos entera**, que viene del punto 1 y
sigue sin correr. No hay deuda —relajar un criterio no rompe ninguna receta que
ya pasaba—, pero es lo que saca la lista de recetas entre el suelo y su objetivo
de proteína sin palanca declarada, que es lo accionable de aquel cambio.
