import { describe, it, expect } from 'vitest'
import { semanaEquilibrada, aporteDe, ajustesDe, repartirSemana } from '../utils/semana'
import { PREFERENCIAS_POR_DEFECTO, type Preferencias, type Prioridad } from '../types/preferencias'
import type { Micros, Receta } from '../types/receta'

const con = (over: Partial<Preferencias>): Preferencias => ({ ...PREFERENCIAS_POR_DEFECTO, ...over })
const conPrioridad = (...prioridades: Prioridad[]) => con({ prioridades })

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

describe('ajustesDe', () => {
  it('una prioridad sube su objetivo y deja los demás en su sitio', () => {
    const base = ajustesDe()
    const conProteina = ajustesDe(conPrioridad('proteina'))
    expect(conProteina.objetivos.proteinas).toBeGreaterThan(base.objetivos.proteinas)
    expect(conProteina.objetivos.fibra).toBe(base.objetivos.fibra)
  })

  it('las prioridades de "menos" bajan el techo, no suben ningún objetivo', () => {
    const a = ajustesDe(conPrioridad('menosSal', 'menosAzucar', 'ligera'))
    expect(a.techos.sal).toBeLessThan(ajustesDe().techos.sal)
    expect(a.techos.azucares).toBeLessThan(ajustesDe().techos.azucares)
    expect(a.techos.calorias).toBe(600)
    expect(a.objetivos).toEqual(ajustesDe().objetivos)
  })

  it('reparte la cuota entre las cocinas favoritas en vez de castigar lo que obliga la propia elección', () => {
    // Cuatro favoritas para siete días: alguna tiene que salir dos veces.
    expect(ajustesDe(con({ cocinasFavoritas: ['a', 'b', 'c', 'd'] }), 7).cuotaFavorita).toBe(2)
    expect(ajustesDe(con({ cocinasFavoritas: ['a'] }), 7).cuotaFavorita).toBe(7)
    expect(ajustesDe().cuotaFavorita).toBe(1)
  })

  it('una prioridad desconocida no revienta el cálculo', () => {
    const a = ajustesDe(con({ prioridades: ['inventada' as Prioridad] }))
    expect(a.objetivos).toEqual(ajustesDe().objetivos)
  })
})

describe('prioridades de salud', () => {
  it('con "menos sal" se va al plato soso aunque los dos alimenten igual', () => {
    const pool = [
      receta({ categoria: 'a', micros: { fibra: 6, sal: 4 } }),
      receta({ categoria: 'b', micros: { fibra: 6, sal: 0.8 } }),
    ]
    expect(semanaEquilibrada(pool, 1, 3, [], conPrioridad('menosSal'))[0].categoria).toBe('b')
  })

  it('con "ligera" descarta el plato de 900 kcal', () => {
    const pool = [
      receta({ categoria: 'a', calorias: 900, micros: { fibra: 6 } }),
      receta({ categoria: 'b', calorias: 500, micros: { fibra: 6 } }),
    ]
    expect(semanaEquilibrada(pool, 1, 3, [], conPrioridad('ligera'))[0].categoria).toBe('b')
  })

  it('sin la prioridad, ese mismo plato no está descartado', () => {
    const pool = [receta({ categoria: 'a', calorias: 900, micros: { fibra: 20 } })]
    expect(semanaEquilibrada(pool, 1, 3)).toHaveLength(1)
  })

  it('con "más proteína" prefiere el plato proteico al que solo trae fibra', () => {
    const pool = [
      receta({ categoria: 'a', proteinas: 50, carbohidratos: 40, grasas: 15 }),
      receta({ categoria: 'b', proteinas: 8, carbohidratos: 40, grasas: 15, micros: { fibra: 4 } }),
    ]
    expect(semanaEquilibrada(pool, 1, 5, [], conPrioridad('proteina'))[0].categoria).toBe('a')
  })
})

