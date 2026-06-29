const KEY_STORAGE = 'recetarium:appKey'

export function getKey(): string {
  return localStorage.getItem(KEY_STORAGE) ?? ''
}

export function setKey(k: string): void {
  localStorage.setItem(KEY_STORAGE, k)
}

function authHeaders(): Record<string, string> {
  const k = getKey()
  return k ? { 'x-app-key': k } : {}
}

// fetch para escrituras: añade la clave y, si el backend responde 401,
// pide la passphrase una vez, la guarda y reintenta.
export async function authedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const merged = (): RequestInit => ({ ...options, headers: { ...options.headers, ...authHeaders() } })
  let res = await fetch(url, merged())
  if (res.status === 401) {
    const k = window.prompt('Introduce la clave compartida de Recetarium:')
    if (k) {
      setKey(k.trim())
      res = await fetch(url, merged())
    }
  }
  return res
}
