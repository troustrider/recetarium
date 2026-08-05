import { describe, it, expect } from 'vitest'
import { precioDe, buscarPrecio, costeCompra, PRECIOS } from '../utils/precios'
import { convertir } from '../utils/cantidades'

// El precio de la lista tiene que salir de lo que se compra de verdad, y no
// puede inventarse lo que no sabe.

// Los tests no fijan cuanto vale el pollo: los precios cambian y la tabla se
// actualiza sola por el script. Lo que se fija es el comportamiento.
const euros = (nombre: string) => buscarPrecio(nombre)!.euros
// precioDe redondea a centimos; la expectativa tiene que redondear igual.
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
    // El error que este orden evita: que una entrada generica de pollo pisara
    // a los contramuslos y los cobrase a precio de pechuga.
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
    // 2 cucharadas = 30 ml de un precio por litro
    expect(precioDe({ nombre: 'aceite de oliva', cantidad: 2, unidad: 'cucharada' }))
      .toBe(centimos(euros('aceite de oliva') * 0.03))
    // 4 dientes = 20 g de un precio por kilo
    expect(precioDe({ nombre: 'ajo', cantidad: 4, unidad: 'diente' })).toBe(centimos(euros('ajo') * 0.02))
    // 1 puñado = 25 g
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
    // Los huevos van por ud y no hay forma honesta de valorar "medio puñado".
    expect(precioDe({ nombre: 'huevos', cantidad: 1, unidad: 'puñado' })).toBeNull()
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
    // Si esto deja de ser null, el reparto de stock de la despensa empieza a
    // inventarse conversiones y descuadra lo que hay en casa.
    expect(convertir(2, 'cucharada', 'ml')).toBeNull()
    expect(convertir(1, 'diente', 'g')).toBeNull()
    expect(convertir(1, 'puñado', 'g')).toBeNull()
  })
})

// La tabla la editan tres manos: yo, Karim al volver de la compra, y la skill
// del chef. Estas comprobaciones son las que evitan que una edicion torcida
// entre en produccion sin que salte nada.
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

  it('gramosPorUd solo en lo que se vende al peso', () => {
    const malas = PRECIOS.filter((p) => p.gramosPorUd != null && !['g', 'kg'].includes(p.unidad))
    expect(malas.map((p) => p.nombre)).toEqual([])
  })

  it('los nombres van en minúscula y sin espacios de sobra', () => {
    const malas = PRECIOS.filter((p) => p.nombre !== p.nombre.trim().toLowerCase())
    expect(malas.map((p) => p.nombre)).toEqual([])
  })

  it('ninguna entrada queda inalcanzable por otra', () => {
    const malas = PRECIOS.filter((p) => buscarPrecio(p.nombre)?.nombre !== p.nombre)
    expect(malas.map((p) => p.nombre)).toEqual([])
  })

  it('ningún precio es absurdo para comida de supermercado', () => {
    // Red contra el dedazo: 90 €/kg no existe en Dirk ni en Lidl.
    const porKilo = PRECIOS.filter((p) => p.unidad === 'kg')
    expect(porKilo.filter((p) => p.euros > 60).map((p) => p.nombre)).toEqual([])
  })
})
