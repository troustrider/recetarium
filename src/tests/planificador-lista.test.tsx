import type { ReactNode } from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Receta } from '../types/receta'

const api = vi.hoisted(() => ({
  getPlan: vi.fn().mockResolvedValue([]),
  savePlan: vi.fn().mockResolvedValue(undefined),
  getPendientes: vi.fn().mockResolvedValue([]),
  savePendientes: vi.fn().mockResolvedValue(undefined),
  getExtras: vi.fn().mockResolvedValue([]),
  saveExtras: vi.fn().mockResolvedValue(undefined),
  getDespensa: vi.fn().mockResolvedValue([]),
  saveDespensa: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../api/estado', () => api)

function receta(id: string, nombre: string, ingredientes: Receta['ingredientes']): Receta {
  return {
    id, nombre, categoria: 'test', sabor: 'salado', tiempoPreparacion: 20,
    favorita: false, pasos: [], porciones: 1, precioPorPorcion: 2, ingredientes,
  }
}

const POLLO = receta('r1', 'Pollo al curry', [
  { nombre: 'pollo', cantidad: 200, unidad: 'g', familia: 'carnes' },
  { nombre: 'curry', cantidad: 1, unidad: 'cda', familia: 'especias' },
])
const PASTA = receta('r2', 'Pasta al pesto', [
  { nombre: 'pasta', cantidad: 100, unidad: 'g', familia: 'cereales' },
  { nombre: 'pollo', cantidad: 50, unidad: 'g', familia: 'carnes' },
])
const SOPA = receta('r3', 'Sopa de verduras', [
  { nombre: 'zanahoria', cantidad: 2, unidad: 'ud', familia: 'verduras' },
])

const CATALOGO = [POLLO, PASTA, SOPA]

vi.mock('../context/RecetasContext', () => ({
  RecetasProvider: ({ children }: { children: ReactNode }) => children,
  useRecetasContext: () => ({ recetas: CATALOGO, loading: false }),
}))

const { DespensaProvider, useDespensa } = await import('../context/DespensaContext')
const { ListaCompraProvider, useListaCompraContext } = await import('../context/ListaCompraContext')
const { PendientesPlanProvider, usePendientesPlan } = await import('../context/PendientesPlanContext')
const { PlanificadorProvider, usePlanificador } = await import('../context/PlanificadorContext')

function envoltorio({ children }: { children: ReactNode }) {
  return (
    <DespensaProvider>
      <ListaCompraProvider>
        <PendientesPlanProvider>
          <PlanificadorProvider>{children}</PlanificadorProvider>
        </PendientesPlanProvider>
      </ListaCompraProvider>
    </DespensaProvider>
  )
}

function montar() {
  return renderHook(
    () => ({
      plan: usePlanificador(),
      lista: useListaCompraContext(),
      pendientes: usePendientesPlan(),
    }),
    { wrapper: envoltorio }
  )
}

async function montarHidratado() {
  const montado = montar()
  await waitFor(() => expect(api.getPlan).toHaveBeenCalled())
  await waitFor(() => expect(api.getPendientes).toHaveBeenCalled())
  await act(async () => { await Promise.resolve() })
  return montado
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  api.getPlan.mockResolvedValue([])
  api.getPendientes.mockResolvedValue([])
  api.getExtras.mockResolvedValue([])
  api.getDespensa.mockResolvedValue([])
})

describe('plan -> lista de la compra', () => {
  it('meter una receta en un día la selecciona en la lista', async () => {
    const { result } = await montarHidratado()
    act(() => result.current.plan.añadir('Lunes', POLLO, 2))

    await waitFor(() => expect(result.current.lista.estaSeleccionada('r1')).toBe(true))
    expect(result.current.lista.seleccionadas[0].raciones).toBe(2)
    expect(result.current.lista.listaCompra.map((i) => i.nombre)).toContain('pollo')
  })

  it('suma las raciones de la misma receta repartida en varios días', async () => {
    const { result } = await montarHidratado()
    act(() => result.current.plan.añadir('Lunes', POLLO, 2))
    act(() => result.current.plan.añadir('Jueves', POLLO, 3))

    await waitFor(() => expect(result.current.lista.seleccionadas[0].raciones).toBe(5))
    const pollo = result.current.lista.listaCompra.find((i) => i.nombre === 'pollo')
    expect(pollo?.cantidad).toBe(1000)
  })

  it('agrupa el mismo ingrediente de dos recetas distintas', async () => {
    const { result } = await montarHidratado()
    act(() => result.current.plan.añadir('Lunes', POLLO, 1))
    act(() => result.current.plan.añadir('Martes', PASTA, 1))

    await waitFor(() => expect(result.current.lista.seleccionadas).toHaveLength(2))
    const pollo = result.current.lista.listaCompra.find((i) => i.nombre === 'pollo')
    expect(pollo?.cantidad).toBe(250)
    expect(pollo?.recetas).toEqual(['Pollo al curry', 'Pasta al pesto'])
  })

  it('quitar la receta del plan la saca de la lista', async () => {
    const { result } = await montarHidratado()
    act(() => result.current.plan.añadir('Lunes', POLLO, 1))
    await waitFor(() => expect(result.current.lista.estaSeleccionada('r1')).toBe(true))

    const entradaId = result.current.plan.plan.Lunes[0].id
    act(() => result.current.plan.quitar('Lunes', entradaId))

    await waitFor(() => expect(result.current.lista.estaSeleccionada('r1')).toBe(false))
  })

  it('vaciar el plan no borra lo que el usuario había puesto a mano en la lista', async () => {
    const { result } = await montarHidratado()
    act(() => result.current.lista.toggleReceta(SOPA))
    act(() => result.current.plan.añadir('Lunes', POLLO, 1))
    await waitFor(() => expect(result.current.lista.seleccionadas).toHaveLength(2))

    act(() => result.current.plan.limpiar())

    await waitFor(() => expect(result.current.lista.estaSeleccionada('r1')).toBe(false))
    expect(result.current.lista.estaSeleccionada('r3')).toBe(true)
  })

  it('cambiar las raciones en el plan las propaga a la lista', async () => {
    const { result } = await montarHidratado()
    act(() => result.current.plan.añadir('Lunes', POLLO, 1))
    await waitFor(() => expect(result.current.lista.seleccionadas[0].raciones).toBe(1))

    const entradaId = result.current.plan.plan.Lunes[0].id
    act(() => result.current.plan.setRaciones('Lunes', entradaId, 4))

    await waitFor(() => expect(result.current.lista.seleccionadas[0].raciones).toBe(4))
  })

  it('mover una receta de día no altera la lista', async () => {
    const { result } = await montarHidratado()
    act(() => result.current.plan.añadir('Lunes', POLLO, 3))
    await waitFor(() => expect(result.current.lista.seleccionadas[0].raciones).toBe(3))

    const entradaId = result.current.plan.plan.Lunes[0].id
    act(() => result.current.plan.mover('Lunes', 'Viernes', entradaId))

    expect(result.current.plan.plan.Lunes).toHaveLength(0)
    expect(result.current.plan.plan.Viernes).toHaveLength(1)
    await waitFor(() => expect(result.current.lista.seleccionadas[0].raciones).toBe(3))
  })
})

describe('raciones y límites del plan', () => {
  it('acota las raciones del plan entre 1 y 4', async () => {
    const { result } = await montarHidratado()
    act(() => result.current.plan.añadir('Lunes', POLLO, 1))
    const entradaId = result.current.plan.plan.Lunes[0].id

    act(() => result.current.plan.setRaciones('Lunes', entradaId, 99))
    expect(result.current.plan.plan.Lunes[0].raciones).toBe(4)

    act(() => result.current.plan.setRaciones('Lunes', entradaId, 0))
    expect(result.current.plan.plan.Lunes[0].raciones).toBe(1)
  })

  it('la lista NO acota por arriba: acepta más raciones que el plan', async () => {
    const { result } = await montarHidratado()
    act(() => result.current.lista.toggleReceta(POLLO))
    act(() => result.current.lista.setRaciones('r1', 10))
    expect(result.current.lista.seleccionadas[0].raciones).toBe(10)
  })

  it('autollenar deja los siete días con una receta cada uno', async () => {
    const { result } = await montarHidratado()
    act(() => result.current.plan.autollenar(CATALOGO, 2))

    for (const dia of result.current.plan.dias) {
      expect(result.current.plan.plan[dia], dia).toHaveLength(1)
      expect(result.current.plan.plan[dia][0].raciones).toBe(2)
    }
    await waitFor(() => expect(result.current.lista.seleccionadas.length).toBeGreaterThan(0))
  })

  it('autollenar respeta lo ya cocinado y sustituye lo demás', async () => {
    const { result } = await montarHidratado()
    act(() => result.current.plan.añadir('Miércoles', SOPA, 1))
    act(() => result.current.plan.añadir('Lunes', POLLO, 1))
    const hecha = result.current.plan.plan['Miércoles'][0].id
    act(() => result.current.plan.marcarCocinada('Miércoles', hecha, true))

    act(() => result.current.plan.autollenar(CATALOGO, 2))

    expect(result.current.plan.plan['Miércoles']).toHaveLength(1)
    expect(result.current.plan.plan['Miércoles'][0]).toMatchObject({
      id: hecha, raciones: 1, cocinada: true,
    })
    // El lunes no estaba hecho: se sustituye por el reparto nuevo, con sus raciones.
    expect(result.current.plan.plan.Lunes).toHaveLength(1)
    expect(result.current.plan.plan.Lunes[0].raciones).toBe(2)
  })

  it('autollenar no vuelve a proponer la receta que ya está hecha', async () => {
    const { result } = await montarHidratado()
    act(() => result.current.plan.añadir('Martes', SOPA, 1))
    const hecha = result.current.plan.plan.Martes[0].id
    act(() => result.current.plan.marcarCocinada('Martes', hecha, true))

    act(() => result.current.plan.autollenar(CATALOGO, 2))

    const resto = result.current.plan.dias
      .filter((d) => d !== 'Martes')
      .flatMap((d) => result.current.plan.plan[d])
    expect(resto).toHaveLength(6)
    expect(resto.some((e) => e.receta.id === SOPA.id)).toBe(false)
  })

  it('autollenar sin recetas no toca el plan', async () => {
    const { result } = await montarHidratado()
    act(() => result.current.plan.añadir('Lunes', POLLO, 1))
    act(() => result.current.plan.autollenar([], 2))
    expect(result.current.plan.plan.Lunes).toHaveLength(1)
  })
})

describe('pendientes de planificar', () => {
  it('una receta comprada deja de estar pendiente al entrar en el plan', async () => {
    const { result } = await montarHidratado()
    act(() => result.current.pendientes.marcarPendientes([{ receta: POLLO, raciones: 2 }]))
    await waitFor(() => expect(result.current.pendientes.pendientes).toHaveLength(1))

    act(() => result.current.plan.añadir('Miércoles', POLLO, 2))

    await waitFor(() => expect(result.current.pendientes.pendientes).toHaveLength(0))
  })

  it('planificar otra receta no descuenta la pendiente', async () => {
    const { result } = await montarHidratado()
    act(() => result.current.pendientes.marcarPendientes([{ receta: POLLO, raciones: 2 }]))
    await waitFor(() => expect(result.current.pendientes.pendientes).toHaveLength(1))

    act(() => result.current.plan.añadir('Miércoles', SOPA, 1))

    await waitFor(() => expect(result.current.plan.plan['Miércoles']).toHaveLength(1))
    expect(result.current.pendientes.pendientes).toHaveLength(1)
  })

  it('no duplica una pendiente ya marcada', async () => {
    const { result } = await montarHidratado()
    act(() => result.current.pendientes.marcarPendientes([{ receta: POLLO, raciones: 2 }]))
    act(() => result.current.pendientes.marcarPendientes([{ receta: POLLO, raciones: 4 }]))
    await waitFor(() => expect(result.current.pendientes.pendientes).toHaveLength(1))
    expect(result.current.pendientes.pendientes[0].raciones).toBe(2)
  })
})

describe('platos ya cocinados', () => {
  it('marcar una receta como hecha la saca de la lista de la compra', async () => {
    const { result } = await montarHidratado()
    act(() => result.current.plan.añadir('Lunes', POLLO, 2))
    await waitFor(() => expect(result.current.lista.estaSeleccionada('r1')).toBe(true))

    const entradaId = result.current.plan.plan.Lunes[0].id
    act(() => result.current.plan.marcarCocinada('Lunes', entradaId, true))

    await waitFor(() => expect(result.current.lista.estaSeleccionada('r1')).toBe(false))
    expect(result.current.plan.plan.Lunes[0].cocinada).toBe(true)
  })

  it('deshacerlo la devuelve a la lista', async () => {
    const { result } = await montarHidratado()
    act(() => result.current.plan.añadir('Lunes', POLLO, 2))
    const entradaId = result.current.plan.plan.Lunes[0].id

    act(() => result.current.plan.marcarCocinada('Lunes', entradaId, true))
    await waitFor(() => expect(result.current.lista.estaSeleccionada('r1')).toBe(false))

    act(() => result.current.plan.marcarCocinada('Lunes', entradaId, false))
    await waitFor(() => expect(result.current.lista.estaSeleccionada('r1')).toBe(true))
  })

  it('lo cocinado se guarda y vuelve del backend', async () => {
    api.getPlan.mockResolvedValue([{ dia: 'Lunes', recetaId: 'r1', raciones: 2, cocinada: true }])
    const { result } = montar()

    await waitFor(() => expect(result.current.plan.plan.Lunes).toHaveLength(1))
    expect(result.current.plan.plan.Lunes[0].cocinada).toBe(true)

    act(() => result.current.plan.marcarCocinada('Lunes', result.current.plan.plan.Lunes[0].id, false))
    await waitFor(() => expect(api.savePlan).toHaveBeenCalledTimes(1), { timeout: 3000 })
    expect(api.savePlan).toHaveBeenCalledWith([{ dia: 'Lunes', recetaId: 'r1', raciones: 2 }])
  })

  it('consumir vacía lo gastado y rebaja lo que sobra', async () => {
    api.getDespensa.mockResolvedValue([
      { nombre: 'pollo', familia: 'carnes', estado: 'lleno', cantidad: 800, unidad: 'g' },
      { nombre: 'curry', familia: 'especias', estado: 'lleno' },
    ])
    const { result } = renderHook(() => useDespensa(), { wrapper: envoltorio })
    await waitFor(() => expect(result.current.despensa).toHaveLength(2))

    act(() =>
      result.current.consumir([
        { nombre: 'pollo', familia: 'carnes', usadoPor: ['pollo'], accion: 'restar', cantidad: 600, unidad: 'g' },
        { nombre: 'curry', familia: 'especias', usadoPor: ['curry'], accion: 'quitar' },
      ])
    )

    expect(result.current.despensa).toHaveLength(1)
    expect(result.current.despensa[0]).toMatchObject({ nombre: 'pollo', cantidad: 600, unidad: 'g' })
  })
})

describe('hidratación del plan desde el backend', () => {
  it('rehidrata por id contra el catálogo', async () => {
    api.getPlan.mockResolvedValue([
      { dia: 'Lunes', recetaId: 'r1', raciones: 2 },
      { dia: 'Domingo', recetaId: 'r3', raciones: 1 },
    ])
    const { result } = montar()

    await waitFor(() => expect(result.current.plan.plan.Lunes).toHaveLength(1))
    expect(result.current.plan.plan.Lunes[0].receta.nombre).toBe('Pollo al curry')
    expect(result.current.plan.plan.Domingo[0].raciones).toBe(1)
  })

  it('descarta las entradas cuya receta ya no existe', async () => {
    api.getPlan.mockResolvedValue([
      { dia: 'Lunes', recetaId: 'r1', raciones: 1 },
      { dia: 'Martes', recetaId: 'receta-borrada', raciones: 1 },
    ])
    const { result } = montar()

    await waitFor(() => expect(result.current.plan.plan.Lunes).toHaveLength(1))
    expect(result.current.plan.plan.Martes).toHaveLength(0)
  })

  it('descarta los días que no son del catálogo de días', async () => {
    api.getPlan.mockResolvedValue([{ dia: 'Lundi', recetaId: 'r1', raciones: 1 }])
    const { result } = montar()

    await waitFor(() => expect(api.getPlan).toHaveBeenCalled())
    for (const dia of result.current.plan.dias) expect(result.current.plan.plan[dia]).toHaveLength(0)
  })

  it('hidratar no dispara un guardado de vuelta', async () => {
    api.getPlan.mockResolvedValue([{ dia: 'Lunes', recetaId: 'r1', raciones: 2 }])
    const { result } = montar()

    await waitFor(() => expect(result.current.plan.plan.Lunes).toHaveLength(1))
    await new Promise((r) => setTimeout(r, 1000))
    expect(api.savePlan).not.toHaveBeenCalled()
  })

  it('un cambio posterior sí se guarda, con debounce', async () => {
    const { result } = montar()
    await waitFor(() => expect(api.getPlan).toHaveBeenCalled())

    act(() => result.current.plan.añadir('Lunes', POLLO, 1))
    expect(api.savePlan).not.toHaveBeenCalled()

    await waitFor(() => expect(api.savePlan).toHaveBeenCalledTimes(1), { timeout: 3000 })
    expect(api.savePlan).toHaveBeenCalledWith([{ dia: 'Lunes', recetaId: 'r1', raciones: 1 }])
  })

  it('una ráfaga de cambios colapsa en un solo guardado', async () => {
    const { result } = montar()
    await waitFor(() => expect(api.getPlan).toHaveBeenCalled())

    act(() => result.current.plan.añadir('Lunes', POLLO, 1))
    act(() => result.current.plan.añadir('Martes', PASTA, 1))
    act(() => result.current.plan.añadir('Jueves', SOPA, 1))

    await waitFor(() => expect(api.savePlan).toHaveBeenCalledTimes(1), { timeout: 3000 })
    expect(api.savePlan.mock.calls[0][0]).toHaveLength(3)
  })

  it('si el backend falla, la app sigue con el plan vacío', async () => {
    api.getPlan.mockRejectedValue(new Error('sin red'))
    const { result } = montar()

    await waitFor(() => expect(api.getPlan).toHaveBeenCalled())
    expect(result.current.plan.plan.Lunes).toHaveLength(0)

    act(() => result.current.plan.añadir('Lunes', POLLO, 1))
    expect(result.current.plan.plan.Lunes).toHaveLength(1)
  })
})

describe('la hidratación no pisa lo que el usuario hizo mientras cargaba', () => {
  it('lo añadido al plan antes de que responda el backend se conserva y se sube', async () => {
    let responder: (dtos: unknown[]) => void = () => {}
    api.getPlan.mockReturnValue(new Promise((resolve) => { responder = resolve as typeof responder }))

    const { result } = montar()
    act(() => result.current.plan.añadir('Lunes', POLLO, 2))
    expect(result.current.plan.plan.Lunes).toHaveLength(1)

    await act(async () => { responder([{ dia: 'Jueves', recetaId: 'r3', raciones: 1 }]); await Promise.resolve() })

    expect(result.current.plan.plan.Lunes).toHaveLength(1)
    expect(result.current.plan.plan.Jueves).toHaveLength(0)
    expect(api.savePlan).toHaveBeenCalledWith([{ dia: 'Lunes', recetaId: 'r1', raciones: 2 }])
  })

  it('una receta marcada como comprada antes de la respuesta se conserva', async () => {
    let responder: (dtos: unknown[]) => void = () => {}
    api.getPendientes.mockReturnValue(new Promise((resolve) => { responder = resolve as typeof responder }))

    const { result } = montar()
    act(() => result.current.pendientes.marcarPendientes([{ receta: POLLO, raciones: 2 }]))
    expect(result.current.pendientes.pendientes).toHaveLength(1)

    await act(async () => { responder([]); await Promise.resolve() })

    expect(result.current.pendientes.pendientes).toHaveLength(1)
    expect(api.savePendientes).toHaveBeenCalledWith([{ recetaId: 'r1', raciones: 2 }])
  })

  it('en la despensa pasa lo mismo', async () => {
    let responder: (items: unknown[]) => void = () => {}
    api.getDespensa.mockReturnValue(new Promise((resolve) => { responder = resolve as typeof responder }))

    const { result } = renderHook(() => useDespensa(), { wrapper: envoltorio })
    act(() => result.current.añadir('tomate', 'verduras'))
    expect(result.current.despensa).toHaveLength(1)

    await act(async () => {
      responder([{ nombre: 'arroz', familia: 'cereales', estado: 'lleno' }])
      await Promise.resolve()
    })

    expect(result.current.despensa.map((i) => i.nombre)).toEqual(['tomate'])
    expect(api.saveDespensa).toHaveBeenCalled()
  })

  it('sin cambios locales, la respuesta del backend sigue mandando', async () => {
    api.getPlan.mockResolvedValue([{ dia: 'Martes', recetaId: 'r2', raciones: 1 }])
    const { result } = await montarHidratado()
    expect(result.current.plan.plan.Martes).toHaveLength(1)
    expect(api.savePlan).not.toHaveBeenCalled()
  })
})
