# El validador: `server/scripts/chef-recetas.mjs`

Las puertas de calidad no viven solo en prosa. Están implementadas en un script que audita la BD y valida cualquier lote antes de escribirlo. **La prosa y el script son la misma norma escrita dos veces: si divergen, la receta que pasa el script pero incumple `tecnica.md` es un agujero, y al revés.**

## Invariante

> Cada vez que se endurece, relaja o añade un criterio de calidad —en `tecnica.md`, `criterio-chef.md`, `contrato-receta.md` o `canon-recetas.md`— hay que hacer las tres cosas, en este orden y en el mismo turno:
>
> 1. **Actualizar la prosa** con el criterio nuevo y su porqué.
> 2. **Actualizar el script** para que el criterio sea verificable, o dejar dicho explícitamente por qué no es automatizable (fidelidad al canon y calidad del lenguaje no lo son; los umbrales numéricos siempre lo son).
> 3. **Ejecutar `audit` sobre toda la BD** y corregir lo que el criterio nuevo haya sacado a la luz, tanto en recetas nuevas como en las que ya estaban.
>
> Endurecer el estándar sin repasar lo ya guardado deja un recetario de dos velocidades. Eso no vale.

### Cómo se cerró el último endurecimiento

Los criterios de **comida completa**, **metacomentario en `consejos`** y **macros contra ingredientes** entraron primero como aviso, se saneó la BD entera, y solo entonces subieron a ERROR. Ese es el orden correcto y la referencia para el próximo: un criterio nuevo no se pone en ERROR el mismo día que se escribe, porque bloquearía el `apply` de cualquier lote que toque una receta antigua. Se pone en aviso, se salda la deuda, y se sube.

El saneado fueron 54 recetas con macros recalculados desde los ingredientes, 81 con la guarnición declarada o la verdura metida en el plato, 30 consejos reescritos y 11 recetas duplicadas borradas.

## Uso

```bash
node scripts/chef-recetas.mjs audit
```

```bash
node scripts/chef-recetas.mjs check ../ruta/lote.json
```

```bash
node scripts/chef-recetas.mjs apply ../ruta/lote.json
```

Se ejecuta desde `server/` (necesita `DATABASE_URL` de `server/.env` y el driver de Neon del propio proyecto).

- `audit` — recorre las recetas de la BD y lista ERROR y aviso por receta.
- `check` — valida un fichero JSON (array de recetas) sin tocar nada. Es el paso obligatorio antes de enseñar un lote a Karim.
- `check-doc` — valida los ejemplos JSON de las referencias de la skill. El ejemplo de `contrato-receta.md` es el trozo del prompt que más pesa al escribir una receta: si él se salta una puerta, la enseña saltada. Llegó a fallar cinco. **Ejecútalo siempre que toques ese ejemplo.**
- `apply` — valida y escribe. `UPDATE` si el objeto trae `id`, `INSERT` si no. **No toca `favorita` ni `imagen`**, al contrario que el `PUT` de la API, que borra lo que se omite. Sí escribe `guarnicion`, con su ficha nutricional calculada igual que en el servidor, y por tanto **un `UPDATE` que omita la guarnición la borra**: en modo revisión se manda la receta entera, guarnición incluida. Si cualquier receta del lote falla, no escribe ninguna.
- `marcar <json>` — reescribe un lote al formato escalable. Ver la trampa al final.
- `remarcar [--dry]` — marca las cantidades directamente en la BD, solo sobre recetas ya normalizadas a 2 raciones. Con `--dry` enseña los pasos resultantes sin escribir; úsalo siempre antes, porque un patrón nuevo mal puesto toca cientos de pasos de golpe.

## Qué comprueba hoy

**Contrato**: enums de `sabor` y `tipo`, `categoria` sin mayúsculas ni acentos, familias contra las 15 de `src/utils/despensa.ts`, unidades canónicas, cantidades y precio > 0.

**Calidad de pasos**: mínimo de pasos por tipo, mínimo de pasos con duración parseable, ninguna cocción sin duración ni señal de punto, horno sin °C, carne sin temperatura interna ni señal equivalente, último paso que manda probar, cuantificadores vagos, longitud de paso.

