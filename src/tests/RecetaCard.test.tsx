import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import RecetaCard from '../components/recetas/RecetaCard'
import type { Receta } from '../types/receta'

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
    render(<RecetaCard receta={recetaBase} onClick={vi.fn()} onToggleFavorita={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Tortilla de patatas' })).toBeInTheDocument()
  })

  it('muestra el tiempo de preparación', () => {
    render(<RecetaCard receta={recetaBase} onClick={vi.fn()} onToggleFavorita={vi.fn()} />)
    expect(screen.getByText('30 min')).toBeInTheDocument()
  })

  it('llama a onClick al pulsar la tarjeta', async () => {
    const onClick = vi.fn()
    render(<RecetaCard receta={recetaBase} onClick={onClick} onToggleFavorita={vi.fn()} />)
    await userEvent.click(screen.getByRole('article'))
    expect(onClick).toHaveBeenCalledWith('1')
  })

  it('llama a onToggleFavorita sin propagar el click al artículo', async () => {
    const onClick = vi.fn()
    const onToggleFavorita = vi.fn()
    render(<RecetaCard receta={recetaBase} onClick={onClick} onToggleFavorita={onToggleFavorita} />)
    await userEvent.click(screen.getByRole('button', { name: /añadir a favoritas/i }))
    expect(onToggleFavorita).toHaveBeenCalledWith('1')
    expect(onClick).not.toHaveBeenCalled()
  })

  it('muestra el botón con label de quitar cuando favorita es true', () => {
    render(
      <RecetaCard
        receta={{ ...recetaBase, favorita: true }}
        onClick={vi.fn()}
        onToggleFavorita={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /quitar de favoritas/i })).toBeInTheDocument()
  })

  it('muestra la categoría si existe', () => {
    render(<RecetaCard receta={recetaBase} onClick={vi.fn()} onToggleFavorita={vi.fn()} />)
    expect(screen.getByText('Española')).toBeInTheDocument()
  })
})
