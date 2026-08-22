import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const AQUI = dirname(fileURLToPath(import.meta.url))
export const TABLA = JSON.parse(readFileSync(resolve(AQUI, 'nutrientes.json'), 'utf8'))

export const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

const FICHAS = new Map(Object.entries(TABLA.ingredientes).map(([k, v]) => [norm(k), v]))
const SIN_FICHA_OK = new Set(TABLA.ignorar.map(norm))
const UNIDAD_NECESITA_FICHA = new Set(['ud', 'lata', 'paquete', 'loncha', 'rodaja', 'rebanada', 'tira', 'vaso'])

const MICROS = ['fib', 'az', 'sat', 'sal', 'fe', 'vc', 'ca', 'b12', 'fol']

const UNIDAD_CANON = {
  gr: 'g', grs: 'g', gramo: 'g', gramos: 'g',
  mililitro: 'ml', mililitros: 'ml',
  cda: 'cucharada', cdas: 'cucharada', cucharadas: 'cucharada',
  cdta: 'cucharadita', cdtas: 'cucharadita', cucharaditas: 'cucharadita',
  dientes: 'diente', hojas: 'hoja', lonchas: 'loncha', rodajas: 'rodaja',
  rebanadas: 'rebanada', unidad: 'ud', unidades: 'ud', uds: 'ud',
  punado: 'puñado', punados: 'puñado', pizcas: 'pizca', gotas: 'gota',
  tiras: 'tira', latas: 'lata', paquetes: 'paquete', vasos: 'vaso',
}

const ESCALA = { kg: 1000, l: 1000, cl: 10 }

export function unidadCanon(unidad) {
  const k = norm(unidad ?? '')
  return UNIDAD_CANON[k] ?? k
}

function gramos(ing, ficha) {
  const u = unidadCanon(ing.unidad)
  if (u === 'g' || u === 'ml') return ing.cantidad
  if (ESCALA[u]) return ing.cantidad * ESCALA[u]
  if (ficha && typeof ficha[u] === 'number') return ing.cantidad * ficha[u]
  if (UNIDAD_NECESITA_FICHA.has(u)) return null
  const base = TABLA.unidades[u]
  return typeof base === 'number' ? ing.cantidad * base : null
}

export function estimarMacros(r) {
  const desconocidos = []
  const sinFicha = []
  const fuentesGluten = []
  const fuentesAnimales = []
  let p = 0, c = 0, g = 0, feHemo = 0
  const m = Object.fromEntries(MICROS.map((k) => [k, 0]))

  for (const ing of r.ingredientes ?? []) {
    const n = norm(ing.nombre)
    if (SIN_FICHA_OK.has(n)) continue
    const ficha = FICHAS.get(n)
    if (!ficha) { desconocidos.push(ing.nombre); sinFicha.push(ing.nombre); continue }
    if (ficha.glu) fuentesGluten.push({ nombre: ing.nombre, certeza: ficha.glu, sustituto: ficha.sust ?? null })
    if (ficha.an) fuentesAnimales.push({ nombre: ing.nombre, origen: ficha.an, certeza: ficha.anDep ? 'depende' : 'si' })
    const gr = gramos(ing, ficha)
    if (gr === null) { desconocidos.push(`${ing.nombre} (${ing.unidad})`); continue }
    p += (gr * ficha.p) / 100
    c += (gr * ficha.c) / 100
    g += (gr * ficha.gr) / 100
    for (const k of MICROS) if (ficha[k]) m[k] += (gr * ficha[k]) / 100
    if (ficha.hemo && ficha.fe) feHemo += (gr * ficha.fe) / 100
  }
  const porciones = r.porciones > 0 ? r.porciones : 1
  const racion = (x) => x / porciones
  return {
    desconocidos,
    sinFicha,
    proteinas: racion(p),
    carbohidratos: racion(c),
    grasas: racion(g),
    calorias: racion(p * 4 + c * 4 + g * 9),
    fibra: racion(m.fib),
    azucares: racion(m.az),
    saturadas: racion(m.sat),
    sal: racion(m.sal),
    hierro: racion(m.fe),
    hierroHemo: racion(feHemo),
    vitaminaC: racion(m.vc),
    calcio: racion(m.ca),
    b12: racion(m.b12),
    folato: racion(m.fol),
    gluten: {
      hay: fuentesGluten.length > 0,
      fuentes: fuentesGluten,
      evitable: fuentesGluten.length > 0 && fuentesGluten.every((f) => f.sustituto),
      cierto: sinFicha.length === 0,
    },
    animal: {
      fuentes: fuentesAnimales,
      cierto: sinFicha.length === 0,
    },
  }
}

const NO_VEGETARIANO = new Set(['carne', 'pescado'])
const NO_VEGANO = new Set(['carne', 'pescado', 'lacteo', 'huevo', 'miel'])

function aptoPara(animal, prohibidos) {
  const relevantes = animal.fuentes.filter((f) => prohibidos.has(f.origen))
  if (relevantes.some((f) => f.certeza === 'si')) return false
  if (relevantes.length > 0) return null
  return animal.cierto ? true : null
}

const red = (x, d = 1) => Math.round(x * 10 ** d) / 10 ** d

export function fichaNutricional(r) {
  const e = estimarMacros(r)
  return {
    hierro: red(e.hierro),
    sinGluten: e.gluten.hay ? false : e.gluten.cierto ? true : null,
    apto: {
      vegetariana: aptoPara(e.animal, NO_VEGETARIANO),
      vegana: aptoPara(e.animal, NO_VEGANO),
      animal: e.animal.fuentes,
    },
    micros: {
      fibra: red(e.fibra),
      azucares: red(e.azucares),
      saturadas: red(e.saturadas),
      sal: red(e.sal, 2),
      hierroHemo: red(e.hierroHemo),
      vitaminaC: Math.round(e.vitaminaC),
      calcio: Math.round(e.calcio),
      b12: red(e.b12),
      folato: Math.round(e.folato),
      gluten: e.gluten.hay ? { fuentes: e.gluten.fuentes, evitable: e.gluten.evitable } : null,
      estimadoDe: e.desconocidos.length ? 'parcial' : 'completo',
    },
  }
}
