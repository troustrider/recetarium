# Canon de recetas: fidelidad al plato real

Regla que gobierna esta skill: **no se inventan recetas.** Toda propuesta se apoya en un plato documentado de una cocina real, y se declara de dónde viene. Si no se puede apoyar, se dice y se etiqueta como versión de casa — nunca se vende como auténtica.

## Los tres niveles de procedencia

Cada receta que propongas cae en uno. Decide el nivel **antes** de escribir nada.

**Nivel A — Plato del canon.** Está en las tablas de abajo. Úsalo tal cual: sus no negociables y su ratio clave son la espina dorsal de la receta. Es la vía rápida y la preferente.

**Nivel B — Plato documentado fuera del canon.** Existe, tiene tradición, pero no lo tienes fichado o dudas de un ratio/técnica clave. **Verifica antes de proponer** (protocolo abajo). Nombra la cocina y la referencia en la respuesta.

**Nivel C — Variación o fusión propia.** Permitida, pero solo construida sobre una base de nivel A o B, y **declarada como tal**: "base X, versión con Y". Nunca la llames por el nombre del plato original si has tocado un no negociable. Un `Bibimbap` sin gochujang es "bol coreano de arroz y verduras", no un bibimbap.

Si no puedes situar una propuesta en A, B o C, no la propongas.

## Protocolo de verificación (niveles B y C)

Cuando el plato no está en el canon, o cuando dudas de una proporción, una temperatura o el orden de un paso:

1. **Busca** (`WebSearch` / `WebFetch`) antes de escribir la receta, no después.
2. **Fuentes que valen**, en este orden: cocineros o instituciones de la propia cocina (Maangchi para coreana, Just One Cookbook para japonesa, Fuchsia Dunlop para sichuanesa, Pierre Thiam para senegalesa, Ottolenghi/Basbousa para Levante, Claudia Roden para Mediterráneo y Oriente Medio, Serious Eats para técnica contrastada); libros de referencia citados por nombre; medios gastronómicos serios del país de origen. **No valen**: agregadores de recetas generados por IA, blogs sin autoría, contenido de marca de un producto.
3. **Extrae hechos, no texto**: proporciones, técnica, orden, tiempos, señales de punto. Reescribe siempre los pasos con tus palabras. No copies la prosa de la fuente.
4. **Contrasta dos fuentes** si el plato tiene versiones muy distintas (hay diez shakshukas y quince ragús). Elige una versión, dilo, y menciona la divergencia en `consejos` si es relevante.
5. **Si no consigues verificar**, tienes dos salidas honestas: proponer otro plato que sí puedas fundamentar, o entregarlo etiquetado ("no he podido contrastar la versión tradicional; esto es una versión de casa basada en X"). Nunca la tercera vía de rellenar el hueco a ojo.

## Ficha de fidelidad (obligatoria en toda receta)

Antes de escribir `pasos`, ten resueltos estos cinco puntos. No van todos al JSON, pero gobiernan lo que escribes:

| Punto | Qué es | Dónde acaba |
|---|---|---|
| **Plato de referencia** | Nombre real y cocina de origen | `nombre` + `categoria` |
| **No negociables** | Los 2-4 elementos sin los cuales deja de ser ese plato | En los `pasos`, sin excepción |
| **Ratio canónico** | La proporción que define el resultado (no las cantidades de relleno) | `ingredientes`, escalado a `porciones` |
| **Desviaciones** | Lo que cambias por precio, tiempo o disponibilidad NL | Declaradas en `consejos`, una por línea |
| **Qué se pierde** | Coste real de cada desviación | En el mismo `consejos`, en la misma línea |

Una desviación sin su "qué se pierde" es una desviación oculta. Eso es exactamente lo que hace que una receta parezca fiel y no lo sea.

## Cómo se usa el canon

Las columnas significan:

- **No negociables**: si esto no está, cambia el nombre del plato.
- **Ratio / técnica clave**: la parte que un recetario simplificado se salta y por la que el resultado no sabe igual.
- **Corrupción común**: el error que verás en la mitad de las versiones de internet. Evítalo, y si Karim lo pregunta, explícalo.

