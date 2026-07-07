import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Share, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'recetarium-install-dismissed'

function esStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as unknown as { standalone?: boolean }).standalone === true
}

function esIOS() {
  const ua = navigator.userAgent
  return /iphone|ipad|ipod/i.test(ua)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

// En iOS solo Safari puede instalar la PWA con notificaciones. Detecta si el
// navegador actual no es Safari (Chrome = CriOS, Firefox = FxiOS, Edge = EdgiOS)
// para mandar al usuario a Safari para el paso único de instalación.
function esIOSNoSafari() {
  return esIOS() && /crios|fxios|edgios|opt\//i.test(navigator.userAgent)
}

type Modo = 'android' | 'ios-safari' | 'ios-otro' | null

// Banner de instalación. Android/desktop Chrome disparan beforeinstallprompt y
// se instala con un toque. iOS no tiene esa API: se guía manualmente, y si no
// es Safari se avisa de que la instalación con avisos solo va desde Safari.
function InstallPrompt() {
  const [modo, setModo] = useState<Modo>(null)
  const [evento, setEvento] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) || esStandalone()) return

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setEvento(e as BeforeInstallPromptEvent)
      setModo('android')
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', () => setModo(null))

    if (esIOS()) setModo(esIOSNoSafari() ? 'ios-otro' : 'ios-safari')

    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  async function instalar() {
    if (!evento) return
    await evento.prompt()
    await evento.userChoice
    setModo(null)
  }

  function descartar() {
    localStorage.setItem(DISMISS_KEY, '1')
    setModo(null)
  }

  return (
    <AnimatePresence>
      {modo && (
        <motion.div
          className="fixed inset-x-0 bottom-16 sm:bottom-4 z-40 px-4 flex justify-center pointer-events-none"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <div className="pointer-events-auto flex items-start gap-3 max-w-md w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-lg px-4 py-3">
            <div className="w-9 h-9 shrink-0 bg-orange-500 rounded-xl flex items-center justify-center mt-0.5">
              {modo === 'android'
                ? <Download className="w-4 h-4 text-white" strokeWidth={2.2} />
                : <Share className="w-4 h-4 text-white" strokeWidth={2.2} />}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">Instala Recetarium</p>
              {modo === 'android' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug mt-0.5">Cronómetros con aviso en segundo plano.</p>
              )}
              {modo === 'ios-safari' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug mt-0.5">
                  Toca <Share className="inline w-3 h-3 -mt-0.5" /> Compartir y luego <span className="font-semibold text-gray-600 dark:text-gray-300">Añadir a pantalla de inicio</span>. Así los cronómetros avisan aunque salgas de la app.
                </p>
              )}
              {modo === 'ios-otro' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug mt-0.5">
                  En iPhone, los avisos en segundo plano solo van si la instalas desde <span className="font-semibold text-gray-600 dark:text-gray-300">Safari</span>: ábrela ahí, toca <Share className="inline w-3 h-3 -mt-0.5" /> Compartir → <span className="font-semibold text-gray-600 dark:text-gray-300">Añadir a pantalla de inicio</span>.
                </p>
              )}
            </div>

            {modo === 'android' && (
              <button
                onClick={instalar}
                className="shrink-0 px-3 py-1.5 text-sm font-bold text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-colors"
              >
                Instalar
              </button>
            )}
            <button onClick={descartar} className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" aria-label="Cerrar">
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default InstallPrompt
