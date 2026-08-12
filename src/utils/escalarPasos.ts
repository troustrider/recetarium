import { formatNumero } from './ingredientes'

const MARCA = /\{\s*([0-9]+(?:[.,][0-9]+)?|[½¼¾⅓⅔]|[0-9]+[½¼¾⅓⅔])\s*([^}]*?)\s*\}/g

const UNICODE_FRAC: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 }

function parseCantidad(s: string): number {
  if (UNICODE_FRAC[s] !== undefined) return UNICODE_FRAC[s]
  const mixto = s.match(/^([0-9]+)([½¼¾⅓⅔])$/)
  if (mixto) return Number(mixto[1]) + UNICODE_FRAC[mixto[2]]
  return Number(s.replace(',', '.'))
}

export function tieneCantidadesEscalables(pasos: string[]): boolean {
  return pasos.some((p) => new RegExp(MARCA.source).test(p))
}

const PLURALIZABLES = ['cucharada', 'cucharadita', 'vaso', 'diente', 'loncha', 'rodaja', 'rebanada', 'puñado', 'lata', 'paquete', 'hoja', 'tira', 'pizca', 'gota', 'litro',
  'albóndiga', 'bola', 'bolita', 'brocheta', 'hamburguesa', 'croqueta', 'tortita', 'muffin', 'pincho', 'rollito', 'hueco', 'filete']

function concordar(resto: string, cantidad: number): string {
  const [primera, ...cola] = resto.split(' ')
  const base = primera.replace(/s$/, '')
  if (!PLURALIZABLES.includes(base.toLowerCase())) return resto
  const forma = cantidad > 1 ? `${base}s` : base
  return [forma, ...cola].join(' ')
}

export function escalarPaso(texto: string, multiplicador = 1): string {
  return texto.replace(MARCA, (_, num: string, resto: string) => {
    const cantidad = parseCantidad(num)
    if (!Number.isFinite(cantidad)) return resto ? `${num} ${resto}` : num
    const escalada = cantidad * multiplicador
    const texto = formatNumero(escalada)
    return resto ? `${texto} ${concordar(resto, escalada)}` : texto
  })
}

export function escalarPasos(pasos: string[], multiplicador = 1): string[] {
  return pasos.map((p) => escalarPaso(p, multiplicador))
}
