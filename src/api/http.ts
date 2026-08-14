import { cabeceraSesion, olvidarToken, renovarToken } from '../auth'

export const BASE = import.meta.env.VITE_API_URL ?? '/api/v1'

// El service worker cachea las respuestas de /api por URL, sin la sesión en la
// clave. Al soltar la sesión hay que tirar esa caché o el siguiente que entre en
// este dispositivo puede leer la despensa y el plan del hogar anterior.
export async function limpiarCacheApi(): Promise<void> {
  if (!('caches' in window)) return
  try {
    const claves = await caches.keys()
    await Promise.all(claves.filter((k) => k.startsWith('recetarium-api')).map((k) => caches.delete(k)))
  } catch {
    /* sin caché que limpiar */
  }
}

async function pedir(ruta: string, options: RequestInit): Promise<Response> {
  return fetch(`${BASE}${ruta}`, {
    ...options,
    headers: { ...options.headers, ...cabeceraSesion() },
  })
}

export async function apiFetch(ruta: string, options: RequestInit = {}): Promise<Response> {
  const res = await pedir(ruta, options)
  if (res.status !== 401) return res

  // Un 401 casi siempre es el JWT caducado, no una sesión perdida: se renueva y
  // se repite la petición. Solo si no hay token nuevo se suelta la sesión.
  const token = await renovarToken()
  if (token) {
    const reintento = await pedir(ruta, options)
    if (reintento.status !== 401) return reintento
  }

  olvidarToken()
  await limpiarCacheApi()
  window.location.reload()
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
