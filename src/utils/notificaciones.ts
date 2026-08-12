export async function pedirPermisoNotificaciones(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  try {
    return (await Notification.requestPermission()) === 'granted'
  } catch {
    return false
  }
}

export async function notificarTemporizador(titulo: string, cuerpo: string, tag: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const opts: NotificationOptions & { renotify?: boolean; vibrate?: number[] } = {
    body: cuerpo,
    tag,
    renotify: true,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 120, 200],
  }
  try {
    const reg = await navigator.serviceWorker?.ready
    if (reg) reg.showNotification(titulo, opts)
    else new Notification(titulo, opts)
  } catch {
    try { new Notification(titulo, opts) } catch { /* ignora */ }
  }
}
