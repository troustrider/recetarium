# Sinergia: que la semana comparta compra

Objetivo permanente del recetario, no de una tanda suelta. Una semana bien planificada no es solo siete platos correctos: es siete platos que **comparten lista de la compra**, para que el gasto baje y para que nada se compre y se pudra a medias.

El planificador ya prefiere los platos que gastan lo que hay en casa (`despensa` en `repartirSemana`). Esto es lo otro: que los platos de la misma semana se necesiten entre ellos, y el reparto lo puntúa (`gananciaCompartir`) pesando cada ingrediente compartido por **los euros de envase que se rescatan al compartirlo** (`valorDeCompartir`, sobre `utils/desperdicio`).

Hasta el 2026-08-26 ese peso era la rareza del ingrediente en el recetario, y la rareza no es lo que se tira: medido sobre las 88 recetas del seed, la correlación entre el peso que daba el reparto y lo perecedero que es el ingrediente era **0,014** —ninguna—, y el cuartil más premiado tenía una vida útil mediana de 180 días frente a 45 del menos premiado. Premiaba compartir canela, cuyo tarro dura dos años, por encima de compartir cilantro, que se pudre en cinco días.

## Por qué importa

Un manojo de cilantro, un bote de tahini o media col se compran enteros y se usan por cucharadas. Si un solo plato de la semana los pide, el resto se tira: se ha pagado el 100% y se ha comido el 30%. Si dos o tres platos lo piden, el mismo gasto alimenta a la semana entera y el envase se acaba antes de estropearse.

Esto pesa más cuanto más corto es el ingrediente en vida útil. Una lata de garbanzos espera seis meses; un manojo de perejil, cuatro días.

## Cómo se mide

En euros, que es donde está el dinero y la basura. `scripts/simular-semana.ts` reparte semanas contra el catálogo vivo y da, por dieta:

- **Paga**: lo que cuesta la compra de verdad, en envases enteros. Nadie compra dos cucharadas de tahini: compra el tarro.
- **Come**: la parte de esos envases que se come esa semana.
- **Tira**: lo que sobra de lo que no llega a la próxima compra. **Este es el número.**

```bash
npx vite-node scripts/simular-semana.ts <volcado de recetas>.json
PASADAS=200 npx vite-node scripts/simular-semana.ts <volcado>.json   # más estable
```

El envase sale de `formato` en `precios.json` ("tarro 350 g · 2,45 €"), y el reloj de lo que sobra es el del **envase abierto** (`diasTrasAbrir`), no el del cerrado: el brik de leche de coco caduca dentro de un año sin abrir y dura tres días abierto, y lo que sobra de un plato está abierto por definición.

Los dos números viejos —**ingredientes compartidos** y **reuso**— se siguen imprimiendo, pero son un proxy y no el objetivo, y **ya no fijan suelo**. Medido sobre las 88 recetas del seed, subiendo el peso de compartir por encima del óptimo los compartidos siguen subiendo del 45% al 54% y el reuso de 2,11 a 2,43 **mientras la basura empeora** de 1,92 € a 2,39 €. Optimizar el proxy más allá de cierto punto cuesta dinero, y el suelo de reuso 2,12 caía justo en esa zona.

Medido el 2026-08-26 sobre las 88 recetas del seed (200 semanas, sin dieta), al cambiar el peso de rareza a euros:

| | compartidos | reuso | paga | come | **tira** |
|---|---|---|---|---|---|
| rareza (antes) | 40% | 1,84 | 13,90 € | 7,76 € | 2,29 € — 30% de lo comido |
| desperdicio (ahora) | 45% | 2,11 | 14,98 € | 8,73 € | **1,92 € — 22% de lo comido** |

Cuesta variedad: 72 platos distintos en 200 semanas frente a 76, y una cocina menos. Es el canje aceptado.

**Esos números son del seed, no del catálogo vivo**, que ronda las 594 recetas y no cabe en el repo. Hay que rehacer la medida con un volcado de la base antes de tratarlos como la línea de salida.

El mismo comando informa de la semana proteica, que persigue **125 g al día y por día**, no de media: los días con las tres comidas puestas dan 133 g de media y 49 de cada 60 llegan a 120. Los días de solo dos comidas se quedan en 104 y no pueden llegar; ahí el reparto maximiza, que es lo acordado.

## Qué obliga al diseñar una tanda

**Las recetas se diseñan en familias, no sueltas.** Una tanda de veinticinco platos que toca veinticinco despensas distintas empeora la sinergia aunque cada receta sea impecable. La tanda se organiza alrededor de un puñado de ingredientes puente, y cada uno aparece en tres o cuatro recetas de la tanda con papeles distintos.

**El ingrediente puente tiene que ser el caro o el perecedero**, no la cebolla. Compartir cebolla no ahorra nada: ya está en todo. Los que rinden son los que se compran en formato grande, se usan en cantidad pequeña y no llegan a la próxima compra: leche de coco, nata, tomate triturado, hierbas frescas, bolsas de brotes y espinacas, quesos frescos, la lata de atún.

El comando lo dice en euros: la bolsa de espinacas de 300 g cuesta 1,50 € y un plato que use 100 g deja 1,00 € en la basura; media lata de leche de coco, 0,65 €; el manojo de cilantro, 0,50 €. **Una tanda que no baje el "tira" no ha mejorado la sinergia, por mucho que suba los compartidos.**

**Cada familia entra con al menos tres platos y con momentos distintos.** Tres recetas que solo valen para cena no se reparten: el planificador llena catorce huecos de principal por semana y necesita que la familia pueda caer a mediodía y de noche.

**La sobra de una receta es la entrada de otra.** Media lata de leche de coco, el caldo del cocido, la mitad del bloque de tofu. Cuando una receta deja sobra previsible, la tanda trae el plato que se la come, y ambos lo dicen en sus consejos.

## Lo que no es

No es repetir ingrediente principal. Siete platos de pollo comparten mucho y son una semana insufrible; la variedad de proteína y de cocina manda por delante, y la sinergia se busca en el segundo plano de la receta —la despensa de bote, la hierba, el lácteo—, que es donde está el desperdicio de verdad.

Tampoco es un filtro. El repartidor no descarta un plato por no compartir nada: lo puntúa un poco peor que a uno que sí, igual que hace con la despensa.
