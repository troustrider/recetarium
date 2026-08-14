import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { arrancarServidor, api, crearSesion } from './helpers.js'

let servidor
let http
const original = {}

beforeAll(async () => {
  servidor = await arrancarServidor()
  http = api(servidor.base, (await crearSesion()).token)
  for (const ruta of ['/plan', '/despensa', '/extras', '/pendientes']) {
    original[ruta] = await (await http.get(ruta)).json()
  }
})

afterAll(async () => {
  for (const [ruta, valor] of Object.entries(original)) await http.put(ruta, valor)
  await servidor.cerrar()
})

async function errorDe(ruta, payload) {
  const res = await http.put(ruta, payload)
  expect(res.status).toBe(400)
  return (await res.json()).error
}

describe('validación del plan', () => {
  it('exige un array', async () => {
    expect(await errorDe('/plan', { Lunes: [] })).toBe('plan debe ser un array')
  })

  it('exige objetos con día válido', async () => {
    expect(await errorDe('/plan', ['Lunes'])).toBe('plan[0] debe ser un objeto')
    expect(await errorDe('/plan', [null])).toBe('plan[0] debe ser un objeto')
    expect(await errorDe('/plan', [{ dia: 'Lunes ', recetaId: 'x', raciones: 1 }])).toMatch(/^plan\[0\]\.dia/)
    expect(await errorDe('/plan', [{ dia: 'lunes', recetaId: 'x', raciones: 1 }])).toMatch(/^plan\[0\]\.dia/)
  })

  it('exige recetaId no vacío y raciones >= 1', async () => {
    expect(await errorDe('/plan', [{ dia: 'Lunes', recetaId: '', raciones: 1 }])).toBe('plan[0].recetaId es obligatorio')
    expect(await errorDe('/plan', [{ dia: 'Lunes', recetaId: 5, raciones: 1 }])).toBe('plan[0].recetaId es obligatorio')
    expect(await errorDe('/plan', [{ dia: 'Lunes', recetaId: 'x', raciones: 0 }])).toBe('plan[0].raciones debe ser >= 1')
    expect(await errorDe('/plan', [{ dia: 'Lunes', recetaId: 'x', raciones: '2' }])).toBe('plan[0].raciones debe ser >= 1')
  })

  it('señala el índice del elemento que falla', async () => {
    const plan = [
      { dia: 'Lunes', recetaId: 'a', raciones: 2 },
      { dia: 'Martes', recetaId: 'b', raciones: 2 },
      { dia: 'Jueves', recetaId: 'c', raciones: -1 },
    ]
    expect(await errorDe('/plan', plan)).toBe('plan[2].raciones debe ser >= 1')
  })

  it('guarda y devuelve el plan tal cual', async () => {
    const plan = [
      { dia: 'Lunes', recetaId: 'receta-1', raciones: 2 },
      { dia: 'Domingo', recetaId: 'receta-2', raciones: 4 },
    ]
    const res = await http.put('/plan', plan)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(plan)
    expect(await (await http.get('/plan')).json()).toEqual(plan)
  })

  it('no valida que la receta exista: el id fantasma se guarda igual', async () => {
    const plan = [{ dia: 'Lunes', recetaId: 'no-existe-en-absoluto', raciones: 1 }]
    expect((await http.put('/plan', plan)).status).toBe(200)
    expect(await (await http.get('/plan')).json()).toEqual(plan)
  })
})

