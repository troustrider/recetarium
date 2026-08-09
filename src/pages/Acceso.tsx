import { useSession, signIn, signOut } from '../auth'

// Página de diagnóstico temporal (fase 2 de docs/PLAN-multiusuario-auth.md).
// No bloquea nada: sirve para comprobar que el ciclo de sesión sobrevive en la
// PWA instalada en iOS, donde la cookie es cross-site. Se borra cuando la
// puerta y la landing definitivas estén en su sitio.
function Acceso() {
  const { data, isPending, error } = useSession()
  const usuario = data?.user

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-gray-100">
        Diagnóstico de sesión
      </h1>

      <dl className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-4 text-sm space-y-2">
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500 dark:text-gray-400">Estado</dt>
          <dd className="font-medium text-gray-900 dark:text-gray-100">
            {isPending ? 'comprobando' : usuario ? 'con sesión' : 'sin sesión'}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500 dark:text-gray-400">Usuario</dt>
          <dd className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {usuario?.email ?? '—'}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-gray-500 dark:text-gray-400">Modo</dt>
          <dd className="font-medium text-gray-900 dark:text-gray-100">
            {window.matchMedia('(display-mode: standalone)').matches ? 'PWA instalada' : 'navegador'}
          </dd>
        </div>
        {error && (
          <div className="text-red-600 dark:text-red-400 pt-2">{String(error.message ?? error)}</div>
        )}
      </dl>

      {usuario ? (
        <button
          onClick={() => signOut()}
          className="w-full py-2.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          Cerrar sesión
        </button>
      ) : (
        <button
          onClick={() => signIn.social({ provider: 'google', callbackURL: '/acceso' })}
          disabled={isPending}
          className="w-full py-2.5 rounded-xl text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          Entrar con Google
        </button>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400">
        La prueba que importa: entrar, cerrar la app del todo y volver a abrirla desde la
        pantalla de inicio. Si el estado sigue en «con sesión», la cookie sobrevive.
      </p>
    </div>
  )
}

export default Acceso
