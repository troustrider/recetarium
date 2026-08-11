// Recoge lo que falla al arrancar para poder leerlo desde el propio móvil. Sin
// esto, un fallo que solo ocurre en la PWA de iOS no hay forma de verlo: no hay
// consola a la que asomarse.
// Se sube a mano en cada despliegue de depuración. Sirve para saber si el móvil
// está ejecutando el código nuevo o una copia del service worker.
const VERSION = 'diag-3'

const notas: string[] = [`build ${VERSION}`]

export function apuntar(nota: string): void {
  if (notas.length < 12) notas.push(nota)
}

export function notasDiagnostico(): string[] {
  return notas
}

// Una violación de CSP no da error de red ni excepción legible: el navegador
// corta la petición y punto. Este es el único sitio donde se ve.
if (typeof document !== 'undefined') {
  document.addEventListener('securitypolicyviolation', (e) => {
    apuntar(`CSP bloqueó ${e.violatedDirective}: ${e.blockedURI || '(en línea)'}`)
  })
}
