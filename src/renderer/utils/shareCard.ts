/**
 * Tarjeta de progreso compartible (PNG generada en canvas, sin dependencias):
 * totales aprendidos, barras por personaje y retratos servidos por banner://
 * (privilegiado con corsEnabled, así el canvas no queda "tainted" y se puede
 * exportar con toBlob).
 */
import { getTranslation, Language } from '../locales'
import { artSlugForCharacter } from './bannerAssets'

interface Progress { learned: number; total: number }
type ProgressMap = Record<string, Progress> | null | undefined

const W = 1000
const H = 560
const ACCENT = '#fbbf24'

function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export async function generateProgressCard(language: Language, progress: ProgressMap): Promise<Blob | null> {
  const t = (path: string) => getTranslation(language, path)
  const entries = Object.entries(progress ?? {}).filter(([, p]) => p.total > 0)
  if (entries.length === 0) return null

  const totalLearned = entries.reduce((s, [, p]) => s + p.learned, 0)
  const totalCombos = entries.reduce((s, [, p]) => s + p.total, 0)
  const top = entries
    .sort((a, b) => b[1].learned / b[1].total - a[1].learned / a[1].total || b[1].learned - a[1].learned)
    .slice(0, 5)

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // Fondo
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#141420')
  bg.addColorStop(1, '#0a0a10')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  // Banda de acento superior
  ctx.fillStyle = ACCENT
  ctx.fillRect(0, 0, W, 6)

  // Título
  ctx.fillStyle = ACCENT
  ctx.font = '900 40px sans-serif'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(t('share.title').toUpperCase(), 48, 84)

  // Total grande
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 76px sans-serif'
  ctx.fillText(`${totalLearned}`, 48, 190)
  const learnedW = ctx.measureText(`${totalLearned}`).width
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.font = '600 30px sans-serif'
  ctx.fillText(`${t('share.of')} ${totalCombos} ${t('share.learned')}`, 48 + learnedW + 14, 190)

  // Barras por personaje (top 5) con retrato a la izquierda
  const rows = top.length
  const rowH = 64
  const startY = 240
  const barX = 200
  const barW = W - barX - 190
  for (let i = 0; i < rows; i++) {
    const [name, p] = top[i]
    const y = startY + i * (rowH + 10)
    const pct = Math.max(4, Math.round((p.learned / p.total) * 100))

    // Retrato circular (si existe el arte local)
    const slug = artSlugForCharacter(name)
    if (slug) {
      const img = await loadImg(`banner://local/personaje/${slug}.webp`)
      if (img) {
        ctx.save()
        ctx.beginPath()
        ctx.arc(barX - 46, y + rowH / 2 - 4, 26, 0, Math.PI * 2)
        ctx.clip()
        ctx.drawImage(img, barX - 72, y + rowH / 2 - 30, 52, 52)
        ctx.restore()
      }
    }

    ctx.fillStyle = 'rgba(255,255,255,0.92)'
    ctx.font = '700 17px sans-serif'
    ctx.fillText(name, barX, y + 16)
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.font = '500 13px sans-serif'
    const nameW = ctx.measureText(name).width + 6
    ctx.fillText(`${p.learned}/${p.total}`, barX + nameW, y + 16)

    roundRect(ctx, barX, y + 28, barW, 12, 6)
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.fill()
    roundRect(ctx, barX, y + 28, Math.max((barW * pct) / 100, 12), 12, 6)
    ctx.fillStyle = pct === 100 ? '#34d399' : ACCENT
    ctx.fill()
  }

  // Pie: fecha + marca
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.font = '600 15px sans-serif'
  ctx.fillText(new Date().toLocaleDateString(), 48, H - 36)
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = '800 17px sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('⚡ Tekken 8 Combo Overlay', W - 48, H - 36)
  ctx.textAlign = 'left'

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
}
