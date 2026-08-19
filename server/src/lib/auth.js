import sql from './db.js'
import { usuarioDeSesion } from '../services/authService.js'

function tokenDe(req) {
  const cabecera = req.get('authorization') ?? ''
  if (!cabecera.startsWith('Bearer ')) return ''
  return decodeURIComponent(cabecera.slice(7).trim())
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

export async function miembroDe(usuario) {
  const [existente] = await sql`
    SELECT hogar_id AS "hogarId", rol FROM miembros WHERE usuario_id = ${usuario.id}
  `
  return existente ?? (await altaDesdeInvitacion(usuario))
}

export async function requireUser(req, res, next) {
  const token = tokenDe(req)
  if (!token) return res.status(401).json({ error: 'Sesión requerida' })

  const usuario = await usuarioDeSesion(token)
  if (!usuario) return res.status(401).json({ error: 'Sesión inválida o caducada' })
  if (usuario.banned) return res.status(403).json({ error: 'Cuenta suspendida' })

  const miembro = await miembroDe(usuario)
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
