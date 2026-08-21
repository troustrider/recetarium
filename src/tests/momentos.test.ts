import { describe, it, expect } from 'vitest'
import { cabeDeNoche, momentoPorDefecto, siguienteMomento, TOPE_CENA } from '../utils/momentos'
import type { RecetaListada } from '../types/receta'

const plato = (over: Partial<RecetaListada> = {}) =>
  ({ calorias: 700, grasas: 20, ...over }) as RecetaListada

describe('cabeDeNoche', () => {
  it('deja fuera el plato que se pasa de energía o de grasa', () => {
    expect(cabeDeNoche(plato())).toBe(true)
    expect(cabeDeNoche(plato({ calorias: TOPE_CENA.calorias + 1 }))).toBe(false)
    expect(cabeDeNoche(plato({ grasas: TOPE_CENA.grasas + 1 }))).toBe(false)
  })

  it('cuenta la guarnición, que es lo que se come', () => {
    const conArroz = plato({
      calorias: 800,
      guarnicion: { nombre: 'arroz', ingredientes: [], calorias: 300, grasas: 2 } as RecetaListada['guarnicion'],
    })
    expect(cabeDeNoche(conArroz)).toBe(false)
  })

  it('un plato sin macros declarados pasa: no hay dato que le impute nada', () => {
    expect(cabeDeNoche({} as RecetaListada)).toBe(true)
  })
})

describe('momentos', () => {
  it('lo que no es desayuno cae en la cena, como antes de que existiera la comida', () => {
    expect(momentoPorDefecto('desayuno')).toBe('desayuno')
    expect(momentoPorDefecto('principal')).toBe('cena')
    expect(momentoPorDefecto()).toBe('cena')
  })

  it('el chip da la vuelta a la rueda', () => {
    expect(siguienteMomento('desayuno')).toBe('comida')
    expect(siguienteMomento('cena')).toBe('desayuno')
  })
})
