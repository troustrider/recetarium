import { describe, it, expect } from 'vitest'
import { indiceDespensa, aprovechaDe, type ItemAprovechable } from '../utils/aprovechamiento'
import { semanaEquilibrada } from '../utils/semana'
import { sumarDias } from '../utils/caducidadEstimada'
import type { Ingrediente, Micros, RecetaListada } from '../types/receta'

const MICROS_CERO: Micros = {
  fibra: 0, azucares: 0, saturadas: 0, sal: 0, hierroHemo: 0,
  vitaminaC: 0, calcio: 0, b12: 0, folato: 0, gluten: null, estimadoDe: 'completo',
}

let n = 0
function receta(ingredientes: string[], over: Partial<RecetaListada> = {}): RecetaListada {
  return {
    id: `r${++n}`,
    nombre: `Receta ${n}`,
    categoria: 'espanola',
    sabor: 'salado',
    tiempoPreparacion: 20,
    favorita: false,
    porciones: 2,
    ingredientes: ingredientes.map((nombre): Ingrediente => ({
      nombre, cantidad: 100, unidad: 'g', familia: 'otros',
    })),
    micros: MICROS_CERO,
    ...over,
  }
}

const item = (over: Partial<ItemAprovechable> & { nombre: string }): ItemAprovechable => ({
  familia: 'otros', estado: 'lleno', ...over,
})

const pesoDe = (i: ItemAprovechable) => indiceDespensa([i]).pesos[0]

describe('indiceDespensa — cuánto vale gastar cada cosa', () => {
  it('lo que caduca ya pesa más que lo que caduca esta semana', () => {
    const urgente = pesoDe(item({ nombre: 'nata', familia: 'lácteos', caducidad: sumarDias(1) }))
    const pronto = pesoDe(item({ nombre: 'nata', familia: 'lácteos', caducidad: sumarDias(3) }))
    const proximo = pesoDe(item({ nombre: 'nata', familia: 'lácteos', caducidad: sumarDias(6) }))
    const lejano = pesoDe(item({ nombre: 'nata', familia: 'lácteos', caducidad: sumarDias(40) }))
    expect(urgente).toBeGreaterThan(pronto)
    expect(pronto).toBeGreaterThan(proximo)
    expect(proximo).toBeGreaterThan(lejano)
  })

  it('lo caducado pesa como lo que caduca hoy: sigue habiendo que resolverlo', () => {
    expect(pesoDe(item({ nombre: 'yogur', caducidad: sumarDias(-2) })))
      .toBe(pesoDe(item({ nombre: 'yogur', caducidad: sumarDias(0) })))
  })

  it('un paquete abierto sin fecha pesa como lo que caduca pronto', () => {
    expect(pesoDe(item({ nombre: 'salsa de soja', familia: 'salsas', abierto: sumarDias(-1) })))
      .toBe(pesoDe(item({ nombre: 'yogur', familia: 'lácteos', caducidad: sumarDias(3) })))
  })

  it('el fondo de despensa sigue siendo fondo aunque ahora traiga fecha larga', () => {
    // La despensa seca ya estima caducidad, así que el bote viene con fecha para
    // dentro de dos años. Eso no lo convierte en un perecedero cualquiera.
    const conFecha = pesoDe(item({ nombre: 'arroz', familia: 'cereales', caducidad: sumarDias(700) }))
    const sinFecha = pesoDe(item({ nombre: 'arroz', familia: 'cereales' }))
    const perecedero = pesoDe(item({ nombre: 'lechuga', familia: 'verduras', caducidad: sumarDias(20) }))
    expect(conFecha).toBe(sinFecha)
    expect(conFecha).toBeGreaterThan(perecedero)
  })

  it('el fondo de despensa pesa, pero menos que cualquier perecedero con fecha', () => {
    const arroz = pesoDe(item({ nombre: 'arroz', familia: 'cereales' }))
    const urgente = pesoDe(item({ nombre: 'nata', familia: 'lácteos', caducidad: sumarDias(1) }))
    expect(arroz).toBeGreaterThan(0)
    expect(arroz).toBeLessThan(urgente)
  })

  it('lo que queda poco sube el suelo, no lo que ya pesaba más', () => {
    const poco = pesoDe(item({ nombre: 'arroz', familia: 'cereales', estado: 'poco' }))
    const lleno = pesoDe(item({ nombre: 'arroz', familia: 'cereales' }))
    expect(poco).toBeGreaterThan(lleno)
    expect(pesoDe(item({ nombre: 'nata', caducidad: sumarDias(0), estado: 'poco' }))).toBe(1)
  })

  it('lo de hogar no se come, así que no cuenta', () => {
    expect(indiceDespensa([item({ nombre: 'detergente', familia: 'hogar' })]).items).toHaveLength(0)
  })
})

