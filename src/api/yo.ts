import { cabeceraSesion } from '../auth'

export interface UsuarioDTO {
  id: string
  email: string
  nombre: string | null
  imagen: string | null
  hogarId: string
  rol: 'admin' | 'usuario'
}

const BASE = import.meta.env.VITE_API_URL ?? '/api/v1'

// No usa apiFetch a propósito: ese recarga la página ante un 401, y aquí un 401
// es la respuesta normal de "no has entrado". Recargar sería un bucle.
//
// Devuelve null cuando no hay sesión válida, y solo lanza cuando algo se ha
// roto de verdad: al arrancar la app hay que distinguir "no has entrado" de
// "la API está caída", porque la primera lleva a la landing y la segunda no.
export async function getYo(): Promise<UsuarioDTO | null> {
  const cabecera = cabeceraSesion()
  if (!cabecera.Authorization) return null
  const res = await fetch(`${BASE}/yo`, { headers: cabecera })
  if (res.status === 401 || res.status === 403) return null
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json() as Promise<UsuarioDTO>
}

export async function cerrarSesionServidor(): Promise<void> {
  if (!cabeceraSesion().Authorization) return
  await fetch(`${BASE}/yo/sesion`, { method: 'DELETE', headers: cabeceraSesion() }).catch(() => {})
}
