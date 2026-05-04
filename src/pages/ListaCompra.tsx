import { useListaCompraContext } from '../context'
import ResumenIngrediente from '../components/lista-compra/ResumenIngrediente'

function ListaCompra() {
  const { seleccionadas, listaCompra, vaciar } = useListaCompraContext()

  if (seleccionadas.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-2xl font-bold text-gray-900">Lista de compra</h1>
        <div className="text-center py-16">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-5 text-gray-200" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <line x1="9" y1="12" x2="15" y2="12" />
            <line x1="9" y1="16" x2="13" y2="16" />
          </svg>
          <h2 className="font-display text-lg font-bold text-gray-700 mb-1">La lista está vacía</h2>
          <p className="text-sm text-gray-400 max-w-xs mx-auto">Selecciona recetas desde el catálogo pulsando "+ Lista" para generar la lista de ingredientes.</p>
        </div>
      </div>
    )
  }

  const familias = [...new Set(listaCompra.map((i) => i.familia))]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-gray-900">Lista de compra</h1>
        <button
          onClick={vaciar}
          className="px-3 py-1.5 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Vaciar
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {seleccionadas.map((r) => (
          <span key={r.id} className="px-2.5 py-0.5 text-xs font-medium bg-teal-50 text-teal-700 rounded-full">
            {r.nombre}
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-6">
        {familias.map((familia) => (
          <section key={familia}>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 capitalize">
              {familia}
            </h2>
            <ul className="border border-gray-100 rounded-xl px-3">
              {listaCompra
                .filter((i) => i.familia === familia)
                .map((ing, i) => (
                  <ResumenIngrediente key={i} ingrediente={ing} />
                ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

export default ListaCompra
