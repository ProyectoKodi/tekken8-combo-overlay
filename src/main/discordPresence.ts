import { Socket } from 'node:net'
import { randomUUID } from 'node:crypto'
import { getUserPrefs } from './userPrefs'
import { CHARACTER_ART_SLUGS, RANK_ART_SLUGS, slugify } from '../renderer/utils/bannerLookup'

/**
 * Discord Rich Presence sin dependencias nativas: Discord escucha un pipe
 * con nombre en Windows (`\\.\pipe\discord-ipc-0..9`) y habla JSON con un
 * framing trivial (u32 opcode + u32 longitud + payload).
 *
 * El Client ID se configura desde la Ayuda (es el ID de una "Application"
 * creada en discord.com/developers — no requiere bot ni permisos).
 */

const OPCODE = {
  HANDSHAKE: 0, // { v: 1, client_id }
  FRAME: 1,     // comandos (SET_ACTIVITY) y respuestas
  PING: 3,
  PONG: 4,
}

/**
 * Client ID de la aplicación oficial del proyecto en Discord. Con él
 * horneado, TODOS los usuarios tienen Rich Presence con imágenes sin
 * configurar nada (los assets se subieron una vez al portal de la app).
 * El campo de la Ayuda es solo un override para probar con otra aplicación.
 */
export const DEFAULT_DISCORD_CLIENT_ID = '1573748294792777819'

export type DiscordStatus = 'disabled' | 'not-running' | 'connected'

let socket: Socket | null = null
let connected = false
let status: DiscordStatus = 'disabled'
let buffer: Buffer = Buffer.alloc(0)
let startTimestamp: number | null = null

function encode(op: number, payload: unknown): Buffer {
  const json = Buffer.from(JSON.stringify(payload), 'utf-8')
  const header = Buffer.alloc(8)
  header.writeUInt32LE(op, 0)
  header.writeUInt32LE(json.length, 4)
  return Buffer.concat([header, json])
}

function send(op: number, payload: unknown): void {
  if (socket && connected) socket.write(encode(op, payload))
}

/** Conecta al pipe de Discord (prueba 0..9). Resuelve true si el handshake OK. */
function connectPipe(): Promise<boolean> {
  return new Promise((resolve) => {
    let attempt = 0
    const tryNext = (): void => {
      if (attempt > 9) { resolve(false); return }
      const pipePath = `\\\\.\\pipe\\discord-ipc-${attempt}`
      attempt++
      const s = new Socket()
      let ready = false

      const fail = (): void => {
        s.destroy()
        tryNext()
      }

      s.setTimeout(5000, fail)
      s.once('error', fail)

      s.connect(pipePath, () => {
        s.write(encode(OPCODE.HANDSHAKE, { v: 1, client_id: effectiveClientId() }))
      })

      s.on('data', (chunk: Buffer) => {
        buffer = Buffer.concat([buffer, chunk])
        // Procesar todos los frames completos
        while (buffer.length >= 8) {
          const op = buffer.readUInt32LE(0)
          const len = buffer.readUInt32LE(4)
          if (buffer.length < 8 + len) break
          const payload = buffer.subarray(8, 8 + len)
          buffer = buffer.subarray(8 + len)

          if (op === OPCODE.PING) {
            try { send(OPCODE.PONG, JSON.parse(payload.toString('utf-8') || '{}')) } catch { /* noop */ }
          } else if (op === OPCODE.FRAME) {
            try {
              const msg = JSON.parse(payload.toString('utf-8') || '{}')
              if (msg.evt === 'READY' && !ready) {
                ready = true
                connected = true
                status = 'connected'
                s.setTimeout(0)
                socket = s
                resolve(true)
              }
            } catch { /* frame no JSON: ignorar */ }
          }
        }
      })

      s.once('close', () => {
        if (!ready) { fail(); return }
        connected = false
        socket = null
        if (status === 'connected') status = 'not-running'
      })
    }
    tryNext()
  })
}

/** Slug de arte del personaje (la clave que se sube como asset en Discord). */
export function artSlugForCharacter(character: string): string | null {
  if (!character) return null
  const explicit = CHARACTER_ART_SLUGS[character]
  if (explicit) return explicit
  const slug = slugify(character)
  const match = Object.values(CHARACTER_ART_SLUGS).find(
    (k) => k === slug || k.endsWith(`-${slug}`) || k.startsWith(`${slug}-`)
  )
  return match ?? null
}

/** Slug del emblema de rango guardado en el perfil. */
export function rankSlugFor(rank: string | undefined | null): string | null {
  if (!rank) return null
  return RANK_ART_SLUGS[rank] ?? null
}

export interface PresenceActivity {
  details: string
  state: string
  /** Claves de assets subidos en el portal de Discord (opcional). */
  largeImage?: string
  largeText?: string
  smallImage?: string
  smallText?: string
}

/** Client ID efectivo: el override del usuario (Ayuda) o el oficial del proyecto. */
function effectiveClientId(): string {
  return getUserPrefs().discordClientId || DEFAULT_DISCORD_CLIENT_ID
}

async function ensureConnected(): Promise<boolean> {
  if (connected) return true
  socket?.destroy()
  socket = null
  const ok = await connectPipe()
  if (!ok) status = 'not-running'
  return ok
}

async function sendActivity(activity: PresenceActivity | null): Promise<void> {
  send(OPCODE.FRAME, {
    cmd: 'SET_ACTIVITY',
    args: {
      pid: process.pid,
      activity: activity
        ? {
            details: activity.details,
            state: activity.state,
            timestamps: startTimestamp ? { start: startTimestamp } : undefined,
            assets: (activity.largeImage || activity.smallImage)
              ? {
                  large_image: activity.largeImage,
                  large_text: activity.largeText,
                  small_image: activity.smallImage,
                  small_text: activity.smallText,
                }
              : undefined,
          }
        : null,
    },
    nonce: randomUUID(),
  })
}

/**
 * Publica la actividad actual (o la limpia con null). Silencioso: si Discord
 * no está abierto queda 'not-running' y se reintenta en la próxima actualización.
 */
export function updatePresence(activity: PresenceActivity | null): void {
  if (!effectiveClientId()) { status = 'disabled'; return }
  if (activity && !startTimestamp) startTimestamp = Date.now()
  if (!activity) startTimestamp = null
  void (async () => {
    if (!(await ensureConnected())) return
    await sendActivity(activity)
  })()
}

/** Al cambiar el Client ID hay que reconectar desde cero. */
export function configurePresence(): void {
  connected = false
  status = effectiveClientId() ? 'not-running' : 'disabled'
  socket?.destroy()
  socket = null
}

export function getPresenceStatus(): DiscordStatus {
  return status
}
