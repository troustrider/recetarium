import type { Receta } from '../types/receta'

// El hierro no se absorbe entero y cuánto entra depende de con qué va: el hemo
// (carne, pescado) se absorbe ~3x mejor y le afectan poco los inhibidores; el no
// hemo sube con vitamina C en la misma comida y baja con el calcio. Por eso no
// basta con enseñar los mg.
//
// Umbrales sobre una ingesta de referencia de 18 mg/día (mujer adulta): una
// comida "alta" aporta al menos un cuarto del día.
const HIERRO_ALTO = 4.5
const HIERRO_MEDIO = 2.5
// Vitamina C a partir de la cual la absorción del no hemo sube de forma apreciable.
const VITC_POTENCIA = 30
// Calcio a partir del cual compite de verdad con el hierro en la misma comida.
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

export function senalHierro(receta: Receta): SenalHierro | null {
  const { hierro, micros } = receta
  if (hierro == null || !micros) return null

  const nivel: NivelHierro = hierro >= HIERRO_ALTO ? 'alto' : hierro >= HIERRO_MEDIO ? 'medio' : 'bajo'
  const hemo = hierro > 0 && micros.hierroHemo / hierro >= 0.4
  const potenciado = micros.vitaminaC >= VITC_POTENCIA
  // Con hierro hemo dominante el calcio estorba mucho menos, así que no se avisa.
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

/** Las fuentes de gluten de la receta con su sustituto, o null si no lleva. */
export function fuentesGluten(receta: Receta) {
  return receta.micros?.gluten ?? null
}
