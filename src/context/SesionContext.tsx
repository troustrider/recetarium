import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  capturarToken,
  olvidarToken,
  tokenGuardado,
  authClient,
  huboIntentoDeEntrada,
  limpiarIntentoDeEntrada,
} from '../auth'
import { getYo, cerrarSesionServidor, type UsuarioDTO } from '../api/yo'
import { limpiarCacheApi } from '../api/http'

type Estado = 'comprobando' | 'dentro' | 'fuera'

interface Sesion {
  estado: Estado
  usuario: UsuarioDTO | null
  fallo: boolean
  bloqueada: boolean
  salir: () => Promise<void>
  reintentar: () => void
}

const SesionContext = createContext<Sesion | null>(null)

export function SesionProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>(() => (tokenGuardado() ? 'comprobando' : 'fuera'))
  const [usuario, setUsuario] = useState<UsuarioDTO | null>(null)
  const [fallo, setFallo] = useState(false)
  const [bloqueada, setBloqueada] = useState(false)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    ;(async () => {
      try {
        const token = await capturarToken()

        if (!token && huboIntentoDeEntrada()) {
          if (!vigente) return
          setBloqueada(true)
          setEstado('fuera')
          return
        }
        if (token) limpiarIntentoDeEntrada()

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

  const salir = useCallback(async () => {
    const revocada = cerrarSesionServidor()
    olvidarToken()
    setUsuario(null)
    setEstado('fuera')
    await revocada.catch(() => {})
    await limpiarCacheApi()
    authClient.signOut().catch(() => {})
  }, [])

  const reintentar = useCallback(() => {
    setFallo(false)
    setBloqueada(false)
    limpiarIntentoDeEntrada()
    setEstado(tokenGuardado() ? 'comprobando' : 'fuera')
    setIntento((n) => n + 1)
  }, [])

  return (
    <SesionContext.Provider value={{ estado, usuario, fallo, bloqueada, salir, reintentar }}>
      {children}
    </SesionContext.Provider>
  )
}

export function useSesion(): Sesion {
  const ctx = useContext(SesionContext)
  if (!ctx) throw new Error('useSesion fuera de SesionProvider')
  return ctx
}
