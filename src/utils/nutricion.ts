import type { Apto, RecetaListada } from '../types/receta'
import { guarnicionesDe } from './ingredientes'

const HIERRO_ALTO = 4.5
const HIERRO_MEDIO = 2.5
const VITC_POTENCIA = 30
const CALCIO_FRENA = 250

type NivelHierro = 'alto' | 'medio' | 'bajo'

interface SenalHierro {
  hierro: number
  nivel: NivelHierro
  hemo: boolean
  potenciado: boolean
  frenado: boolean
  texto: string
}

export function senalHierro(receta: RecetaListada): SenalHierro | null {
  const { hierro, micros } = receta
  if (hierro == null || !micros) return null

  const nivel: NivelHierro = hierro >= HIERRO_ALTO ? 'alto' : hierro >= HIERRO_MEDIO ? 'medio' : 'bajo'
  const hemo = hierro > 0 && micros.hierroHemo / hierro >= 0.4
  const potenciado = micros.vitaminaC >= VITC_POTENCIA
  const frenado = !hemo && micros.calcio >= CALCIO_FRENA

  let texto: string
  if (nivel === 'bajo') texto = 'Poco hierro'
  else if (hemo && potenciado) texto = 'Hierro hemo y vitamina C: la mejor combinación'
  else if (hemo) texto = 'Hierro hemo, el que mejor se absorbe'
  else if (potenciado) texto = 'Hierro vegetal con vitamina C que lo potencia'
  else if (frenado) texto = 'Hierro vegetal con calcio que frena su absorción'
  else texto = 'Hierro vegetal; con algo de vitamina C se aprovecha más'

  return { hierro, nivel, hemo, potenciado, frenado, texto }
}

export function fuentesGluten(receta: RecetaListada) {
  return receta.micros?.gluten ?? null
}

export type Dieta = 'vegetariana' | 'vegana'

const valorApto = (apto: Apto | null | undefined, dieta: Dieta) => apto?.[dieta] ?? null

/**
 * Con varias guarniciones la pregunta cambia: no es si todas valen, es si el
 * plato vale y queda al menos una opción que también valga. Exigir que valgan
 * todas escondería un curry vegano solo porque una de sus tres opciones lleva
 * yogur.
 */
export function aptaPara(receta: RecetaListada, dieta: Dieta): boolean | null {
  // Una receta guardada antes de que existiera el flag tampoco se afirma: sin
  // ficha calculada no hay nada que garantizar.
  const plato = valorApto(receta.apto, dieta)
  if (plato === false) return false
  const opciones = guarnicionesDe(receta)
  if (!opciones.length) return plato === true ? true : null

  const valores = opciones.map((g) => valorApto(g.apto, dieta))
  if (valores.every((v) => v === false)) return false
  if (plato === true && valores.some((v) => v === true)) return true
  return null
}

/** La primera guarnición que cumple la dieta; la recomendada si no se pide ninguna. */
export function guarnicionPara(receta: RecetaListada, dieta?: Dieta, sinGluten = false) {
  return (
    guarnicionesDe(receta).find(
      (g) =>
        (!dieta || valorApto(g.apto, dieta) === true) &&
        (!sinGluten || g.sinGluten === true)
    ) ?? null
  )
}

export function fuentesAnimales(receta: RecetaListada) {
  const guarnicion = guarnicionesDe(receta)[0]
  return [...(receta.apto?.animal ?? []), ...(guarnicion?.apto?.animal ?? [])]
}