describe('validación de la despensa', () => {
  const item = { nombre: 'arroz', familia: 'cereales', estado: 'lleno' }

  it('exige un array de objetos', async () => {
    expect(await errorDe('/despensa', {})).toBe('despensa debe ser un array')
    expect(await errorDe('/despensa', ['arroz'])).toBe('despensa[0] debe ser un objeto')
  })

  it('exige nombre, familia y estado válido', async () => {
    expect(await errorDe('/despensa', [{ ...item, nombre: ' ' }])).toBe('despensa[0].nombre es obligatorio')
    expect(await errorDe('/despensa', [{ ...item, familia: '' }])).toBe('despensa[0].familia es obligatorio')
    expect(await errorDe('/despensa', [{ ...item, estado: 'medio' }])).toMatch(/^despensa\[0\]\.estado/)
  })

  it('exige caducidad en formato YYYY-MM-DD', async () => {
    expect(await errorDe('/despensa', [{ ...item, caducidad: '01-01-2026' }])).toMatch(/^despensa\[0\]\.caducidad/)
    expect((await http.put('/despensa', [{ ...item, caducidad: '2026-12-31' }])).status).toBe(200)
  })

  it('acepta una fecha imposible mientras cumpla el patrón', async () => {
    expect((await http.put('/despensa', [{ ...item, caducidad: '2026-99-99' }])).status).toBe(200)
  })

  it('exige unidad de la lista cuando hay cantidad', async () => {
    expect(await errorDe('/despensa', [{ ...item, cantidad: -1, unidad: 'g' }])).toMatch(/^despensa\[0\]\.cantidad/)
    expect(await errorDe('/despensa', [{ ...item, cantidad: 'mucho', unidad: 'g' }])).toMatch(/^despensa\[0\]\.cantidad/)
    expect(await errorDe('/despensa', [{ ...item, cantidad: 500, unidad: 'cucharadas' }])).toMatch(/^despensa\[0\]\.unidad/)
    expect(await errorDe('/despensa', [{ ...item, cantidad: 500 }])).toMatch(/^despensa\[0\]\.unidad/)
  })

  it('acepta unidad sin cantidad', async () => {
    expect((await http.put('/despensa', [{ ...item, unidad: 'inventada' }])).status).toBe(200)
  })

  it('guarda y devuelve la despensa tal cual', async () => {
    const despensa = [
      { nombre: 'arroz', familia: 'cereales', estado: 'lleno', cantidad: 500, unidad: 'g' },
      { nombre: 'leche', familia: 'lácteos', estado: 'poco', caducidad: '2026-09-01' },
    ]
    expect((await http.put('/despensa', despensa)).status).toBe(200)
    expect(await (await http.get('/despensa')).json()).toEqual(despensa)
  })
})

describe('validación de pendientes', () => {
  it('exige recetaId y raciones', async () => {
    expect(await errorDe('/pendientes', {})).toBe('pendientes debe ser un array')
    expect(await errorDe('/pendientes', [null])).toBe('pendientes[0] debe ser un objeto')
    expect(await errorDe('/pendientes', [{ recetaId: '', raciones: 1 }])).toBe('pendientes[0].recetaId es obligatorio')
    expect(await errorDe('/pendientes', [{ recetaId: 'x', raciones: 0 }])).toBe('pendientes[0].raciones debe ser >= 1')
  })

  it('guarda y devuelve los pendientes tal cual', async () => {
    const pendientes = [{ recetaId: 'receta-1', raciones: 3 }]
    expect((await http.put('/pendientes', pendientes)).status).toBe(200)
    expect(await (await http.get('/pendientes')).json()).toEqual(pendientes)
  })
})

describe('validación de extras', () => {
  const extra = { nombre: 'papel de cocina', cantidad: 2, unidad: 'ud', familia: 'hogar' }

  it('exige los cuatro campos', async () => {
    expect(await errorDe('/extras', {})).toBe('extras debe ser un array')
    expect(await errorDe('/extras', [{ ...extra, nombre: '' }])).toBe('extras[0].nombre es obligatorio')
    expect(await errorDe('/extras', [{ ...extra, cantidad: 0 }])).toBe('extras[0].cantidad debe ser > 0')
    expect(await errorDe('/extras', [{ ...extra, unidad: '' }])).toBe('extras[0].unidad es obligatorio')
    expect(await errorDe('/extras', [{ ...extra, familia: '' }])).toBe('extras[0].familia es obligatorio')
  })

  it('guarda y devuelve los extras tal cual', async () => {
    expect((await http.put('/extras', [extra])).status).toBe(200)
    expect(await (await http.get('/extras')).json()).toEqual([extra])
  })
})

describe('aislamiento entre campos del estado compartido', () => {
  it('guardar la despensa no toca el plan', async () => {
    const plan = [{ dia: 'Viernes', recetaId: 'receta-x', raciones: 1 }]
    await http.put('/plan', plan)
    await http.put('/despensa', [{ nombre: 'sal', familia: 'condimentos', estado: 'lleno' }])
    expect(await (await http.get('/plan')).json()).toEqual(plan)
  })

  it('el vacío es un estado válido y se persiste', async () => {
    for (const ruta of ['/plan', '/despensa', '/extras', '/pendientes']) {
      expect((await http.put(ruta, [])).status).toBe(200)
      expect(await (await http.get(ruta)).json()).toEqual([])
    }
  })
})
