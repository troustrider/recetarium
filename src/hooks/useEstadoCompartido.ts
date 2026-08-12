import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { inicioGuardado, finGuardado, registrarFallo, limpiarFallo } from '../utils/sincronizacion'

const INTERVALO_REVALIDACION = 60_000

function huella(valor: unknown): string {
  if (Array.isArray(valor)) return `[${valor.map(huella).join(',')}]`
  if (valor !== null && typeof valor === 'object') {
    const obj = valor as Record<string, unknown>
    const partes = Object.keys(obj)
      .filter((k) => obj[k] !== undefined)
      .sort()
      .map((k) => `${k}:${huella(obj[k])}`)
    return `{${partes.join(',')}}`
  }
  return JSON.stringify(valor) ?? 'null'
}

interface Opciones<T, DTO> {
  nombre: string
  inicial: T | (() => T)
  cargar: () => Promise<DTO>
  guardar: (dto: DTO) => Promise<void>
  serializar: (estado: T) => DTO
  hidratar: (dto: DTO, actual: T) => T | null
  listo?: boolean
  alCambiar?: (estado: T) => void
  retardo?: number
}

export function useEstadoCompartido<T, DTO>({
  nombre,
  inicial,
  cargar,
  guardar,
  serializar,
  hidratar,
  listo = true,
  alCambiar,
  retardo = 800,
}: Opciones<T, DTO>): [T, Dispatch<SetStateAction<T>>] {
  const [estado, setEstado] = useState<T>(inicial)

  const estadoRef = useRef(estado)
  const hidratadoRef = useRef(false)
  const saltarGuardadoRef = useRef(false)
  const tocadoRef = useRef(false)

  const versionRef = useRef(0)
  const guardadaRef = useRef(0)
  const pendienteDeGuardar = () => versionRef.current > guardadaRef.current

  const fns = useRef({ cargar, guardar, serializar, hidratar, alCambiar })
  useEffect(() => {
    fns.current = { cargar, guardar, serializar, hidratar, alCambiar }
  })

  const enviarRef = useRef<() => Promise<void>>(async () => {})

  const enviar = useCallback(async (): Promise<void> => {
    inicioGuardado()
    const version = versionRef.current
    try {
      await fns.current.guardar(fns.current.serializar(estadoRef.current))
      if (version > guardadaRef.current) guardadaRef.current = version
      limpiarFallo(nombre)
    } catch {
      registrarFallo(nombre, () => enviarRef.current())
    } finally {
      finGuardado()
    }
  }, [nombre])

  useEffect(() => { enviarRef.current = enviar }, [enviar])

  useEffect(() => {
    if (hidratadoRef.current || !listo) return
    let cancelado = false

    const subirLocal = () => { void enviar() }

    fns.current
      .cargar()
      .then((dto) => {
        if (cancelado) return
        if (tocadoRef.current) return subirLocal()
        const siguiente = fns.current.hidratar(dto, estadoRef.current)
        if (siguiente === null) return subirLocal()
        if (siguiente === estadoRef.current) return
        saltarGuardadoRef.current = true
        setEstado(siguiente)
      })
      .catch(() => {})
      .finally(() => { if (!cancelado) hidratadoRef.current = true })

    return () => { cancelado = true }
  }, [listo, enviar])

  const revalidar = useCallback(async () => {
    if (!hidratadoRef.current || pendienteDeGuardar()) return
    let dto: DTO
    try {
      dto = await fns.current.cargar()
    } catch {
      return
    }
    if (pendienteDeGuardar()) return
    const siguiente = fns.current.hidratar(dto, estadoRef.current)
    if (siguiente === null || siguiente === estadoRef.current) return
    const { serializar: ser } = fns.current
    if (huella(ser(siguiente)) === huella(ser(estadoRef.current))) return
    saltarGuardadoRef.current = true
    setEstado(siguiente)
  }, [])

  useEffect(() => {
    if (!listo) return
    const alVolver = () => { if (!document.hidden) void revalidar() }
    document.addEventListener('visibilitychange', alVolver)
    window.addEventListener('focus', alVolver)
    const t = setInterval(alVolver, INTERVALO_REVALIDACION)
    return () => {
      document.removeEventListener('visibilitychange', alVolver)
      window.removeEventListener('focus', alVolver)
      clearInterval(t)
    }
  }, [listo, revalidar])

  useEffect(() => {
    estadoRef.current = estado
    fns.current.alCambiar?.(estado)
    if (!hidratadoRef.current) return
    if (saltarGuardadoRef.current) { saltarGuardadoRef.current = false; return }
    const t = setTimeout(() => { void enviar() }, retardo)
    return () => clearTimeout(t)
  }, [estado, retardo, enviar])

  const cambiar = useCallback<Dispatch<SetStateAction<T>>>((accion) => {
    tocadoRef.current = true
    versionRef.current++
    setEstado(accion)
  }, [])

  return [estado, cambiar]
}

export default useEstadoCompartido
