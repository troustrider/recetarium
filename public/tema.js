;(function () {
  var guardado = localStorage.getItem('dark-mode')
  var oscuro =
    guardado === null ? window.matchMedia('(prefers-color-scheme: dark)').matches : guardado === 'true'
  document.documentElement.classList.toggle('dark', oscuro)
})()
