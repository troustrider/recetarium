import { cabeceraSesion, olvidarToken } from '../auth'

export const BASE = import.meta.env.VITE_API_URL ?? '/api/v1'

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
