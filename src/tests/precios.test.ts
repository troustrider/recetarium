import { describe, it, expect } from 'vitest'
import { precioDe, buscarPrecio, costeCompra, PRECIOS } from '../utils/precios'
import { convertir } from '../utils/cantidades'
import { mismoIngrediente } from '../utils/despensa'

const euros = (nombre: string) => buscarPrecio(nombre)!.euros
const centimos = (n: number) => Math.round(n * 100) / 100

describe('buscarPrecio', () => {
  it('encuentra por nombre exacto', () => {
    expect(buscarPrecio('pechuga de pollo')?.nombre).toBe('pechuga de pollo')
    expect(buscarPrecio('huevos')?.unidad).toBe('ud')
  })

  it('tolera plural y acento como el resto del matcher', () => {
    expect(buscarPrecio('Huevo')?.nombre).toBe('huevos')
    expect(buscarPrecio('limones')?.nombre).toBe('limon')
  })

  it('el corte concreto no se cobra a precio de otro', () => {
    expect(buscarPrecio('contramuslos de pollo')?.nombre).toBe('contramuslos de pollo')
    expect(buscarPrecio('pechuga de pollo')?.nombre).toBe('pechuga de pollo')
  })

  it('no funde productos distintos que comparten cabeza', () => {
    expect(buscarPrecio('aceite de oliva')?.nombre).toBe('aceite de oliva')
    expect(buscarPrecio('aceite de girasol')?.nombre).toBe('aceite de girasol')
  })

  it('devuelve null en lo que no conoce', () => {
    expect(buscarPrecio('polvo de estrellas')).toBeNull()
  })
})

describe('precioDe', () => {
  it('convierte dentro de la dimensión', () => {
    expect(precioDe({ nombre: 'pechuga de pollo', cantidad: 500, unidad: 'g' })).toBeCloseTo(euros('pechuga de pollo') / 2, 2)
    expect(precioDe({ nombre: 'pechuga de pollo', cantidad: 1, unidad: 'kg' })).toBeCloseTo(euros('pechuga de pollo'), 2)
    expect(precioDe({ nombre: 'leche', cantidad: 500, unidad: 'ml' })).toBeCloseTo(euros('leche') / 2, 2)
  })

  it('cuenta por piezas lo que se vende por piezas', () => {
    expect(precioDe({ nombre: 'huevos', cantidad: 6, unidad: 'ud' })).toBeCloseTo(6 * euros('huevos'), 2)
    expect(precioDe({ nombre: 'limon', cantidad: 2, unidad: 'ud' })).toBeCloseTo(2 * euros('limon'), 2)
  })

  it('traduce las unidades de cocina', () => {
    expect(precioDe({ nombre: 'aceite de oliva', cantidad: 2, unidad: 'cucharada' }))
      .toBe(centimos(euros('aceite de oliva') * 0.03))
    expect(precioDe({ nombre: 'ajo', cantidad: 4, unidad: 'diente' })).toBe(centimos(euros('ajo') * 0.02))
    expect(precioDe({ nombre: 'perejil', cantidad: 1, unidad: 'puñado' })).toBe(centimos(euros('perejil') * 0.025))
  })

  it('pasa a peso lo que la receta cuenta en piezas pero se vende al kilo', () => {
    const entrada = buscarPrecio('contramuslos de pollo')!
    const esperado = (2 * entrada.gramosPorUd!) / 1000 * entrada.euros
    expect(precioDe({ nombre: 'contramuslos de pollo', cantidad: 2, unidad: 'ud' })).toBeCloseTo(esperado, 2)
  })

  it('lo que va al gusto no se compra: cuesta cero', () => {
    expect(precioDe({ nombre: 'sal', cantidad: 2, unidad: 'pizca' })).toBe(0)
    expect(precioDe({ nombre: 'pimienta', cantidad: 1, unidad: 'cucharadita' })).toBe(0)
  })

  it('devuelve null en vez de inventarse un precio', () => {
    expect(precioDe({ nombre: 'polvo de estrellas', cantidad: 1, unidad: 'g' })).toBeNull()
  })

  it('null también cuando la unidad no se sabe traducir', () => {
    expect(precioDe({ nombre: 'huevos', cantidad: 1, unidad: 'chorrito' })).toBeNull()
    expect(precioDe({ nombre: 'leche', cantidad: 1, unidad: 'ramita' })).toBeNull()
  })
})

describe('costeCompra', () => {
  it('suma lo que sabe y aparta lo que no', () => {
    const pollo = { nombre: 'pechuga de pollo', cantidad: 500, unidad: 'g' }
    const huevos = { nombre: 'huevos', cantidad: 6, unidad: 'ud' }
    const r = costeCompra([pollo, huevos, { nombre: 'polvo de estrellas', cantidad: 1, unidad: 'g' }])

    expect(r.total).toBeCloseTo(precioDe(pollo)! + precioDe(huevos)!, 2)
    expect(r.sinPrecio).toEqual(['polvo de estrellas'])
  })

  it('una lista vacía cuesta cero', () => {
    expect(costeCompra([])).toEqual({ total: 0, sinPrecio: [] })
  })

  it('nunca suma a ciegas: lo desconocido no entra en el total', () => {
    const conocido = costeCompra([{ nombre: 'huevos', cantidad: 2, unidad: 'ud' }])
    const conRuido = costeCompra([
      { nombre: 'huevos', cantidad: 2, unidad: 'ud' },
      { nombre: 'ingrediente inventado', cantidad: 999, unidad: 'kg' },
    ])
    expect(conRuido.total).toBe(conocido.total)
    expect(conRuido.sinPrecio).toHaveLength(1)
  })
})

