import sql from '../src/lib/db.js'
import { fichaNutricional, estimarMacros, norm } from '../src/lib/nutricion.js'

const APLICAR = process.argv.includes('--aplicar')
const SOLO = process.argv.find((a) => a.startsWith('--solo='))?.slice(7)

const v = (nombre, cantidad, unidad = 'g', familia = 'verduras') => ({ nombre, cantidad, unidad, familia })

const G = {
  aguacateCherry: {
    nombre: 'Aguacate y tomate cherry',
    ingredientes: [v('aguacate', 1, 'ud', 'frutas'), v('tomate cherry', 200)],
    pasos: ['Partir los cherry por la mitad y el aguacate en gajos, y aliñar con aceite, sal y unas gotas de lima al servir.'],
  },
  aguacateLechuga: {
    nombre: 'Aguacate y lechuga aliñados',
    ingredientes: [v('aguacate', 1, 'ud', 'frutas'), v('lechuga', 100), v('lima', 0.5, 'ud', 'frutas')],
    pasos: ['Cortar la lechuga en juliana ancha y el aguacate en gajos, y aliñar con el zumo de lima, aceite y sal al servir.'],
  },
  ensaladaVerde: {
    nombre: 'Ensalada verde',
    ingredientes: [v('lechuga', 100), v('tomate', 1, 'ud')],
    pasos: ['Aliñar con aceite, vinagre y sal justo antes de servir.'],
  },
  ensaladaTomate: {
    nombre: 'Ensalada de tomate y cebolla',
    ingredientes: [v('tomate', 2, 'ud'), v('cebolla roja', 0.5, 'ud')],
    pasos: ['Cortar fino, aliñar con aceite, vinagre y sal y dejar 5 min para que el tomate suelte jugo.'],
  },
  coban: {
    nombre: 'Ensalada çoban',
    ingredientes: [v('tomate', 2, 'ud'), v('pepino', 1, 'ud'), v('cebolla', 0.5, 'ud'), v('perejil', 1, 'puñado')],
    pasos: ['Cortar todo en dados de 1 cm y aliñar con limón, aceite y sal.'],
  },
  espinacasAjo: {
    nombre: 'Espinacas salteadas',
    ingredientes: [v('espinacas', 200), v('ajo', 1, 'diente')],
    pasos: ['Saltear el ajo laminado 30 s y añadir la espinaca hasta que rompa, 2 min.'],
  },
  espinacasLimon: {
    nombre: 'Espinacas al limón (horta)',
    ingredientes: [v('espinacas', 250), v('limón', 0.5, 'ud', 'frutas')],
    pasos: ['Hervir 3 min, escurrir apretando y aliñar en caliente con aceite, limón y sal.'],
  },
  espinacasSesamo: {
    nombre: 'Espinacas al sésamo',
    ingredientes: [v('espinacas', 200), v('sésamo', 1, 'cucharada', 'condimentos')],
    pasos: ['Escaldar 1 min, escurrir apretando bien y aliñar con sésamo tostado, soja y una gota de aceite de sésamo.'],
  },
  brocoli: {
    nombre: 'Brócoli al vapor',
    ingredientes: [v('brócoli', 300)],
    pasos: ['Cocer al vapor 4-5 min, hasta que ceda al pinchar pero siga verde.'],
  },
  brocoliAjo: {
    nombre: 'Brócoli salteado con ajo',
    ingredientes: [v('brócoli', 300), v('ajo', 2, 'diente')],
    pasos: ['Escaldar 2 min, escurrir y saltear a fuego fuerte 2 min con el ajo laminado, hasta que los bordes se doren.'],
  },
  judias: {
    nombre: 'Judías verdes hervidas',
    ingredientes: [v('judías verdes', 300)],
    pasos: ['Hervir 6 min en agua con sal y escurrir; deben quedar verdes y con algo de mordida.'],
  },
  esparragos: {
    nombre: 'Espárragos al vapor',
    ingredientes: [v('espárragos', 250)],
    pasos: ['Cocer al vapor 5 min, hasta que el tallo ceda pero la punta siga firme.'],
  },
  pimientosAsados: {
    nombre: 'Pimientos asados',
    ingredientes: [v('pimiento rojo', 2, 'ud')],
    pasos: ['Asar a 220°C 25 min girando a mitad, tapar 10 min para que suden, pelar y aliñar con aceite y sal.'],
  },
  calabacinPlancha: {
    nombre: 'Calabacín a la plancha',
    ingredientes: [v('calabacín', 2, 'ud')],
    pasos: ['Cortar en rodajas de 1 cm y hacer a la plancha 3 min por lado, hasta que queden marcadas y blandas por dentro.'],
  },
  berenjenaAsada: {
    nombre: 'Berenjena asada',
    ingredientes: [v('berenjena', 1, 'ud'), v('perejil', 1, 'puñado')],
    pasos: ['Partir a lo largo, marcar la carne en rombos y asar a 200°C 30 min, hasta que se hunda al apretar. Aliñar con aceite, limón y perejil.'],
  },
  pepinoVinagre: {
    nombre: 'Pepino en vinagre (sunomono)',
    ingredientes: [v('pepino', 1, 'ud')],
    pasos: ['Cortar en rodajas finas y macerar 15 min con vinagre de arroz, sal y una pizca de azúcar.'],
  },
  pakchoi: {
    nombre: 'Pak choi salteado',
    ingredientes: [v('pak choi', 300), v('ajo', 1, 'diente')],
    pasos: ['Partir a lo largo y saltear 3 min con el ajo, hasta que el tallo ceda pero siga crujiente.'],
  },
  edamame: {
    nombre: 'Edamame con sal',
    ingredientes: [v('edamame', 200, 'g', 'legumbres')],
    pasos: ['Hervir 4 min en agua con sal, escurrir y salar por fuera de la vaina.'],
  },
  namulZanahoria: {
    nombre: 'Namul de zanahoria y espinaca',
    ingredientes: [v('zanahoria', 2, 'ud'), v('espinacas', 150), v('sésamo', 1, 'cucharada', 'condimentos')],
    pasos: ['Saltear la zanahoria en juliana 3 min, escaldar la espinaca 1 min y escurrirla apretando, y aliñar cada una con sésamo, ajo y una gota de aceite de sésamo.'],
  },
  lechugaEnvolver: {
    nombre: 'Hojas de lechuga para envolver',
    ingredientes: [v('lechuga', 150)],
    pasos: ['Separar las hojas enteras, lavar y secar bien para que no aguen el relleno.'],
  },
  slawLima: {
    nombre: 'Repollo con lima y cilantro',
    ingredientes: [v('repollo', 200), v('zanahoria', 1, 'ud'), v('lima', 1, 'ud', 'frutas'), v('cilantro', 1, 'puñado')],
    pasos: ['Cortar el repollo en juliana muy fina, rallar la zanahoria y aliñar con el zumo de lima y sal 10 min antes de servir.'],
  },
  acar: {
    nombre: 'Acar de pepino y zanahoria',
    ingredientes: [v('pepino', 1, 'ud'), v('zanahoria', 1, 'ud')],
    pasos: ['Cortar en bastones, macerar 20 min con vinagre, sal y una pizca de azúcar y escurrir antes de servir.'],
  },
  pepinoEneldo: {
    nombre: 'Ensalada de pepino al eneldo',
    ingredientes: [v('pepino', 1, 'ud'), v('eneldo', 1, 'puñado', 'especias')],
    pasos: ['Cortar en rodajas finas, salar 10 min para que suelte agua, escurrir y aliñar con eneldo, vinagre y una cucharada de yogur.'],
  },
  remolacha: {
    nombre: 'Remolacha aliñada',
    ingredientes: [v('remolacha', 300), v('cebolla roja', 0.5, 'ud')],
    pasos: ['Cocer 40 min hasta que el cuchillo entre sin fuerza, pelar en caliente, cortar en dados y aliñar con vinagre, aceite y sal.'],
  },
  zanahoriaRallada: {
    nombre: 'Zanahoria rallada al limón',
    ingredientes: [v('zanahoria', 3, 'ud'), v('limón', 0.5, 'ud', 'frutas'), v('perejil', 1, 'puñado')],
    pasos: ['Rallar grueso y aliñar con limón, aceite y sal 10 min antes de servir para que ablande.'],
  },
  coliflorHorno: {
    nombre: 'Coliflor al horno',
    ingredientes: [v('coliflor', 400), v('comino', 1, 'cucharadita', 'especias')],
    pasos: ['Cortar en ramilletes, aliñar con aceite, comino y sal y asar a 220°C 25 min, hasta que los bordes se tuesten.'],
  },
  guisantesPuerro: {
    nombre: 'Guisantes con puerro',
    ingredientes: [v('guisantes', 300, 'g', 'verduras'), v('puerro', 1, 'ud')],
    pasos: ['Pochar el puerro en aros 5 min, añadir los guisantes y 100 ml de agua y cocer 6 min tapado, hasta que estén tiernos.'],
  },
  ensaladaGriega: {
    nombre: 'Ensalada de pepino y tomate',
    ingredientes: [v('pepino', 1, 'ud'), v('tomate', 2, 'ud'), v('menta', 1, 'puñado', 'especias')],
    pasos: ['Cortar en dados gruesos y aliñar con aceite, limón, menta picada y sal.'],
  },
  tomateAlbahaca: {
    nombre: 'Tomate con albahaca',
    ingredientes: [v('tomate', 3, 'ud'), v('albahaca', 1, 'puñado', 'especias')],
    pasos: ['Cortar en rodajas gruesas, salar 5 min para que suelte jugo y aliñar con aceite y albahaca en hoja entera.'],
  },
  calabazaAsada: {
    nombre: 'Calabaza asada',
    ingredientes: [v('calabaza', 400)],
    pasos: ['Cortar en gajos de 2 cm y asar a 200°C 30 min, hasta que el borde caramelice y el centro esté blando.'],
  },
}

