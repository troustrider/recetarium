// Recoge lo que falla al arrancar para poder leerlo desde el propio móvil. Sin
// esto, un fallo que solo ocurre en la PWA de iOS no hay forma de verlo: no hay
// consola a la que asomarse.
const notas: string[] = []

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
