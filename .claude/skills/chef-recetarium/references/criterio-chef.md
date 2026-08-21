# Criterio de chef

El filtro por el que pasa cualquier propuesta: para quién es, qué tiene que cumplir y con qué fundamento se combinan los sabores. La fidelidad al plato original la gobierna `canon-recetas.md`; la escritura de los pasos, `tecnica.md`.

## Perfil del comensal

- **Karim**, Rotterdam Noord (3036 NA). Nacido y criado en Granada. Cocina entre semana, dos fuegos, sin ayudante.
- **Cocinas favoritas, primer nivel: turca, griega, coreana y japonesa.** Son las cuatro por las que se empieza cuando pide "sorpréndeme", una tanda, o un plato sin más pistas.
- **Segundo nivel**: el resto de la mediterránea (española, italiana, portuguesa), el resto de la asiática (china, tailandesa, indonesia), LatAm y Oriente Medio. Le gusta la fusión entre ellas.
- **No come pescado.** La BD tiene recetas con pescado porque es compartida con Cloe; el filtro aplica solo a lo que se le propone a él.
- **No le gusta el cordero.** Mismo criterio que el pescado: no se le propone. Cuando el plato canónico es de cordero (Ali nazik, tajine, kibbeh, maqluba), se hace con ternera o mezcla de ternera y cerdo y se declara la desviación. A Cloe sí le gusta, así que en la BD compartida puede haberlo.
- **No le gusta la cocina india.** No proponérsela (curry masala, korma, tikka, dal). En la BD compartida sí hay, por Cloe.
- **Batch cooking friendly**: 2-4 porciones, y suman puntos las recetas que aguantan en táper.
- **Compra en Dirk y Lidl.** Los ingredientes se eligen contra `compra-nl.md`, no contra un supermercado ideal.

## Objetivo nutricional

La skill `entrenador-personal` fija los objetivos en la memoria `karim-fitness-profile`. Por defecto: lean bulk, ~3.100 kcal y ~130 g de proteína al día.

La proteína es un **objetivo, no una puerta**. Se maximiza siempre; no se exige siempre. Son tres números y no uno:

| | Suelo | Objetivo con carne o pescado | Objetivo sin ellos |
|---|---|---|---|
| `principal` | 20 g | 35 g | 25 g |
| `desayuno` | 15 g | 25 g | 18 g |

- **Por debajo del suelo la receta no sirve para su hueco**, y ahí no hay palanca que valga: 14 g no sostienen una cena, se escriba lo que se escriba en `consejos`.
- **Entre el suelo y el objetivo la receta pasa si declara la palanca**: la frase de `consejos` que dice con qué se completa ("acompáñalo de 200 g de yogur griego"). Eso es lo que hace comprobable que se ha maximizado en vez de conformarse.
- **La proteína se cuenta con la de la guarnición**, porque es lo que se come: un pescado a 24 g con su ensalada de garbanzos no es un plato de 24 g.

### Por qué el objetivo baja sin carne ni pescado

Hasta agosto de 2026 el umbral era seco —35 g o aviso— y el efecto real no era seleccionar calidad, era **seleccionar carne**: una ración vegetal bien cargada de legumbre, tofu o huevo ronda los 25 g, y llegar a 35 pide un bote de proteína en polvo o romper un ratio del canon. Ninguna receta vegana entraba limpia. El objetivo bajo es el techo honesto de esa cocina, no una rebaja de exigencia: dentro de él sigue mandando el "sube lo que dé el plato".

Y el gate **se abstiene**, como el resto: si a algún ingrediente le falta ficha en `nutrientes.json` no se puede afirmar que el plato sea vegetal, y se le pide el objetivo alto.

Quien recoge la holgura que se suelta aquí es la semana: con dieta vegetariana o vegana puesta, la auto-semana empuja la proteína sola (`src/utils/semana.ts`) y entre dos platos veganos elige el que más trae.

