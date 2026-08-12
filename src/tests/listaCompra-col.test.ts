import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import useListaCompra from '../hooks/useListaCompra'
import type { Receta } from '../types/receta'

const { despensa } = vi.hoisted(() => ({
  despensa: [{ nombre: 'col', familia: 'verduras', estado: 'lleno' }],
}))

vi.mock('../context/DespensaContext', () => ({ useDespensa: () => ({ despensa }) }))
vi.mock('../api/estado', () => ({
  getExtras: vi.fn().mockResolvedValue([]),
  saveExtras: vi.fn().mockResolvedValue(undefined),
}))

const base = {
  categoria: 'asiatica', sabor: 'umami' as const, tiempoPreparacion: 20,
  favorita: false, pasos: [], precioPorPorcion: 2, porciones: 2,
}

const conColBlanca: Receta = {
  ...base, id: 'r1', nombre: 'Okonomiyaki',
  ingredientes: [{ nombre: 'col blanca', cantidad: 300, unidad: 'g', familia: 'verduras' }],
}

const conRepollo: Receta = {
  ...base, id: 'r2', nombre: 'Ensalada de repollo',
  ingredientes: [{ nombre: 'repollo', cantidad: 200, unidad: 'g', familia: 'verduras' }],
}

const conColChina: Receta = {
  ...base, id: 'r3', nombre: 'Salteado de col china',
  ingredientes: [{ nombre: 'col china', cantidad: 250, unidad: 'g', familia: 'verduras' }],
}

describe('useListaCompra — la col no se duplica ni se vuelve a comprar', () => {
  it('la col de la despensa cubre la col blanca de la receta', () => {
    const { result } = renderHook(() => useListaCompra())
    act(() => result.current.toggleReceta(conColBlanca))

    expect(result.current.listaCompra).toHaveLength(0)
    expect(result.current.enDespensa.map((i) => i.nombre)).toEqual(['col'])
  })

  it('col blanca y repollo son una sola línea', () => {
    const { result } = renderHook(() => useListaCompra())
    act(() => result.current.toggleReceta(conColBlanca))
    act(() => result.current.toggleReceta(conRepollo))

    const col = result.current.enDespensa.filter((i) => i.nombre === 'col')
    expect(col).toHaveLength(1)
    expect(col[0].recetas).toEqual(['Okonomiyaki', 'Ensalada de repollo'])
    expect(col[0].cantidad).toBe(500)
  })

  it('la col china sigue siendo otro producto y hay que comprarla', () => {
    const { result } = renderHook(() => useListaCompra())
    act(() => result.current.toggleReceta(conColChina))

    expect(result.current.listaCompra.map((i) => i.nombre)).toEqual(['col china'])
  })
})
