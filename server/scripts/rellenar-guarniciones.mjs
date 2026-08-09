// Rellena el campo `guarnicion` de las recetas que ya declaraban un
// acompañamiento en `consejos`, y saca a guarnición el pan de los platos donde
// el pan no es el plato ni ingrediente estructural.
//
// Toca SOLO las columnas que hacen falta, nunca por PUT: la API reemplaza el
// recurso entero y un fallo de un campo se llevaría por delante consejos y
// macros curados de 30 recetas. La ficha de la guarnición la calcula el mismo
// nutricion.js que usa el servidor, así que sale idéntica a la de un alta.
//
//   node --env-file=.env server/scripts/rellenar-guarniciones.mjs          (simulacro)
//   node --env-file=.env server/scripts/rellenar-guarniciones.mjs --aplicar
//
// Idempotente: salta las que ya tienen guarnición salvo --forzar.

import sql from '../src/lib/db.js'
import { fichaNutricional, estimarMacros } from '../src/lib/nutricion.js'

const APLICAR = process.argv.includes('--aplicar')
const FORZAR = process.argv.includes('--forzar')

const v = (nombre, cantidad, unidad = 'g', familia = 'verduras') => ({ nombre, cantidad, unidad, familia })

// Cantidades para 2 raciones, que es la base de todo el recetario. Los nombres
// son los que ya usa el catálogo, para que precio y nutrición resuelvan.
const ARROZ = { nombre: 'Arroz blanco', ingredientes: [v('arroz', 160, 'g', 'cereales')], pasos: ['Cocer 12 min en agua con sal y escurrir.'] }
const BROCOLI = { nombre: 'Brócoli al vapor', ingredientes: [v('brócoli', 300)], pasos: ['Cocer al vapor 4-5 min, hasta que ceda al pinchar pero siga verde.'] }
const ESPINACAS = { nombre: 'Espinacas salteadas', ingredientes: [v('espinacas', 200), v('ajo', 1, 'diente')], pasos: ['Saltear el ajo laminado 30 s y añadir la espinaca hasta que rompa, 2 min.'] }
const PAKCHOI = { nombre: 'Pak choi salteado', ingredientes: [v('pak choi', 200), v('ajo', 1, 'diente')], pasos: ['Partir a lo largo y saltear 3 min con el ajo, hasta que el tallo ceda.'] }
const ENSALADA_VERDE = { nombre: 'Ensalada verde', ingredientes: [v('lechuga', 100), v('tomate', 1, 'ud')], pasos: ['Aliñar con aceite, vinagre y sal justo antes de servir.'] }
const ENSALADA_TOMATE = { nombre: 'Ensalada de tomate y cebolla', ingredientes: [v('tomate', 2, 'ud'), v('cebolla roja', 0.5, 'ud')], pasos: ['Cortar fino, aliñar con aceite, vinagre y sal y dejar 5 min.'] }
const PEPINO_VINAGRE = { nombre: 'Pepino en vinagre', ingredientes: [v('pepino', 1, 'ud')], pasos: ['Cortar en rodajas finas y macerar 15 min con vinagre de arroz, sal y una pizca de azúcar.'] }
const AGUACATE = { nombre: 'Aguacate en gajos', ingredientes: [v('aguacate', 1, 'ud', 'frutas')], pasos: ['Cortar en gajos y aliñar con lima y sal.'] }
const PITA = { nombre: 'Pan de pita', ingredientes: [v('pan de pita', 2, 'ud', 'cereales')], pasos: ['Tostar 1-2 min por lado, hasta que infle.'] }

// —— Platos donde el pan es acompañamiento, no plato ni ligante ——
// Sale de `ingredientes`, así que el plato deja de constar como con gluten.
const SACAR_PAN = [
  'Souvlaki de pollo',
  'Souvlaki de cerdo con tzatziki',
  'Pinchos morunos de cerdo',
  'Kefta con huevo en salsa de tomate',
  'Ćevapi con ajvar y cebolla',
]

