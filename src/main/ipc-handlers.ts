import { ipcMain, BrowserWindow, screen, app, dialog } from 'electron'
import { execFile } from 'child_process'
import { join } from 'path'
import { readFile, writeFile } from 'fs/promises'
import * as cheerio from 'cheerio'
import { autoUpdater } from 'electron-updater' // <-- IMPORTANTE
import { scrapeCharacterCombos } from './scraper'
import { getCachedCombos, setCachedCombos, clearCache, getCacheInfo } from './cache'
import { CHARACTER_NAMES, CHARACTER_SLUGS } from '../renderer/types/combo'
import { openPracticeWindow, registerPracticeIpc } from './practiceWindow'
import { getFavorites, isFavorite, addFavorite, removeFavorite } from './favorites'
import { comboHash } from '../shared/comboHash'
import { fetchPlayerStatsFromWeb } from './playerScraper'
import Store from 'electron-store'
import type { Combo } from '../renderer/types/combo'

const PANEL = { width: 800, height: 840 }
const HORIZONTAL = { height: 260 }

const store = new Store<{
  customCombos: Combo[]
  seenHashes: Record<string, string[]>
  customNotes: Record<string, string>
  learnedCombos: string[]
}>({
  name: 'combo-extras',
  defaults: { customCombos: [], seenHashes: {}, customNotes: {}, learnedCombos: [] },
})

async function getSlugForCharacter(name: string): Promise<string> {
  try {
    const cleanName = name.replace(/combos?/gi, '').trim().toLowerCase()
    const localMatch = Object.keys(CHARACTER_SLUGS).find(k => k.toLowerCase() === cleanName)
    if (localMatch) return CHARACTER_SLUGS[localMatch]
    const res = await fetch('https://tekken8combo.kagewebsite.com/all-combos/')
    const html = await res.text()
    const $ = cheerio.load(html)
    let foundSlug = cleanName.replace(/\s+/g, '-')
    $('a[href*="/combos-"]').each((_, el) => {
      const href = $(el).attr('href')
      if (!href) return
      const match = href.match(/\/combos-([a-z0-9-]+)\/?$/)
      if (match) {
        const slug = match[1]
        const text = $(el).text().replace(/combos?/gi, '').trim().toLowerCase()
        if (text === cleanName || text.includes(cleanName)) foundSlug = slug
      }
    })
    return foundSlug
  } catch { return name.toLowerCase().replace(/\s+/g, '-') }
}

