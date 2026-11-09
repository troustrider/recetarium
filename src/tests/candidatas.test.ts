import { describe, it, expect } from 'vitest'
import type { RecetaListada } from '../types/receta'
import { LIMITES_VACIOS } from '../types/preferencias'
import { cumpleLimites } from '../utils/candidatas'

function plato(...nombres: string[]): RecetaListada {
  return {
    id: 'p', nombre: 'Plato', categoria: 'test', sabor: 'salado', tiempoPreparacion: 20,
    favorita: false, porciones: 1, precioPorPorcion: 2,
    ingredientes: nombres.map((nombre) => ({ nombre, cantidad: 1, unidad: 'ud', familia: 'otros' })),
  }
}

const pasa = (vetado: string, ...ingredientes: string[]) =>
  cumpleLimites(plato(...ingredientes), { ...LIMITES_VACIOS, vetados: [vetado] }, null)

describe('vetados por palabra completa', () => {
  it('vetar salmón no saca lo que lleva sal', () => {
    expect(pasa('salmón', 'sal', 'tomate')).toBe(true)
  })

  it('vetar tomate cherry no saca el tomate normal', () => {
    expect(pasa('tomate cherry', 'tomate')).toBe(true)
  })

  it('vetar queso feta no saca cualquier queso', () => {
    expect(pasa('queso feta', 'queso')).toBe(true)
    expect(pasa('queso feta', 'queso manchego')).toBe(true)
  })

  it('vetar arroz no saca el vinagre de arroz', () => {
    expect(pasa('arroz', 'vinagre de arroz', 'pepino')).toBe(true)
  })

  it('vetar pan no saca la panceta', () => {
    expect(pasa('pan', 'panceta')).toBe(true)
  })

  it('pollo saca el pollo y la pechuga de pollo', () => {
    expect(pasa('pollo', 'pollo')).toBe(false)
    expect(pasa('pollo', 'pechuga de pollo')).toBe(false)
  })

  it('pan saca el pan de pita y el de centeno', () => {
    expect(pasa('pan', 'pan de pita')).toBe(false)
    expect(pasa('pan', 'pan de centeno')).toBe(false)
  })

  it('huevo casa con huevos, y al revés', () => {
    expect(pasa('huevo', 'huevos')).toBe(false)
    expect(pasa('huevos', 'huevo')).toBe(false)
  })

  it('casa sin mirar tildes ni mayúsculas', () => {
    expect(pasa('Salmón', 'salmon ahumado')).toBe(false)
  })

  it('vetados e ingredientes vacíos no casan con nada', () => {
    expect(pasa('  ', 'pollo')).toBe(true)
    expect(pasa('pollo', '')).toBe(true)
  })
})

describe('la guarnición cumple todos los filtros a la vez', () => {
  const guarnicion = (id: string, nombre: string, sinGluten: boolean) => ({
    id, nombre, aporta: [], sinGluten,
    ingredientes: [{ nombre, cantidad: 1, unidad: 'ud', familia: 'otros' }],
  })

  it('no vale una guarnición sin gluten y otra sin el vetado: tiene que ser la misma', () => {
    const receta = {
      ...plato('arroz'),
      sinGluten: true,
      guarniciones: [guarnicion('g1', 'pollo', true), guarnicion('g2', 'pan', false)],
    }
    const limites = { ...LIMITES_VACIOS, sinGluten: true, vetados: ['pollo'] }
    expect(cumpleLimites(receta, limites, null)).toBe(false)
  })

  it('con una que cumple todo, el plato pasa', () => {
    const receta = {
      ...plato('arroz'),
      sinGluten: true,
      guarniciones: [guarnicion('g1', 'pollo', true), guarnicion('g2', 'pan', false), guarnicion('g3', 'ensalada', true)],
    }
    const limites = { ...LIMITES_VACIOS, sinGluten: true, vetados: ['pollo'] }
    expect(cumpleLimites(receta, limites, null)).toBe(true)
  })
})
