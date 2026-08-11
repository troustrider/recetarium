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
  // Dos intentos: al volver del redirect la cookie puede tardar un instante en
  // estar disponible. Si tampoco al segundo, no hay sesión que capturar, y eso
  // no es un error en sí: puede que simplemente no se haya entrado.
  for (let intento = 0; intento < 2; intento++) {
    try {
      const { data } = await authClient.getSession()
      const token = data?.session?.token
      if (token) {
        localStorage.setItem(CLAVE_TOKEN, token)
        return token
      }
    } catch {
      // Reintentar de todas formas: puede ser un fallo de red puntual.
    }
    if (intento === 0 && huboIntentoDeEntrada()) {
      await new Promise((r) => setTimeout(r, 400))
    } else {
      break
    }
  }
  return null
}

// Se marca antes de salir hacia Google y se borra al conseguir el token. Si al
// volver sigue puesta, es que el login se completó pero el navegador no dejó
// leer la sesión: sin esto la app vuelve a la landing en silencio y quien lo
// sufre solo ve que "no funciona", así que lo intenta una y otra vez.
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
