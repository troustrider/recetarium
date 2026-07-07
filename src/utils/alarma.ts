// Aviso de fin de temporizador sin depender de assets externos (CSP-safe):
// un beep sintetizado con WebAudio + vibración en Android. El AudioContext se
// desbloquea con el gesto de arrancar el primer temporizador, así que los
// avisos posteriores suenan aunque salten desde el tick del intervalo.

let ctx: AudioContext | null = null

export function desbloquearAudio() {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (AC) ctx = new AC()
  }
  if (ctx?.state === 'suspended') void ctx.resume()
}

export function sonarAlarma() {
  desbloquearAudio()
  if (ctx) {
    const now = ctx.currentTime
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = 880
      const t = now + i * 0.4
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.34)
    }
  }
  if ('vibrate' in navigator) navigator.vibrate([200, 120, 200, 120, 200])
}