Cocinas cubiertas: las suyas (mediterránea, italiana, griega, turca/Levante, este de Asia, sudeste asiático, LatAm, África occidental). **Sin cocina india**, por preferencia declarada. Los platos marcados 🐟 llevan pescado: existen en la BD por Cloe, pero no se le proponen a él.

---

## España y Andalucía

| Plato | No negociables | Ratio / técnica clave | Corrupción común |
|---|---|---|---|
| **Tortilla de patatas** | Patata confitada en aceite abundante a fuego suave, no frita crujiente; reposo del huevo con la patata | 1 huevo por 100 g de patata; confitar 20-25 min a fuego medio-bajo; reposar la mezcla 10 min antes de cuajar | Saltear la patata en dos cucharadas de aceite y cuajar de inmediato: queda seca y sin trabazón |
| **Pollo al ajillo** | Ajo laminado dorado en el aceite, pollo troceado **con hueso**, desglasado con vino blanco o brandy | 1 cabeza de ajo por 1 kg de pollo; dorar el ajo aparte y devolverlo al final para que no amargue | Nata en la salsa, ajo en polvo, pechuga en dados |
| **Albóndigas en salsa** | Panade (pan remojado en leche), sofrito largo, albóndigas terminadas **dentro** de la salsa | 500 g carne : 60 g miga de pan : 80 ml leche : 1 huevo; sofrito 15 min mínimo | Pan rallado seco sin leche → albóndigas secas y compactas |
| **Lentejas estofadas** | Sofrito base, pimentón añadido **fuera del fuego**, chorizo o panceta si va con carne | Lenteja pardina 80 g/persona; el tomate y el vinagre, al final de la cocción | Pimentón sobre el aceite caliente → amarga toda la olla |
| **Salmorejo** | Emulsión de pan, aceite y tomate; textura densa, no sopa | 1000 g tomate : 200 g pan del día anterior : 100 ml AOVE : 1 diente de ajo : 10 g sal | Añadir agua o vinagre en cantidad: rompe la emulsión y lo deja aguado |
| **Pinchos morunos** | Marinada seca de comino, pimentón, ajo y orégano sobre cerdo; reposo largo | 4 h de marinada mínimo (mejor 12); dados de 3 cm para que el interior no se pase | Marinar 10 min y esperar sabor; usar pechuga en vez de cerdo o contramuslo |
| **Arroz al horno** | Base de sofrito y caldo caliente, arroz que no se remueve una vez añadido el caldo | Arroz bomba/redondo 1 : caldo 2,5 en volumen; 18-20 min a 200°C | Remover el arroz durante la cocción: suelta almidón y deja de ser arroz seco |
| **Marmitako 🐟** | Bonito añadido fuera del fuego, patata cascada (no cortada) | La patata se casca para que suelte almidón y ligue el caldo | Hervir el pescado dentro del guiso: se convierte en algodón |

## Italia

