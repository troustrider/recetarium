import { createAuthClient } from '@neondatabase/neon-js/auth'
import { BetterAuthReactAdapter } from '@neondatabase/neon-js/auth/react/adapters'

// La URL del servicio de auth es pública (viaja en el bundle), pero no tiene
// valor por defecto a propósito: apuntar producción a la rama de pruebas por un
// fallback silencioso sería peor que no arrancar.
const URL_AUTH = import.meta.env.VITE_NEON_AUTH_URL
if (!URL_AUTH) throw new Error('Falta VITE_NEON_AUTH_URL')

export const authClient = createAuthClient(URL_AUTH, {
  adapter: BetterAuthReactAdapter(),
})

export const { signIn } = authClient

// El servicio de auth corre en otro host, así que su cookie de sesión no
// sobrevive al cierre de la app en la PWA de iOS: se entra bien y al volver a
// abrir ya no hay sesión. Comprobado en un iPhone, y no hay arreglo por ese
// lado: Neon no expone el plugin `bearer` de Better Auth, así que mandar el
// token en la cabecera contra su servicio devuelve null.
//
// Por eso la fuente de verdad de la sesión pasa a ser nuestra API, que valida
// el token contra neon_auth.session en su misma base de datos y no necesita la
// cookie para nada. El token se guarda aquí, y ese es el compromiso: un XSS se
// lo llevaría. Se acota con la CSP de vercel.json, con revocación inmediata
// (DELETE /yo/sesion borra la fila) y con el aviso de IPs nuevas en
// /admin/sesiones. La alternativa era entrar con Google en cada arranque.
const CLAVE_TOKEN = 'recetarium:sesion'

export function tokenGuardado(): string | null {
  return localStorage.getItem(CLAVE_TOKEN)
}

export function olvidarToken(): void {
  localStorage.removeItem(CLAVE_TOKEN)
}

// Justo después del login la cookie todavía vale, así que es el único momento
// en que se puede leer el token del servicio de auth. Se captura y se guarda.
export async function capturarToken(): Promise<string | null> {
  const guardado = tokenGuardado()
  if (guardado) return guardado
  const { data } = await authClient.getSession()
  const token = data?.session?.token
  if (token) localStorage.setItem(CLAVE_TOKEN, token)
  return token ?? null
}

export function cabeceraSesion(): Record<string, string> {
  const token = tokenGuardado()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
