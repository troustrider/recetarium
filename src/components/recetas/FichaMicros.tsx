import { Droplets, Wheat, WheatOff } from 'lucide-react'
import type { Receta } from '../../types/receta'
import { senalHierro } from '../../utils/nutricion'

const COLOR_NIVEL = {
  alto: 'text-emerald-600 dark:text-emerald-400',
  medio: 'text-amber-600 dark:text-amber-400',
  bajo: 'text-gray-400 dark:text-gray-500',
} as const

function Tarjeta({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-4 py-3.5">
      {children}
    </div>
  )
}

export default function FichaMicros({ receta }: { receta: Receta }) {
  const senal = senalHierro(receta)
  const micros = receta.micros
  if (!senal || !micros) return null
  const gluten = micros.gluten

  return (
    <div className="space-y-2">
      <Tarjeta>
        <div className="flex items-baseline gap-2">
          <Droplets className={`w-4 h-4 self-center ${COLOR_NIVEL[senal.nivel]}`} strokeWidth={2.2} />
          <p className={`font-display text-lg font-bold tabular-nums leading-none ${COLOR_NIVEL[senal.nivel]}`}>
            {String(senal.hierro).replace('.', ',')} mg
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            hierro
          </p>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1.5">{senal.texto}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-gray-500 dark:text-gray-400 tabular-nums">
          <span>Vit. C {micros.vitaminaC} mg</span>
          <span>Calcio {micros.calcio} mg</span>
          <span>B12 {String(micros.b12).replace('.', ',')} µg</span>
          <span>Folato {micros.folato} µg</span>
        </div>
      </Tarjeta>

      <Tarjeta>
        {gluten ? (
          <>
            <div className="flex items-center gap-2">
              <Wheat className="w-4 h-4 text-amber-600 dark:text-amber-400" strokeWidth={2.2} />
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                Lleva gluten
                {gluten.evitable && (
                  <span className="font-medium text-gray-500 dark:text-gray-400"> · evitable</span>
                )}
              </p>
            </div>
            <ul className="mt-2 space-y-1">
              {gluten.fuentes.map((f) => (
                <li key={f.nombre} className="text-xs text-gray-600 dark:text-gray-300">
                  <span className="font-semibold">{f.nombre}</span>
                  {f.certeza === 'depende' && (
                    <span className="text-gray-400 dark:text-gray-500"> (según marca)</span>
                  )}
                  {f.sustituto && <span className="text-gray-500 dark:text-gray-400"> → {f.sustituto}</span>}
                </li>
              ))}
            </ul>
          </>
        ) : receta.sinGluten === true ? (
          <div className="flex items-center gap-2">
            <WheatOff className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2.2} />
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Sin gluten</p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Wheat className="w-4 h-4 text-gray-400 dark:text-gray-500" strokeWidth={2.2} />
            <p className="text-sm text-gray-500 dark:text-gray-400">Gluten sin analizar</p>
          </div>
        )}
      </Tarjeta>

      <p className="text-[10px] text-gray-400 dark:text-gray-500 px-1">
        Estimado desde los ingredientes{micros.estimadoDe === 'parcial' && ', con alguna cantidad sin convertir'}.
        La sal no cuenta la que añadas al cocinar. Sirve para comparar recetas, no como valor clínico.
      </p>
    </div>
  )
}
