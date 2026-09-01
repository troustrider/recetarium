import { describe, it, expect } from 'vitest'
import { guarnicionElegida, guarnicionRecomendada, guarnicionesDe, ingredientesDe } from '../utils/ingredientes'
import { consumoAlCocinar } from '../utils/consumo'
import type { Guarnicion, Receta } from '../types/receta'

const ARROZ: Guarnicion = {
  id: 'g-arroz',
  nombre: 'Arroz blanco',
  aporta: ['almidon'],
  ingredientes: [{ nombre: 'arroz', cantidad: 160, unidad: 'g', familia: 'cereales' }],
  pasos: ['Cocer 12 min'],
}

const BROCOLI: Guarnicion = {
  id: 'g-brocoli',
  nombre: 'Brócoli al vapor',
  aporta: ['verdura'],
  ingredientes: [{ nombre: 'brócoli', cantidad: 300, unidad: 'g', familia: 'verduras' }],
  pasos: ['Al vapor 4 min'],
}

const RECETA: Receta = {
  id: 'r1',
  nombre: 'Pollo al curry',
  categoria: 'india',
  sabor: 'salado',
  tiempoPreparacion: 30,
  favorita: false,
  porciones: 2,
  ingredientes: [{ nombre: 'pollo', cantidad: 400, unidad: 'g', familia: 'carnes' }],
  pasos: ['Cocinar'],
  guarniciones: [ARROZ, BROCOLI],
}

const SIN_GUARNICION: Receta = { ...RECETA, guarniciones: [] }

describe('guarnicionesDe', () => {
  it('una receta anterior al catálogo devuelve lista vacía, no revienta', () => {
    expect(guarnicionesDe({} as Receta)).toEqual([])
  })
})

describe('guarnicionElegida', () => {
  it('sin id no hay guarnición', () => {
    expect(guarnicionElegida(RECETA)).toBeNull()
  })

  it('devuelve la del id pedido, no la primera', () => {
    expect(guarnicionElegida(RECETA, 'g-brocoli')?.nombre).toBe('Brócoli al vapor')
  })

  it('un id que ya no está en la receta no cuela como la recomendada', () => {
    expect(guarnicionElegida(RECETA, 'g-borrada')).toBeNull()
  })

  it('la recomendada es la primera del reparto', () => {
    expect(guarnicionRecomendada(RECETA)?.id).toBe('g-arroz')
    expect(guarnicionRecomendada(SIN_GUARNICION)).toBeNull()
  })
})

describe('ingredientesDe', () => {
  it('sin elegir ninguna, devuelve solo los del plato', () => {
    expect(ingredientesDe(RECETA).map((i) => i.nombre)).toEqual(['pollo'])
  })

  it('con una elegida, añade los suyos detrás', () => {
    expect(ingredientesDe(RECETA, 'g-arroz').map((i) => i.nombre)).toEqual(['pollo', 'arroz'])
  })

  it('cada opción trae los suyos, no los de la recomendada', () => {
    expect(ingredientesDe(RECETA, 'g-brocoli').map((i) => i.nombre)).toEqual(['pollo', 'brócoli'])
  })

  it('un id desconocido deja el plato como está', () => {
    expect(ingredientesDe(RECETA, 'g-borrada').map((i) => i.nombre)).toEqual(['pollo'])
    expect(ingredientesDe(SIN_GUARNICION, 'g-arroz').map((i) => i.nombre)).toEqual(['pollo'])
  })

  it('no muta el array de la receta', () => {
    ingredientesDe(RECETA, 'g-arroz')
    expect(RECETA.ingredientes).toHaveLength(1)
  })
})

describe('consumo de despensa', () => {
  const despensa = [
    { nombre: 'pollo', familia: 'carnes', cantidad: 1000, unidad: 'g' },
    { nombre: 'arroz', familia: 'cereales', cantidad: 500, unidad: 'g' },
  ]

  it('sin guarnición no toca el arroz', () => {
    const consumos = consumoAlCocinar([{ receta: RECETA, raciones: 2 }], despensa)
    expect(consumos.map((c) => c.nombre)).toEqual(['pollo'])
  })

  it('con el arroz elegido lo descuenta', () => {
    const consumos = consumoAlCocinar([{ receta: RECETA, raciones: 2, guarnicionId: 'g-arroz' }], despensa)
    const arroz = consumos.find((c) => c.nombre === 'arroz')
    expect(arroz).toBeTruthy()
    expect(arroz!.cantidad).toBe(340)
  })

  it('con el brócoli elegido el arroz se queda entero', () => {
    const consumos = consumoAlCocinar([{ receta: RECETA, raciones: 2, guarnicionId: 'g-brocoli' }], despensa)
    expect(consumos.map((c) => c.nombre)).toEqual(['pollo'])
  })
})
