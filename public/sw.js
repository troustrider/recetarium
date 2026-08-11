// Service worker: shell, assets y recetas para poder cocinar sin cobertura, más
// el clic en notificación.
//
// Los ficheros del build llevan hash en el nombre y aquí no se conocen, así que
// no hay precache: se cachea sobre la marcha lo que se va pidiendo. Basta con
// haber abierto la app una vez con red.
const VERSION = 'v3'
const SHELL = `recetarium-shell-${VERSION}`
const ASSETS = `recetarium-assets-${VERSION}`
const API = `recetarium-api-${VERSION}`
const NUESTRAS = [SHELL, ASSETS, API]

const ESENCIALES = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/favicon.svg']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(SHELL)
      // addAll aborta entero si falla uno; un icono no vale una instalación rota.
      .then((c) => Promise.all(ESENCIALES.map((u) => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !NUESTRAS.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

async function redPrimero(request, cache) {
  try {
    const res = await fetch(request)
    if (res && res.ok) {
      (await caches.open(cache)).put(request, res.clone())
      return res
    }
    // Un 5xx (o el proxy caído) vale tanto como no tener red. Un 4xx no: si la
    // receta ya no existe, no se sirve una copia vieja como si existiera.
    if (res && res.status >= 500) return (await caches.match(request)) ?? res
    return res
  } catch (err) {
    const guardada = await caches.match(request)
    if (guardada) return guardada
    throw err
  }
}

async function cachePrimero(request, cache) {
  const guardada = await caches.match(request)
  if (guardada) return guardada
  const res = await fetch(request)
  if (res && res.ok) (await caches.open(cache)).put(request, res.clone())
  return res
}

self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // La navegación siempre intenta red primero: así una versión nueva entra sola.
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).catch(async () => {
        const shell = await caches.match('/')
        return shell ?? new Response('Sin conexión', { status: 503, headers: { 'Content-Type': 'text/plain' } })
      })
    )
    return
  }

  // Manda lo de red; sin ella, la última copia para consultar en la cocina.
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(redPrimero(request, API))
    return
  }

  // Nombres con hash, así que lo cacheado nunca queda viejo. En desarrollo no
  // existe /assets/, de modo que esto no toca el HMR.
  if (url.pathname.startsWith('/assets/') || ESENCIALES.includes(url.pathname)) {
    e.respondWith(cachePrimero(request, ASSETS))
  }
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) if ('focus' in c) return c.focus()
      if (self.clients.openWindow) return self.clients.openWindow('/')
    })
  )
})
