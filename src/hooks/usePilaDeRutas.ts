import { useEffect } from 'react'
import { useLocation, type Location } from 'react-router-dom'

// Fuera del componente, como las posiciones de scroll: la pila del historial no
// es estado de nadie —no se pinta, solo se consulta cuando arranca el gesto— y
// guardarla en estado obliga a escribirla desde un efecto.
const rutas = new Map<number, Location>()

/**
 * Dónde estamos en la pila del historial y qué ruta queda justo por debajo, que
 * es la que el arrastre de vuelta atrás dibuja mientras el dedo empuja.
 *
 * No vale con recordar «la última que hubo»: al volver atrás dos veces seguidas
 * la que se acaba de dejar es la de delante, así que debajo asomaría la pantalla
 * equivocada. El índice lo lleva el router en el estado del historial; con él
 * cada ruta se anota en su sitio y la de debajo es siempre la anterior.
 *
 * Recargar la página vacía la pila y deja `previa` en nada aunque haya historial
 * detrás: el gesto sigue llevando atrás, pero ese primer viaje va sin fondo.
 */
export default function usePilaDeRutas(): { indice: number; previa: Location | null } {
  const location = useLocation()
  const indice = (window.history.state as { idx?: number } | null)?.idx ?? 0

  useEffect(() => {
    rutas.set(indice, location)
  }, [location, indice])

  return { indice, previa: indice > 0 ? rutas.get(indice - 1) ?? null : null }
}
