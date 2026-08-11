import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { capturarToken, olvidarToken, tokenGuardado, authClient } from '../auth'
import { getYo, cerrarSesionServidor, type UsuarioDTO } from '../api/yo'

// Tres estados y no dos. La app se abre desde el icono del móvil y comprobar la
// sesión es una petición de red: con un binario dentro/fuera, se vería la
// landing parpadear en cada arranque antes de entrar.
//
// Que exista un token guardado es la señal de "aquí ya hubo sesión", así que
// mientras se comprueba se enseña el splash y no la landing. Sin token no hay
// nada que comprobar y se va directo a la landing, sin parpadeo tampoco.
type Estado = 'comprobando' | 'dentro' | 'fuera'

interface Sesion {
  estado: Estado
  usuario: UsuarioDTO | null
  // La API caída no es lo mismo que no haber entrado: una lleva a reintentar y
  // la otra a la landing.
  fallo: boolean
  salir: () => Promise<void>
  reintentar: () => void
}

const SesionContext = createContext<Sesion | null>(null)

export function SesionProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>(() => (tokenGuardado() ? 'comprobando' : 'fuera'))
  const [usuario, setUsuario] = useState<UsuarioDTO | null>(null)
  const [fallo, setFallo] = useState(false)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    ;(async () => {
      try {
        // Al volver del login la cookie todavía vale, y es el único momento en
        // que se puede leer el token. Si no hay, esto no hace nada.
        await capturarToken()
        const yo = await getYo()
        if (!vigente) return
        setUsuario(yo)
        setEstado(yo ? 'dentro' : 'fuera')
        if (!yo) olvidarToken()
      } catch {
        if (!vigente) return
        setFallo(true)
        setEstado('fuera')
      }
    })()
    return () => {
      vigente = false
    }
  }, [intento])

  // Salir tiene que ser instantáneo en pantalla. Si se espera a la red antes de
  // cambiar el estado, pulsar "Cerrar sesión" no hace nada visible mientras el
  // servicio de auth responde, y el usuario vuelve a pulsar.
  //
  // La revocación se lanza primero para que lea el token antes de borrarlo,
  // pero no se espera: la sesión ya está cerrada en este dispositivo.
  const salir = useCallback(async () => {
    const revocada = cerrarSesionServidor()
    olvidarToken()
    setUsuario(null)
    setEstado('fuera')
    await revocada.catch(() => {})
    authClient.signOut().catch(() => {})
  }, [])

  const reintentar = useCallback(() => {
    setFallo(false)
    setEstado(tokenGuardado() ? 'comprobando' : 'fuera')
    setIntento((n) => n + 1)
  }, [])

  return (
    <SesionContext.Provider value={{ estado, usuario, fallo, salir, reintentar }}>
      {children}
    </SesionContext.Provider>
  )
}

export function useSesion(): Sesion {
  const ctx = useContext(SesionContext)
  if (!ctx) throw new Error('useSesion fuera de SesionProvider')
  return ctx
}
