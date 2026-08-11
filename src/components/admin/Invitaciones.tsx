import { useEffect, useState } from 'react'
import { Trash2, Check, Clock } from 'lucide-react'
import { getInvitados, invitar, retirarInvitacion, type HogarDTO, type InvitadoDTO } from '../../api/invitados'

const fecha = (v: string) => new Date(v).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })

function Invitaciones() {
  const [invitados, setInvitados] = useState<InvitadoDTO[]>([])
  const [hogares, setHogares] = useState<HogarDTO[]>([])
  const [email, setEmail] = useState('')
  // '' es hogar propio; un uuid, meterle en ese hogar.
  const [destino, setDestino] = useState('')
  const [admin, setAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [recarga, setRecarga] = useState(0)

  useEffect(() => {
    let vigente = true
    getInvitados()
      .then((d) => {
        if (!vigente) return
        setInvitados(d.invitados)
        setHogares(d.hogares)
      })
      .catch((e: Error) => vigente && setError(e.message))
    return () => {
      vigente = false
    }
  }, [recarga])

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setOcupado(true)
    setError(null)
    try {
      await invitar({ email: email.trim(), hogarId: destino || null, rol: admin ? 'admin' : 'usuario' })
      setEmail('')
      setAdmin(false)
      setRecarga((n) => n + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se ha podido invitar')
    } finally {
      setOcupado(false)
    }
  }

  async function retirar(correo: string) {
    setError(null)
    try {
      await retirarInvitacion(correo)
      setRecarga((n) => n + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se ha podido retirar')
    }
  }

  return (
    <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm dark:shadow-none overflow-hidden">
      <h2 className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-800">
        Invitaciones
      </h2>

      <form onSubmit={enviar} className="p-4 space-y-3 border-b border-gray-100 dark:border-gray-800">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo@ejemplo.com"
          className="w-full px-3 py-2.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl border-0 outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-600"
        />

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            className="flex-1 min-w-40 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl border-0 outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-600"
          >
            <option value="">Hogar propio, vacío</option>
            {hogares.map((h) => (
              <option key={h.id} value={h.id}>
                {h.nombre} ({h.miembros})
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={admin}
              onChange={(e) => setAdmin(e.target.checked)}
              className="accent-orange-500"
            />
            Administrador
          </label>

          <button
            type="submit"
            disabled={ocupado}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60 transition-colors"
          >
            Invitar
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Elegir un hogar existente hace que esa persona comparta despensa, plan y lista con
          quien ya está dentro.
        </p>

        {error && (
          <p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/60 rounded-xl px-3 py-2">
            {error}
          </p>
        )}
      </form>

      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {invitados.length === 0 && (
          <li className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">Todavía no hay invitaciones.</li>
        )}
        {invitados.map((i) => (
          <li key={i.email} className="px-4 py-3 flex items-center gap-3">
            {i.haEntrado ? (
              <Check className="w-4 h-4 shrink-0 text-orange-500 dark:text-orange-400" />
            ) : (
              <Clock className="w-4 h-4 shrink-0 text-gray-400 dark:text-gray-500" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                {i.email}
                {i.rol === 'admin' && (
                  <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-orange-500 dark:text-orange-400">
                    admin
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {i.hogar ?? 'hogar propio'} · invitado el {fecha(i.invitadoEn)}
                {i.haEntrado ? ' · ya entró' : ' · pendiente'}
              </p>
            </div>
            {!i.haEntrado && (
              <button
                onClick={() => retirar(i.email)}
                aria-label={`Retirar la invitación de ${i.email}`}
                className="p-2 rounded-xl text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default Invitaciones
