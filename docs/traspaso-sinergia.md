# Traspaso: sinergia y la auto-semana

Lo que queda por hacer del trabajo de sinergia, y por qué hace falta la base
delante para rematarlo. Escrito el 2026-08-26.

## Lo que ya está (y está empujado)

Dos commits en `claude/recipe-synergy-issue-6tmv3l`:

- **`5e7912d` Compartir se paga en euros de basura, no en lo raro que sea.**
  `utils/desperdicio` lee el envase real desde `formato` en precios.json y el
  reloj del envase abierto (`diasTrasAbrir`), y con eso mide qué se paga, qué se
  come y qué se tira. El reparto deja de puntuar compartir por rareza.
- **`7abfd1e` La auto-semana elige primero por la despensa y por lo que va a
  sobrar.** El reparto decide en dos escalones: manda lo que vacía de casa menos
  qué fracción de la compra va a quedarse sin usar; la nutrición, los presets y
  la variedad desempatan dentro de un escalón de 25 céntimos.

La doctrina está en `.claude/skills/chef-recetarium/references/sinergia.md`.

## Lo que falta: ajustar los dos diales contra el catálogo vivo

Los dos números que gobiernan el comportamiento están en `src/utils/semana.ts`:

| Dial | Hoy | Qué hace |
|---|---|---|
| `PASO` | 0,25 € | Cuánto margen hay antes de que la nutrición pueda decidir. Más alto = come mejor y tira más. |
| `COSTE_DE_TIRARLO_TODO` | 2 | Cuánto pesa la sobra frente a vaciar la despensa. Más alto = menos basura, menos despensa gastada. |

**Están ajustados contra las 88 recetas del seed, no contra las 688 vivas.** El
pool real es 5,4 veces mayor, así que el reparto tiene muchas más ocasiones de
encontrar un plato que vacíe la despensa *y* no deje sobra: es de esperar que el
óptimo se mueva.

### Cómo rehacerlo

```bash
node --env-file=server/.env server/scripts/volcar-catalogo.mjs catalogo.json
PASADAS=200 npx vite-node scripts/simular-semana.ts catalogo.json
```

El simulador imprime, por dieta: huecos vacíos, platos distintos, cocinas,
ingredientes compartidos y reuso, y luego las tres líneas que importan:

```
despensa: gasta N/12  de los que corren prisa M/7
la compra: paga X €  come Y €  tira Z € (…% de lo pagado, …% de lo comido)
la mesa:   fibra …% del objetivo  proteína …%  platos sin verdura …%
```

Barre los dos diales (ambos leen variable de entorno si los conviertes a
`Number(process.env.X ?? …)` un rato, como se hizo para medir) y quédate con el
que minimiza **el porcentaje de lo comido que se tira** sin hundir la proteína
ni los platos distintos.

### Contra qué comparar

Medido sobre el seed (88 recetas, 200 semanas, despensa de 12 cosas):

| | despensa | prisa | paga | come | tira | proteína | sin verdura | platos |
|---|---|---|---|---|---|---|---|---|
| antes | 8,9/12 | 6,2/7,1 | 15,65 € | 8,47 € | 2,52 € (30%) | 95% | 3% | 80 |
| ahora | 9,7/12 | 6,7/7,1 | 20,97 € | 11,67 € | 1,87 € (16%) | 90% | 6% | 82 |

Barrido de `COSTE_DE_TIRARLO_TODO` sobre el seed: con 1 vacía más despensa
(10,5/12) pero tira el 21%; con 4 empeora en las dos cosas. Por eso quedó en 2.

## Lo que se sabe de la base viva (consultado el 2026-08-26)

- 688 recetas vivas: 473 principales, 121 desayunos, el resto postres y entrantes.
- Todas con `micros` y `apto` rellenos.
- 408 nombres de ingrediente distintos en 7.215 líneas.
- El volcado en JSON ocupa ~1 MB.

## Los otros cabos, por orden de rendimiento

1. **Rellenar el envase en `precios.json`.** Solo 129 de 341 precios traen un
   tamaño legible en `formato` ("tarro 350 g · 2,45 €"). Sin envase, el peso de
   ese ingrediente cae a una suposición de 0,35 €. Es la palanca más barata que
   queda y es trabajo de datos.
2. **Enseñar la cuenta en la app.** `cuentaDeLaCompra` ya devuelve pagado /
   comido / tirado y el desglose por ingrediente. La lista de la compra puede
   decir "pagas 24 €, comes 17 €, se te va a estropear 3 €" y señalar el plato
   que deja medio envase varado.
3. **El reparto es voraz.** El primer plato que coloca tiene la cesta vacía, así
   que nunca puede puntuar por compartir. Una segunda pasada de intercambios
   recuperaría parte de eso. Sin medir.
4. **La puerta de las tandas.** `references/tandas.md` todavía no obliga a que
   un lote baje el "tira".

## Un bug encontrado y no arreglado

`diasTrasAbrir('pasta de miso')` devuelve **3 días**: el núcleo del nombre
colisiona con `pasta fresca` en la tabla de `trasAbrir.ts`. Es el mismo choque
contra el que avisa el comentario de `caducidadEstimada.ts`, pero `trasAbrir.ts`
no lleva la guarda.

Síntoma real: un bote de miso abierto en la despensa avisa a los tres días.

No se arregló porque la corrección es una decisión de datos, no de código: en
"pasta de miso" el ingrediente es el segundo token y en "nata para cocinar" es
el primero, así que el *fallback* por primera palabra acierta casi siempre y
falla justo en los nombres con el sustantivo detrás. Toca una tabla de la que
dependen la despensa y sus tests.
