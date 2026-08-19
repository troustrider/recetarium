import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const CLAVE = 'recetarium:sesion'
const recargar = vi.fn()
const reemplazar = vi.fn()

let auth: typeof import('../auth')
let apiFetch: typeof import('../api/http').apiFetch

function enLa(url: string) {
  const { origin, pathname, search, hash } = new URL(url)
  vi.stubGlobal('location', { origin, pathname, search, hash, href: url, reload: recargar })
}

beforeEach(async () => {
  vi.resetModules()
  vi.clearAllMocks()
  localStorage.clear()
  vi.stubGlobal('fetch', vi.fn())
  vi.stubGlobal('caches', { keys: vi.fn().mockResolvedValue([]), delete: vi.fn() })
  vi.stubGlobal('history', { replaceState: reemplazar })
  enLa('http://localhost:5173/planificador')
  auth = await import('../auth')
  ;({ apiFetch } = await import('../api/http'))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const respuesta = (status: number) => new Response('{}', { status })

describe('vuelta de nuestro OAuth', () => {
  it('guarda la sesión que llega en el fragmento y la borra de la barra', () => {
    enLa('http://localhost:5173/planificador#sesion=token-nuevo')

    expect(auth.capturarToken()).toBe('token-nuevo')
    expect(localStorage.getItem(CLAVE)).toBe('token-nuevo')
    expect(reemplazar).toHaveBeenCalledWith(null, '', 'http://localhost:5173/planificador')
  })

  it('el token ya guardado manda sobre el fragmento', () => {
    localStorage.setItem(CLAVE, 'token-viejo')
    enLa('http://localhost:5173/#sesion=otro')

    expect(auth.capturarToken()).toBe('token-viejo')
  })

  it('sin fragmento no inventa sesión', () => {
    expect(auth.capturarToken()).toBeNull()
    expect(localStorage.getItem(CLAVE)).toBeNull()
  })

  it('lee el motivo por el que no se entró', () => {
    enLa('http://localhost:5173/#acceso=sin-invitacion')
    expect(auth.avisoDeVuelta()).toBe('sin-invitacion')
  })

  it('ignora un motivo que no reconoce', () => {
    enLa('http://localhost:5173/#acceso=lo-que-sea')
    expect(auth.avisoDeVuelta()).toBeNull()
    expect(reemplazar).not.toHaveBeenCalled()
  })

  it('manda a la API con el destino desde el que se pulsa', () => {
    enLa('http://localhost:5173/planificador?semana=2')
    auth.entrar()

    expect(window.location.href).toContain('/auth/google/inicio?destino=')
    expect(decodeURIComponent(window.location.href.split('destino=')[1])).toBe(
      'http://localhost:5173/planificador?semana=2'
    )
  })
})

describe('401 con sesión propia', () => {
  it('suelta la sesión y recarga', async () => {
    localStorage.setItem(CLAVE, 'token')
    vi.mocked(fetch).mockResolvedValue(respuesta(401))

    const res = await apiFetch('/recetas')

    expect(res.status).toBe(401)
    expect(localStorage.getItem(CLAVE)).toBeNull()
    expect(recargar).toHaveBeenCalled()
  })

  it('una respuesta buena no toca la sesión', async () => {
    localStorage.setItem(CLAVE, 'token')
    vi.mocked(fetch).mockResolvedValue(respuesta(200))

    await apiFetch('/recetas')

    expect(recargar).not.toHaveBeenCalled()
    expect(localStorage.getItem(CLAVE)).toBe('token')
  })

  it('manda la sesión en la cabecera', async () => {
    localStorage.setItem(CLAVE, 'token')
    vi.mocked(fetch).mockResolvedValue(respuesta(200))

    await apiFetch('/recetas')

    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer token')
  })
})
