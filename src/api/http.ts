import { cabeceraSesion, olvidarToken } from '../auth'

export const BASE = import.meta.env.VITE_API_URL ?? '/api/v1'

// Único punto por el que la app habla con su API. Antes había fetch pelado para
// las lecturas y otro camino para las escrituras, y cada sitio decidía por su
// cuenta si mandaba credenciales.
//
// Un 401 con la app abierta significa sesión caducada o revocada. Se olvida el
// token y se recarga: la puerta se encarga del resto y la landing aparece sola,
// sin que cada pantalla tenga que saber nada de esto.
export async function apiFetch(ruta: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${BASE}${ruta}`, {
    ...options,
    headers: { ...options.headers, ...cabeceraSesion() },
  })
  if (res.status === 401) {
    olvidarToken()
    window.location.reload()
  }
  return res
}

export async function apiJson<T>(ruta: string, options: RequestInit = {}): Promise<T> {
  const res = await apiFetch(ruta, options)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string })
    throw new Error(body.error ?? `Error ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function jsonBody(datos: unknown): RequestInit {
  return { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) }
}
