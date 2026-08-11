import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { arrancarServidor, api, crearSesion, recetaValida } from './helpers.js'

let servidor
let http
const creadas = new Set()

const UUID_INEXISTENTE = '00000000-0000-0000-0000-000000000000'

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

  it('un id que no es UUID también da 404, no 500', async () => {
    for (const res of [
      await http.get('/recetas/no-soy-un-uuid'),
      await http.put('/recetas/no-soy-un-uuid', recetaValida()),
      await http.patch('/recetas/no-soy-un-uuid/favorita'),
      await http.del('/recetas/no-soy-un-uuid'),
    ]) {
      expect(res.status).toBe(404)
      expect(await res.json()).toEqual({ error: 'Receta no encontrada' })
    }
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

describe('contrato de campos al editar', () => {
  it('devuelve el precio como precioPorPorcion y como número', async () => {
    // Salía sin alias (precio_por_porcion), asi que el frontend lo leía como
    // undefined: el coste estimado de la lista siempre daba cero.
    const creada = await crear({ nombre: 'Con precio', precioPorPorcion: 3.75 })
    expect(creada.precioPorPorcion).toBe(3.75)
    expect(creada).not.toHaveProperty('precio_por_porcion')
  })

  it('editar una receta favorita NO la desmarca', async () => {
    // El formulario manda RecetaFormData, que excluye favorita a propósito;
    // el UPDATE la conserva en vez de darla por false.
    const creada = await crear({ nombre: 'Favorita que se conserva' })
    await http.patch(`/recetas/${creada.id}/favorita`)

    const editada = await (await http.put(`/recetas/${creada.id}`, recetaValida({ nombre: 'Editada' }))).json()
    expect(editada.favorita).toBe(true)
    expect((await (await http.get(`/recetas/${creada.id}`)).json()).favorita).toBe(true)
  })

  // Antes favorita era una columna de la receta y un PUT con favorita: false la
  // desmarcaba. Ya no: es del hogar, vive en su propia tabla y solo la cambia el
  // PATCH. Editar una receta común no puede tocar lo que otro hogar marcó.
  it('editar ignora el campo favorita, que solo cambia con el PATCH', async () => {
    const creada = await crear({ nombre: 'Se desmarca' })
    await http.patch(`/recetas/${creada.id}/favorita`)

    const editada = await (await http.put(`/recetas/${creada.id}`, recetaValida({ nombre: 'Se desmarca', favorita: false }))).json()
    expect(editada.favorita).toBe(true)

    const desmarcada = await (await http.patch(`/recetas/${creada.id}/favorita`)).json()
    expect(desmarcada.favorita).toBe(false)
  })

  it('las columnas NOT NULL se conservan al editar sin enviarlas', async () => {
    const creada = await crear({ nombre: 'Conserva precio', precioPorPorcion: 4.5, porciones: 3 })
    const sinPrecio = recetaValida({ nombre: 'Conserva precio', precioPorPorcion: undefined, porciones: undefined })
    const editada = await (await http.put(`/recetas/${creada.id}`, sinPrecio)).json()
    expect(editada.precioPorPorcion).toBe(4.5)
    expect(editada.porciones).toBe(3)
  })

  it('los macros sí se vacían al editar sin enviarlos', async () => {
    // No es asimetría accidental: el formulario gestiona los macros, así que
    // dejar el campo en blanco tiene que poder borrarlos. Precio, porciones y
    // tipo llevan COALESCE porque son columnas NOT NULL.
    const creada = await crear({ nombre: 'Vacia macros', calorias: 500, proteinas: 30 })
    expect(creada.calorias).toBe(500)
    const editada = await (await http.put(`/recetas/${creada.id}`, recetaValida({ nombre: 'Vacia macros' }))).json()
    expect(editada.calorias).toBeNull()
    expect(editada.proteinas).toBeNull()
  })
})
