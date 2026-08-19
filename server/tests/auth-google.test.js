import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import crypto from 'node:crypto'
import { arrancarServidor, api } from './helpers.js'
import sql from '../src/lib/db.js'
import * as auth from '../src/services/authService.js'

const HOGAR_COMPARTIDO = '00000000-0000-0000-0000-000000000001'
const DESTINO = 'http://localhost:5173/planificador'

let servidor
let base
let usuarioId
let token

beforeAll(async () => {
  process.env.GOOGLE_CLIENT_ID = 'cliente-de-pruebas.apps.googleusercontent.com'
  process.env.URL_API = 'http://localhost:3001/api/v1'
  servidor = await arrancarServidor()
  base = servidor.base

  const [u] = await sql`
    INSERT INTO usuarios (email, nombre) VALUES (${`propio-${crypto.randomUUID()}@test.dev`}, 'Propio')
    RETURNING id
  `
  usuarioId = u.id
  await sql`INSERT INTO miembros (usuario_id, hogar_id, rol) VALUES (${usuarioId}, ${HOGAR_COMPARTIDO}, 'usuario')`
  token = await auth.crearSesion(usuarioId, { ip: '10.0.0.1', agente: 'vitest' })
})

afterAll(async () => {
  await sql`DELETE FROM miembros WHERE usuario_id = ${usuarioId}`
  await sql`DELETE FROM usuarios WHERE id = ${usuarioId}`
  await servidor.cerrar()
})

describe('inicio del acceso con Google', () => {
  it('manda a Google con state y PKCE, y guarda el estado', async () => {
    const res = await fetch(`${base}/auth/google/inicio?destino=${encodeURIComponent(DESTINO)}`, {
      redirect: 'manual',
    })
    expect(res.status).toBe(302)

    const destino = new URL(res.headers.get('location'))
    expect(destino.origin).toBe('https://accounts.google.com')
    expect(destino.searchParams.get('code_challenge_method')).toBe('S256')
    expect(destino.searchParams.get('code_challenge')).toBeTruthy()
    expect(destino.searchParams.get('redirect_uri')).toBe(
      'http://localhost:3001/api/v1/auth/google/callback'
    )

    const estado = destino.searchParams.get('state')
    const [fila] = await sql`SELECT destino FROM oauth_estados WHERE estado = ${estado}`
    expect(fila.destino).toBe(DESTINO)
    await sql`DELETE FROM oauth_estados WHERE estado = ${estado}`
  })

  it('rechaza un destino de otro origen', async () => {
    const res = await fetch(`${base}/auth/google/inicio?destino=https%3A%2F%2Fajeno.example%2F`, {
      redirect: 'manual',
    })
    expect(res.status).toBe(400)
  })

  it('rechaza la vuelta con un state que no existe', async () => {
    const res = await fetch(`${base}/auth/google/callback?code=x&state=inventado`, {
      redirect: 'manual',
    })
    expect(res.status).toBe(400)
  })

  it('gasta el state una sola vez', async () => {
    const estado = 'estado-de-prueba'
    await auth.guardarEstado({ estado, verificador: 'v', destino: DESTINO })
    expect(await auth.consumirEstado(estado)).toMatchObject({ destino: DESTINO })
    expect(await auth.consumirEstado(estado)).toBeNull()
  })
})

describe('sesión propia', () => {
  it('vale como Bearer en la API', async () => {
    const http = api(base, token)
    const res = await http.get('/yo')
    expect(res.status).toBe(200)
    expect((await res.json()).hogarId).toBe(HOGAR_COMPARTIDO)
  })

  it('no guarda el token en claro', async () => {
    const [fila] = await sql`SELECT token_hash FROM sesiones WHERE usuario_id = ${usuarioId}`
    expect(fila.token_hash).not.toContain(token)
    expect(fila.token_hash).toBe(crypto.createHash('sha256').update(token).digest('hex'))
  })

  it('deja de valer tras cerrar sesión', async () => {
    const efimero = await auth.crearSesion(usuarioId)
    const http = api(base, efimero)
    expect((await http.del('/yo/sesion')).status).toBe(204)
    expect((await http.get('/yo')).status).toBe(401)
  })
})
