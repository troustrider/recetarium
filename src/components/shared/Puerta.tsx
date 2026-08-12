import type { ReactNode } from 'react'
import { useSesion } from '../../context/SesionContext'
import Splash from './Splash'
import Landing from '../../pages/Landing'

function Puerta({ children }: { children: ReactNode }) {
  const { estado } = useSesion()
  if (estado === 'comprobando') return <Splash />
  if (estado === 'fuera') return <Landing />
  return <>{children}</>
}

export default Puerta
