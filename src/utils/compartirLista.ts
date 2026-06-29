import type { IngredienteAgrupado } from '../hooks/useListaCompra'

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function textoLista(items: IngredienteAgrupado[]): string {
  const lineas = ['🛒 Lista de compra', '']
  const familias = [...new Set(items.map((i) => i.familia))]
  for (const familia of familias) {
    lineas.push(familia.toUpperCase())
    for (const i of items.filter((x) => x.familia === familia)) {
      lineas.push(`- ${capitalize(i.nombre)}: ${i.cantidad} ${i.unidad}`)
    }
    lineas.push('')
  }
  return lineas.join('\n').trim()
}

// Comparte la lista por el menú nativo (WhatsApp, etc. en móvil) o, si no
// está disponible (escritorio), la copia al portapapeles.
export async function compartirLista(items: IngredienteAgrupado[]): Promise<void> {
  const texto = textoLista(items)
  if (navigator.share) {
    try { await navigator.share({ text: texto }) } catch { /* cancelado */ }
  } else {
    await navigator.clipboard.writeText(texto)
    alert('Lista copiada al portapapeles')
  }
}
