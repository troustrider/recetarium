import { useEffect, useState } from 'react'

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('dark-mode')
    if (stored !== null) return stored === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

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
