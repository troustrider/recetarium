// Extrae duraciones cronometrables del texto de un paso. El Modo cocina las
// convierte en temporizadores. Los pasos de la BD escriben el tiempo como
// número + unidad ("12 min", "25-30 min", "30 s", "3 horas"); la regla de
// calidad del skill de chef garantiza que toda acción con tiempo lo declare así.

export interface Duracion {
  segundos: number
  etiqueta: string
}

const FACTOR: Record<string, number> = {
  s: 1, seg: 1, segundo: 1, segundos: 1,
  min: 60, minuto: 60, minutos: 60,
  h: 3600, hora: 3600, horas: 3600,
}

// Número (con rango opcional) seguido de una unidad de tiempo. Las alternativas
// largas van antes que las cortas para que "segundos" gane a "s".
const RE = /(\d+)(?:\s*[-–]\s*(\d+))?\s*(segundos|segundo|seg|minutos|minuto|min|horas|hora|s|h)\b/gi

export function parseDuraciones(paso: string): Duracion[] {
  const out: Duracion[] = []
  for (const m of paso.matchAll(RE)) {
    const bajo = parseInt(m[1], 10)
    const alto = m[2] ? parseInt(m[2], 10) : null
    const factor = FACTOR[m[3].toLowerCase()] ?? 60
    const corta = factor === 3600 ? 'h' : factor === 60 ? 'min' : 's'
    // Rango: cronometra el mínimo para avisar antes y comprobar el punto.
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
