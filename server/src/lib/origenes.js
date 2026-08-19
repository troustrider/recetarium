const LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/

const origenes = () =>
  (process.env.ORIGENES_PERMITIDOS ?? '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean)

export function origenPermitido(origen) {
  if (!origen) return false
  const limpio = origen.replace(/\/$/, '')
  const lista = origenes()
  return lista.includes(limpio) || (lista.length === 0 && LOCAL.test(limpio))
}

export function destinoPermitido(destino) {
  try {
    const url = new URL(destino)
    return origenPermitido(url.origin) ? url.toString() : null
  } catch {
    return null
  }
}
