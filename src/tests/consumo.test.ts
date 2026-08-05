import { describe, it, expect } from 'vitest'
import { consumoAlCocinar } from '../utils/consumo'
import type { Receta } from '../types/receta'

// Vaciar la despensa al cocinar es destructivo y encima compartido con la
// pareja: lo que se fija aquí es sobre todo lo que NO debe borrarse.

function receta(ingredientes: Receta['ingredientes'], porciones = 2): Receta {
  return {
    id: 'r1', nombre: 'Test', categoria: 'test', sabor: 'salado', tiempoPreparacion: 10,
    favorita: false, pasos: [], porciones, precioPorPorcion: 1, ingredientes,
  }
}

const ing = (nombre: string, cantidad: number, unidad: string, familia = 'otros') =>
  ({ nombre, cantidad, unidad, familia })

describe('consumoAlCocinar', () => {
  it('resta la cantidad usada del stock guardado', () => {
    const plato = receta([ing('pechuga de pollo', 300, 'g', 'carnes')])
    const [c] = consumoAlCocinar(
      [{ receta: plato, raciones: 2 }],
      [{ nombre: 'pollo', familia: 'carnes', cantidad: 800, unidad: 'g' }]
    )
    expect(c.accion).toBe('restar')
    expect(c.cantidad).toBe(500)
    expect(c.usadoPor).toEqual(['pechuga de pollo'])
  })

  it('escala por raciones sobre las porciones de la receta', () => {
    const plato = receta([ing('arroz', 200, 'g', 'cereales')], 2)
    const [c] = consumoAlCocinar(
      [{ receta: plato, raciones: 4 }],
      [{ nombre: 'arroz', familia: 'cereales', cantidad: 1, unidad: 'kg' }]
    )
    expect(c.cantidad).toBe(0.6) // 1 kg − 400 g
  })

  it('quita el ingrediente cuando el stock se queda a cero', () => {
    const plato = receta([ing('arroz', 500, 'g', 'cereales')])
    const [c] = consumoAlCocinar(
      [{ receta: plato, raciones: 2 }],
      [{ nombre: 'arroz', familia: 'cereales', cantidad: 500, unidad: 'g' }]
    )
    expect(c.accion).toBe('quitar')
  })

  it('sin cantidad guardada el ingrediente se da por gastado', () => {
    const plato = receta([ing('tomate', 2, 'ud', 'verduras')])
    const [c] = consumoAlCocinar(
      [{ receta: plato, raciones: 2 }],
      [{ nombre: 'tomate', familia: 'verduras' }]
    )
    expect(c.accion).toBe('quitar')
  })

  it('las unidades de cocina no vacían nada: una cucharada no se lleva la botella', () => {
    const plato = receta([
      ing('aceite de oliva', 2, 'cucharadas', 'condimentos'),
      ing('ajo', 1, 'diente', 'verduras'),
    ])
    const consumos = consumoAlCocinar([{ receta: plato, raciones: 2 }], [
      { nombre: 'aceite de oliva', familia: 'condimentos' },
      { nombre: 'ajo', familia: 'verduras' },
    ])
    expect(consumos).toEqual([])
  })

  it('la sal y la pimienta al gusto nunca salen de la despensa', () => {
    const plato = receta([ing('sal', 1, 'g', 'condimentos')])
    const consumos = consumoAlCocinar(
      [{ receta: plato, raciones: 2 }],
      [{ nombre: 'sal', familia: 'condimentos', cantidad: 500, unidad: 'g' }]
    )
    expect(consumos).toEqual([])
  })

  it('un stock que no se puede convertir se deja intacto', () => {
    const plato = receta([ing('leche', 2, 'ud', 'lácteos')])
    const consumos = consumoAlCocinar(
      [{ receta: plato, raciones: 2 }],
      [{ nombre: 'leche', familia: 'lácteos', cantidad: 1, unidad: 'l' }]
    )
    expect(consumos).toEqual([])
  })

  it('no toca lo que no está en la despensa', () => {
    const plato = receta([ing('salmón', 200, 'g', 'pescados')])
    expect(consumoAlCocinar([{ receta: plato, raciones: 2 }], [
      { nombre: 'arroz', familia: 'cereales', cantidad: 500, unidad: 'g' },
    ])).toEqual([])
  })

  it('dos ingredientes que casan con el mismo bote lo descuentan una sola vez', () => {
    const plato = receta([
      ing('pechuga de pollo', 200, 'g', 'carnes'),
      ing('muslo de pollo', 100, 'g', 'carnes'),
    ])
    const consumos = consumoAlCocinar(
      [{ receta: plato, raciones: 2 }],
      [{ nombre: 'pollo', familia: 'carnes', cantidad: 1, unidad: 'kg' }]
    )
    expect(consumos).toHaveLength(1)
    expect(consumos[0].cantidad).toBe(0.7)
    expect(consumos[0].usadoPor).toEqual(['pechuga de pollo', 'muslo de pollo'])
  })

  it('gastar más de lo que hay no deja stock negativo', () => {
    const plato = receta([ing('arroz', 900, 'g', 'cereales')])
    const [c] = consumoAlCocinar(
      [{ receta: plato, raciones: 2 }],
      [{ nombre: 'arroz', familia: 'cereales', cantidad: 500, unidad: 'g' }]
    )
    expect(c.accion).toBe('quitar')
  })
})
