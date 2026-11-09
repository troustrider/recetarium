import type { RecetaListada } from '../types/receta'
import type { LimitesSemana } from '../types/preferencias'
import { aptaPara } from './nutricion'
import { canonNombre, guarnicionesDe, normalizar } from './ingredientes'

export function cumpleLimites(
  receta: RecetaListada,
  limites: LimitesSemana,
  tiempoMax: number | null
): boolean {
  if (tiempoMax != null && receta.tiempoPreparacion > tiempoMax) return false
  // Sin gluten es del plato y de lo que se come con él: una receta limpia con
  // pan de pita de única guarnición no vale como sin gluten.
  if (limites.sinGluten && receta.sinGluten !== true) return false
  const opciones = guarnicionesDe(receta)
  if (limites.sinGluten && opciones.length && !opciones.some((g) => g.sinGluten === true))
    return false
  if (limites.dieta && aptaPara(receta, limites.dieta) !== true) return false
  if (limites.vetados.length > 0 && llevaAlguno(receta, limites.vetados)) return false
  return true
}

function llevaAlguno(receta: RecetaListada, vetados: string[]): boolean {
  // Un veto se cumple si queda alguna forma de comer el plato sin el vetado:
  // basta con que el plato esté limpio y una de sus guarniciones también.
  const enPlato = (receta.ingredientes ?? []).map((i) => i.nombre)
  const conGuarnicion = guarnicionesDe(receta)
  const opciones = conGuarnicion.length
    ? conGuarnicion.map((g) => g.ingredientes.map((i) => i.nombre))
    : [[]]
  return opciones.every((extra) => choca([...enPlato, ...extra], vetados))
}

const palabrasDe = (nombre: string) =>
  normalizar(canonNombre(nombre)).split(/[^a-z0-9]+/).filter(Boolean)

// Plural simple y nada más: "huevo" con "huevos", "pan" con "panes". Ir más
// lejos con prefijos es lo que hacía que "sal" casara con "salmón".
const mismaPalabra = (a: string, b: string) =>
  a === b || a === `${b}s` || b === `${a}s` || a === `${b}es` || b === `${a}es`

/**
 * Condimentos que se nombran por su origen: el vinagre de arroz no sabe ni se
 * come como el arroz, y quien veta las aceitunas sigue cocinando con aceite de
 * oliva. Solo se mira la cabeza del nombre; "pechuga de pollo" sí es pollo.
 */
const NOMBRADOS_POR_ORIGEN = new Set(['vinagre', 'aceite'])

/**
 * El vetado casa si sus palabras aparecen enteras y seguidas en el ingrediente.
 * Nunca al revés: vetar "tomate cherry" no dice nada del tomate normal.
 */
function casaVetado(ingrediente: string, vetado: string): boolean {
  const q = palabrasDe(vetado)
  const p = palabrasDe(ingrediente)
  if (q.length === 0 || q.length > p.length) return false
  for (let i = 0; i + q.length <= p.length; i++) {
    if (i > 0 && NOMBRADOS_POR_ORIGEN.has(p[0])) break
    if (q.every((w, j) => mismaPalabra(w, p[i + j]))) return true
  }
  return false
}

export function choca(ingredientes: string[], vetados: string[]): boolean {
  return vetados.some((vetado) => ingredientes.some((nombre) => casaVetado(nombre, vetado)))
}

export function candidatas(
  recetas: RecetaListada[],
  limites: LimitesSemana,
  tiempoMax: number | null
): RecetaListada[] {
  return recetas.filter((r) => cumpleLimites(r, limites, tiempoMax))
}
