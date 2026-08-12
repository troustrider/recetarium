import { useEffect, useState } from 'react'

function useDarkMode() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('dark-mode', String(dark))
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
    if (link) link.href = dark ? '/manifest-oscuro.webmanifest' : '/manifest.webmanifest'
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
