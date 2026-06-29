import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useListaCompraContext, useCompradosContext, useDespensa } from '../context'
import type { IngredienteAgrupado } from '../hooks/useListaCompra'
import ResumenIngrediente from '../components/lista-compra/ResumenIngrediente'
import AnadirManual from '../components/lista-compra/AnadirManual'
import { compartirLista } from '../utils/compartirLista'

function claveDe(ing: IngredienteAgrupado) {
  return `${ing.nombre}__${ing.unidad}`
}

function ListaCompra() {
  const { seleccionadas, listaCompra, coste, vaciar, addExtra, removeExtra } = useListaCompraContext()
  const { comprados, toggle, limpiar } = useCompradosContext()
  const { despensa } = useDespensa()
  const [ocultarDespensa, setOcultarDespensa] = useState(false)
  const navigate = useNavigate()

  if (listaCompra.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100">Lista de compra</h1>
        <div className="text-center py-12">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-orange-100 rounded-3xl rotate-6" />
            <div className="absolute inset-0 bg-orange-50 rounded-3xl -rotate-3 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="text-orange-300" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <line x1="9" y1="12" x2="15" y2="12" />
                <line x1="9" y1="16" x2="13" y2="16" />
              </svg>
            </div>
          </div>
          <h2 className="font-display text-lg font-bold text-gray-700 dark:text-gray-300 mb-1">La lista está vacía</h2>
          <p className="text-sm text-gray-400 max-w-xs mx-auto mb-6">
            Selecciona recetas desde el catálogo, o añade ítems a mano aquí abajo.
          </p>
          <motion.button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 text-sm font-bold bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
            whileTap={{ scale: 0.97 }}
          >
            Ir al catálogo
          </motion.button>
        </div>
        <AnadirManual onAdd={addExtra} />
      </div>
    )
  }

  const enDespensa = (nombre: string) =>
    despensa.some((d) => d.nombre === nombre.trim().toLowerCase() && d.estado === 'lleno')

  const visibles = ocultarDespensa ? listaCompra.filter((i) => !enDespensa(i.nombre)) : listaCompra
  const ocultos = listaCompra.length - visibles.length

  const familias = [...new Set(visibles.map((i) => i.familia))]
  const totalComprados = visibles.filter((i) => comprados.has(claveDe(i))).length

  function compartir() {
    const pendientes = visibles.filter((i) => !comprados.has(claveDe(i)))
    return compartirLista(pendientes.length > 0 ? pendientes : visibles)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100">Lista de compra</h1>
          <p className="text-xs text-gray-400 mt-1">
            {totalComprados}/{visibles.length} comprados
            {coste > 0 && <> · <span className="font-bold text-gray-600 dark:text-gray-300">≈ {coste.toFixed(2)} €</span></>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={compartir}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M13 4.5a2.5 2.5 0 1 1 .702 1.737L6.97 9.604a2.518 2.518 0 0 1 0 .792l6.733 3.367a2.5 2.5 0 1 1-.671 1.341l-6.733-3.367a2.5 2.5 0 1 1 0-3.475l6.733-3.366A2.52 2.52 0 0 1 13 4.5Z" />
            </svg>
            Compartir
          </motion.button>
          <motion.button
            onClick={() => { vaciar(); limpiar() }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
            </svg>
            Vaciar
          </motion.button>
        </div>
      </div>

      {seleccionadas.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {seleccionadas.map(({ receta, raciones }) => (
            <span key={receta.id} className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-orange-50 text-orange-600 rounded-lg">
              {receta.nombre}
              {raciones > 1 && (
                <span className="bg-orange-200 text-orange-700 rounded-full px-1.5 py-0.5 text-[10px] leading-none">
                  ×{raciones}
                </span>
              )}
            </span>
          ))}
        </div>
      )}

      {despensa.length > 0 && (
        <button
          onClick={() => setOcultarDespensa((v) => !v)}
          className={`self-start flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            ocultarDespensa ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${ocultarDespensa ? 'bg-white border-white' : 'border-gray-400'}`}>
            {ocultarDespensa && (
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5 text-orange-500">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
            )}
          </span>
          Ocultar lo que ya tengo
          {ocultarDespensa && ocultos > 0 && <span className="opacity-80">({ocultos})</span>}
        </button>
      )}

      <div className="flex flex-col gap-5">
        {familias.map((familia) => (
          <section key={familia} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.15em]">
                {familia}
              </h2>
            </div>
            <ul className="px-5">
              {visibles
                .filter((i) => i.familia === familia)
                .sort((a, b) => Number(comprados.has(claveDe(a))) - Number(comprados.has(claveDe(b))))
                .map((ing) => {
                  const clave = claveDe(ing)
                  return (
                    <ResumenIngrediente
                      key={clave}
                      ingrediente={ing}
                      checked={comprados.has(clave)}
                      onToggle={() => toggle(clave)}
                      onRemove={ing.esExtra ? () => removeExtra(clave) : undefined}
                    />
                  )
                })}
            </ul>
          </section>
        ))}
      </div>

      <AnadirManual onAdd={addExtra} />
    </div>
  )
}

export default ListaCompra
