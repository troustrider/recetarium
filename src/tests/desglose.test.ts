import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { seDesglosa, repartirPorReceta } from '../utils/desglose'
import { textoLista } from '../utils/compartirLista'
import type { Receta } from '../types/receta'
import type { IngredienteAgrupado } from '../hooks/useListaCompra'

const { despensa } = vi.hoisted(() => ({ despensa: [] as { nombre: string; familia: string; estado: string; cantidad?: number; unidad?: string }[] }))

vi.mock('../context/DespensaContext', () => ({ useDespensa: () => ({ despensa }) }))
vi.mock('../api/estado', () => ({
  getExtras: vi.fn().mockResolvedValue([]),
  saveExtras: vi.fn().mockResolvedValue(undefined),
}))

const useListaCompra = (await import('../hooks/useListaCompra')).default

function receta(id: string, nombre: string, ingredientes: Receta['ingredientes']): Receta {
  return {
    id, nombre, categoria: 'test', sabor: 'salado', tiempoPreparacion: 20,
    favorita: false, pasos: [], porciones: 2, precioPorPorcion: 2, ingredientes,
  }
}

const RAMEN = receta('r1', 'Ramen de pollo', [
  { nombre: 'pechuga de pollo', cantidad: 350, unidad: 'g', familia: 'carnes' },
  { nombre: 'arroz', cantidad: 200, unidad: 'g', familia: 'cereales' },
])
const KATSU = receta('r2', 'Katsu curry', [
  { nombre: 'pechuga de pollo', cantidad: 250, unidad: 'g', familia: 'carnes' },
  { nombre: 'arroz', cantidad: 150, unidad: 'g', familia: 'cereales' },
])
const SOPA = receta('r3', 'Sopa de verduras', [
  { nombre: 'zanahoria', cantidad: 2, unidad: 'ud', familia: 'verduras' },
])

function pollo(result: { current: ReturnType<typeof useListaCompra> }) {
  return result.current.listaCompra.find((i) => i.nombre === 'pechuga de pollo')
}

describe('seDesglosa', () => {
  it('solo lo que se congela en piezas', () => {
    expect(seDesglosa('carnes')).toBe(true)
    expect(seDesglosa('pescados')).toBe(true)
    expect(seDesglosa('CARNES')).toBe(true)
  })

  it('el resto se guarda entero y no aporta desglosarlo', () => {
    for (const f of ['cereales', 'verduras', 'lácteos', 'salsas', 'hogar']) {
      expect(seDesglosa(f), f).toBe(false)
    }
  })
})

describe('repartirPorReceta', () => {
  const partes = [
    { receta: 'Ramen', cantidad: 350 },
    { receta: 'Katsu', cantidad: 250 },
  ]

  it('sin nada en casa, cada plato se lleva lo suyo', () => {
    expect(repartirPorReceta(partes, 0)).toEqual(partes)
  })

  it('lo que ya hay en casa cubre los primeros platos y sale del reparto', () => {
    expect(repartirPorReceta(partes, 350)).toEqual([{ receta: 'Katsu', cantidad: 250 }])
  })

  it('si cubre a medias, el plato entra por lo que falta', () => {
    expect(repartirPorReceta(partes, 100)).toEqual([
      { receta: 'Ramen', cantidad: 250 },
      { receta: 'Katsu', cantidad: 250 },
    ])
  })

  it('cubierto del todo, no queda nada que embolsar', () => {
    expect(repartirPorReceta(partes, 600)).toEqual([])
  })

  it('redondea a dos decimales', () => {
    expect(repartirPorReceta([{ receta: 'A', cantidad: 1 }], 0.335)).toEqual([{ receta: 'A', cantidad: 0.67 }])
  })
})

describe('lista de la compra con desglose', () => {
  it('la carne de dos platos se compra junta y se desglosa', () => {
    const { result } = renderHook(() => useListaCompra())
    act(() => result.current.toggleReceta(RAMEN))
    act(() => result.current.toggleReceta(KATSU))

    expect(pollo(result)).toMatchObject({ cantidad: 600 })
    expect(pollo(result)?.desglose).toEqual([
      { receta: 'Ramen de pollo', cantidad: 350 },
      { receta: 'Katsu curry', cantidad: 250 },
    ])
  })

  it('el desglose suma la cantidad total', () => {
    const { result } = renderHook(() => useListaCompra())
    act(() => result.current.toggleReceta(RAMEN))
    act(() => result.current.toggleReceta(KATSU))

    const item = pollo(result)!
    expect(item.desglose!.reduce((a, d) => a + d.cantidad, 0)).toBe(item.cantidad)
  })

  it('las raciones cuentan personas: doblarlas dobla el plato', () => {
    const { result } = renderHook(() => useListaCompra())
    act(() => result.current.toggleReceta(RAMEN))
    act(() => result.current.toggleReceta(KATSU))
    act(() => result.current.setRaciones('r1', 4))

    expect(pollo(result)?.desglose).toEqual([
      { receta: 'Ramen de pollo', cantidad: 700 },
      { receta: 'Katsu curry', cantidad: 250 },
    ])
  })

  it('pedir las raciones para las que esta escrita no la multiplica', () => {
    const { result } = renderHook(() => useListaCompra())
    act(() => result.current.toggleReceta(RAMEN))
    act(() => result.current.setRaciones('r1', 2))

    expect(pollo(result)?.cantidad).toBe(350)
  })

  it('la mitad de raciones es medio plato', () => {
    const { result } = renderHook(() => useListaCompra())
    act(() => result.current.toggleReceta(RAMEN))
    act(() => result.current.setRaciones('r1', 1))

    expect(pollo(result)?.cantidad).toBe(175)
  })

  it('un solo plato no lleva desglose: la cantidad ya lo dice', () => {
    const { result } = renderHook(() => useListaCompra())
    act(() => result.current.toggleReceta(RAMEN))

    expect(pollo(result)?.cantidad).toBe(350)
    expect(pollo(result)?.desglose).toBeUndefined()
  })

  it('lo que no se congela en piezas no se desglosa aunque vaya a dos platos', () => {
    const { result } = renderHook(() => useListaCompra())
    act(() => result.current.toggleReceta(RAMEN))
    act(() => result.current.toggleReceta(KATSU))

    const arroz = result.current.listaCompra.find((i) => i.nombre === 'arroz')
    expect(arroz?.cantidad).toBe(350)
    expect(arroz?.desglose).toBeUndefined()
  })

  it('las verduras siguen sin desglose', () => {
    const { result } = renderHook(() => useListaCompra())
    act(() => result.current.toggleReceta(SOPA))
    expect(result.current.listaCompra.find((i) => i.nombre === 'zanahoria')?.desglose).toBeUndefined()
  })
})

