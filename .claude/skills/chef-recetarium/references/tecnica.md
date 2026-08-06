# Ejecución a prueba de novato

Criterio de aceptación de una receta de este recetario: **alguien que no ha cocinado nunca ese plato, siguiendo los pasos al pie de la letra y sin decidir nada por su cuenta, obtiene el plato.** Si en algún punto tiene que adivinar, el paso está mal escrito.

Prueba mental obligatoria antes de entregar: recorre los pasos como si tuvieras las manos ocupadas y ninguna intuición. Cada vez que te preguntes "¿cuánto?", "¿qué fuego?", "¿cómo sé que ya está?", "¿en qué cacharro?" y el texto no lo diga, corrígelo.

## Anatomía de un paso correcto

Un paso lleva, cuando aplica: **qué haces + con qué cantidad + en qué recipiente + a qué fuego + cuánto tiempo + cómo sabes que está**.

> ❌ "Sofríe la cebolla."
> ✅ "Pica 1 cebolla en dados pequeños. Calienta 2 cucharadas de aceite en una sartén de 24 cm a fuego medio y sofríe la cebolla 7-8 min, removiendo cada 2 min, hasta que esté transparente y sin nada de color dorado."

> ❌ "Cuece el arroz."
> ✅ "Enjuaga 1 vaso de arroz largo bajo el grifo hasta que el agua salga clara. Ponlo en un cazo con vez y media de agua medida con el mismo vaso y ½ cdta de sal, lleva a hervor, tapa y baja al mínimo 12 min. Apaga y deja reposar tapado 5 min sin destapar."

> ❌ "Añade el pollo y cocina hasta que esté hecho."
> ✅ "Sube a fuego fuerte y añade el pollo en una sola capa, sin amontonar. Déjalo quieto 3 min hasta que se despegue solo y esté dorado, dale la vuelta y 2-3 min más, hasta 74°C en el centro o hasta que el jugo salga transparente al pinchar."

## Reglas duras al escribir `pasos`

1. **Primer paso = mise en place.** Todo lo que hay que cortar, medir, escurrir o sacar de la nevera, antes de encender el fuego. Un novato no puede picar ajo mientras algo se quema.
2. **Una acción con su tiempo por paso.** No fusiones dos elementos con tiempos distintos. Si van en paralelo, dilo explícito: "mientras se cuece el arroz (12 min), haz lo siguiente".
3. **Toda acción con tiempo lleva duración parseable**: número + unidad (`min`, `minutos`, `s`, `segundos`, `h`, `horas`) o rango `N-M min`. El Modo cocina de la app extrae los cronómetros parseando ese texto: un paso sin tiempo es un paso sin temporizador.
   - `según el paquete` solo cuando el tiempo depende de verdad del producto (pasta seca, fideos, cuscús), y aun así con el rango típico entre paréntesis: "cuece la pasta según el paquete (10-11 min)".
   - Arroz blanco largo: siempre tiempo concreto (12 min), nunca "según el paquete".
