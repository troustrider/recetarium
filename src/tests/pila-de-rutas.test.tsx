import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import usePilaDeRutas from '../hooks/usePilaDeRutas'

function Sonda() {
  const { indice, previa } = usePilaDeRutas()
  const navigate = useNavigate()
  return (
    <div>
      <span data-testid="indice">{indice}</span>
      <span data-testid="previa">{previa?.pathname ?? 'nada'}</span>
      <button onClick={() => navigate('/despensa')}>despensa</button>
      <button onClick={() => navigate('/recetas/7')}>receta</button>
      <button onClick={() => navigate(-1)}>atrás</button>
    </div>
  )
}

describe('usePilaDeRutas', () => {
  it('debajo va la ruta anterior, también al volver atrás dos veces seguidas', async () => {
    const usuario = userEvent.setup()
    render(<BrowserRouter><Sonda /></BrowserRouter>)
    const debajo = () => screen.getByTestId('previa').textContent

    expect(debajo()).toBe('nada')

    await usuario.click(screen.getByText('despensa'))
    expect(debajo()).toBe('/')

    await usuario.click(screen.getByText('receta'))
    expect(debajo()).toBe('/despensa')

    // Aquí estaba el fallo: recordando solo «la última que hubo», debajo de la
    // despensa habría quedado la receta que se acaba de dejar.
    await usuario.click(screen.getByText('atrás'))
    await waitFor(() => expect(screen.getByTestId('indice').textContent).toBe('1'))
    expect(debajo()).toBe('/')
  })
})
