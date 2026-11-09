import { fireEvent, render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PREFERENCIAS_POR_DEFECTO, type Preferencias } from '../types/preferencias'
import { PRESETS } from '../utils/presets'

const prefs = vi.hoisted(() => ({
  actual: null as unknown as Preferencias,
  setLimites: vi.fn(),
}))

vi.mock('../context', () => ({
  usePreferencias: () => ({
    preferencias: prefs.actual,
    aplicar: vi.fn(),
    alternarCocina: vi.fn(),
    setHuecos: vi.fn(),
    setRacionesPorPlato: vi.fn(),
    setLimites: prefs.setLimites,
  }),
}))

const { default: PanelSemana } = await import('../components/planificador/PanelSemana')

beforeEach(() => {
  vi.clearAllMocks()
  prefs.actual = PREFERENCIAS_POR_DEFECTO
})

describe('presets que dan preferencia', () => {
  it('ninguna nota promete: todas dan preferencia', () => {
    for (const p of PRESETS) expect(p.nota, p.id).toMatch(/^Da preferencia/)
  })

  it('el panel dice que manda lo que hay en casa y lo que se compra', () => {
    render(<PanelSemana cocinas={[]} onCerrar={vi.fn()} onRehacer={vi.fn()} />)
    expect(screen.getByText(/primero se aprovecha lo que hay en casa y lo que se compra/i)).toBeInTheDocument()
  })
})

describe('rehacer la semana desde el panel', () => {
  it('cierra el panel y lanza la auto-semana', () => {
    const onCerrar = vi.fn()
    const onRehacer = vi.fn()
    render(<PanelSemana cocinas={[]} onCerrar={onCerrar} onRehacer={onRehacer} />)

    fireEvent.click(screen.getByRole('button', { name: 'Rehacer la semana con esto' }))
    expect(onCerrar).toHaveBeenCalledTimes(1)
    expect(onRehacer).toHaveBeenCalledTimes(1)
  })
})
