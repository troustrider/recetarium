import { describe, it, expect } from 'vitest'
import { diasTrasAbrir, caducidadTrasAbrir, caducidadAlAbrir } from '../utils/trasAbrir'

describe('diasTrasAbrir', () => {
  it('da los días del ingrediente concreto', () => {
    expect(diasTrasAbrir('nata', 'lácteos')).toBe(3)
    expect(diasTrasAbrir('hummus', 'otros')).toBe(3)
    expect(diasTrasAbrir('salsa de soja', 'salsas')).toBe(180)
  })

  it('tolera plurales, acentos y coletillas', () => {
    expect(diasTrasAbrir('Nata para cocinar', 'lácteos')).toBe(3)
    expect(diasTrasAbrir('atún en lata', 'conservas')).toBe(2)
    expect(diasTrasAbrir('aceitunas verdes', 'conservas')).toBe(14)
  })

  it('resuelve por la cabeza del nombre cuando el nombre completo no está', () => {
    expect(diasTrasAbrir('queso de cabra', 'lácteos')).toBe(14)
    expect(diasTrasAbrir('leche de coco', 'bebidas')).toBe(3) // el específico gana al genérico
  })

  it('una lata abierta deja de ser una conserva', () => {
    expect(diasTrasAbrir('alcachofas', 'conservas')).toBe(3)
    expect(diasTrasAbrir('garbanzos', 'conservas')).toBe(3)
  })

  it('pero la bolsa de secos no: ahí manda la familia', () => {
    expect(diasTrasAbrir('garbanzos', 'legumbres')).toBeNull()
    expect(diasTrasAbrir('arroz', 'cereales')).toBeNull()
    expect(diasTrasAbrir('comino', 'especias')).toBeNull()
  })

  it('abrir la bolsa de lo congelado no arranca ningún reloj', () => {
    expect(diasTrasAbrir('espinacas congeladas', 'verduras')).toBeNull()
  })

  it('no inventa nada para lo que no conoce', () => {
    expect(diasTrasAbrir('', 'lácteos')).toBeNull()
    expect(diasTrasAbrir('calabacín', 'verduras')).toBeNull()
  })
})

describe('caducidadTrasAbrir', () => {
  it('cuenta desde el día que se abrió, no desde hoy', () => {
    expect(caducidadTrasAbrir('nata', 'lácteos', '2026-08-10')).toBe('2026-08-13')
    expect(caducidadTrasAbrir('mostaza', 'salsas', '2026-08-10')).toBe('2026-11-08')
  })

  it('devuelve null cuando abrirlo no le hace nada', () => {
    expect(caducidadTrasAbrir('arroz', 'cereales', '2026-08-10')).toBeNull()
  })
})

describe('caducidadAlAbrir', () => {
  const nata = { nombre: 'nata', familia: 'lácteos' }

  it('recorta la fecha impresa a lo que aguanta abierto', () => {
    expect(caducidadAlAbrir({ ...nata, caducidad: '2026-10-30' }, '2026-08-10')).toBe('2026-08-13')
  })

  it('no alarga la vida de nada: si ya caducaba antes, manda la de antes', () => {
    expect(caducidadAlAbrir({ ...nata, caducidad: '2026-08-11' }, '2026-08-10')).toBe('2026-08-11')
  })

  it('pone fecha a lo que no la tenía', () => {
    expect(caducidadAlAbrir(nata, '2026-08-10')).toBe('2026-08-13')
  })

  it('deja la fecha como estaba cuando abrirlo da igual', () => {
    const arroz = { nombre: 'arroz', familia: 'cereales', caducidad: '2027-01-01' }
    expect(caducidadAlAbrir(arroz, '2026-08-10')).toBe('2027-01-01')
    expect(caducidadAlAbrir({ nombre: 'arroz', familia: 'cereales' }, '2026-08-10')).toBeUndefined()
  })
})
