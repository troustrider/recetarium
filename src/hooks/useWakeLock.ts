import { useEffect } from 'react'

export function useWakeLock(activo: boolean) {
  useEffect(() => {
    if (!activo || !('wakeLock' in navigator)) return

    let sentinel: { release: () => Promise<void> } | null = null
    let cancelado = false

    const pedir = async () => {
      sentinel = await (navigator as unknown as {
        wakeLock: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> }
      }).wakeLock
        .request('screen')
        .catch(() => null)
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
