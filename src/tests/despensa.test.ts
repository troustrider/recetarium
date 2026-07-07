import { describe, it, expect } from 'vitest'
import { despensaCubre, mismoIngrediente, estaEnDespensa, faltantes } from '../utils/despensa'
import type { Receta } from '../types/receta'

// Estos tests fijan el matching despensa↔receta. Si vuelven a rojo, el
// catálogo de recetas quedó desalineado con cómo se escribe la despensa.

describe('despensaCubre — falsos negativos que rompían la disponibilidad', () => {
  it('ignora el conector "de" ("aceite oliva" ↔ "aceite de oliva")', () => {
    expect(despensaCubre('aceite oliva', 'aceite de oliva')).toBe(true)
    expect(despensaCubre('carne picada ternera', 'carne picada de ternera')).toBe(true)
    expect(despensaCubre('leche coco', 'leche de coco')).toBe(true)
    expect(despensaCubre('copos avena', 'copos de avena')).toBe(true)
  })

  it('un genérico de despensa cubre el corte específico de la receta', () => {
    expect(despensaCubre('pollo', 'pechuga de pollo')).toBe(true)
    expect(despensaCubre('pollo', 'contramuslos de pollo')).toBe(true)
    expect(despensaCubre('pollo', 'pollo picado')).toBe(true)
  })

  it('un específico de despensa cubre el genérico de la receta', () => {
    expect(despensaCubre('arroz jasmine', 'arroz')).toBe(true)
    expect(despensaCubre('tomate frito', 'tomate')).toBe(true)
    expect(despensaCubre('brócoli congelado', 'brócoli')).toBe(true)
  })

  it('tolera acentos y plurales', () => {
    expect(despensaCubre('atún', 'atun en lata al natural')).toBe(true)
    expect(despensaCubre('patatas', 'patata')).toBe(true)
    expect(despensaCubre('gambas congeladas', 'gambas')).toBe(true)
  })

  it('resuelve alias/variantes de escritura (tabla de alias)', () => {
    expect(despensaCubre('ketjap mani', 'kecap manis')).toBe(true)
    expect(despensaCubre('langostinos', 'gambas')).toBe(true)
    expect(despensaCubre('culantro', 'cilantro')).toBe(true)
  })
})

describe('despensaCubre — no debe inventar disponibilidad', () => {
  it('no funde productos distintos que comparten cabeza', () => {
    expect(despensaCubre('aceite girasol', 'aceite de oliva')).toBe(false)
    expect(despensaCubre('salsa ajo', 'salsa de soja')).toBe(false)
    expect(despensaCubre('vino blanco', 'vino tinto')).toBe(false)
  })

  it('una cabeza ambigua genérica no cubre el específico', () => {
    // tener "leche" a secas no da por buena "leche de coco"
    expect(despensaCubre('leche', 'leche de coco')).toBe(false)
    expect(despensaCubre('harina', 'harina de almendra')).toBe(false)
  })

  it('ingredientes sin relación no casan', () => {
    expect(despensaCubre('pollo', 'salmón')).toBe(false)
    expect(despensaCubre('garbanzos', 'lentejas')).toBe(false)
  })
})

describe('mismoIngrediente — simétrico, para dedup de despensa y lista', () => {
  it('iguala variantes con conector/acento pero distingue descriptores', () => {
    expect(mismoIngrediente('aceite oliva', 'aceite de oliva')).toBe(true)
    expect(mismoIngrediente('arroz', 'arroz integral')).toBe(false)
    expect(mismoIngrediente('pollo', 'pechuga de pollo')).toBe(false)
  })
})

describe('faltantes / estaEnDespensa', () => {
  const receta: Receta = {
    id: '1', nombre: 'Pasta con pollo', categoria: 'x', sabor: 'salado',
    tiempoPreparacion: 20, favorita: false, pasos: [],
    ingredientes: [
      { nombre: 'pechuga de pollo', cantidad: 200, unidad: 'g', familia: 'carnes' },
      { nombre: 'aceite de oliva', cantidad: 1, unidad: 'cda', familia: 'otros' },
      { nombre: 'sal', cantidad: 1, unidad: 'al gusto', familia: 'especias' },
      { nombre: 'perejil', cantidad: 1, unidad: 'puñado', familia: 'verduras' },
    ],
  }
  const despensa = [{ nombre: 'pollo' }, { nombre: 'aceite oliva' }]

  it('cubre por cocina y descuenta "al gusto"; solo falta lo que no hay', () => {
    expect(faltantes(receta, despensa)).toEqual(['perejil'])
  })

  it('estaEnDespensa usa igualdad simétrica', () => {
    expect(estaEnDespensa('aceite de oliva', despensa)).toBe(true)
    expect(estaEnDespensa('pechuga de pollo', despensa)).toBe(false)
  })
})