4. **Tiempo + señal de punto siempre que el tiempo no baste solo**: hornos, guisos, cuajados y frituras varían. "Reduce 8-10 min hasta que al pasar la cuchara quede un surco que tarda en cerrarse".
5. **Fuego en palabras + qué se ve.** "Fuego medio (el aceite brilla pero no humea)", "fuego fuerte (al echar la carne debe chisporrotear de inmediato)". El número del mando no significa nada entre cocinas distintas.
6. **Cantidades en el paso, no solo en la lista, y marcadas entre llaves.** El que cocina lee los pasos, no vuelve arriba: repite la cantidad la primera vez que aparece el ingrediente. Y va **entre llaves**, porque la app escala el texto del paso al cambiar de comensales.
   - `Sofríe {1 cebolla} y {300 g} de carne 8 min` con 4 comensales se renderiza como `Sofríe 2 cebolla y 600 g de carne 8 min`.
   - **Solo escala lo que va entre llaves.** Fuera se quedan siempre los tiempos (`8 min`), las temperaturas (`74°C`), los tamaños de utensilio (`sartén de 24 cm`) y las proporciones relativas (`vez y media de agua medida con el mismo vaso`). Multiplicar cualquiera de esos es un error de cocina, no de aritmética.
   - Por eso el agua del arroz se escribe como proporción y no como volumen: `{1 vaso} de arroz con vez y media de agua medida con el mismo vaso` funciona para cualquier número de comensales sin tocar nada.
   - **El agua de cocción escala con su sal, o la sal se dispara.** `2 litros de agua con {20 g} de sal` es un fallo: al pasar a 4 comensales quedan 2 litros con 40 g y la pasta sale de tirar. Se marcan las dos: `{2 litros} de agua con {20 g} de sal`. Si quieres decir la proporción, dila sin cifra escalable ("a razón de 10 g por litro"), nunca entre llaves.
   - **Lo que fabrica el propio plato también escala.** `Forma {12 albóndigas} del tamaño de una nuez`. Sin llaves, al doblar comensales salen 12 albóndigas del doble de tamaño con el tiempo de cocción de las pequeñas: crudas por dentro. Aplica a albóndigas, bolas, brochetas, hamburguesas, croquetas, tortitas, muffins y a los huecos de un molde o de una salsa.
   - **El peso por pieza no se marca nunca**, porque ya sale del total y del número de piezas. `{400 g} de carne en {4 bolas} de {100 g}` escala a 8 bolas de 200 g, que es el doble de hamburguesa. Se escribe `{400 g} de carne en {4 bolas} del mismo tamaño`.
   - Implementación: `src/utils/escalarPasos.ts`.
   - **El arroz se mide en vasos, nunca en gramos.** Unidad `vaso` = vaso de cristal medio de cualquier casa, ~200 ml, ~180 g de arroz crudo. El agua se mide con el mismo vaso, y así la proporción sobrevive a cualquier número de comensales: 1 vaso de arroz : 1½ vasos de agua (largo/basmati), 1 : 2 (redondo/bomba). Escribe el paso en vasos ("añade vez y media de agua midiendo con el mismo vaso"), no en ml.
7. **Recipiente y tamaño cuando cambian el resultado**: "sartén de 24 cm", "cazo pequeño", "olla ancha", "bandeja de horno". Una sartén demasiado pequeña convierte un salteado en un hervido.
8. **Horno siempre con temperatura y posición**: "precalienta a 200°C, calor arriba y abajo, rejilla en la mitad".
9. **Esperas pasivas marcadas como tales** ("refrigera 3 h", "deja reposar 5 min", "marina 4 h"). No se suman a `tiempoPreparacion`, que es tiempo de trabajo. Si la receta necesita 12 h de remojo, va en el paso 1 y en `consejos`, no en el campo.
10. **Nada de jerga sin traducir.** Si usas un término técnico, defínelo en el propio paso ("pocha la cebolla, es decir, cocínala a fuego suave sin que coja color"). Glosario abajo.
11. **Ortografía cuidada y español neutro.** La app renderiza el texto tal cual: "fríe", "está", "jamón".
12. **Coherencia ingrediente ↔ paso, en las dos direcciones.** Todo ingrediente de la lista se usa en algún paso, y todo ingrediente nombrado en un paso está en la lista con su cantidad. Es un fallo silencioso y fácil de colar: la receta se lee bien y la lista de la compra sale incompleta.

## Umbrales duros verificables

Los comprueba `server/scripts/chef-recetas.mjs` (`audit` sobre la BD, `check` sobre un lote). Si el script marca ERROR, la receta no se entrega ni se escribe. Los avisos se corrigen salvo que haya una razón dicha en voz alta.

