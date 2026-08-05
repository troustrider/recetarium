import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { inicioGuardado, finGuardado, registrarFallo, limpiarFallo } from '../utils/sincronizacion'

// Ciclo de un trozo del estado compartido (plan, despensa, extras, pendientes):
// se carga del backend una vez, se guarda con debounce, y la respuesta de la
// carga no pisa lo que el usuario haya tocado mientras tanto.
//
// Devuelve el estado y un setter con la misma firma que el de useState. Usar
// ese setter es lo que marca el estado como tocado: cualquier setEstado que se
// salte el hook rompe esa garantía.

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
    try {
      await fns.current.guardar(fns.current.serializar(estadoRef.current))
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
    setEstado(accion)
  }, [])

  return [estado, cambiar]
}

export default useEstadoCompartido
