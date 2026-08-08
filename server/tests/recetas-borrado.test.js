import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { arrancarServidor, api, recetaValida } from './helpers.js'

// El borrado es lógico para poder deshacerlo. Lo que importa es que la receta
// desaparezca del catálogo pero vuelva con SU MISMO id: el plan y las
// pendientes guardan sus entradas por recetaId, y con un id nuevo volverían
// desenganchadas de la semana.

let servidor
let http

const UUID_INEXISTENTE = '00000000-0000-0000-0000-000000000000'

beforeAll(async () => {
  servidor = await arrancarServidor()
  http = api(servidor.base)
})

afterAll(async () => { await servidor.cerrar() })

async function crear(extra = {}) {
  const res = await http.post('/recetas', recetaValida(extra))
  expect(res.status).toBe(201)
  return res.json()
}

describe('borrar y restaurar', () => {
  it('la saca del catálogo y la devuelve con el mismo id', async () => {
    const receta = await crear({ nombre: 'Borrable' })

    expect((await http.del(`/recetas/${receta.id}`)).status).toBe(204)
    expect((await http.get(`/recetas/${receta.id}`)).status).toBe(404)

    const listaSin = await (await http.get('/recetas')).json()
    expect(listaSin.some((r) => r.id === receta.id)).toBe(false)

    const res = await http.post(`/recetas/${receta.id}/restaurar`)
    expect(res.status).toBe(200)
    const restaurada = await res.json()
    expect(restaurada.id).toBe(receta.id)
    expect(restaurada.nombre).toBe('Borrable')

    const listaCon = await (await http.get('/recetas')).json()
    expect(listaCon.some((r) => r.id === receta.id)).toBe(true)

    await http.del(`/recetas/${receta.id}`)
  })

  it('la receta borrada tampoco sale filtrando por categoría o sabor', async () => {
    const receta = await crear({ nombre: 'Borrable filtrada', categoria: 'pruebas-borrado' })
    await http.del(`/recetas/${receta.id}`)

    const porCategoria = await (await http.get('/recetas?categoria=pruebas-borrado')).json()
    expect(porCategoria.some((r) => r.id === receta.id)).toBe(false)

    const porSabor = await (await http.get('/recetas?sabor=salado')).json()
    expect(porSabor.some((r) => r.id === receta.id)).toBe(false)
  })

  it('no se puede borrar dos veces', async () => {
    const receta = await crear({ nombre: 'Borrable dos veces' })
    expect((await http.del(`/recetas/${receta.id}`)).status).toBe(204)
    expect((await http.del(`/recetas/${receta.id}`)).status).toBe(404)
  })

  it('restaurar algo que no estaba borrado da 404', async () => {
    const receta = await crear({ nombre: 'Viva' })
    expect((await http.post(`/recetas/${receta.id}/restaurar`)).status).toBe(404)
    await http.del(`/recetas/${receta.id}`)
  })

  it('restaurar un id inexistente da 404', async () => {
    expect((await http.post(`/recetas/${UUID_INEXISTENTE}/restaurar`)).status).toBe(404)
  })
})
