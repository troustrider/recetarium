# Tanda: desayunos de 40 g

Diseño de las fases 1-4 de `tandas.md`, cerrado el 27 de agosto de 2026.
**Nada escrito todavía**: esto es lo que se aprueba antes de la fase 5.

El encargo viene del cabo que dejó abierto `docs/traspaso-sinergia.md`: la semana
proteica persigue 125 g al día y los días de tres comidas se quedan en 120, con
318 de 600 llegando a 120. El traspaso lo atribuía a que "falta desayuno
proteico". Medido, eso no es exacto, y la corrección es la mitad del trabajo.

## Fase 1 — La auditoría

### El bloque hoy (688 vivas)

| tipo | n | % |
|---|---|---|
| principal | 473 | 68,8% |
| **desayuno** | **121** | **17,6%** |
| entrante | 53 | 7,7% |
| postre | 41 | 6,0% |

### Concentración: el huevo salta la alarma

- **Huevo en 77 de 121 = 64%**, contra un umbral de alarma del 60%. Y el tramo
  alto está peor: de las 35 recetas de ≥35 g, **22 llevan huevo**.
- Lácteo proteico (kwark, skyr, requesón, yogur): 20 (17%).
- Formato gym (bowl, tortitas, batido, porridge): 8 (7%). Sano.
- Pan: 47 (39%).

### Esfuerzo: aquí no está el problema

37 de 121 bajan de 10 min, 93 de 20 min, media 18. La promesa del bloque está
cumplida.

### Defectos ya guardados

Ninguna por debajo del suelo de catálogo (15 g) y ninguna con ficha nula
(`micros`, `sin_gluten`, `hierro`). Cuatro por debajo del suelo de hueco de 25 g
de `momentos-del-dia.md`:

| Receta | Proteína | Cocina |
|---|---|---|
| Latkes de patata con huevo | 22 g | judía |
| Ven pongal | 23 g | india |
| Rava upma con cacahuete | 23 g | india |
| Kaya toast con huevos pasados por agua | 24 g | singapurense |

⚠️ El `audit` completo **no se pudo correr**: el driver de Neon sale por
`api.eu-west-2.aws.neon.tech` y ese host no está en la allowlist de egress de la
sesión remota (403). Lo de arriba es la parte de la fase 1.4 que se puede medir
por SQL a través del conector MCP. El `audit` entero queda para local.

## El hueco no es el que decía el traspaso

**El bloque no está flojo por abajo, está flojo por arriba.** La media es 32 g y
el suelo del hueco 25. Lo que falla es aritmética del preset: 125 g al día en tres
tomas son ~42 g por toma, y el reparto por tramos es:

| tramo | n |
|---|---|
| 25-29 g | 48 |
| 30-34 g | 34 |
| 35-39 g | 18 |
| **≥40 g** | **17** |
| ≥40 g y ≤20 min | 10 |
| ≥40 g y ≤10 min | **1** |

Diez platos para llenar el desayuno de una semana proteica entre semana. Por eso
se caen los días.

Y hay un segundo dato que condiciona el diseño: los 17 de ≥40 g promedian **837
kcal** contra 666 del bloque. Subir proteína metiendo plato más grande no vale;
hay que subir densidad.

### El hallazgo que no se esperaba: sus cocinas favoritas son las flojas

`criterio-chef.md` fija turca, griega, coreana y japonesa como primer nivel.
Ninguna de las cuatro tiene un solo desayuno de 40 g:

| Cocina | n | Máx. proteína | Nota |
|---|---|---|---|
| turca | 3 | 37 g | — |
| **griega** | **1** | 26 g | Dakos cretense, y nada más |
| coreana | 3 | 34 g | las tres con huevo |
| japonesa | 3 | 33 g | las tres con huevo |

El tramo de 40 g está lleno de cocinas del norte y de América (británica,
americana, francesa, danesa, balcánica, polaca, húngara) y vacío justo en las
cuatro que él prefiere. Ese es el eje del diseño.

