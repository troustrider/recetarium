import { cabeceraSesion } from '../auth'
import { apuntar } from '../diagnostico'

export interface UsuarioDTO {
  id: string
  email: string
  nombre: string | null
  hogarId: string
  rol: 'admin' | 'usuario'
}

const BASE = import.meta.env.VITE_API_URL ?? '/api/v1'

// Devuelve null cuando no hay sesión válida, y solo lanza cuando algo se ha
// roto de verdad: al arrancar la app hay que distinguir "no has entrado" de
// "la API está caída", porque la primera lleva a la landing y la segunda no.
export async function getYo(): Promise<UsuarioDTO | null> {
  const cabecera = cabeceraSesion()
  if (!cabecera.Authorization) return null
  const res = await fetch(`${BASE}/yo`, { headers: cabecera })
  if (res.status === 401 || res.status === 403) {
    // Huella del token, no el token: longitud y si trae firma pegada. Better
    // Auth firma la cookie de sesión, y si lo que entrega el cliente es la
    // forma firmada no coincide con neon_auth.session.token.
    const t = cabecera.Authorization.slice(7)
    const cuerpo = await res.json().catch(() => ({}) as { error?: string })
    apuntar(`/yo devolvió ${res.status} (${cuerpo.error ?? 'sin detalle'}); token de ${t.length} car., ${t.includes('.') ? 'con firma' : 'sin firma'}`)
    return null
  }
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json() as Promise<UsuarioDTO>
}

export async function cerrarSesionServidor(): Promise<void> {
  if (!cabeceraSesion().Authorization) return
  await fetch(`${BASE}/yo/sesion`, { method: 'DELETE', headers: cabeceraSesion() }).catch(() => {})
}