- Si `entrenador-personal` pasa números concretos del día, mandan esos; si no, estos, y dilo.
- Los macros del JSON son **por ración** y tienen que ser coherentes con las cantidades reales de la lista de ingredientes. Cálculalos con la tabla de `compra-nl.md`, no a ojo. El validador los contrasta contra `server/src/lib/nutrientes.json` y da ERROR si la proteína o las kcal se desvían más de un 20% de lo que dan los ingredientes.

### Precedencia: el canon manda sobre el macro

**Cuando llegar al objetivo exige romper un ratio del canon, no se rompe.** El número se declara como sale y la palanca va al lado, fuera del plato.

Un ratio canónico es la forma del plato, no un parámetro libre. Estirarlo para cuadrar una cifra produce comida peor y datos que parecen buenos: la Cacio e pepe de la BD llegó a llevar 180 g de pecorino para 200 g de pasta (el canon dice 60-70 g por cada 100 g de pasta) y el resultado era salado y con la emulsión al borde de agrietarse, todo para subir la proteína a 35.

Las tres salidas correctas, en este orden:

1. **Palanca fuera del plato**: acompañar con un lácteo proteico, un huevo, hummus o una guarnición de legumbre. Se declara en `consejos` y **no se cuenta en los macros** si no está en la lista de ingredientes.
2. **Declarar el número real** y decirlo en la respuesta. Un principal a 30 g dicho en voz alta es correcto; uno a 30 g escrito como 35 no. Esta salida dejó de ser la excepción: es la vía normal de la cocina vegetal.
3. **Proponer otro plato** de la misma cocina que sí llegue sin deformarse.

Lo que nunca: subir el ingrediente que define el ratio (queso en una emulsión, carne en una masa, tahini en un hummus) para alcanzar la cifra. Ni escribir el número que hace falta.

### El precio: banda habitual, no límite

La banda de 0,80-4,50 €/ración de `precios-nl.md` describe lo que se cocina entre semana, y el validador la trata como aviso, no como error. **Un plato de ocasión puede pasarse a propósito**, siempre que el aviso se declare en la respuesta y el corte caro sea el plato y no un capricho: un galbijjim con costilla de ternera vale para una comida de fin de semana justo porque no es la carne de guisar de siempre. Lo mismo por abajo: un banchan o una masa de harina y azúcar cuestan lo que cuestan y no se inflan con un ingrediente de relleno para entrar en la banda. Lo que no vale es cruzarla en silencio.

## Fundamento de sabor

No se combinan ingredientes por intuición. Dos herramientas, en este orden.

### 1. Base aromática de la cocina (principio de Rozin)

Cada cocina tiene una combinación de aromas característica. Respetarla es lo que hace que un plato "suene" a su origen; mezclarlas sin querer es lo que produce platos que no saben a nada concreto.

| Cocina | Base aromática | Grasa habitual |
|---|---|---|
| Española | Cebolla + ajo + pimentón + tomate + laurel | Aceite de oliva |
| Italiana | Soffritto (cebolla, zanahoria, apio) + ajo + albahaca/romero | Aceite de oliva, mantequilla al norte |
| Griega | Aceite de oliva + limón + orégano + ajo | Aceite de oliva |
| Turca | Cebolla + pimiento (pul biber, biber salçası) + comino + menta seca | Mantequilla, aceite de girasol |
| Levante | Ajo + limón + comino + tahini + perejil | Aceite de oliva |
| Marroquí | Comino + cilantro + jengibre + canela + azafrán | Aceite, mantequilla clarificada |
| China (norte) | Cebolleta + jengibre + ajo + soja | Cacahuete, girasol |
| Sichuán | Doubanjiang + pimienta de Sichuan + chile seco + ajo | Cacahuete, aceite de chile |
| Japonesa | Dashi + soja + mirin + sake | Poca; sésamo al final |
| Coreana | Ajo + gochugaru/gochujang + sésamo + soja | Sésamo, girasol |
| Tailandesa | Ajo + chile + salsa de pescado + lima + azúcar de palma | Coco, girasol |
| Indonesia | Ajo + chalota + kecap manis + sambal + coco | Coco, girasol |
| Mexicana | Chile + cebolla + ajo + tomate/tomatillo + orégano mexicano + comino | Manteca, girasol |
| Peruana criolla | Ají amarillo + cebolla roja + ajo + comino + soja (chifa) | Girasol |
| Cubana | Sofrito de cebolla, pimiento verde, ajo, comino, orégano | Aceite |
| África occidental | Cebolla + tomate + chile + caldo concentrado + cacahuete | Cacahuete, palma |

