import type { RecetaListada } from '../types/receta'
import type { LimitesSemana } from '../types/preferencias'
import { aptaPara } from './nutricion'
import { normalizar } from './ingredientes'

/**
 * Los límites duros de la semana. Lo que no los cumple no se cocina, y de estos
 * solo el tiempo se puede ensanchar cuando el catálogo no da: la dieta, el gluten
 * y los vetos no se relajan nunca, porque no son una preferencia de comodidad.
 *
 * `aptaPara` solo deja pasar `true`: una receta cuya ficha no permite afirmar que
 * es vegetariana se queda fuera. Es preferible una semana más corta que un plato
 * con dashi dentro.
 */
export function cumpleLimites(
  receta: RecetaListada,
  limites: LimitesSemana,
  tiempoMax: number | null
): boolean {
  if (tiempoMax != null && receta.tiempoPreparacion > tiempoMax) return false
  if (limites.sinGluten && receta.sinGluten !== true) return false
  if (limites.dieta && aptaPara(receta, limites.dieta) !== true) return false
  if (limites.vetados.length > 0 && llevaAlguno(receta, limites.vetados)) return false
  return true
}

function llevaAlguno(receta: RecetaListada, vetados: string[]): boolean {
  const ingredientes = [
    ...(receta.ingredientes ?? []),
    ...(receta.guarnicion?.ingredientes ?? []),
  ].map((i) => normalizar(i.nombre))

  return vetados.some((vetado) => {
    const q = normalizar(vetado)
    if (!q) return false
    return ingredientes.some((nombre) => nombre.includes(q) || q.includes(nombre))
  })
}

export function candidatas(
  recetas: RecetaListada[],
  limites: LimitesSemana,
  tiempoMax: number | null
): RecetaListada[] {
  return recetas.filter((r) => cumpleLimites(r, limites, tiempoMax))
}
