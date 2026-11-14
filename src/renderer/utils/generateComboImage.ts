import type { Combo } from '../types/combo'

export async function generateComboImage(combo: Combo): Promise<string> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear el canvas')

  // Dimensiones de la imagen final
  const width = 800
  const height = 300
  canvas.width = width
  canvas.height = height

  // 1. Fondo oscuro
  ctx.fillStyle = '#0f0f16'
  ctx.fillRect(0, 0, width, height)

  // 2. Borde superior (color acento)
  ctx.fillStyle = '#fbbf24' // Dorado
  ctx.fillRect(0, 0, width, 4)

  // 3. Texto: Nombre del personaje
  ctx.fillStyle = '#fbbf24'
  ctx.font = 'bold 32px sans-serif'
  ctx.fillText(combo.character.toUpperCase(), 40, 60)

  // 4. Texto: Daño y Golpes
  ctx.fillStyle = '#ffffff'
  ctx.font = '20px sans-serif'
  ctx.fillText(`${combo.damage} DMG`, 40, 100)
  ctx.fillStyle = '#888888'
  ctx.font = '16px sans-serif'
  ctx.fillText(`${combo.hits} HITS`, 150, 100)

  // 5. Texto: Autor
  if (combo.creator) {
    ctx.fillStyle = '#666666'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`por ${combo.creator}`, width - 40, 100)
    ctx.textAlign = 'left'
  }

  // 6. Dibujar la notación (descargando las imágenes de Kage)
  // Dividimos la notación por los separadores para saber cuándo poner un espacio
  const tokens = combo.notation.split('►').map(t => t.trim())
  let currentX = 40
  const y = 160
  const iconSize = 32
  const gap = 8

  // Función auxiliar para cargar una imagen
  const loadImg = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous' // Necesario para evitar errores de CORS
      img.onload = () => resolve(img)
      img.onerror = () => reject()
      // Convertir el texto (ej. "d/f") a la URL del icono (ej. "df")
      const formattedSrc = src.replace(/\s+/g, '').replace('/', '')
      img.src = `https://tekken8combo.kagewebsite.com/tpl/img/input/${formattedSrc}.svg`
    })
  }

  // Iterar sobre cada paso del combo
  for (let i = 0; i < tokens.length; i++) {
    const step = tokens[i]
    // Separar las partes (ej. "d/f,2" -> ["d/f", "2"])
    const parts = step.replace(/,/g, ' ').split(' ').filter(Boolean)

    for (const part of parts) {
      try {
        const img = await loadImg(part)
        ctx.drawImage(img, currentX, y, iconSize, iconSize)
      } catch {
        // Si falla la imagen (ej. texto como "Heat Burst"), dibujamos un rectángulo con el texto
        ctx.fillStyle = '#333333'
        ctx.fillRect(currentX, y, 60, iconSize)
        ctx.fillStyle = '#ffffff'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(part, currentX + 30, y + 20)
        ctx.textAlign = 'left'
      }
      currentX += iconSize + 4
    }

    // Añadir el icono de flecha (separador) si no es el último paso
    if (i < tokens.length - 1) {
      try {
        const arrowImg = await loadImg('follow')
        ctx.globalAlpha = 0.5
        ctx.drawImage(arrowImg, currentX, y + 8, 16, 16)
        ctx.globalAlpha = 1
      } catch {}
      currentX += 24
    }

    // Si nos pasamos del ancho, cortamos (para que no se salga de la imagen)
    if (currentX > width - 100) break
  }

  // 7. Marca de agua
  ctx.fillStyle = '#333333'
  ctx.font = '12px sans-serif'
  ctx.fillText('Tekken 8 Combo Overlay', 40, height - 20)

  // 8. Devolver la imagen como string Base64
  return canvas.toDataURL('image/png')
}