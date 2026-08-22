import { useState } from 'react'
import { X } from 'lucide-react'
import { usePreferencias } from '../../context'
import { MAX_COCINAS, type Dieta } from '../../types/preferencias'
import { NOMBRE_PRIORIDAD, PRESETS, presetDe, type Preset } from '../../utils/presets'
import Capa from '../shared/Capa'

const TIEMPOS: { valor: number | null; label: string }[] = [
  { valor: null, label: 'Sin tope' },
  { valor: 20, label: '20 min' },
  { valor: 30, label: '30 min' },
  { valor: 45, label: '45 min' },
]

const DIETAS: { valor: Dieta | null; label: string }[] = [
  { valor: null, label: 'Todo' },
  { valor: 'vegetariana', label: 'Vegetariana' },
  { valor: 'vegana', label: 'Vegana' },
]

function Chip({ activo, onClick, children, titulo }: {
  activo: boolean
  onClick: () => void
  children: React.ReactNode
  titulo?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={titulo}
      aria-pressed={activo}
      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
        activo
          ? 'bg-orange-500 text-white shadow-sm shadow-orange-400/30 dark:shadow-orange-900/40'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
    >
      {children}
    </button>
  )
}

/** Cuántos días de la semana llevan un hueco puesto, de 0 a 7. */
function Dias({ titulo, valor, onCambiar, vacio }: {
  titulo: string
  valor: number
  onCambiar: (n: number) => void
  vacio: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-[11px] font-semibold text-gray-600 dark:text-gray-300">
        {titulo}
      </span>
      <input
        type="range"
        min={0}
        max={7}
        value={valor}
        onChange={(e) => onCambiar(Number(e.target.value))}
        aria-label={`${titulo} a la semana`}
        className="flex-1 accent-orange-500"
      />
      <span className="text-xs font-bold text-gray-700 dark:text-gray-200 tabular-nums w-16 text-right">
        {valor === 0 ? vacio : `${valor} / 7`}
      </span>
    </div>
  )
}

function Seccion({ titulo, nota, children }: { titulo: string; nota?: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
        {titulo}
      </p>
      {nota && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{nota}</p>}
      <div className="mt-2.5">{children}</div>
    </div>
  )
}

interface Props {
  cocinas: string[]
  onCerrar: () => void
}

export default function PanelSemana({ cocinas, onCerrar }: Props) {
  const { preferencias, aplicar, alternarCocina, setHuecos, setLimites } = usePreferencias()
  const { prioridades, cocinasFavoritas, desayunos, comidas, cenas, limites } = preferencias
  const [vetado, setVetado] = useState('')

  const preset = presetDe(prioridades)

  const elegirPreset = (p: Preset) => aplicar({ ...preferencias, prioridades: p.prioridades })

  const añadirVetado = () => {
    const limpio = vetado.trim()
    if (!limpio || limites.vetados.includes(limpio)) return setVetado('')
    setLimites({ vetados: [...limites.vetados, limpio] })
    setVetado('')
  }

  return (
    <Capa onCerrar={onCerrar} clases="fixed inset-x-4 top-16 bottom-8 max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 overflow-y-auto">
        <div className="sticky top-0 flex items-start justify-between gap-3 px-4 py-3.5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500 dark:text-orange-400">
              Cómo comemos
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
              Manda en lo que propone Auto-semana. Se guarda para los dos.
            </p>
          </div>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <Seccion titulo="Qué buscamos esta semana" nota="Empuja lo que elijas; no descarta ningún plato.">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Chip key={p.id} activo={preset?.id === p.id} onClick={() => elegirPreset(p)} titulo={p.nota}>
                {p.nombre}
              </Chip>
            ))}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2.5">
            {preset
              ? preset.nota
              : `A mano: ${prioridades.map((p) => NOMBRE_PRIORIDAD[p]).join(', ')}`}
          </p>
        </Seccion>

        <Seccion
          titulo="Huecos del día"
          nota="Cuántos días de la semana lleva cada comida. Se reparten por la semana en vez de amontonarse."
        >
          <div className="flex flex-col gap-2.5">
            <Dias
              titulo="Desayunos"
              valor={desayunos}
              onCambiar={(n) => setHuecos('desayunos', n)}
              vacio="ninguno"
            />
            <Dias
              titulo="Comidas"
              valor={comidas}
              onCambiar={(n) => setHuecos('comidas', n)}
              vacio="ninguna"
            />
            <Dias
              titulo="Cenas"
              valor={cenas}
              onCambiar={(n) => setHuecos('cenas', n)}
              vacio="ninguna"
            />
          </div>
        </Seccion>

        <Seccion titulo="Cocinas favoritas" nota={`Hasta ${MAX_COCINAS}. Salen más, pero no son un filtro.`}>
          <div className="flex flex-wrap gap-2">
            {cocinas.map((cocina) => (
              <Chip
                key={cocina}
                activo={cocinasFavoritas.includes(cocina)}
                onClick={() => alternarCocina(cocina)}
              >
                {cocina}
              </Chip>
            ))}
          </div>
        </Seccion>

        <Seccion titulo="Tiempo entre semana">
          <div className="flex flex-wrap gap-2">
            {TIEMPOS.map((t) => (
              <Chip key={String(t.valor)} activo={limites.tiempoMax === t.valor} onClick={() => setLimites({ tiempoMax: t.valor })}>
                {t.label}
              </Chip>
            ))}
          </div>
        </Seccion>

        <Seccion titulo="Tiempo el fin de semana">
          <div className="flex flex-wrap gap-2">
            {TIEMPOS.map((t) => (
              <Chip key={String(t.valor)} activo={limites.tiempoMaxFinde === t.valor} onClick={() => setLimites({ tiempoMaxFinde: t.valor })}>
                {t.label}
              </Chip>
            ))}
          </div>
        </Seccion>

        <Seccion titulo="Qué no entra" nota="Esto sí descarta platos, y no se relaja nunca.">
          <div className="flex flex-wrap gap-2">
            {DIETAS.map((d) => (
              <Chip key={String(d.valor)} activo={limites.dieta === d.valor} onClick={() => setLimites({ dieta: d.valor })}>
                {d.label}
              </Chip>
            ))}
            <Chip activo={limites.sinGluten} onClick={() => setLimites({ sinGluten: !limites.sinGluten })}>
              Sin gluten
            </Chip>
          </div>

          {limites.dieta && (
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
              Una semana sin carne ni pescado empuja la proteína sola: entre dos platos que valgan,
              sale el que más trae.
            </p>
          )}

          <div className="mt-3">
            <input
              type="text"
              value={vetado}
              onChange={(e) => setVetado(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); añadirVetado() } }}
              onBlur={añadirVetado}
              placeholder="Ingrediente que esta semana no..."
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 dark:text-gray-100"
            />
            {limites.vetados.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {limites.vetados.map((v) => (
                  <button
                    key={v}
                    onClick={() => setLimites({ vetados: limites.vetados.filter((x) => x !== v) })}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400"
                  >
                    {v}
                    <X className="w-3 h-3" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </Seccion>

        <div className="px-4 py-3">
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            Esto ordena recetas, no receta nada. Si tienes una condición que
            cuidar, lo que diga tu médico va por delante.
          </p>
        </div>
    </Capa>
  )
}
