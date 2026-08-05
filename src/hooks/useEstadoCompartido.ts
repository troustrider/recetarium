import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { inicioGuardado, finGuardado, registrarFallo, limpiarFallo } from '../utils/sincronizacion'

// Ciclo de un trozo del estado compartido (plan, despensa, extras, pendientes):
// se carga del backend al montar, se guarda con debounce, y se revalida al
// volver a la pestaña o cada minuto, para que lo que se toca en el móvil llegue
// al ordenador sin recargar. La carga nunca pisa lo que el usuario haya tocado
// mientras tanto.
//
// Devuelve el estado y un setter con la misma firma que el de useState. Usar
// ese setter es lo que marca el estado como tocado: cualquier setEstado que se
// salte el hook rompe esa garantía.

const INTERVALO_REVALIDACION = 60_000

interface Opciones<T, DTO> {
  // Cómo se llama esto para el usuario si falla el guardado ("la despensa").
  nombre: string
  inicial: T | (() => T)
  cargar: () => Promise<DTO>
  guardar: (dto: DTO) => Promise<void>
  serializar: (estado: T) => DTO
  // Qué hacer con lo que llega del backend. Devolver null significa "no hay
  // nada que aplicar, sube lo que hay en local" (backend vacío la primera vez).
  hidratar: (dto: DTO, actual: T) => T | null
  // Falso mientras falten datos para poder hidratar (p. ej. el catálogo de
  // recetas, necesario para rehidratar el plan por id).
  listo?: boolean
  // Efecto local en cada cambio, antes de cualquier guardado (cache offline).
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

  // Versión local contra versión confirmada en backend. Mientras la local vaya
  // por delante hay cambios sin guardar y una revalidación los pisaría.
  const versionRef = useRef(0)
  const guardadaRef = useRef(0)
  const pendienteDeGuardar = () => versionRef.current > guardadaRef.current

  // Las funciones cambian de identidad en cada render; se llaman siempre las
  // últimas sin meterlas en las deps de los efectos.
  const fns = useRef({ cargar, guardar, serializar, hidratar, alCambiar })
  useEffect(() => {
    fns.current = { cargar, guardar, serializar, hidratar, alCambiar }
  })

  // Guarda siempre lo último que hay en pantalla, no un DTO congelado: si un
  // guardado falla y se reintenta más tarde, lo que sube es el estado actual.
  // El reintento va por ref para no encadenar closures viejas.
  const enviarRef = useRef<() => Promise<void>>(async () => {})

  const enviar = useCallback(async (): Promise<void> => {
    inicioGuardado()
    // La versión se lee antes de subir: si el usuario toca algo mientras el
    // guardado va en vuelo, esto no la da por confirmada.
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
        // Si no cambia nada, no se arma el salto: si no, se lo comería el
        // primer cambio del usuario en vez del guardado de la hidratación.
        if (siguiente === estadoRef.current) return
        saltarGuardadoRef.current = true
        setEstado(siguiente)
      })
      .catch(() => {})
      .finally(() => { if (!cancelado) hidratadoRef.current = true })

    return () => { cancelado = true }
  }, [listo, enviar])

  // Trae lo que haya cambiado en el otro dispositivo. Solo se aplica si aquí no
  // hay nada pendiente de subir: entre dos versiones, gana la de quien está
  // editando ahora mismo.
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
    // Hidratar devuelve objetos nuevos aunque el contenido sea el mismo; sin
    // esta comparación cada minuto repintaría toda la app para nada.
    const { serializar: ser } = fns.current
    if (JSON.stringify(ser(siguiente)) === JSON.stringify(ser(estadoRef.current))) return
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
