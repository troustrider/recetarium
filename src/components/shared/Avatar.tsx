import { useState } from 'react'

interface Props {
  nombre: string | null
  email: string
  imagen: string | null
  tamano?: number
}

// La cuenta se distingue del resto de la barra por la forma: círculo con foto o
// inicial, frente a los iconos de contorno de las utilidades. Si la foto de
// Google no carga, la inicial sobre el naranja de la marca cumple igual.
function Avatar({ nombre, email, imagen, tamano = 32 }: Props) {
  const [sinFoto, setSinFoto] = useState(false)
  const estilo = { width: tamano, height: tamano }

  if (imagen && !sinFoto) {
    return (
      <img
        src={imagen}
        alt=""
        style={estilo}
        onError={() => setSinFoto(true)}
        // googleusercontent devuelve 403 a algunas peticiones con referer.
        referrerPolicy="no-referrer"
        className="rounded-full object-cover bg-gray-100 dark:bg-gray-800"
      />
    )
  }

  return (
    <span
      style={estilo}
      className="rounded-full bg-orange-500 text-white font-bold flex items-center justify-center leading-none"
    >
      <span style={{ fontSize: tamano * 0.42 }}>
        {(nombre || email || '?').trim().charAt(0).toUpperCase()}
      </span>
    </span>
  )
}

export default Avatar
