import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import useListaCompra from '../hooks/useListaCompra'
import { envaseDe } from '../utils/desperdicio'
import type { Receta } from '../types/receta'

vi.mock('../context/DespensaContext', () => ({ useDespensa: () => ({ despensa: [] }) }))
vi.mock('../api/estado', () => ({
  getExtras: vi.fn().mockResolvedValue([]),
  saveExtras: vi.fn().mockResolvedValue(undefined),
}))

const receta = (id: string, nombre: string, gramos: number): Receta => ({
  id, nombre, categoria: 'italiana', sabor: 'salado',
  tiempoPreparacion: 20, favorita: false, pasos: [], precioPorPorcion: 2, porciones: 2,
  ingredientes: [{ nombre: 'espinacas', cantidad: gramos, unidad: 'g', familia: 'verduras' }],
})

describe('useListaCompra — la cuenta en envases enteros', () => {
  it('paga el envase entero y cuenta lo que se va a estropear', () => {
    const envase = envaseDe('espinacas')
    if (!envase) return
    const { result } = renderHook(() => useListaCompra())
    act(() => result.current.toggleReceta(receta('r1', 'Espinacas al ajo', 100)))

    expect(result.current.cuenta.pagado).toBeCloseTo(envase.euros, 2)
    expect(result.current.cuenta.tirado).toBeGreaterThan(0)
    expect(result.current.cuenta.lineas[0].nombre).toBe('espinacas')
  })

  it('un segundo plato que se acabe la bolsa rescata lo que se tiraba', () => {
    if (!envaseDe('espinacas')) return
    const { result } = renderHook(() => useListaCompra())
    act(() => result.current.toggleReceta(receta('r1', 'Espinacas al ajo', 100)))
    const solo = result.current.cuenta.tirado

    act(() => result.current.toggleReceta(receta('r2', 'Crema de espinacas', 150)))
    expect(result.current.cuenta.tirado).toBeLessThan(solo)
  })
})
