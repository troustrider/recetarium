import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import IndiceAlfabetico from '../components/recetas/IndiceAlfabetico'

const LETRAS = ['A', 'B', 'C', 'D', 'E']

// El carril atiende un salto por fotograma, así que hay que dejar pasar uno.
const fotograma = () =>
  act(async () => {
    await new Promise((r) => requestAnimationFrame(() => r(null)))
  })

function montar() {
  const onSeleccionar = vi.fn()
  const { container } = render(
    <IndiceAlfabetico letras={LETRAS} onSeleccionar={onSeleccionar} />
  )
  const carril = container.querySelector('[aria-label="Índice alfabético"]') as HTMLElement
  // jsdom no hace layout: sin esto el carril mide 0. Son 500 px, 100 por letra.
  carril.getBoundingClientRect = () =>
    ({ top: 100, bottom: 600, height: 500, left: 0, right: 28, width: 28, x: 0, y: 100 }) as DOMRect
  return { carril, onSeleccionar }
}

describe('IndiceAlfabetico', () => {
  it('salta a la letra que se toca', () => {
    const { onSeleccionar } = montar()
    fireEvent.click(screen.getByText('D'))
    expect(onSeleccionar).toHaveBeenCalledWith('D')
  })

  it('recorre las letras al arrastrar el dedo por el carril', async () => {
    const { carril, onSeleccionar } = montar()

    fireEvent.pointerDown(carril, { clientY: 150 }) // primer quinto → A
    await fotograma()
    fireEvent.pointerMove(carril, { clientY: 350 }) // tercer quinto → C
    await fotograma()
    fireEvent.pointerMove(carril, { clientY: 550 }) // último quinto → E
    await fotograma()
    fireEvent.pointerUp(carril, { clientY: 550 })

    expect(onSeleccionar.mock.calls.map(([l]) => l)).toEqual(['A', 'C', 'E'])
  })

  it('no repite la misma letra mientras el dedo sigue dentro de su franja', async () => {
    const { carril, onSeleccionar } = montar()

    fireEvent.pointerDown(carril, { clientY: 210 })
    await fotograma()
    fireEvent.pointerMove(carril, { clientY: 240 })
    await fotograma()
    fireEvent.pointerMove(carril, { clientY: 290 })
    await fotograma()

    expect(onSeleccionar).toHaveBeenCalledTimes(1)
    expect(onSeleccionar).toHaveBeenCalledWith('B')
  })

  it('ignora el movimiento si no se ha empezado a arrastrar', async () => {
    const { carril, onSeleccionar } = montar()
    fireEvent.pointerMove(carril, { clientY: 350 })
    await fotograma()
    expect(onSeleccionar).not.toHaveBeenCalled()
  })

  it('solo salta a la última letra si el dedo cruza varias en el mismo fotograma', async () => {
    const { carril, onSeleccionar } = montar()

    fireEvent.pointerDown(carril, { clientY: 150 })
    fireEvent.pointerMove(carril, { clientY: 250 })
    fireEvent.pointerMove(carril, { clientY: 350 })
    fireEvent.pointerMove(carril, { clientY: 450 })
    await fotograma()

    expect(onSeleccionar.mock.calls.map(([l]) => l)).toEqual(['D'])
  })

  it('se come el clic que el navegador sintetiza tras el toque', async () => {
    const { carril, onSeleccionar } = montar()

    // Toque sobre la franja de la A. Como el salto mueve la página, el clic
    // que Chrome dispara después cae sobre otra letra: no debe saltar otra vez.
    fireEvent.pointerDown(carril, { clientY: 150 })
    await fotograma()
    fireEvent.pointerUp(carril, { clientY: 150 })
    fireEvent.click(screen.getByText('E'))

    expect(onSeleccionar.mock.calls.map(([l]) => l)).toEqual(['A'])
  })

  it('marca la letra de la sección que se está viendo', async () => {
    const cabecera = document.createElement('div')
    cabecera.dataset.letra = 'C'
    cabecera.getBoundingClientRect = () => ({ top: 20 }) as DOMRect
    document.body.appendChild(cabecera)

    const { onSeleccionar } = montar()
    await fotograma()
    fireEvent.scroll(window)
    await fotograma()

    expect(screen.getByText('C').className).toContain('text-orange-600')
    expect(screen.getByText('A').className).not.toContain('text-orange-600')
    expect(onSeleccionar).not.toHaveBeenCalled()

    cabecera.remove()
  })
})
