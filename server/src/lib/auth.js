import { createRemoteJWKSet, jwtVerify } from 'jose'
import sql from './db.js'

function tokenDe(req) {
  const cabecera = req.get('authorization') ?? ''
  if (!cabecera.startsWith('Bearer ')) return ''
  return decodeURIComponent(cabecera.slice(7).trim())
}

const URL_AUTH = process.env.NEON_AUTH_URL ?? process.env.VITE_NEON_AUTH_URL
const BASE_AUTH = URL_AUTH?.replace(/\/$/, '')

// El JWKS cuelga del path completo (.../neondb/auth/.well-known/jwks.json) pero
// Neon Auth firma el token con el origen pelado en el iss. Comparar contra la URL
// entera rechaza todos los tokens buenos.
const origenDe = (url) => {
  try {
    return new URL(url).origin
  } catch {
    return url
  }
}

const EMISOR = process.env.NEON_AUTH_ISSUER ?? (BASE_AUTH && origenDe(BASE_AUTH))
const AUDIENCIA = process.env.NEON_AUTH_AUDIENCE
let jwks = null

function clavesJwt() {
  if (!URL_AUTH) throw new Error('Falta NEON_AUTH_URL o VITE_NEON_AUTH_URL')
  jwks ??= createRemoteJWKSet(new URL(`${BASE_AUTH}/.well-known/jwks.json`))
  return jwks
}

async function usuarioDeJwt(token) {
  const { payload } = await jwtVerify(token, clavesJwt(), {
    issuer: EMISOR,
    ...(AUDIENCIA ? { audience: AUDIENCIA } : {}),
  })
  const id = payload.sub
  if (!id) return null
  const [fila] = await sql`
    SELECT id, email, name, image, banned FROM neon_auth."user" WHERE id = ${id}
  `
  return fila ?? null
}

async function sesionDe(token) {
  const [fila] = await sql`
    SELECT u.id, u.email, u.name, u.image, u.banned
    FROM neon_auth.session s
    JOIN neon_auth."user" u ON u.id = s."userId"
    WHERE s.token = ${token} AND s."expiresAt" > now()
  `
  return fila ?? null
}

async function altaDesdeInvitacion(usuario) {
  const email = usuario.email.toLowerCase()
  const [invitacion] = await sql`
    SELECT hogar_id AS "hogarId", rol FROM invitados WHERE email = ${email}
  `
  if (!invitacion) return null

  let hogarId = invitacion.hogarId
  if (!hogarId) {
    const [hogar] = await sql`
      INSERT INTO hogares (nombre) VALUES (${usuario.name || email}) RETURNING id
    `
    hogarId = hogar.id
  }

  await sql`
    INSERT INTO miembros (usuario_id, hogar_id, rol)
    VALUES (${usuario.id}, ${hogarId}, ${invitacion.rol})
    ON CONFLICT (usuario_id) DO NOTHING
  `
  await sql`UPDATE invitados SET usado_en = now() WHERE email = ${email} AND usado_en IS NULL`

  const [miembro] = await sql`
    SELECT hogar_id AS "hogarId", rol FROM miembros WHERE usuario_id = ${usuario.id}
  `
  return miembro
}

export async function requireUser(req, res, next) {
  const token = tokenDe(req)
  if (!token) return res.status(401).json({ error: 'Sesión requerida' })

  let usuario = null
  if (token.split('.').length === 3) {
    try {
      usuario = await usuarioDeJwt(token)
    } catch (e) {
      return res.status(401).json({ error: `Token no verificable: ${e.code ?? e.name}` })
    }
  } else {
    usuario = await sesionDe(token)
  }
  if (!usuario) return res.status(401).json({ error: 'Sesión inválida o caducada' })
  if (usuario.banned) return res.status(403).json({ error: 'Cuenta suspendida' })

  const [existente] = await sql`
    SELECT hogar_id AS "hogarId", rol FROM miembros WHERE usuario_id = ${usuario.id}
  `
  const miembro = existente ?? (await altaDesdeInvitacion(usuario))
  if (!miembro) return res.status(403).json({ error: 'Este correo no tiene acceso' })

  req.usuario = {
    id: usuario.id,
    email: usuario.email,
    nombre: usuario.name,
    imagen: usuario.image,
    hogarId: miembro.hogarId,
    rol: miembro.rol,
  }
  next()
}

export function requireAdmin(req, res, next) {
  if (req.usuario?.rol !== 'admin') return res.status(403).json({ error: 'Solo para administradores' })
  next()
}
