import { createRemoteJWKSet, jwtVerify } from 'jose'
import sql from './db.js'

// Passphrase compartida para escrituras. Si APP_KEY no está configurada
// (p. ej. en local), el middleware deja pasar para no romper el desarrollo.
//
// Se elimina en la fase 3 de docs/PLAN-multiusuario-auth.md, cuando requireUser
// lo sustituya en las 13 rutas. Hasta entonces es lo único que protege la API.
export function requireKey(req, res, next) {
  const expected = process.env.APP_KEY
  if (!expected) return next()
  if (req.get('x-app-key') === expected) return next()
  return res.status(401).json({ error: 'Clave incorrecta o ausente' })
}

// El token de sesión viaja en Authorization: Bearer, no en cookie. El servicio
// de auth vive en otro host (*.neonauth.aws.neon.tech), así que su cookie nunca
// llega hasta aquí. El cliente saca el token de getSession(), que lo devuelve en
// el cuerpo.
function tokenDe(req) {
  const cabecera = req.get('authorization') ?? ''
  if (!cabecera.startsWith('Bearer ')) return ''
  return decodeURIComponent(cabecera.slice(7).trim())
}

// Neon Auth entrega en session.token un JWT firmado, no un token opaco: por eso
// el provisionado devuelve una URL de JWKS. La clave pública se descarga una vez
// y jose la cachea, así que verificar no cuesta una petición por llamada.
//
// La URL sale de la misma variable que usa el frontend. Es la de la rama
// correspondiente, y así no hay una segunda variable que se pueda desincronizar.
const URL_AUTH = process.env.NEON_AUTH_URL ?? process.env.VITE_NEON_AUTH_URL
let jwks = null

function clavesJwt() {
  if (!URL_AUTH) throw new Error('Falta NEON_AUTH_URL o VITE_NEON_AUTH_URL')
  jwks ??= createRemoteJWKSet(new URL(`${URL_AUTH.replace(/\/$/, '')}/.well-known/jwks.json`))
  return jwks
}

async function usuarioDeJwt(token) {
  const { payload } = await jwtVerify(token, clavesJwt())
  const id = payload.sub
  if (!id) return null
  const [fila] = await sql`
    SELECT id, email, name, banned FROM neon_auth."user" WHERE id = ${id}
  `
  return fila ?? null
}

// Neon Auth guarda usuarios y sesiones en el esquema neon_auth de esta misma
// base de datos, así que validar una sesión es un JOIN y no un salto de red a
// un servicio externo. session.token tiene índice único, así que es un acierto.
async function sesionDe(token) {
  const [fila] = await sql`
    SELECT u.id, u.email, u.name, u.banned
    FROM neon_auth.session s
    JOIN neon_auth."user" u ON u.id = s."userId"
    WHERE s.token = ${token} AND s."expiresAt" > now()
  `
  return fila ?? null
}

// Primer inicio de sesión: quien está en la lista blanca entra, y el resto no.
// Si su invitación trae hogar, se le mete en ese; si no, se le crea uno propio
// y vacío. Idempotente, porque dos peticiones simultáneas pueden llegar a la vez.
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

  // Dos formas de credencial. El cliente manda el JWT del servicio de auth; los
  // tests, y cualquier llamada directa, pueden usar el token de una fila de
  // neon_auth.session, que se valida contra la base de datos.
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
    hogarId: miembro.hogarId,
    rol: miembro.rol,
  }
  next()
}

export function requireAdmin(req, res, next) {
  if (req.usuario?.rol !== 'admin') return res.status(403).json({ error: 'Solo para administradores' })
  next()
}
