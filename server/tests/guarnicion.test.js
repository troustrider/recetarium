import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { arrancarServidor, api, recetaValida } from './helpers.js'

// La guarnición va en su propio bloque para no contaminar la ficha del plato.
// Lo que más importa aquí es el gluten: un arroz o una pasta de guarnición no
// pueden marcar el plato entero como con gluten si no la preparas.

let servidor
let http
const creadas = new Set()

beforeAll(async () => {
  servidor = await arrancarServidor()
  http = api(servidor.base)
})

afterAll(async () => {
  for (const id of creadas) await http.del(`/recetas/${id}`)
  await servidor.cerrar()
})

async function crear(extra = {}) {
  const res = await http.post('/recetas', recetaValida(extra))
  expect(res.status).toBe(201)
  const receta = await res.json()
  creadas.add(receta.id)
  return receta
}

// "pasta" está en la tabla de nutrientes marcada con gluten, que es justo lo
// que este test necesita comprobar que NO se contagia al plato.
const GUARNICION = {
  nombre: 'Pasta al ajillo',
  ingredientes: [{ nombre: 'pasta', cantidad: 200, unidad: 'g', familia: 'cereales' }],
  pasos: ['Cocer 8 min'],
}

describe('guarnición', () => {
  it('las recetas sin guarnición la devuelven en null', async () => {
    const receta = await crear({ nombre: 'Sin guarnicion' })
    expect(receta.guarnicion).toBeNull()
  })

  it('se guarda con su nombre, ingredientes y pasos', async () => {
    const receta = await crear({ nombre: 'Con guarnicion', guarnicion: GUARNICION })
    expect(receta.guarnicion.nombre).toBe('Pasta al ajillo')
    expect(receta.guarnicion.ingredientes).toHaveLength(1)
    expect(receta.guarnicion.pasos).toEqual(['Cocer 8 min'])
  })

  it('el servidor le calcula su propia ficha', async () => {
    const receta = await crear({ nombre: 'Ficha de guarnicion', guarnicion: GUARNICION })
    expect(receta.guarnicion.calorias).toBeGreaterThan(0)
    expect(receta.guarnicion.proteinas).toBeGreaterThan(0)
    expect(receta.guarnicion.micros).toBeTruthy()
  })

  it('el gluten de la guarnición NO contamina el del plato', async () => {
    const sinElla = await crear({ nombre: 'Arroz limpio' })
    const conElla = await crear({ nombre: 'Arroz con pasta', guarnicion: GUARNICION })

    // El plato es el mismo en los dos: arroz, sin gluten.
    expect(conElla.sinGluten).toBe(sinElla.sinGluten)
    // Y la guarnición sí lo declara por su cuenta.
    expect(conElla.guarnicion.sinGluten).toBe(false)
  })

  it('las calorías del plato no incluyen las de la guarnición', async () => {
    const sinElla = await crear({ nombre: 'Base sola', porciones: 2 })
    const conElla = await crear({ nombre: 'Base con guarnicion', porciones: 2, guarnicion: GUARNICION })
    expect(conElla.hierro).toBe(sinElla.hierro)
    expect(conElla.micros.fibra).toBe(sinElla.micros.fibra)
  })

  it('se puede quitar en una edición', async () => {
    const receta = await crear({ nombre: 'Guarnicion quitable', guarnicion: GUARNICION })
    const res = await http.put(`/recetas/${receta.id}`, recetaValida({ nombre: 'Guarnicion quitable' }))
    expect(res.status).toBe(200)
    expect((await res.json()).guarnicion).toBeNull()
  })

  it('rechaza una guarnición sin ingredientes', async () => {
    const res = await http.post('/recetas', recetaValida({
      nombre: 'Guarnicion vacia',
      guarnicion: { nombre: 'Nada', ingredientes: [] },
    }))
    expect(res.status).toBe(400)
    const { errores } = await res.json()
    expect(JSON.stringify(errores)).toMatch(/guarnicion\.ingredientes/)
  })

  it('rechaza una guarnición sin nombre', async () => {
    const res = await http.post('/recetas', recetaValida({
      nombre: 'Guarnicion anonima',
      guarnicion: { ingredientes: GUARNICION.ingredientes },
    }))
    expect(res.status).toBe(400)
  })
})
