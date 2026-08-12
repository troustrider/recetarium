;(function () {
  var guardado = localStorage.getItem('dark-mode')
  var oscuro =
    guardado === null ? window.matchMedia('(prefers-color-scheme: dark)').matches : guardado === 'true'
  document.documentElement.classList.toggle('dark', oscuro)

  var link = document.querySelector('link[rel="manifest"]')
  if (link && oscuro) link.href = '/manifest-oscuro.webmanifest'
})()
