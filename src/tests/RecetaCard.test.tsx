import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import RecetaCard from '../components/recetas/RecetaCard'
import type { Receta } from '../types/receta'
import type { ReactNode } from 'react'

const conRuta = (ui: ReactNode) => render(<MemoryRouter>{ui}</MemoryRouter>)

const recetaBase: Receta = {
  id: '1',
  nombre: 'Tortilla de patatas',
  categoria: 'Española',
  sabor: 'salado',
  tiempoPreparacion: 30,
  favorita: false,
  ingredientes: [{ nombre: 'Huevo', cantidad: 4, unidad: 'ud', familia: 'lácteos' }],
  pasos: ['Batir los huevos'],
}

describe('RecetaCard', () => {
  it('muestra el nombre de la receta en el heading', () => {
    conRuta(<RecetaCard receta={recetaBase} onToggleFavorita={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Tortilla de patatas' })).toBeInTheDocument()
  })

  it('muestra el tiempo de preparación', () => {
    conRuta(<RecetaCard receta={recetaBase} onToggleFavorita={vi.fn()} />)
    expect(screen.getByText('30 min')).toBeInTheDocument()
  })

  it('el nombre es un enlace a la receta, para poder abrirla en otra pestaña', () => {
    conRuta(<RecetaCard receta={recetaBase} onToggleFavorita={vi.fn()} />)
    expect(screen.getByRole('link', { name: 'Tortilla de patatas' })).toHaveAttribute(
      'href',
      '/recetas/1'
    )
  })

  it('llama a onToggleFavorita sin navegar', async () => {
    const onToggleFavorita = vi.fn()
    conRuta(<RecetaCard receta={recetaBase} onToggleFavorita={onToggleFavorita} />)
    await userEvent.click(screen.getByRole('button', { name: /añadir a favoritas/i }))
    expect(onToggleFavorita).toHaveBeenCalledWith('1')
  })

  it('muestra el botón con label de quitar cuando favorita es true', () => {
    conRuta(<RecetaCard receta={{ ...recetaBase, favorita: true }} onToggleFavorita={vi.fn()} />)
    expect(screen.getByRole('button', { name: /quitar de favoritas/i })).toBeInTheDocument()
  })

  it('muestra la categoría si existe', () => {
    conRuta(<RecetaCard receta={recetaBase} onToggleFavorita={vi.fn()} />)
    expect(screen.getByText('Española')).toBeInTheDocument()
  })
})
