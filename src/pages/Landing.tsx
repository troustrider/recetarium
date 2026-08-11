import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useDarkMode from '../hooks/useDarkMode'
import Marca from '../components/shared/Marca'
import { signIn, marcarIntentoDeEntrada } from '../auth'
import { useSesion } from '../context/SesionContext'
import MosaicoLanding from '../components/shared/MosaicoLanding'
import MuestraTarjeta from '../components/shared/MuestraTarjeta'
import { MUESTRA } from '../data/muestraLanding'

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06L5.404 4.343a.75.75 0 00-1.06 1.06l1.06 1.061z" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M7.455 2.004a.75.75 0 01.26.77 7 7 0 009.958 7.967.75.75 0 011.067.853A8.5 8.5 0 116.647 1.921a.75.75 0 01.808.083z" clipRule="evenodd" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z" />
      <path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.14 6.16-4.14z" />
    </svg>
  )
}

// Un desplegable de un solo elemento es peor que un botón directo, así que las
// opciones solo se despliegan cuando hay más de una. Hoy solo hay Google.
const METODOS = [{ id: 'google' as const, etiqueta: 'Continuar con Google', Icono: GoogleIcon }]

function Landing() {
  const { dark, toggle } = useDarkMode()
  const { fallo, bloqueada, reintentar } = useSesion()
  const [abierto, setAbierto] = useState(false)
  const [entrando, setEntrando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function entrar(proveedor: 'google') {
    setEntrando(true)
    setError(null)
    try {
      // Conserva el destino: un enlace a una receta abierto sin sesión aterriza
      // en esa receta después de entrar, no en el catálogo.
      const destino = window.location.pathname + window.location.search
      marcarIntentoDeEntrada()
      await signIn.social({ provider: proveedor, callbackURL: destino === '/' ? '/' : destino })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se ha podido iniciar sesión')
      setEntrando(false)
    }
  }

  const unico = METODOS.length === 1

  return (
    <div className="relative min-h-dvh overflow-hidden bg-stone-50 dark:bg-gray-950 flex flex-col items-center justify-center px-4 py-10 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <MosaicoLanding />

      {/* Muestra del producto a los lados, desde lg. */}
      <MuestraTarjeta
        receta={MUESTRA[0]}
        className="hidden lg:block absolute left-[8%] xl:left-[14%] top-1/2 -translate-y-[70%] -rotate-6"
      />
      <MuestraTarjeta
        receta={MUESTRA[2]}
        className="hidden lg:block absolute right-[8%] xl:right-[14%] top-1/2 -translate-y-[30%] rotate-6"
      />

      {/* Y en móvil, que es la vía de entrada principal, un abanico asomando por
          abajo. Sin esto la muestra del producto solo existía en escritorio.
          Va cortado por el borde inferior a propósito: sugiere que hay más sin
          añadir nada que tocar a una pantalla cuyo único trabajo es que pulses
          entrar, y sin el deslizamiento horizontal, que en iOS se pelea con el
          gesto de volver atrás. El recorte lo hace el overflow-hidden del
          contenedor, así que no genera scroll. */}
      <div
        aria-hidden
        className="lg:hidden absolute -bottom-16 left-1/2 -translate-x-1/2 flex items-end"
      >
        <MuestraTarjeta receta={MUESTRA[0]} prioritaria className="-rotate-[9deg] origin-bottom" />
        <MuestraTarjeta receta={MUESTRA[2]} prioritaria className="-ml-24 z-10" />
        <MuestraTarjeta receta={MUESTRA[4]} prioritaria className="-ml-24 rotate-[9deg] origin-bottom" />
      </div>

      <button
        onClick={toggle}
        // 44px de zona de toque, no 32: aquí es un control solo y con sitio, y
        // el móvil es la vía de entrada principal. El icono no cambia de tamaño.
        className="fixed z-20 top-4 right-4 w-11 h-11 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
        style={{ top: 'calc(env(safe-area-inset-top) + 1rem)' }}
      >
        {dark ? <SunIcon /> : <MoonIcon />}
      </button>

      <div className="relative z-10 w-full max-w-md">
        {/* Resplandor cálido detrás de la marca. Decorativo, y por debajo de
            todo el texto para no tocar el contraste. */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-16 w-72 h-72 rounded-full blur-3xl opacity-40 dark:opacity-25 bg-orange-300 dark:bg-orange-500"
        />

        <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm dark:shadow-none p-8 text-center">
          <div className="flex justify-center">
            <Marca tamano={56} />
          </div>

          {/* La etiqueta va pegada al wordmark y no en una esquina flotante:
              así se lee como parte del nombre, que es lo que es ahora mismo, y
              no como un aviso que compita con el botón de entrar. Reutiliza el
              tratamiento de las demás etiquetas de la app (versalitas
              espaciadas en naranja), así que no introduce estilo nuevo. */}
          <div className="mt-5 flex items-baseline justify-center gap-2">
            <h1 className="font-display font-bold text-3xl tracking-tight text-gray-900 dark:text-gray-50">
              Recetarium
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400 bg-orange-100/70 dark:bg-orange-500/15 rounded-md px-1.5 py-0.5">
              beta
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-balance">
            Vuestro recetario, la despensa y la compra de la semana, en el mismo sitio.
          </p>

          <div className="mt-7">
            {unico || abierto ? (
              <AnimatePresence>
                <motion.div
                  initial={abierto ? { opacity: 0, y: -8, scale: 0.97 } : false}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-2"
                >
                  {METODOS.map(({ id, etiqueta, Icono }) => (
                    <motion.button
                      key={id}
                      onClick={() => entrar(id)}
                      disabled={entrando}
                      whileTap={{ scale: 0.97 }}
                      className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-semibold bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-white disabled:opacity-60 transition-colors"
                    >
                      <Icono />
                      {entrando ? 'Abriendo…' : etiqueta}
                    </motion.button>
                  ))}
                </motion.div>
              </AnimatePresence>
            ) : (
              <motion.button
                onClick={() => setAbierto(true)}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3 rounded-xl text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-colors"
              >
                Entrar
              </motion.button>
            )}
          </div>

          {error && (
            <p className="mt-4 text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/60 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          {bloqueada && (
            <div className="mt-4 text-left text-sm text-amber-900 dark:text-amber-100 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/60 rounded-xl px-3 py-2.5 space-y-2">
              <p className="font-semibold">Entraste en Google, pero el navegador no guardó la sesión.</p>
              <p className="opacity-90">
                Suele ser el bloqueo de seguimiento entre sitios de Safari. En el iPhone:
                Ajustes › Apps › Safari › desactiva <strong>Impedir seguimiento entre sitios</strong>,
                y vuelve a intentarlo.
              </p>
              <button onClick={reintentar} className="font-semibold underline underline-offset-2">
                Ya está, reintentar
              </button>
            </div>
          )}

          {fallo && (
            <div className="mt-4 text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/60 rounded-xl px-3 py-2">
              No se ha podido comprobar la sesión.{' '}
              <button onClick={reintentar} className="font-semibold underline underline-offset-2">
                Reintentar
              </button>
            </div>
          )}

          <p className="mt-6 text-xs text-gray-400 dark:text-gray-500 text-balance">
            El acceso es por invitación. Si tu correo no tiene acceso todavía, pídeselo a Karim.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Landing