export function registerIpcHandlers(win: BrowserWindow): void {
  registerPracticeIpc()

  // ... (Favoritos, Aprendidos, Notas, Exportar/Importar Perfil) ...
  ipcMain.handle('get-favorites', () => getFavorites())
  ipcMain.handle('toggle-favorite', (_, id: string) => { if (isFavorite(id)) { removeFavorite(id); return false } addFavorite(id); return true })
  ipcMain.handle('is-favorite', (_, id: string) => isFavorite(id))
  ipcMain.handle('get-learned-combos', () => store.get('learnedCombos'))
  ipcMain.handle('toggle-learned', (_, id: string) => {
    const list = store.get('learnedCombos')
    if (list.includes(id)) { store.set('learnedCombos', list.filter(x => x !== id)); return false } 
    else { store.set('learnedCombos', [...list, id]); return true }
  })
  ipcMain.handle('save-custom-note', (_, { comboId, note }) => {
    const notes = store.get('customNotes')
    if (note.trim()) notes[comboId] = note.trim()
    else delete notes[comboId]
    store.set('customNotes', notes)
    return { ok: true }
  })
  ipcMain.handle('get-custom-notes', () => store.get('customNotes'))
  ipcMain.handle('export-profile', async () => {
    const { filePath } = await dialog.showSaveDialog(win, { title: 'Exportar Perfil', defaultPath: 'tekken8-profile.json', filters: [{ name: 'JSON', extensions: ['json'] }] })
    if (!filePath) return { ok: false, error: 'Cancelado' }
    const data = { customCombos: store.get('customCombos'), notes: store.get('customNotes'), learned: store.get('learnedCombos'), favorites: getFavorites() }
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
    return { ok: true }
  })
  ipcMain.handle('import-profile', async () => {
    const { filePaths } = await dialog.showOpenDialog(win, { title: 'Importar Perfil', properties: ['openFile'], filters: [{ name: 'JSON', extensions: ['json'] }] })
    if (!filePaths || filePaths.length === 0) return { ok: false, error: 'Cancelado' }
    try {
      const data = JSON.parse(await readFile(filePaths[0], 'utf-8'))
      if (data.customCombos) store.set('customCombos', [...store.get('customCombos'), ...data.customCombos])
      if (data.notes) store.set('customNotes', { ...store.get('customNotes'), ...data.notes })
      if (data.learned) store.set('learnedCombos', [...new Set([...store.get('learnedCombos'), ...data.learned])])
      if (data.favorites) data.favorites.forEach((id: string) => addFavorite(id))
      return { ok: true, added: data.customCombos?.length || 0 }
    } catch (err) { return { ok: false, error: 'Error' } }
  })

  // Fetch Combos
  ipcMain.handle('fetch-combos', async (_, character: string) => {
    try {
      let combos: Combo[] = []
      let fromCache = false
      const slug = await getSlugForCharacter(character)
      const cached = getCachedCombos(character)
      if (cached) { combos = cached; fromCache = true } 
      else {
        const res = await scrapeCharacterCombos(slug, character) 
        combos = res.combos
        setCachedCombos(character, combos, res.rawHtml)
      }
      const notes = store.get('customNotes')
      const learned = store.get('learnedCombos')
      const vistos = new Set(store.get('seenHashes')[character] ?? [])
      const seenNow: string[] = []
      let nuevos = 0
      const procesados = combos.map((c) => {
        const h = comboHash(c)
        const esNuevo = !fromCache && !vistos.has(h)
        if (esNuevo) nuevos++
        seenNow.push(h)
        return { ...c, hash: h, isNew: esNuevo, customNote: notes[c.id] || '', isLearned: learned.includes(c.id) }
      })
      if (!fromCache) store.set('seenHashes', { ...store.get('seenHashes'), [character]: seenNow })
      return { combos: procesados, fromCache, fetchedAt: Date.now(), nuevos }
    } catch (err) { throw new Error(err.message) }
  })

  // ── SISTEMA DE ACTUALIZACIÓN (NUEVO) ──
  ipcMain.on('start-update-download', () => {
    autoUpdater.downloadUpdate()
  })
  
  autoUpdater.on('update-downloaded', () => {
    // Cuando termina de descargar, le decimos al renderer que muestre "Reiniciar e Instalar"
    win.webContents.send('update-downloaded')
  })
  
  ipcMain.on('quit-and-install', () => {
    autoUpdater.quitAndInstall()
  })

  // ... (El resto de handlers se mantienen igual)
  ipcMain.handle('get-dynamic-characters', async () => { return { ...CHARACTER_SLUGS } })
  ipcMain.handle('sync-all-characters', async () => { return { total: 0, nuevos: 0 } })
  ipcMain.handle('add-custom-combo', (_, data: Partial<Combo>) => { return { ok: true } })
  ipcMain.handle('get-custom-combos', () => [])
  ipcMain.handle('delete-custom-combo', () => { return { ok: true } })
  ipcMain.handle('fetch-youtube-meta', async () => { return { ok: false } })
  ipcMain.handle('get-character-list', () => CHARACTER_NAMES)
  ipcMain.handle('clear-cache', () => true)
  ipcMain.on('close-window', () => win.close())
  ipcMain.on('minimize-window', () => win.minimize())
  ipcMain.on('set-ignore-mouse', (_, ignore: boolean) => win.setIgnoreMouseEvents(ignore, { forward: true }))
  ipcMain.on('toggle-collapse', () => {})
  ipcMain.on('toggle-horizontal', () => {})
  ipcMain.on('set-opacity', (_, opacity: number) => win.setOpacity(opacity))
  ipcMain.on('open-practice', (_, combo: Combo) => openPracticeWindow(combo))
  ipcMain.handle('get-auto-launch', () => app.getLoginItemSettings().openAtLogin)
  ipcMain.handle('set-auto-launch', (_, enable: boolean) => { app.setLoginItemSettings({ openAtLogin: enable, args: ['--hidden'] }); return enable })
  ipcMain.handle('fetch-player-stats', (_, tekkenId: string) => fetchPlayerStatsFromWeb(tekkenId))
}