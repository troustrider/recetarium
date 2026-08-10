import { cabeceraSesion } from '../auth'

export interface SesionDTO {
  id: string
  email: string
  ip: string | null
  agente: string | null
  creadaEn: string
  caducaEn: string
  activa: boolean
}

export interface ResumenUsuarioDTO {
  email: string
  sesiones: number
  activas: number
  ips: number
  dispositivos: number
  ultimoAcceso: string
}

export interface IpNuevaDTO {
  email: string
  ip: string
  vistaPrimeroEn: string
  veces: number
}

export interface PanelSesiones {
  sesiones: SesionDTO[]
  resumen: ResumenUsuarioDTO[]
  ipsNuevas: IpNuevaDTO[]
  dias: number
}

const BASE = import.meta.env.VITE_API_URL ?? '/api/v1'

export async function getPanelSesiones(dias = 7): Promise<PanelSesiones> {
  const res = await fetch(`${BASE}/admin/sesiones?dias=${dias}`, { headers: await cabeceraSesion() })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Error ${res.status}`)
  }
  return res.json() as Promise<PanelSesiones>
}
