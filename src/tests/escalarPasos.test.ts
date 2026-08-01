import { describe, it, expect } from 'vitest'
import { escalarPaso, tieneCantidadesEscalables } from '../utils/escalarPasos'

describe('escalarPasos', () => {
  it('escala solo lo marcado y quita las llaves', () => {
    expect(escalarPaso('Sofríe {1 cebolla} y {300 g} de carne.', 2)).toBe('Sofríe 2 cebolla y 600 g de carne.')
  })

  it('no toca tiempos, temperaturas ni tamaños de utensilio', () => {
    const paso = 'Dora {300 g} de pollo en una sartén de 24 cm 8-10 min hasta 74°C.'
    expect(escalarPaso(paso, 2)).toBe('Dora 600 g de pollo en una sartén de 24 cm 8-10 min hasta 74°C.')
  })

  it('con multiplicador 1 solo limpia las llaves', () => {
    expect(escalarPaso('Añade {2 cucharadas} de soja.', 1)).toBe('Añade 2 cucharadas de soja.')
  })

  it('produce fracciones legibles al reducir', () => {
    expect(escalarPaso('Usa {1 vaso} de arroz.', 0.5)).toBe('Usa ½ vaso de arroz.')
  })

  it('entiende fracciones unicode de entrada', () => {
    expect(escalarPaso('Añade {½ cucharadita} de sal.', 2)).toBe('Añade 1 cucharadita de sal.')
  })

  it('concuerda el número de las unidades contables', () => {
    expect(escalarPaso('Pon {1 vaso} de arroz y {1 cucharada} de soja.', 2)).toBe('Pon 2 vasos de arroz y 2 cucharadas de soja.')
    expect(escalarPaso('Añade {2 cucharadas} de soja.', 0.5)).toBe('Añade 1 cucharada de soja.')
  })

  it('no pluraliza las unidades de masa o volumen', () => {
    expect(escalarPaso('Añade {300 g} de carne y {100 ml} de leche.', 2)).toBe('Añade 600 g de carne y 200 ml de leche.')
  })

  it('detecta si un paso trae cantidades escalables', () => {
    expect(tieneCantidadesEscalables(['Cuece {1 vaso} de arroz 12 min.'])).toBe(true)
    expect(tieneCantidadesEscalables(['Cuece el arroz 12 min.'])).toBe(false)
  })
})
