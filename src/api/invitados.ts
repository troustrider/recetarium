import { apiFetch, apiJson, jsonBody } from './http'

export interface InvitadoDTO {
  email: string
  hogarId: string | null
  hogar: string | null
  rol: 'admin' | 'usuario'
  invitadoEn: string
  usadoEn: string | null
  haEntrado: boolean
}

export interface HogarDTO {
  id: string
  nombre: string
  miembros: number
}

export const getInvitados = () => apiJson<{ invitados: InvitadoDTO[]; hogares: HogarDTO[] }>('/admin/invitados')

export const invitar = (datos: { email: string; hogarId: string | null; rol: 'admin' | 'usuario' }) =>
  apiJson<InvitadoDTO>('/admin/invitados', { method: 'POST', ...jsonBody(datos) })

export async function retirarInvitacion(email: string): Promise<void> {
  const res = await apiFetch(`/admin/invitados/${encodeURIComponent(email)}`, { method: 'DELETE' })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string })
    throw new Error(body.error ?? `Error ${res.status}`)
  }
}
