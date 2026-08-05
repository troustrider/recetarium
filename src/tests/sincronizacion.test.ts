import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useEstadoCompartido } from '../hooks/useEstadoCompartido'
import { leer, reintentarTodo, reiniciarSincronizacion } from '../utils/sincronizacion'

// Antes, un guardado fallido moría en un .catch(() => {}) y la app seguía
// enseñando el cambio como si estuviera compartido con el otro dispositivo.

const cargar = vi.fn()
const guardar = vi.fn()

function montar(nombre = 'la despensa') {
  return renderHook(() =>
    useEstadoCompartido<string[], string[]>({
      nombre,
      inicial: [],
      cargar,
      guardar,
      serializar: (e) => e,
      hidratar: (dto) => dto,
      retardo: 10,
    })
  )
}

async function hidratado(nombre?: string) {
  const montado = montar(nombre)
  await waitFor(() => expect(cargar).toHaveBeenCalled())
  await act(async () => { await Promise.resolve() })
  return montado
}

beforeEach(() => {
  vi.clearAllMocks()
  reiniciarSincronizacion()
  cargar.mockResolvedValue([])
  guardar.mockResolvedValue(undefined)
})

describe('guardado correcto', () => {
  it('no deja ningún fallo registrado', async () => {
    const { result } = await hidratado()
    act(() => result.current[1](['tomate']))

    await waitFor(() => expect(guardar).toHaveBeenCalledWith(['tomate']))
    await waitFor(() => expect(leer().fallos).toEqual([]))
  })
})

describe('guardado fallido', () => {
  it('registra el fallo con el nombre que ve el usuario', async () => {
    guardar.mockRejectedValue(new Error('sin red'))
    const { result } = await hidratado('la despensa')
    act(() => result.current[1](['tomate']))

    await waitFor(() => expect(leer().fallos).toEqual(['la despensa']))
  })

  it('no descarta el cambio: sigue en pantalla', async () => {
    guardar.mockRejectedValue(new Error('sin red'))
    const { result } = await hidratado()
    act(() => result.current[1](['tomate']))

    await waitFor(() => expect(leer().fallos).toHaveLength(1))
    expect(result.current[0]).toEqual(['tomate'])
  })

  it('un 401 por clave incorrecta también se registra', async () => {
    guardar.mockRejectedValue(new Error('Clave incorrecta o ausente'))
    const { result } = await hidratado()
    act(() => result.current[1](['tomate']))

    await waitFor(() => expect(leer().fallos).toEqual(['la despensa']))
  })

  it('acumula los fallos de varios trozos del estado', async () => {
    guardar.mockRejectedValue(new Error('sin red'))
    const a = await hidratado('la despensa')
    const b = await hidratado('el plan de la semana')
    act(() => a.result.current[1](['tomate']))
    act(() => b.result.current[1](['lunes']))

    await waitFor(() => expect(leer().fallos.sort()).toEqual(['el plan de la semana', 'la despensa']))
  })

  it('un guardado posterior que sí funciona limpia el aviso', async () => {
    guardar.mockRejectedValue(new Error('sin red'))
    const { result } = await hidratado()
    act(() => result.current[1](['tomate']))
    await waitFor(() => expect(leer().fallos).toHaveLength(1))

    guardar.mockResolvedValue(undefined)
    act(() => result.current[1](['tomate', 'arroz']))

    await waitFor(() => expect(leer().fallos).toEqual([]))
  })
})

describe('reintentar', () => {
  it('vuelve a intentarlo y limpia el aviso si va bien', async () => {
    guardar.mockRejectedValue(new Error('sin red'))
    const { result } = await hidratado()
    act(() => result.current[1](['tomate']))
    await waitFor(() => expect(leer().fallos).toHaveLength(1))

    guardar.mockResolvedValue(undefined)
    await act(async () => { await reintentarTodo() })

    expect(leer().fallos).toEqual([])
  })

  it('sube el estado actual, no el que falló', async () => {
    guardar.mockRejectedValue(new Error('sin red'))
    const { result } = await hidratado()
    act(() => result.current[1](['tomate']))
    await waitFor(() => expect(leer().fallos).toHaveLength(1))

    // El usuario sigue tocando la despensa mientras no hay red.
    act(() => result.current[1](['tomate', 'arroz']))
    await waitFor(() => expect(guardar).toHaveBeenCalledTimes(2))

    guardar.mockResolvedValue(undefined)
    await act(async () => { await reintentarTodo() })

    expect(guardar).toHaveBeenLastCalledWith(['tomate', 'arroz'])
    expect(leer().fallos).toEqual([])
  })

  it('si vuelve a fallar, el aviso se queda', async () => {
    guardar.mockRejectedValue(new Error('sin red'))
    const { result } = await hidratado()
    act(() => result.current[1](['tomate']))
    await waitFor(() => expect(leer().fallos).toHaveLength(1))

    await act(async () => { await reintentarTodo() })

    expect(leer().fallos).toEqual(['la despensa'])
  })
})
