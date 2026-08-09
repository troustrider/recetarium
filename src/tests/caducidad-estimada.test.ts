import { describe, it, expect } from 'vitest'
import { caducidadEstimada, diasEstimados, sumarDias } from '../utils/caducidadEstimada'

const HOY = new Date('2026-08-09T10:00:00')

describe('diasEstimados', () => {
  it('usa el ingrediente concreto antes que la familia', () => {
    expect(diasEstimados('lechuga', 'verduras')).toBe(5)
    expect(diasEstimados('ajo', 'verduras')).toBe(90)
    expect(diasEstimados('calabacín', 'verduras')).toBe(10)
  })

  it('cae a la familia cuando el ingrediente no está en la tabla', () => {
    expect(diasEstimados('nabo daikon', 'verduras')).toBe(21) // por el token "nabo"
    expect(diasEstimados('hinojo', 'verduras')).toBe(7)
    expect(diasEstimados('rape', 'pescados')).toBe(2)
  })

  it('tolera plurales, acentos y descriptores', () => {
    expect(diasEstimados('Zanahorias', 'verduras')).toBe(21)
    expect(diasEstimados('champiñones', 'verduras')).toBe(6)
    expect(diasEstimados('tomate cherry', 'verduras')).toBe(7)
    expect(diasEstimados('judías verdes', 'verduras')).toBe(7)
  })

  it('resuelve por la cabeza del nombre, no por cualquier token', () => {
    expect(diasEstimados('pechuga de pollo', 'carnes')).toBe(2)
    expect(diasEstimados('harina de maíz', 'cereales')).toBeNull()
  })

  it('alarga lo congelado', () => {
    expect(diasEstimados('brócoli congelado', 'verduras')).toBe(180)
  })

  it('no estima lo que viene con fecha propia o dura años', () => {
    expect(diasEstimados('atún en lata', 'conservas')).toBeNull()
    expect(diasEstimados('comino', 'especias')).toBeNull()
    expect(diasEstimados('arroz', 'cereales')).toBeNull()
    expect(diasEstimados('lentejas', 'legumbres')).toBeNull()
    expect(diasEstimados('detergente', 'hogar')).toBeNull()
    expect(diasEstimados('', 'verduras')).toBeNull()
  })

  it('estima el perecedero suelto aunque su familia no estime', () => {
    expect(diasEstimados('pan', 'cereales')).toBe(4)
    expect(diasEstimados('tofu', 'otros')).toBe(7)
  })
})

describe('caducidadEstimada', () => {
  it('devuelve la fecha en YYYY-MM-DD contada desde hoy', () => {
    expect(caducidadEstimada('lechuga', 'verduras', HOY)).toBe('2026-08-14')
    expect(caducidadEstimada('patata', 'verduras', HOY)).toBe('2026-09-23')
  })

  it('devuelve null cuando no hay estimación', () => {
    expect(caducidadEstimada('sal', 'especias', HOY)).toBeNull()
  })

  it('cruza el fin de mes y de año sin desviarse', () => {
    expect(sumarDias(30, new Date('2026-12-20T23:30:00'))).toBe('2027-01-19')
  })
})
