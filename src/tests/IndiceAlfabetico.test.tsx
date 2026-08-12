import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import IndiceAlfabetico from '../components/recetas/IndiceAlfabetico'

const LETRAS = ['A', 'B', 'C', 'D', 'E']

// jsdom no hace layout: el carril mide 0 y el cálculo por posición no daría
// nada. Se le da una geometría de 500 px, 100 por letra.
function montar() {
  const onSeleccionar = vi.fn()
  const { container } = render(
    <IndiceAlfabetico letras={LETRAS} activa={null} onSeleccionar={onSeleccionar} />
  )
  const carril = container.querySelector('[aria-label="Índice alfabético"]') as HTMLElement
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

  it('recorre las letras al arrastrar el dedo por el carril', () => {
    const { carril, onSeleccionar } = montar()

    fireEvent.pointerDown(carril, { clientY: 150 }) // primer quinto → A
    fireEvent.pointerMove(carril, { clientY: 350 }) // tercer quinto → C
    fireEvent.pointerMove(carril, { clientY: 550 }) // último quinto → E
    fireEvent.pointerUp(carril, { clientY: 550 })

    expect(onSeleccionar.mock.calls.map(([l]) => l)).toEqual(['A', 'C', 'E'])
  })

  it('no repite la misma letra mientras el dedo sigue dentro de su franja', () => {
    const { carril, onSeleccionar } = montar()

    fireEvent.pointerDown(carril, { clientY: 210 })
    fireEvent.pointerMove(carril, { clientY: 240 })
    fireEvent.pointerMove(carril, { clientY: 290 })

    expect(onSeleccionar).toHaveBeenCalledTimes(1)
    expect(onSeleccionar).toHaveBeenCalledWith('B')
  })

  it('ignora el movimiento si no se ha empezado a arrastrar', () => {
    const { carril, onSeleccionar } = montar()
    fireEvent.pointerMove(carril, { clientY: 350 })
    expect(onSeleccionar).not.toHaveBeenCalled()
  })
})
