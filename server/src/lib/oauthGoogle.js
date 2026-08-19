import crypto from 'node:crypto'
import { createRemoteJWKSet, jwtVerify } from 'jose'

const AUTORIZACION = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN = 'https://oauth2.googleapis.com/token'
const CLAVES = 'https://www.googleapis.com/oauth2/v3/certs'
const EMISORES = ['https://accounts.google.com', 'accounts.google.com']

export const cliente = () => process.env.GOOGLE_CLIENT_ID ?? ''
const secreto = () => process.env.GOOGLE_CLIENT_SECRET ?? ''

export function urlDeRetorno(req) {
  const base = process.env.URL_API ?? `${req.protocol}://${req.get('host')}/api/v1`
  return `${base.replace(/\/$/, '')}/auth/google/callback`
}

export function nuevoVerificador() {
  return crypto.randomBytes(32).toString('base64url')
}

export function nuevoEstado() {
  return crypto.randomBytes(24).toString('base64url')
}

export function urlDeGoogle({ estado, verificador, retorno }) {
  const reto = crypto.createHash('sha256').update(verificador).digest('base64url')
  const params = new URLSearchParams({
    client_id: cliente(),
    redirect_uri: retorno,
    response_type: 'code',
    scope: 'openid email profile',
    state: estado,
    code_challenge: reto,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  })
  return `${AUTORIZACION}?${params}`
}

export async function canjearCodigo({ codigo, verificador, retorno }) {
  const res = await fetch(TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: codigo,
      client_id: cliente(),
      client_secret: secreto(),
      redirect_uri: retorno,
      grant_type: 'authorization_code',
      code_verifier: verificador,
    }),
  })
  if (!res.ok) throw new Error(`Google rechazó el canje (${res.status})`)
  const { id_token: idToken } = await res.json()
  if (!idToken) throw new Error('Google no devolvió id_token')
  return idToken
}

let jwks = null

export async function perfilDe(idToken) {
  jwks ??= createRemoteJWKSet(new URL(CLAVES))
  const { payload } = await jwtVerify(idToken, jwks, { issuer: EMISORES, audience: cliente() })
  if (!payload.email) throw new Error('El id_token no trae correo')
  if (payload.email_verified === false) throw new Error('Correo sin verificar en Google')
  return {
    sub: payload.sub,
    email: String(payload.email).toLowerCase(),
    nombre: payload.name ?? null,
    imagen: payload.picture ?? null,
  }
}
