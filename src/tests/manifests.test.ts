import { describe, it, expect } from 'vitest'
import crudoClaro from '../../public/manifest.webmanifest?raw'
import crudoOscuro from '../../public/manifest-oscuro.webmanifest?raw'

const claro = JSON.parse(crudoClaro)
const oscuro = JSON.parse(crudoOscuro)

describe('manifests', () => {
  it('solo se diferencian en background_color', () => {
    const { background_color: _c, ...restoClaro } = claro
    const { background_color: _o, ...restoOscuro } = oscuro
    expect(restoOscuro).toEqual(restoClaro)
  })

  it('cada uno lleva el fondo de su tema', () => {
    expect(claro.background_color).toBe('#fafaf9')
    expect(oscuro.background_color).toBe('#0e0e0e')
  })
})
