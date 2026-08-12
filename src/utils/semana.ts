import type { Receta } from '../types/receta'

const OBJETIVO = {
  fibra: 7 * 12,
  vitaminaC: 7 * 32,
  calcio: 7 * 400,
  folato: 7 * 130,
  hierro: 7 * 5.6,
  b12: 7 * 1,
} as const

type Clave = keyof typeof OBJETIVO

const CLAVES = Object.keys(OBJETIVO) as Clave[]

const TECHO_SATURADAS = 12
const TECHO_SAL = 3

export interface Aporte extends Record<Clave, number> {
  saturadas: number
  sal: number
}

const VACIO: Aporte = { fibra: 0, vitaminaC: 0, calcio: 0, folato: 0, hierro: 0, b12: 0, saturadas: 0, sal: 0 }

export function aporteDe(receta: Receta): Aporte {
  const partes = [
    { micros: receta.micros, hierro: receta.hierro },
    { micros: receta.guarnicion?.micros, hierro: receta.guarnicion?.hierro },
  ]
  const total = { ...VACIO }
  for (const { micros, hierro } of partes) {
    if (hierro != null) total.hierro += hierro
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

function verduraDe(receta: Receta): string | null {
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
  micros: Record<Clave, number>
  categorias: Set<string>
  verduras: Set<string>
  sabores: Map<string, number>
}

function ganancia(a: Aporte, acc: Acumulado): number {
  let g = 0
  for (const clave of CLAVES) {
    const antes = Math.min(acc.micros[clave], OBJETIVO[clave])
    const despues = Math.min(acc.micros[clave] + a[clave], OBJETIVO[clave])
    g += (despues - antes) / OBJETIVO[clave]
  }
  return g
}

function penalizacion(receta: Receta, a: Aporte, acc: Acumulado): number {
  let p = 0
  if (receta.categoria && acc.categorias.has(receta.categoria)) p += 0.35
  const verdura = verduraDe(receta)
  if (verdura && acc.verduras.has(verdura)) p += 0.3
  if (!verdura) p += 0.15
  if ((acc.sabores.get(receta.sabor) ?? 0) >= 3) p += 0.2
  if (a.saturadas > TECHO_SATURADAS) p += (a.saturadas - TECHO_SATURADAS) / 60
  if (a.sal > TECHO_SAL) p += (a.sal - TECHO_SAL) / 12
  return p
}

export function semanaEquilibrada(recetas: Receta[], n: number, semilla = Date.now()): Receta[] {
  const aleatorio = prng(semilla)
  const disponibles = [...recetas]
  const acc: Acumulado = {
    micros: Object.fromEntries(CLAVES.map((c) => [c, 0])) as Record<Clave, number>,
    categorias: new Set(),
    verduras: new Set(),
    sabores: new Map(),
  }
  const elegidas: Receta[] = []

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
    const a = aporteDe(receta)
    for (const clave of CLAVES) acc.micros[clave] += a[clave]
    if (receta.categoria) acc.categorias.add(receta.categoria)
    const verdura = verduraDe(receta)
    if (verdura) acc.verduras.add(verdura)
    acc.sabores.set(receta.sabor, (acc.sabores.get(receta.sabor) ?? 0) + 1)
    elegidas.push(receta)
  }

  return elegidas
}
