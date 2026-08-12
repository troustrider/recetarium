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
