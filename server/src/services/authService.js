import crypto from 'node:crypto'
import sql from '../lib/db.js'

const DIAS_SESION = 30
const MINUTOS_ESTADO = 10

const huella = (token) => crypto.createHash('sha256').update(token).digest('hex')

export async function guardarEstado({ estado, verificador, destino }) {
  await sql`
    INSERT INTO oauth_estados (estado, verificador, destino)
    VALUES (${estado}, ${verificador}, ${destino})
  `
}

export async function consumirEstado(estado) {
  const [fila] = await sql`
    DELETE FROM oauth_estados
    WHERE estado = ${estado}
      AND creado_en > now() - (${MINUTOS_ESTADO} || ' minutes')::interval
    RETURNING verificador, destino
  `
  return fila ?? null
}

export async function limpiarEstadosCaducados() {
  const filas = await sql`
    DELETE FROM oauth_estados
    WHERE creado_en <= now() - (${MINUTOS_ESTADO} || ' minutes')::interval
    RETURNING estado
  `
  return filas.length
}

export async function guardarUsuario(perfil) {
  const [fila] = await sql`
    INSERT INTO usuarios (email, nombre, imagen, google_sub, visto_en)
    VALUES (${perfil.email}, ${perfil.nombre}, ${perfil.imagen}, ${perfil.sub}, now())
    ON CONFLICT (email) DO UPDATE SET
      nombre     = excluded.nombre,
      imagen     = excluded.imagen,
      google_sub = coalesce(usuarios.google_sub, excluded.google_sub),
      visto_en   = now()
    RETURNING id, email, nombre AS name, imagen AS image, suspendido AS banned
  `
  return fila
}

export async function crearSesion(usuarioId, { ip, agente } = {}) {
  const token = crypto.randomBytes(32).toString('base64url')
  await sql`
    INSERT INTO sesiones (token_hash, usuario_id, expira_en, ip, agente)
    VALUES (${huella(token)}, ${usuarioId}, now() + (${DIAS_SESION} || ' days')::interval,
            ${ip ?? null}, ${agente ?? null})
  `
  return token
}

export async function usuarioDeSesion(token) {
  const [fila] = await sql`
    SELECT u.id, u.email, u.nombre AS name, u.imagen AS image, u.suspendido AS banned
    FROM sesiones s
    JOIN usuarios u ON u.id = s.usuario_id
    WHERE s.token_hash = ${huella(token)} AND s.expira_en > now()
  `
  return fila ?? null
}

export async function borrarSesionesDe(usuarioId) {
  const filas = await sql`DELETE FROM sesiones WHERE usuario_id = ${usuarioId} RETURNING token_hash`
  return filas.length
}

export async function limpiarSesionesCaducadas() {
  const filas = await sql`DELETE FROM sesiones WHERE expira_en <= now() RETURNING token_hash`
  return filas.length
}
