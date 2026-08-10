import { useSesion } from '../context/SesionContext'
import { tokenGuardado } from '../auth'

// Página de diagnóstico temporal (fase 2 de docs/PLAN-multiusuario-auth.md).
// Con la puerta puesta ya no hace falta para entrar, pero sigue siendo la forma
// de ver desde el propio móvil qué está pasando con la sesión. Se borra cuando
// el arranque en frío esté verificado en iOS.
function Acceso() {
  const { estado, usuario, salir } = useSesion()

  const filas = [
    ['Estado', estado],
    ['Usuario', usuario?.email ?? '—'],
    ['Rol', usuario?.rol ?? '—'],
    ['Token guardado', tokenGuardado() ? 'sí' : 'no'],
    ['Modo', window.matchMedia('(display-mode: standalone)').matches ? 'PWA instalada' : 'navegador'],
  ] as const

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-gray-100">
        Diagnóstico de sesión
      </h1>

      <dl className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-4 text-sm space-y-2">
        {filas.map(([etiqueta, valor]) => (
          <div key={etiqueta} className="flex justify-between gap-4">
            <dt className="text-gray-500 dark:text-gray-400">{etiqueta}</dt>
            <dd className="font-medium text-gray-900 dark:text-gray-100 truncate">{valor}</dd>
          </div>
        ))}
      </dl>

      <button
        onClick={salir}
        className="w-full py-2.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        Cerrar sesión
      </button>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        La prueba que importa: cerrar la app del todo y volver a abrirla desde la pantalla
        de inicio. Si entra directa al catálogo, el arranque en frío funciona.
      </p>
    </div>
  )
}

export default Acceso