## Fase 2 — El encargo cerrado

1. **Volumen**: 18 recetas de ≥40 g. Se diseñan candidatos de más porque la fase
   5 es criba.
2. **Cuota de huevo**: máximo 30% de la tanda, o sea 5 exactas de 18.
3. **Deuda de la fase 1.4**: se arregla después, en modo revisión, de una en una.
4. **Cierre**: diseño y JSON aquí, `check` y `apply` en local.

## Fase 3 — La estructura

Eje: **esfuerzo**, que es el que pide `tandas.md` cuando lo que se busca es que
el plato quepa por la mañana. Tres tramos.

🥚 marca las que consumen cuota de huevo.

### Tramo 1 — Un cacharro, ≤15 min

| # | Plato | Cocina | Proteína | De dónde sale | Nivel |
|---|---|---|---|---|---|
| 1 | Mıhlama del Mar Negro | turca | ~42 g | 120 g queso curado fundido + pan | B |
| 2 | Strapatsada con feta 🥚 | **griega** | ~43 g | 4 huevos + 120 g feta | A/B |
| 3 | Cuscuz nordestino com carne moída e coalho | brasileña | ~43 g | 150 g picada + 80 g halloumi | B |

### Tramo 2 — Un cacharro, 20-25 min

| # | Plato | Cocina | Proteína | De dónde sale | Nivel |
|---|---|---|---|---|---|
| 4 | Tonjiru con arroz | japonesa | ~47 g | 120 g panceta + 150 g tofu + miso | B |
| 5 | Hu la tang de Henan | china | ~49 g | 150 g falda + 80 g seitán | B |
| 6 | Haejangguk de brotes de soja | coreana | ~41 g | 180 g falda + doenjang | B |
| 7 | Revuelto Gramajo 🥚 | **argentina** (ausente) | ~43 g | 3 huevos + 130 g jamón cocido | B |

### Tramo 3 — De finde o de tanda, 30-90 min (declarado en `consejos`)

| # | Plato | Cocina | Proteína | De dónde sale | Nivel |
|---|---|---|---|---|---|
| 8 | Phở bò | vietnamita | ~42 g | 180 g falda + fideos de arroz | A/B |
| 9 | Caldo de gallina limeño 🥚 | peruana | ~44 g | 200 g muslo de pollo + huevo | B |
| 10 | Halim persa de trigo y pavo | iraní | ~43 g | 180 g pechuga de pavo + trigo | B |
| 11 | Waakye con estofado de ternera | **ghanesa** (ausente) | ~48 g | arroz y alubia + 150 g ternera | B |
| 12 | Rou jia mo de Xi'an | china | ~44 g | 180 g panceta estofada + panecillo | B |
| 13 | Xôi mặn | vietnamita | ~41 g | arroz glutinoso + cerdo y salchicha | B |

**Cuota de huevo: 3 de 13 = 23%.** Por debajo del 30% acordado.

### Ingredientes puente

| Puente | Por qué rinde | Platos |
|---|---|---|
| **Falda de ternera** (se compra 800 g al peso) | Corte grande, cara, se reparte mal en un solo plato | 5, 6, 8, 11 — **4** |
| **Manojo de cilantro / cebolleta** (4 días de vida) | El perecedero puro: manojo entero por dos cucharadas | 5, 6, 8, 9, 13 — **5** |
| **Panceta / speklapjes** (paquete 400 g) | Paquete que no se acaba con un plato | 4, 12, 13 — **3** |

⚠️ **El cuarto puente no sale.** La tanda cruza nueve cocinas y los quesos y
lácteos no se solapan (queso curado en la 1, feta en la 2, halloumi en la 3). Es
la tensión real entre lo que pide `sinergia.md` y la regla de cocinas ausentes de
`tandas.md`, y se resuelve a favor de las cocinas porque el hueco es de variedad.
Se declara aquí en vez de fingir un puente.

