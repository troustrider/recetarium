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

export const { useSession, signIn, signOut } = authClient

// La API vive en otro host que el servicio de auth, así que su cookie de sesión
// no llega sola: el token viaja en Authorization. getSession() lo devuelve en el
// cuerpo, y el cliente lo cachea, así que llamar aquí no es una petición de red
// por cada fetch.
export async function cabeceraSesion(): Promise<Record<string, string>> {
  const { data } = await authClient.getSession()
  const token = data?.session?.token
  return token ? { Authorization: `Bearer ${token}` } : {}
}
