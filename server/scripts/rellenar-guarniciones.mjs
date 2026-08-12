import sql from '../src/lib/db.js'
import { fichaNutricional, estimarMacros } from '../src/lib/nutricion.js'

const APLICAR = process.argv.includes('--aplicar')
const FORZAR = process.argv.includes('--forzar')

const v = (nombre, cantidad, unidad = 'g', familia = 'verduras') => ({ nombre, cantidad, unidad, familia })

const ARROZ = { nombre: 'Arroz blanco', ingredientes: [v('arroz', 160, 'g', 'cereales')], pasos: ['Cocer 12 min en agua con sal y escurrir.'] }
const BROCOLI = { nombre: 'Brócoli al vapor', ingredientes: [v('brócoli', 300)], pasos: ['Cocer al vapor 4-5 min, hasta que ceda al pinchar pero siga verde.'] }
const ESPINACAS = { nombre: 'Espinacas salteadas', ingredientes: [v('espinacas', 200), v('ajo', 1, 'diente')], pasos: ['Saltear el ajo laminado 30 s y añadir la espinaca hasta que rompa, 2 min.'] }
const PAKCHOI = { nombre: 'Pak choi salteado', ingredientes: [v('pak choi', 200), v('ajo', 1, 'diente')], pasos: ['Partir a lo largo y saltear 3 min con el ajo, hasta que el tallo ceda.'] }
const ENSALADA_VERDE = { nombre: 'Ensalada verde', ingredientes: [v('lechuga', 100), v('tomate', 1, 'ud')], pasos: ['Aliñar con aceite, vinagre y sal justo antes de servir.'] }
const ENSALADA_TOMATE = { nombre: 'Ensalada de tomate y cebolla', ingredientes: [v('tomate', 2, 'ud'), v('cebolla roja', 0.5, 'ud')], pasos: ['Cortar fino, aliñar con aceite, vinagre y sal y dejar 5 min.'] }
const PEPINO_VINAGRE = { nombre: 'Pepino en vinagre', ingredientes: [v('pepino', 1, 'ud')], pasos: ['Cortar en rodajas finas y macerar 15 min con vinagre de arroz, sal y una pizca de azúcar.'] }
const AGUACATE = { nombre: 'Aguacate en gajos', ingredientes: [v('aguacate', 1, 'ud', 'frutas')], pasos: ['Cortar en gajos y aliñar con lima y sal.'] }
const PITA = { nombre: 'Pan de pita', ingredientes: [v('pan de pita', 2, 'ud', 'cereales')], pasos: ['Tostar 1-2 min por lado, hasta que infle.'] }

const SACAR_PAN = [
  'Souvlaki de pollo',
  'Souvlaki de cerdo con tzatziki',
  'Pinchos morunos de cerdo',
  'Kefta con huevo en salsa de tomate',
  'Ćevapi con ajvar y cebolla',
]

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

const COBAN = { nombre: 'Ensalada çoban', ingredientes: [v('tomate', 2, 'ud'), v('pepino', 1, 'ud'), v('cebolla', 0.5, 'ud')], pasos: ['Cortar todo en dados de 1 cm y aliñar con limón, aceite y sal.'] }
const REPOLLO_LIMA = { nombre: 'Repollo con lima', ingredientes: [v('repollo', 200), v('lima', 1, 'ud', 'frutas')], pasos: ['Cortar en juliana muy fina y aliñar con el zumo de lima y sal 10 min antes de servir.'] }
const PATATA = { nombre: 'Patata cocida', ingredientes: [v('patata', 400)], pasos: ['Cocer en agua con sal 20 min desde el hervor, hasta que el cuchillo entre sin resistencia.'] }
const JUDIAS = { nombre: 'Judías verdes hervidas', ingredientes: [v('judías verdes', 300)], pasos: ['Hervir 6 min en agua con sal y escurrir; deben quedar verdes y con algo de mordida.'] }
const PAN_MOJAR = { nombre: 'Pan para mojar', ingredientes: [v('pan', 150, 'g', 'cereales')], pasos: ['Cortar en rebanadas gruesas y tostar ligeramente.'] }
const ESPARRAGOS = { nombre: 'Espárragos al vapor', ingredientes: [v('espárragos', 250)], pasos: ['Cocer al vapor 5 min, hasta que el tallo ceda pero la punta siga firme.'] }
const LECHUGA_ENVOLVER = { nombre: 'Hojas de lechuga para envolver', ingredientes: [v('lechuga', 150)], pasos: ['Separar las hojas enteras, lavar y secar bien para que no aguen el relleno.'] }
const PIMIENTOS_ASADOS = { nombre: 'Pimientos asados', ingredientes: [v('pimiento rojo', 2, 'ud')], pasos: ['Asar a 220°C 25 min girando a mitad, tapar 10 min para que sude, pelar y aliñar con aceite y sal.'] }
const POKE_TOPPING = { nombre: 'Pepino y aguacate', ingredientes: [v('pepino', 1, 'ud'), v('aguacate', 1, 'ud', 'frutas')], pasos: ['Cortar el pepino en medias lunas y el aguacate en dados, y repartir por encima al servir.'] }

