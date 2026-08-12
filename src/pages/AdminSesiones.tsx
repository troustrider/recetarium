import { useEffect, useState } from 'react'
import { ShieldAlert, Smartphone, Monitor, Tablet } from 'lucide-react'
import { getPanelSesiones, type PanelSesiones } from '../api/sesiones'
import Invitaciones from '../components/admin/Invitaciones'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import ErrorMessage from '../components/shared/ErrorMessage'

function dispositivo(agente: string | null) {
  if (!agente) return { texto: 'desconocido', Icono: Monitor }
  const so = /iPhone/i.test(agente) ? 'iPhone'
    : /iPad/i.test(agente) ? 'iPad'
    : /Android/i.test(agente) ? 'Android'
    : /Macintosh/i.test(agente) ? 'Mac'
    : /Windows/i.test(agente) ? 'Windows'
    : /Linux/i.test(agente) ? 'Linux'
    : 'otro'
  const nav = /Edg(iOS)?\//.test(agente) ? 'Edge'
    : /CriOS\/|Chrome\//.test(agente) ? 'Chrome'
    : /FxiOS\/|Firefox\//.test(agente) ? 'Firefox'
    : /Safari\//.test(agente) ? 'Safari'
    : '?'
  const Icono = so === 'iPad' ? Tablet : so === 'iPhone' || so === 'Android' ? Smartphone : Monitor
  return { texto: `${so} · ${nav}`, Icono }
}

const fecha = (v: string) =>
  new Date(v).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

function Tarjeta({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm dark:shadow-none overflow-hidden">
      <h2 className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-800">
        {titulo}
      </h2>
      {children}
    </section>
  )
}

function AdminSesiones() {
  const [datos, setDatos] = useState<PanelSesiones | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)

  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    getPanelSesiones()
      .then((d) => vigente && setDatos(d))
      .catch((e: Error) => vigente && setError(e.message))
      .finally(() => vigente && setCargando(false))
    return () => {
      vigente = false
    }
  }, [intento])

  function cargar() {
    setCargando(true)
    setError(null)
    setIntento((n) => n + 1)
  }

  if (cargando) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={cargar} />
  if (!datos) return null

  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-gray-100">Accesos</h1>

      <Invitaciones />

      {datos.ipsNuevas.length > 0 && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-900/20 p-4">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-semibold text-sm">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            {datos.ipsNuevas.length === 1
              ? 'Una IP nueva en los últimos'
              : `${datos.ipsNuevas.length} IPs nuevas en los últimos`}{' '}
            {datos.dias} días
          </div>
          <ul className="mt-2 space-y-1 text-sm text-amber-900 dark:text-amber-100">
            {datos.ipsNuevas.map((n) => (
              <li key={`${n.email}-${n.ip}`} className="flex flex-wrap gap-x-2">
                <span className="font-medium tabular-nums">{n.ip}</span>
                <span className="opacity-75">{n.email}</span>
                <span className="opacity-60">desde {fecha(n.vistaPrimeroEn)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Tarjeta titulo="Por usuario">
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {datos.resumen.map((r) => (
            <li key={r.email} className="px-4 py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{r.email}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">último acceso {fecha(r.ultimoAcceso)}</p>
              </div>
              <div className="flex gap-4 text-right shrink-0 tabular-nums">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{r.ips}</p>
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">IPs</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{r.dispositivos}</p>
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">aparatos</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-orange-500 dark:text-orange-400">{r.activas}</p>
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">activas</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Tarjeta>

      <Tarjeta titulo={`Últimas ${datos.sesiones.length} sesiones`}>
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {datos.sesiones.map((s) => {
            const { texto, Icono } = dispositivo(s.agente)
            return (
              <li key={s.id} className="px-4 py-3 flex items-center gap-3">
                <Icono className="w-4 h-4 shrink-0 text-gray-400 dark:text-gray-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{s.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    <span className="tabular-nums">{s.ip ?? 'sin IP'}</span> · {texto}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{fecha(s.creadaEn)}</p>
                  {s.activa && (
                    <span className="text-[10px] font-semibold text-orange-500 dark:text-orange-400 uppercase tracking-wide">
                      activa
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </Tarjeta>
    </div>
  )
}

export default AdminSesiones
