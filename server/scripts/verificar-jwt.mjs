#!/usr/bin/env node
import 'dotenv/config'
import { createRemoteJWKSet, jwtVerify, decodeJwt } from 'jose'

const token = process.argv[2]
if (!token) {
  console.error(`
  uso: node scripts/verificar-jwt.mjs <token>

  El token sale del navegador con la app abierta:
    localStorage.getItem('recetarium:sesion')

  Comprueba que el iss/aud reales cuadran con lo que exige requireUser
  antes de desplegar la validación de emisor.
`)
  process.exit(1)
}

if (token.split('.').length !== 3) {
  console.log('\n  Eso no es un JWT, es un token de sesión opaco.')
  console.log('  requireUser lo valida contra neon_auth.session, no contra el JWKS.\n')
  process.exit(0)
}

const base = (process.env.NEON_AUTH_URL ?? process.env.VITE_NEON_AUTH_URL ?? '').replace(/\/$/, '')
const origenDe = (url) => {
  try {
    return new URL(url).origin
  } catch {
    return url
  }
}
const emisor = process.env.NEON_AUTH_ISSUER ?? origenDe(base)
const audiencia = process.env.NEON_AUTH_AUDIENCE

const payload = decodeJwt(token)
console.log('\n  claims del token')
console.log(`     iss: ${payload.iss ?? '(ninguno)'}`)
console.log(`     aud: ${JSON.stringify(payload.aud) ?? '(ninguna)'}`)
console.log(`     sub: ${payload.sub}`)
console.log(`     exp: ${payload.exp ? new Date(payload.exp * 1000).toISOString() : '(ninguno)'}`)

console.log('\n  lo que va a exigir el servidor')
console.log(`     issuer:   ${emisor}`)
console.log(`     audience: ${audiencia ?? '(no se comprueba)'}`)

try {
  await jwtVerify(token, createRemoteJWKSet(new URL(`${base}/.well-known/jwks.json`)), {
    issuer: emisor,
    ...(audiencia ? { audience: audiencia } : {}),
  })
  console.log('\n  OK: el token pasa la validación. Se puede desplegar.\n')
} catch (e) {
  console.log(`\n  FALLA: ${e.code ?? e.name} — ${e.message}`)
  if (payload.iss && payload.iss !== emisor) {
    console.log(`  Arreglo: NEON_AUTH_ISSUER=${payload.iss}\n`)
  } else {
    console.log('')
  }
  process.exit(1)
}