| Plato | No negociables | Ratio / técnica clave | Corrupción común |
|---|---|---|---|
| **Cacio e pepe** | Solo pecorino romano, pimienta tostada en seco y agua de cocción. Nada más | 100 g pasta : 60-70 g pecorino; emulsionar **fuera del fuego**, por debajo de 65-70°C | Nata o mantequilla; queso rallado industrial con antiaglomerante → se agruma sí o sí |
| **Carbonara** | Guanciale (o panceta), huevo y pecorino, sin nata; salsa cuajada por calor residual | Por persona: 100 g pasta, 50 g guanciale, 1 huevo + 1 yema, 35 g pecorino | Nata, ajo, cebolla, y cuajar el huevo en la sartén al fuego → revuelto con pasta |
| **Ragù alla bolognese** | Soffritto, carne dorada de verdad, **leche antes del vino y el tomate**, cocción larga | 500 g carne : 50 g cebolla + 50 g zanahoria + 50 g apio : 200 ml leche : 150 ml vino : 400 g tomate; 2-3 h a fuego mínimo | Salsa de tomate con carne en 20 min, servida con espaguetis (va con tagliatelle o pasta ancha) |
| **Risotto** | Tostado del arroz, caldo **caliente** cazo a cazo, mantecatura final fuera del fuego | 80-90 g arroz carnaroli/arborio por persona : 3-4 veces su volumen en caldo; 18 min; mantecar con mantequilla fría y parmesano | Añadir todo el caldo de golpe (arroz cocido, no cremoso) o mantecar al fuego (se corta) |
| **Pasta al pomodoro** | Tomate cocinado el tiempo suficiente, albahaca al final, pasta terminada en la sartén con la salsa | 400 g tomate : 2 dientes : 20 min de reducción; 1-2 cucharones de agua de cocción para ligar | Volcar la salsa sobre la pasta escurrida en el plato: no liga, resbala |
| **Pollo alla cacciatora** | Contramuslo con piel, vino, tomate, romero; guiso lento | 45-50 min a fuego bajo tras dorar; el pollo debe cocerse en la salsa, no aparte | Pechuga en dados y 15 min de cocción |
| **Pesto genovese** | Albahaca cruda, ajo, piñones, pecorino + parmesano, AOVE. **Sin calor** | 50 g albahaca : 30 g piñones : 60 g queso : 100 ml AOVE : 1 diente | Calentar el pesto en la sartén: se oxida y amarga |
| **Parmigiana di melanzane** | Berenjena salada y escurrida antes de freír, capas, reposo antes de cortar | Salar 30 min y secar; reposo de 20 min tras el horno | Berenjena sin desaguar → agua en la bandeja y amargor |

## Grecia

| Plato | No negociables | Ratio / técnica clave | Corrupción común |
|---|---|---|---|
| **Souvlaki de cerdo o pollo** | Marinada de limón, orégano seco, ajo y aceite; brasa o sartén muy fuerte | Marinada 2-4 h; dados de 3 cm; fuego fuerte y corto para que no se seque | Marinada con yogur (eso es otra cosa) o cocción a fuego medio → carne gris |
| **Tzatziki** | Pepino rallado, salado y **exprimido**; yogur griego graso; ajo | 400 g yogur : 1 pepino escurrido : 1 diente : 1 cda AOVE; salar el pepino 20 min y estrujarlo | Pepino sin escurrir: en una hora tienes una sopa |
| **Gyros de pollo** | Marinada con pimentón, orégano, comino y yogur; carne en lonchas gruesas | Marinada 4 h; asar en bloque y laminar, no en dados | Trocear antes de asar: pierde jugo y no se lamina |
| **Moussaka** | Berenjena desaguada, ragú de cordero con canela y vino, bechamel con huevo | Bechamel de 500 ml con 2 yemas para que gratine y aguante el corte; reposo 20-30 min | Bechamel sin huevo (se desparrama al cortar) y ragú sin canela (pierde su identidad) |
| **Fasolada** | Alubia blanca, sofrito de zanahoria y apio, mucho aceite, tomate | 250 g alubia seca remojada 12 h : 80 ml AOVE; cocción 60-90 min | Poco aceite: es un plato donde el aceite es ingrediente, no medio |

## Turquía y Levante

