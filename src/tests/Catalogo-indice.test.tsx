import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Receta } from '../types/receta'

const LETRAS = 'ABCDEFGHIJKL'.split('')
const POR_LETRA = 10
const POR_TANDA = 24

function catalogo(): Receta[] {
  return LETRAS.flatMap((letra) =>
    Array.from({ length: POR_LETRA }, (_, i) => ({
      id: `${letra}${i}`,
      nombre: `${letra}rroz ${String(i).padStart(2, '0')}`,
      categoria: 'Principal',
      sabor: 'salado' as const,
      tiempoPreparacion: 20,
      favorita: false,
      pasos: [],
      ingredientes: [{ nombre: 'arroz', cantidad: 100, unidad: 'g', familia: 'cereales' }],
    }))
  )
}

const RECETAS = catalogo()

const contexto = vi.hoisted(() => ({
  recetas: [] as Receta[],
}))

vi.mock('../context', () => ({
  useRecetasContext: () => ({
    recetas: contexto.recetas,
    loading: false,
    error: null,
    cargar: vi.fn(),
    toggleFavorita: vi.fn(),
  }),
  useListaCompraContext: () => ({
    toggleReceta: vi.fn(),
    estaSeleccionada: () => false,
    cargarAleatorias: vi.fn(),
  }),
  useDespensa: () => ({ despensa: [] }),
}))

// El abanico mide su ancho con ResizeObserver y aquí no aporta nada.
vi.mock('../components/recetas/AbanicoRecetas', () => ({
  default: () => <div data-testid="abanico" />,
}))

const Catalogo = (await import('../pages/Catalogo')).default

// jsdom no calcula posiciones, así que le damos una maqueta: cada sección
// arranca 1000 px más abajo que la anterior. Es lo que lee irALetra para
// decidir dónde saltar.
const ALTURAS = new Map(LETRAS.map((l, i) => [`seccion-${l}`, i * 1000]))

let scrollTo: ReturnType<typeof vi.fn>
let rectOriginal: typeof Element.prototype.getBoundingClientRect
let offsetOriginal: PropertyDescriptor | undefined

beforeEach(() => {
  contexto.recetas = RECETAS
  scrollTo = vi.fn()
  window.scrollTo = scrollTo as unknown as typeof window.scrollTo

  offsetOriginal = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetTop')
  Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
    configurable: true,
    get(this: HTMLElement) {
      return ALTURAS.get(this.id) ?? 0
    },
  })

  // Sin esto el centinela del scroll infinito se cree visible y monta todo el
  // catálogo de golpe, que es justo lo que estas pruebas quieren medir.
  rectOriginal = Element.prototype.getBoundingClientRect
  Element.prototype.getBoundingClientRect = function () {
    return { top: 9000, bottom: 9100, left: 0, right: 300, width: 300, height: 100, x: 0, y: 9000, toJSON: () => ({}) } as DOMRect
  }
})

afterEach(() => {
  Element.prototype.getBoundingClientRect = rectOriginal
  if (offsetOriginal) Object.defineProperty(HTMLElement.prototype, 'offsetTop', offsetOriginal)
})

function montar() {
  const { container } = render(
    <MemoryRouter>
      <Catalogo />
    </MemoryRouter>
  )
  return container
}

const tarjetas = (c: HTMLElement) => c.querySelectorAll('article')
const secciones = (c: HTMLElement) => [...c.querySelectorAll('section[id^="seccion-"]')]
const carril = () => screen.getByLabelText('Índice alfabético')

const pulsarLetra = async (letra: string) => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: letra }))
  })
}

describe('Catálogo — índice alfabético', () => {
  it('agrupa cada letra en su propia sección, con sus recetas dentro', () => {
    const c = montar()
    const grupos = secciones(c)
    expect(grupos.length).toBeGreaterThan(1)

    for (const seccion of grupos) {
      const letra = seccion.id.replace('seccion-', '')
      // La cabecera es el primer hijo: de ahí saca irALetra dónde se pega.
      expect((seccion.firstElementChild as HTMLElement).dataset.letra).toBe(letra)
      const nombres = [...seccion.querySelectorAll('h3')].map((h) => h.textContent ?? '')
      expect(nombres.length).toBeGreaterThan(0)
      expect(nombres.every((n) => n.startsWith(letra))).toBe(true)
    }
  })

  it('el índice lista las letras del catálogo en orden', () => {
    montar()
    const letras = [...carril().querySelectorAll('button')].map((b) => b.textContent)
    expect(letras).toEqual(LETRAS)
  })

  it('carga solo la primera tanda hasta que se pide otra letra', () => {
    const c = montar()
    expect(tarjetas(c)).toHaveLength(POR_TANDA)
    expect(c.querySelector('#seccion-A')).not.toBeNull()
    expect(c.querySelector('#seccion-H')).toBeNull()
  })

  it('al saltar a una letra monta esa sección y una tanda de más por debajo', async () => {
    const c = montar()
    await pulsarLetra('D') // primera receta de la D: índice 30

    expect(c.querySelector('#seccion-D')).not.toBeNull()
    // Sin la tanda extra el documento no da de sí y el salto se queda corto.
    const minimo = Math.ceil((30 + 1) / POR_TANDA) * POR_TANDA + POR_TANDA
    expect(tarjetas(c)).toHaveLength(minimo)
  })

  it('salta a la altura de la sección, no a la de su cabecera pegajosa', async () => {
    montar()
    await pulsarLetra('F')
    expect(scrollTo).toHaveBeenCalledWith(0, ALTURAS.get('seccion-F'))
  })

  it('deja volver a una letra ya pasada', async () => {
    montar()
    await pulsarLetra('G')
    scrollTo.mockClear()
    await pulsarLetra('B')
    expect(scrollTo).toHaveBeenCalledWith(0, ALTURAS.get('seccion-B'))
  })

  it('no saca índice cuando hay pocas recetas', () => {
    contexto.recetas = RECETAS.slice(0, 12)
    montar()
    expect(screen.queryByLabelText('Índice alfabético')).toBeNull()
  })

  it('no saca índice cuando no se ordena por nombre', async () => {
    montar()
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Ordenar'), { target: { value: 'tiempo' } })
    })
    expect(screen.queryByLabelText('Índice alfabético')).toBeNull()
  })
})
