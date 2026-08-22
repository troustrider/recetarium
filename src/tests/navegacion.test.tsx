import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { useState } from 'react'
import useTitulo from '../hooks/useTitulo'
import useCapa from '../hooks/useCapa'

const navegar = vi.fn()
vi.mock('react-router-dom', async () => {
  const real = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...real, useNavigate: () => navegar }
})

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