**Escalado**: `porciones` igual a 2, y ninguna cantidad escalable escrita en un paso fuera de las llaves. Las llaves son lo que permite que `src/utils/escalarPasos.ts` reescriba el paso al cambiar de comensales; una cantidad suelta se queda congelada y el paso pasa a mentir. Cuentan como escalables el agua de cocción en litros y las piezas que fabrica el propio plato (albóndigas, bolas, brochetas, hamburguesas, croquetas, tortitas, muffins, huecos).

**Coherencia**: cada ingrediente citado en algún paso (salvo sal, pimienta y agua), y macros declarados dentro de un 10% de `4P + 4C + 9G`.

**Macros contra ingredientes** (`nutrientes.json`): estima los cuatro macros desde la lista de ingredientes y los contrasta con los declarados. ERROR si la proteína o las kcal se desvían más de un 20%; aviso en carbohidratos (30%) y grasas (35%). Detalle abajo.

**Perfil**: aviso si un `principal` no lleva verdura propia ni guarnición, si algún consejo es metacomentario de autoría, y si el precio se sale del rango 0,80-4,50 €/ración.

**Proteína** (`criterio-chef.md`): la de la ración se cuenta sumando el plato y su guarnición. Por debajo del suelo (20 g en `principal`, 15 en `desayuno`) avisa siempre. Entre el suelo y el objetivo avisa solo si los `consejos` no declaran la palanca —verbo de acompañar más una fuente con nombre—. El objetivo es 35/25 con carne o pescado y 25/18 sin ellos, y para decidir cuál toca se abstiene igual que los demás gates: un ingrediente sin ficha deja el plato en "no se puede afirmar que sea vegetal" y le pide el objetivo alto. **Nunca es ERROR**: una receta vegana honrada no puede bloquear el `apply` de un lote.

La guarnición cuenta de dos formas, y no son equivalentes. El campo `guarnicion` es la canónica: está estructurado, entra en la lista de la compra y lleva su propia ficha. La frase en `consejos` sigue valiendo para no suspender a las que aún no se han migrado, pero levanta un aviso aparte ("guarnición solo en prosa"), porque una guarnición que solo existe en un texto no se puede comprar ni descontar de la despensa.

## La tabla `nutrientes.json`

Composición por 100 g de los ingredientes que usa la BD, más el peso en gramos de las unidades que dependen del producto (`ud`, `lata`, `loncha`, `vaso`).

Campos por ficha: `p`, `c`, `gr` (macros) y `fib`, `az`, `sat`, `sal`, `fe` (hierro mg), `vc` (vitamina C mg), `ca` (calcio mg), `b12` (µg), `fol` (folato µg). Los que valen 0 se omiten. Además:

- `hemo: true` en carne, pescado y marisco: su hierro se absorbe ~3x mejor y no lo frenan los inhibidores.
- `glu: "si"` si lleva gluten, `"depende"` si según marca o por contaminación cruzada (avena, miso, gochujang, pastillas de caldo). Para un celíaco `"depende"` cuenta como que lleva.
- `sust`: sustituto sin gluten conocido. Obligatorio siempre que pongas `glu`, o la receta saldrá marcada como "no evitable".

De aquí salen las columnas `hierro` y `sin_gluten` y el jsonb `micros` de cada receta, que la app enseña. `node scripts/chef-recetas.mjs nutricion` los recalcula en toda la BD cuando amplíes la tabla.

Reglas de uso:

- **Si un ingrediente no tiene ficha, el gate se abstiene** y avisa de que falta. Preferimos ampliar la tabla a acusar en falso. Cuando escribas una receta con un ingrediente nuevo, añádelo a `nutrientes.json` en el mismo turno, **con los micros y el gluten**: sin ficha, la receta entera pasa a "no se puede afirmar que no lleve gluten" y deja de aparecer en el filtro sin gluten.
- **Los valores son del producto tal como se compra**, en crudo salvo que el nombre diga lo contrario (`garbanzos cocidos de bote` frente a `garbanzos secos`). Confundirlos triplica la proteína de una legumbre.
- **Proteína y kcal son ERROR; grasa y carbohidrato solo aviso.** La estimación cuenta el 100% del aceite añadido, pero en un sofrito o una fritura parte se queda en la sartén: medido sobre la BD entera, la grasa declarada va un 22% por debajo de forma sistemática. La proteína, en cambio, salió sin sesgo (−6%), así que ahí el umbral aprieta.
- **Un valor de la tabla mal puesto dispara en decenas de recetas a la vez.** Ya pasó: el udon estaba fichado como seco y saltaron catorce recetas de golpe, cuando el que se compra aquí es el precocido de bolsa. Si un mismo ingrediente hace saltar muchas recetas en la misma dirección, sospecha de la tabla antes que de las recetas.