| Plato | No negociables | Ratio / técnica clave | Corrupción común |
|---|---|---|---|
| **Menemen** | Pimiento verde y tomate reducidos hasta espesar antes del huevo; huevo poco cuajado | Reducir el tomate 8-10 min; el huevo se remueve suave a fuego bajo y se retira antes de estar hecho | Huevo cuajado del todo sobre tomate aguado: es un revuelto cualquiera |
| **Shakshuka** (origen magrebí/tunecino) | Base de tomate y pimiento reducida hasta que la cuchara deje surco; clara cuajada y yema líquida | 400 g tomate : 1 pimiento : comino y pimentón; huevos 6-8 min tapado a fuego bajo | Huevos sobre tomate líquido: se dispersan y quedan crudos por arriba |
| **Köfte / Adana** | Carne con 20% de grasa, amasado hasta que la masa se vuelve pegajosa, reposo en frío | Amasar 5-8 min (emulsión de grasa y proteína) + 30 min de nevera, o se caen del pincho | Carne magra y mezclado suave: se rompen y quedan secas |
| **Hummus** | Garbanzo muy cocido, tahini en cantidad, limón, agua helada para montarlo | 250 g garbanzo cocido : 110 g tahini : 40 ml limón : 1 diente : 60-80 ml agua helada; bicarbonato en la cocción (½ cdta) ablanda la piel | Poco tahini y mucho garbanzo: sale puré de legumbre, no hummus |
| **Falafel** | Garbanzo **seco remojado 12-24 h**, jamás cocido ni de bote | Garbanzo crudo remojado + hierbas + cebolla + ajo; reposo de la masa 30 min en frío; fritura 170-175°C | Garbanzo de bote → se deshace en el aceite. No hay truco que lo salve (ver `sustituciones.md`, nivel 3) |
| **Tabulé** | Es una ensalada **de perejil**, no de bulgur | ~200 g perejil : 40 g bulgur fino (solo hidratado, no cocido) : tomate : limón : aceite | Cuscús con verduras y cuatro hojas de perejil |
| **Mercimek çorbası** | Lenteja roja deshecha, textura de crema, mantequilla con pimentón por encima al servir | 200 g lenteja roja : 1,2 L caldo; 25-30 min; triturar; limón al servir | Servirla sin la grasa aromatizada ni el limón: plana |
| **Shawarma casero de pollo** | Marinada de yogur con especias, contramuslo, asado fuerte y laminado | Marinada 4-12 h; 220°C hasta dorar; laminar en caliente | Pechuga y 30 min de marinada |

## Este de Asia

| Plato | No negociables | Ratio / técnica clave | Corrupción común |
|---|---|---|---|
| **Oyakodon** | Caldo de dashi, soja y mirin; huevo añadido en dos tandas y servido **sin cuajar del todo** | Por ración: 100 ml dashi : 1,5 cda soja : 1,5 cda mirin : 1 cdta azúcar; huevo en 2 veces, 1 min y 40 s | Huevo cuajado en tortilla sobre arroz: se pierde la textura que define el plato |
| **Gyudon** | Ternera en lonchas finísimas, cebolla cocida en el caldo dulce-salado | Soja : mirin : sake : azúcar ≈ 2:2:2:1; la cebolla se cuece 5 min antes de la carne | Dados de ternera guisados: textura equivocada |
| **Teriyaki** | Salsa reducida en la propia sartén sobre la proteína, brillo por reducción | Soja : mirin : sake : azúcar = 1:1:1:0,5; reducir 2-3 min hasta que nape | Salsa comprada espesada con almidón, echada al final sin reducir |
| **Tonkatsu** | Doble rebozado con panko, fritura a temperatura controlada, reposo en rejilla | Harina → huevo → panko; 170-175°C, 5-6 min; reposar 5 min de pie | Pan rallado fino en vez de panko, y escurrir sobre papel (se reblandece) |
| **Arroz frito (chino)** | Arroz **frío del día anterior**, wok muy caliente, sartén nunca abarrotada | Arroz cocido y enfriado ≥4 h destapado en nevera; cocinar por tandas | Arroz recién hecho: suelta almidón y sale una papilla |
| **Velveting de pollo** (técnica) | Clara + maicena + agua antes de saltear; es lo que hace que el pollo del chino sea tierno | 250 g pollo : 1 clara : 1 cda maicena : 1 cda agua : 1 cdta aceite; 20-30 min de reposo | Saltear el pollo en seco a fuego fuerte: fuera duro, dentro seco |
| **Mapo tofu** | Doubanjiang (pasta de haba fermentada), tofu **blando o sedoso** escaldado, pimienta de Sichuan tostada al final | Escaldar el tofu 2 min en agua salada antes: se afirma por fuera y aguanta el salteado sin romperse; ligar con maicena al final | Tofu firme (la textura temblorosa es el plato) y sriracha en vez de doubanjiang |
| **Bulgogi** | Marinada con fruta que ablanda (pera asiática), soja, sésamo, ajo; carne muy fina | Marinada 30 min-4 h; pera rallada ≈ 80 g por 500 g de carne | Kiwi como ablandador más de 30 min: deshace la carne en pasta (ver `sustituciones.md`) |
| **Kimchi jjigae** | Kimchi **maduro**, no fresco; grasa de cerdo; gochugaru | Sofreír el kimchi en la grasa 5 min antes de añadir líquido: es donde se hace el sabor | Kimchi recién comprado: le falta la acidez que sostiene el guiso |
| **Bibimbap** | Verduras aliñadas por separado, arroz caliente, gochujang, huevo | Cada verdura se sazona sola (sésamo, ajo, sal); no es un salteado mezclado | Saltearlo todo junto: se pierde la gracia del plato |
| **Tteokbokki** | Pastel de arroz, gochujang + gochugaru, caldo de anchoa reducido | Salsa reducida 8-10 min hasta napar; azúcar equilibra el picante | Gochujang aguado sin reducir |

