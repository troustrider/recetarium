# Traspaso: sinergia y la auto-semana

Estado a 26 de agosto de 2026. El trabajo de sinergia queda cerrado: los diales
ya están medidos contra la base viva y el bug que quedaba escrito está
arreglado. Lo que sigue abierto son cuatro cabos, ninguno bloqueante, y un
hallazgo nuevo que no es del planificador sino del recetario.

## Lo que se cerró

### Los diales, medidos contra las 688 recetas vivas

Venían ajustados contra las 88 del seed y había que rehacerlos con el catálogo
real. Hecho, y **se quedan donde estaban**: `PASO` en 0,25 € y
`COSTE_DE_TIRARLO_TODO` en 2.

Lo que salió de medirlo es más útil que el número: **lo que gobierna el reparto
no es el coste sino su razón con el paso**, porque la nota redondea a escalones.
Con la despensa vacía, que es como corre cualquier preset de nutrición, dos
platos solo se separan por escalones de `COSTE_DE_TIRARLO_TODO / PASO`. Esa
razón vale 8 hoy.

Subirla a 12 —dejar el paso y poner el coste en 3, que era la tentación, porque
baja la basura del 12,8% al 10,3% de lo comido— **hunde la semana proteica**:
los días de tres comidas que llegan a 120 g pasan de 51 de cada 120 a 9. La
basura parte tan fino que la proteína ya no llega a desempatar nada. Es el
efecto que el barrido sobre el seed no podía ver, porque allí la cobertura
semanal de proteína seguía marcando 100% mientras el preset se venía abajo.

Moverse por la línea de razón 8, que es la que respeta a los presets, tampoco
sale a cuenta (48 semanas por casilla, sin dieta, despensa de 12):

| paso / coste | despensa gastada | de los que corren prisa | tira | platos distintos |
|---|---|---|---|---|
| **0,25 / 2** | **9,0/12** | **4,5/4,8** | **4,21 € — 12,8%** | **198** |
| 0,50 / 4 | 7,7/12 | 3,8/4,8 | 2,88 € — 8,9% | 169 |
| 0,75 / 6 | 6,9/12 | 3,4/4,8 | 2,93 € — 8,7% | 148 |
| 1,00 / 8 | 6,4/12 | 3,2/4,8 | 2,87 € — 8,5% | 134 |

Ahorra 1,33 € de basura en la cesta y deja sin gastar 1,3 cosas de casa, que al
euro por punto que la despensa vale en este mismo modelo es el mismo dinero,
más treinta platos de variedad de propina. Y la basura deja de bajar a partir
del segundo escalón: lo que sigue cayendo es la despensa, que es mover la
basura de la cesta a la nevera, no evitarla.

Línea de salida con lo que hay hoy en la base (200 semanas, sin dieta):

```
despensa: gasta 9.0/12  de los que corren prisa 4.4/4.8
la compra: paga 57.24 €  come 32.79 €  tira 4.07 € (7% de lo pagado, 12% de lo comido)
la mesa:   fibra 111% del objetivo  proteína 103%  platos sin verdura 7%
```

Vegetariana tira el 9% de lo comido y vegana el 12%. Ninguna deja huecos vacíos.

Para repetir la medida:

```bash
node --env-file=server/.env server/scripts/volcar-catalogo.mjs catalogo.json
PASADAS=200 npx vite-node scripts/simular-semana.ts catalogo.json
```

El volcado está en `.gitignore`: es una foto de la base y la base manda.

### El miso abierto ya no avisa a los tres días

`diasTrasAbrir` caía en la primera palabra cuando no encontraba el nombre
entero, y en "pasta de miso" esa palabra es "pasta", así que la entrada de la
pasta fresca le ponía tres días a un bote que aguanta seis meses. Arreglado
mirando antes el token que no es cabeza ambigua, con la lista de cabezas que ya
vivía en `despensa.ts`. "Pasta fresca", que no tiene otro token, sigue
resolviendo por pasta.

## El hallazgo nuevo: la proteína no la pierde el reparto, la pierde el catálogo

La semana proteica persigue 125 g al día **y por día**. Contra las 688 recetas
vivas, los días con las tres comidas puestas dan 115 g de media y solo 243 de
cada 600 llegan a 120. Los días de dos comidas se quedan en 81 y no pueden
llegar, que es lo acordado.

El preset está poniendo lo mejor que hay; lo mejor que hay no basta. Es encargo
para la próxima tanda, no para el planificador: **falta principal proteico y
sobre todo desayuno proteico**, que es el hueco donde se caen los días de tres
comidas.

## Los cabos que siguen abiertos, por orden de rendimiento

1. **Rellenar el envase en `precios.json`.** Solo 137 de 369 precios traen un
   tamaño legible en `formato` ("tarro 350 g · 2,45 €"). Sin envase, el peso de
   ese ingrediente cae a una suposición de 0,35 €, así que es la mitad larga de
   la tabla la que hoy se estima. Es la palanca más barata que queda y es
   trabajo de datos: hay que verlo en la tienda, no inventarlo.
2. **Enseñar la cuenta en la app.** `cuentaDeLaCompra` ya devuelve pagado /
   comido / tirado y el desglose por ingrediente. La lista de la compra puede
   decir "pagas 24 €, comes 17 €, se te va a estropear 3 €" y señalar el plato
   que deja medio envase varado.
3. **El reparto es voraz.** El primer plato que coloca tiene la cesta vacía, así
   que nunca puede puntuar por compartir. Una segunda pasada de intercambios
   recuperaría parte de eso. Sin medir.
4. **La puerta de las tandas.** `references/tandas.md` todavía no obliga a que
   un lote baje el "tira".
