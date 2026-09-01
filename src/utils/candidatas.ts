import type { RecetaListada } from '../types/receta'
import type { LimitesSemana } from '../types/preferencias'
import { aptaPara } from './nutricion'
import { guarnicionesDe, normalizar } from './ingredientes'

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
  const enPlato = (receta.ingredientes ?? []).map((i) => normalizar(i.nombre))
  const conGuarnicion = guarnicionesDe(receta)
  const opciones = conGuarnicion.length
    ? conGuarnicion.map((g) => g.ingredientes.map((i) => normalizar(i.nombre)))
    : [[]]
  return opciones.every((extra) => choca([...enPlato, ...extra], vetados))
}

function choca(ingredientes: string[], vetados: string[]): boolean {
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
