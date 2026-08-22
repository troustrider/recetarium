import type { Apto, RecetaListada } from '../types/receta'

const HIERRO_ALTO = 4.5
const HIERRO_MEDIO = 2.5
const VITC_POTENCIA = 30
const CALCIO_FRENA = 250

export type NivelHierro = 'alto' | 'medio' | 'bajo'

export interface SenalHierro {
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

export function aptaPara(receta: RecetaListada, dieta: Dieta): boolean | null {
  // Una receta guardada antes de que existiera el flag tampoco se afirma: sin
  // ficha calculada no hay nada que garantizar.
  const partes: (Apto | null | undefined)[] = [receta.apto]
  if (receta.guarnicion) partes.push(receta.guarnicion.apto)

  let cierto = true
  for (const apto of partes) {
    const valor = apto?.[dieta] ?? null
    if (valor === false) return false
    if (valor === null) cierto = false
  }
  return cierto ? true : null
}

export function fuentesAnimales(receta: RecetaListada) {
  return [...(receta.apto?.animal ?? []), ...(receta.guarnicion?.apto?.animal ?? [])]
}
