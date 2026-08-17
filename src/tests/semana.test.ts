import { describe, it, expect } from 'vitest'
import { semanaEquilibrada, aporteDe } from '../utils/semana'
import type { Micros, Receta } from '../types/receta'

const MICROS_CERO: Micros = {
  fibra: 0, azucares: 0, saturadas: 0, sal: 0, hierroHemo: 0,
  vitaminaC: 0, calcio: 0, b12: 0, folato: 0, gluten: null, estimadoDe: 'completo',
}

let n = 0
function receta(over: Omit<Partial<Receta>, 'micros'> & { micros?: Partial<Micros> } = {}): Receta {
  const { micros, ...resto } = over
  return {
    id: `r${++n}`,
    nombre: `Receta ${n}`,
    categoria: 'espanola',
    sabor: 'salado',
    tiempoPreparacion: 20,
    favorita: false,
    porciones: 2,
    ingredientes: [{ nombre: 'pollo', cantidad: 400, unidad: 'g', familia: 'carnes' }],
    pasos: ['Cocinar'],
    micros: { ...MICROS_CERO, ...micros },
    ...resto,
  }
}

function guarnicion(nombre: string, micros: Partial<Micros> = {}) {
  return {
    nombre,
    ingredientes: [{ nombre, cantidad: 200, unidad: 'g', familia: 'verduras' }],
    pasos: ['Cocer'],
    micros: { ...MICROS_CERO, ...micros },
  }
}

describe('aporteDe', () => {
  it('suma el plato y su guarnición', () => {
    const r = receta({ micros: { fibra: 3 }, hierro: 2, guarnicion: guarnicion('brócoli', { fibra: 4 }) })
    r.guarnicion!.hierro = 1
    const a = aporteDe(r)
    expect(a.fibra).toBe(7)
    expect(a.hierro).toBe(3)
  })

  it('suma también los macros del plato y de la guarnición', () => {
    const r = receta({ proteinas: 38, carbohidratos: 20, grasas: 12, guarnicion: guarnicion('brócoli') })
    Object.assign(r.guarnicion!, { proteinas: 4, carbohidratos: 8, grasas: 1 })
    const a = aporteDe(r)
    expect(a.proteinas).toBe(42)
    expect(a.carbohidratos).toBe(28)
    expect(a.grasas).toBe(13)
  })

  it('una receta sin micros ni guarnición aporta cero, no revienta', () => {
    const r = receta()
    delete r.micros
    expect(aporteDe(r).fibra).toBe(0)
  })
})

describe('semanaEquilibrada', () => {
  it('devuelve n platos sin repetir ninguno', () => {
    const recetas = Array.from({ length: 20 }, (_, i) =>
      receta({ categoria: `cocina${i}`, micros: { fibra: i } })
    )
    const semana = semanaEquilibrada(recetas, 7, 1)
    expect(semana).toHaveLength(7)
    expect(new Set(semana.map((r) => r.id)).size).toBe(7)
  })

  it('no pide más de lo que hay', () => {
    expect(semanaEquilibrada([receta(), receta()], 7, 1)).toHaveLength(2)
  })

  it('prefiere el plato que cubre el micronutriente que falta al que repite el que sobra', () => {
    const pool = [
      receta({ categoria: 'a', micros: { calcio: 900 } }),
      receta({ categoria: 'b', micros: { calcio: 900 } }),
      receta({ categoria: 'c', micros: { vitaminaC: 90 } }),
    ]
    const semana = semanaEquilibrada(pool, 2, 7)
    expect(semana.map((r) => r.categoria)).toContain('c')
  })

  it('reparte la verdura en vez de servir la misma siete veces', () => {
    const verduras = ['brócoli', 'espinacas', 'tomate', 'zanahoria', 'judías verdes', 'pepino', 'lechuga']
    const recetas = verduras.flatMap((v, i) =>
      Array.from({ length: 3 }, () =>
        receta({ categoria: `cocina${i}`, guarnicion: guarnicion(v, { fibra: 4 }) })
      )
    )
    const semana = semanaEquilibrada(recetas, 7, 3)
    const distintas = new Set(semana.map((r) => r.guarnicion!.ingredientes[0].nombre))
    expect(distintas.size).toBeGreaterThanOrEqual(5)
  })

  it('no repite un plato que ya está puesto en la semana', () => {
    const pool = Array.from({ length: 4 }, (_, i) => receta({ categoria: `cocina${i}` }))
    const semana = semanaEquilibrada(pool, 3, 5, [pool[0], pool[2]])
    expect(semana.map((r) => r.id)).not.toContain(pool[0].id)
    expect(semana.map((r) => r.id)).not.toContain(pool[2].id)
  })

  it('compensa el micronutriente que los platos ya puestos no cubren', () => {
    const puesta = receta({ categoria: 'z', micros: { calcio: 2800 } })
    const pool = [
      receta({ categoria: 'a', micros: { calcio: 900 } }),
      receta({ categoria: 'b', micros: { vitaminaC: 90 } }),
    ]
    const semana = semanaEquilibrada(pool, 1, 7, [puesta])
    expect(semana[0].categoria).toBe('b')
  })

  it('no repite la verdura ni la cocina de lo que ya está puesto', () => {
    const puesta = receta({ categoria: 'italiana', guarnicion: guarnicion('brócoli', { fibra: 4 }) })
    const pool = [
      receta({ categoria: 'italiana', guarnicion: guarnicion('brócoli', { fibra: 4 }) }),
      receta({ categoria: 'japonesa', guarnicion: guarnicion('espinacas', { fibra: 4 }) }),
    ]
    const semana = semanaEquilibrada(pool, 1, 4, [puesta])
    expect(semana[0].categoria).toBe('japonesa')
  })

  it('dos semanas con distinta semilla no salen iguales', () => {
    const recetas = Array.from({ length: 30 }, (_, i) =>
      receta({ categoria: `cocina${i % 6}`, micros: { fibra: i % 9, calcio: (i * 37) % 400 } })
    )
    const a = semanaEquilibrada(recetas, 7, 1).map((r) => r.id).join()
    const b = semanaEquilibrada(recetas, 7, 999).map((r) => r.id).join()
    expect(a).not.toBe(b)
  })

  it('reparte los macros en vez de amontonar la energía en uno solo', () => {
    const puesta = receta({ categoria: 'z', proteinas: 20, carbohidratos: 10, grasas: 60 })
    const pool = [
      receta({ categoria: 'a', proteinas: 10, carbohidratos: 5, grasas: 70 }),
      receta({ categoria: 'b', proteinas: 45, carbohidratos: 55, grasas: 10 }),
    ]
    const semana = semanaEquilibrada(pool, 1, 11, [puesta])
    expect(semana[0].categoria).toBe('b')
  })

  it('con la misma semilla sale la misma semana', () => {
    const recetas = Array.from({ length: 15 }, (_, i) => receta({ micros: { fibra: i } }))
    const a = semanaEquilibrada(recetas, 7, 42).map((r) => r.id)
    const b = semanaEquilibrada(recetas, 7, 42).map((r) => r.id)
    expect(a).toEqual(b)
  })
})
