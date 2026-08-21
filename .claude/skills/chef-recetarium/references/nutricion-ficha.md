# Ficha nutricional: macros, micros y gluten

Desde agosto de 2026 una receta no lleva solo cuatro macros. Lleva una ficha completa por porción, y la mitad de esa ficha ya no la declaras tú: sale de los ingredientes.

## Por qué existe esto

Cloe tiene sospecha de celiaquía y **sigue comiendo gluten a propósito**, para no falsear las pruebas si se las hace. La anemia ferropénica es una de las formas en que la celiaquía debuta.

Dos consecuencias directas para el chef:

- **No quites el gluten de una receta para "mejorarla".** No es un problema a resolver, es un dato a declarar. La receta lleva su salsa de soja y su pan rallado; lo que la app hace es marcarlo y decir por qué se cambia si algún día hace falta.
- **El hierro importa, pero los miligramos solos engañan.** Lo que decide cuánto se absorbe es con qué va, y eso sí es una decisión de cocina que está en tu mano.

## Qué declaras y qué se calcula

| Campo | Quién lo pone |
|---|---|
| `calorias`, `proteinas`, `carbohidratos`, `grasas` | **Tú**, en el JSON. El validador los contrasta contra los ingredientes |
| `hierro` (columna), `sin_gluten` (columna), `micros` (jsonb), `apto` (jsonb) | **El sistema**, desde los ingredientes, en cada alta y cada edición |

`micros` trae fibra, azúcares, saturadas, sal, `hierroHemo`, vitamina C, calcio, B12 y folato, más el desglose de gluten. Nunca los mandes en el payload: se ignoran. La única forma de que salgan bien es que la ficha del ingrediente en `server/src/lib/nutrientes.json` esté bien.

**De ahí la regla:** un ingrediente nuevo sin ficha completa no rompe nada visiblemente, pero deja la receta entera en "no se puede afirmar que no lleve gluten" y la saca del filtro sin gluten. Es un fallo silencioso, y es el más fácil de cometer.

## Ficha de ingrediente completa

Por 100 g de producto tal como se compra. Los campos que valen 0 se omiten.

```json
"pechuga de pollo": { "p": 23, "c": 0, "gr": 2, "sat": 0.6, "sal": 0.1, "fe": 0.7, "ca": 11, "b12": 0.3, "fol": 4, "hemo": true },
"salsa de soja":    { "p": 8, "c": 5, "gr": 0, "cucharada": 16, "fib": 0.8, "az": 1, "sal": 16, "fe": 1.9, "ca": 20, "fol": 14, "glu": "si", "sust": "tamari sin gluten" }
```

| Clave | Qué es | Unidad |
|---|---|---|
| `p` `c` `gr` | proteína, carbohidrato, grasa | g |
| `fib` `az` `sat` `sal` | fibra, azúcares, saturadas, sal | g |
| `fe` | hierro | mg |
| `vc` | vitamina C | mg |
| `ca` | calcio | mg |
| `b12` | vitamina B12 | µg |
| `fol` | folato | µg |
| `hemo` | `true` en carne, pescado y marisco | — |
| `an` | origen animal: `carne`, `pescado`, `lacteo`, `huevo`, `miel` | — |
| `anDep` | `true` si depende de la marca (pastilla de caldo, kimchi) | — |
| `glu` | `"si"` o `"depende"` | — |
| `sust` | sustituto sin gluten conocido | texto |

Más las unidades que dependen del producto (`ud`, `lata`, `loncha`, `vaso`, `cucharada`…), que ya estaban.

`hemo: true` solo en carne, pescado y marisco. **El huevo no lleva `hemo`**: su hierro es no hemo y se absorbe mal, aunque el alimento sea animal. Confundirlo infla la señal de absorción de media docena de recetas de desayuno.

## Origen animal

`apto` sale de la misma tabla y con el mismo criterio que el gluten: `{ vegetariana, vegana, animal: [...] }`, donde `null` es **no se puede afirmar**, no "no". Carne y pescado descartan vegetariana; esos dos más lácteo, huevo y miel descartan vegana.

**Lo que se cuela no es el filete, es el caldo.** `caldo dashi` es bonito seco, `salsa de pescado` y `salsa de ostras` llevan su nombre puesto, la `salsa worcester` lleva anchoa y la `pastilla de caldo` suele ser de pollo. Ninguno está en la familia `pescados` ni `carnes` de la receta, y por eso el flag va en la ficha del ingrediente y no se deduce de la familia. Antes de dar por vegetariano un plato asiático, repasa: dashi, salsa de pescado, ostras, worcester, kimchi, pastilla de caldo, manteca.

