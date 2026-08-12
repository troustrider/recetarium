import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useEstadoCompartido } from '../hooks/useEstadoCompartido'
import { leer, reintentarTodo, reiniciarSincronizacion } from '../utils/sincronizacion'

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
    guardar.mockRejectedValue(new Error('Sesión inválida o caducada'))
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

describe('revalidar al volver a la pestaña', () => {
  type Item = { nombre: string; familia: string; estado: string }

  function montarObjetos() {
    return renderHook(() =>
      useEstadoCompartido<Item[], Item[]>({
        nombre: 'la despensa',
        inicial: [],
        cargar,
        guardar,
        serializar: (e) => e,
        hidratar: (dto) => dto,
        retardo: 10,
      })
    )
  }

  const volverALaPestana = async () => {
    await act(async () => {
      window.dispatchEvent(new Event('focus'))
      await new Promise((r) => setTimeout(r, 30))
    })
  }

  it('el mismo contenido con las claves en otro orden no toca el estado', async () => {
    cargar.mockResolvedValue([])
    const { result } = montarObjetos()
    await waitFor(() => expect(cargar).toHaveBeenCalled())
    await act(async () => { await Promise.resolve() })

    act(() => result.current[1]([{ nombre: 'tomate', familia: 'verduras', estado: 'lleno' }]))
    await waitFor(() => expect(guardar).toHaveBeenCalled())

    const antes = result.current[0]
    cargar.mockResolvedValue([{ estado: 'lleno', nombre: 'tomate', familia: 'verduras' }])
    await volverALaPestana()

    expect(result.current[0]).toBe(antes)
  })

  it('un cambio de verdad del otro dispositivo sí entra', async () => {
    cargar.mockResolvedValue([])
    const { result } = montarObjetos()
    await waitFor(() => expect(cargar).toHaveBeenCalled())
    await act(async () => { await Promise.resolve() })

    act(() => result.current[1]([{ nombre: 'tomate', familia: 'verduras', estado: 'lleno' }]))
    await waitFor(() => expect(guardar).toHaveBeenCalled())

    cargar.mockResolvedValue([{ estado: 'poco', nombre: 'tomate', familia: 'verduras' }])
    await volverALaPestana()

    expect(result.current[0][0].estado).toBe('poco')
  })

  it('lo que está sin guardar aquí no lo pisa el servidor', async () => {
    cargar.mockResolvedValue([])
    let resolverGuardado: () => void = () => {}
    guardar.mockImplementation(() => new Promise<void>((r) => { resolverGuardado = r }))

    const { result } = montarObjetos()
    await waitFor(() => expect(cargar).toHaveBeenCalled())
    await act(async () => { await Promise.resolve() })

    act(() => result.current[1]([{ nombre: 'puerro', familia: 'verduras', estado: 'lleno' }]))
    await waitFor(() => expect(guardar).toHaveBeenCalled())

    cargar.mockResolvedValue([{ estado: 'lleno', nombre: 'otra cosa', familia: 'otros' }])
    await volverALaPestana()

    expect(result.current[0][0].nombre).toBe('puerro')
    resolverGuardado()
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
