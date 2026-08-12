import { useState } from 'react'

interface Props {
  nombre: string | null
  email: string
  imagen: string | null
  tamano?: number
}

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