## El número que no sale: 18

**No hay 18 desayunos documentados de ≥40 g que no dupliquen algo ya guardado.**
Esto es un resultado del dedup, no una estimación: el recetario ya está denso por
arriba. Cayeron, entre otros:

| Candidato | Ya guardado como |
|---|---|
| Sundubu jjigae | `Sundubu jjigae (estofado de tofu)` — principal, 44 g |
| Dubu jorim | `Dubu jorim (tofu braseado coreano)` — principal, 46 g |
| Kıymalı pide | `Kıymalı pide` — principal, 45 g |
| Soto ayam | `Soto ayam` — principal, 52 g |
| Chanpurū de tofu | `Chanpuru de tofu y cerdo` — principal, 56 g |
| Chilaquiles con pollo | `Chilaquiles rojos con pollo y huevo` — principal, 49 g |
| Tteokguk | `Tteokguk` — principal, 36 g |
| Gözleme kıymalı | `Börek de carne` — misma terna masa + carne + turca |
| Bubur ayam / dakjuk | `Congee de pollo` — desayuno, 39 g |
| Syrniki / Quarkkeulchen | `Tortitas de requesón y avena con miel` — misma terna |
| Bircher con skyr | `Bircher müesli suizo` |
| Lablabi | `Lablabi tunecino` |
| Boxty | `Boxty con huevo` |
| Kimchi bokkeumbap | `Bulgogi bokkeumbap` — misma terna |
| Pan con chicharrón, Calentado paisa | ya existen como desayuno |
| Feta saganaki | `Saganaki (queso frito griego)` — entrante |

Con la tasa de supervivencia de la tanda anterior (18 de 37 candidatos), 13
candidatos dan **entre 9 y 11 recetas finales**. Diseñar 26 candidatos para
forzar las 18 exige entrar en fusión de relleno, que `tandas.md` prohíbe
expresamente. Así que la tanda entrega lo que hay y **el resto del hueco se cierra
por otra vía**, que además rinde más por unidad de trabajo:

> **48 desayunos están en 25-29 g y 34 en 30-34 g.** Subir veinte de ésos a 35-40
> con una palanca de plato es modo **revisión**, no tanda: son recetas que ya
> existen, ya están documentadas y solo necesitan más proteína en la lista de
> ingredientes. Veinte revisiones mueven el pool de 40 g mucho más que ocho
> recetas nuevas que no existen.

## El efecto que hay que aceptar

**Las 13 son saladas.** No es pereza: un desayuno dulce de 40 g solo se alcanza
con lácteo en volumen, y esas plazas ya están ocupadas (Naleśniki 43, Palacsinta
42, Kaiserschmarrn 42, Batido de kwark 36, Bowl de avena 35). El reparto
dulce/salado del bloque empeora de 65/23 a 68/21. `tandas.md` pide vigilarlo, así
que queda dicho: si esto molesta, el dulce se arregla en revisión subiendo el
kwark de los que ya están, no metiendo platos nuevos.

## Los números que mueve esto

Con 10 recetas finales, que es la previsión honesta:

| Medida | Hoy | Después |
|---|---|---|
| Bloque desayuno | 121 (17,6%) | 131 (18,7%) |
| Pool de ≥40 g | 17 | 27 |
| Pool de ≥40 g y ≤25 min | 10 | 17 |
| Huevo en el bloque | 64% | 61% |
| Cocinas favoritas con desayuno de 40 g | 0 de 4 | 4 de 4 |
| Cocinas ausentes cubiertas | — | argentina, ghanesa |
| Salado / dulce | 65% / 23% | 68% / 21% |

## Fase 4 — Escaneo de fichas: no hace falta ninguna

