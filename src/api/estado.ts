import { apiJson, jsonBody } from './http'
import type { Ingrediente } from '../types/receta'
import type { Preferencias } from '../types/preferencias'

export interface EntradaPlanDTO {
  dia: string
  recetaId: string
  raciones: number
  cocinada?: boolean
  conGuarnicion?: boolean
}

export interface IngredienteDespensaDTO {
  nombre: string
  familia: string
  estado: 'lleno' | 'poco'
  caducidad?: string
  cantidad?: number
  unidad?: string
}

export interface PendientePlanDTO {
  recetaId: string
  raciones: number
}

// keepalive para que el PUT sobreviva a que el móvil cierre la app justo después.
const guardar = (ruta: string, datos: unknown) =>
  apiJson<unknown>(ruta, { method: 'PUT', keepalive: true, ...jsonBody(datos) }).then(() => undefined)

export const getPlan = () => apiJson<EntradaPlanDTO[]>('/plan')
export const savePlan = (plan: EntradaPlanDTO[]) => guardar('/plan', plan)

export const getPendientes = () => apiJson<PendientePlanDTO[]>('/pendientes')
export const savePendientes = (p: PendientePlanDTO[]) => guardar('/pendientes', p)

export const getDespensa = () => apiJson<IngredienteDespensaDTO[]>('/despensa')
export const saveDespensa = (d: IngredienteDespensaDTO[]) => guardar('/despensa', d)

export const getExtras = () => apiJson<Ingrediente[]>('/extras')
export const saveExtras = (e: Ingrediente[]) => guardar('/extras', e)

// El hogar que nunca las ha tocado recibe {}, no las de por defecto: quién
// decide el valor de partida es el front, en un solo sitio.
export const getPreferencias = () => apiJson<Partial<Preferencias>>('/preferencias')
export const savePreferencias = (p: Preferencias) => guardar('/preferencias', p)
