# Los tres huecos del día

Cuándo se come un plato y qué clase de plato es son dos cosas distintas, y hasta ahora la skill solo conocía la segunda. Este fichero gobierna la primera.

| Eje | Dónde vive | Quién lo valida |
|---|---|---|
| `tipo` (`principal`, `desayuno`, `postre`, `entrante`) | Columna de la receta. Es el **formato** del plato: dato de catálogo | `chef-recetas.mjs check/audit`, con los suelos de `criterio-chef.md` |
| `momento` (`desayuno`, `comida`, `cena`) | Campo de la entrada del plan (`src/utils/momentos.ts`). Es **cuándo se come** | Nadie: no hay columna que validar. Vive aquí y en el autollenado |

**Las puertas de este fichero son criterio de propuesta y de auto-semana, nunca del validador.** Una receta guardada no sabe en qué hueco va a caer, así que `check` no puede suspenderla por eso y no lo intenta. Lo que sí puede hacer el chef es no proponer un plato de 1.100 kcal cuando le piden una cena.

## Por qué hacía falta

El reparto anterior era un `if`: lo que no era `tipo: 'desayuno'` iba a la cena, y comida y cena bebían del mismo montón de principales. O sea que no existía ni un criterio que distinguiera una comida de una cena, y el único que distinguía desayuno de principal era un suelo de proteína que ninguna receta de la BD incumple.

Los números de agosto de 2026, sobre 430 recetas vivas:

| tipo | n | kcal media | kcal p25-p75 | proteína media | proteína mínima |
|---|---|---|---|---|---|
| `principal` | 265 | 702 | 560-845 | 43 g | 14 g |
| `desayuno` | 71 | 646 | 512-773 | 33 g | 22 g |

56 kcal de diferencia entre un desayuno y un principal. El suelo de 15 g de los desayunos no filtraba nada: la receta más floja del bloque trae 22. Un criterio que no separa nada no es un criterio, es una etiqueta.

## Qué dice la evidencia, y hasta dónde

Ordenado de más sólido a más flojo, que es lo que decide qué puede ser puerta y qué solo preferencia.

**El total del día domina.** Los efectos del reparto horario son de segundo orden frente a la ingesta total y la proteína total. Cualquier puerta por hueco es subordinada: si obliga a comer peor en el conjunto del día, está mal puesta.

**Proteína por toma, no por día.** Es el hallazgo fuerte y el que más importa en un lean bulk. Repartir en 3-4 tomas de ~0,4 g/kg estimula la síntesis proteica mejor que el sesgo occidental de 10/15/60 (Areta 2013, Mamerow 2014, Moore 2015). Para 73 kg son ~29 g por toma. **Puerta**, y es la corrección de fondo: donde la skill permitía bajar era justo la toma que la literatura dice que hay que subir.

**Sueño y reflujo.** Comidas grandes, muy grasas o muy picantes en las 2-3 h previas a dormir empeoran la latencia del sueño y el reflujo. Evidencia moderada. **Este es el argumento real de "cena más ligera", y es mecánico, no metabólico.** Puerta blanda: un tope de energía y de grasa, no una lista de platos prohibidos.

**Ritmo circadiano de la glucosa.** La tolerancia a la glucosa cae a lo largo del día: la misma comida por la noche da una excursión glucémica mayor (Morris 2015, Poggiogalle 2018). Mecanismo bien descrito, relevancia clínica modesta en alguien sano y en superávit. **Preferencia, no puerta**: el plato de más almidón se sirve a mediodía si se puede elegir. No da para "nada de carbohidratos de noche", que es falso.

**Interacciones dentro de la misma comida.** Vitamina C potencia el hierro no hemo; calcio, polifenoles del café y del té y fitatos lo inhiben. Esto sí es intrínsecamente por comida y no por día, y es la parte de la skill que ya estaba bien (`nutricion-ficha.md`). Aplica al hueco, no al plato: un desayuno de huevo y espinacas con café al lado es otra cosa que el mismo desayuno con un zumo.

### Lo que no es criterio, aunque lo parezca

- **Que un plato "sea" de desayuno.** Es cultura, no nutrición. `tandas.md` ya lo tenía resuelto: un meze griego o un Brotzeit bávaro entran como desayuno declarando en `consejos` cuándo se comen allí.
- **"El desayuno es la comida más importante".** Los ECA no lo sostienen (metaanálisis Sievert 2019 en BMJ, Bath Breakfast Project). Lo que sí justifica cuidarlo en este caso es operativo: meter 3.100 kcal en dos comidas es incómodo.
- **Adelantar la energía al principio del día.** El front-loading tiene evidencia en contextos de pérdida de peso. En lean bulk no aplica, y no se usa aquí.

## Las puertas por hueco

| Hueco | Proteína | Energía y grasa | Tiempo |
|---|---|---|---|
| `desayuno` | Suelo 25 g, objetivo 30 | Sin banda: la evidencia no da para ponerla | ≤20 min entre semana |
| `comida` | Suelo 25 g, objetivo 35 | Sin techo. **Es el hueco del plato grande**: el de más trabajo, más almidón y más energía | El techo del día, con el finde ensanchado |
| `cena` | Suelo 25 g, objetivo 30 | ≤950 kcal y ≤35 g de grasa por ración | El techo del día |

Los dos números de la cena son un **corte de conveniencia sobre el recetario, no un umbral clínico**: parten los principales casi por la mitad (145 de 265 pasan) y dejan los platos más pesados donde tienen sitio. Se dicen así, y no como si los hubiera dictado nadie.

El suelo de 25 g sale de 0,35 g/kg para 73 kg y **no cuesta deuda**: 258 de los 265 principales ya lo cumplen, y 69 de los 71 desayunos. Por debajo, el plato solo entra en el hueco si los `consejos` declaran la palanca, igual que en `criterio-chef.md`. Si `entrenador-personal` pasa números concretos del día, mandan esos y se dice.

**Los suelos de este fichero son de hueco y los de `criterio-chef.md` son de catálogo, y no son el mismo número a propósito.** El validador sigue admitiendo un principal de 20 g porque una receta guardada vale por sí misma; lo que no vale es colocarla en un hueco sin decir con qué se completa.

## Al proponer

Cuando la petición nombra el hueco ("¿qué ceno?", "algo para la comida del sábado"), se filtra por el hueco y no por `tipo`, y se dice si un candidato bueno se ha caído por la puerta. Un galbijjim de 1.100 kcal no es una mala receta: es una comida, y así se ofrece.

Cuando la petición no lo nombra, no se inventa: se propone por `tipo` como siempre.

## Cómo está implementado

- `src/utils/momentos.ts` — `TOPE_CENA` y `cabeDeNoche()`, la única puerta dura.
- `src/context/PlanificadorContext.tsx` — el autollenado construye el montón de la cena filtrado y el de la comida entero. Como el repartidor llena antes los huecos más estrechos, los platos pesados acaban a mediodía sin necesidad de un peso extra. Si el montón de la cena no da para la semana, se ensancha y el informe lo dice.
- `src/utils/semana.ts` — `OBJETIVO_POR_COMIDA` escala con los huecos que el plan llena. Antes multiplicaba por siete días dando por hecho una comida al día, así que con tres huecos puestos la proteína se saturaba con el primer plato y el resto de la semana dejaba de valorarla.
