import type { ReactNode } from 'react'
import { useSesion } from '../../context/SesionContext'
import Splash from './Splash'
import Landing from '../../pages/Landing'

// Sin sesión, el árbol de la app no llega a montarse. Va por encima de los
// providers de datos a propósito: si el candado estuviera dentro, esos
// providers arrancarían igual, pedirían a la API sin sesión y encenderían los
// avisos de error por detrás de la landing.
function Puerta({ children }: { children: ReactNode }) {
  const { estado } = useSesion()
  if (estado === 'comprobando') return <Splash />
  if (estado === 'fuera') return <Landing />
  return <>{children}</>
}

export default Puerta
