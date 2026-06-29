import { authedFetch } from './auth'

export interface EntradaPlanDTO {
  dia: string
  recetaId: string
  raciones: number
}

const BASE = import.meta.env.VITE_API_URL ?? '/api/v1'
const URL_PLAN = `${BASE}/plan`

export async function getPlan(): Promise<EntradaPlanDTO[]> {
  const res = await fetch(URL_PLAN)
  if (!res.ok) throw new Error(`Error ${res.status}`)
  return res.json() as Promise<EntradaPlanDTO[]>
}

export async function savePlan(plan: EntradaPlanDTO[]): Promise<void> {
  const res = await authedFetch(URL_PLAN, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(plan),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Error ${res.status}`)
  }
}
