import { describe, it, expect } from 'vitest'
import { convertir, redondear, unidadMedible, requiereCantidad, unidadPorDefecto, UNIDADES_DESPENSA } from '../utils/cantidades'

describe('convertir', () => {
  it('convierte dentro de la misma dimensión', () => {
    expect(convertir(1, 'kg', 'g')).toBe(1000)
    expect(convertir(250, 'g', 'kg')).toBe(0.25)
    expect(convertir(1, 'l', 'ml')).toBe(1000)
    expect(convertir(5, 'cl', 'ml')).toBe(50)
    expect(convertir(3, 'ud', 'ud')).toBe(3)
  })

  it('no cruza dimensiones ni inventa densidades', () => {
    expect(convertir(500, 'g', 'ml')).toBeNull()
    expect(convertir(2, 'ud', 'g')).toBeNull()
    expect(convertir(2, 'cucharada', 'ml')).toBeNull()
    expect(convertir(2, 'diente', 'ud')).toBeNull()
  })

  it('normaliza la unidad antes de buscarla', () => {
    expect(convertir(1, 'KG', 'g')).toBe(1000)
    expect(convertir(1, ' kg ', 'g')).toBe(1000)
  })

  it('redondea a dos decimales el resultado', () => {
    expect(convertir(1, 'g', 'kg')).toBe(0)
    expect(convertir(15, 'g', 'kg')).toBe(0.02)
  })
})

describe('redondear', () => {
  it('deja dos decimales', () => {
    expect(redondear(1.005)).toBe(1)
    expect(redondear(1.006)).toBe(1.01)
    expect(redondear(300)).toBe(300)
  })
})

describe('unidadMedible', () => {
  it('acepta solo las unidades con equivalencia', () => {
    for (const u of ['g', 'kg', 'ml', 'l', 'cl', 'ud']) expect(unidadMedible(u), u).toBe(true)
    for (const u of ['cucharada', 'diente', 'al gusto', 'puñado']) expect(unidadMedible(u), u).toBe(false)
  })

  it('trata la unidad ausente como no medible', () => {
    expect(unidadMedible(undefined)).toBe(false)
    expect(unidadMedible('')).toBe(false)
  })

  it('acepta cl aunque el selector de la despensa no lo ofrezca', () => {
    expect(unidadMedible('cl')).toBe(true)
    expect([...UNIDADES_DESPENSA]).not.toContain('cl')
  })
})

describe('requiereCantidad', () => {
  it('pide cantidad donde una receta se lleva parte apreciable de lo que hay', () => {
    for (const f of ['carnes', 'pescados', 'verduras', 'cereales', 'legumbres', 'huevos']) {
      expect(requiereCantidad(f), f).toBe(true)
    }
  })

  it('no la pide en lo que se compra por envase y dura semanas', () => {
    for (const f of ['especias', 'condimentos', 'salsas', 'bebidas', 'hogar', 'otros']) {
      expect(requiereCantidad(f), f).toBe(false)
    }
  })

  it('acepta la familia escrita con acento o sin él', () => {
    expect(requiereCantidad('lácteos')).toBe(true)
    expect(requiereCantidad('lacteos')).toBe(true)
    expect(requiereCantidad('LÁCTEOS')).toBe(true)
  })
})

describe('unidadPorDefecto', () => {
  it('cuenta por piezas lo que se compra por piezas', () => {
    expect(unidadPorDefecto('huevos')).toBe('ud')
    expect(unidadPorDefecto('frutas')).toBe('ud')
    expect(unidadPorDefecto('verduras')).toBe('ud')
    expect(unidadPorDefecto('conservas')).toBe('ud')
  })

  it('mide en ml lo líquido', () => {
    expect(unidadPorDefecto('bebidas')).toBe('ml')
  })

  it('cae a gramos en el resto', () => {
    expect(unidadPorDefecto('carnes')).toBe('g')
    expect(unidadPorDefecto('familia inventada')).toBe('g')
  })
})
