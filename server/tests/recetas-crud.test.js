import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { arrancarServidor, api, recetaValida } from './helpers.js'

let servidor
let http
const creadas = new Set()

const UUID_INEXISTENTE = '00000000-0000-0000-0000-000000000000'

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

describe('CRUD de recetas', () => {
  it('crea y devuelve la receta completa', async () => {
    const receta = await crear({ nombre: 'Arroz de prueba', consejos: ['Reposar 5 min'] })
    expect(receta.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(receta.nombre).toBe('Arroz de prueba')
    expect(receta.sabor).toBe('salado')
    expect(receta.tiempoPreparacion).toBe(20)
    expect(receta.favorita).toBe(false)
    expect(receta.ingredientes).toEqual([{ nombre: 'arroz', cantidad: 200, unidad: 'g', familia: 'cereales' }])
    expect(receta.pasos).toEqual(['Cocer el arroz'])
    expect(receta.consejos).toEqual(['Reposar 5 min'])
  })

  it('aplica los valores por defecto de los campos opcionales', async () => {
    const receta = await crear({ nombre: 'Mínima', precioPorPorcion: undefined, porciones: undefined, tipo: undefined })
    expect(receta.porciones).toBe(1)
    expect(receta.tipo).toBe('principal')
    expect(receta.consejos).toEqual([])
    expect(receta.calorias).toBeNull()
  })

  it('recupera la receta por id', async () => {
    const creada = await crear({ nombre: 'Para leer' })
    const res = await http.get(`/recetas/${creada.id}`)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(creada)
  })

  it('devuelve 404 con un id que no existe', async () => {
    for (const res of [
      await http.get(`/recetas/${UUID_INEXISTENTE}`),
      await http.put(`/recetas/${UUID_INEXISTENTE}`, recetaValida()),
      await http.patch(`/recetas/${UUID_INEXISTENTE}/favorita`),
      await http.del(`/recetas/${UUID_INEXISTENTE}`),
    ]) {
      expect(res.status).toBe(404)
    }
  })

  it('un id que no es UUID revienta con 500 en vez de 404', async () => {
    // Postgres rechaza el cast antes de que el controlador pueda mirar si existe.
    const res = await http.get('/recetas/no-soy-un-uuid')
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Error interno del servidor' })
  })

  it('actualiza los campos editables', async () => {
    const creada = await crear({ nombre: 'Antes' })
    const res = await http.put(`/recetas/${creada.id}`, recetaValida({
      nombre: 'Después',
      sabor: 'umami',
      tiempoPreparacion: 45,
      pasos: ['Paso nuevo'],
    }))
    expect(res.status).toBe(200)
    const actualizada = await res.json()
    expect(actualizada.nombre).toBe('Después')
    expect(actualizada.sabor).toBe('umami')
    expect(actualizada.tiempoPreparacion).toBe(45)
    expect(actualizada.pasos).toEqual(['Paso nuevo'])
    expect(actualizada.id).toBe(creada.id)
  })

  it('alterna favorita y la persiste', async () => {
    const creada = await crear({ nombre: 'Favorita' })
    expect(creada.favorita).toBe(false)

    const marcada = await (await http.patch(`/recetas/${creada.id}/favorita`)).json()
    expect(marcada.favorita).toBe(true)
    expect((await (await http.get(`/recetas/${creada.id}`)).json()).favorita).toBe(true)

    const desmarcada = await (await http.patch(`/recetas/${creada.id}/favorita`)).json()
    expect(desmarcada.favorita).toBe(false)
  })

  it('borra y deja de encontrarla', async () => {
    const creada = await crear({ nombre: 'Para borrar' })
    const res = await http.del(`/recetas/${creada.id}`)
    expect(res.status).toBe(204)
    creadas.delete(creada.id)
    expect((await http.get(`/recetas/${creada.id}`)).status).toBe(404)
  })

  it('filtra por categoria y por sabor', async () => {
    const creada = await crear({ nombre: 'Filtrable', categoria: 'categoria-de-prueba', sabor: 'amargo' })

    const porCategoria = await (await http.get('/recetas?categoria=categoria-de-prueba')).json()
    expect(porCategoria.map((r) => r.id)).toContain(creada.id)
    expect(porCategoria.every((r) => r.categoria === 'categoria-de-prueba')).toBe(true)

    const porSabor = await (await http.get('/recetas?sabor=amargo')).json()
    expect(porSabor.every((r) => r.sabor === 'amargo')).toBe(true)

    const ambos = await (await http.get('/recetas?categoria=categoria-de-prueba&sabor=amargo')).json()
    expect(ambos.map((r) => r.id)).toContain(creada.id)

    const ninguna = await (await http.get('/recetas?categoria=categoria-de-prueba&sabor=dulce')).json()
    expect(ninguna.map((r) => r.id)).not.toContain(creada.id)
  })

  it('ordena por bytes, no por alfabeto español', async () => {
    // ORDER BY r.nombre usa la colación de la BD, que es byte a byte: "Salmón"
    // cae detrás de "Salmorejo" y "Ñoquis" o "İskender" van al final del todo,
    // no bajo la N o la I. Es lo que ve el catálogo.
    const recetas = await (await http.get('/recetas')).json()
    const nombres = recetas.map((r) => r.nombre)
    expect(nombres).toEqual([...nombres].sort())
    expect(nombres).not.toEqual([...nombres].sort((a, b) => a.localeCompare(b, 'es')))
  })
})

// Comportamiento actual que sabemos que está mal. Estos tests existen para que
// el refactor no lo cambie por accidente; se invierten al arreglar el bug.
describe('bugs conocidos, congelados a propósito', () => {
  it('BUG: el precio sale como precio_por_porcion, no como precioPorPorcion', async () => {
    const creada = await crear({ nombre: 'Con precio', precioPorPorcion: 3.75 })
    expect(creada.precioPorPorcion).toBeUndefined()
    expect(creada.precio_por_porcion).toBe('3.75')
  })

  it('BUG: editar una receta favorita la desmarca', async () => {
    const creada = await crear({ nombre: 'Favorita que se pierde' })
    await http.patch(`/recetas/${creada.id}/favorita`)
    expect((await (await http.get(`/recetas/${creada.id}`)).json()).favorita).toBe(true)

    // El formulario manda RecetaFormData, que excluye favorita, y el UPDATE
    // hace `favorita = ${favorita ?? false}` sin COALESCE.
    const editada = await (await http.put(`/recetas/${creada.id}`, recetaValida({ nombre: 'Editada' }))).json()
    expect(editada.favorita).toBe(false)
  })

  it('precio y porciones sí se conservan al editar sin enviarlos', async () => {
    const creada = await crear({ nombre: 'Conserva precio', precioPorPorcion: 4.5, porciones: 3 })
    const sinPrecio = recetaValida({ nombre: 'Conserva precio', precioPorPorcion: undefined, porciones: undefined })
    const editada = await (await http.put(`/recetas/${creada.id}`, sinPrecio)).json()
    expect(editada.precio_por_porcion).toBe('4.50')
    expect(editada.porciones).toBe(3)
  })

  it('los macros NO se conservan al editar sin enviarlos', async () => {
    // Asimetría con precio/porciones: aquí no hay COALESCE, así que se borran.
    const creada = await crear({ nombre: 'Pierde macros', calorias: 500, proteinas: 30 })
    expect(creada.calorias).toBe(500)
    const editada = await (await http.put(`/recetas/${creada.id}`, recetaValida({ nombre: 'Pierde macros' }))).json()
    expect(editada.calorias).toBeNull()
    expect(editada.proteinas).toBeNull()
  })
})