## Qué NO puede comprobar

Y por tanto sigue siendo responsabilidad del chef en cada receta:

- **Fidelidad al canon**: que el plato exista, que sus no negociables estén presentes y que las desviaciones estén declaradas. Es juicio, no regex.
- **Disponibilidad real en Dirk y Lidl.**
- **Que el paso se entienda.** "Saltea 3 min hasta que pase algo" pasa todos los gates y no sirve de nada.
- **Si la guarnición declarada es la correcta.** El script ve que hay una línea que la menciona, o que el campo está relleno, no si lo que propone tiene sentido con el plato. La heurística de prosa además confunde con una guarnición cualquier frase que hable de cómo se come el plato: "la cebolla encurtida no es guarnición" o "se acompaña de salsa tonkatsu" la disparan igual.

Cuando añadas un criterio de los automatizables, impleméntalo. Cuando añadas uno de estos, escríbelo en la lista de arriba para que quede claro que el script verde no significa receta correcta.

## Falsos positivos conocidos

Al endurecer un gate, revisa si dispara sobre texto correcto antes de reescribir recetas para contentarlo. **La regla es afinar el gate, nunca empeorar la receta para que pase.** Casos ya resueltos:

- Verbos dentro de una subordinada ("mientras cuece el arroz, pica la cebolla") se leían como una cocción sin tiempo. Se ignora la cláusula `mientras ...`.
- El gate de temperatura interna en carne exigía °C o "jugo transparente", pero en cortes finos y carne deshecha la señal correcta es visual ("sin zonas rojas", "no quede zona rosa"). Se aceptan como equivalentes.
- El mismo gate saltaba en platos cuya única carne es charcutería (jamón serrano, spek, chorizo, guanciale). Van curados o cocidos de fábrica y no tienen punto interno que alcanzar: quedan exentos.

## El fallo que enseñó a no fiarse del `check` verde

Durante meses `apply` **no escribía la columna `guarnicion`**. `check` la validaba, la puerta de comida completa la daba por buena, y al escribir se perdía sin decir nada: la receta entraba en la BD sin guarnición y suspendía la misma puerta que acababa de pasar. Se detectó porque el `audit` posterior a un `apply` sacó dos ERROR que el `check` previo no tenía.

La lección operativa: **un `apply` no se da por terminado hasta correr `audit` después.** `check` valida el fichero; `audit` valida lo que quedó guardado, y solo el segundo ve los campos que la escritura pierde por el camino.

## Trampa de `marcar`

`marcar` normaliza a 2 porciones reescalando **ingredientes y cantidades ya marcadas**. Por tanto **se ejecuta una sola vez por lote y sobre el fichero original**. Si lo corres dos veces sobre un lote que venía a 3 raciones, la segunda pasada ve `porciones = 2`, no reescala nada, y marca con las llaves los números en prosa de la versión vieja: los ingredientes quedan a 2 raciones y los pasos a 3. Ya pasó con cinco recetas y hubo que reescribirlas a mano.

Además, reescalar de 3 a 2 deja cantidades como `0,67 ud de cebolla`, que en la app se leen fatal. Cuando una receta no nace a 2 raciones, **reescríbela a mano con números limpios** en vez de dejar que la divida el script.

**Las 2 raciones no tienen excepción.** Si una receta no se puede hacer para dos —repostería de tanda tipo macaron, donde un merengue de 25 g de clara no monta— es que no encaja en este recetario, y la salida es proponer su borrado a Karim, no abrir una vía de escape en el validador. Ya pasó con los Macarons de frambuesa, y se borraron.
