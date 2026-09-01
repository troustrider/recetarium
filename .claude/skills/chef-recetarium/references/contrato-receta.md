# Contrato de receta

Formato exacto que aceptan la API (`POST /api/v1/recetas`) y la BD. Fuente: `server/src/controllers/recetasController.js` (validación) y `server/src/services/recetasService.js` (persistencia).

## Quirk arquitectónico importante

`sabor` NO es una columna de `recetas`: se guarda como `category_id` → `categories.name`. Las 5 filas de `categories` son los sabores. `categoria` sí es columna, texto libre, y significa **cocina** (espanola, japonesa...). No los confundas.

## JSON de entrada (RecetaInput)

Este ejemplo está atado al validador: `node scripts/chef-recetas.mjs check-doc` lo extrae de este fichero y lo pasa por las mismas puertas que un lote. Si lo tocas, ejecútalo.

Dos cosas que enseña a propósito:

- **Todas las cantidades del paso van entre llaves**, y el aceite del paso 2 está en la lista de ingredientes. Un ejemplo que se salta una puerta la enseña saltada.
- **Se queda en 24 g de proteína y lo dice.** Una shakshuka con proteína de principal necesitaría el doble de feta, y entonces ya no es una shakshuka. La salida correcta no es retocar el número ni retorcer el plato, es declarar el real y poner la palanca en `consejos`. Ver la regla de precedencia en `criterio-chef.md`.

```json
{
  "nombre": "Shakshuka",
  "sabor": "salado",
  "categoria": "mediooriente",
  "tipo": "principal",
  "tiempoPreparacion": 30,
  "porciones": 2,
  "precioPorPorcion": 2.15,
  "calorias": 480,
  "proteinas": 24,
  "carbohidratos": 18,
  "grasas": 35,
  "ingredientes": [
    { "nombre": "huevos", "cantidad": 5, "unidad": "ud", "familia": "huevos" },
    { "nombre": "tomate triturado", "cantidad": 400, "unidad": "g", "familia": "verduras" },
    { "nombre": "pimiento", "cantidad": 1, "unidad": "ud", "familia": "verduras" },
    { "nombre": "cebolla", "cantidad": 1, "unidad": "ud", "familia": "verduras" },
    { "nombre": "queso feta", "cantidad": 80, "unidad": "g", "familia": "lácteos" },
    { "nombre": "aceite de oliva", "cantidad": 2, "unidad": "cucharada", "familia": "condimentos" },
    { "nombre": "comino", "cantidad": 1, "unidad": "cucharadita", "familia": "especias" },
    { "nombre": "sal", "cantidad": 1, "unidad": "pizca", "familia": "especias" }
  ],
  "pasos": [
    "Pica {1 cebolla} y {1 pimiento} en dados de 1 cm. Ten los {5 huevos} y los {80 g} de feta a mano antes de encender el fuego.",
    "Calienta {2 cucharadas} de aceite de oliva en una sartén de 24 cm a fuego medio y sofríe la cebolla y el pimiento 8 min, removiendo cada 2 min, hasta que estén blandos y la cebolla transparente.",
    "Añade {1 cucharadita} de comino y remueve 30 s a fuego medio, solo hasta que huela.",
    "Incorpora los {400 g} de tomate triturado y {½ cucharadita} de sal. Cuece a fuego medio-bajo 12-15 min, removiendo cada 3 min, hasta que al pasar la cuchara quede un surco que tarda en cerrarse.",
    "Haz {5 huecos} en el tomate con el dorso de una cuchara y casca un huevo en cada uno. Tapa y cuece a fuego bajo 6-8 min, hasta que la clara esté opaca y la yema siga líquida.",
    "Desmenuza los {80 g} de feta por encima, prueba y ajusta de sal, y sirve directamente en la sartén con pan para mojar."
  ],
  "consejos": [
    "La shakshuka es de origen magrebí, no israelí; esta versión sigue la tunecina con pimiento y comino.",
    "El punto crítico es el paso 4: si el tomate sigue líquido, los huevos se dispersan y quedan crudos por arriba. No pases al paso 5 sin el surco.",
    "Son 24 g de proteína por ración, por debajo de los 35 de un principal. Es lo que da el plato bien hecho. Para llegar, acompáñala de 200 g de yogur griego o de 150 g de hummus, que suman sin tocar la sartén."
  ],
  "guarniciones": ["Ensalada verde con limón", "Pan de pita tostado"]
}
```

## Reglas de validación (la API rechaza con 400 si fallan)

