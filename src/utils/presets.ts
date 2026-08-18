import type { Prioridad } from '../types/preferencias'

/**
 * Los presets son la interfaz de verdad: combinaciones con nombre de cocina, no
 * de consulta médica. Cubren lo corriente sin nombrar ninguna condición, porque
 * la app ordena recetas, no prescribe. Cada casa elegirá la suya.
 */
export interface Preset {
  id: string
  nombre: string
  nota: string
  prioridades: Prioridad[]
}

export const PRESETS: Preset[] = [
  {
    id: 'equilibrada',
    nombre: 'Equilibrada',
    nota: 'Reparte verdura, macros y micros. Nada apretado.',
    prioridades: [],
  },
  {
    id: 'proteica',
    nombre: 'Proteica',
    nota: 'Sube la proteína de la semana.',
    prioridades: ['proteina'],
  },
  {
    id: 'ligera',
    nombre: 'Ligera',
    nota: 'Platos por debajo de 600 kcal y menos grasa saturada.',
    prioridades: ['ligera', 'menosSaturadas'],
  },
  {
    id: 'sinSal',
    nombre: 'Menos sal y grasa',
    nota: 'Baja el techo de sal y de saturadas de cada plato.',
    prioridades: ['menosSal', 'menosSaturadas'],
  },
  {
    id: 'verde',
    nombre: 'Más verdura',
    nota: 'Prioriza la fibra y reparte más verdura por la semana.',
    prioridades: ['fibra'],
  },
  {
    id: 'hierro',
    nombre: 'Más hierro',
    nota: 'Hierro, y la vitamina C que lo acompaña en el mismo plato.',
    prioridades: ['hierro'],
  },
  {
    id: 'huesos',
    nombre: 'Calcio y B12',
    nota: 'Calcio, B12 y folato, los que más se escapan sin carne.',
    prioridades: ['calcio', 'b12folato'],
  },
  {
    id: 'sinAzucar',
    nombre: 'Menos azúcar',
    nota: 'Baja el techo de azúcar, que pega sobre todo en los desayunos.',
    prioridades: ['menosAzucar'],
  },
]

export const NOMBRE_PRIORIDAD: Record<Prioridad, string> = {
  proteina: 'más proteína',
  fibra: 'más fibra',
  hierro: 'más hierro',
  calcio: 'más calcio',
  b12folato: 'más B12 y folato',
  menosSal: 'menos sal',
  menosAzucar: 'menos azúcar',
  menosSaturadas: 'menos grasa saturada',
  ligera: 'más ligera',
}

const mismasPrioridades = (a: Prioridad[], b: Prioridad[]) =>
  a.length === b.length && [...a].sort().join() === [...b].sort().join()

/** Qué preset está puesto, o `null` si la combinación no es ninguno de la lista. */
export function presetDe(prioridades: Prioridad[]): Preset | null {
  return PRESETS.find((p) => mismasPrioridades(p.prioridades, prioridades)) ?? null
}