const POR_COCINA = {
  mexicana: ['aguacateCherry', 'slawLima', 'aguacateLechuga'],
  latina: ['aguacateCherry', 'slawLima', 'ensaladaTomate'],
  cubana: ['aguacateCherry', 'ensaladaVerde', 'slawLima'],
  chilena: ['aguacateCherry', 'ensaladaTomate'],
  colombiana: ['aguacateCherry', 'slawLima'],
  peruana: ['aguacateCherry', 'ensaladaTomate', 'aguacateLechuga'],
  brasilena: ['aguacateCherry', 'slawLima', 'ensaladaVerde'],
  argentina: ['ensaladaTomate', 'aguacateCherry', 'calabacinPlancha'],
  americana: ['aguacateCherry', 'slawLima', 'brocoli'],
  fusion: ['aguacateCherry', 'brocoliAjo', 'ensaladaVerde'],
  rapida: ['aguacateCherry', 'ensaladaVerde', 'brocoli', 'espinacasAjo'],
  internacional: ['aguacateCherry', 'ensaladaVerde', 'brocoli'],

  espanola: ['ensaladaTomate', 'pimientosAsados', 'judias', 'espinacasAjo', 'ensaladaVerde'],
  portuguesa: ['pimientosAsados', 'ensaladaTomate', 'judias'],
  italiana: ['tomateAlbahaca', 'calabacinPlancha', 'ensaladaVerde', 'espinacasAjo'],
  mediterranea: ['aguacateCherry', 'tomateAlbahaca', 'calabacinPlancha', 'espinacasAjo'],
  francesa: ['judias', 'esparragos', 'zanahoriaRallada'],
  griega: ['espinacasLimon', 'ensaladaGriega', 'judias'],
  balcanica: ['pimientosAsados', 'coban'],
  hungara: ['pimientosAsados', 'pepinoEneldo'],
  polaca: ['remolacha', 'pepinoEneldo'],
  rusa: ['remolacha', 'pepinoEneldo'],
  ucraniana: ['remolacha', 'pepinoEneldo'],
  alemana: ['pepinoEneldo', 'judias'],
  austriaca: ['pepinoEneldo', 'judias'],
  holandesa: ['guisantesPuerro', 'judias', 'coliflorHorno'],
  britanica: ['guisantesPuerro', 'coliflorHorno', 'brocoli'],

  turca: ['coban', 'berenjenaAsada'],
  griegaEntrante: ['ensaladaGriega'],
  libanesa: ['coban', 'berenjenaAsada'],
  palestina: ['coban', 'berenjenaAsada'],
  irani: ['coban', 'berenjenaAsada'],
  saudi: ['coban', 'coliflorHorno'],
  mediooriente: ['coban', 'berenjenaAsada', 'coliflorHorno'],
  judia: ['coban', 'coliflorHorno'],
  chipriota: ['ensaladaGriega', 'coban'],
  egipcia: ['coban', 'coliflorHorno'],
  marroqui: ['zanahoriaRallada', 'coban', 'calabazaAsada'],
  argelina: ['zanahoriaRallada', 'coban'],
  tunecina: ['coban', 'pimientosAsados'],
  africana: ['slawLima', 'calabazaAsada', 'coban'],
  senegalesa: ['slawLima', 'calabazaAsada'],
  sudafricana: ['slawLima', 'calabazaAsada'],

  japonesa: ['pepinoVinagre', 'espinacasSesamo', 'edamame', 'brocoliAjo'],
  okinawense: ['espinacasSesamo', 'pakchoi'],
  china: ['pakchoi', 'brocoliAjo', 'pepinoVinagre'],
  coreana: ['namulZanahoria', 'lechugaEnvolver', 'pepinoVinagre', 'espinacasSesamo'],
  vietnamita: ['acar', 'lechugaEnvolver', 'pakchoi'],
  tailandesa: ['acar', 'slawLima', 'pakchoi'],
  indonesia: ['acar', 'pakchoi', 'slawLima'],
  malasia: ['acar', 'pakchoi'],
  singapurense: ['pakchoi', 'acar'],
  filipina: ['acar', 'pakchoi'],
  india: ['coban', 'coliflorHorno', 'espinacasAjo'],

  legumbres: ['ensaladaVerde', 'espinacasAjo', 'ensaladaTomate'],
}

