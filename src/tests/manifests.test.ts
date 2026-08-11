import { describe, it, expect } from 'vitest'
import crudoClaro from '../../public/manifest.webmanifest?raw'
import crudoOscuro from '../../public/manifest-oscuro.webmanifest?raw'

// Hay dos manifests solo para que la pantalla de arranque de la PWA no salga
// blanca en tema oscuro (ver tema.js). Duplicar un fichero invita a que se
// desincronicen: si a uno le cambian el nombre, el scope o los iconos y al otro
// no, el navegador lo trata como otra app.
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
