# Traspaso: sinergia y la auto-semana

Cerrado el 26 de agosto de 2026. Los cuatro cabos que quedaban abiertos están
hechos y en `main`, con la suite entera en verde (47 ficheros, 622 tests) y
`tsc -b` limpio. Lo que queda es trabajo de tienda y de recetario, no de código,
y está al final.

## Lo que se cerró

### 1. Los diales, medidos contra las 688 recetas vivas

Venían ajustados contra las 88 del seed. Rehecha la medida con el catálogo real,
**se quedan donde estaban**: `PASO` en 0,25 € y `COSTE_DE_TIRARLO_TODO` en 2.

Lo que salió de medirlo es más útil que el número: **lo que gobierna el reparto
no es el coste sino su razón con el paso**, porque la nota redondea a escalones.
Con la despensa vacía, que es como corre cualquier preset de nutrición, dos
platos solo se separan por escalones de `COSTE_DE_TIRARLO_TODO / PASO`. Esa
razón vale 8. Subirla a 12 baja la basura dos puntos y medio y deja la semana
proteica en 9 de cada 120 días por encima de 120 g, cuando con 8 son 51. Moverse
por la línea de razón 8 cambia basura de la cesta por despensa sin gastar, que
en este modelo valen lo mismo, más treinta platos de variedad de propina.

La doctrina y las tablas están en `.claude/skills/chef-recetarium/references/sinergia.md`.

### 2. La tabla de precios ya dice de qué envase habla

Era el cabo más rentable y era trabajo de datos. De 369 precios, 228 no decían
nada del envase, y sin envase la cuenta caía en una suposición plana de 35
céntimos para todo. Ahora no queda ninguno sin decidir:

- **295 traen tamaño de envase.** Los que empiezan por "típico" son el tamaño
  corriente del súper, no uno visto en tienda.
- **74 se marcan `suelto`**: lo que se compra al peso o en el mostrador no deja
  envase a medias, y eso no es lo mismo que no saber de qué envase hablamos.
- **23 frutas y verduras cuentan su pieza como envase**, con el peso de una:
  quien pide media berenjena paga la berenjena entera.

Esto movió tres fixtures de test que usaban espinacas o calabacín para hablar de
otra cosa: con la tabla al día, esas dos traen envase y metían un segundo efecto
en medio.

### 3. La lista de la compra enseña la cuenta

`cuentaDeLaCompra` ya sabía lo que se paga en envases enteros, lo que se come y
lo que sobra, pero se quedaba dentro del planificador. Ahora el cajón de la
compra lo dice, y señala **el ingrediente que más se queda a medias y el plato
que lo pide**, que es lo accionable: media bolsa de espinacas en la basura se
arregla metiendo otra receta que se la acabe.

### 4. El reparto se repasa con la semana entera

El primer plato que se colocaba tenía la cesta vacía y no podía puntuar por
compartir con nadie. Ahora, ya puesta la semana, cada hueco se vuelve a mirar
contra los otros veinte y cambia de plato si hay uno que aprovecha mejor lo que
la semana va a comprar o lo que hay en casa. Solo por un escalón entero de
compra, y nunca a costa de la verdura.

Medido sobre las 688 vivas (32 semanas, sin dieta): la basura baja del **13,5%
al 11,8%** de lo comido y la despensa gastada sube de 8,97 a 9,06 de 12. Con una
ronda basta: la segunda mueve una décima y cuesta otro tanto de tiempo.

### 5. La puerta de la basura, en las tandas

`references/tandas.md` ya obliga: una tanda se diseña con tres o cuatro
ingredientes puente y **no puede subir el porcentaje de lo comido que se tira**,
que se mide antes y después de `apply` y se dice en el informe de cierre.

## La línea de salida de hoy

200 semanas contra las 688 recetas vivas, sin dieta, con una despensa de 12
cosas en casa:

```
despensa: gasta 9.7/12  de los que corren prisa 4.5/4.8
la compra: paga 101.88 €  come 49.69 €  tira 5.83 € (6% de lo pagado, 12% de lo comido)
la mesa:   fibra 105% del objetivo  proteína 106%  platos sin verdura 4%
```

380 platos distintos y 62 cocinas en esas 200 semanas, sin un solo hueco vacío.

El "paga" hay que leerlo con cuidado: son envases nuevos, como si en casa no
hubiera nada. La botella de aceite y el kilo de arroz duran meses, así que ese
número es el coste de montar la despensa y no la factura del sábado. El que
manda es el "tira".

Para repetir la medida:

```bash
node --env-file=server/.env server/scripts/volcar-catalogo.mjs catalogo.json
PASADAS=200 npx vite-node scripts/simular-semana.ts catalogo.json
```

## Lo que queda, y no es código

1. **Confirmar los envases "típico" en la tienda.** Son el tamaño corriente del
   súper puesto de memoria, no una comprobación. Cada vez que se pase por Dirk,
   Lidl o el Bazaar, se confirman los que salgan al paso y se les quita la
   palabra. Los que más pesan son los perecederos que se compran grandes y se
   usan a cucharadas: nata, miso, tahini, hierbas, quesos frescos.
2. **La proteína la pierde el catálogo, no el reparto.** La semana proteica
   persigue 125 g al día y por día: los días de tres comidas dan 120 g de media
   y 318 de cada 600 llegan a 120. El preset pone lo mejor que hay. Falta
   principal proteico y **sobre todo desayuno proteico**, que es el hueco donde
   se caen los días. Es encargo de tanda.
