import { screen } from 'electron'
import Store from 'electron-store'

interface WindowBounds {
  x?: number
  y?: number
  width: number
  height: number
}

interface WindowStateSchema {
  bounds?: WindowBounds
}

const store = new Store<WindowStateSchema>({
  name: 'window-state',
  defaults: {},
})

const MIN_WIDTH = 400
const MIN_HEIGHT = 200

/**
 * Estado de la ventana guardado, validado contra las pantallas actuales.
 * Devuelve null si no hay estado o si la ventana quedaría fuera de pantalla
 * (p. ej. se desconectó el monitor secundario).
 */
export function loadWindowState(): { x?: number; y?: number; width: number; height: number } | null {
  const b = store.get('bounds')
  if (!b || typeof b.width !== 'number' || typeof b.height !== 'number') return null
  if (b.width < MIN_WIDTH || b.height < MIN_HEIGHT) return null

  if (typeof b.x !== 'number' || typeof b.y !== 'number') {
    return { width: b.width, height: b.height }
  }

  // Debe solaparse con el área de trabajo de alguna pantalla conectada
  const visible = screen.getAllDisplays().some((d) => {
    const wa = d.workArea
    return b.x! < wa.x + wa.width && b.x! + b.width > wa.x && b.y! < wa.y + wa.height && b.y! + b.height > wa.y
  })
  if (!visible) return null

  return { x: b.x, y: b.y, width: b.width, height: b.height }
}

/** Guarda los bounds actuales (ignora minimizada/maximizada). */
export function saveWindowState(win: import('electron').BrowserWindow): void {
  if (win.isDestroyed() || win.isMinimized() || win.isMaximized()) return
  store.set('bounds', win.getBounds())
}
