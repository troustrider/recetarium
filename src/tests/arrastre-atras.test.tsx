import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import useArrastreAtras from '../hooks/useArrastreAtras'

const navegar = vi.fn()
vi.mock('react-router-dom', async () => {
  const real = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...real, useNavigate: () => navegar, useLocation: () => ({ key: 'una' }) }
})

function Pantalla({ hayAnterior = true }: { hayAnterior?: boolean }) {
  const { arrastrando, contenedor } = useArrastreAtras(hayAnterior)
  return (
    <div ref={contenedor} data-testid="pantalla">
      <span>{arrastrando ? 'arrastrando' : 'quieta'}</span>
      <div data-testid="chip" style={{ touchAction: 'none' }} />
    </div>
  )
}

const dedo = (x: number, y = 300) => ({ touches: [{ clientX: x, clientY: y }] })

beforeEach(() => {
  navegar.mockClear()
  document.documentElement.style.overflow = ''
  Object.defineProperty(window, 'innerWidth', { value: 400, configurable: true })
})

describe('useArrastreAtras', () => {
  it('la pantalla sigue al dedo en cuanto el gesto es claramente horizontal', () => {
    render(<Pantalla />)
    const pantalla = screen.getByTestId('pantalla')
    fireEvent.touchStart(pantalla, dedo(120))
    expect(screen.getByText('quieta')).toBeInTheDocument()
    fireEvent.touchMove(pantalla, dedo(150))
    expect(screen.getByText('arrastrando')).toBeInTheDocument()
  })

  it('pasado el umbral, soltar completa la vuelta atrás', async () => {
    render(<Pantalla />)
    const pantalla = screen.getByTestId('pantalla')
    fireEvent.touchStart(pantalla, dedo(40))
    fireEvent.touchMove(pantalla, dedo(120))
    fireEvent.touchMove(pantalla, dedo(300))
    await act(async () => {
      fireEvent.touchEnd(pantalla)
    })
    await waitFor(() => expect(navegar).toHaveBeenCalledWith(-1))
  })

  it('un arrastre corto y lento vuelve a su sitio sin navegar', async () => {
    render(<Pantalla />)
    const pantalla = screen.getByTestId('pantalla')
    fireEvent.touchStart(pantalla, dedo(40))
    fireEvent.touchMove(pantalla, dedo(70))
    await new Promise((r) => setTimeout(r, 60))
    await act(async () => {
      fireEvent.touchEnd(pantalla)
    })
    expect(navegar).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.getByText('quieta')).toBeInTheDocument())
  })

  it('irse en vertical es scroll: el gesto se descarta', () => {
    render(<Pantalla />)
    const pantalla = screen.getByTestId('pantalla')
    fireEvent.touchStart(pantalla, dedo(40, 300))
    fireEvent.touchMove(pantalla, dedo(120, 360))
    expect(screen.getByText('quieta')).toBeInTheDocument()
  })

  it('sobre algo que ya se arrastra no se dispara', () => {
    render(<Pantalla />)
    const chip = screen.getByTestId('chip')
    fireEvent.touchStart(chip, dedo(40))
    fireEvent.touchMove(chip, dedo(200))
    expect(screen.getByText('quieta')).toBeInTheDocument()
  })

  it('con el modo cocina abierto el gesto no existe', () => {
    document.documentElement.style.overflow = 'hidden'
    render(<Pantalla />)
    const pantalla = screen.getByTestId('pantalla')
    fireEvent.touchStart(pantalla, dedo(40))
    fireEvent.touchMove(pantalla, dedo(300))
    expect(screen.getByText('quieta')).toBeInTheDocument()
    expect(navegar).not.toHaveBeenCalled()
  })

  it('un impulso corto y rápido también completa la vuelta', async () => {
    render(<Pantalla />)
    const pantalla = screen.getByTestId('pantalla')
    fireEvent.touchStart(pantalla, dedo(40))
    fireEvent.touchMove(pantalla, dedo(60))
    await new Promise((r) => setTimeout(r, 20))
    fireEvent.touchMove(pantalla, dedo(140))
    await act(async () => {
      fireEvent.touchEnd(pantalla)
    })
    await waitFor(() => expect(navegar).toHaveBeenCalledWith(-1))
  })

  it('sin nada detrás no hay gesto', () => {
    render(<Pantalla hayAnterior={false} />)
    const pantalla = screen.getByTestId('pantalla')
    fireEvent.touchStart(pantalla, dedo(40))
    fireEvent.touchMove(pantalla, dedo(300))
    expect(screen.getByText('quieta')).toBeInTheDocument()
    expect(navegar).not.toHaveBeenCalled()
  })
})
