# Sinergia: que la semana comparta compra

Objetivo permanente del recetario, no de una tanda suelta. Una semana bien planificada no es solo siete platos correctos: es siete platos que **comparten lista de la compra**, para que el gasto baje y para que nada se compre y se pudra a medias.

Desde el 2026-08-26 esto no es una preferencia más: **es lo primero que mira la auto-semana**, por delante de la proteína y de cualquier preset. El reparto puntúa en dos escalones (`prioridadDeLaCompra` en `utils/semana`):

1. **Manda**: cuántos alimentos de la despensa gasta el plato —los que corren prisa valen más que el fondo de armario— menos qué parte de lo que haya que comprar por él va a acabar en la basura.
2. **Desempata**, dentro de un escalón de 25 céntimos: la nutrición, los presets, la variedad de cocina y de verdura, y lo ya propuesto.

La sobra se mide **en fracción de lo que se compra, no en euros sueltos**: en euros, la forma más fácil de no tirar nada es comprar menos comida, y medido así el reparto se iba a platos mínimos —pagaba 8,53 € y comía 3,73 €— tirando en proporción más que antes. En fracción, un plato con cuatro verduras que se acaban va igual de bien que uno sin verdura, y mal solo el que deja media bolsa.

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

Medido el 2026-08-26 contra el catálogo vivo (688 recetas, 200 semanas, sin dieta, despensa de 12 cosas en casa): gasta **9,0 de las 12 cosas de casa**, 4,4 de las 4,8 que corren prisa, y de la compra **paga 57,24 €, come 32,79 € y tira 4,07 €**, que es el 12% de lo comido. En vegetariana tira el 9% y en vegana el 12%. La variedad no es un problema con este pool: 300 platos distintos y 59 cocinas en esas 200 semanas.

Los dos diales que gobiernan esto están en `utils/semana`: `PASO` (0,25 €), el ancho del escalón, y `COSTE_DE_TIRARLO_TODO` (2), lo que pesa la sobra frente a vaciar la despensa. **Se quedan donde estaban, y ahora se sabe por qué.** Lo que manda no es el segundo número sino su razón con el primero, porque la nota redondea a escalones: con la despensa vacía —que es como corre un preset de nutrición— dos platos solo se separan por escalones de `COSTE_DE_TIRARLO_TODO / PASO`. Esa razón vale 8. Subirla a 12 (dejar el paso y poner el coste en 3) baja la basura al 10,3% de lo comido y a cambio hunde la semana proteica: los días de tres comidas que llegan a 120 g pasan de 51 de cada 120 a 9. La basura parte tan fino que la proteína ya no desempata nada.

Moverse por la línea de razón 8, que es la que respeta a los presets, tampoco sale a cuenta (48 semanas por casilla):

| paso / coste | despensa gastada | de los que corren prisa | **tira** | platos distintos | sin verdura |
|---|---|---|---|---|---|
| **0,25 / 2** | **9,0/12** | **4,5/4,8** | **4,21 € — 12,8%** | **198** | 6% |
| 0,50 / 4 | 7,7/12 | 3,8/4,8 | 2,88 € — 8,9% | 169 | 8% |
| 0,75 / 6 | 6,9/12 | 3,4/4,8 | 2,93 € — 8,7% | 148 | 8% |
| 1,00 / 8 | 6,4/12 | 3,2/4,8 | 2,87 € — 8,5% | 134 | 9% |

Ahorra 1,33 € de basura en la cesta y deja sin gastar 1,3 cosas de casa, que al euro por punto que vale la despensa en este mismo modelo es justo lo mismo, más treinta platos de variedad de propina. La basura, además, deja de bajar a partir del segundo escalón: lo que sigue cayendo es la despensa. Cuidado con leer solo el "tira": la sobra que mide son los envases de la compra de la semana, no lo que se pudre en la nevera de casa.

Y un efecto que hay que tener presente: **la semana concentra los perecederos en unos pocos**. Siete verduras distintas son siete bolsas empezadas; el reparto prefiere tres o cuatro que se acaben. Es la respuesta correcta a "que no sobre nada", y a la vez lo que hay que vigilar para que la semana no se vuelva monótona: para eso están la penalización de verdura repetida y la de cocina repetida, que siguen desempatando dentro del escalón.

El volcado de la base no cabe en el repo y es una foto que caduca: se saca con `node --env-file=server/.env server/scripts/volcar-catalogo.mjs catalogo.json` y se tira después. Los números de arriba salen de esa foto, no del seed.

El mismo comando informa de la semana proteica, que persigue **125 g al día y por día**, no de media. Contra el catálogo vivo los días con las tres comidas puestas dan **115 g de media y solo 243 de cada 600 llegan a 120**, y los de dos comidas se quedan en 81 y no pueden llegar; ahí el reparto maximiza, que es lo acordado. Eso ya no es cosa del reparto sino del recetario: con 688 platos donde elegir, el preset de proteína pone lo mejor que hay y lo mejor que hay no basta. **Falta plato proteico, y sobre todo desayuno proteico**, que es donde se pierden los días de tres comidas.

## Qué obliga al diseñar una tanda

**Las recetas se diseñan en familias, no sueltas.** Una tanda de veinticinco platos que toca veinticinco despensas distintas empeora la sinergia aunque cada receta sea impecable. La tanda se organiza alrededor de un puñado de ingredientes puente, y cada uno aparece en tres o cuatro recetas de la tanda con papeles distintos.

**El ingrediente puente tiene que ser el caro o el perecedero**, no la cebolla. Compartir cebolla no ahorra nada: ya está en todo. Los que rinden son los que se compran en formato grande, se usan en cantidad pequeña y no llegan a la próxima compra: leche de coco, nata, tomate triturado, hierbas frescas, bolsas de brotes y espinacas, quesos frescos, la lata de atún.

El comando lo dice en euros: la bolsa de espinacas de 300 g cuesta 1,50 € y un plato que use 100 g deja 1,00 € en la basura; media lata de leche de coco, 0,65 €; el manojo de cilantro, 0,50 €. **Una tanda que no baje el "tira" no ha mejorado la sinergia, por mucho que suba los compartidos.**

**Cada familia entra con al menos tres platos y con momentos distintos.** Tres recetas que solo valen para cena no se reparten: el planificador llena catorce huecos de principal por semana y necesita que la familia pueda caer a mediodía y de noche.

**La sobra de una receta es la entrada de otra.** Media lata de leche de coco, el caldo del cocido, la mitad del bloque de tofu. Cuando una receta deja sobra previsible, la tanda trae el plato que se la come, y ambos lo dicen en sus consejos.

## Lo que no es

No es repetir ingrediente principal. Siete platos de pollo comparten mucho y son una semana insufrible; la variedad de proteína y de cocina manda por delante, y la sinergia se busca en el segundo plano de la receta —la despensa de bote, la hierba, el lácteo—, que es donde está el desperdicio de verdad.

Tampoco es un filtro. El repartidor no descarta un plato por no compartir nada: lo puntúa un poco peor que a uno que sí, igual que hace con la despensa.
