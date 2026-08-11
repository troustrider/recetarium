import { apiJson } from './http'

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

export const getPanelSesiones = (dias = 7) => apiJson<PanelSesiones>(`/admin/sesiones?dias=${dias}`)
