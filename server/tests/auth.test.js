import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { arrancarServidor, api, crearSesion, crearHogar, recetaValida } from './helpers.js'

// Sustituye a los tests de la passphrase compartida. Lo que hay que garantizar
// ahora no es que una clave abra la puerta, sino que la sesión decide qué hogar
// se toca y que nadie ve el de otro.

let servidor
let base
let sesion
let http

const RUTAS_ESTADO = ['/plan', '/despensa', '/extras', '/pendientes']

const ESCRITURAS = [
  { metodo: 'POST', ruta: '/recetas', body: recetaValida() },
  { metodo: 'PUT', ruta: '/recetas/00000000-0000-0000-0000-000000000000', body: recetaValida() },
  { metodo: 'PATCH', ruta: '/recetas/00000000-0000-0000-0000-000000000000/favorita' },
  { metodo: 'DELETE', ruta: '/recetas/00000000-0000-0000-0000-000000000000' },
  ...RUTAS_ESTADO.map((ruta) => ({ metodo: 'PUT', ruta, body: [] })),
]

beforeAll(async () => {
  servidor = await arrancarServidor()
  base = servidor.base
  sesion = await crearSesion()
  http = api(base, sesion.token)
})

afterAll(async () => {
  await sesion.borrar()
  await servidor.cerrar()
})

function peticion({ metodo, ruta, body }, headers = {}) {
  return fetch(`${base}${ruta}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}

describe('requireUser en la API', () => {
  it('rechaza toda escritura sin sesión', async () => {
    for (const escritura of ESCRITURAS) {
      const res = await peticion(escritura)
      expect(res.status, `${escritura.metodo} ${escritura.ruta}`).toBe(401)
      expect((await res.json()).error).toMatch(/sesión/i)
    }
  })

  it('rechaza un token inventado', async () => {
    for (const escritura of ESCRITURAS) {
      const res = await peticion(escritura, { Authorization: 'Bearer no-existe' })
      expect(res.status, `${escritura.metodo} ${escritura.ruta}`).toBe(401)
    }
  })

  it('valida la sesión antes que el cuerpo: payload inválido sin sesión sigue siendo 401', async () => {
    const res = await peticion({ metodo: 'POST', ruta: '/recetas', body: { basura: true } })
    expect(res.status).toBe(401)
  })

  it('deja pasar con sesión válida', async () => {
    for (const escritura of ESCRITURAS) {
      const res = await peticion(escritura, { Authorization: `Bearer ${sesion.token}` })
      expect(res.status, `${escritura.metodo} ${escritura.ruta}`).not.toBe(401)
    }
    const recetas = await (await http.get('/recetas')).json()
    for (const r of recetas.filter((x) => x.nombre === 'Receta de prueba')) {
      await http.del(`/recetas/${r.id}`)
    }
  })

  it('el estado tampoco se lee sin sesión', async () => {
    for (const ruta of RUTAS_ESTADO) {
      const res = await fetch(`${base}${ruta}`)
      expect(res.status, ruta).toBe(401)
    }
  })

  it('el catálogo tampoco se lee sin sesión', async () => {
    expect((await fetch(`${base}/recetas`)).status).toBe(401)
    expect((await fetch(`${base}/recetas/00000000-0000-0000-0000-000000000000`)).status).toBe(401)
  })
})

describe('aislamiento entre hogares', () => {
  it('cada hogar ve su propio estado, y no el del otro', async () => {
    const otroHogar = await crearHogar('Hogar aislado')
    const otra = await crearSesion({ rol: 'usuario', hogarId: otroHogar.id })
    const suyo = api(base, otra.token)

    try {
      const despensaCompartida = [
        { nombre: 'secreto del hogar 1', familia: 'otros', estado: 'lleno' },
      ]
      expect((await http.put('/despensa', despensaCompartida)).status).toBe(200)

      // El vecino no ve nada de lo anterior, aunque pida la misma ruta.
      const suya = await (await suyo.get('/despensa')).json()
      expect(suya).toEqual([])

      // Y lo que escribe no toca el hogar ajeno.
      expect((await suyo.put('/despensa', [{ nombre: 'lo mio', familia: 'otros', estado: 'poco' }])).status).toBe(200)
      const mia = await (await http.get('/despensa')).json()
      expect(mia.map((d) => d.nombre)).toEqual(['secreto del hogar 1'])
    } finally {
      await http.put('/despensa', [])
      await otra.borrar()
      await otroHogar.borrar()
    }
  })

  it('el hogar no se puede influir desde la petición', async () => {
    const otroHogar = await crearHogar('Hogar que no es mio')
    const otra = await crearSesion({ rol: 'usuario', hogarId: otroHogar.id })
    const suyo = api(base, otra.token)

    try {
      await http.put('/plan', [
        { dia: 'Lunes', recetaId: '00000000-0000-0000-0000-000000000000', raciones: 2 },
      ])

      // Cualquier intento de nombrar otro hogar debe ser ignorado.
      for (const intento of [
        `/plan?hogar=${'00000000-0000-0000-0000-000000000001'}`,
        `/plan?hogarId=${'00000000-0000-0000-0000-000000000001'}`,
        '/plan?hogar_id=00000000-0000-0000-0000-000000000001',
      ]) {
        const res = await suyo.get(intento)
        expect(res.status, intento).toBe(200)
        expect(await res.json(), intento).toEqual([])
      }
    } finally {
      await http.put('/plan', [])
      await otra.borrar()
      await otroHogar.borrar()
    }
  })
})
