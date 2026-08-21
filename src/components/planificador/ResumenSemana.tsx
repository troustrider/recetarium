import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { InformeSemana } from '../../context/PlanificadorContext'
import type { Preferencias } from '../../types/preferencias'
import type { RecetaListada } from '../../types/receta'
import { resumenSemana } from '../../utils/semana'

const NOMBRE: Record<string, string> = {
  fibra: 'la fibra',
  vitaminaC: 'la vitamina C',
  calcio: 'el calcio',
  folato: 'el folato',
  hierro: 'el hierro',
  b12: 'la B12',
  proteinas: 'la proteína',
}

const NOMBRE_TECHO: Record<string, string> = {
  sal: 'la sal',
  saturadas: 'la grasa saturada',
  azucares: 'el azúcar',
  calorias: 'las calorías',
}

const listar = (partes: string[]) =>
  partes.length <= 1 ? partes.join('') : `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`

/**
 * Lo que trae la semana, contado como comida y no como porcentajes. Nada en
 * rojo y nada de "te has pasado": lo que cubre, lo que se queda corto y lo que
 * he tenido que hacer para llenarla.
 */
export default function ResumenSemana({ recetas, preferencias, informe, onCerrar }: {
  recetas: RecetaListada[]
  preferencias: Preferencias
  informe: InformeSemana
  onCerrar: () => void
}) {
  const { coberturas, excesos } = resumenSemana(recetas, preferencias)

  const llegan = coberturas.filter((c) => c.ratio >= 0.9).map((c) => NOMBRE[c.clave])
  const cortos = coberturas
    .filter((c) => c.ratio < 0.7)
    .sort((a, b) => a.ratio - b.ratio)
    .slice(0, 2)

  const hechos = [
    informe.principales > 0 && `${informe.principales} ${informe.principales === 1 ? 'cena' : 'cenas'}`,
    informe.desayunos > 0 && `${informe.desayunos} ${informe.desayunos === 1 ? 'desayuno' : 'desayunos'}`,
  ].filter(Boolean) as string[]

  // Lo que se salva se cuenta con nombres y apellidos: "aprovecha 4 cosas" no
  // se puede comprobar, y "gasta la nata y las espinacas" sí.
  const aprovechados = informe.aprovechados.slice(0, 3)
  const deMas = informe.aprovechados.length - aprovechados.length

  const avisos = [
    informe.aprovechados.length > 0 &&
      `Gasta de la despensa ${listar(aprovechados)}${deMas > 0 ? ` y ${deMas} cosa${deMas === 1 ? '' : 's'} más` : ''}.`,
    informe.conservados > 0 &&
      `${informe.conservados} ${informe.conservados === 1 ? 'plato ya hecho se queda' : 'platos ya hechos se quedan'} donde estaban.`,
    informe.tiempoEnsanchado &&
      'No había platos para toda la semana con ese tiempo, así que he ensanchado los minutos.',
    informe.repetidos > 0 &&
      `${informe.repetidos} ${informe.repetidos === 1 ? 'día repite' : 'días repiten'} plato: no quedaban candidatas distintas. En casa eso son sobras.`,
    informe.huecosVacios > 0 &&
      `${informe.huecosVacios} ${informe.huecosVacios === 1 ? 'hueco se queda' : 'huecos se quedan'} sin llenar: con estos límites el catálogo no da más.`,
  ].filter(Boolean) as string[]

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="relative bg-orange-50/70 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/30 p-4 pr-10">
        <button
          onClick={onCerrar}
          aria-label="Cerrar el resumen"
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <p className="text-xs font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">
          {hechos.length > 0 ? listar(hechos) : 'Sin cambios'}
        </p>

        {recetas.length > 0 && (
          <p className="text-sm text-gray-700 dark:text-gray-200 mt-1.5">
            {llegan.length > 0 && <>Llegan {listar(llegan)}. </>}
            {cortos.length > 0 && (
              <>
                {listar(cortos.map((c) => NOMBRE[c.clave]))}
                {cortos.length === 1 ? ' se queda' : ' se quedan'} en el{' '}
                {cortos.map((c) => `${Math.round(c.ratio * 100)}%`).join(' y el ')}.
              </>
            )}
            {llegan.length === 0 && cortos.length === 0 && 'La semana va equilibrada.'}
          </p>
        )}

        {excesos.length > 0 && (
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">
            De media por plato, {listar(excesos.map((e) => NOMBRE_TECHO[e.clave]))}{' '}
            {excesos.length === 1 ? 'pasa' : 'pasan'} del techo que has puesto.
          </p>
        )}

        {avisos.length > 0 && (
          <ul className="mt-2.5 space-y-1">
            {avisos.map((aviso) => (
              <li key={aviso} className="text-[11px] text-gray-500 dark:text-gray-400">
                · {aviso}
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  )
}
