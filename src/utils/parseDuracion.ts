export interface Duracion {
  segundos: number
  etiqueta: string
}

const FACTOR: Record<string, number> = {
  s: 1, seg: 1, segundo: 1, segundos: 1,
  min: 60, minuto: 60, minutos: 60,
  h: 3600, hora: 3600, horas: 3600,
}

const RE = /(\d+)(?:\s*[-–]\s*(\d+))?\s*(segundos|segundo|seg|minutos|minuto|min|horas|hora|s|h)\b/gi

export function parseDuraciones(paso: string): Duracion[] {
  const out: Duracion[] = []
  for (const m of paso.matchAll(RE)) {
    const bajo = parseInt(m[1], 10)
    const alto = m[2] ? parseInt(m[2], 10) : null
    const factor = FACTOR[m[3].toLowerCase()] ?? 60
    const corta = factor === 3600 ? 'h' : factor === 60 ? 'min' : 's'
    out.push({
      segundos: bajo * factor,
      etiqueta: alto ? `${bajo}-${alto} ${corta}` : `${bajo} ${corta}`,
    })
  }
  return out
}

export function formatReloj(segundos: number): string {
  const s = Math.max(0, Math.round(segundos))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const seg = s % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(seg)}` : `${m}:${pad(seg)}`
}
