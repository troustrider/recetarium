import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import useListaCompra from '../hooks/useListaCompra'
import type { Receta } from '../types/receta'

// La lista de la compra tiene que enfrentar lo que piden las recetas con lo
// que hay guardado en la despensa, no solo mirar si el ingrediente existe.

const { despensa } = vi.hoisted(() => ({
  despensa: [
    { nombre: 'pollo', familia: 'carnes', estado: 'lleno', cantidad: 300, unidad: 'g' },
    { nombre: 'arroz', familia: 'cereales', estado: 'lleno', cantidad: 1, unidad: 'kg' },
    { nombre: 'salsa de soja', familia: 'salsas', estado: 'lleno' },
  ],
}))

vi.mock('../context/DespensaContext', () => ({ useDespensa: () => ({ despensa }) }))
vi.mock('../api/estado', () => ({
  getExtras: vi.fn().mockResolvedValue([]),
  saveExtras: vi.fn().mockResolvedValue(undefined),
}))

const receta: Receta = {
  id: 'r1', nombre: 'Pollo teriyaki', categoria: 'asiatica', sabor: 'umami',
  tiempoPreparacion: 25, favorita: false, pasos: [], precioPorPorcion: 2, porciones: 2,
  ingredientes: [
    { nombre: 'pechuga de pollo', cantidad: 500, unidad: 'g', familia: 'carnes' },
    { nombre: 'arroz', cantidad: 300, unidad: 'g', familia: 'cereales' },
    { nombre: 'salsa de soja', cantidad: 2, unidad: 'cda', familia: 'salsas' },
    { nombre: 'brócoli', cantidad: 200, unidad: 'g', familia: 'verduras' },
  ],
}

describe('useListaCompra — cantidades de la despensa', () => {
  it('compra solo la diferencia y aparta lo que ya está cubierto', () => {
    const { result } = renderHook(() => useListaCompra())
    act(() => result.current.toggleReceta(receta))

    const comprar = new Map(result.current.listaCompra.map((i) => [i.nombre, i]))
    // 500 g piden, 300 g hay
    expect(comprar.get('pechuga de pollo')).toMatchObject({ cantidad: 200, yaTengo: 300 })
    // no hay nada de brócoli
    expect(comprar.get('brócoli')).toMatchObject({ cantidad: 200 })
    expect(comprar.get('brócoli')?.yaTengo).toBeUndefined()

    const cubierto = result.current.enDespensa.map((i) => i.nombre)
    expect(cubierto).toContain('arroz') // 1 kg cubre 300 g
    expect(cubierto).toContain('salsa de soja') // sin cantidad: basta con tenerla
  })

  it('escala con las raciones antes de restar', () => {
    const { result } = renderHook(() => useListaCompra())
    act(() => result.current.toggleReceta(receta))
    act(() => result.current.setRaciones('r1', 2))

    const pollo = result.current.listaCompra.find((i) => i.nombre === 'pechuga de pollo')
    expect(pollo).toMatchObject({ cantidad: 700, yaTengo: 300 })
    // 600 g de arroz siguen cabiendo en el kilo
    expect(result.current.enDespensa.map((i) => i.nombre)).toContain('arroz')
  })
})
