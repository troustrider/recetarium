# La compra real: Dirk y Lidl desde 3036 NA (Rotterdam Noord)

Una receta que pide un ingrediente que Karim no puede comprar es una receta que no se cocina. Este fichero decide qué se puede escribir en `ingredientes`.

**Cadenas de referencia, por accesibilidad:** Dirk van den Broek y Lidl. Todo lo demás (AH, Jumbo, toko) es tier de excepción y hay que justificarlo.

⚠️ El surtido varía por tienda, semana y temporada, y las cadenas rotan referencias. Este fichero es una **heurística de nivel de surtido**, no un inventario. Todo lo que marques T3 o T4 lleva su sustituto T1/T2 en `consejos`, para que la receta funcione aunque ese día no esté en el lineal.

## Los cuatro niveles

| Nivel | Significado | Regla |
|---|---|---|
| **T1** | Fijo en Dirk y Lidl todo el año | Úsalo sin pensar |
| **T2** | Habitual pero variable (semanas temáticas de Lidl, pasillo *wereldkeuken* de Dirk) | Úsalo, pero con alternativa T1 en `consejos` |
| **T3** | Requiere toko o supermercado turco/marroquí del barrio | Solo si es un no negociable del plato. Sustituto T1/T2 en `consejos`, o la excepción declarada de abajo |
| **T4** | No accesible de forma razonable | No lo uses. Replantea el plato o cámbialo |

Rotterdam Noord tiene supermercados turcos y marroquíes a pie (zona Zwart Janstraat / Noordplein) y tokos asiáticos en la ciudad: cubren casi todo el T3. Pero eso es un viaje aparte, así que una receta entre semana no debe depender de ello.

### La excepción del viaje al toko

Hay ingredientes T3 que **no tienen sustituto honesto**: el doubanjiang del mapo tofu, el gochujang de un jjigae, el tamarindo de un pad thai. Aproximarlos con miso y chile no da el plato, da otro peor con el mismo nombre.

En esos casos la salida correcta **no** es inventar un sustituto T1 para cumplir la puerta. Es decirlo:

> "El doubanjiang es de toko y no tiene sustituto honesto: con miso y chile sale otra cosa. Compra un bote, dura un año en nevera y sirve para todos los platos de Sichuan."

Una línea de `consejos` con esa forma —**el ingrediente, dónde se compra, y por qué no hay atajo**— satisface la puerta de compra. Lo que no vale es dejar el T3 en la lista sin decir nada, ni ofrecer un apaño que rompe el plato. Y si el ingrediente además tiene una aproximación decente aunque imperfecta, se da con su nivel de riesgo según `sustituciones.md`.

## T1 — Siempre disponible

**Proteína:** kipfilet (pechuga), kipdijfilet / kippendijen (contramuslo, más barato y más indulgente), rundergehakt y half-om-half gehakt (picada), varkenshaas (solomillo de cerdo), speklapjes, gerookt spek (bacon), kipgehakt, eieren, tonijn in blik, kant-en-klare kikkererwten / linzen / bruine bonen, tofu natuur (Vemondo en Lidl).

**Lácteos:** magere kwark (proteína barata: ~11 g/100 g), Skyr, Griekse yoghurt, hüttenkäse / cottage cheese, naturel yoghurt, kookroom y slagroom, crème fraîche, geraspte kaas, jong/oude kaas, feta (T1 en Lidl, T2 en Dirk), mozzarella.

**Verdura y fruta:** ui, rode ui, prei, knoflook, wortel, aardappel, courgette, aubergine, paprika, tomaat, tomatenblokjes/passata, champignons, broccoli, bloemkool, spinazie (fresca y congelada), sperziebonen, diepvries groentemix, citroen, limoen, banaan, appel.

**Despensa:** rijst (pandan/langkorrel), pasta seca, couscous, bulgur, havermout, bloem, bakpoeder, suiker, honing, olijfolie, zonnebloemolie, azijn (wit/balsamico), sojasaus, **ketjap manis**, **sambal oelek**, kokosmelk, tomatenpuree, bouillonblokjes, paprikapoeder, komijn, kerrie, oregano, chilivlokken, panko (T2 en algunas), pinda's, walnoten, amandelen, pindakaas.

**Ventaja neerlandesa:** por herencia indonesia, ketjap manis, sambal oelek, kokosmelk, boemboe y kroepoek son producto de supermercado normal aquí. La cocina indonesia sale casi entera con T1 — aprovéchalo, está infrarrepresentada en su recetario.

## T2 — Habitual pero variable

Depende sobre todo de las semanas temáticas de Lidl (*Griekse week*, *Italiaanse week*, *Spaanse week*, *Aziatische week*) y del pasillo internacional de Dirk:

- Tahini, harissa, ras el hanout, za'atar, sumak
- Chorizo, jamón serrano, pimentón (dulce; el ahumado es más raro)
- Pecorino/Grana Padano, burrata, ricotta
- Panko, noedels, rijstnoedels, nori, wasabi, sesamolie, sesamzaad
- Feta en Dirk, halloumi
- Aceitunas de calidad, alcaparras, anchoas en aceite
- Gochujang y curry rojo/verde tailandés (aparecen en semana asiática; fuera de ella, no cuentes con ellos)
- Bulgur fino, lenteja roja, quinoa
- Hierbas frescas más allá de perejil/cilantro/albahaca

