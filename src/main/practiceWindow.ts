import { BrowserWindow, screen, ipcMain } from 'electron'
import { join } from 'path'
import type { Combo } from '../renderer/types/combo'
import { getCachedCombos } from './cache'
import { getUserPrefs, setUserPref } from './userPrefs'
import { updatePresence, artSlugForCharacter, rankSlugFor } from './discordPresence'

let practiceWindow: BrowserWindow | null = null
let pendingCombo: Combo | null = null // Guardamos el combo temporalmente aquí

// Modo drill: lista de combos del personaje actual + índice del que se muestra.
// Navegar (F6/F7 o los botones ◀▶) cambia el combo sin volver al overlay.
let drillList: Combo[] = []
let drillIndex = -1

function payload(): { combo: Combo | null; index: number; total: number } {
  return { combo: pendingCombo, index: drillIndex, total: drillList.length }
}

/** Muestra el combo en la tira (crea la ventana si hace falta). */
function show(combo: Combo): void {
  pendingCombo = combo
  const rank = (getUserPrefs().rankData as { rank?: string } | null)?.rank
  updatePresence({
    details: `Modo práctica · ${combo.character}`,
    state: drillList.length > 1 ? `Combo ${drillIndex + 1}/${drillList.length}` : 'Un combo',
    // Imagen del personaje (grande) y emblema de rango (pequeño): solo si el
    // usuario subió los assets a su aplicación de Discord con esas claves.
    largeImage: artSlugForCharacter(combo.character) ?? undefined,
    largeText: combo.character,
    smallImage: rankSlugFor(rank) ?? undefined,
    smallText: rank,
  })
  if (practiceWindow && !practiceWindow.isDestroyed()) {
    practiceWindow.webContents.send('practice-combo', payload())
    practiceWindow.showInactive()
    return
  }
  createPracticeWindow()
}

export function openPracticeWindow(combo: Combo): void {
  // Modo drill: cargamos los combos cacheados del personaje como lista de navegación
  const cached = getCachedCombos(combo.character) ?? []
  if (cached.length > 0) {
    drillList = cached
    const found = cached.findIndex((c) => c.id === combo.id)
    drillIndex = found >= 0 ? found : 0
    show(drillList[drillIndex] ?? combo)
  } else {
    // Sin caché (p. ej. combo custom o caché expirado): solo ese combo
    drillList = [combo]
    drillIndex = 0
    show(combo)
  }
}

/** Siguiente (dir 1) o anterior (dir -1) combo del personaje en la tira. */
export function navigatePractice(dir: number): void {
  if (!practiceWindow || practiceWindow.isDestroyed() || drillList.length === 0) return
  drillIndex = (drillIndex + dir + drillList.length) % drillList.length
  show(drillList[drillIndex])
}

