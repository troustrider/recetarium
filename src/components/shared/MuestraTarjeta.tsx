import { Clock } from 'lucide-react'
import type { MuestraReceta } from '../../data/muestraLanding'

// Una tarjeta como las del catálogo, pero estática y sin datos ni contexto: la
// landing va por delante de los providers, así que no puede depender de nada que
// hable con la API. Copia el aspecto de RecetaCard para que lo que se enseña sea
// de verdad lo que hay dentro.
// prioritaria para las que se ven de entrada (el abanico del móvil, que es la
// vía de entrada principal). Las de escritorio van diferidas porque por debajo
// de lg están ocultas y no hace falta descargarlas.
function MuestraTarjeta({
  receta,
  className = '',
  prioritaria = false,
}: {
  receta: MuestraReceta
  className?: string
  prioritaria?: boolean
}) {
  return (
    <div
      aria-hidden
      className={`w-56 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl shadow-black/10 dark:shadow-black/40 overflow-hidden ${className}`}
    >
      <div className="relative h-32 overflow-hidden">
        <img
          src={receta.imagen}
          alt=""
          className="w-full h-full object-cover"
          loading={prioritaria ? 'eager' : 'lazy'}
          decoding="async"
        />
        <span className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/55 backdrop-blur-md text-white/90 text-[9px] font-bold uppercase tracking-widest pl-2 pr-2.5 py-1 rounded-md">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
          {receta.categoria}
        </span>
      </div>
      <div className="p-3">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-snug">{receta.nombre}</h3>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          {receta.minutos} min
          <span className="text-orange-600 dark:text-orange-400 font-semibold">
            · {receta.proteinas}g prot
          </span>
        </div>
      </div>
    </div>
  )
}

export default MuestraTarjeta
