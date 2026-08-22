import type { ReactNode } from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MAX_COCINAS, MAX_PRIORIDADES } from '../types/preferencias'

const api = vi.hoisted(() => ({
  getPreferencias: vi.fn().mockResolvedValue({}),
  savePreferencias: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../api/estado', () => api)

const { PreferenciasProvider, usePreferencias } = await import('../context/PreferenciasContext')

const envoltorio = ({ children }: { children: ReactNode }) => (
  <PreferenciasProvider>{children}</PreferenciasProvider>
)

async function montar() {
  const montado = renderHook(() => usePreferencias(), { wrapper: envoltorio })
  await waitFor(() => expect(api.getPreferencias).toHaveBeenCalled())
  await act(async () => { await Promise.resolve() })
  return montado
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  api.getPreferencias.mockResolvedValue({})
})

describe('preferencias del hogar', () => {
  it('un hogar que no las ha tocado arranca con las de por defecto', async () => {
    const { result } = await montar()
    expect(result.current.preferencias.prioridades).toEqual([])
    expect(result.current.preferencias.desayunos).toBe(3)
    expect(result.current.preferencias.limites.dieta).toBe(null)
  })

  it('completa lo que falte de unas preferencias guardadas a medias', async () => {
    api.getPreferencias.mockResolvedValue({ prioridades: ['fibra'] })
    const { result } = await montar()

    await waitFor(() => expect(result.current.preferencias.prioridades).toEqual(['fibra']))
    expect(result.current.preferencias.desayunos).toBe(3)
    expect(result.current.preferencias.limites).toMatchObject({ sinGluten: false, vetados: [] })
  })

  it('alternar una prioridad la mete y la vuelve a sacar', async () => {
    const { result } = await montar()
    act(() => result.current.alternarPrioridad('menosSal'))
    expect(result.current.preferencias.prioridades).toEqual(['menosSal'])

    act(() => result.current.alternarPrioridad('menosSal'))
    expect(result.current.preferencias.prioridades).toEqual([])
  })

  it('al pasarse del tope sale la más antigua, no hay que quitar una a mano', async () => {
    const { result } = await montar()
    act(() => result.current.alternarPrioridad('proteina'))
    act(() => result.current.alternarPrioridad('fibra'))
    act(() => result.current.alternarPrioridad('hierro'))
    act(() => result.current.alternarPrioridad('ligera'))

    expect(result.current.preferencias.prioridades).toHaveLength(MAX_PRIORIDADES)
    expect(result.current.preferencias.prioridades).toEqual(['fibra', 'hierro', 'ligera'])
  })

  it('las cocinas favoritas tienen su propio tope', async () => {
    const { result } = await montar()
    for (const c of ['japonesa', 'italiana', 'coreana', 'griega', 'turca']) {
      act(() => result.current.alternarCocina(c))
    }
    expect(result.current.preferencias.cocinasFavoritas).toHaveLength(MAX_COCINAS)
    expect(result.current.preferencias.cocinasFavoritas).not.toContain('japonesa')
    expect(result.current.preferencias.cocinasFavoritas).toContain('turca')
  })

  it('los desayunos se acotan a la semana', async () => {
    const { result } = await montar()
    act(() => result.current.setHuecos('desayunos', 99))
    expect(result.current.preferencias.desayunos).toBe(7)

    act(() => result.current.setHuecos('desayunos', -2))
    expect(result.current.preferencias.desayunos).toBe(0)
  })

  it('los límites se tocan de uno en uno sin borrar los demás', async () => {
    const { result } = await montar()
    act(() => result.current.setLimites({ sinGluten: true }))
    act(() => result.current.setLimites({ tiempoMax: 25 }))

    expect(result.current.preferencias.limites).toMatchObject({ sinGluten: true, tiempoMax: 25 })
  })

  it('guarda en el servidor lo que se cambia', async () => {
    const { result } = await montar()
    act(() => result.current.alternarPrioridad('hierro'))

    await waitFor(() => expect(api.savePreferencias).toHaveBeenCalled(), { timeout: 3000 })
    expect(api.savePreferencias).toHaveBeenCalledWith(
      expect.objectContaining({ prioridades: ['hierro'], desayunos: 3 })
    )
  })
})
