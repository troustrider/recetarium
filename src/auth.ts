const CLAVE_TOKEN = 'recetarium:sesion'
const BASE = import.meta.env.VITE_API_URL ?? '/api/v1'

export type Aviso = 'sin-invitacion' | 'cancelado' | 'fallo' | 'suspendido'

const AVISOS: Aviso[] = ['sin-invitacion', 'cancelado', 'fallo', 'suspendido']

export function tokenGuardado(): string | null {
  return localStorage.getItem(CLAVE_TOKEN)
}

export function olvidarToken(): void {
  localStorage.removeItem(CLAVE_TOKEN)
}

export function cabeceraSesion(): Record<string, string> {
  const token = tokenGuardado()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function entrar(): void {
  const destino = window.location.origin + window.location.pathname + window.location.search
  window.location.href = `${BASE}/auth/google/inicio?destino=${encodeURIComponent(destino)}`
}

function fragmento(): URLSearchParams {
  return new URLSearchParams(window.location.hash.replace(/^#/, ''))
}

function limpiarFragmento(): void {
  const { origin, pathname, search } = window.location
  window.history.replaceState(null, '', `${origin}${pathname}${search}`)
}

// La vuelta de nuestro OAuth trae la sesión en el fragmento: no viaja al
// servidor, no queda en los registros ni en el Referer. Se guarda y se borra de
// la barra en cuanto se lee.
export function capturarToken(): string | null {
  const guardado = tokenGuardado()
  if (guardado) return guardado

  const token = fragmento().get('sesion')
  if (!token) return null
  localStorage.setItem(CLAVE_TOKEN, token)
  limpiarFragmento()
  return token
}

export function avisoDeVuelta(): Aviso | null {
  const acceso = fragmento().get('acceso')
  if (!acceso || !AVISOS.includes(acceso as Aviso)) return null
  limpiarFragmento()
  return acceso as Aviso
}
