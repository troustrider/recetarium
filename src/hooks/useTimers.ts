import { useCallback, useEffect, useState } from 'react'
import { desbloquearAudio, sonarAlarma } from '../utils/alarma'
import { pedirPermisoNotificaciones, notificarTemporizador } from '../utils/notificaciones'

export interface Timer {
  id: string
  etiqueta: string
  stepIndex: number
  total: number
  restante: number
  corriendo: boolean
  hecho: boolean
  finAt: number | null
}

export interface TimerSpec {
  id: string
  etiqueta: string
  stepIndex: number
  segundos: number
}

// Varios temporizadores a la vez (arroz + salsa). La cuenta atrás se calcula
// desde una marca de fin absoluta (finAt), no acumulando ticks, para no derivar
// cuando el navegador estrangula el intervalo en segundo plano.
export function useTimers() {
  const [timers, setTimers] = useState<Timer[]>([])

  useEffect(() => {
    const int = setInterval(() => {
      setTimers((prev) => {
        if (!prev.some((t) => t.corriendo && !t.hecho)) return prev
        const ahora = Date.now()
        let cambio = false
        const next = prev.map((t) => {
          if (!t.corriendo || t.hecho || t.finAt == null) return t
          const restante = Math.max(0, Math.round((t.finAt - ahora) / 1000))
          if (restante <= 0) {
            cambio = true
            sonarAlarma()
            void notificarTemporizador('Recetarium — ¡tiempo!', `Paso ${t.stepIndex + 1} · ${t.etiqueta} listo`, t.id)
            return { ...t, restante: 0, corriendo: false, hecho: true, finAt: null }
          }
          if (restante !== t.restante) {
            cambio = true
            return { ...t, restante }
          }
          return t
        })
        return cambio ? next : prev
      })
    }, 500)
    return () => clearInterval(int)
  }, [])

  // Tap sobre un chip: crea y arranca; si ya existe, alterna play/pausa; si ya
  // terminó, lo rearma. Idempotente por id (stepIndex + índice de duración).
  const toggle = useCallback((spec: TimerSpec) => {
    desbloquearAudio()
    void pedirPermisoNotificaciones()
    setTimers((prev) => {
      const found = prev.find((t) => t.id === spec.id)
      if (!found) {
        return [
          ...prev,
          {
            id: spec.id,
            etiqueta: spec.etiqueta,
            stepIndex: spec.stepIndex,
            total: spec.segundos,
            restante: spec.segundos,
            corriendo: true,
            hecho: false,
            finAt: Date.now() + spec.segundos * 1000,
          },
        ]
      }
      return prev.map((t) => {
        if (t.id !== spec.id) return t
        if (t.hecho) return { ...t, restante: t.total, corriendo: false, hecho: false, finAt: null }
        if (t.corriendo) return { ...t, corriendo: false, finAt: null }
        return { ...t, corriendo: true, finAt: Date.now() + t.restante * 1000 }
      })
    })
  }, [])

  const eliminar = useCallback((id: string) => {
    setTimers((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { timers, toggle, eliminar }
}
