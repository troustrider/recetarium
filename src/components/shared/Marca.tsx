import { ChefHat } from 'lucide-react'

// La misma marca del header, escalable. Conserva el naranja, el rounded-xl y la
// sombra teñida para que la landing y el splash se lean como la misma app antes
// de haber entrado en ella.
function Marca({ tamano = 56 }: { tamano?: number }) {
  return (
    <div
      className="bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-400/30 dark:shadow-orange-900/40"
      style={{ width: tamano, height: tamano }}
    >
      <ChefHat className="text-white" strokeWidth={2.2} style={{ width: tamano * 0.5, height: tamano * 0.5 }} />
    </div>
  )
}

export default Marca