## T3 — Toko o supermercado turco/marroquí

Mirin, sake, doubanjiang, gochugaru en bolsa, kimchi, pasta de tamarindo, azúcar de palma, nam pla (salsa de pescado), hojas de lima kaffir, galanga, pasta de curry de marca tailandesa, chiles secos mexicanos (guajillo, ancho, chipotle en adobo), masa harina, tortillas de maíz, achiote, pasta de cacahuete sin azúcar estilo africano, berbere, harina de garbanzo, yufka, bulgur grueso, pul biber.

## T4 — Reemplaza el plato

Guanciale, pera asiática, tteok fresco, pescado crudo de calidad sashimi, quesos españoles DO (manchego curado, idiazábal), morcilla, jamón ibérico, tomatillo fresco, hoja santa, huitlacoche, chiles frescos mexicanos.

## Traducciones que evitan errores en el lineal

| Español | Neerlandés | Cuidado |
|---|---|---|
| pechuga de pollo | kipfilet | — |
| contramuslo de pollo | kipdijfilet / kippendijen | Más barato y no se seca. Preferente en guisos |
| carne picada mixta | half-om-half gehakt | La de solo ternera es *rundergehakt* |
| solomillo de cerdo | varkenshaas | — |
| queso fresco batido / quark | magere kwark | ~11 g proteína/100 g, la palanca proteica más barata |
| nata para cocinar / de montar | kookroom / slagroom | *Kookroom* aguanta mejor el calor |
| cilantro fresco | verse koriander | **Trampa:** *koriander* a secas en el estante de especias es semilla de cilantro molida, no la hierba |
| perejil | (platte) peterselie | — |
| harina | bloem / tarwebloem | *Zelfrijzend bakmeel* ya lleva levadura |
| levadura química | bakpoeder | *Gist* es levadura de panadero, no es lo mismo |
| tomate triturado / en cubos | passata / tomatenblokjes | — |
| garbanzos de bote | kikkererwten | — |
| lentejas | linzen | *Rode linzen* para cremas, *bruine* para guiso |
| pimiento | paprika | *Paprikapoeder* es el pimentón |
| calabacín | courgette | — |
| judía verde | sperziebonen | — |
| espinaca congelada | diepvries spinazie | Escúrrela bien o suelta agua |
| avena | havermout | — |
| pan rallado japonés | panko | El *paneermeel* normal es pan rallado fino |
| salsa de soja | sojasaus | *Ketjap asin* es la salada, *ketjap manis* la dulce |

## Proteína por euro (para llegar al objetivo de la ración)

Ordenado por eficiencia real en estas dos cadenas:

| Ingrediente | Proteína/100 g | Uso típico |
|---|---|---|
| magere kwark | ~11 g | Desayunos, salsas frías, marinadas |
| huevos | ~13 g (6,5 g por unidad) | Cualquier hueco |
| kipfilet | ~23 g | Base de plato principal |
| kipdijfilet | ~19 g | Guisos, más sabor y más barato |
| gehakt (half-om-half) | ~17 g | Albóndigas, ragús, köfte |
| skyr | ~11 g | Igual que el kwark, más ácido |
| atún en lata escurrido | ~25 g | Emergencias (🐟, no para Karim) |
| lentejas cocidas | ~9 g | Suma con carne; sola sostiene un plato vegetal, cuyo objetivo es 25 g |
| tofu firme | ~12-16 g | Salteados |
| tempeh | ~19 g | La más densa de la despensa vegetal: fermentado, aguanta plancha y guiso |
| garbanzos cocidos | ~8 g | Guisos, ensaladas, hummus |
| seitán | ~24 g | Estofados y salteados; nada para celíacos |
| edamame | ~11 g | Guarnición que sí suma |
| queso curado rallado | ~25 g | Refuerzo, pero aporta mucha grasa |

**Palancas para subir una receta sin desfigurarla:** subir la carne de 300 a 400 g por 2 raciones; añadir un huevo; rematar con 30 g de queso rallado; acompañar de un lácteo proteico en vez de pan; añadir legumbre al plato de cereal. En vegetal: doblar la legumbre, cambiar tofu por tempeh o seitán, rematar con semillas o levadura de cerveza. La palanca elegida se explica en `consejos` si cambia el plato respecto a la versión canónica.

Y cuando la palanca es de acompañamiento y no de plato, **se declara en `consejos` con una fuente concreta**: es lo que el validador lee para dar por buena una receta entre el suelo y el objetivo. "Sírvelo con pan" no es una palanca; "acompáñalo de 200 g de yogur griego" sí.

## Precio y estacionalidad

Los precios de referencia están en `precios-nl.md`. Dos notas prácticas:

- Dirk es sistemáticamente más barato en fresco y carnicería; Lidl gana en despensa, frutos secos, lácteos proteicos y en sus semanas temáticas.
- El fresco de temporada (invierno: puerro, col, zanahoria, calabaza; verano: tomate, calabacín, pimiento) baja de precio y mejora de calidad. Si una receta depende de un fresco fuera de temporada, propón la versión de congelado o de lata y dilo.
