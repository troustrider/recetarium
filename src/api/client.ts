import type { Receta, RecetaListada } from '../types/receta'
import { apiFetch, apiJson, jsonBody } from './http'

type RecetaFormData = Omit<Receta, 'id' | 'favorita'>
type Filtros = { categoria?: string; sabor?: string }

export async function getRecetas(filtros?: Filtros): Promise<RecetaListada[]> {
  const params = new URLSearchParams()
  if (filtros?.categoria) params.set('categoria', filtros.categoria)
  if (filtros?.sabor) params.set('sabor', filtros.sabor)
  const query = params.toString() ? `?${params}` : ''
  return apiJson<RecetaListada[]>(`/recetas${query}`)
}

export async function getReceta(id: string): Promise<Receta> {
  return apiJson<Receta>(`/recetas/${id}`)
}

export async function createReceta(data: RecetaFormData): Promise<Receta> {
  return apiJson<Receta>('/recetas', { method: 'POST', ...jsonBody(data) })
}

export async function updateReceta(id: string, data: RecetaFormData): Promise<Receta> {
  return apiJson<Receta>(`/recetas/${id}`, { method: 'PUT', ...jsonBody(data) })
}

export async function toggleFavorita(id: string): Promise<Receta> {
  return apiJson<Receta>(`/recetas/${id}/favorita`, { method: 'PATCH' })
}

export async function deleteReceta(id: string): Promise<void> {
  const res = await apiFetch(`/recetas/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string })
    throw new Error(body.error ?? `Error ${res.status}`)
  }
}

export async function restoreReceta(id: string): Promise<Receta> {
  return apiJson<Receta>(`/recetas/${id}/restaurar`, { method: 'POST' })
}
