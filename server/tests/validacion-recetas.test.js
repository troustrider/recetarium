import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { arrancarServidor, api, crearSesion, recetaValida } from './helpers.js'

let servidor
let http

beforeAll(async () => {
  servidor = await arrancarServidor()
  http = api(servidor.base, (await crearSesion()).token)
})

afterAll(() => servidor.cerrar())

async function erroresDe(payload) {
  const res = await http.post('/recetas', payload)
  expect(res.status).toBe(400)
  const body = await res.json()
  return body.errores
}

describe('validación de recetas', () => {
  it('rechaza nombre vacío o ausente', async () => {
    expect(await erroresDe(recetaValida({ nombre: '   ' }))).toContain('nombre es obligatorio')
    expect(await erroresDe(recetaValida({ nombre: undefined }))).toContain('nombre es obligatorio')
    expect(await erroresDe(recetaValida({ nombre: 42 }))).toContain('nombre es obligatorio')
  })

  it('rechaza sabores fuera de la lista', async () => {
    const errores = await erroresDe(recetaValida({ sabor: 'picante' }))
    expect(errores.some((e) => e.startsWith('sabor debe ser uno de'))).toBe(true)
  })

  it('acepta los cinco sabores del catálogo', async () => {
    for (const sabor of ['salado', 'dulce', 'amargo', 'umami', 'acido']) {
      const res = await http.post('/recetas', recetaValida({ sabor, nombre: `Sabor ${sabor}` }))
      expect(res.status).toBe(201)
      const creada = await res.json()
      await http.del(`/recetas/${creada.id}`)
    }
  })

  it('rechaza tiempoPreparacion no positivo o no numérico', async () => {
    const esperado = 'tiempoPreparacion debe ser un número mayor que 0'
    expect(await erroresDe(recetaValida({ tiempoPreparacion: 0 }))).toContain(esperado)
    expect(await erroresDe(recetaValida({ tiempoPreparacion: -5 }))).toContain(esperado)
    expect(await erroresDe(recetaValida({ tiempoPreparacion: '20' }))).toContain(esperado)
  })

  it('exige al menos un ingrediente', async () => {
    const esperado = 'ingredientes debe ser un array con al menos un elemento'
    expect(await erroresDe(recetaValida({ ingredientes: [] }))).toContain(esperado)
    expect(await erroresDe(recetaValida({ ingredientes: 'arroz' }))).toContain(esperado)
  })

  it('valida cada campo de cada ingrediente, indicando el índice', async () => {
    const errores = await erroresDe(
      recetaValida({
        ingredientes: [
          { nombre: 'arroz', cantidad: 200, unidad: 'g', familia: 'cereales' },
          { nombre: '  ', cantidad: 0, unidad: '', familia: '' },
        ],
      })
    )
    expect(errores).toContain('ingredientes[1].nombre es obligatorio')
    expect(errores).toContain('ingredientes[1].cantidad debe ser mayor que 0')
    expect(errores).toContain('ingredientes[1].unidad es obligatorio')
    expect(errores).toContain('ingredientes[1].familia es obligatorio')
    expect(errores.some((e) => e.startsWith('ingredientes[0]'))).toBe(false)
  })

  it('exige al menos un paso y que ninguno esté vacío', async () => {
    expect(await erroresDe(recetaValida({ pasos: [] }))).toContain('pasos debe ser un array con al menos un elemento')
    expect(await erroresDe(recetaValida({ pasos: ['ok', '   '] }))).toContain('cada paso debe ser un texto no vacío')
    expect(await erroresDe(recetaValida({ pasos: ['ok', 3] }))).toContain('cada paso debe ser un texto no vacío')
  })

  it('acepta consejos ausentes pero valida el contenido si vienen', async () => {
    const res = await http.post('/recetas', recetaValida({ consejos: undefined, nombre: 'Sin consejos' }))
    expect(res.status).toBe(201)
    await http.del(`/recetas/${(await res.json()).id}`)

    expect(await erroresDe(recetaValida({ consejos: 'un consejo' }))).toContain('consejos debe ser un array')
    expect(await erroresDe(recetaValida({ consejos: ['ok', ''] }))).toContain('cada consejo debe ser un texto no vacío')
  })

  it('valida los macros como números >= 0 cuando vienen', async () => {
    for (const campo of ['calorias', 'proteinas', 'carbohidratos', 'grasas']) {
      expect(await erroresDe(recetaValida({ [campo]: -1 }))).toContain(`${campo} debe ser un número >= 0`)
      expect(await erroresDe(recetaValida({ [campo]: '100' }))).toContain(`${campo} debe ser un número >= 0`)
    }
    const res = await http.post('/recetas', recetaValida({ calorias: 0, nombre: 'Macros a cero' }))
    expect(res.status).toBe(201)
    await http.del(`/recetas/${(await res.json()).id}`)
  })

  it('acumula todos los errores de una vez, no solo el primero', async () => {
    const errores = await erroresDe({ nombre: '', sabor: 'x', tiempoPreparacion: 0, ingredientes: [], pasos: [] })
    expect(errores.length).toBeGreaterThanOrEqual(5)
  })

  it('aplica la misma validación en PUT', async () => {
    const creada = await (await http.post('/recetas', recetaValida({ nombre: 'Para editar' }))).json()
    const res = await http.put(`/recetas/${creada.id}`, recetaValida({ nombre: '' }))
    expect(res.status).toBe(400)
    expect((await res.json()).errores).toContain('nombre es obligatorio')
    await http.del(`/recetas/${creada.id}`)
  })
})
