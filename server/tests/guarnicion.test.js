import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { arrancarServidor, api, crearSesion, recetaValida } from './helpers.js'

let servidor
let http
const creadas = new Set()

beforeAll(async () => {
  servidor = await arrancarServidor()
  http = api(servidor.base, (await crearSesion()).token)
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

describe('catálogo de guarniciones', () => {
  it('lo sirve entero, con ficha y etiquetas', async () => {
    const res = await http.get('/guarniciones')
    expect(res.status).toBe(200)
    const catalogo = await res.json()
    expect(catalogo.length).toBeGreaterThan(50)

    const arroz = catalogo.find((g) => g.nombre === 'Arroz blanco')
    expect(arroz.aporta).toContain('almidon')
    expect(arroz.cocinas).toContain('asia-este')
    expect(arroz.calorias).toBeGreaterThan(0)
    expect(arroz.micros).toBeTruthy()
  })

  it('cada guarnición aparece una sola vez', async () => {
    const catalogo = await (await http.get('/guarniciones')).json()
    const nombres = catalogo.map((g) => g.nombre)
    expect(new Set(nombres).size).toBe(nombres.length)
  })
})

describe('guarniciones de una receta', () => {
  it('sin guarniciones devuelve una lista vacía, no null', async () => {
    const receta = await crear({ nombre: 'Sin guarnicion' })
    expect(receta.guarniciones).toEqual([])
  })

  it('se referencian por nombre y vuelven con su ficha', async () => {
    const receta = await crear({
      nombre: 'Con guarniciones',
      guarniciones: ['Brócoli al vapor', 'Arroz blanco'],
    })
    expect(receta.guarniciones.map((g) => g.nombre)).toEqual(['Brócoli al vapor', 'Arroz blanco'])
    expect(receta.guarniciones[0].calorias).toBeGreaterThan(0)
    expect(receta.guarniciones[0].pasos.length).toBeGreaterThan(0)
  })

  it('respeta el orden: la primera es la recomendada', async () => {
    const receta = await crear({
      nombre: 'Orden de guarniciones',
      guarniciones: ['Arroz blanco', 'Brócoli al vapor'],
    })
    expect(receta.guarniciones[0].nombre).toBe('Arroz blanco')
  })

  it('el gluten de la guarnición NO contamina el del plato', async () => {
    const sinElla = await crear({ nombre: 'Arroz limpio' })
    const conElla = await crear({ nombre: 'Arroz con pan', guarniciones: ['Pan tostado'] })

    expect(conElla.sinGluten).toBe(sinElla.sinGluten)
    expect(conElla.guarniciones[0].sinGluten).toBe(false)
  })

  it('la ficha del plato no incluye la de la guarnición', async () => {
    const sinElla = await crear({ nombre: 'Base sola', porciones: 2 })
    const conElla = await crear({ nombre: 'Base con guarnicion', porciones: 2, guarniciones: ['Brócoli al vapor'] })
    expect(conElla.hierro).toBe(sinElla.hierro)
    expect(conElla.micros.fibra).toBe(sinElla.micros.fibra)
  })

  it('se pueden quitar en una edición', async () => {
    const receta = await crear({ nombre: 'Guarnicion quitable', guarniciones: ['Brócoli al vapor'] })
    const res = await http.put(`/recetas/${receta.id}`, recetaValida({ nombre: 'Guarnicion quitable' }))
    expect(res.status).toBe(200)
    expect((await res.json()).guarniciones).toEqual([])
  })

  it('rechaza un nombre que no está en el catálogo', async () => {
    const res = await http.post('/recetas', recetaValida({
      nombre: 'Guarnicion inventada',
      guarniciones: ['Puré de unicornio'],
    }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/Puré de unicornio/)
  })

  it('rechaza guarniciones repetidas', async () => {
    const res = await http.post('/recetas', recetaValida({
      nombre: 'Guarnicion repetida',
      guarniciones: ['Arroz blanco', 'Arroz blanco'],
    }))
    expect(res.status).toBe(400)
    expect(JSON.stringify(await res.json())).toMatch(/repetidas/)
  })

  it('rechaza más de tres', async () => {
    const res = await http.post('/recetas', recetaValida({
      nombre: 'Guarnicion excesiva',
      guarniciones: ['Arroz blanco', 'Brócoli al vapor', 'Ensalada verde', 'Pan tostado'],
    }))
    expect(res.status).toBe(400)
    expect(JSON.stringify(await res.json())).toMatch(/máximo 3/)
  })
})
