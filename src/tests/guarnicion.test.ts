import { describe, it, expect } from 'vitest'
import { ingredientesDe } from '../utils/ingredientes'
import { consumoAlCocinar } from '../utils/consumo'
import type { Receta } from '../types/receta'

// La guarnición solo cuenta si se pide. `ingredientesDe` es el único sitio que
// lo decide, así que aquí se fija que respeta el interruptor y que sin él la
// receta se comporta exactamente igual que antes de existir la guarnición.

const RECETA: Receta = {
  id: 'r1',
  nombre: 'Pollo al curry',
  categoria: 'india',
  sabor: 'salado',
  tiempoPreparacion: 30,
  favorita: false,
  porciones: 2,
  ingredientes: [{ nombre: 'pollo', cantidad: 400, unidad: 'g', familia: 'carnes' }],
  pasos: ['Cocinar'],
  guarnicion: {
    nombre: 'Arroz blanco',
    ingredientes: [{ nombre: 'arroz', cantidad: 160, unidad: 'g', familia: 'cereales' }],
    pasos: ['Cocer 12 min'],
  },
}

const SIN_GUARNICION: Receta = { ...RECETA, guarnicion: null }

describe('ingredientesDe', () => {
  it('sin pedirla, devuelve solo los del plato', () => {
    expect(ingredientesDe(RECETA).map((i) => i.nombre)).toEqual(['pollo'])
    expect(ingredientesDe(RECETA, false).map((i) => i.nombre)).toEqual(['pollo'])
  })

  it('pidiéndola, añade los suyos detrás', () => {
    expect(ingredientesDe(RECETA, true).map((i) => i.nombre)).toEqual(['pollo', 'arroz'])
  })

  it('pedirla en una receta que no la tiene no rompe nada', () => {
    expect(ingredientesDe(SIN_GUARNICION, true).map((i) => i.nombre)).toEqual(['pollo'])
  })

  it('no muta el array de la receta', () => {
    ingredientesDe(RECETA, true)
    expect(RECETA.ingredientes).toHaveLength(1)
  })
})

describe('consumo de despensa', () => {
  const despensa = [
    { nombre: 'pollo', familia: 'carnes', cantidad: 1000, unidad: 'g' },
    { nombre: 'arroz', familia: 'cereales', cantidad: 500, unidad: 'g' },
  ]

  it('sin guarnición no toca el arroz', () => {
    const consumos = consumoAlCocinar([{ receta: RECETA, raciones: 2 }], despensa)
    expect(consumos.map((c) => c.nombre)).toEqual(['pollo'])
  })

  it('con guarnición descuenta también el arroz', () => {
    const consumos = consumoAlCocinar([{ receta: RECETA, raciones: 2, conGuarnicion: true }], despensa)
    const arroz = consumos.find((c) => c.nombre === 'arroz')
    expect(arroz).toBeTruthy()
    expect(arroz!.cantidad).toBe(340)
  })
})
