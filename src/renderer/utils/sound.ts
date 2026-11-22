/**
 * Sonido de feedback sutil (Web Audio, sin assets ni dependencias):
 * un "ding" corto de dos notas al marcar un combo como aprendido.
 */

let ctx: AudioContext | null = null

export function playDing(): void {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const t0 = ctx.currentTime

    // Subida suave 880 -> 1320 Hz (Do# -> Mi): tono de "logro"
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, t0)
    osc.frequency.exponentialRampToValueAtTime(1320, t0 + 0.09)

    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(0.07, t0 + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28)

    osc.connect(gain).connect(ctx.destination)
    osc.start(t0)
    osc.stop(t0 + 0.3)
  } catch {
    // Sin audio disponible: se ignora silenciosamente
  }
}
