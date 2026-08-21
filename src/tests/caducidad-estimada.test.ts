import { describe, it, expect } from 'vitest'
import { caducidadEstimada, diasEstimados, esNoPerecedero, sumarDias } from '../utils/caducidadEstimada'

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
    expect(diasEstimados('harina de maíz', 'cereales')).toBe(240)
  })

  it('alarga lo congelado', () => {
    expect(diasEstimados('brócoli congelado', 'verduras')).toBe(180)
  })

  it('la despensa seca también estima, con plazos largos', () => {
    expect(diasEstimados('atún en lata', 'conservas')).toBe(730)
    expect(diasEstimados('comino', 'especias')).toBe(730)
    expect(diasEstimados('arroz', 'cereales')).toBe(730)
    expect(diasEstimados('lentejas', 'legumbres')).toBe(540)
    expect(diasEstimados('nueces', 'frutos secos')).toBe(180)
  })

  it('en la despensa seca manda la familia y no el nombre del fresco', () => {
    // El mismo atún: dos días en la nevera, dos años en la lata
    expect(diasEstimados('atún', 'pescados')).toBe(2)
    expect(diasEstimados('atún', 'conservas')).toBe(730)
    expect(diasEstimados('leche de coco', 'salsas')).toBe(365)
    expect(diasEstimados('leche', 'lacteos')).toBe(7)
  })

  it('salvo cuando el ingrediente contradice a su familia', () => {
    expect(diasEstimados('pan', 'cereales')).toBe(4)
    expect(diasEstimados('pan de molde', 'cereales')).toBe(8)
    expect(diasEstimados('masa de hojaldre', 'cereales')).toBe(3)
  })

  it('no estima lo que no se come, ni lo que no tiene nombre', () => {
    expect(diasEstimados('detergente', 'hogar')).toBeNull()
    expect(diasEstimados('', 'verduras')).toBeNull()
    expect(diasEstimados('cosa rara', 'otros')).toBeNull()
  })

  it('esNoPerecedero separa el fondo de armario de la carrera contra el reloj', () => {
    expect(esNoPerecedero('arroz', 'cereales')).toBe(true)
    expect(esNoPerecedero('atún en lata', 'conservas')).toBe(true)
    expect(esNoPerecedero('ajo', 'verduras')).toBe(true)
    expect(esNoPerecedero('pan', 'cereales')).toBe(false)
    expect(esNoPerecedero('patata', 'verduras')).toBe(false) // 45 días: aún corre
    expect(esNoPerecedero('lechuga', 'verduras')).toBe(false)
    expect(esNoPerecedero('detergente', 'hogar')).toBe(false)
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

  it('le pone fecha larga a la despensa seca', () => {
    expect(caducidadEstimada('arroz', 'cereales', HOY)).toBe('2028-08-08')
  })

  it('devuelve null cuando no hay estimación', () => {
    expect(caducidadEstimada('detergente', 'hogar', HOY)).toBeNull()
  })

  it('cruza el fin de mes y de año sin desviarse', () => {
    expect(sumarDias(30, new Date('2026-12-20T23:30:00'))).toBe('2027-01-19')
  })
})
