;(function () {
  var guardado = localStorage.getItem('dark-mode')
  var oscuro =
    guardado === null ? window.matchMedia('(prefers-color-scheme: dark)').matches : guardado === 'true'
  document.documentElement.classList.toggle('dark', oscuro)

  // El manifest no admite variantes por tema, y su background_color es lo que
  // pinta la pantalla de arranque de la PWA instalada. Con uno solo, quien
  // instala en oscuro se come un fogonazo blanco cada vez que abre. Así que hay
  // dos manifests idénticos salvo ese color y aquí se apunta al que toca: el
  // navegador se queda con el que esté puesto en el momento de instalar.
  var link = document.querySelector('link[rel="manifest"]')
  if (link && oscuro) link.href = '/manifest-oscuro.webmanifest'
})()
