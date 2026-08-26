import { describe, it, expect } from 'vitest'
import {
  envaseDeFormato, envaseDe, desperdicioDe, cuentaDeLaCompra,
  cestaVacia, anadirALaCesta, loQueAnade, fraccionQueSeTira,
} from '../utils/desperdicio'
import type { Ingrediente } from '../types/receta'

const ing = (nombre: string, cantidad: number, unidad: string, familia: string): Ingrediente =>
  ({ nombre, cantidad, unidad, familia })

describe('el envase que hay que comprar entero', () => {
  it('lee el tamaño y el precio anotados en el formato', () => {
    expect(envaseDeFormato('tarro 350 g · 2,45 €', 7, 'kg')).toEqual({ cantidad: 350, unidad: 'g', euros: 2.45 })
  })

  it('sin precio en el formato, lo saca del precio por kilo', () => {
    expect(envaseDeFormato('bote 400 g', 5, 'kg')).toEqual({ cantidad: 400, unidad: 'g', euros: 2 })
  })

  it('un formato sin cifra no dice de qué envase habla', () => {
    expect(envaseDeFormato('media NL ago-2026', 12, 'kg')).toBeNull()
  })

  it('los mililitros no se confunden con los gramos', () => {
    expect(envaseDeFormato('botella 750 ml · 3,00 €', 4, 'l')?.unidad).toBe('ml')
  })
})

describe('lo que se tira si un solo plato lo pide', () => {
  it('el fondo de armario no se tira: lo que sobra espera en el armario', () => {
    expect(desperdicioDe(ing('canela', 1, 'cucharadita', 'especias'))).toBe(0)
    expect(desperdicioDe(ing('arroz', 200, 'g', 'cereales'))).toBe(0)
  })

  it('del perecedero se tira lo que queda del envase', () => {
    const espinacas = ing('espinacas', 100, 'g', 'verduras')
    const envase = envaseDe('espinacas')
    if (!envase) return // sin envase anotado no hay cuenta que hacer
    expect(desperdicioDe(espinacas)).toBeGreaterThan(0)
    expect(desperdicioDe(espinacas)).toBeLessThan(envase.euros)
  })

  it('quien se acaba el envase no tira nada', () => {
    const envase = envaseDe('espinacas')
    if (!envase) return
    expect(desperdicioDe(ing('espinacas', envase.cantidad, 'g', 'verduras'))).toBeCloseTo(0, 2)
  })
})

describe('la cuenta de la compra', () => {
  const plato = (ingredientes: Ingrediente[]) => ({ ingredientes })

  it('se paga el envase entero, no la cucharada', () => {
    const cuenta = cuentaDeLaCompra([plato([ing('espinacas', 50, 'g', 'verduras')])])
    if (cuenta.lineas.length === 0) return
    expect(cuenta.pagado).toBeGreaterThan(cuenta.comido)
  })

  it('un segundo plato que lo use rescata lo que se iba a tirar', () => {
    const uno = cuentaDeLaCompra([plato([ing('espinacas', 100, 'g', 'verduras')])])
    const dos = cuentaDeLaCompra([
      plato([ing('espinacas', 100, 'g', 'verduras')]),
      plato([ing('espinacas', 100, 'g', 'verduras')]),
    ])
    if (uno.lineas.length === 0) return
    expect(dos.tirado).toBeLessThan(uno.tirado)
    expect(dos.comido).toBeGreaterThan(uno.comido)
  })

  it('lo que no tiene envase conocido queda fuera de la cuenta, y se dice', () => {
    const cuenta = cuentaDeLaCompra([plato([ing('unicornio en conserva', 1, 'ud', 'otros')])])
    expect(cuenta.sinEnvase).toContain('unicornio en conserva')
    expect(cuenta.pagado).toBe(0)
  })
})

describe('lo que un plato más le hace a la cesta', () => {
  const plato = (ingredientes: Ingrediente[]) => ({ ingredientes })

  it('el que se acaba lo que ya estaba abierto no añade basura', () => {
    const envase = envaseDe('espinacas')!
    const cesta = cestaVacia()
    anadirALaCesta(cesta, plato([ing('espinacas', envase.cantidad / 3, 'g', 'verduras')]))
    const segundo = plato([ing('espinacas', (2 * envase.cantidad) / 3, 'g', 'verduras')])
    expect(loQueAnade(cesta, segundo).basura).toBeLessThan(0)
    expect(fraccionQueSeTira(cesta, segundo)).toBe(0)
  })

  it('abrir un envase nuevo para una cucharada lo tira casi entero', () => {
    const cesta = cestaVacia()
    expect(fraccionQueSeTira(cesta, plato([ing('espinacas', 20, 'g', 'verduras')]))).toBeGreaterThan(0.8)
  })

  it('el que se acaba el envase justo no tira nada', () => {
    const envase = envaseDe('espinacas')!
    const cesta = cestaVacia()
    expect(fraccionQueSeTira(cesta, plato([ing('espinacas', envase.cantidad, 'g', 'verduras')]))).toBe(0)
  })

  it('el fondo de armario no cuenta: se guarda y se gasta otro día', () => {
    const cesta = cestaVacia()
    expect(fraccionQueSeTira(cesta, plato([ing('arroz', 100, 'g', 'cereales')]))).toBe(0)
  })

  it('lo que ya está en casa no se compra, así que no deja sobra que evitar', () => {
    const cesta = cestaVacia()
    const enCasa = (nombre: string) => nombre === 'espinacas'
    expect(fraccionQueSeTira(cesta, plato([ing('espinacas', 20, 'g', 'verduras')]), enCasa)).toBe(0)
  })
})