Contrastado contra las 351 fichas de `server/src/lib/nutrientes.json`. Ya tienen
ficha: `falda de ternera`, `seitán`, `tofu firme`, `panceta de cerdo`, `doenjang`,
`pasta de miso`, `brotes de soja`, `pechuga de pavo`, `jamón cocido`, `queso
feta`, `halloumi`, `queso curado`, `harina de maíz precocida`, `sémola de trigo`,
`fideos de arroz`, `bulgur`, `cebolleta`, `cilantro`.

Están en la lista `ignorar` (especias sin macros que contar): `gochugaru`,
`pimienta blanca`, `anís estrellado`, `canela`.

**La tanda no toca código.** Dos platos se cayeron precisamente por ficha y por
compra, y se dice en vez de apañarlos:

- **Machaca con huevo** (mexicana, 48 g): la carne seca norteña no tiene ficha y
  es T3/T4 en Rotterdam. Sustituirla por falda deshebrada la convierte en otro
  plato.
- **Cuscuz com carne de sol**: la carne de sol es T3/T4. Se rescata el plato con
  **carne picada**, que es la otra versión nordestina documentada, y se declara la
  desviación.

## Lo que queda por hacer

1. **Fase 5.1 — verificar procedencia.** Doce de los trece son nivel B y pasan
   por el protocolo de `canon-recetas.md` antes de escribirse. Las preguntas que
   pueden tumbar cada plato, no un resumen: si el ratio queso:harina del mıhlama
   es el que se dice, si el hu la tang lleva mianjin de verdad o es opcional, si
   el waakye admite versión de 60 min, si el halim se puede dejar hecho la noche
   antes, si el queso coalho tiene sustituto honesto en halloumi.
2. **Fase 5.3-5.4 — escribir el lote y `check`.** El `check` sí corre en esta
   sesión: `validar()` no toca la base de datos.
3. **Fase 5.6 — `apply` en local**, con `server/.env`.
4. **Fase 6 — la puerta de la basura.** Medir el "tira" antes y después con
   `volcar-catalogo.mjs` + `simular-semana.ts`. Hoy está en el 12% de lo comido.
   La tanda mete carne cara al peso (que no deja envase) y un manojo de cilantro
   compartido por cinco platos, así que debería bajarlo o dejarlo igual.
5. **Fase 6 — la deuda**: las cuatro por debajo de 25 g, en revisión y de una en
   una.

## Revisión en local, 27 de agosto de 2026

Repasado con `server/.env` delante, que es lo que la sesión remota no tenía. **La
auditoría de la fase 1 es correcta hasta el último número**: 121 desayunos, huevo
en 77 (64%), tramos 48 / 34 / 18 / 17, diez de ≥40 g en veinte minutos y uno solo
en diez, media de 32 g y 666 kcal contra 837 de los altos, 37 platos de diez
minutos y media de 17,6, las cuatro por debajo de 25 g, y 22 de los 35 de ≥35 g
con huevo. Las cuatro cocinas favoritas también: turca 3 con máximo de 37, griega
1 con 26, coreana 3 con 34, japonesa 3 con 33, y ninguna en el tramo de 40 g.

Las 351 fichas de `nutrientes.json` están donde dice la fase 4. Dos correcciones:

1. **Xôi mặn ya está guardado**, y como desayuno de 34 g. El plato 13 se cae del
   diseño; el dedup lo pasó por alto. Quedan doce.
2. **El halim persa no tiene ficha de trigo en grano.** Hay `sémola de trigo`,
   `bulgur` y `cebada perlada`, que no son lo mismo: el haleem se hace con grano
   entero. O entra ficha nueva, y entonces la tanda sí toca código, o el plato se
   escribe con bulgur y lo declara en `consejos`.

Y una duda para la fase 5.1: existe `Phở chay` como principal de 41 g. El phở bò
cambia la proteína y el caldo, así que por la regla de dedup no choca, pero
conviene mirarlo con la receta guardada delante y no solo con el nombre.