| Umbral | Valor | Por qué |
|---|---|---|
| Pasos mínimos | 5 en `principal`, 4 en el resto | Menos de eso obliga a fusionar acciones y a que el que cocina rellene huecos |
| Pasos con duración parseable | ≥3, o ≥2 si el plato no cocina | El Modo cocina necesita cronómetros reales, no uno simbólico. Un bol de yogur no tiene tres cocciones que cronometrar, y exigírselas obligaría a inventar tiempos |
| Cocción sin tiempo ni señal | 0 | Cada verbo de cocción lleva duración, señal de punto, o ambas |
| Temperatura interna | Obligatoria si hay pollo, cerdo o carne picada | Es la diferencia entre seco, crudo e inseguro |
| Horno sin °C | Prohibido | — |
| Último paso de plato salado | Manda probar y ajustar | Cocinar sin probar es el fallo de novato más caro |
| Cuantificadores vagos en pasos | 0 | Ver lista abajo |
| Porciones | **2**, siempre | La app escala desde ahí (`BASE_COMENSALES`). Una receta a 3 raciones descuadra el selector de comensales |
| Cantidades del paso sin marcar | 0 | Sin llaves no escalan, y el paso miente en cuanto cambias de comensales |
| Longitud de paso | 40-400 caracteres | Más corto no informa; más largo no se lee con las manos ocupadas |
| Consejos | 3-5 | Menos de tres no cubre procedencia + riesgo + punto crítico |
| Desviación de macros | ≤10% entre kcal declaradas y `4P+4C+9G` | Un macro que no cuadra es un macro inventado |
| Proteína y kcal contra ingredientes | ≤20% respecto a `nutrientes.json` | Coherencia interna no es verdad: los cuatro números pueden cuadrar entre sí y ser falsos |
| Ingrediente no citado en pasos | 0 | Salvo sal, pimienta y agua |
| Metacomentario en `consejos` | 0 | El campo se renderiza como "Consejos del chef", no como registro de cambios |

**Cuantificadores vagos prohibidos dentro de `pasos`:** "un poco de", "un chorro", "un chorrito", "unas gotas", "al gusto", "algo de", "un buen puñado", "suficiente", "la cantidad necesaria", "un vaso de agua" sin medir. Todos tienen sustituto exacto: una medida, una cucharada, un gramaje o un tiempo. `sal` y `pimienta` sí pueden ir al gusto **en la lista de ingredientes**, porque la app las renderiza así, pero en los pasos la primera vez que se salan van medidas ("1 cucharadita rasa, el 1% del peso de la carne").

## Números que no se negocian

**Temperaturas internas seguras y correctas** (termómetro, o la señal equivalente):

| Producto | °C interior | Señal sin termómetro |
|---|---|---|
| Pollo y pavo (cualquier corte) | 74 | El jugo sale transparente al pinchar la parte más gruesa |
| Cerdo (lomo, solomillo, chuleta) | 63 + 3 min de reposo | Rosa pálido en el centro, jugo claro |
| Carne picada (hamburguesa, albóndiga) | 71 | Sin zonas rosas y jugo claro |
| Ternera al punto | 55-57 | Cede al presionar pero recupera |
| Pescado | 55-60 | Se separa en lascas con leve presión |
| Huevo cuajado | 70 | Clara opaca y firme, yema aún fluida |

**Sal:**
- Carnes y masas: **1% del peso** (10 g por kg) como punto de partida.
- Agua de pasta: **10 g por litro**, y no se enjuaga la pasta después.
- Agua de verduras y legumbres: 8-10 g por litro.
- Salar en capas durante la cocción y probar antes de emplatar. Un plato salado solo al final sabe a salado, no a sazonado.

**Aceite y fritura:**
- Sofreír/pochar: fuego medio-bajo, 170-180°C de sartén, la cebolla susurra pero no chisporrotea.
- Dorar/sellar: fuego fuerte, aceite brillante y ondulado, chisporroteo inmediato.
- Fritura por inmersión: 170-180°C. Sin termómetro, un dado de pan se dora en 60 s.
- Aceite de oliva virgen extra: bien para saltear; para fritura por inmersión larga, girasol.

**Cocciones de referencia:**

| Elemento | Tiempo | Señal |
|---|---|---|
| Cebolla pochada | 7-10 min a fuego medio | Transparente, sin dorar |
| Cebolla caramelizada | 30-40 min a fuego bajo | Marrón ámbar, dulce |
| Sofrito base de tomate | 15-20 min | La cuchara deja surco y el aceite se separa |
| Arroz largo | 12 min + 5 de reposo tapado | Grano suelto |
| Arroz redondo/bomba | 18 min | Cocido pero entero |
| Lenteja pardina | 30-35 min | Tierna, con piel entera |
| Garbanzo de bote | 10 min | Solo se calienta y toma sabor |
| Huevo cocido yema jugosa | 6-7 min desde hervor | — |
| Pechuga de pollo (2 cm) | 3-4 min por cara | 74°C |
| Contramuslo deshuesado | 6-7 min por cara | 74°C, más indulgente |
| Brócoli en floretes | 4-5 min hervido | Verde intenso, cede al cuchillo |

