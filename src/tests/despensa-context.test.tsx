import type { ReactNode } from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const api = vi.hoisted(() => ({
  getDespensa: vi.fn().mockResolvedValue([]),
  saveDespensa: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../api/estado', () => api)

const { DespensaProvider, useDespensa } = await import('../context/DespensaContext')

const envoltorio = ({ children }: { children: ReactNode }) => <DespensaProvider>{children}</DespensaProvider>

async function montar() {
  const montado = renderHook(() => useDespensa(), { wrapper: envoltorio })
  await waitFor(() => expect(api.getDespensa).toHaveBeenCalled())
  await act(async () => { await Promise.resolve() })
  return montado
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  api.getDespensa.mockResolvedValue([])
})

describe('añadir', () => {
  it('normaliza el nombre y la familia y arranca en lleno', async () => {
    const { result } = await montar()
    act(() => result.current.añadir('  Tomate  ', '  Verduras  '))

    expect(result.current.despensa).toEqual([{ nombre: 'tomate', familia: 'verduras', estado: 'lleno' }])
  })

  it('cae en "otros" si no le dan familia', async () => {
    const { result } = await montar()
    act(() => result.current.añadir('cosa', ''))
    expect(result.current.despensa[0].familia).toBe('otros')
  })

  it('ignora el alta si ya está el mismo ingrediente', async () => {
    const { result } = await montar()
    act(() => result.current.añadir('pollo', 'carnes'))
    act(() => result.current.añadir('Pollos', 'aves'))

    expect(result.current.despensa).toHaveLength(1)
    expect(result.current.despensa[0].familia).toBe('carnes')
  })

  it('ignora el nombre vacío', async () => {
    const { result } = await montar()
    act(() => result.current.añadir('   ', 'verduras'))
    expect(result.current.despensa).toHaveLength(0)
  })

  it('guarda cantidad y unidad solo si la unidad es medible', async () => {
    const { result } = await montar()
    act(() => result.current.añadir('arroz', 'cereales', { cantidad: 500, unidad: 'g' }))
    act(() => result.current.añadir('perejil', 'especias', { cantidad: 2, unidad: 'puñado' }))

    const arroz = result.current.despensa.find((i) => i.nombre === 'arroz')
    const perejil = result.current.despensa.find((i) => i.nombre === 'perejil')
    expect(arroz).toMatchObject({ cantidad: 500, unidad: 'g' })
    expect(perejil?.cantidad).toBeUndefined()
    expect(perejil?.unidad).toBeUndefined()
  })

  it('guarda la caducidad cuando viene', async () => {
    const { result } = await montar()
    act(() => result.current.añadir('leche', 'lácteos', { caducidad: '2026-09-01' }))
    expect(result.current.despensa[0].caducidad).toBe('2026-09-01')
  })

  it('mantiene la lista ordenada por familia y nombre', async () => {
    const { result } = await montar()
    act(() => result.current.añadir('tomate', 'verduras'))
    act(() => result.current.añadir('arroz', 'cereales'))
    act(() => result.current.añadir('ajo', 'verduras'))

    expect(result.current.despensa.map((i) => i.nombre)).toEqual(['arroz', 'ajo', 'tomate'])
  })
})

describe('reponer — vuelta de la compra', () => {
  it('da de alta lo que no estaba', async () => {
    const { result } = await montar()
    act(() => result.current.reponer('pollo', 'carnes', 500, 'g'))
    expect(result.current.despensa[0]).toMatchObject({ nombre: 'pollo', cantidad: 500, estado: 'lleno' })
  })

  it('suma al stock existente en la misma unidad', async () => {
    const { result } = await montar()
    act(() => result.current.añadir('arroz', 'cereales', { cantidad: 300, unidad: 'g' }))
    act(() => result.current.reponer('arroz', 'cereales', 500, 'g'))

    expect(result.current.despensa[0].cantidad).toBe(800)
  })

  it('convierte antes de sumar si las unidades son compatibles', async () => {
    const { result } = await montar()
    act(() => result.current.añadir('arroz', 'cereales', { cantidad: 300, unidad: 'g' }))
    act(() => result.current.reponer('arroz', 'cereales', 1, 'kg'))

    expect(result.current.despensa[0]).toMatchObject({ cantidad: 1300, unidad: 'g' })
  })

  it('no inventa sumas entre dimensiones distintas: solo repone el estado', async () => {
    const { result } = await montar()
    act(() => result.current.añadir('leche', 'lácteos', { cantidad: 500, unidad: 'ml' }))
    act(() => result.current.editar('leche', { estado: 'poco' }))
    act(() => result.current.reponer('leche', 'lácteos', 200, 'g'))

    expect(result.current.despensa[0]).toMatchObject({ cantidad: 500, unidad: 'ml', estado: 'lleno' })
  })

  it('estrena la cantidad si el que había no la llevaba', async () => {
    const { result } = await montar()
    act(() => result.current.añadir('arroz', 'cereales'))
    act(() => result.current.reponer('arroz', 'cereales', 1, 'kg'))

    expect(result.current.despensa[0]).toMatchObject({ cantidad: 1, unidad: 'kg' })
  })

  it('sin cantidad, repone solo el estado', async () => {
    const { result } = await montar()
    act(() => result.current.añadir('salsa de soja', 'salsas'))
    act(() => result.current.editar('salsa de soja', { estado: 'poco' }))
    act(() => result.current.reponer('salsa de soja', 'salsas'))

    expect(result.current.despensa[0].estado).toBe('lleno')
    expect(result.current.despensa[0].cantidad).toBeUndefined()
  })

  it('encuentra el ingrediente aunque esté escrito distinto', async () => {
    const { result } = await montar()
    act(() => result.current.añadir('aceite de oliva', 'condimentos'))
    act(() => result.current.reponer('aceite oliva', 'condimentos'))

    expect(result.current.despensa).toHaveLength(1)
  })
})

describe('editar', () => {
  it('cambia estado, familia y caducidad', async () => {
    const { result } = await montar()
    act(() => result.current.añadir('leche', 'lácteos'))
    act(() => result.current.editar('leche', { estado: 'poco', familia: 'Bebidas', caducidad: '2026-10-05' }))

    expect(result.current.despensa[0]).toMatchObject({ estado: 'poco', familia: 'bebidas', caducidad: '2026-10-05' })
  })

  it('null borra el campo, undefined lo deja como estaba', async () => {
    const { result } = await montar()
    act(() => result.current.añadir('leche', 'lácteos', { caducidad: '2026-10-05', cantidad: 500, unidad: 'ml' }))

    act(() => result.current.editar('leche', { caducidad: null }))
    expect(result.current.despensa[0].caducidad).toBeUndefined()
    expect(result.current.despensa[0].cantidad).toBe(500)

    act(() => result.current.editar('leche', { cantidad: null }))
    expect(result.current.despensa[0].cantidad).toBeUndefined()
    expect(result.current.despensa[0].unidad).toBeUndefined()
  })

  it('renombra si el nombre nuevo no choca', async () => {
    const { result } = await montar()
    act(() => result.current.añadir('tomate', 'verduras'))
    act(() => result.current.editar('tomate', { nombre: 'Tomate cherry' }))

    expect(result.current.despensa[0].nombre).toBe('tomate cherry')
  })

  it('descarta el renombrado que choca con otro, pero aplica el resto de cambios', async () => {
    const { result } = await montar()
    act(() => result.current.añadir('tomate', 'verduras'))
    act(() => result.current.añadir('cebolla', 'verduras'))
    act(() => result.current.editar('cebolla', { nombre: 'tomate', estado: 'poco' }))

    expect(result.current.despensa.map((i) => i.nombre).sort()).toEqual(['cebolla', 'tomate'])
    expect(result.current.despensa.find((i) => i.nombre === 'cebolla')?.estado).toBe('poco')
  })

  it('poner cantidad sin unidad asume gramos', async () => {
    const { result } = await montar()
    act(() => result.current.añadir('arroz', 'cereales'))
    act(() => result.current.editar('arroz', { cantidad: 250 }))

    expect(result.current.despensa[0]).toMatchObject({ cantidad: 250, unidad: 'g' })
  })

  it('cambiar solo la unidad no hace nada si no hay cantidad', async () => {
    const { result } = await montar()
    act(() => result.current.añadir('arroz', 'cereales'))
    act(() => result.current.editar('arroz', { unidad: 'kg' }))

    expect(result.current.despensa[0].unidad).toBeUndefined()
  })
})

describe('quitar y vaciar', () => {
  it('quitar exige el nombre exacto ya normalizado', async () => {
    const { result } = await montar()
    act(() => result.current.añadir('tomate', 'verduras'))

    act(() => result.current.quitar('Tomate'))
    expect(result.current.despensa).toHaveLength(0)
  })

  it('quitar NO usa el matcher: un plural no encuentra el ingrediente', async () => {
    const { result } = await montar()
    act(() => result.current.añadir('tomate', 'verduras'))
    act(() => result.current.quitar('tomates'))
    expect(result.current.despensa).toHaveLength(1)
  })

  it('vaciar deja la despensa a cero', async () => {
    const { result } = await montar()
    act(() => result.current.añadir('tomate', 'verduras'))
    act(() => result.current.añadir('arroz', 'cereales'))
    act(() => result.current.vaciar())
    expect(result.current.despensa).toHaveLength(0)
  })
})

describe('tieneIngrediente', () => {
  it('responde con el matcher de cocina', async () => {
    const { result } = await montar()
    act(() => result.current.añadir('aceite de oliva', 'condimentos'))

    expect(result.current.tieneIngrediente('aceite oliva')).toBe(true)
    expect(result.current.tieneIngrediente('aceite de girasol')).toBe(false)
  })
})

describe('cache local y backend', () => {
  it('pinta al instante desde localStorage antes de que responda el backend', async () => {
    localStorage.setItem(
      'recetarium-despensa',
      JSON.stringify([{ nombre: 'arroz', familia: 'cereales', estado: 'lleno' }])
    )
    const { result } = renderHook(() => useDespensa(), { wrapper: envoltorio })
    expect(result.current.despensa).toHaveLength(1)
  })

  it('migra el formato antiguo de lista de strings', async () => {
    localStorage.setItem('recetarium-despensa', JSON.stringify(['Tomate', 'Arroz']))
    const { result } = renderHook(() => useDespensa(), { wrapper: envoltorio })

    expect(result.current.despensa).toEqual([
      { nombre: 'tomate', familia: 'otros', estado: 'lleno' },
      { nombre: 'arroz', familia: 'otros', estado: 'lleno' },
    ])
  })

  it('aguanta un localStorage corrupto', async () => {
    localStorage.setItem('recetarium-despensa', 'esto no es json')
    const { result } = renderHook(() => useDespensa(), { wrapper: envoltorio })
    expect(result.current.despensa).toEqual([])
  })

  it('sube la despensa local la primera vez que el backend viene vacío', async () => {
    localStorage.setItem(
      'recetarium-despensa',
      JSON.stringify([{ nombre: 'arroz', familia: 'cereales', estado: 'lleno' }])
    )
    await montar()
    await waitFor(() => expect(api.saveDespensa).toHaveBeenCalled())
    expect(api.saveDespensa.mock.calls[0][0]).toHaveLength(1)
  })

  it('hidratar no dispara un guardado de vuelta', async () => {
    api.getDespensa.mockResolvedValue([{ nombre: 'arroz', familia: 'cereales', estado: 'lleno' }])
    await montar()
    await new Promise((r) => setTimeout(r, 1000))
    expect(api.saveDespensa).not.toHaveBeenCalled()
  })

  it('un cambio se guarda con debounce y colapsa la ráfaga', async () => {
    const { result } = await montar()
    act(() => result.current.añadir('tomate', 'verduras'))
    act(() => result.current.añadir('arroz', 'cereales'))
    expect(api.saveDespensa).not.toHaveBeenCalled()

    await waitFor(() => expect(api.saveDespensa).toHaveBeenCalledTimes(1), { timeout: 3000 })
    expect(api.saveDespensa.mock.calls[0][0]).toHaveLength(2)
  })

  it('escribe siempre el cache local, aunque el backend falle', async () => {
    api.saveDespensa.mockRejectedValue(new Error('sin red'))
    const { result } = await montar()
    act(() => result.current.añadir('tomate', 'verduras'))

    expect(JSON.parse(localStorage.getItem('recetarium-despensa')!)).toHaveLength(1)
  })

  it('BUG: un guardado fallido no deja rastro para el usuario', async () => {
    api.saveDespensa.mockRejectedValue(new Error('sin red'))
    const { result } = await montar()
    act(() => result.current.añadir('tomate', 'verduras'))

    await waitFor(() => expect(api.saveDespensa).toHaveBeenCalled(), { timeout: 3000 })
    expect(result.current.despensa).toHaveLength(1)
    expect(result.current).not.toHaveProperty('error')
  })
})

describe('vaciada desde el otro dispositivo', () => {
  it('la primera vez sube la despensa local que aún no estaba en el servidor', async () => {
    localStorage.setItem('recetarium-despensa', JSON.stringify([{ nombre: 'pollo', familia: 'carnes', estado: 'lleno' }]))
    api.getDespensa.mockResolvedValue([])

    const { result } = await montar()

    expect(result.current.despensa).toHaveLength(1)
    await waitFor(() => expect(api.saveDespensa).toHaveBeenCalledWith([
      { nombre: 'pollo', familia: 'carnes', estado: 'lleno' },
    ]))
  })

  it('una vez sincronizada, el vacío del servidor manda y no resucita la caché', async () => {
    localStorage.setItem('recetarium-despensa', JSON.stringify([{ nombre: 'pollo', familia: 'carnes', estado: 'lleno' }]))
    localStorage.setItem('recetarium-despensa-sincronizada', '1')
    api.getDespensa.mockResolvedValue([])

    const { result } = await montar()

    expect(result.current.despensa).toEqual([])
    expect(api.saveDespensa).not.toHaveBeenCalled()
  })

  it('recibir despensa del servidor deja el dispositivo marcado como sincronizado', async () => {
    api.getDespensa.mockResolvedValue([{ nombre: 'arroz', familia: 'cereales', estado: 'lleno' }])
    await montar()
    expect(localStorage.getItem('recetarium-despensa-sincronizada')).toBe('1')
  })
})