describe('la despensa sigue con su aritmética estricta', () => {
  it('convertir no aprendió las equivalencias de cocina', () => {
    expect(convertir(2, 'cucharada', 'ml')).toBeNull()
    expect(convertir(1, 'diente', 'g')).toBeNull()
    expect(convertir(1, 'puñado', 'g')).toBeNull()
  })
})

describe('integridad de la tabla', () => {
  const UNIDADES = ['g', 'kg', 'ml', 'cl', 'l', 'ud']

  it('toda entrada tiene los campos obligatorios', () => {
    const malas = PRECIOS.filter(
      (p) => !p.nombre?.trim() || !p.fuente?.trim() || !/^\d{4}-\d{2}$/.test(p.revisado ?? '')
    )
    expect(malas.map((p) => p.nombre)).toEqual([])
  })

  it('los precios son números positivos', () => {
    const malas = PRECIOS.filter((p) => !Number.isFinite(p.euros) || p.euros <= 0)
    expect(malas.map((p) => p.nombre)).toEqual([])
  })

  it('las unidades son de las que el motor sabe convertir', () => {
    const malas = PRECIOS.filter((p) => !UNIDADES.includes(p.unidad))
    expect(malas.map((p) => `${p.nombre} (${p.unidad})`)).toEqual([])
  })

  it('gramosPorUd no vale para lo que se vende por volumen', () => {
    const malas = PRECIOS.filter((p) => p.gramosPorUd != null && !['g', 'kg', 'ud'].includes(p.unidad))
    expect(malas.map((p) => p.nombre)).toEqual([])
  })

  it('gramosPorUd es un peso creíble para una pieza', () => {
    const malas = PRECIOS.filter(
      (p) => p.gramosPorUd != null && (!Number.isFinite(p.gramosPorUd) || p.gramosPorUd <= 0 || p.gramosPorUd > 2000)
    )
    expect(malas.map((p) => p.nombre)).toEqual([])
  })

  it('los nombres van en minúscula y sin espacios de sobra', () => {
    const malas = PRECIOS.filter((p) => p.nombre !== p.nombre.trim().toLowerCase())
    expect(malas.map((p) => p.nombre)).toEqual([])
  })

  it('ningún ingrediente aparece dos veces con distinta grafía', () => {
    const porClave = new Map<string, string[]>()
    for (const p of PRECIOS) {
      const gemela = PRECIOS.find((otra) => mismoIngrediente(otra.nombre, p.nombre))!
      porClave.set(gemela.nombre, (porClave.get(gemela.nombre) ?? []).concat(p.nombre))
    }
    expect([...porClave.values()].filter((nombres) => nombres.length > 1)).toEqual([])
  })

  it('ninguna entrada queda inalcanzable por otra', () => {
    const malas = PRECIOS.filter((p) => buscarPrecio(p.nombre)?.nombre !== p.nombre)
    expect(malas.map((p) => p.nombre)).toEqual([])
  })

  it('ningún precio es absurdo para comida de supermercado', () => {
    const porKilo = PRECIOS.filter((p) => p.unidad === 'kg')
    expect(porKilo.filter((p) => p.euros > 60).map((p) => p.nombre)).toEqual([])
  })
})

describe('conversión entre peso y pieza', () => {
  it('cobra por peso lo que la tabla vende por pieza', () => {
    // lechuga: 1,20 € la pieza, 300 g por pieza -> 150 g son 0,60 €
    expect(precioDe({ nombre: 'lechuga', cantidad: 150, unidad: 'g' })).toBe(0.6)
  })

  it('cobra por pieza lo que la tabla vende por kilo', () => {
    // patata: 1,20 €/kg, 150 g por pieza -> 2 uds son 0,36 €
    expect(precioDe({ nombre: 'patata', cantidad: 2, unidad: 'ud' })).toBe(0.36)
  })

  it('pasa por gramos las unidades de cocina antes de convertir a piezas', () => {
    // apio: 0,20 € la rama de 40 g; una tira son 30 g
    expect(precioDe({ nombre: 'apio', cantidad: 2, unidad: 'tira' })).toBe(0.3)
  })

  it('sin gramosPorUd no se inventa la equivalencia', () => {
    const sinEquivalencia = PRECIOS.find((p) => p.unidad === 'ud' && !p.gramosPorUd)!
    expect(precioDe({ nombre: sinEquivalencia.nombre, cantidad: 100, unidad: 'g' })).toBeNull()
  })
})

describe('masa y volumen al cobrar', () => {
  it('cobra en gramos lo que la tabla vende por litro', () => {
    // nata agria: 5 €/l -> 100 g cuestan 0,50 €
    expect(precioDe({ nombre: 'nata agria', cantidad: 100, unidad: 'g' })).toBe(0.5)
  })

  it('las unidades de cocina siguen usando su equivalencia propia, no la cruzada', () => {
    // aceite de oliva se vende por litro; una cucharada son 15 ml, no 12 g
    const porMl = precioDe({ nombre: 'aceite de oliva', cantidad: 1, unidad: 'cucharada' })
    const entrada = PRECIOS.find((p) => p.nombre === 'aceite de oliva')!
    expect(porMl).toBe(Math.round((15 * (entrada.euros / 1000)) * 100) / 100)
  })
})
