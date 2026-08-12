import type { IngredienteAgrupado } from '../hooks/useListaCompra'
import { formatCantidad } from './ingredientes'

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function textoLista(items: IngredienteAgrupado[]): string {
  const lineas = ['🛒 Lista de compra', '']
  const familias = [...new Set(items.map((i) => i.familia))]
  for (const familia of familias) {
    lineas.push(familia.toUpperCase())
    for (const i of items.filter((x) => x.familia === familia)) {
      lineas.push(`- ${capitalize(i.nombre)}: ${formatCantidad(i.cantidad, i.unidad)}`)
      if (i.desglose && i.desglose.length > 1) {
        const partes = i.desglose.map((d) => `${d.receta} ${formatCantidad(d.cantidad, i.unidad)}`)
        lineas.push(`  · congelar en: ${partes.join(' · ')}`)
      }
    }
    lineas.push('')
  }
  return lineas.join('\n').trim()
}

export async function compartirLista(items: IngredienteAgrupado[]): Promise<void> {
  const texto = textoLista(items)
  if (navigator.share) {
    try { await navigator.share({ text: texto }) } catch { /* cancelado */ }
  } else {
    await navigator.clipboard.writeText(texto)
    alert('Lista copiada al portapapeles')
  }
}