Object.assign(GUARNICIONES, {
  'Arroz caldoso de bacalao y garbanzos': PIMIENTOS_ASADOS,
  'Baleadas de huevo, frijoles y queso': REPOLLO_LIMA,
  "Bucatini all'amatriciana": ENSALADA_VERDE,
  'Bulgogi': ARROZ,
  'Burrito de carne picada y alubias': REPOLLO_LIMA,
  'Cacio e pepe': { nombre: 'Quark al lado', ingredientes: [v('quark', 300, 'g', 'lácteos')], pasos: ['Servir frío en un cuenco aparte, con pimienta negra recién molida.'] },
  'Carbonara': ENSALADA_VERDE,
  'Carnitas de cerdo con tortillas': REPOLLO_LIMA,
  'Chilaquiles rojos con pollo y huevo': AGUACATE,
  'Enchiladas de pollo': AGUACATE,
  'Fabada rápida con lomo y chorizo': { nombre: 'Ensalada de lechuga y cebolla', ingredientes: [v('lechuga', 100), v('cebolla', 0.5, 'ud')], pasos: ['Cortar fino y aliñar con mucho vinagre, aceite y sal.'] },
  'Falafel al horno con salsa de yogur': COBAN,
  'Gambas al ajillo con huevo': PAN_MOJAR,
  'Gyudon': PEPINO_VINAGRE,
  'Hachee (estofado holandés de ternera)': PATATA,
  'Huevos al horno con garbanzos, tomate y feta': PITA,
  'Jeyuk bokkeum (cerdo picante coreano)': LECHUGA_ENVOLVER,
  'Karaage de pollo': ARROZ,
  'Köfte turco': COBAN,
  'Larb de pollo': LECHUGA_ENVOLVER,
  'Loco moco': REPOLLO_LIMA,
  'Mapo tofu': ARROZ,
  'Pastitsio': JUDIAS,
  'Poke bowl de atún': POKE_TOPPING,
  'Pollo a la mostaza con arroz': BROCOLI,
  'Pollo a la parmesana': ENSALADA_VERDE,
  'Pollo al ajillo con arroz': PIMIENTOS_ASADOS,
  'Pollo al pesto con pasta fresca': ENSALADA_VERDE,
  'Pollo alla cacciatora': PIMIENTOS_ASADOS,
  'Pollo desmechado con arroz': ENSALADA_TOMATE,
  'Pollo en pepitoria': JUDIAS,
  'Pollo piccata': ESPARRAGOS,
  'Pollo teriyaki': BROCOLI,
  'Pollo tikka masala': ARROZ,
  'Pollo turco especiado': COBAN,
  'Quesadillas de pollo y alubias rojas': REPOLLO_LIMA,
  'Revuelto de gambas y huevo': ENSALADA_VERDE,
  'Salmón glaseado con miel y soja': ARROZ,
  'Tofu teriyaki': BROCOLI,
  'Tortilla de atún': ENSALADA_VERDE,
  'Yakitori de pollo': ARROZ,
  'Yangnyeom chikin (pollo frito coreano)': PEPINO_VINAGRE,
  'Youvetsi de ternera con orzo': JUDIAS,
  'Seco de ternera con frejoles': ARROZ,
  'Tavuk şiş (brochetas turcas de pollo)': COBAN,
  'Mujadara con pollo y yogur': { nombre: 'Yogur al lado', ingredientes: [v('yogur griego', 200, 'g', 'lácteos')], pasos: ['Servir frío en un cuenco aparte, con una pizca de sal.'] },
})

Object.assign(GUARNICIONES, {
  'Curry de pollo y brócoli con leche de coco': ARROZ,
  'Gratén de pollo y brócoli': PATATA,
  'Pollo satay': ARROZ,
  'Yakisoba de cerdo y col': { nombre: 'Huevo frito', ingredientes: [v('huevos', 2, 'ud', 'huevos')], pasos: ['Freír en aceite bien caliente hasta que el borde quede crujiente y la yema líquida.'] },
})

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