| Campo | Regla |
|---|---|
| `nombre` | string no vacío, máx 150 chars |
| `sabor` | obligatorio, uno de: `salado`, `dulce`, `amargo`, `umami`, `acido` |
| `tiempoPreparacion` | number > 0 (minutos). Tiempo de trabajo activo real, sin reposos ni marinados |
| `ingredientes` | array no vacío; cada uno con `nombre`, `cantidad` > 0 (number), `unidad`, `familia` no vacíos |
| `pasos` | array no vacío de strings no vacíos. Calidad obligatoria según `tecnica.md` |
| `consejos` | opcional para la API (array de strings no vacíos), **obligatorio en esta skill**: 2-5 líneas. Se renderiza como "Consejos del chef" en `DetalleReceta` |
| `calorias/proteinas/carbohidratos/grasas` | opcionales, number >= 0. **Por porción**, no por receta |
| `precioPorPorcion` | opcional en la API (default 1) pero ponlo siempre; la BD exige > 0 |
| `porciones` | **siempre 2.** Es la base desde la que la app escala (`BASE_COMENSALES` en `DetalleReceta`). Ajusta las cantidades de los ingredientes a 2 raciones, no las porciones al plato |
| `tipo` | opcional, default `principal`; uno de: `principal`, `postre`, `desayuno`, `entrante` |
| `categoria` | opcional pero ponla siempre: minúsculas, sin acentos ("espanola", no "española") |
| `guarniciones` | array de **nombres del catálogo** (`server/src/data/guarniciones.json`), máximo 3, sin repetir. La primera es la recomendada: la que el planificador enciende solo. Un nombre que no esté en el catálogo es un 400. Ver abajo |
| `favorita`, `imagen` | opcionales; normalmente se omiten al crear |

⚠️ **`PUT /recetas/:id` reemplaza el recurso entero.** Los campos que omitas se pierden: `consejos` omitido se guarda como `[]`, `guarniciones` omitido deja la receta sin ninguna, y `calorias`/`proteinas`/etc. omitidos se guardan como `null`. En modo revisión, envía siempre la receta completa, no un parche.

## Categorías (cocinas) ya en uso

Reutiliza antes de inventar: africana, china, coreana, cubana, desayuno, espanola, fusion, griega, holandesa, indonesia, italiana, japonesa, latina, legumbres, mediooriente, mediterranea, mexicana, peruana, rapida, senegalesa, tailandesa, turca.

## Ingredientes: familias y unidades

**Familias válidas (las 15 de `src/utils/despensa.ts`, que es la fuente):** verduras, frutas, carnes, pescados, **lácteos** (con acento), huevos, cereales, legumbres, frutos secos, conservas, especias, condimentos, salsas, bebidas, otros.

Criterio de reparto tal como se usa hoy en la BD: especias, hierbas, sal y pimienta → `especias`; aceites, vinagres, azúcar y caldo → `condimentos`; soja, mirin, leche de coco, cremas de untar → `salsas`; pan, pasta y arroz → `cereales`. No uses `otros` salvo que no encaje en ninguna.

**Unidades canónicas** (de `src/utils/ingredientes.ts`): `g`, `ml`, `ud`, `cucharada`, `cucharadita`, `diente`, `hoja`, `loncha`, `rodaja`, `rebanada`, `puñado`, `pizca`, `gota`, `tira`, `lata`, `paquete`, `vaso`. Usa siempre la forma singular y sin abreviar ("cucharada", no "cda"; "g", no "gr").

**El arroz va siempre en `vaso`**, no en gramos: vaso de cristal medio de cualquier casa, ~200 ml, ~180 g de arroz crudo (0,36 € a 2 €/kg). El agua de cocción se mide con el mismo vaso, así la proporción aguanta al escalar comensales. Detalle en `tecnica.md`.

**La verdura que se compra por piezas va en `ud`**, no en gramos: cebolla, cebolla roja, cebolleta, pimiento, zanahoria, calabacín, berenjena, puerro, aguacate, tomate. En la cocina se cuentan, no se pesan, y la despensa ya las guarda así. Usa fracciones cuando toque (`0.25`, `0.5`, `0.75`), que la app las pinta como ¼, ½ y ¾. Equivalencia de referencia para la cebolla: 150 g = 1 ud. La excepción es la verdura que de verdad se compra a peso (cebollitas perla, champiñones, judías verdes).

**Nombres de ingrediente:** minúsculas, sin marca, específicos ("pechuga de pollo", no "pollo" si importa el corte). Antes de nombrar uno, mira cómo se llama ya en la BD y reutiliza ese nombre exacto — la lista de la compra agrupa por nombre normalizado y cada variante crea una línea duplicada.

**Sal y pimienta:** `{ "nombre": "sal", "cantidad": 1, "unidad": "pizca", "familia": "especias" }` — la app las muestra como "al gusto".

## Checklist de validación antes de proponer o insertar

Recórrelo entero. Cualquier "no" bloquea la entrega.

**Contrato**
1. `sabor` del enum, `tipo` del enum, `categoria` en minúsculas y sin acentos.
2. Cada ingrediente con `familia` de las 15 y `unidad` canónica, `cantidad` numérica > 0.
3. `precioPorPorcion` > 0, dentro del rango 0,80-4,50 €/ración o justificado.
4. `consejos` presente, entre 2 y 5 líneas.

