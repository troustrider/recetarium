import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import express from 'express'
import sql from '../src/lib/db.js'
import { requireUser, requireAdmin } from '../src/lib/auth.js'
import { crearSesion } from '../src/services/authService.js'

const HOGAR_COMPARTIDO = '00000000-0000-0000-0000-000000000001'
const creados = { usuarios: [], invitados: [], hogares: [] }

let servidor
let base

async function crearUsuario(email, { banned = false } = {}) {
  const [u] = await sql`
    INSERT INTO usuarios (email, nombre, suspendido)
    VALUES (${email}, ${email.split('@')[0]}, ${banned})
    RETURNING id
  `
  creados.usuarios.push(u.id)
  const token = await crearSesion(u.id)
  return { id: u.id, token }
}

async function invitar(email, hogarId, rol = 'usuario') {
  await sql`INSERT INTO invitados (email, hogar_id, rol) VALUES (${email}, ${hogarId}, ${rol})`
  creados.invitados.push(email)
}

function get(ruta, token) {
  const headers = token ? { authorization: `Bearer ${token}` } : {}
  return fetch(`${base}${ruta}`, { headers })
}

beforeAll(async () => {
  const app = express()
  app.get('/yo', requireUser, (req, res) => res.json(req.usuario))
  app.get('/admin', requireUser, requireAdmin, (req, res) => res.json({ ok: true }))
  servidor = app.listen(0)
  await new Promise((r) => servidor.once('listening', r))
  base = `http://127.0.0.1:${servidor.address().port}`
})

afterAll(async () => {
  if (creados.usuarios.length) {
    await sql`DELETE FROM miembros WHERE usuario_id = ANY(${creados.usuarios}::uuid[])`
    await sql`DELETE FROM usuarios WHERE id = ANY(${creados.usuarios}::uuid[])`
  }
  if (creados.invitados.length) await sql`DELETE FROM invitados WHERE email = ANY(${creados.invitados})`
  if (creados.hogares.length) await sql`DELETE FROM hogares WHERE id = ANY(${creados.hogares}::uuid[])`
  await new Promise((r) => servidor.close(r))
})

describe('requireUser', () => {
  it('rechaza sin cabecera', async () => {
    expect((await get('/yo')).status).toBe(401)
  })

  it('rechaza un token inventado', async () => {
    expect((await get('/yo', 'no-existe')).status).toBe(401)
  })

  it('acepta el token opaco url-encoded', async () => {
    const email = `encoded-${Date.now()}@test.dev`
    const { token } = await crearUsuario(email)
    await invitar(email, HOGAR_COMPARTIDO)

    const res = await get('/yo', encodeURIComponent(token))
    expect(res.status).toBe(200)
  })

  it('rechaza una sesión caducada', async () => {
    const { id, token } = await crearUsuario(`caducada-${Date.now()}@test.dev`)
    await sql`UPDATE sesiones SET expira_en = now() - interval '1 hour' WHERE usuario_id = ${id}`
    expect((await get('/yo', token)).status).toBe(401)
  })

  it('rechaza a quien no está en la lista blanca', async () => {
    const { token } = await crearUsuario(`fuera-${Date.now()}@test.dev`)
    const res = await get('/yo', token)
    expect(res.status).toBe(403)
    expect((await res.json()).error).toMatch(/no tiene acceso/i)
  })

  it('rechaza una cuenta suspendida aunque esté invitada', async () => {
    const email = `baneado-${Date.now()}@test.dev`
    const { token } = await crearUsuario(email, { banned: true })
    await invitar(email, HOGAR_COMPARTIDO)
    expect((await get('/yo', token)).status).toBe(403)
  })

  it('mete en el hogar compartido a quien viene invitado con hogar', async () => {
    const email = `cloe-${Date.now()}@test.dev`
    const { token } = await crearUsuario(email)
    await invitar(email, HOGAR_COMPARTIDO)

    const res = await get('/yo', token)
    expect(res.status).toBe(200)
    const usuario = await res.json()
    expect(usuario.hogarId).toBe(HOGAR_COMPARTIDO)
    expect(usuario.rol).toBe('usuario')
    expect(usuario.email).toBe(email)
  })

  it('crea un hogar propio a quien viene invitado sin hogar', async () => {
    const email = `hermano-${Date.now()}@test.dev`
    const { token } = await crearUsuario(email)
    await invitar(email, null)

    const usuario = await (await get('/yo', token)).json()
    expect(usuario.hogarId).toBeTruthy()
    expect(usuario.hogarId).not.toBe(HOGAR_COMPARTIDO)
    creados.hogares.push(usuario.hogarId)
  })

  it('el alta es idempotente: dos peticiones no crean dos hogares', async () => {
    const email = `repe-${Date.now()}@test.dev`
    const { token } = await crearUsuario(email)
    await invitar(email, null)

    const [a, b] = await Promise.all([get('/yo', token), get('/yo', token)])
    const uno = await a.json()
    const dos = await b.json()
    expect(uno.hogarId).toBe(dos.hogarId)
    creados.hogares.push(uno.hogarId)

    const [{ count }] = await sql`SELECT count(*)::int FROM miembros WHERE hogar_id = ${uno.hogarId}`
    expect(count).toBe(1)
  })

  it('marca la invitación como usada', async () => {
    const email = `usada-${Date.now()}@test.dev`
    const { token } = await crearUsuario(email)
    await invitar(email, HOGAR_COMPARTIDO)
    await get('/yo', token)

    const [inv] = await sql`SELECT usado_en AS "usadoEn" FROM invitados WHERE email = ${email}`
    expect(inv.usadoEn).not.toBeNull()
  })
})

describe('requireAdmin', () => {
  it('deja pasar al admin y corta al usuario normal', async () => {
    const admin = `admin-${Date.now()}@test.dev`
    const normal = `normal-${Date.now()}@test.dev`
    const sesionAdmin = await crearUsuario(admin)
    const sesionNormal = await crearUsuario(normal)
    await invitar(admin, HOGAR_COMPARTIDO, 'admin')
    await invitar(normal, HOGAR_COMPARTIDO)

    expect((await get('/admin', sesionAdmin.token)).status).toBe(200)
    expect((await get('/admin', sesionNormal.token)).status).toBe(403)
  })
})