const GENERICAS = ['ensaladaVerde', 'brocoli', 'espinacasAjo', 'ensaladaTomate', 'judias', 'calabacinPlancha', 'zanahoriaRallada']

const FIJAS = {
  'Tinga de pollo con arroz': {
    guarnicion: 'aguacateLechuga',
    consejo: {
      de: /^Sirve con aguacate/,
      a: 'Doblar la receta sale a cuenta: la tinga mejora al día siguiente, cuando la hebra ha terminado de beberse la salsa.',
    },
  },
  'Huevos al horno con garbanzos, tomate y feta': {
    guarnicion: {
      nombre: 'Espinacas salteadas y pan de pita',
      ingredientes: [v('espinacas', 200), v('ajo', 1, 'diente'), v('pan de pita', 2, 'ud', 'cereales')],
      pasos: [
        'Saltear el ajo laminado 30 s y añadir la espinaca hasta que rompa, 2 min.',
        'Tostar el pan de pita 1-2 min por lado, hasta que infle.',
      ],
    },
    consejo: {
      de: /^Añade 200 g de espinacas/,
      a: 'El molde manda: en uno ancho la salsa queda fina y los huevos se hacen antes de que cuaje. Usa una fuente de 20-22 cm para que la capa quede de dos dedos.',
    },
  },
}

