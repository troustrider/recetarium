import type { ReactNode } from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// El deshacer es "vuelve a escribir el estado de antes". Lo que se comprueba
// aquí es que la ranura única se comporta (una acción tapa a la anterior, se
// caduca sola, no se puede deshacer dos veces) y que restaurar de verdad
// devuelve la despensa a como estaba.

const api = vi.hoisted(() => ({
  getDespensa: vi.fn().mockResolvedValue([]),
  saveDespensa: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../api/estado', () => api)

const { DeshacerProvider, useDeshacer } = await import('../context/DeshacerContext')
const { DespensaProvider, useDespensa } = await import('../context/DespensaContext')

const soloDeshacer = ({ children }: { children: ReactNode }) => <DeshacerProvider>{children}</DeshacerProvider>

const conDespensa = ({ children }: { children: ReactNode }) => (
  <DeshacerProvider>
    <DespensaProvider>{children}</DespensaProvider>
  </DeshacerProvider>
)

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  api.getDespensa.mockResolvedValue([])
})

describe('ranura de deshacer', () => {
  it('guarda la acción y la ofrece con su mensaje', () => {
    const { result } = renderHook(() => useDeshacer(), { wrapper: soloDeshacer })
    expect(result.current.pendiente).toBeNull()

    act(() => result.current.registrar('Semana vaciada', () => {}))
    expect(result.current.pendiente?.mensaje).toBe('Semana vaciada')
  })

  it('ejecuta el deshacer una sola vez y cierra el aviso', () => {
    const deshacer = vi.fn()
    const { result } = renderHook(() => useDeshacer(), { wrapper: soloDeshacer })

    act(() => result.current.registrar('Borrado tomate', deshacer))
    act(() => result.current.ejecutar())

    expect(deshacer).toHaveBeenCalledTimes(1)
    expect(result.current.pendiente).toBeNull()

    // Segundo intento sin nada pendiente: no vuelve a deshacer.
    act(() => result.current.ejecutar())
    expect(deshacer).toHaveBeenCalledTimes(1)
  })

  it('una acción nueva sustituye a la anterior', () => {
    const vieja = vi.fn()
    const nueva = vi.fn()
    const { result } = renderHook(() => useDeshacer(), { wrapper: soloDeshacer })

    act(() => result.current.registrar('Lista vaciada', vieja))
    act(() => result.current.registrar('Despensa vaciada', nueva))
    act(() => result.current.ejecutar())

    expect(vieja).not.toHaveBeenCalled()
    expect(nueva).toHaveBeenCalledTimes(1)
  })

  it('avisa a quien registró cuando la oferta se retira sin usarse', () => {
    const alCerrar = vi.fn()
    const { result } = renderHook(() => useDeshacer(), { wrapper: soloDeshacer })

    // Cerrar a mano.
    act(() => result.current.registrar('Receta editada', () => {}, alCerrar))
    act(() => result.current.descartar())
    expect(alCerrar).toHaveBeenCalledTimes(1)

    // Que llegue otra acción también retira la anterior.
    act(() => result.current.registrar('Receta editada', () => {}, alCerrar))
    act(() => result.current.registrar('Semana vaciada', () => {}))
    expect(alCerrar).toHaveBeenCalledTimes(2)

    // Deshacer de verdad no es "retirar sin usar": ahí no se avisa.
    act(() => result.current.registrar('Receta editada', () => {}, alCerrar))
    act(() => result.current.ejecutar())
    expect(alCerrar).toHaveBeenCalledTimes(2)
  })

  it('descartar cierra el aviso sin deshacer', () => {
    const deshacer = vi.fn()
    const { result } = renderHook(() => useDeshacer(), { wrapper: soloDeshacer })

    act(() => result.current.registrar('Compra cerrada', deshacer))
    act(() => result.current.descartar())

    expect(deshacer).not.toHaveBeenCalled()
    expect(result.current.pendiente).toBeNull()
  })
})

describe('caducidad', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('el aviso desaparece solo y ya no se puede deshacer', () => {
    const deshacer = vi.fn()
    const { result } = renderHook(() => useDeshacer(), { wrapper: soloDeshacer })

    act(() => result.current.registrar('Semana vaciada', deshacer))
    expect(result.current.pendiente).not.toBeNull()

    act(() => { vi.advanceTimersByTime(8000) })

    expect(result.current.pendiente).toBeNull()
    act(() => result.current.ejecutar())
    expect(deshacer).not.toHaveBeenCalled()
  })
})

describe('restaurar la despensa', () => {
  async function montar() {
    const montado = renderHook(
      () => ({ despensa: useDespensa(), deshacer: useDeshacer() }),
      { wrapper: conDespensa }
    )
    await waitFor(() => expect(api.getDespensa).toHaveBeenCalled())
    await act(async () => { await Promise.resolve() })
    return montado
  }

  it('devuelve los ingredientes borrados de uno en uno', async () => {
    const { result } = await montar()
    act(() => result.current.despensa.añadir('tomate', 'verduras'))
    act(() => result.current.despensa.añadir('pollo', 'carnes'))

    const anterior = result.current.despensa.despensa
    act(() => result.current.despensa.quitar('tomate'))
    expect(result.current.despensa.despensa.map((i) => i.nombre)).toEqual(['pollo'])

    act(() => result.current.despensa.restaurarDespensa(anterior))
    expect(result.current.despensa.despensa.map((i) => i.nombre).sort()).toEqual(['pollo', 'tomate'])
  })

  it('devuelve la despensa entera tras vaciarla', async () => {
    const { result } = await montar()
    act(() => result.current.despensa.añadir('arroz', 'cereales'))
    act(() => result.current.despensa.añadir('lentejas', 'legumbres'))

    const anterior = result.current.despensa.despensa
    act(() => {
      result.current.despensa.vaciar()
      result.current.deshacer.registrar('Despensa vaciada (2)', () =>
        result.current.despensa.restaurarDespensa(anterior)
      )
    })
    expect(result.current.despensa.despensa).toHaveLength(0)

    act(() => result.current.deshacer.ejecutar())
    expect(result.current.despensa.despensa.map((i) => i.nombre).sort()).toEqual(['arroz', 'lentejas'])
  })

  it('devuelve el stock que se gastó al marcar un plato como hecho', async () => {
    const { result } = await montar()
    act(() => result.current.despensa.añadir('arroz', 'cereales', { cantidad: 500, unidad: 'g' }))

    const anterior = result.current.despensa.despensa
    act(() => result.current.despensa.consumir([
      { nombre: 'arroz', familia: 'cereales', accion: 'restar', cantidad: 300, unidad: 'g', usadoPor: ['paella'] },
    ]))
    expect(result.current.despensa.despensa[0].cantidad).toBe(300)

    act(() => result.current.despensa.restaurarDespensa(anterior))
    expect(result.current.despensa.despensa[0].cantidad).toBe(500)
  })
})