describe('cocinas favoritas', () => {
  const favoritas = con({ cocinasFavoritas: ['japonesa', 'italiana'] })

  it('prefiere una cocina favorita a igualdad de aporte', () => {
    const pool = [
      receta({ categoria: 'holandesa', micros: { fibra: 6 } }),
      receta({ categoria: 'japonesa', micros: { fibra: 6 } }),
    ]
    expect(semanaEquilibrada(pool, 1, 2, [], favoritas)[0].categoria).toBe('japonesa')
  })

  it('llena la semana con las favoritas repitiendo cocina, que es lo que pide elegir solo dos', () => {
    const pool = [
      ...Array.from({ length: 4 }, (_, i) => receta({ categoria: 'japonesa', micros: { fibra: i } })),
      ...Array.from({ length: 4 }, (_, i) => receta({ categoria: 'italiana', micros: { fibra: i } })),
      ...Array.from({ length: 8 }, (_, i) => receta({ categoria: `otra${i}`, micros: { fibra: i } })),
    ]
    const semana = semanaEquilibrada(pool, 6, 9, [], favoritas)
    const deFavoritas = semana.filter((r) => r.categoria === 'japonesa' || r.categoria === 'italiana')
    expect(deFavoritas.length).toBeGreaterThanOrEqual(5)
  })

  it('no son un filtro: si las favoritas no dan para la semana, entra lo demás', () => {
    const pool = [
      receta({ categoria: 'japonesa' }),
      ...Array.from({ length: 6 }, (_, i) => receta({ categoria: `otra${i}` })),
    ]
    expect(semanaEquilibrada(pool, 7, 4, [], favoritas)).toHaveLength(7)
  })
})

describe('la verdura del propio plato cuenta', () => {
  const conVerduraDentro = (nombre: string, resto: Partial<Receta> = {}) =>
    receta({
      ...resto,
      ingredientes: [
        { nombre: 'pollo', cantidad: 200, unidad: 'g', familia: 'carnes' },
        { nombre, cantidad: 150, unidad: 'g', familia: 'verduras' },
      ],
    })

  it('un guiso con verdura dentro no se penaliza como plato sin verdura', () => {
    const pool = [
      receta({ categoria: 'a' }),
      conVerduraDentro('calabacín', { categoria: 'b' }),
    ]
    expect(semanaEquilibrada(pool, 1, 6, [], conPrioridad('fibra'))[0].categoria).toBe('b')
  })

  it('y su verdura ya cuenta como puesta para el resto de la semana', () => {
    const puesta = conVerduraDentro('calabacín', { categoria: 'z' })
    const pool = [
      receta({ categoria: 'a', guarnicion: guarnicion('calabacín', { fibra: 4 }) }),
      receta({ categoria: 'b', guarnicion: guarnicion('brócoli', { fibra: 4 }) }),
    ]
    expect(semanaEquilibrada(pool, 1, 8, [puesta], conPrioridad('fibra'))[0].categoria).toBe('b')
  })
})

describe('repartirSemana', () => {
  it('llena antes el hueco estrecho para no gastarle su única opción', () => {
    const solo = receta({ categoria: 'a' })
    const otra = receta({ categoria: 'b' })
    const { porHueco, repetidos } = repartirSemana(
      [
        { id: 'ancho', candidatos: [solo, otra] },
        { id: 'estrecho', candidatos: [solo] },
      ],
      { semilla: 1 }
    )
    expect(porHueco.get('estrecho')!.id).toBe(solo.id)
    expect(porHueco.get('ancho')!.id).toBe(otra.id)
    expect(repetidos.size).toBe(0)
  })

  it('repite un plato antes que dejar el día vacío, y lo dice', () => {
    const unica = receta()
    const { porHueco, repetidos } = repartirSemana(
      [{ id: 'lunes', candidatos: [unica] }, { id: 'martes', candidatos: [unica] }],
      { semilla: 1 }
    )
    expect(porHueco.get('lunes')!.id).toBe(unica.id)
    expect(porHueco.get('martes')!.id).toBe(unica.id)
    expect([...repetidos]).toEqual(['martes'])
  })

  it('un hueco sin ninguna candidata se queda vacío en vez de inventarse un plato', () => {
    const { porHueco, repetidos } = repartirSemana(
      [{ id: 'lunes', candidatos: [receta()] }, { id: 'martes', candidatos: [] }],
      { semilla: 1 }
    )
    expect(porHueco.has('martes')).toBe(false)
    expect(repetidos.has('martes')).toBe(false)
  })
})

describe('lo cocinado no vuelve', () => {
  it('al repetir plato no rescata uno que ya estaba en la semana', () => {
    const cocinada = receta({ categoria: 'z' })
    const unica = receta({ categoria: 'a' })
    const { porHueco } = repartirSemana(
      [
        { id: 'lunes', candidatos: [cocinada, unica] },
        { id: 'martes', candidatos: [cocinada, unica] },
        { id: 'miercoles', candidatos: [cocinada, unica] },
      ],
      { yaEnLaSemana: [cocinada], semilla: 1 }
    )
    expect([...porHueco.values()].every((r) => r.id === unica.id)).toBe(true)
  })

  it('si lo único que cabía ya estaba cocinado, el hueco se queda vacío', () => {
    const cocinada = receta()
    const { porHueco } = repartirSemana(
      [{ id: 'lunes', candidatos: [cocinada] }],
      { yaEnLaSemana: [cocinada], semilla: 1 }
    )
    expect(porHueco.size).toBe(0)
  })
})
