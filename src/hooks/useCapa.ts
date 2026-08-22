import { useEffect, useRef } from 'react'

/**
 * Escape cierra la capa y, con `conAtras`, también el botón de retroceder: al
 * abrirla se mete una entrada en el historial, así que volver atrás la consume
 * en vez de sacarte de la pantalla. La entrada conserva el estado del router
 * para que un POP posterior caiga en una ruta que él reconoce.
 *
 * `cerrar` se guarda en una referencia a propósito: si entrara como dependencia,
 * una función en línea reinstalaría el efecto en cada render y metería una
 * entrada de historial por render.
 */
export default function useCapa(abierta: boolean, cerrar: () => void, conAtras = false): void {
  const alCerrar = useRef(cerrar)
  useEffect(() => {
    alCerrar.current = cerrar
  })

  useEffect(() => {
    if (!abierta) return
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') alCerrar.current()
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [abierta])

  useEffect(() => {
    if (!abierta || !conAtras) return
    window.history.pushState({ ...window.history.state, capa: true }, '')
    const volver = () => alCerrar.current()
    window.addEventListener('popstate', volver)
    return () => {
      window.removeEventListener('popstate', volver)
      // Cerrada con la × o tocando fuera: la entrada sigue puesta y hay que
      // retirarla, o el siguiente «atrás» se lo comería sin que se vea nada.
      if (window.history.state?.capa) window.history.back()
    }
  }, [abierta, conAtras])
}
