import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import useRecetas from '../hooks/useRecetas'
import type { Receta } from '../types/receta'

const original: Receta = {
  id: 'r1', nombre: 'Arroz caldoso de gambas', categoria: 'espanola', sabor: 'salado',
  tiempoPreparacion: 35, favorita: false,
  ingredientes: [
    { nombre: 'gambas', cantidad: 400, unidad: 'g', familia: 'pescados' },
    { nombre: 'arroz', cantidad: 300, unidad: 'g', familia: 'cereales' },
  ],
  pasos: ['Saltea las gambas 2 min.'],
}

const editada: Receta = {
  ...original,
  ingredientes: [{ nombre: 'arroz', cantidad: 300, unidad: 'g', familia: 'cereales' }],
}

const { mockGet, mockUpdate } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockUpdate: vi.fn(),
}))

vi.mock('../api/client', () => ({
  getRecetas: mockGet,
  createReceta: vi.fn(),
  updateReceta: mockUpdate,
  deleteReceta: vi.fn(),
  toggleFavorita: vi.fn(),
}))

function sinMeta(r: Receta) {
  const { id: _id, favorita: _fav, ...resto } = r
  return resto
}

describe('useRecetas — deshacer edición', () => {
  beforeEach(() => {
    mockGet.mockResolvedValue([original])
    mockUpdate.mockImplementation(async (_id: string, data: object) => ({
      ...original, ...data,
    }))
  })

  it('guarda snapshot de la versión anterior al actualizar', async () => {
    const { result } = renderHook(() => useRecetas())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.actualizar('r1', sinMeta(editada), sinMeta(original))
    })

    expect(result.current.ultimaEdicion?.id).toBe('r1')
    expect(result.current.ultimaEdicion?.anterior.ingredientes).toHaveLength(2)
    expect(result.current.recetas[0].ingredientes).toHaveLength(1)
  })

  it('deshacer restaura la versión anterior vía PUT y limpia el snapshot', async () => {
    const { result } = renderHook(() => useRecetas())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.actualizar('r1', sinMeta(editada), sinMeta(original))
    })
    let ok = false
    await act(async () => {
      ok = await result.current.deshacer()
    })

    expect(ok).toBe(true)
    expect(mockUpdate).toHaveBeenLastCalledWith('r1', sinMeta(original))
    expect(result.current.recetas[0].ingredientes).toHaveLength(2)
    expect(result.current.ultimaEdicion).toBeNull()
  })

  it('descartarDeshacer limpia el snapshot sin tocar la API', async () => {
    const { result } = renderHook(() => useRecetas())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.actualizar('r1', sinMeta(editada), sinMeta(original))
    })
    const llamadas = mockUpdate.mock.calls.length
    act(() => { result.current.descartarDeshacer() })

    expect(result.current.ultimaEdicion).toBeNull()
    expect(mockUpdate.mock.calls.length).toBe(llamadas)
  })

  it('si el PUT de deshacer falla, conserva el snapshot y devuelve false', async () => {
    const { result } = renderHook(() => useRecetas())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.actualizar('r1', sinMeta(editada), sinMeta(original))
    })
    mockUpdate.mockRejectedValueOnce(new Error('network'))
    let ok = true
    await act(async () => {
      ok = await result.current.deshacer()
    })

    expect(ok).toBe(false)
    expect(result.current.ultimaEdicion?.id).toBe('r1')
  })
})
