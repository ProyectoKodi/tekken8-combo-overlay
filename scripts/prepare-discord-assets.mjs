// Prepara las imágenes del juego para subir como "Art Assets" en el portal de
// Discord (Rich Presence). Convierte retratos y emblemas a PNG cuadrados de
// 512×512 y los deja en `discord-assets/` con el nombre exacto de la clave.
//
// Uso: npm run discord:assets  →  discord-assets/personaje/*.png, discord-assets/rango/*.png
// Luego súbelas en: discord.com/developers/applications → tu app → Rich Presence → Art Assets.
// La clave de cada asset es el nombre del archivo SIN extensión (p. ej. `marshall-law`).
import sharp from 'sharp'
import { readdirSync, mkdirSync, copyFileSync, writeFileSync } from 'node:fs'
import { join, basename } from 'node:path'

const SRC = 'src/renderer/assets/banner'
const OUT = 'discord-assets'

mkdirSync(join(OUT, 'personaje'), { recursive: true })
mkdirSync(join(OUT, 'rango'), { recursive: true })

async function convert(dir, outDir) {
  const files = readdirSync(dir).filter((f) => f.endsWith('.webp'))
  for (const file of files) {
    const out = join(OUT, outDir, basename(file, '.webp') + '.png')
    await sharp(join(dir, file))
      .resize({ width: 512, height: 512, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(out)
    console.log('✓', out)
  }
  return files.length
}

const chars = await convert(join(SRC, 'personaje'), 'personaje')
const ranks = await convert(join(SRC, 'rango'), 'rango')

writeFileSync(
  join(OUT, 'LEEME.txt'),
  [
    'Discord Rich Presence — Assets',
    '',
    '1. Entra a https://discord.com/developers/applications → tu aplicación →',
    '   pestaña "Rich Presence" → "Art Assets" → "Add Image".',
    '2. Sube cada PNG de discord-assets/personaje/ y discord-assets/rango/.',
    '3. El nombre (clave) de cada asset debe ser el nombre del archivo SIN',
    '   extensión: marshall-law, kazuya-mishima, tekkenking, beginner, etc.',
    '4. En el overlay pulsa F7 (o ◀ ▶ en la barra de práctica) y Discord',
    `   mostrará el retrato (${chars} personajes) y el emblema (${ranks} rangos).`,
    '',
    'No es obligatorio subirlos todos: solo los de los personajes/rangos que uses.',
  ].join('\n'),
  'utf-8',
)
console.log(`\nListo: ${chars} retratos + ${ranks} emblemas en ${OUT}/ (ver LEEME.txt)`)
