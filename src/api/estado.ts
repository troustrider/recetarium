import { apiJson, jsonBody } from './http'
import type { Ingrediente } from '../types/receta'

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

const guardar = (ruta: string, datos: unknown) =>
  apiJson<unknown>(ruta, { method: 'PUT', ...jsonBody(datos) }).then(() => undefined)

export const getPlan = () => apiJson<EntradaPlanDTO[]>('/plan')
export const savePlan = (plan: EntradaPlanDTO[]) => guardar('/plan', plan)

export const getPendientes = () => apiJson<PendientePlanDTO[]>('/pendientes')
export const savePendientes = (p: PendientePlanDTO[]) => guardar('/pendientes', p)

export const getDespensa = () => apiJson<IngredienteDespensaDTO[]>('/despensa')
export const saveDespensa = (d: IngredienteDespensaDTO[]) => guardar('/despensa', d)

export const getExtras = () => apiJson<Ingrediente[]>('/extras')
export const saveExtras = (e: Ingrediente[]) => guardar('/extras', e)
