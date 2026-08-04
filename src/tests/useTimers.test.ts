import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Los temporizadores del Modo cocina. La cuenta atrás va contra una marca de
// fin absoluta, no acumulando ticks, para no derivar cuando el navegador
// estrangula el intervalo en segundo plano.

const alarma = vi.hoisted(() => ({ desbloquearAudio: vi.fn(), sonarAlarma: vi.fn() }))
const notif = vi.hoisted(() => ({
  pedirPermisoNotificaciones: vi.fn().mockResolvedValue(true),
  notificarTemporizador: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../utils/alarma', () => alarma)
vi.mock('../utils/notificaciones', () => notif)

const { useTimers } = await import('../hooks/useTimers')

const spec = (id: string, segundos: number, stepIndex = 0) => ({
  id, etiqueta: `${segundos} s`, stepIndex, segundos,
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
})
afterEach(() => vi.useRealTimers())

function avanzar(segundos: number) {
  act(() => { vi.advanceTimersByTime(segundos * 1000) })
}

describe('arranque y cuenta atrás', () => {
  it('el primer toque crea el temporizador ya corriendo', () => {
    const { result } = renderHook(() => useTimers())
    act(() => result.current.toggle(spec('0-0', 60)))

    expect(result.current.timers).toHaveLength(1)
    expect(result.current.timers[0]).toMatchObject({ restante: 60, corriendo: true, hecho: false })
  })

  it('desbloquea el audio y pide permiso de notificaciones con el gesto', () => {
    const { result } = renderHook(() => useTimers())
    act(() => result.current.toggle(spec('0-0', 60)))

    expect(alarma.desbloquearAudio).toHaveBeenCalled()
    expect(notif.pedirPermisoNotificaciones).toHaveBeenCalled()
  })

  it('descuenta el tiempo transcurrido', () => {
    const { result } = renderHook(() => useTimers())
    act(() => result.current.toggle(spec('0-0', 60)))

    avanzar(10)
    expect(result.current.timers[0].restante).toBe(50)
  })

  it('no deriva: el restante sale de la marca de fin, no de contar ticks', () => {
    const { result } = renderHook(() => useTimers())
    act(() => result.current.toggle(spec('0-0', 120)))

    // Simula el navegador estrangulando el intervalo: un solo salto grande.
    avanzar(45)
    expect(result.current.timers[0].restante).toBe(75)
  })
})

describe('fin del temporizador', () => {
  it('al llegar a cero marca hecho y para', () => {
    const { result } = renderHook(() => useTimers())
    act(() => result.current.toggle(spec('0-0', 5)))
    avanzar(6)

    expect(result.current.timers[0]).toMatchObject({ restante: 0, corriendo: false, hecho: true, finAt: null })
  })

  it('avisa una sola vez, no una por tick', () => {
    const { result } = renderHook(() => useTimers())
    act(() => result.current.toggle(spec('0-0', 5)))

    avanzar(6)
    expect(alarma.sonarAlarma).toHaveBeenCalledTimes(1)
    expect(notif.notificarTemporizador).toHaveBeenCalledTimes(1)

    avanzar(10)
    expect(alarma.sonarAlarma).toHaveBeenCalledTimes(1)
    expect(notif.notificarTemporizador).toHaveBeenCalledTimes(1)
  })

  it('la notificación dice el paso y la etiqueta, y usa el id como tag', () => {
    const { result } = renderHook(() => useTimers())
    act(() => result.current.toggle(spec('2-1', 5, 2)))
    avanzar(6)

    expect(notif.notificarTemporizador).toHaveBeenCalledWith(
      'Recetarium — ¡tiempo!',
      'Paso 3 · 5 s listo',
      '2-1'
    )
  })

  it('dos que acaban en el mismo tick suenan una vez pero notifican por separado', () => {
    const { result } = renderHook(() => useTimers())
    act(() => result.current.toggle(spec('0-0', 5)))
    act(() => result.current.toggle(spec('0-1', 5)))
    avanzar(6)

    expect(alarma.sonarAlarma).toHaveBeenCalledTimes(1)
    expect(notif.notificarTemporizador).toHaveBeenCalledTimes(2)
  })
})

describe('pausa, rearme y borrado', () => {
  it('el segundo toque pausa y congela el restante', () => {
    const { result } = renderHook(() => useTimers())
    act(() => result.current.toggle(spec('0-0', 60)))
    avanzar(10)

    act(() => result.current.toggle(spec('0-0', 60)))
    expect(result.current.timers[0]).toMatchObject({ corriendo: false, finAt: null, restante: 50 })

    avanzar(20)
    expect(result.current.timers[0].restante).toBe(50)
  })

  it('reanuda desde donde se quedó', () => {
    const { result } = renderHook(() => useTimers())
    act(() => result.current.toggle(spec('0-0', 60)))
    avanzar(10)
    act(() => result.current.toggle(spec('0-0', 60)))
    act(() => result.current.toggle(spec('0-0', 60)))

    expect(result.current.timers[0].corriendo).toBe(true)
    avanzar(5)
    expect(result.current.timers[0].restante).toBe(45)
  })

  it('tocar uno terminado lo rearma al total, parado', () => {
    const { result } = renderHook(() => useTimers())
    act(() => result.current.toggle(spec('0-0', 5)))
    avanzar(6)

    act(() => result.current.toggle(spec('0-0', 5)))
    expect(result.current.timers[0]).toMatchObject({ restante: 5, corriendo: false, hecho: false })
  })

  it('es idempotente por id: no duplica el temporizador de un mismo chip', () => {
    const { result } = renderHook(() => useTimers())
    act(() => result.current.toggle(spec('0-0', 60)))
    act(() => result.current.toggle(spec('0-0', 60)))
    act(() => result.current.toggle(spec('0-0', 60)))

    expect(result.current.timers).toHaveLength(1)
  })

  it('mantiene varios a la vez, cada uno con su cuenta', () => {
    const { result } = renderHook(() => useTimers())
    act(() => result.current.toggle(spec('0-0', 60)))
    act(() => result.current.toggle(spec('1-0', 30, 1)))
    avanzar(10)

    expect(result.current.timers.map((t) => t.restante)).toEqual([50, 20])
  })

  it('eliminar lo quita de la bandeja', () => {
    const { result } = renderHook(() => useTimers())
    act(() => result.current.toggle(spec('0-0', 60)))
    act(() => result.current.toggle(spec('1-0', 30, 1)))

    act(() => result.current.eliminar('0-0'))
    expect(result.current.timers.map((t) => t.id)).toEqual(['1-0'])
  })

  it('sin temporizadores corriendo, el tick no toca el estado', () => {
    const { result } = renderHook(() => useTimers())
    act(() => result.current.toggle(spec('0-0', 60)))
    act(() => result.current.toggle(spec('0-0', 60)))

    const antes = result.current.timers
    avanzar(30)
    expect(result.current.timers).toBe(antes)
  })
})