function createPracticeWindow(): void {
  const { width: screenW, height: workH } = screen.getPrimaryDisplay().workAreaSize
  const position = getUserPrefs().practicePosition === 'bottom' ? 'bottom' : 'top'

  practiceWindow = new BrowserWindow({
    width: screenW,
    height: 64,
    x: 0,
    y: position === 'top' ? 0 : workH - 64,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  practiceWindow.setAlwaysOnTop(true, 'screen-saver')
  practiceWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  practiceWindow.setIgnoreMouseEvents(false)

  if (process.env['ELECTRON_RENDERER_URL']) {
    practiceWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}?mode=practice`)
  } else {
    practiceWindow.loadFile(join(__dirname, '../renderer/index.html'), { search: 'mode=practice' })
  }

  // La tira de práctica SIEMPRE se ve al 100%: su zoom no debe heredar ni
  // seguir al de la ventana principal cuando se cambia la escala de la UI.
  practiceWindow.webContents.on('did-finish-load', () => {
    if (practiceWindow && !practiceWindow.isDestroyed()) {
      practiceWindow.webContents.setZoomFactor(1)
      practiceWindow.webContents.send('practice-combo', payload())
      practiceWindow.webContents.send('practice-mini', getUserPrefs().practiceMini)
    }
  })

  // La mini-tarjeta se arrastra con el mouse: su posición se guarda con
  // debounce en cada movimiento para restaurarla en la próxima sesión.
  let posTimer: ReturnType<typeof setTimeout> | null = null
  practiceWindow.on('move', () => {
    if (posTimer) clearTimeout(posTimer)
    posTimer = setTimeout(() => {
      if (!practiceWindow || practiceWindow.isDestroyed() || !getUserPrefs().practiceMini) return
      const [x, y] = practiceWindow.getPosition()
      setUserPref('practiceMiniPos', { x, y })
    }, 400)
  })

  practiceWindow.on('closed', () => {
    practiceWindow = null
  })
}

export function registerPracticeIpc(): void {
  // La ventana de práctica llamará a esto en cuanto esté lista
  ipcMain.handle('get-pending-practice-combo', () => payload());

  ipcMain.on('practice-navigate', (_, dir: number) => {
    navigatePractice(dir === -1 ? -1 : 1)
  })

  ipcMain.on('close-practice', () => {
    closePracticeWindow()
  })

  ipcMain.handle('get-practice-mini', () => getUserPrefs().practiceMini)
  ipcMain.on('toggle-practice-mini', () => applyPracticeMini())

  // Estadísticas de práctica: heartbeat de 1s desde la tira + consulta
  ipcMain.handle('get-practice-stats', () => readPracticeStats())
  ipcMain.on('practice-heartbeat', () => tickPracticeStats())
}

// -------------------------------------------------
// Racha de días y tiempo de práctica de hoy (persistido en user-prefs).
// Se lleva en memoria y se escribe a disco cada 30 s, no en cada tick.
// -------------------------------------------------

let statsMemo: { lastDate?: string; streak?: number; todaySeconds?: number } | null = null

const todayKey = (): string => new Date().toISOString().slice(0, 10)
const yesterdayKey = (): string => new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)

/** Carga (una vez) y maneja el cambio de día de las estadísticas. */
function liveStats(): { lastDate?: string; streak?: number; todaySeconds?: number } {
  statsMemo ??= { ...getUserPrefs().practiceStats }
  const today = todayKey()
  if (statsMemo.lastDate !== today) {
    // Nuevo día: la racha continúa solo si ayer se practicó
    statsMemo.streak = statsMemo.lastDate === yesterdayKey() ? (statsMemo.streak ?? 0) + 1 : 1
    statsMemo.todaySeconds = 0
    statsMemo.lastDate = today
  }
  return statsMemo
}

function readPracticeStats(): { todaySeconds: number; streak: number } {
  const s = liveStats()
  return { todaySeconds: s.todaySeconds ?? 0, streak: s.streak ?? 0 }
}

function tickPracticeStats(): void {
  const s = liveStats()
  s.todaySeconds = (s.todaySeconds ?? 0) + 1
  if (s.todaySeconds === 1 || s.todaySeconds % 30 === 0) {
    setUserPref('practiceStats', { ...s })
  }
}

// -------------------------------------------------
// Modo mini-tarjeta: la tira se encoge a una tarjeta anclada a la esquina,
// arrastrable desde su cuerpo (drag-region) y con posición persistida.
// -------------------------------------------------

function applyLayout(): void {
  if (!practiceWindow || practiceWindow.isDestroyed()) return
  const { width: screenW, height: workH, x: workX, y: workY } = screen.getPrimaryDisplay().workArea
  const mini = getUserPrefs().practiceMini
  if (mini) {
    const pos = getUserPrefs().practiceMiniPos
    const w = Math.min(300, screenW)
    const h = 52
    // Sin posición guardada válida: esquina superior derecha
    const x = pos && Number.isFinite(pos.x) && pos.x > workX - w && pos.x < workX + screenW ? pos.x : workX + screenW - w - 8
    const y = pos && Number.isFinite(pos.y) && pos.y > workY - h && pos.y < workY + workH ? pos.y : workY + 8
    practiceWindow.setBounds({ x, y, width: w, height: h })
  } else {
    const position = getUserPrefs().practicePosition === 'bottom' ? 'bottom' : 'top'
    const [curX] = practiceWindow.getPosition()
    practiceWindow.setBounds({ x: Math.min(Math.max(curX, workX), workX + screenW - screenW), y: position === 'top' ? workY : workY + workH - 64, width: screenW, height: 64 })
  }
  practiceWindow.webContents.send('practice-mini', getUserPrefs().practiceMini)
}

/** Cambia entre tira completa y mini-tarjeta (persistido). */
export function applyPracticeMini(): void {
  setUserPref('practiceMini', !getUserPrefs().practiceMini)
  applyLayout()
}

export function getPracticeMini(): boolean {
  return getUserPrefs().practiceMini
}

/** Recoloca la tira abierta según la preferencia (arriba/abajo). */
export function repositionPractice(): void {
  if (!practiceWindow || practiceWindow.isDestroyed()) return
  if (getUserPrefs().practiceMini) { applyLayout(); return }
  const position = getUserPrefs().practicePosition === 'bottom' ? 'bottom' : 'top'
  const { height: workH } = screen.getPrimaryDisplay().workAreaSize
  const [x] = practiceWindow.getPosition()
  const height = practiceWindow.getBounds().height
  practiceWindow.setPosition(x, position === 'top' ? 0 : workH - height)
}

/** Cierra la tira de práctica (también al cerrar el programa: no debe sobrevivir). */
export function closePracticeWindow(): void {
  if (practiceWindow && !practiceWindow.isDestroyed()) practiceWindow.close()
  practiceWindow = null
  pendingCombo = null
  drillList = []
  drillIndex = -1
  updatePresence(null)
}