## Sudeste asiático

| Plato | No negociables | Ratio / técnica clave | Corrupción común |
|---|---|---|---|
| **Pad thai** | Tamarindo, azúcar de palma y salsa de pescado en equilibrio; fideos **remojados**, no hervidos | Salsa 1:1:1 (tamarindo : azúcar : nam pla); fideos en agua templada 30-60 min; saltear por tandas | Ketchup y fideos hervidos: plato distinto, y peor |
| **Nasi goreng** | Arroz frío, kecap manis, sambal, y algo fermentado (terasi) | Arroz del día anterior; kecap manis 2 cda por 400 g de arroz | Soja normal en vez de kecap manis: falta el dulce y el color |
| **Saté ayam con salsa de cacahuete** | Marinada con kecap manis y cúrcuma; salsa con cacahuete, sambal, leche de coco | Salsa: 100 g cacahuete molido : 150 ml leche de coco : 1 cda kecap manis : sambal al gusto | Mantequilla de cacahuete azucarada de bote sola: empalaga y no liga |
| **Curry verde tailandés** | La pasta se fríe en la **grasa** de la leche de coco antes de añadir el resto | Romper 100 ml de leche de coco a fuego medio 3-4 min hasta que suelte aceite, y ahí freír la pasta | Diluir la pasta directamente en la leche: sabor plano y crudo |
| **Larb de pollo** | Arroz tostado molido (khao khua), nam pla, lima, mucha hierba fresca | Arroz crudo tostado en seco 8-10 min y molido: es la textura y el aroma del plato | Omitir el arroz tostado: queda una picada de carne aliñada |
| **Rendang** | Cocción hasta que el coco se seca y se caramelizan las especias | 2,5-3 h reales. Es plato de fin de semana, no de martes | Venderlo como "curry rápido de 30 min": eso es otra cosa |

## América Latina

