import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { arrancarServidor, api, recetaValida } from './helpers.js'

let servidor
let http
let base
const CLAVE_ORIGINAL = process.env.APP_KEY

beforeAll(async () => {
  servidor = await arrancarServidor()
  base = servidor.base
  http = api(base)
})

afterAll(() => servidor.cerrar())
afterEach(() => { process.env.APP_KEY = CLAVE_ORIGINAL })

const ESCRITURAS = [
  { metodo: 'POST', ruta: '/recetas', body: recetaValida() },
  { metodo: 'PUT', ruta: '/recetas/00000000-0000-0000-0000-000000000000', body: recetaValida() },
  { metodo: 'PATCH', ruta: '/recetas/00000000-0000-0000-0000-000000000000/favorita' },
  { metodo: 'DELETE', ruta: '/recetas/00000000-0000-0000-0000-000000000000' },
  { metodo: 'PUT', ruta: '/plan', body: [] },
  { metodo: 'PUT', ruta: '/despensa', body: [] },
  { metodo: 'PUT', ruta: '/extras', body: [] },
  { metodo: 'PUT', ruta: '/pendientes', body: [] },
]

function peticion({ metodo, ruta, body }, headers = {}) {
  return fetch(`${base}${ruta}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}

describe('requireKey', () => {
  it('rechaza toda escritura sin la clave', async () => {
    for (const escritura of ESCRITURAS) {
      const res = await peticion(escritura)
      expect(res.status, `${escritura.metodo} ${escritura.ruta}`).toBe(401)
      expect(await res.json()).toEqual({ error: 'Clave incorrecta o ausente' })
    }
  })

  it('rechaza una clave incorrecta', async () => {
    for (const escritura of ESCRITURAS) {
      const res = await peticion(escritura, { 'x-app-key': 'clave-que-no-es' })
      expect(res.status, `${escritura.metodo} ${escritura.ruta}`).toBe(401)
    }
  })

  it('deja pasar con la clave correcta', async () => {
    for (const escritura of ESCRITURAS) {
      const res = await peticion(escritura, { 'x-app-key': process.env.APP_KEY })
      expect(res.status, `${escritura.metodo} ${escritura.ruta}`).not.toBe(401)
    }
    // La receta creada por el POST de arriba no debe quedarse en la BD.
    const recetas = await (await http.get('/recetas')).json()
    for (const r of recetas.filter((x) => x.nombre === 'Receta de prueba')) {
      await http.del(`/recetas/${r.id}`)
    }
  })

  it('valida la clave antes que el cuerpo: payload inválido sin clave sigue siendo 401', async () => {
    const res = await peticion({ metodo: 'POST', ruta: '/recetas', body: { basura: true } })
    expect(res.status).toBe(401)
  })

  it('sin APP_KEY configurada deja las escrituras abiertas', async () => {
    delete process.env.APP_KEY
    const res = await peticion({ metodo: 'PUT', ruta: '/plan', body: [] })
    expect(res.status).toBe(200)
  })

  it('las lecturas nunca piden clave', async () => {
    for (const ruta of ['/recetas', '/plan', '/despensa', '/extras', '/pendientes']) {
      const res = await http.get(ruta)
      expect(res.status, ruta).toBe(200)
    }
  })
})