describe('desglose en el texto que se comparte', () => {
  it('añade la línea de congelar solo cuando hay reparto', () => {
    const items = [
      {
        nombre: 'pechuga de pollo', cantidad: 600, unidad: 'g', familia: 'carnes',
        recetas: ['Ramen de pollo', 'Katsu curry'], clave: 'pechuga de pollo__g',
        desglose: [
          { receta: 'Ramen de pollo', cantidad: 350 },
          { receta: 'Katsu curry', cantidad: 250 },
        ],
      },
      { nombre: 'arroz', cantidad: 350, unidad: 'g', familia: 'cereales', recetas: [], clave: 'arroz__g' },
    ] as IngredienteAgrupado[]

    const texto = textoLista(items)
    expect(texto).toContain('- Pechuga de pollo: 600 g')
    expect(texto).toContain('· congelar en: Ramen de pollo 350 g · Katsu curry 250 g')
    expect(texto).toContain('- Arroz: 350 g')
    expect(texto.split('\n').filter((l) => l.includes('congelar en'))).toHaveLength(1)
  })
})

describe('desglose con parte ya en la despensa', () => {
  afterEach(() => { despensa.length = 0 })

  it('lo que hay en casa cubre el primer plato y solo se embolsa el resto', () => {
    despensa.push({ nombre: 'pollo', familia: 'carnes', estado: 'lleno', cantidad: 350, unidad: 'g' })

    const { result } = renderHook(() => useListaCompra())
    act(() => result.current.toggleReceta(RAMEN))
    act(() => result.current.toggleReceta(KATSU))

    const item = pollo(result)!
    expect(item).toMatchObject({ cantidad: 250, yaTengo: 350 })
    expect(item.desglose).toEqual([{ receta: 'Katsu curry', cantidad: 250 }])
    expect(item.desglose!.reduce((a, d) => a + d.cantidad, 0)).toBe(item.cantidad)
  })

  it('cubierto del todo, sale de la lista y no arrastra desglose', () => {
    despensa.push({ nombre: 'pollo', familia: 'carnes', estado: 'lleno', cantidad: 1, unidad: 'kg' })

    const { result } = renderHook(() => useListaCompra())
    act(() => result.current.toggleReceta(RAMEN))
    act(() => result.current.toggleReceta(KATSU))

    expect(pollo(result)).toBeUndefined()
    const cubierto = result.current.enDespensa.find((i) => i.nombre === 'pechuga de pollo')
    expect(cubierto?.desglose).toBeUndefined()
  })
})

describe('coste estimado: qué mide y qué no', () => {
  afterEach(() => { despensa.length = 0 })

  it('suma precio por ración × raciones', () => {
    const { result } = renderHook(() => useListaCompra())
    act(() => result.current.toggleReceta(RAMEN))
    expect(result.current.coste).toBe(4)

    act(() => result.current.setRaciones('r1', 3))
    expect(result.current.coste).toBe(6)
  })

  it('NO descuenta lo que ya está en la despensa', () => {
    despensa.push({ nombre: 'pollo', familia: 'carnes', estado: 'lleno', cantidad: 1, unidad: 'kg' })
    despensa.push({ nombre: 'arroz', familia: 'cereales', estado: 'lleno', cantidad: 1, unidad: 'kg' })

    const { result } = renderHook(() => useListaCompra())
    act(() => result.current.toggleReceta(RAMEN))

    expect(result.current.listaCompra).toHaveLength(0)
    expect(result.current.enDespensa).toHaveLength(2)
    expect(result.current.coste).toBe(4)
  })

  it('NO baja al quitar un ingrediente a mano', () => {
    const { result } = renderHook(() => useListaCompra())
    act(() => result.current.toggleReceta(RAMEN))
    const clave = result.current.listaCompra.find((i) => i.nombre === 'pechuga de pollo')!.clave

    act(() => result.current.descartar(clave))

    expect(result.current.listaCompra.some((i) => i.nombre === 'pechuga de pollo')).toBe(false)
    expect(result.current.coste).toBe(4)
  })

  it('NO cuenta los ítems manuales: no tienen precio', () => {
    const { result } = renderHook(() => useListaCompra())
    act(() => result.current.addExtra({ nombre: 'detergente', cantidad: 1, unidad: 'ud', familia: 'hogar' }))

    expect(result.current.listaCompra.some((i) => i.nombre === 'detergente')).toBe(true)
    expect(result.current.coste).toBe(0)
  })
})
