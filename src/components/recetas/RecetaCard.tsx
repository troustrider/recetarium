import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import type { Receta, Sabor } from '../../types/receta'

// Color plano por sabor — identidad sin imagen
// El nombre de la receta se convierte en el visual (watermark tipográfico)
const SABOR_BG: Record<Sabor, string> = {
  salado: '#041524',  // abismo oceánico
  dulce:  '#2d0412',  // cereza macerada
  amargo: '#180d00',  // fondo de taza
  umami:  '#100820',  // tierra de trufas
}

interface Props {
  receta: Receta
  onClick: (id: string) => void
  onToggleFavorita: (id: string) => void
}

function RecetaCard({ receta, onClick, onToggleFavorita }: Props) {
  const { id, nombre, categoria, sabor, tiempoPreparacion, favorita, imagen } = receta

  return (
    <motion.article
      className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-xl dark:shadow-none dark:border dark:border-gray-800 transition-all duration-300"
      onClick={() => onClick(id)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {/* Zona visual */}
      <div className="relative h-36 overflow-hidden">
        {imagen ? (
          <img
            src={imagen}
            alt={nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: SABOR_BG[sabor] }}>
            {/* Nombre como watermark tipográfico — identidad única por receta */}
            <span
              className="absolute top-1/2 -translate-y-1/2 left-3 font-display font-black leading-none select-none pointer-events-none whitespace-nowrap"
              style={{ fontSize: '72px', color: 'rgba(255,255,255,0.07)' }}
            >
              {nombre}
            </span>
            {/* Trama de puntos */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />
          </div>
        )}

        {/* Overlay oscuro al hacer hover cuando hay imagen */}
        {imagen && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300" />
        )}

        {/* Badge categoría — esquina superior izquierda */}
        {categoria && (
          <span className="absolute top-3 left-3 flex items-center gap-1 bg-white/90 dark:bg-gray-900/85 backdrop-blur-sm text-gray-700 dark:text-gray-200 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
            {categoria}
          </span>
        )}

        {/* Botón favorito — esquina superior derecha */}
        <motion.button
          onClick={(e) => { e.stopPropagation(); onToggleFavorita(id) }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-colors ${
            favorita
              ? 'bg-red-500 text-white'
              : 'bg-white/90 dark:bg-gray-900/85 text-gray-400 hover:text-red-500'
          }`}
          aria-label={favorita ? 'Quitar de favoritas' : 'Añadir a favoritas'}
          whileTap={{ scale: 0.8 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4"
            fill={favorita ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M11.998 21.5C11.998 21.5 3 15.5 3 9a5 5 0 0 1 8.998-3.002A5 5 0 0 1 21 9c0 6.5-9.002 12.5-9.002 12.5z" />
          </svg>
        </motion.button>
      </div>

      {/* Contenido */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base leading-snug line-clamp-2 min-h-[2.75rem] group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors">
          {nombre}
        </h3>
        <div className="mt-3 flex items-center gap-1 text-sm text-gray-400 dark:text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          <span>{tiempoPreparacion} min</span>
        </div>
      </div>
    </motion.article>
  )
}

export default RecetaCard
