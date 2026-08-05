import { describe, it, expect } from 'vitest'
import { precioDe, buscarPrecio, costeCompra } from '../utils/precios'
import { convertir } from '../utils/cantidades'

// El precio de la lista tiene que salir de lo que se compra de verdad, y no
// puede inventarse lo que no sabe.

describe('buscarPrecio', () => {
  it('encuentra por nombre exacto', () => {
    expect(buscarPrecio('pechuga de pollo')?.euros).toBe(8)
    expect(buscarPrecio('huevos')?.unidad).toBe('ud')
  })

  it('tolera plural y acento como el resto del matcher', () => {
    expect(buscarPrecio('Huevo')?.nombre).toBe('huevos')
    expect(buscarPrecio('limones')?.nombre).toBe('limon')
  })

  it('el corte concreto no se cobra a precio de otro', () => {
    // El error que este orden evita: que una entrada genérica de pollo pisara
    // a los contramuslos y los cobrase a 8 €/kg en vez de a 5,50.
    expect(buscarPrecio('contramuslos de pollo')?.euros).toBe(5.5)
    expect(buscarPrecio('pechuga de pollo')?.euros).toBe(8)
  })

  it('no funde productos distintos que comparten cabeza', () => {
    expect(buscarPrecio('aceite de oliva')?.euros).toBe(8)
    expect(buscarPrecio('aceite de girasol')?.euros).toBe(2.5)
  })

  it('devuelve null en lo que no conoce', () => {
    expect(buscarPrecio('polvo de estrellas')).toBeNull()
  })
})

describe('precioDe', () => {
  it('convierte dentro de la dimensión', () => {
    expect(precioDe({ nombre: 'pechuga de pollo', cantidad: 500, unidad: 'g' })).toBe(4)
    expect(precioDe({ nombre: 'pechuga de pollo', cantidad: 1, unidad: 'kg' })).toBe(8)
    expect(precioDe({ nombre: 'leche', cantidad: 500, unidad: 'ml' })).toBe(0.55)
  })

  it('cuenta por piezas lo que se vende por piezas', () => {
    expect(precioDe({ nombre: 'huevos', cantidad: 6, unidad: 'ud' })).toBe(1.8)
    expect(precioDe({ nombre: 'limon', cantidad: 2, unidad: 'ud' })).toBe(0.8)
  })

  it('traduce las unidades de cocina', () => {
    // 2 cucharadas de aceite = 30 ml a 8 €/L
    expect(precioDe({ nombre: 'aceite de oliva', cantidad: 2, unidad: 'cucharada' })).toBe(0.24)
    // 4 dientes de ajo = 20 g a 8 €/kg
    expect(precioDe({ nombre: 'ajo', cantidad: 4, unidad: 'diente' })).toBe(0.16)
    // 1 puñado de perejil = 25 g
    expect(precioDe({ nombre: 'perejil', cantidad: 1, unidad: 'puñado' })).toBe(0.63)
  })

  it('pasa a peso lo que la receta cuenta en piezas pero se vende al kilo', () => {
    // 2 contramuslos = 240 g a 5,50 €/kg
    expect(precioDe({ nombre: 'contramuslos de pollo', cantidad: 2, unidad: 'ud' })).toBe(1.32)
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
    const r = costeCompra([
      { nombre: 'pechuga de pollo', cantidad: 500, unidad: 'g' },
      { nombre: 'huevos', cantidad: 6, unidad: 'ud' },
      { nombre: 'polvo de estrellas', cantidad: 1, unidad: 'g' },
    ])
    expect(r.total).toBe(5.8)
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
