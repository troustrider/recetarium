import type { ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const api = vi.hoisted(() => ({
  getDespensa: vi.fn().mockResolvedValue([]),
  saveDespensa: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../api/estado', () => api)

// El formulario sugiere ingredientes del recetario; aquí solo estorba.
vi.mock('../hooks/useIngredientesConocidos', () => ({ default: () => [] }))

const { DespensaProvider, useDespensa } = await import('../context/DespensaContext')
const { default: AnadirIngrediente } = await import('../components/despensa/AnadirIngrediente')
const { default: FichaIngrediente } = await import('../components/despensa/FichaIngrediente')
const { sumarDias } = await import('../utils/caducidadEstimada')

const envoltorio = ({ children }: { children: ReactNode }) => <DespensaProvider>{children}</DespensaProvider>

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  api.getDespensa.mockResolvedValue([])
})

/** Espía la despensa del contexto desde dentro del provider. */
function Espia({ alVer }: { alVer: (d: ReturnType<typeof useDespensa>['despensa']) => void }) {
  alVer(useDespensa().despensa)
  return null
}

describe('añadir a la despensa marcándolo como abierto', () => {
  it('la casilla está en el formulario y da de alta con la fecha recortada', async () => {
    const usuario = userEvent.setup()
    let despensa: ReturnType<typeof useDespensa>['despensa'] = []

    render(
      <>
        <AnadirIngrediente abierto onClose={vi.fn()} />
        <Espia alVer={(d) => { despensa = d }} />
      </>,
      { wrapper: envoltorio }
    )
    await waitFor(() => expect(api.getDespensa).toHaveBeenCalled())

    await usuario.type(screen.getByPlaceholderText('Ingrediente...'), 'nata')
    await usuario.selectOptions(screen.getByLabelText('Familia'), 'lácteos')

    const abierto = screen.getByLabelText('Marcar que el paquete ya está abierto')
    expect(abierto).toBeInTheDocument()
    await usuario.click(abierto)

    expect(screen.getByText(/Abierto aguanta unos 3 días/)).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: /Añadir a la despensa/ }))

    await waitFor(() => expect(despensa).toHaveLength(1))
    expect(despensa[0]).toMatchObject({
      nombre: 'nata',
      abierto: sumarDias(0),
      caducidad: sumarDias(3),
    })
  })

  it('sin marcarla, entra con la caducidad del envase sin abrir', async () => {
    const usuario = userEvent.setup()
    let despensa: ReturnType<typeof useDespensa>['despensa'] = []

    render(
      <>
        <AnadirIngrediente abierto onClose={vi.fn()} />
        <Espia alVer={(d) => { despensa = d }} />
      </>,
      { wrapper: envoltorio }
    )
    await waitFor(() => expect(api.getDespensa).toHaveBeenCalled())

    await usuario.type(screen.getByPlaceholderText('Ingrediente...'), 'nata')
    await usuario.selectOptions(screen.getByLabelText('Familia'), 'lácteos')
    await usuario.click(screen.getByRole('button', { name: /Añadir a la despensa/ }))

    await waitFor(() => expect(despensa).toHaveLength(1))
    expect(despensa[0].abierto).toBeUndefined()
    expect(despensa[0].caducidad).toBe(sumarDias(7))
  })

  it('propone caducidad también para la despensa seca', async () => {
    const usuario = userEvent.setup()
    render(<AnadirIngrediente abierto onClose={vi.fn()} />, { wrapper: envoltorio })
    await waitFor(() => expect(api.getDespensa).toHaveBeenCalled())

    await usuario.type(screen.getByPlaceholderText('Ingrediente...'), 'arroz')
    await usuario.selectOptions(screen.getByLabelText('Familia'), 'cereales')

    expect(screen.getByText(/Caducidad estimada \(730 días\)/)).toBeInTheDocument()
    expect(screen.getByLabelText('Fecha de caducidad (opcional)')).toHaveValue(sumarDias(730))
  })
})

describe('la ficha del ingrediente deja abrirlo', () => {
  const item = { nombre: 'nata', familia: 'lácteos', estado: 'lleno' as const, caducidad: '2026-12-30' }

  it('enseña el control y avisa de lo que aguanta abierto', async () => {
    const usuario = userEvent.setup()
    const onEditar = vi.fn()

    render(
      <FichaIngrediente
        item={item}
        enLista={false}
        onEditar={onEditar}
        onALista={vi.fn()}
        onQuitar={vi.fn()}
        onClose={vi.fn()}
      />,
      { wrapper: envoltorio }
    )

    expect(screen.getByText('Paquete abierto')).toBeInTheDocument()
    await usuario.click(screen.getByLabelText('Marcar el paquete como abierto'))
    expect(onEditar).toHaveBeenCalledWith({ abierto: sumarDias(0) })
  })

  it('desmarcarlo deshace la apertura', async () => {
    const usuario = userEvent.setup()
    const onEditar = vi.fn()

    render(
      <FichaIngrediente
        item={{ ...item, abierto: '2026-08-10' }}
        enLista={false}
        onEditar={onEditar}
        onALista={vi.fn()}
        onQuitar={vi.fn()}
        onClose={vi.fn()}
      />,
      { wrapper: envoltorio }
    )

    await usuario.click(screen.getByLabelText('Marcar el paquete como abierto'))
    expect(onEditar).toHaveBeenCalledWith({ abierto: null })
  })
})
