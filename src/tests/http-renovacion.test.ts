import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  token: vi.fn(),
}))

vi.mock('@neondatabase/neon-js/auth', () => ({
  createAuthClient: () => ({ getSession: auth.getSession, token: auth.token, signIn: vi.fn(), signOut: vi.fn() }),
}))
vi.mock('@neondatabase/neon-js/auth/react/adapters', () => ({ BetterAuthReactAdapter: () => ({}) }))

const CLAVE = 'recetarium:sesion'
const recargar = vi.fn()

let apiFetch: typeof import('../api/http').apiFetch

beforeEach(async () => {
  vi.resetModules()
  vi.clearAllMocks()
  localStorage.clear()
  vi.stubGlobal('fetch', vi.fn())
  vi.stubGlobal('caches', { keys: vi.fn().mockResolvedValue([]), delete: vi.fn() })
  vi.stubGlobal('location', { reload: recargar, href: 'http://localhost/' })
  ;({ apiFetch } = await import('../api/http'))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const respuesta = (status: number) => new Response('{}', { status })
const autorizacionDe = (llamada: number) =>
  (vi.mocked(fetch).mock.calls[llamada][1] as RequestInit).headers as Record<string, string>

describe('401 por JWT caducado', () => {
  it('renueva el token y repite la petición sin recargar', async () => {
    localStorage.setItem(CLAVE, 'jwt-viejo')
    vi.mocked(fetch).mockResolvedValueOnce(respuesta(401)).mockResolvedValueOnce(respuesta(200))
    auth.token.mockResolvedValue({ data: { token: 'jwt-nuevo' } })

    const res = await apiFetch('/recetas')

    expect(res.status).toBe(200)
    expect(recargar).not.toHaveBeenCalled()
    expect(localStorage.getItem(CLAVE)).toBe('jwt-nuevo')
    expect(autorizacionDe(0).Authorization).toBe('Bearer jwt-viejo')
    expect(autorizacionDe(1).Authorization).toBe('Bearer jwt-nuevo')
  })

  it('varias peticiones a la vez comparten una sola renovación', async () => {
    localStorage.setItem(CLAVE, 'jwt-viejo')
    vi.mocked(fetch).mockImplementation(async (_u, init) => {
      const cab = (init as RequestInit).headers as Record<string, string>
      return respuesta(cab.Authorization === 'Bearer jwt-nuevo' ? 200 : 401)
    })
    auth.token.mockResolvedValue({ data: { token: 'jwt-nuevo' } })

    const todas = await Promise.all([apiFetch('/plan'), apiFetch('/despensa'), apiFetch('/extras')])

    expect(todas.map((r) => r.status)).toEqual([200, 200, 200])
    expect(auth.token).toHaveBeenCalledTimes(1)
    expect(recargar).not.toHaveBeenCalled()
  })

  it('si no hay token nuevo, suelta la sesión y recarga como antes', async () => {
    localStorage.setItem(CLAVE, 'jwt-viejo')
    vi.mocked(fetch).mockResolvedValue(respuesta(401))
    auth.token.mockResolvedValue({ data: null })
    auth.getSession.mockResolvedValue({ data: null })

    const res = await apiFetch('/recetas')

    expect(res.status).toBe(401)
    expect(localStorage.getItem(CLAVE)).toBeNull()
    expect(recargar).toHaveBeenCalled()
  })

  it('si el token nuevo tampoco vale, no se queda en bucle', async () => {
    localStorage.setItem(CLAVE, 'jwt-viejo')
    vi.mocked(fetch).mockResolvedValue(respuesta(401))
    auth.token.mockResolvedValue({ data: { token: 'jwt-nuevo' } })

    await apiFetch('/recetas')

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2)
    expect(auth.token).toHaveBeenCalledTimes(1)
    expect(recargar).toHaveBeenCalled()
  })

  it('si token() no da nada, cae a getSession()', async () => {
    localStorage.setItem(CLAVE, 'jwt-viejo')
    vi.mocked(fetch).mockResolvedValueOnce(respuesta(401)).mockResolvedValueOnce(respuesta(200))
    auth.token.mockResolvedValue({ data: { token: undefined } })
    auth.getSession.mockResolvedValue({ data: { session: { token: 'jwt-de-sesion' } } })

    const res = await apiFetch('/recetas')

    expect(res.status).toBe(200)
    expect(localStorage.getItem(CLAVE)).toBe('jwt-de-sesion')
    expect(recargar).not.toHaveBeenCalled()
  })

  it('si token() revienta, tampoco se pierde la sesión', async () => {
    localStorage.setItem(CLAVE, 'jwt-viejo')
    vi.mocked(fetch).mockResolvedValueOnce(respuesta(401)).mockResolvedValueOnce(respuesta(200))
    auth.token.mockRejectedValue(new Error('sin red'))
    auth.getSession.mockResolvedValue({ data: { session: { token: 'jwt-de-sesion' } } })

    const res = await apiFetch('/recetas')

    expect(res.status).toBe(200)
    expect(recargar).not.toHaveBeenCalled()
  })

  it('una respuesta buena no toca la sesión', async () => {
    localStorage.setItem(CLAVE, 'jwt-viejo')
    vi.mocked(fetch).mockResolvedValue(respuesta(200))

    await apiFetch('/recetas')

    expect(auth.token).not.toHaveBeenCalled()
    expect(recargar).not.toHaveBeenCalled()
    expect(localStorage.getItem(CLAVE)).toBe('jwt-viejo')
  })
})