## Gluten

`glu: "si"` cuando lo lleva de fábrica. `glu: "depende"` cuando depende de marca o de contaminación cruzada: avena, miso, gochujang, pastillas de caldo, salsa de ostras de algunas marcas. **Para un celíaco `"depende"` cuenta como que lleva**, y así lo trata el sistema; el matiz se enseña en la app como "según marca".

`sust` es obligatorio siempre que pongas `glu`. Sin sustituto la receta sale marcada como no evitable, que es información peor que ninguna.

**El gluten que se cuela no es el pan, es la salsa.** En este recetario, con tanto plato japonés, chino y coreano, la fuente número uno con diferencia es la **salsa de soja: 73 recetas**. Es trigo fermentado, no soja sola. Detrás van harina (23), ketjap manis (15), udon (24 entre seco y precocido), gochujang (10), miso (9) y pastillas de caldo (9).

Antes de dar por sin gluten una receta asiática, repasa: soja, ketjap, hoisin, ostras, miso, gochujang, doubanjiang, panko, fideos, obleas de gyoza, roux de curry japonés. Todos llevan.

## Hierro

Se guarda con sus tres modificadores porque el número solo no dice nada:

- **Hemo** (carne, pescado, marisco): se absorbe unas 3 veces mejor y los inhibidores le afectan poco.
- **Vitamina C en la misma comida**: multiplica la absorción del hierro vegetal. A partir de ~30 mg se nota. Un pimiento rojo, un chorro de limón al final, tomate fresco, perejil.
- **Calcio en la misma comida**: compite. A partir de ~250 mg frena. Es el yogur, el queso rallado por encima, la salsa de lácteo.
- **Café y té en la misma comida**: sus polifenoles inhiben el hierro no hemo, y bastante. No está en la ficha de ningún ingrediente porque no se cocina con ellos, pero es la combinación real del desayuno: el bloque de desayunos de la BD está lleno de huevo, legumbre y verdura de hoja, y al lado hay un café. Si el desayuno se diseña por el hierro, la vitamina C tiene que estar dentro del plato para compensarlo.

Esto es cocina, no etiquetado. Si diseñas un plato de legumbre o de verdura de hoja, **acábalo con algo de vitamina C** y la misma receta pasa de hierro poco aprovechable a hierro aprovechable, sin tocar ni un gramo de proteína. Un limón exprimido al servir vale. Y si el plato ya es de lenteja o garbanzo, piensa dos veces antes de rematarlo con yogur o con una lluvia de queso: no está prohibido, pero sabe qué estás pagando por ello.

No lo escribas en `consejos` como consejo médico ni menciones a nadie. Es criterio de diseño del plato, no un mensaje al que cocina.

## Recalcular

Cuando amplíes o corrijas la tabla de nutrientes:

```bash
node scripts/chef-recetas.mjs nutricion --dry
```

Enseña cuántas recetas quedarían con gluten, sin gluten y no afirmables, y lista los ingredientes sin ficha con su número de apariciones. Sin `--dry` escribe. Es idempotente y no toca ninguna otra columna, así que se puede repetir sin miedo.

Si al recalcular aparece un ingrediente sin ficha, ese es el trabajo pendiente: cada uno deja "no afirmable" cada receta donde salga.

## Checklist al añadir un ingrediente

1. ¿Está ya en la tabla con otro nombre? Reutiliza el existente antes de crear uno nuevo.
2. `p`, `c`, `gr` del producto **tal como se compra**, crudo salvo que el nombre diga lo contrario.
3. Micros: `fib`, `az`, `sat`, `sal`, `fe`, `vc`, `ca`, `b12`, `fol`. Omite los que sean 0.
4. ¿Es carne, pescado o marisco? → `hemo: true`.
5. ¿Lleva trigo, cebada, centeno, o depende de la marca? → `glu` + `sust`.
6. Si la unidad de la receta es `ud`, `lata`, `loncha`, `rodaja`, `rebanada`, `tira`, `paquete` o `vaso`, añade el peso en gramos de esa unidad **para ese producto**, o la cantidad no se podrá convertir.
7. `nutricion --dry` y comprueba que el ingrediente ya no sale en la lista de sin ficha.
