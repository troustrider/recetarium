# Sinergia: que la semana comparta compra

Objetivo permanente del recetario, no de una tanda suelta. Una semana bien planificada no es solo siete platos correctos: es siete platos que **comparten lista de la compra**, para que el gasto baje y para que nada se compre y se pudra a medias.

El planificador ya prefiere los platos que gastan lo que hay en casa (`despensa` en `repartirSemana`). Esto es lo otro: que los platos de la misma semana se necesiten entre ellos, y desde el 2026-08-21 el reparto también lo puntúa (`gananciaCompartir`), pesando cada ingrediente compartido por lo raro que es en el recetario.

## Por qué importa

Un manojo de cilantro, un bote de tahini o media col se compran enteros y se usan por cucharadas. Si un solo plato de la semana los pide, el resto se tira: se ha pagado el 100% y se ha comido el 30%. Si dos o tres platos lo piden, el mismo gasto alimenta a la semana entera y el envase se acaba antes de estropearse.

Esto pesa más cuanto más corto es el ingrediente en vida útil. Una lata de garbanzos espera seis meses; un manojo de perejil, cuatro días.

## Cómo se mide

`scripts/simular-semana.ts` reparte veinte semanas contra el catálogo vivo y da dos números por dieta:

- **Ingredientes compartidos**: qué porcentaje de los ingredientes distintos de la semana los pide más de un plato.
- **Reuso**: cuántas veces se pide de media cada ingrediente distinto.

```bash
npx vite-node scripts/simular-semana.ts <volcado de recetas>.json
```

Medido el 2026-08-21 sobre 429 recetas y sin dieta: **42% compartidos, reuso 2,12**, frente al 39% y 2,10 de antes de que el reparto lo puntuara. Ese es el suelo, y ninguna tanda debe bajarlo. En vegetariana sube a 50% y 2,54, porque el pool es estrecho y se repiten las despensas.

El mismo comando informa de la semana proteica, que persigue **125 g al día y por día**, no de media: hoy los días con las tres comidas puestas dan 133 g de media y 49 de cada 60 llegan a 120. Los días de solo dos comidas se quedan en 104 y no pueden llegar; ahí el reparto maximiza, que es lo acordado.

## Qué obliga al diseñar una tanda

**Las recetas se diseñan en familias, no sueltas.** Una tanda de veinticinco platos que toca veinticinco despensas distintas empeora la sinergia aunque cada receta sea impecable. La tanda se organiza alrededor de un puñado de ingredientes puente, y cada uno aparece en tres o cuatro recetas de la tanda con papeles distintos.

**El ingrediente puente tiene que ser el caro o el perecedero**, no la cebolla. Compartir cebolla no ahorra nada: ya está en todo. Los que rinden son los que se compran en formato grande y se usan en cantidad pequeña: pasta de miso, tahini, kimchi, harissa, leche de coco, hierbas frescas, quesos curados, el bote de aceitunas.

**Cada familia entra con al menos tres platos y con momentos distintos.** Tres recetas que solo valen para cena no se reparten: el planificador llena catorce huecos de principal por semana y necesita que la familia pueda caer a mediodía y de noche.

**La sobra de una receta es la entrada de otra.** Media lata de leche de coco, el caldo del cocido, la mitad del bloque de tofu. Cuando una receta deja sobra previsible, la tanda trae el plato que se la come, y ambos lo dicen en sus consejos.

## Lo que no es

No es repetir ingrediente principal. Siete platos de pollo comparten mucho y son una semana insufrible; la variedad de proteína y de cocina manda por delante, y la sinergia se busca en el segundo plano de la receta —la despensa de bote, la hierba, el lácteo—, que es donde está el desperdicio de verdad.

Tampoco es un filtro. El repartidor no descarta un plato por no compartir nada: lo puntúa un poco peor que a uno que sí, igual que hace con la despensa.