## Los siete fallos de novato que hay que prevenir en el texto

Escribe los pasos de forma que estos errores sean imposibles:

1. **Sartén fría.** "Calienta la sartén 2 min antes de echar el aceite" evita la carne gris hervida en su jugo.
2. **Sartén abarrotada.** "En una sola capa, sin que las piezas se toquen; si no caben, hazlo en dos tandas".
3. **Proteína húmeda.** "Seca el pollo con papel de cocina antes de sazonarlo" — sin esto no dora.
4. **Remover de más.** "Déjalo quieto 3 min: se despegará solo cuando esté dorado".
5. **No reposar la carne.** "Deja reposar 5 min antes de cortar" y, en carnes en filete, "corta contra la fibra".
6. **Ácido y lácteo a destiempo.** Limón y vinagre al final; yogur fuera del fuego y atemperado.
7. **Cocinar sin probar.** El último paso de cualquier plato salado: "prueba y ajusta de sal y ácido antes de servir".

## Paralelismo realista

Karim cocina con dos fuegos, no con cuatro y un ayudante. Al escribir el orden:

- No pidas tres cosas simultáneas con atención activa.
- Coloca lo pasivo (arroz tapado, horno) al principio y encadena lo activo dentro de esa ventana, diciéndolo: "mientras el arroz cuece 12 min, ...".
- Si el plato requiere de verdad tres fuegos, dilo en `consejos` y ofrece el orden alternativo secuencial.
- `tiempoPreparacion` debe corresponder al reloj real de alguien haciendo esto por primera vez, con su mise en place incluido. Si dudas entre 20 y 30, pon 30.

## Glosario para usar dentro de los pasos

Si aparece uno de estos términos, va acompañado de su explicación breve la primera vez:

**Pochar** (cocinar a fuego suave sin que coja color) · **sofreír** (a fuego medio hasta ablandar y dorar ligeramente) · **sellar** (dorar la superficie a fuego fuerte) · **desglasar** (echar líquido en la sartén caliente y raspar el fondo tostado) · **reducir** (hervir destapado para que evapore y espese) · **napar** (que la salsa cubra el dorso de una cuchara sin resbalar) · **emulsionar** (unir grasa y agua en una salsa homogénea) · **temperar** (subir poco a poco la temperatura de un lácteo o huevo antes de incorporarlo al caliente) · **mantecar** (ligar con mantequilla fría fuera del fuego) · **blanquear** (hervir brevemente y cortar la cocción con agua fría) · **marcar** (dorar antes de terminar en horno o guiso) · **cascar** (romper la patata con el cuchillo para que suelte almidón) · **mise en place** (todo cortado y medido antes de encender el fuego).

## `consejos`: para qué sirve

El campo `consejos` se renderiza en la app como "Consejos del chef". Es donde va lo que no cabe en un paso. Entre 3 y 5 líneas, y al menos una de las dos primeras categorías.

**Se escriben para quien va a cocinar el plato, hoy, sin más contexto.** Nada de metacomentario de autoría: ni "la versión anterior llevaba", ni "he subido la carne a 350 g", ni "es la receta más proteica del recetario". Karim lee esto con la sartén al fuego; una versión que nunca vio y una comparación con el resto de la BD no le sirven para nada y ocupan una de las cinco líneas. Si un cambio respecto al plato canónico importa, se dice como cocina ("con menos cebolla queda menos meloso"), no como historial. El validador lo avisa.

Categorías:

1. **Fidelidad y desviaciones** — "la versión senegalesa lleva tanta cebolla como pollo; aquí va algo menos para acortar la cocción, queda menos meloso".
2. **Avisos de sustitución de nivel 2 o 3** — "no uses garbanzo de bote: se deshace al freír".
3. **Punto crítico** — dónde se estropea el plato y cómo evitarlo.
4. **Conservación y batch** — cuánto aguanta en nevera, si congela bien, cómo recalentar.
5. **Ajuste de macros** — cómo subir la proteína sin romper el plato.