const red1 = (n) => Math.round(n * 10) / 10

function conFicha(guarnicion, porciones) {
  const entrada = { ingredientes: guarnicion.ingredientes, porciones }
  const macros = estimarMacros(entrada)
  const ficha = fichaNutricional(entrada)
  return {
    nombre: guarnicion.nombre,
    ingredientes: guarnicion.ingredientes,
    pasos: guarnicion.pasos,
    calorias: Math.round(macros.calorias),
    proteinas: red1(macros.proteinas),
    carbohidratos: red1(macros.carbohidratos),
    grasas: red1(macros.grasas),
    hierro: ficha.hierro,
    sinGluten: ficha.sinGluten,
    micros: ficha.micros,
  }
}

const PROCESADO = /triturado|frito|concentrado|seco|en conserva|pelado|cherry en/

function choca(guarnicion, receta) {
  const cabeza = norm(guarnicion.ingredientes[0].nombre)
  return receta.ingredientes.some((i) => {
    const d = norm(i.nombre)
    if (PROCESADO.test(d)) return false
    return d === cabeza || new RegExp(`(^| )${cabeza}( |$)`).test(d)
  })
}

function hash(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function elegir(receta) {
  const propias = (POR_COCINA[receta.categoria] ?? []).filter((k) => !choca(G[k], receta))
  const lista = propias.length ? propias : GENERICAS.filter((k) => !choca(G[k], receta))
  if (lista.length === 0) return null
  const urna = lista.flatMap((k, i) => Array(Math.max(1, 3 - i)).fill(k))
  return G[urna[hash(receta.id) % urna.length]]
}

const filas = await sql`
  SELECT id, nombre, categoria, tipo, porciones, ingredientes, consejos, guarnicion
  FROM recetas
  WHERE borrada_en IS NULL AND (tipo = 'principal' OR nombre = ANY(${Object.keys(FIJAS)}))
  ORDER BY nombre
`

let puestas = 0
let corregidas = 0
const saltadas = []
const reparto = new Map()

for (const receta of filas) {
  if (SOLO && receta.nombre !== SOLO) continue
  const fija = FIJAS[receta.nombre]
  if (!fija && receta.guarnicion) continue

  const base = fija
    ? (typeof fija.guarnicion === 'string' ? G[fija.guarnicion] : fija.guarnicion)
    : elegir(receta)

  if (!base) {
    saltadas.push(`${receta.nombre} (${receta.categoria})`)
    continue
  }

  const guarnicion = conFicha(base, receta.porciones || 2)

  const consejos = fija?.consejo
    ? receta.consejos.map((c) => (fija.consejo.de.test(c) ? fija.consejo.a : c))
    : null

  reparto.set(guarnicion.nombre, (reparto.get(guarnicion.nombre) ?? 0) + 1)
  if (fija) corregidas++
  else puestas++

  console.log(`${fija ? '[fija] ' : ''}${receta.nombre} · ${receta.categoria} → ${guarnicion.nombre} (${guarnicion.calorias} kcal, fibra ${guarnicion.micros.fibra} g)`)

  if (APLICAR) {
    await sql`UPDATE recetas SET guarnicion = ${JSON.stringify(guarnicion)} WHERE id = ${receta.id}`
    if (consejos) await sql`UPDATE recetas SET consejos = ${JSON.stringify(consejos)} WHERE id = ${receta.id}`
  }
}

console.log(`\n--- ${APLICAR ? 'Aplicado' : 'Simulacro'} ---`)
console.log(`${puestas} guarniciones nuevas, ${corregidas} correcciones puntuales.`)
console.log('\nReparto:')
for (const [nombre, n] of [...reparto].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${nombre}`)
if (saltadas.length) console.log(`\nSin candidata (chocaban todas): ${saltadas.join(', ')}`)
