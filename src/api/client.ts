import type { Receta } from '../types/receta'

type RecetaFormData = Omit<Receta, 'id' | 'favorita'>
type Filtros = { categoria?: string; sabor?: string }

const BASE = import.meta.env.VITE_API_URL ?? '/api/v1'
const URL_RECETAS = `${BASE}/recetas`

async function manejarRespuesta<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Error ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function getRecetas(filtros?: Filtros): Promise<Receta[]> {
  const params = new URLSearchParams()
  if (filtros?.categoria) params.set('categoria', filtros.categoria)
  if (filtros?.sabor) params.set('sabor', filtros.sabor)
  const query = params.toString() ? `?${params}` : ''
  const res = await fetch(`${URL_RECETAS}${query}`)
  return manejarRespuesta<Receta[]>(res)
}

export async function getReceta(id: string): Promise<Receta> {
  const res = await fetch(`${URL_RECETAS}/${id}`)
  return manejarRespuesta<Receta>(res)
}

export async function createReceta(data: RecetaFormData): Promise<Receta> {
  const res = await fetch(URL_RECETAS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return manejarRespuesta<Receta>(res)
}

export async function updateReceta(id: string, data: RecetaFormData): Promise<Receta> {
  const res = await fetch(`${URL_RECETAS}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return manejarRespuesta<Receta>(res)
}

export async function toggleFavorita(id: string): Promise<Receta> {
  const res = await fetch(`${URL_RECETAS}/${id}/favorita`, { method: 'PATCH' })
  return manejarRespuesta<Receta>(res)
}

export async function deleteReceta(id: string): Promise<void> {
  const res = await fetch(`${URL_RECETAS}/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Error ${res.status}`)
  }
}
