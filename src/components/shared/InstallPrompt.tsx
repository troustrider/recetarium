import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'recetarium-install-dismissed'

// Banner de instalación. Solo aparece cuando el navegador ofrece instalar
// (Android/desktop Chrome disparan beforeinstallprompt). En iOS no hay API:
// la instalación es manual desde Compartir → Añadir a pantalla de inicio.
function InstallPrompt() {
  const [evento, setEvento] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setEvento(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', () => setEvento(null))
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  async function instalar() {
    if (!evento) return
    await evento.prompt()
    await evento.userChoice
    setEvento(null)
  }

  function descartar() {
    localStorage.setItem(DISMISS_KEY, '1')
    setEvento(null)
  }

  return (
    <AnimatePresence>
      {evento && (
        <motion.div
          className="fixed inset-x-0 bottom-16 sm:bottom-4 z-40 px-4 flex justify-center pointer-events-none"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <div className="pointer-events-auto flex items-center gap-3 max-w-md w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-lg px-4 py-3">
            <div className="w-9 h-9 shrink-0 bg-orange-500 rounded-xl flex items-center justify-center">
              <Download className="w-4 h-4 text-white" strokeWidth={2.2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">Instala Recetarium</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">Cronómetros con aviso en segundo plano.</p>
            </div>
            <button
              onClick={instalar}
              className="shrink-0 px-3 py-1.5 text-sm font-bold text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-colors"
            >
              Instalar
            </button>
            <button onClick={descartar} className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" aria-label="Ahora no">
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default InstallPrompt
