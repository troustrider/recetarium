import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom'
import useScrollDeRuta from '../hooks/useScrollDeRuta'

let posicion = 0

function rodarHasta(y: number) {
  act(() => {
    posicion = y
    window.dispatchEvent(new Event('scroll'))
  })
}

function Pantalla({ nombre }: { nombre: string }) {
  const navigate = useNavigate()
  return (
    <div>
      <p>{nombre}</p>
      <button onClick={() => navigate('/receta')}>ir</button>
      <button onClick={() => navigate(-1)}>atrás</button>
    </div>
  )
}

function App() {
  useScrollDeRuta()
  return (
    <Routes>
      <Route path="/" element={<Pantalla nombre="catálogo" />} />
      <Route path="/receta" element={<Pantalla nombre="receta" />} />
    </Routes>
  )
}

beforeEach(() => {
  posicion = 0
  vi.stubGlobal('scrollTo', (_x: number, y: number) => {
    posicion = y
  })
  Object.defineProperty(window, 'scrollY', { get: () => posicion, configurable: true })
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  )
})

describe('useScrollDeRuta', () => {
  it('sube arriba al abrir una pantalla nueva', () => {
    rodarHasta(500)
    act(() => {
      screen.getByText('ir').click()
    })
    expect(screen.getByText('receta')).toBeInTheDocument()
    expect(posicion).toBe(0)
  })

  it('devuelve la posición al volver atrás', () => {
    rodarHasta(500)
    act(() => {
      screen.getByText('ir').click()
    })
    rodarHasta(120)
    act(() => {
      screen.getByText('atrás').click()
    })
    expect(screen.getByText('catálogo')).toBeInTheDocument()
    expect(posicion).toBe(500)
  })
})
