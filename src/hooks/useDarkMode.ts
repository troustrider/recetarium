import { useEffect, useState } from 'react'

function useDarkMode() {
  // El script de index.html ya resolvió el tema y puso la clase antes del primer
  // pintado, así que aquí solo se lee. Duplicar la lógica arriesga que las dos
  // versiones se desincronicen.
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('dark-mode', String(dark))
  }, [dark])

  function toggle() {
    const root = document.documentElement
    root.classList.add('theme-anim')
    window.setTimeout(() => root.classList.remove('theme-anim'), 250)
    setDark((d) => !d)
  }

  return { dark, toggle }
}

export default useDarkMode
