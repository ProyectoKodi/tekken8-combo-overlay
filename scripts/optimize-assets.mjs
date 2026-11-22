#!/usr/bin/env node
/**
 * Regenera los WebP optimizados del banner a partir de `assets-src/`.
 *
 *   npm run assets              # 3 fondos curados + todos los rangos y retratos
 *   npm run assets -- --all     # además, los 19 fondos
 *   npm run assets -- --force   # reescribe aunque no haya cambios
 *
 * Los originales nunca se tocan: solo se leen.
 */
import sharp from 'sharp'
import { mkdir, readdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC = path.join(ROOT, 'assets-src')
const OUT = path.join(ROOT, 'src/renderer/assets/banner')

/** Fondos elegidos a mano; el resto se queda en assets-src hasta que se pida --all. */
const CURATED_BACKGROUNDS = [
  'banner-bg-1', 'banner-bg-2', 'banner-bg-3', 'banner-bg-4', 'banner-bg-5',
  'banner-bg-6', 'banner-bg-7', 'banner-bg-8', 'banner-bg-9', 'banner-bg-17',
]

const IMAGE_EXT = /\.(png|jpe?g|webp)$/i

const RULES = [
  { folder: 'fondo', out: 'fondo', width: 1400, height: 788, quality: 80, alpha: false },
  { folder: 'rango', out: 'rango', width: 320, height: 160, quality: 82, alpha: true },
  { folder: 'Personaje', out: 'personaje', quality: 90, alpha: true },
]

const args = new Set(process.argv.slice(2))
const includeAllBackgrounds = args.has('--all')
const force = args.has('--force')

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`

/** `Alisa-Bosconovitch.png` -> `alisa-bosconovitch` */
const slug = (fileName) => fileName.replace(IMAGE_EXT, '').toLowerCase().replace(/\s+/g, '-')

async function mtime(file) {
  try {
    return (await stat(file)).mtimeMs
  } catch {
    return 0
  }
}

async function convert(sourcePath, targetPath, rule) {
  let pipeline = sharp(sourcePath, { failOn: 'error' })
  if (rule.alpha === false) pipeline = pipeline.removeAlpha()
  if (rule.width) {
    pipeline = pipeline.resize({
      width: rule.width,
      height: rule.height,
      fit: 'cover',
      position: 'centre',
    })
  }
  await pipeline.webp({ quality: rule.quality, effort: 6, alphaQuality: 100 }).toFile(targetPath)
}

async function runGroup(rule, filter) {
  const from = path.join(SRC, rule.folder)
  const to = path.join(OUT, rule.out)

  if (!existsSync(from)) {
    console.log(`  ⚠ ${rule.folder}: no existe, se omite`)
    return { ...rule, converted: 0, skipped: 0, bytesIn: 0, bytesOut: 0, names: [] }
  }

  await mkdir(to, { recursive: true })
  const all = (await readdir(from)).filter((f) => IMAGE_EXT.test(f))
  const files = filter ? all.filter(filter) : all

  let converted = 0
  let skipped = 0
  let bytesIn = 0
  let bytesOut = 0
  const names = []

  for (const file of files) {
    const sourcePath = path.join(from, file)
    const targetName = `${slug(file)}.webp`
    const targetPath = path.join(to, targetName)
    names.push(targetName)

    const [srcTime, outTime] = await Promise.all([mtime(sourcePath), mtime(targetPath)])
    const upToDate = !force && outTime >= srcTime

    if (upToDate) {
      skipped++
    } else {
      try {
        await convert(sourcePath, targetPath, rule)
        converted++
      } catch (err) {
        console.error(`  ✖ ${file}: ${err.message}`)
        process.exitCode = 1
        continue
      }
    }

    bytesIn += (await stat(sourcePath)).size
    bytesOut += (await stat(targetPath)).size
  }

  console.log(
    `  ${rule.folder} → ${rule.out}: ${files.length} archivos ` +
      `(${converted} convertidos, ${skipped} al día)  ${mb(bytesIn)} → ${mb(bytesOut)}`
  )
  return { ...rule, converted, skipped, bytesIn, bytesOut, names }
}

async function main() {
  if (!existsSync(SRC)) {
    console.error(`No existe ${SRC}`)
    process.exit(1)
  }

  console.log('Optimizando arte del banner…')

  const backgroundFilter = includeAllBackgrounds
    ? undefined
    : (file) => CURATED_BACKGROUNDS.includes(slug(file))

  const results = [
    await runGroup(RULES[0], backgroundFilter),
    await runGroup(RULES[1]),
    await runGroup(RULES[2]),
  ]

  const totalIn = results.reduce((sum, r) => sum + r.bytesIn, 0)
  const totalOut = results.reduce((sum, r) => sum + r.bytesOut, 0)
  const ratio = totalIn ? Math.round((1 - totalOut / totalIn) * 100) : 0

  console.log(`\nTotal: ${mb(totalIn)} → ${mb(totalOut)}  (−${ratio} %)`)

  if (!includeAllBackgrounds) {
    console.log(
      `Fondos incluidos: ${CURATED_BACKGROUNDS.join(', ')}. ` +
        'Usa `npm run assets -- --all` para los 19 (engorda el paquete ~2 MB).'
    )
  }

  for (const result of results) {
    if (result.names.length === 0) continue
    const existing = (await readdir(path.join(OUT, result.out))).filter((f) => f.endsWith('.webp'))
    const orphans = existing.filter((f) => !result.names.includes(f))
    if (orphans.length > 0) {
      console.log(`\n⚠ ${result.out}: ${orphans.length} archivo(s) sin original → ${orphans.join(', ')}`)
      console.log('  Bórralos a mano si ya no se usan.')
    }
  }

  console.log('\nListo. Recompila con `npm run build` (Vite hashea los WebP nuevos).')
}

await main()
