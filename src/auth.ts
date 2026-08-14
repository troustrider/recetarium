import { createAuthClient } from '@neondatabase/neon-js/auth'
import { BetterAuthReactAdapter } from '@neondatabase/neon-js/auth/react/adapters'

const URL_AUTH = import.meta.env.VITE_NEON_AUTH_URL
if (!URL_AUTH) throw new Error('Falta VITE_NEON_AUTH_URL')

export const authClient = createAuthClient(URL_AUTH, {
  adapter: BetterAuthReactAdapter(),
})

export const { signIn } = authClient

const CLAVE_TOKEN = 'recetarium:sesion'

export function tokenGuardado(): string | null {
  return localStorage.getItem(CLAVE_TOKEN)
}

export function olvidarToken(): void {
  localStorage.removeItem(CLAVE_TOKEN)
}

export async function capturarToken(): Promise<string | null> {
  const guardado = tokenGuardado()
  if (guardado) return guardado
  for (let intento = 0; intento < 2; intento++) {
    const data = await authClient
      .getSession()
      .then((r) => r.data)
      .catch(() => null)
    const token = data?.session?.token
    if (token) {
      localStorage.setItem(CLAVE_TOKEN, token)
      return token
    }
    if (intento === 0 && huboIntentoDeEntrada()) {
      await new Promise((r) => setTimeout(r, 400))
    } else {
      break
    }
  }
  return null
}

const CLAVE_INTENTO = 'recetarium:entrando'

export function marcarIntentoDeEntrada(): void {
  sessionStorage.setItem(CLAVE_INTENTO, '1')
}

export function huboIntentoDeEntrada(): boolean {
  return sessionStorage.getItem(CLAVE_INTENTO) === '1'
}

export function limpiarIntentoDeEntrada(): void {
  sessionStorage.removeItem(CLAVE_INTENTO)
}

export function cabeceraSesion(): Record<string, string> {
  const token = tokenGuardado()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// El JWT de Neon Auth dura 15 minutos. Sin esto, al caducar tocaba recargar la
// página entera para pedir otro, y eso se lleva por delante los temporizadores
// del modo cocina. Varias peticiones pueden caducar a la vez, así que comparten
// una única renovación en vuelo.
let renovacion: Promise<string | null> | null = null

// token() es el método que Neon documenta para renovar; getSession() queda de
// respaldo porque es el que ya usaba capturarToken y sabemos que devuelve JWT.
async function pedirTokenNuevo(): Promise<string | null> {
  const directo = await authClient
    .token?.()
    .then((r) => r?.data?.token ?? null)
    .catch(() => null)
  if (directo) return directo

  return authClient
    .getSession()
    .then((r) => r.data?.session?.token ?? null)
    .catch(() => null)
}

export function renovarToken(): Promise<string | null> {
  renovacion ??= (async () => {
    olvidarToken()
    const token = await pedirTokenNuevo()
    if (token) localStorage.setItem(CLAVE_TOKEN, token)
    renovacion = null
    return token
  })()
  return renovacion
}