describe('aprovechaDe — qué gasta cada receta', () => {
  const indice = indiceDespensa([
    item({ nombre: 'nata', familia: 'lácteos' }),
    item({ nombre: 'sal', familia: 'especias' }),
  ])

  it('empareja por el mismo criterio que la lista de la compra', () => {
    expect(aprovechaDe(receta(['nata para cocinar']), indice)).toEqual([0])
    expect(aprovechaDe(receta(['leche']), indice)).toEqual([])
  })

  it('cuenta también la guarnición, que la auto-semana pone', () => {
    const r = receta(['pollo'], {
      guarniciones: [{
        id: 'g1',
        nombre: 'Espinacas a la crema',
        aporta: ['verdura'],
        ingredientes: [{ nombre: 'nata', cantidad: 100, unidad: 'ml', familia: 'lácteos' }],
        micros: MICROS_CERO,
      }],
    })
    expect(aprovechaDe(r, indice)).toEqual([0])
  })

  it('la sal no distingue una receta de otra, así que no puntúa', () => {
    const r = receta(['sal'])
    r.ingredientes[0] = { nombre: 'sal', cantidad: 1, unidad: 'pizca', familia: 'especias' }
    expect(aprovechaDe(r, indice)).toEqual([])
  })
})

describe('la auto-semana prefiere lo que hay en casa', () => {
  const conDespensa = (pool: RecetaListada[], despensa: ItemAprovechable[], n = 1, semilla = 3) =>
    semanaEquilibrada(pool, n, semilla, [], undefined, despensa)

  it('elige el plato que gasta lo que está a punto de caducar', () => {
    // Tomate y no espinacas: la bolsa de espinacas deja media bolsa varada y
    // eso es otra cuenta. Aquí lo que se mira es lo que hay en casa.
    const pool = [receta(['ternera', 'arroz']), receta(['tomate', 'nata'])]
    const despensa = [item({ nombre: 'nata', familia: 'lácteos', caducidad: sumarDias(1) })]
    for (const semilla of [1, 2, 3, 4, 5]) {
      expect(conDespensa(pool, despensa, 1, semilla)[0].id).toBe(pool[1].id)
    }
  })

  it('con la despensa vacía se comporta igual que antes', () => {
    const pool = [receta(['ternera', 'arroz']), receta(['espinacas', 'nata'])]
    const sin = semanaEquilibrada(pool, 2, 7).map((r) => r.id)
    expect(conDespensa(pool, [], 2, 7).map((r) => r.id)).toEqual(sin)
  })

  it('el mismo bote no puntúa dos veces: el segundo día va a por lo otro', () => {
    const conNata = receta(['espinacas', 'nata'])
    const otraConNata = receta(['pollo', 'nata'])
    const conTofu = receta(['tomate', 'tofu'])
    const despensa = [
      item({ nombre: 'nata', familia: 'lácteos', caducidad: sumarDias(1) }),
      item({ nombre: 'tofu', familia: 'otros', caducidad: sumarDias(1) }),
    ]
    // Dos platos de nata y uno de tofu, y dos días: en cuanto la nata está
    // resuelta deja de valer, así que el otro día se lo lleva el tofu.
    for (const semilla of [1, 2, 3, 4, 5]) {
      const semana = conDespensa([conNata, otraConNata, conTofu], despensa, 2, semilla)
      expect(semana.map((r) => r.id)).toContain(conTofu.id)
    }
  })

  it('vaciar la despensa manda por delante de la proteína', () => {
    // Mismo plato salvo por la proteína, y el flojo gasta dos cosas del armario:
    // gana el flojo. La nutrición decide dentro del escalón, no por encima de él.
    const proteico = receta(['tofu'], { proteinas: 40, calorias: 400 })
    const flojo = receta(['arroz', 'lentejas'], { proteinas: 5, calorias: 400 })
    const despensa = [
      item({ nombre: 'arroz', familia: 'cereales' }),
      item({ nombre: 'lentejas', familia: 'legumbres' }),
    ]
    expect(conDespensa([proteico, flojo], despensa, 1, 2)[0].id).toBe(flojo.id)
  })

  it('gasta el que corre prisa antes que el que espera en el armario', () => {
    const conFresco = receta(['nata'], { proteinas: 20, calorias: 400 })
    const conFondo = receta(['arroz'], { proteinas: 20, calorias: 400 })
    const despensa = [
      item({ nombre: 'nata', familia: 'lácteos', caducidad: sumarDias(1) }),
      item({ nombre: 'arroz', familia: 'cereales' }),
    ]
    expect(conDespensa([conFondo, conFresco], despensa, 1, 3)[0].id).toBe(conFresco.id)
  })

  it('cuantos más alimentos de casa gaste, mejor', () => {
    const tres = receta(['nata', 'arroz', 'lentejas'], { proteinas: 20, calorias: 400 })
    const uno = receta(['nata'], { proteinas: 20, calorias: 400 })
    const despensa = [
      item({ nombre: 'nata', familia: 'lácteos', caducidad: sumarDias(1) }),
      item({ nombre: 'arroz', familia: 'cereales' }),
      item({ nombre: 'lentejas', familia: 'legumbres' }),
    ]
    expect(conDespensa([uno, tres], despensa, 1, 3)[0].id).toBe(tres.id)
  })

  it('entre dos que dejan la misma sobra, vuelve a decidir la nutrición', () => {
    // Los dos son fondo de armario y no dejan nada que se estropee, así que van
    // en el mismo escalón y ahí sí manda la proteína.
    const proteico = receta(['lentejas'], { proteinas: 40, calorias: 400 })
    const flojo = receta(['arroz'], { proteinas: 5, calorias: 400 })
    expect(conDespensa([proteico, flojo], [], 1, 2)[0].id).toBe(proteico.id)
  })
})