// —— Platos que ya declaraban el acompañamiento en consejos ——
// Cuando el consejo ofrecía alternativas se elige una, que el campo pide algo
// concreto y comprable.
const GUARNICIONES = {
  'Ají de gallina con arroz': { nombre: 'Lechuga aliñada al limón', ingredientes: [v('lechuga', 100), v('limón', 0.5, 'ud', 'frutas')], pasos: ['Aliñar con limón, aceite y sal.'] },
  'Albóndigas de ternera al curry de coco': BROCOLI,
  'Albóndigas en salsa de tomate con arroz': ENSALADA_TOMATE,
  'Arroz al horno con pollo y garbanzos': ENSALADA_VERDE,
  'Ayam goreng con sambal': ARROZ,
  'Ayam kecap (pollo indonesio en salsa dulce)': PEPINO_VINAGRE,
  'Char siu de cerdo': PAKCHOI,
  'Chili con carne rápido': ARROZ,
  'Garbanzos gratinados con atún y tomate': ESPINACAS,
  'Katsudon': PEPINO_VINAGRE,
  'Kimchi jjigae': ARROZ,
  'Macarrones con pollo y queso al horno': BROCOLI,
  'Oyakodon': PEPINO_VINAGRE,
  'Pasta al tonno proteica': ENSALADA_VERDE,
  'Pollo a la albahaca tailandés (pad krapow)': { nombre: 'Huevo frito', ingredientes: [v('huevos', 2, 'ud', 'huevos')], pasos: ['Freír en aceite bien caliente hasta que el borde quede crujiente y la yema líquida.'] },
  'Rendang de ternera': ARROZ,
  'Sundubu jjigae (estofado de tofu)': ARROZ,
  'Tacos de ternera': AGUACATE,
  'Tinga de pollo con arroz': AGUACATE,
  'Udon con bacalao glaseado al miso': ESPINACAS,
  'Udon con pollo al limón': BROCOLI,
  'Udon glaseado con pollo, sésamo y cebolleta': BROCOLI,
  'Udon kung pao con pollo y cacahuete': BROCOLI,
  'Udon tantan exprés de cerdo': PAKCHOI,
  'Yassa de pollo': ENSALADA_VERDE,
  'İskender kebab casero': ENSALADA_TOMATE,
}

for (const nombre of SACAR_PAN) GUARNICIONES[nombre] ??= PITA

const red1 = (n) => Math.round(n * 10) / 10

function conFicha(guarnicion, porciones) {
  const entrada = { ingredientes: guarnicion.ingredientes, porciones }
  const macros = estimarMacros(entrada)
  const ficha = fichaNutricional(entrada)
  return {
    ...guarnicion,
    calorias: Math.round(macros.calorias),
    proteinas: red1(macros.proteinas),
    carbohidratos: red1(macros.carbohidratos),
    grasas: red1(macros.grasas),
    hierro: ficha.hierro,
    sinGluten: ficha.sinGluten,
    micros: ficha.micros,
  }
}

const filas = await sql`
  SELECT id, nombre, porciones, ingredientes, guarnicion IS NOT NULL AS ya_tiene
  FROM recetas WHERE borrada_en IS NULL
`
const porNombre = new Map(filas.map((r) => [r.nombre, r]))

let hechas = 0, saltadas = 0
const noEncontradas = []

for (const [nombre, base] of Object.entries(GUARNICIONES)) {
  const receta = porNombre.get(nombre)
  if (!receta) { noEncontradas.push(nombre); continue }
  if (receta.ya_tiene && !FORZAR) { saltadas++; continue }

  const porciones = receta.porciones || 2
  const guarnicion = conFicha(base, porciones)

  // Si el pan era acompañamiento, sale del plato y su ficha se recalcula sin él.
  const sacaPan = SACAR_PAN.includes(nombre)
  const ingredientes = sacaPan
    ? receta.ingredientes.filter((i) => !/^pan de pita$/i.test(i.nombre))
    : receta.ingredientes

  const fichaPlato = fichaNutricional({ ingredientes, porciones })
  const macrosPlato = estimarMacros({ ingredientes, porciones })

  console.log(
    `${sacaPan ? '[pan→guarnición] ' : ''}${nombre}\n` +
    `   guarnición: ${guarnicion.nombre} · ${guarnicion.calorias} kcal` +
    (guarnicion.sinGluten === false ? ' · lleva gluten' : '') +
    (sacaPan ? `\n   plato: sinGluten ${fichaPlato.sinGluten}, ${Math.round(macrosPlato.calorias)} kcal (antes con el pan dentro)` : '')
  )

  if (APLICAR) {
    if (sacaPan) {
      await sql`
        UPDATE recetas SET
          ingredientes = ${JSON.stringify(ingredientes)},
          guarnicion   = ${JSON.stringify(guarnicion)},
          calorias     = ${Math.round(macrosPlato.calorias)},
          proteinas    = ${red1(macrosPlato.proteinas)},
          carbohidratos = ${red1(macrosPlato.carbohidratos)},
          grasas       = ${red1(macrosPlato.grasas)},
          hierro       = ${fichaPlato.hierro},
          sin_gluten   = ${fichaPlato.sinGluten},
          micros       = ${JSON.stringify(fichaPlato.micros)}
        WHERE id = ${receta.id}
      `
    } else {
      await sql`UPDATE recetas SET guarnicion = ${JSON.stringify(guarnicion)} WHERE id = ${receta.id}`
    }
  }
  hechas++
}

console.log(
  `\n${APLICAR ? 'Aplicado' : 'Simulacro'}: ${hechas} recetas, ${saltadas} ya tenían guarnición.` +
  (noEncontradas.length ? `\nNo encontradas: ${noEncontradas.join(', ')}` : '')
)
