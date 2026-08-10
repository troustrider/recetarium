import { useEffect } from 'react'

// Mantiene la pantalla encendida mientras el modo está activo (Android Chrome,
// iOS Safari 16.4+). Re-adquiere el lock al volver del segundo plano, porque el
// sistema lo suelta al bloquear. Sin la API no hace nada: es una mejora.
export function useWakeLock(activo: boolean) {
  useEffect(() => {
    if (!activo || !('wakeLock' in navigator)) return

    let sentinel: { release: () => Promise<void> } | null = null
    let cancelado = false

    const pedir = async () => {
      try {
        sentinel = await (navigator as unknown as {
          wakeLock: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> }
        }).wakeLock.request('screen')
      } catch {
        // Denegado o no disponible (p. ej. batería baja): se ignora.
      }
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible' && !cancelado) void pedir()
    }

    void pedir()
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelado = true
      document.removeEventListener('visibilitychange', onVisible)
      void sentinel?.release().catch(() => {})
    }
  }, [activo])
}
