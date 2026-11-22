import { app, net, protocol } from 'electron'
import { join } from 'path'
import { readdir, copyFile, mkdir, stat } from 'fs/promises'
import { pathToFileURL } from 'url'
import { artSlugForCharacter } from './discordPresence'
import { getUserPrefs } from './userPrefs'
import { CHARACTER_SLUGS } from '../renderer/types/combo'

/**
 * Protocolo `banner://local/<archivo>` para servir las imágenes de fondo
 * propias del usuario (copiadas a userData por 'pick-banner-image').
 *
 * Un <img src="file://..."> está bloqueado por webSecurity cuando el renderer
 * se sirve por http (modo dev), así que usamos un protocolo privilegiado:
 * funciona igual en dev y en producción, sin exponer el disco entero.
 */

export function registerBannerProtocolPrivileges(): void {
  // Debe llamarse ANTES de app ready. `corsEnabled` permite usar imágenes
  // banner:// dentro de un <canvas> sin "taint" (necesario para exportar PNG).
  protocol.registerSchemesAsPrivileged([
    { scheme: 'banner', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, bypassCSP: true, corsEnabled: true } },
  ])
}

export function registerBannerProtocolHandler(): void {
  protocol.handle('banner', (request) => {
    try {
      const { pathname } = new URL(request.url)
      const file = pathname.replace(/^\/+/, '') || 'banner-custom.png'
      // Solo archivos propios del usuario: el fondo elegido (userData raíz)
      // y los retratos copiados para compartir (subcarpeta personaje/).
      if (file.includes('..')) throw new Error('ruta no permitida')
      const allowed = /^(banner-custom[^/]*|personaje\/[^/]+)$/.test(file)
      if (!allowed) throw new Error('ruta no permitida')
      const full = join(app.getPath('userData'), file)
      return net.fetch(pathToFileURL(full).toString())
    } catch {
      return new Response(null, { status: 404 })
    }
  })
}

// -------------------------------------------------
// Retratos para la tarjeta de progreso compartible: se copian del paquete
// (out/renderer/assets/banner/personaje, también legible dentro del asar)
// a userData/personaje, y se sirven por banner:// local sin problemas de CORS.
// -------------------------------------------------

/** Copia el retrato de un personaje a userData y devuelve su URL banner://. */
export async function ensureSharePortrait(name: string): Promise<string | null> {
  const slug = artSlugForCharacter(name)
  if (!slug) return null
  const dir = join(app.getPath('userData'), 'personaje')
  const dest = join(dir, `${slug}.webp`)
  try {
    await stat(dest) // ¿ya está copiado?
  } catch {
    const srcDir = join(app.getAppPath(), 'out/renderer/assets')
    try {
      const files = await readdir(srcDir)
      const match = files.find((f) => f === `${slug}.webp` || f.startsWith(`${slug}-`))
      if (!match) return null
      await mkdir(dir, { recursive: true })
      await copyFile(join(srcDir, match), dest)
    } catch {
      return null
    }
  }
  return `banner://local/personaje/${slug}.webp`
}

/** Precalienta los retratos de los personajes conocidos (al arrancar). */
export async function prewarmSharePortraits(): Promise<void> {
  const names = [...Object.keys(CHARACTER_SLUGS), ...Object.keys(getUserPrefs().discoveredCharacters)]
  for (const name of names) await ensureSharePortrait(name).catch(() => null)
}
