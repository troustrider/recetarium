// Estimación de la ficha nutricional de una receta desde su lista de ingredientes.
//
// Vive en src/lib y no en scripts/ porque lo usan los dos lados: el validador del chef
// (scripts/chef-recetas.mjs) para contrastar lo declarado, y el servicio de recetas para
// calcular hierro, gluten y micros en cada alta y edición. Nada aquí toca la BD.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const AQUI = dirname(fileURLToPath(import.meta.url))
export const TABLA = JSON.parse(readFileSync(resolve(AQUI, 'nutrientes.json'), 'utf8'))

export const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

const FICHAS = new Map(Object.entries(TABLA.ingredientes).map(([k, v]) => [norm(k), v]))
const SIN_FICHA_OK = new Set(TABLA.ignorar.map(norm))
// Unidades cuyo peso depende tanto del producto que sin override no se puede estimar.
const UNIDAD_NECESITA_FICHA = new Set(['ud', 'lata', 'paquete', 'loncha', 'rodaja', 'rebanada', 'tira', 'vaso'])

// Micronutrientes: se suman igual que los macros, (gramos * valor / 100) / porciones.
const MICROS = ['fib', 'az', 'sat', 'sal', 'fe', 'vc', 'ca', 'b12', 'fol']

/** Gramos de producto que aporta un ingrediente, o null si no se puede saber. */
function gramos(ing, ficha) {
  const u = ing.unidad
  if (u === 'g' || u === 'ml') return ing.cantidad
  if (ficha && typeof ficha[u] === 'number') return ing.cantidad * ficha[u]
  if (UNIDAD_NECESITA_FICHA.has(u)) return null
  const base = TABLA.unidades[u]
  return typeof base === 'number' ? ing.cantidad * base : null
}

/**
 * Macros y micros por ración estimados desde `ingredientes`.
 * `desconocidos` lista lo que no se ha podido valorar: si trae algo, el resultado no es
 * comparable y el gate se abstiene en vez de acusar en falso.
 * El gluten no depende de la cantidad, así que se detecta aunque la unidad no se pueda
 * convertir a gramos; lo que sí lo invalida es un ingrediente sin ficha (`sinFicha`),
 * porque de ese no sabemos si lleva trigo.
 */
export function estimarMacros(r) {
  const desconocidos = []
  const sinFicha = []
  const fuentesGluten = []
  let p = 0, c = 0, g = 0, feHemo = 0
  const m = Object.fromEntries(MICROS.map((k) => [k, 0]))
  for (const ing of r.ingredientes ?? []) {
    const n = norm(ing.nombre)
    if (SIN_FICHA_OK.has(n)) continue
    const ficha = FICHAS.get(n)
    if (!ficha) { desconocidos.push(ing.nombre); sinFicha.push(ing.nombre); continue }
    if (ficha.glu) fuentesGluten.push({ nombre: ing.nombre, certeza: ficha.glu, sustituto: ficha.sust ?? null })
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
      // Solo es "evitable" si toda fuente tiene un sustituto sin gluten conocido.
      evitable: fuentesGluten.length > 0 && fuentesGluten.every((f) => f.sustituto),
      cierto: sinFicha.length === 0,
    },
  }
}

const red = (x, d = 1) => Math.round(x * 10 ** d) / 10 ** d

/**
 * Ficha lista para persistir: `hierro` y `sinGluten` van a columna (se filtra y ordena
 * por ellos) y el resto a `micros` jsonb. `sinGluten` es null cuando algún ingrediente no
 * tiene ficha: ahí no se puede afirmar que la receta no lleve gluten.
 *
 * La sal es la que traen los ingredientes; no cuenta la que se añada al cocinar.
 */
export function fichaNutricional(r) {
  const e = estimarMacros(r)
  return {
    hierro: red(e.hierro),
    sinGluten: e.gluten.hay ? false : e.gluten.cierto ? true : null,
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
