import type { RecetaListada } from '../types/receta'

// Lo que la semana entera debería sumar. Todo va por porción, que es como se
// guardan los macros y los micros de una receta: siete platos, uno al día.
const OBJETIVO = {
  fibra: 7 * 12,
  vitaminaC: 7 * 32,
  calcio: 7 * 400,
  folato: 7 * 130,
  hierro: 7 * 5.6,
  b12: 7 * 1,
  proteinas: 7 * 40,
} as const

type Clave = keyof typeof OBJETIVO

const CLAVES = Object.keys(OBJETIVO) as Clave[]

const TECHO_SATURADAS = 12
const TECHO_SAL = 3

// Reparto de referencia de la energía de la semana. No es un dogma: es el punto
// medio del recetario (principales de 35-45 g de proteína) y lo que evita que la
// semana se vaya entera a pasta o entera a fritura.
const MACROS = ['proteinas', 'carbohidratos', 'grasas'] as const
type Macro = typeof MACROS[number]

const REPARTO: Record<Macro, number> = { proteinas: 0.3, carbohidratos: 0.4, grasas: 0.3 }
const KCAL_POR_GRAMO: Record<Macro, number> = { proteinas: 4, carbohidratos: 4, grasas: 9 }
const PESO_REPARTO = 0.8

export interface Aporte extends Record<Clave, number> {
  saturadas: number
  sal: number
  carbohidratos: number
  grasas: number
}

const VACIO: Aporte = {
  fibra: 0, vitaminaC: 0, calcio: 0, folato: 0, hierro: 0, b12: 0,
  proteinas: 0, carbohidratos: 0, grasas: 0, saturadas: 0, sal: 0,
}

export function aporteDe(receta: RecetaListada): Aporte {
  const partes = [receta, receta.guarnicion]
  const total = { ...VACIO }
  for (const parte of partes) {
    if (!parte) continue
    if (parte.hierro != null) total.hierro += parte.hierro
    for (const macro of MACROS) total[macro] += parte[macro] ?? 0
    const micros = parte.micros
    if (!micros) continue
    total.fibra += micros.fibra
    total.vitaminaC += micros.vitaminaC
    total.calcio += micros.calcio
    total.folato += micros.folato
    total.b12 += micros.b12
    total.saturadas += micros.saturadas
    total.sal += micros.sal
  }
  return total
}

// Cuánto se desvía el reparto de energía acumulado del de referencia, de 0 (clavado)
// a 1 (todo en un macro). Una semana sin macros declarados no se desvía: no hay dato
// que juzgar, y castigarla la dejaría siempre por debajo de las que sí lo traen.
function desvioReparto(acumulado: Record<Macro, number>): number {
  const kcal = MACROS.reduce((t, m) => t + acumulado[m] * KCAL_POR_GRAMO[m], 0)
  if (kcal === 0) return 0
  const suma = MACROS.reduce(
    (t, m) => t + Math.abs((acumulado[m] * KCAL_POR_GRAMO[m]) / kcal - REPARTO[m]),
    0
  )
  return suma / 2
}

function verduraDe(receta: RecetaListada): string | null {
  return receta.guarnicion?.ingredientes[0]?.nombre.toLowerCase() ?? null
}

function prng(semilla: number): () => number {
  let s = semilla >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Acumulado {
  nutrientes: Record<Clave, number>
  macros: Record<Macro, number>
  categorias: Set<string>
  verduras: Set<string>
  sabores: Map<string, number>
}

function acumular(acc: Acumulado, receta: RecetaListada) {
  const a = aporteDe(receta)
  for (const clave of CLAVES) acc.nutrientes[clave] += a[clave]
  for (const macro of MACROS) acc.macros[macro] += a[macro]
  if (receta.categoria) acc.categorias.add(receta.categoria)
  const verdura = verduraDe(receta)
  if (verdura) acc.verduras.add(verdura)
  acc.sabores.set(receta.sabor, (acc.sabores.get(receta.sabor) ?? 0) + 1)
}

function ganancia(a: Aporte, acc: Acumulado): number {
  let g = 0
  for (const clave of CLAVES) {
    const antes = Math.min(acc.nutrientes[clave], OBJETIVO[clave])
    const despues = Math.min(acc.nutrientes[clave] + a[clave], OBJETIVO[clave])
    g += (despues - antes) / OBJETIVO[clave]
  }
  return g
}

function penalizacion(receta: RecetaListada, a: Aporte, acc: Acumulado): number {
  let p = 0
  if (receta.categoria && acc.categorias.has(receta.categoria)) p += 0.35
  const verdura = verduraDe(receta)
  if (verdura && acc.verduras.has(verdura)) p += 0.3
  if (!verdura) p += 0.15
  if ((acc.sabores.get(receta.sabor) ?? 0) >= 3) p += 0.2
  if (a.saturadas > TECHO_SATURADAS) p += (a.saturadas - TECHO_SATURADAS) / 60
  if (a.sal > TECHO_SAL) p += (a.sal - TECHO_SAL) / 12
  // Cómo quedaría el reparto de macros de la semana si entrase este plato.
  const conElPlato = Object.fromEntries(
    MACROS.map((m) => [m, acc.macros[m] + a[m]])
  ) as Record<Macro, number>
  p += PESO_REPARTO * desvioReparto(conElPlato)
  return p
}

/**
 * Elige `n` platos que completen la semana. `yaEnLaSemana` son los que ya están
 * puestos y no se tocan (los cocinados): entran en el cálculo como si los hubiese
 * elegido esta misma función, así que lo que devuelve compensa lo que les falta y
 * no repite ni su cocina, ni su verdura, ni el plato en sí.
 */
export function semanaEquilibrada(
  recetas: RecetaListada[],
  n: number,
  semilla = Date.now(),
  yaEnLaSemana: RecetaListada[] = []
): RecetaListada[] {
  const aleatorio = prng(semilla)
  const puestas = new Set(yaEnLaSemana.map((r) => r.id))
  const disponibles = recetas.filter((r) => !puestas.has(r.id))
  const acc: Acumulado = {
    nutrientes: Object.fromEntries(CLAVES.map((c) => [c, 0])) as Record<Clave, number>,
    macros: Object.fromEntries(MACROS.map((m) => [m, 0])) as Record<Macro, number>,
    categorias: new Set(),
    verduras: new Set(),
    sabores: new Map(),
  }
  for (const receta of yaEnLaSemana) acumular(acc, receta)
  const elegidas: RecetaListada[] = []

  while (elegidas.length < n && disponibles.length > 0) {
    let mejor = 0
    let mejorNota = -Infinity
    for (let i = 0; i < disponibles.length; i++) {
      const a = aporteDe(disponibles[i])
      const nota = ganancia(a, acc) - penalizacion(disponibles[i], a, acc) + aleatorio() * 0.25
      if (nota > mejorNota) {
        mejorNota = nota
        mejor = i
      }
    }

    const [receta] = disponibles.splice(mejor, 1)
    acumular(acc, receta)
    elegidas.push(receta)
  }

  return elegidas
}
