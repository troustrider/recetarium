import type { Prioridad } from '../types/preferencias'

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
    nota: 'Da preferencia a repartir verdura, macros y micros, sin apretar nada.',
    prioridades: [],
  },
  {
    id: 'proteica',
    nombre: 'Proteica',
    nota: 'Da preferencia a los platos con más proteína.',
    prioridades: ['proteina'],
  },
  {
    id: 'ligera',
    nombre: 'Ligera',
    nota: 'Da preferencia a platos de menos de 600 kcal y poca grasa saturada.',
    prioridades: ['ligera', 'menosSaturadas'],
  },
  {
    id: 'sinSal',
    nombre: 'Menos sal y grasa',
    nota: 'Da preferencia a platos con poca sal y poca grasa saturada.',
    prioridades: ['menosSal', 'menosSaturadas'],
  },
  {
    id: 'verde',
    nombre: 'Más verdura',
    nota: 'Da preferencia a la fibra y a repartir más verdura por la semana.',
    prioridades: ['fibra'],
  },
  {
    id: 'hierro',
    nombre: 'Más hierro',
    nota: 'Da preferencia al hierro y a la vitamina C que lo acompaña en el mismo plato.',
    prioridades: ['hierro'],
  },
  {
    id: 'huesos',
    nombre: 'Calcio y B12',
    nota: 'Da preferencia al calcio, la B12 y el folato, los que más se escapan sin carne.',
    prioridades: ['calcio', 'b12folato'],
  },
  {
    id: 'sinAzucar',
    nombre: 'Menos azúcar',
    nota: 'Da preferencia a platos con poco azúcar, que se concentra en los desayunos.',
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