Regla práctica: elige una base y quédate en ella. Si haces fusión (Karim la disfruta), fusiona **de forma consciente y declarada**: base de una cocina + técnica o ingrediente puntual de otra, no cinco especias de cinco sitios.

### 2. Principios de equilibrio

Para justificar en una línea por qué un plato funciona, y para detectar propuestas planas:

- **Ácido + graso**: todo lo graso pide un ácido que lo corte (limón, encurtido, yogur, vinagre). Un plato graso sin ácido cansa a la tercera cucharada.
- **Dulce + salado/picante**: dosis pequeñas de dulce redondean lo picante y lo fermentado (miel en marinados, azúcar en salsas asiáticas, pasas en el picadillo).
- **Umami apilado**: combinar fuentes multiplica (tomate + queso, soja + setas, anchoa + carne, kimchi + cerdo). Es la palanca barata para que un plato económico sepa a más.
- **Contraste de textura**: algo crujiente sobre algo cremoso (cebolla frita, frutos secos, pan tostado, arroz tostado del larb). Un plato de una sola textura aburre por muy bien sazonado que esté.
- **Frescor final**: hierba fresca, cítrico o crudité al servir levanta cualquier guiso.
- **Sal en capas**: sazonar durante la cocción, no solo al final.

Si al revisar una propuesta no puedes señalar el ácido, el umami y el contraste de textura, le falta algo. Arréglalo antes de entregarla.

## Sustituciones

Van en `sustituciones.md`, con su clasificación de riesgo. Regla resumida y no negociable: **nunca ofrezcas una sustitución sin decir qué cambia y cómo compensarlo**, y nunca ofrezcas las de nivel 3.

## Al proponer

- **2-4 opciones, no más.** Cada una con una línea de por qué funciona (sabor concreto o conveniencia concreta, no genérico).
- **Varía el eje** entre opciones: si una es salteado asiático exprés, que otra sea de cuchara o de horno.
- **Mira la concentración antes de proponer.** El recetario se escora solo: llegó a tener 34 recetas de udon sobre 279, y casi la mitad de los principales con pollo. Antes de añadir una receta nueva, cuenta cuántas hay ya con ese formato o esa proteína:

  ```sql
  SELECT count(*) FROM recetas WHERE ingredientes::text ILIKE '%udon%';
  SELECT count(*) FILTER (WHERE ingredientes::text ILIKE '%pollo%')::float / count(*) FROM recetas WHERE tipo = 'principal';
  ```

  Si un formato pasa del 10% del recetario o el pollo del 45% de los principales, esa vía está saturada: propón otra proteína u otra técnica, y dilo. Un plato nuevo que solo cambia la salsa de uno que ya está no es un plato nuevo, es un duplicado con otro nombre.
- **Primero lo que ya tiene.** La BD manda: si hay algo suyo que encaja, se dice antes de proponer nada nuevo.
- **"Sorpréndeme"**: plato de una cocina poco representada en su BD que cumpla las puertas, y explica por qué lo elegiste.
- **Honestidad sobre el tiempo.** Si el plato canónico tarda 2 h, se dice. Ver "Platos que no caben entre semana" en `canon-recetas.md`.
