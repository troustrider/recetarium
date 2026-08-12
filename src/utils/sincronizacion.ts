type Reintento = () => Promise<void>

const fallos = new Map<string, Reintento>()
let enVuelo = 0

let instantanea: { guardando: boolean; fallos: string[] } = { guardando: false, fallos: [] }
const oyentes = new Set<() => void>()

function emitir() {
  const guardando = enVuelo > 0
  const lista = [...fallos.keys()]
  if (instantanea.guardando === guardando && instantanea.fallos.join() === lista.join()) return
  instantanea = { guardando, fallos: lista }
  for (const avisar of oyentes) avisar()
}

export function suscribir(oyente: () => void): () => void {
  oyentes.add(oyente)
  return () => { oyentes.delete(oyente) }
}

export function leer() {
  return instantanea
}

export function inicioGuardado() {
  enVuelo++
  emitir()
}

export function finGuardado() {
  enVuelo = Math.max(0, enVuelo - 1)
  emitir()
}

export function registrarFallo(nombre: string, reintento: Reintento) {
  fallos.set(nombre, reintento)
  emitir()
}

export function limpiarFallo(nombre: string) {
  if (fallos.delete(nombre)) emitir()
}

export async function reintentarTodo(): Promise<void> {
  await Promise.all([...fallos.values()].map((r) => r().catch(() => {})))
}

export function reiniciarSincronizacion() {
  fallos.clear()
  enVuelo = 0
  instantanea = { guardando: false, fallos: [] }
  oyentes.clear()
}
