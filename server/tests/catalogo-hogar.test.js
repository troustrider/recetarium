import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { arrancarServidor, api, crearSesion, crearHogar, recetaValida } from './helpers.js'

let servidor
let base
let admin // admin del hogar compartido
let vecino // usuario de otro hogar
let otroHogar
const aBorrar = []

beforeAll(async () => {
  servidor = await arrancarServidor()
  base = servidor.base
  const sAdmin = await crearSesion({ rol: 'admin' })
  otroHogar = await crearHogar('Hogar del vecino')
  const sVecino = await crearSesion({ rol: 'usuario', hogarId: otroHogar.id })
  admin = api(base, sAdmin.token)
  vecino = api(base, sVecino.token)
})

afterAll(async () => {
  for (const id of aBorrar) await admin.del(`/recetas/${id}`)
  await servidor.cerrar()
})

async function crearComun(nombre) {
  const res = await admin.post('/recetas', recetaValida({ nombre }))
  expect(res.status).toBe(201)
  const receta = await res.json()
  aBorrar.push(receta.id)
  return receta
}

describe('recetas privadas por hogar', () => {
  it('un admin crea en el catálogo común por defecto', async () => {
    const receta = await crearComun('Comun de prueba')
    expect(receta.privada).toBe(false)
    const suyas = await (await vecino.get('/recetas')).json()
    expect(suyas.some((r) => r.id === receta.id)).toBe(true)
  })

  it('quien no es admin solo crea recetas suyas, diga lo que diga el payload', async () => {
    const res = await vecino.post('/recetas', recetaValida({ nombre: 'Privada del vecino', privada: false }))
    expect(res.status).toBe(201)
    const receta = await res.json()
    expect(receta.privada).toBe(true)

    const delAdmin = await (await admin.get('/recetas')).json()
    expect(delAdmin.some((r) => r.id === receta.id)).toBe(false)

    expect((await admin.get(`/recetas/${receta.id}`)).status).toBe(404)
  })

  it('un admin puede crear una receta privada si la pide', async () => {
    const res = await admin.post('/recetas', recetaValida({ nombre: 'Privada del admin', privada: true }))
    const receta = await res.json()
    aBorrar.push(receta.id)
    expect(receta.privada).toBe(true)
    expect((await vecino.get(`/recetas/${receta.id}`)).status).toBe(404)
  })
})

describe('permisos de edición', () => {
  it('un usuario normal no edita ni borra el catálogo común', async () => {
    const receta = await crearComun('Comun intocable')

    const put = await vecino.put(`/recetas/${receta.id}`, recetaValida({ nombre: 'Secuestrada' }))
    expect(put.status).toBe(403)
    expect((await put.json()).error).toMatch(/administrador/i)

    expect((await vecino.del(`/recetas/${receta.id}`)).status).toBe(403)

    const sigue = await (await admin.get(`/recetas/${receta.id}`)).json()
    expect(sigue.nombre).toBe('Comun intocable')
  })

  it('nadie edita la receta privada de otro hogar, y recibe 404', async () => {
    const res = await vecino.post('/recetas', recetaValida({ nombre: 'Mia y de nadie mas' }))
    const receta = await res.json()

    expect((await admin.put(`/recetas/${receta.id}`, recetaValida())).status).toBe(404)
    expect((await admin.del(`/recetas/${receta.id}`)).status).toBe(404)

    await vecino.del(`/recetas/${receta.id}`)
  })

  it('el dueño sí edita y borra la suya', async () => {
    const receta = await (await vecino.post('/recetas', recetaValida({ nombre: 'Editable' }))).json()
    const put = await vecino.put(`/recetas/${receta.id}`, recetaValida({ nombre: 'Editada' }))
    expect(put.status).toBe(200)
    expect((await put.json()).nombre).toBe('Editada')
    expect((await vecino.del(`/recetas/${receta.id}`)).status).toBe(204)
  })
})

describe('favoritas por hogar', () => {
  it('marcar favorita no se la marca al otro hogar', async () => {
    const receta = await crearComun('Favorita de uno solo')

    const marcada = await (await admin.patch(`/recetas/${receta.id}/favorita`)).json()
    expect(marcada.favorita).toBe(true)

    const paraElVecino = await (await vecino.get(`/recetas/${receta.id}`)).json()
    expect(paraElVecino.favorita).toBe(false)
  })

  it('desmarcar vuelve a dejarla sin marcar, y solo en su hogar', async () => {
    const receta = await crearComun('Favorita ida y vuelta')

    await admin.patch(`/recetas/${receta.id}/favorita`)
    await vecino.patch(`/recetas/${receta.id}/favorita`)
    expect((await (await admin.get(`/recetas/${receta.id}`)).json()).favorita).toBe(true)

    const desmarcada = await (await admin.patch(`/recetas/${receta.id}/favorita`)).json()
    expect(desmarcada.favorita).toBe(false)
    expect((await (await vecino.get(`/recetas/${receta.id}`)).json()).favorita).toBe(true)
  })

  it('cualquiera puede marcarse favorita una receta del catálogo común', async () => {
    const receta = await crearComun('Favorita del comun')
    const res = await vecino.patch(`/recetas/${receta.id}/favorita`)
    expect(res.status).toBe(200)
    expect((await res.json()).favorita).toBe(true)
  })
})