**Coherencia**
5. Todo ingrediente de la lista aparece en algún paso. *(Fallo real en la BD actual.)*
6. Todo ingrediente nombrado en un paso está en la lista, con cantidad. *(El script solo comprueba la dirección contraria: esta la miras tú.)*
7. Los macros por ración cuadran con las cantidades de la lista divididas entre `porciones`, calculados con `nutrientes.json`. Nunca al revés: el número sale de los ingredientes, no los ingredientes del número.
7b. Todo ingrediente tiene ficha completa en `nutrientes.json`: macros, micros, `hemo` si es carne o pescado, y `glu` + `sust` si lleva gluten. No mandes `hierro`, `sinGluten` ni `micros` en el JSON: se ignoran, los calcula el sistema (`nutricion-ficha.md`).
8. `tiempoPreparacion` es el reloj real de un novato, sin contar reposos ni marinados.

**Calidad (`tecnica.md`)**
9. Paso 1 es mise en place.
10. Cada acción con tiempo tiene duración parseable; cada cocción incierta tiene señal de punto.
11. Fuego, recipiente y cantidad explícitos donde cambian el resultado.
12. Ningún término técnico sin traducir en el propio paso.
13. Último paso de plato salado: probar y ajustar.

**Fidelidad (`canon-recetas.md`)**
14. El plato tiene procedencia declarada (nivel A, B o C) y todos sus no negociables están en los pasos.
15. Toda desviación (precio, tiempo, disponibilidad NL) está declarada en `consejos` con lo que se pierde.
16. Ningún ingrediente T3/T4 sin su sustituto T1/T2 en `consejos` (`compra-nl.md`).

**Perfil (`criterio-chef.md`)**
17. Si es para Karim: sin pescado y no india. La proteína llega al suelo de su hueco (20 g en principales, 15 en desayunos) y se ha subido todo lo que daba el plato. Si no alcanza el objetivo (35/25 con carne o pescado, 25/18 sin ellos), no se ha tocado ningún ratio del canon para forzarlo: el número va como sale y la palanca, declarada en `consejos`.
18. Es una comida completa **de verdad**: el plato lleva verdura propia, o alguna de sus guarniciones aporta verdura. Rellenar el campo con un almidón no cuenta. Las guarniciones no se declaran en `consejos` ni entran en los macros del plato: van por nombre del catálogo y el servidor les calcula la ficha aparte.
18b. Hay más de una opción siempre que la cocina lo permita, ninguna repite el almidón del plato y todas son de su cocina.
19. Los `consejos` no hablan de versiones anteriores ni comparan con el resto del recetario.
20. No duplica una receta existente (dedup por lista completa de nombres).

## Guarniciones

Las guarniciones **no se escriben dentro de la receta**: viven en un catálogo
propio (`server/src/data/guarniciones.json`, tabla `guarniciones`) y la receta
las referencia por nombre. Antes se copiaban: había 386 objetos para 83 nombres
y seis versiones distintas del arroz blanco, unas en vaso y otras en gramos,
unas de 12 min y otras de 15. Ahora el arroz se arregla una vez.

```json
"guarniciones": ["Kachumber", "Arroz blanco", "Coliflor al horno con comino"]
```

Reglas:

- **Máximo 3, sin repetir.** La primera es la recomendada: la que la auto-semana
  enciende y la que cuenta en `aporteDe` cuando no se ha elegido otra.
- **Da más de una siempre que la cocina lo permita.** Una sola opción levanta
  aviso. El catálogo garantiza al menos cuatro compatibles por cocina.
- **El plato tiene que acabar con verdura.** Si `ingredientes` no trae ninguna
  (sin contar bases aromáticas ni almidones), alguna opción debe aportar
  `verdura`. Es ERROR, y no lo salva rellenar el campo con un arroz.
- **Nada de almidón sobre almidón.** Si el plato ya trae arroz, pasta, pan,
  patata, bulgur o cuscús, sus opciones no ponen otro.
- **La cocina manda.** El catálogo declara en qué cocinas es de la casa cada
  guarnición, por familia (`asia-este`, `mediooriente`…) o por cocina suelta. Un
  pan de pita en un plato georgiano levanta aviso: allí el pan es otro.
- **Sin gluten:** si el plato lo es, alguna opción tiene que serlo, o el filtro
  del catálogo enseña una receta limpia con pan encendido por defecto.
- Las cantidades del catálogo son **para 2 raciones**, igual que las recetas.
- Los macros, el hierro, el gluten y el `apto` de cada guarnición **los calcula
  el servidor** al volcar el catálogo. No los escribas.

### Añadir una guarnición al catálogo

Se edita `server/src/data/guarniciones.json` (`nombre`, `aporta`, `cocinas`,
`ingredientes`, `pasos`) y se pasa su propia puerta:

```bash
node scripts/chef-recetas.mjs guarniciones
```

Luego `node scripts/guarniciones.mjs catalogo` la vuelca a la base. Sus pasos
tienen las mismas exigencias que los de una receta: duración o señal de punto en
cada cocción, cantidades entre llaves para que escalen, y **todo lo que el paso
use tiene que estar en la lista de ingredientes** — el aceite y el vinagre de un
aliño incluidos, que si no ni se compran ni cuentan en los macros.
