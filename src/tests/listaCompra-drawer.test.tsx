import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import ListaCompraDrawer from '../components/lista-compra/ListaCompraDrawer'
import type { Cuenta } from '../utils/desperdicio'

const cuenta: Cuenta = {
  pagado: 24.1, comido: 17.3, tirado: 3.1, sinEnvase: [],
  lineas: [
    { nombre: 'cilantro', necesita: 20, envase: 60, envases: 1, pagado: 0.85, tirado: 0.6, dias: 4 },
    { nombre: 'arroz', necesita: 300, envase: 1000, envases: 1, pagado: 2, tirado: 0, dias: null },
  ],
}

const item = (nombre: string, recetas: string[]) => ({
  nombre, cantidad: 20, unidad: 'g', familia: 'verduras', recetas, clave: nombre,
})

vi.mock('../context', () => ({
  useListaCompraContext: () => ({
    seleccionadas: [], listaCompra: [item('cilantro', ['Pad krapow gai'])], enDespensa: [],
    compra: { total: 21, sinPrecio: [] }, cuenta,
    toggleReceta: vi.fn(), setRaciones: vi.fn(), vaciar: vi.fn(), addExtra: vi.fn(),
    removeExtra: vi.fn(), descartar: vi.fn(), instantanea: vi.fn(), restaurarLista: vi.fn(),
  }),
  useCompradosContext: () => ({ comprados: new Set(), toggle: vi.fn(), limpiar: vi.fn(), restaurarComprados: vi.fn() }),
  useDespensa: () => ({ despensa: [], reponer: vi.fn(), restaurarDespensa: vi.fn() }),
  usePendientesPlan: () => ({ pendientes: [], marcarPendientes: vi.fn(), restaurarPendientes: vi.fn() }),
  useDeshacer: () => ({ registrar: vi.fn() }),
  useRecetasContext: () => ({ recetas: [] }),
}))

describe('la cuenta en el cajón de la compra', () => {
  it('dice lo que se paga, lo que se estropea y de quién es', () => {
    render(<MemoryRouter><ListaCompraDrawer open onClose={vi.fn()} /></MemoryRouter>)
    const linea = screen.getByText(/En envases enteros pagas/).textContent ?? ''
    expect(linea).toContain('24.10 €')
    expect(linea).toContain('3.10 €')
    expect(linea).toContain('cilantro')
    expect(linea).toContain('Pad krapow gai')
  })
})
