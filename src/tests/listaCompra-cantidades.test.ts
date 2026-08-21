import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import useListaCompra from '../hooks/useListaCompra'
import type { Receta } from '../types/receta'

const { despensa } = vi.hoisted(() => ({
  despensa: [
    { nombre: 'pollo', familia: 'carnes', estado: 'lleno', cantidad: 300, unidad: 'g' },
    { nombre: 'arroz', familia: 'cereales', estado: 'lleno', cantidad: 1, unidad: 'kg' },
    { nombre: 'salsa de soja', familia: 'salsas', estado: 'lleno' },
    { nombre: 'pepino', familia: 'verduras', estado: 'lleno', cantidad: 1, unidad: 'ud' },
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
    expect(comprar.get('pechuga de pollo')).toMatchObject({ cantidad: 200, yaTengo: 300 })
    expect(comprar.get('brócoli')).toMatchObject({ cantidad: 200 })
    expect(comprar.get('brócoli')?.yaTengo).toBeUndefined()

    const cubierto = result.current.enDespensa.map((i) => i.nombre)
    expect(cubierto).toContain('arroz') // 1 kg cubre 300 g
    expect(cubierto).toContain('salsa de soja') // sin cantidad: basta con tenerla
  })

  it('escala con las raciones antes de restar', () => {
    const { result } = renderHook(() => useListaCompra())
    act(() => result.current.toggleReceta(receta))
    act(() => result.current.setRaciones('r1', 4))

    const pollo = result.current.listaCompra.find((i) => i.nombre === 'pechuga de pollo')
    expect(pollo).toMatchObject({ cantidad: 700, yaTengo: 300 })
    expect(result.current.enDespensa.map((i) => i.nombre)).toContain('arroz')
  })
})

describe('useListaCompra — lo que va por piezas', () => {
  const conPepino = (cantidad: number, unidad = 'ud'): Receta => ({
    ...receta, id: 'r2', ingredientes: [{ nombre: 'pepino', cantidad, unidad, familia: 'verduras' }],
  })

  it('sube a la pieza entera lo que queda a medias tras descontar la despensa', () => {
    const { result } = renderHook(() => useListaCompra())
    act(() => result.current.toggleReceta(conPepino(1.5)))

    expect(result.current.listaCompra.find((i) => i.nombre === 'pepino'))
      .toMatchObject({ cantidad: 1, yaTengo: 1 })
  })

  it('media unidad sin nada en la despensa también se compra entera', () => {
    const { result } = renderHook(() => useListaCompra())
    act(() => result.current.toggleReceta({
      ...receta, id: 'r3', ingredientes: [{ nombre: 'calabacín', cantidad: 0.5, unidad: 'ud', familia: 'verduras' }],
    }))

    expect(result.current.listaCompra[0]).toMatchObject({ nombre: 'calabacín', cantidad: 1 })
  })

  it('lo que se pesa o se mide no se redondea', () => {
    const { result } = renderHook(() => useListaCompra())
    act(() => result.current.toggleReceta({
      ...receta, id: 'r4', ingredientes: [{ nombre: 'calabacín', cantidad: 250.5, unidad: 'g', familia: 'verduras' }],
    }))

    expect(result.current.listaCompra[0]).toMatchObject({ cantidad: 250.5, unidad: 'g' })
  })
})

describe('useListaCompra — el mismo ingrediente en dos unidades', () => {
  const enGramos: Receta = {
    ...receta, id: 'r5',
    ingredientes: [{ nombre: 'lechuga', cantidad: 100, unidad: 'g', familia: 'verduras' }],
  }
  const enHojas: Receta = {
    ...receta, id: 'r6',
    ingredientes: [{ nombre: 'lechuga', cantidad: 4, unidad: 'hojas', familia: 'verduras' }],
  }

  it('sale una sola fila, con la medida de la tienda delante', () => {
    const { result } = renderHook(() => useListaCompra())
    act(() => result.current.toggleReceta(enGramos))
    act(() => result.current.toggleReceta(enHojas))

    const filas = result.current.listaCompra.filter((i) => i.nombre === 'lechuga')
    expect(filas).toHaveLength(1)
    expect(filas[0]).toMatchObject({ cantidad: 100, unidad: 'g' })
    expect(filas[0].otrasMedidas).toEqual([{ cantidad: 4, unidad: 'hoja' }])
  })

  it('lo que comparte magnitud se suma en vez de quedarse al lado', () => {
    const { result } = renderHook(() => useListaCompra())
    act(() => result.current.toggleReceta(enGramos))
    act(() => result.current.toggleReceta({
      ...receta, id: 'r7',
      ingredientes: [{ nombre: 'lechuga', cantidad: 0.4, unidad: 'kg', familia: 'verduras' }],
    }))

    const lechuga = result.current.listaCompra.find((i) => i.nombre === 'lechuga')
    expect(lechuga).toMatchObject({ cantidad: 500, unidad: 'g' })
    expect(lechuga!.otrasMedidas).toBeUndefined()
  })
})
