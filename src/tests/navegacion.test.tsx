import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useState } from 'react'
import useTitulo from '../hooks/useTitulo'
import useCapa from '../hooks/useCapa'
import useDeslizarAtras from '../hooks/useDeslizarAtras'

const navegar = vi.fn()
vi.mock('react-router-dom', async () => {
  const real = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...real, useNavigate: () => navegar }
})

function toque(tipo: string, x: number, y: number, destino?: Element) {
  const evento = new Event(tipo, { bubbles: true }) as Event & { touches: unknown[] }
  evento.touches = [{ clientX: x, clientY: y }]
  if (destino) Object.defineProperty(evento, 'target', { value: destino })
  act(() => {
    window.dispatchEvent(evento)
  })
}

beforeEach(() => {
  navegar.mockClear()
  document.title = 'Recetarium'
})

afterEach(() => {
  document.documentElement.style.overflow = ''
})

describe('useTitulo', () => {
  function Pagina({ titulo }: { titulo?: string | null }) {
    useTitulo(titulo)
    return null
  }

  it('pone el nombre de la página delante de la marca', () => {
    render(<Pagina titulo="Despensa" />)
    expect(document.title).toBe('Despensa · Recetarium')
  })

  it('deja solo la marca cuando la página no tiene nombre todavía', () => {
    render(<Pagina titulo={null} />)
    expect(document.title).toBe('Recetarium')
  })
})

describe('useCapa', () => {
  function Capa({ conAtras }: { conAtras?: boolean }) {
    const [abierta, setAbierta] = useState(true)
    useCapa(abierta, () => setAbierta(false), conAtras)
    return <p>{abierta ? 'abierta' : 'cerrada'}</p>
  }

  it('la cierra con Escape', () => {
    render(<Capa />)
    expect(screen.getByText('abierta')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByText('cerrada')).toBeInTheDocument()
  })

  it('otra tecla no la cierra', () => {
    render(<Capa />)
    fireEvent.keyDown(window, { key: 'a' })
    expect(screen.getByText('abierta')).toBeInTheDocument()
  })

  it('sin conAtras no toca el historial', () => {
    const meter = vi.spyOn(window.history, 'pushState')
    render(<Capa />)
    expect(meter).not.toHaveBeenCalled()
    meter.mockRestore()
  })

  it('con conAtras mete una entrada y retroceder la cierra', () => {
    const meter = vi.spyOn(window.history, 'pushState')
    render(<Capa conAtras />)
    expect(meter).toHaveBeenCalledTimes(1)
    expect(meter.mock.calls[0][0]).toMatchObject({ capa: true })

    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    expect(screen.getByText('cerrada')).toBeInTheDocument()
    meter.mockRestore()
  })
})

describe('useDeslizarAtras', () => {
  function Pantalla() {
    useDeslizarAtras()
    return null
  }

  it('vuelve atrás al deslizar desde el canto izquierdo', () => {
    window.history.pushState({ idx: 2 }, '')
    render(<MemoryRouter><Pantalla /></MemoryRouter>)
    toque('touchstart', 10, 300)
    toque('touchmove', 120, 310)
    expect(navegar).toHaveBeenCalledWith(-1)
  })

  it('lejos del canto también vale, pero pide más recorrido', () => {
    window.history.pushState({ idx: 2 }, '')
    render(<MemoryRouter><Pantalla /></MemoryRouter>)
    // En iOS el canto se lo queda el navegador, así que el gesto libre es el
    // único que llega a la página.
    toque('touchstart', 200, 300)
    toque('touchmove', 280, 310)
    expect(navegar).not.toHaveBeenCalled()
    toque('touchmove', 330, 310)
    expect(navegar).toHaveBeenCalledWith(-1)
  })

  it('no se dispara sobre algo que se arrastra o se desplaza en horizontal', () => {
    window.history.pushState({ idx: 2 }, '')
    const { container } = render(<MemoryRouter><Pantalla /></MemoryRouter>)
    const carrusel = document.createElement('div')
    carrusel.style.touchAction = 'none'
    container.appendChild(carrusel)
    toque('touchstart', 10, 300, carrusel)
    toque('touchmove', 200, 305, carrusel)
    expect(navegar).not.toHaveBeenCalled()
  })

  it('un gesto en diagonal es scroll, no vuelta atrás', () => {
    render(<MemoryRouter><Pantalla /></MemoryRouter>)
    toque('touchstart', 10, 300)
    toque('touchmove', 120, 400)
    expect(navegar).not.toHaveBeenCalled()
  })

  it('con el modo cocina abierto se calla', () => {
    document.documentElement.style.overflow = 'hidden'
    render(<MemoryRouter><Pantalla /></MemoryRouter>)
    toque('touchstart', 10, 300)
    toque('touchmove', 120, 305)
    expect(navegar).not.toHaveBeenCalled()
  })

  it('sin nada detrás lleva al catálogo en vez de salir de la app', () => {
    window.history.replaceState({ idx: 0 }, '')
    render(<MemoryRouter><Pantalla /></MemoryRouter>)
    toque('touchstart', 10, 300)
    toque('touchmove', 120, 305)
    expect(navegar).toHaveBeenCalledWith('/')
  })
})
