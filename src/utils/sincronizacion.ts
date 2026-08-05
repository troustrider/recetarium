// Estado de los guardados contra el backend. Antes cada save fallido moría en
// un .catch(() => {}) y la app seguía enseñando el cambio como si estuviera
// compartido con el otro dispositivo. Aquí se registra qué no se pudo guardar
// para poder avisar y reintentar.
//
// Store de módulo en vez de contexto: lo escribe useEstadoCompartido desde
// dentro de cuatro providers distintos y lo lee un aviso que vive por encima
// de todos ellos.

type Reintento = () => Promise<void>

const fallos = new Map<string, Reintento>()
let enVuelo = 0

let instantanea: { guardando: boolean; fallos: string[] } = { guardando: false, fallos: [] }
const oyentes = new Set<() => void>()

function emitir() {
  const guardando = enVuelo > 0
  const lista = [...fallos.keys()]
  // La identidad solo cambia si cambia el contenido: useSyncExternalStore
  // vuelve a renderizar con cada instantánea nueva.
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

// Reintenta todo lo pendiente. Cada reintento vuelve a registrarse solo si
// falla otra vez, así que basta con lanzarlos.
export async function reintentarTodo(): Promise<void> {
  await Promise.all([...fallos.values()].map((r) => r().catch(() => {})))
}

// Solo para tests.
export function reiniciarSincronizacion() {
  fallos.clear()
  enVuelo = 0
  instantanea = { guardando: false, fallos: [] }
  oyentes.clear()
}
