// Precarga el chunk de la ficha al primer indicio de intención (hover sobre una card),
// para que el morph card → ficha no se corte con el fallback de Suspense.
export function prefetchDetalleReceta() {
  import('../pages/DetalleReceta')
}