| Plato | No negociables | Ratio / técnica clave | Corrupción común |
|---|---|---|---|
| **Tinga de pollo** | Pollo deshebrado (no en dados), chipotle en adobo, cebolla y tomate | Cocer y deshebrar; sofreír la cebolla 8 min; 2 chipotles por 500 g de pollo | Pollo en cubos con salsa picante encima |
| **Tacos al pastor** | Adobo de achiote y chile guajillo, cerdo marinado largo, piña | Marinada 12-24 h; guajillo hidratado 20 min en agua caliente | Comino y cheddar: eso es Tex-Mex, y hay que decirlo, no disfrazarlo |
| **Chilaquiles** | Totopo empapado justo antes de servir, salsa caliente | Salsa hirviendo + totopo 30-60 s: se busca blando por fuera y con estructura dentro | Dejarlos reposar 10 min: papilla |
| **Lomo saltado** | Wok o sartén al máximo, sillao (soja) + vinagre tinto + ají amarillo, patatas fritas aparte | Saltear por tandas, no remover en exceso; las patatas se incorporan **al final** | Guisar todo junto: la carne suelta agua y se cuece |
| **Ají de gallina** | Pollo deshilachado, salsa de pan remojado, ají amarillo, leche y nueces | Pan de molde remojado en leche como espesante; ají amarillo en pasta 3-4 cda | Espesar con harina: textura pegajosa y sabor a crudo |
| **Ropa vieja** | Falda cocida y desmechada, sofrito con pimiento, comino, aceitunas | Cocer la carne 90 min y desmechar en hebras largas | Carne picada: no es ropa vieja |
| **Picadillo a la habanera** | Carne picada, sofrito, pasas y aceitunas juntas (dulce + salado) | 500 g carne : 40 g pasas : 50 g aceituna; comino y orégano | Quitar las pasas por parecer raras: es justo el contraste que define el plato |

## África occidental

| Plato | No negociables | Ratio / técnica clave | Corrupción común |
|---|---|---|---|
| **Yassa de pollo** | **Cebolla en peso igual o mayor al del pollo**, limón, mostaza de Dijon, marinada larga | 1 kg cebolla por 1 kg de pollo; marinada ≥4 h; las cebollas se cocinan 25-30 min hasta melosas | Media cebolla y 20 min: el plato *es* la cebolla confitada en limón |
| **Maafe** | Pasta de cacahuete diluida en caldo, tomate, cocción larga | 150 g pasta de cacahuete por 1 L de caldo, diluida aparte antes de incorporar | Echar la pasta directa a la olla: se apelmaza y se agarra |
| **Thiéboudienne 🐟** | Pescado relleno de rof (perejil, ajo, chile), arroz cocido en el caldo del guiso | El arroz se cuece en el caldo, nunca aparte | Arroz blanco al lado |
| **Doro wat** | Berbere, cebolla cocinada **en seco** al principio, mantequilla especiada | 45 min solo de cebolla sin grasa antes de añadir nada | Sofrito rápido en aceite |

## Desayunos con proteína real

| Plato | No negociables | Ratio / técnica clave | Corrupción común |
|---|---|---|---|
| **Huevos revueltos estilo francés** | Fuego bajo, movimiento constante, retirar antes de tiempo | 3 huevos : 15 g mantequilla; 5-6 min removiendo sin parar; fuera del fuego 20 s antes de estar listos | Fuego fuerte: cuajan en grumos y sueltan agua |
| **Bol de kwark/skyr** | Base proteica sin azucarar + fruta + algo crujiente + grasa | 250 g kwark magro (≈30 g proteína) + 30 g avena + 20 g frutos secos | Yogur de sabores azucarado: mitad de proteína, triple de azúcar |
| **Tortitas de avena y clara** | Avena molida, clara, un ácido si llevan levadura | 40 g avena : 150 g clara : 1 huevo : ½ cdta levadura; sartén a fuego medio 2-3 min por cara | Fuego fuerte: crudas dentro, quemadas fuera |
| **Shakshuka / menemen** | Ver Turquía y Levante | — | — |

## Platos que no caben entre semana

Proponerlos como plan de fin de semana o batch, con el tiempo real por delante, nunca comprimidos: **ramen** (caldo 6-12 h), **rendang** (3 h), **mole** (3 h+), **cochinita pibil** (4 h), **birria** (3-4 h), **ragù bolognese de verdad** (2-3 h), **fasolada y guisos de legumbre seca** (remojo 12 h + 90 min).

Si Karim pide uno de estos en versión rápida, la respuesta correcta es: "la versión honesta tarda X; puedo darte esa, o darte un plato distinto de la misma cocina que sí cabe en 30 min". No comprimir un plato de 3 h en 30 min y seguir llamándolo igual.
