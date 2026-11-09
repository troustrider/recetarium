import type { RecetaListada } from '../types/receta'
import type { LimitesSemana } from '../types/preferencias'
import { canonNombre, guarnicionesDe, normalizar } from './ingredientes'

type GuarnicionListada = NonNullable<RecetaListada['guarniciones']>[number]

const nombresDe = (ingredientes?: { nombre: string }[]) => (ingredientes ?? []).map((i) => i.nombre)

function guarnicionCumple(guarnicion: GuarnicionListada, limites: LimitesSemana): boolean {
  if (limites.dieta && guarnicion.apto?.[limites.dieta] !== true) return false
  if (limites.sinGluten && guarnicion.sinGluten !== true) return false
  return !choca(nombresDe(guarnicion.ingredientes), limites.vetados)
}

/**
 * La primera guarnición que cumple dieta, sin gluten y vetados a la vez, o
 * `null` si ninguna: entonces el plato va pelado. Es la que enciende la
 * auto-semana y la que puntúa el reparto, para que lo puntuado sea lo servido.
 */
export function guarnicionPermitida(receta: RecetaListada, limites: LimitesSemana): GuarnicionListada | null {
  return guarnicionesDe(receta).find((g) => guarnicionCumple(g, limites)) ?? null
}

export function cumpleLimites(
  receta: RecetaListada,
  limites: LimitesSemana,
  tiempoMax: number | null
): boolean {
  if (tiempoMax != null && receta.tiempoPreparacion > tiempoMax) return false
  if (limites.sinGluten && receta.sinGluten !== true) return false
  // Una receta guardada antes de que existiera la ficha apto tampoco se afirma.
  if (limites.dieta && receta.apto?.[limites.dieta] !== true) return false
  if (choca(nombresDe(receta.ingredientes), limites.vetados)) return false
  // Un plato con guarniciones se come con una de ellas, así que tiene que quedar
  // una que valga para todo junto. Una sin gluten con el vetado dentro y otra
  // limpia pero con gluten dejaban pasar un plato que no se puede servir.
  const opciones = guarnicionesDe(receta)
  return opciones.length === 0 || opciones.some((g) => guarnicionCumple(g, limites))
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

function choca(ingredientes: string[], vetados: string[]): boolean {
  return vetados.some((vetado) => ingredientes.some((nombre) => casaVetado(nombre, vetado)))
}

export function candidatas(
  recetas: RecetaListada[],
  limites: LimitesSemana,
  tiempoMax: number | null
): RecetaListada[] {
  return recetas.filter((r) => cumpleLimites(r, limites, tiempoMax))
}
