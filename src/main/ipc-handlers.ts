import { ipcMain, BrowserWindow, app, dialog, screen } from 'electron';
import { execFile } from 'child_process';
import { join } from 'path';
import { readFile, writeFile } from 'fs/promises';
import * as cheerio from 'cheerio';
import { autoUpdater } from 'electron-updater';
import { scrapeCharacterCombos } from './scraper';
import { getCachedCombos, setCachedCombos, clearCache, getCacheInfo } from './cache';
import { CHARACTER_NAMES, CHARACTER_SLUGS } from '../renderer/types/combo';
import { openPracticeWindow, registerPracticeIpc } from './practiceWindow';
import { getFavorites, isFavorite, addFavorite, removeFavorite } from './favorites';
import { comboHash } from '../shared/comboHash';
import { fetchPlayerStatsFromWeb, fetchPlayerStatsWithApiKey } from './playerScraper';
import Store from 'electron-store';
import type { Combo } from '../renderer/types/combo';

// -------------------------------------------------
// Store definition
// -------------------------------------------------
const store = new Store<{
  customCombos: Combo[];
  seenHashes: Record<string, string[]>;
  customNotes: Record<string, string>;
  learnedCombos: string[];
}>({
  name: 'combo-extras',
  defaults: { customCombos: [], seenHashes: {}, customNotes: {}, learnedCombos: [] }
});

async function getSlugForCharacter(name: string): Promise<string> {
  console.log('[getSlugForCharacter] start for', name);
  try {
    const cleanName = name.replace(/combos?/gi, '').trim().toLowerCase();
    const localMatch = Object.keys(CHARACTER_SLUGS).find(k => k.toLowerCase() === cleanName);
    if (localMatch) return CHARACTER_SLUGS[localMatch];
    const res = await fetch('https://tekken8combo.kagewebsite.com/all-combos/');
    const html = await res.text();
    console.log('[getSlugForCharacter] fetched HTML length', html.length);
    const $ = cheerio.load(html);
    let foundSlug = cleanName.replace(/\s+/g, '-');
    $('a[href*="/combos-"]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      const match = href.match(/\/combos-([a-z0-9-]+)\/?$/);
      if (match) {
        const slug = match[1];
        const text = $(el).text().replace(/combos?/gi, '').trim().toLowerCase();
        if (text === cleanName || text.includes(cleanName)) foundSlug = slug;
      }
    });
    console.log('[getSlugForCharacter] slug returned:', foundSlug);
    return foundSlug;
  } catch {
    console.log('[getSlugForCharacter] fallback to slug generation for', name);
    return name.toLowerCase().replace(/\s+/g, '-');
  }
}

export function registerIpcHandlers(win: BrowserWindow): void {
  registerPracticeIpc();

  // -------------------------------------------------
  // Favoritos, Aprendidos, Notas, Exportar/Importar Perfil
  // -------------------------------------------------
  ipcMain.handle('get-favorites', () => getFavorites());
  ipcMain.handle('toggle-favorite', (_, id: string) => {
    if (isFavorite(id)) { removeFavorite(id); return false; }
    addFavorite(id);
    return true;
  });
  ipcMain.handle('is-favorite', (_, id: string) => isFavorite(id));
  ipcMain.handle('get-learned-combos', () => store.get('learnedCombos'));
  ipcMain.handle('toggle-learned', (_, id: string) => {
    const list = store.get('learnedCombos');
    if (list.includes(id)) {
      store.set('learnedCombos', list.filter(x => x !== id));
      return false;
    } else {
      store.set('learnedCombos', [...list, id]);
      return true;
    }
  });
  ipcMain.handle('save-custom-note', (_, { comboId, note }) => {
    const notes = store.get('customNotes');
    if (note.trim()) {
      notes[comboId] = note.trim();
    } else {
      delete notes[comboId];
    }
    store.set('customNotes', notes);
    return { ok: true };
  });
  ipcMain.handle('get-custom-notes', () => store.get('customNotes'));
  ipcMain.handle('export-profile', async () => {
    const { filePath } = await dialog.showSaveDialog(win, { title: 'Exportar Perfil', defaultPath: 'tekken8-profile.json', filters: [{ name: 'JSON', extensions: ['json'] }] });
    if (!filePath) return { ok: false, error: 'Cancelado' };
    const data = {
      customCombos: store.get('customCombos'),
      notes: store.get('customNotes'),
      learned: store.get('learnedCombos'),
      favorites: getFavorites(),
    };
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return { ok: true };
  });
  ipcMain.handle('import-profile', async () => {
    const { filePaths } = await dialog.showOpenDialog(win, { title: 'Importar Perfil', properties: ['openFile'], filters: [{ name: 'JSON', extensions: ['json'] }] });
    if (!filePaths || filePaths.length === 0) return { ok: false, error: 'Cancelado' };
    try {
      const data = JSON.parse(await readFile(filePaths[0], 'utf-8'));
      if (data.customCombos) store.set('customCombos', [...store.get('customCombos'), ...data.customCombos]);
      if (data.notes) store.set('customNotes', { ...store.get('customNotes'), ...data.notes });
      if (data.learned) store.set('learnedCombos', [...new Set([...store.get('learnedCombos'), ...data.learned])]);
      if (data.favorites) data.favorites.forEach((id: string) => addFavorite(id));
      return { ok: true, added: data.customCombos?.length || 0 };
    } catch (err) {
      return { ok: false, error: 'Error' };
    }
  });

  // -------------------------------------------------
  // Fetch Combos
  // -------------------------------------------------
  ipcMain.handle('fetch-combos', async (_, character: string) => {
    console.log('[fetch-combos] called for character:', character);
    try {
      let combos: Combo[] = [];
      let fromCache = false;
      const slug = await getSlugForCharacter(character);
      console.log('[fetch-combos] slug for', character, ':', slug);
      const cached = getCachedCombos(character);
      if (cached) {
        combos = cached;
        fromCache = true;
        console.log('[fetch-combos] using cache fromCache:', fromCache);
      } else {
        const res = await scrapeCharacterCombos(slug, character);
        combos = res.combos;
        setCachedCombos(character, combos, res.rawHtml);
      }
      console.log('[fetch-combos] combos length:', combos.length);
      const notes = store.get('customNotes');
      const learned = store.get('learnedCombos');
      const vistos = new Set(store.get('seenHashes')[character] ?? []);
      const seenNow: string[] = [];
      let nuevos = 0;
      const procesados = combos.map((c) => {
        const h = comboHash(c);
        const esNuevo = !fromCache && !vistos.has(h);
        if (esNuevo) nuevos++;
        seenNow.push(h);
        return { ...c, hash: h, isNew: esNuevo, customNote: notes[c.id] || '', isLearned: learned.includes(c.id) };
      });
      if (!fromCache) store.set('seenHashes', { ...store.get('seenHashes'), [character]: seenNow });
      return { combos: procesados, fromCache, fetchedAt: Date.now(), nuevos };
    } catch (err) {
      console.error('[fetch-combos] error:', (err as Error).message);
      const cachedAny = getCachedCombos(character);
      if (cachedAny) {
        const notes = store.get('customNotes');
        const learned = store.get('learnedCombos');
        const vistos = new Set(store.get('seenHashes')[character] ?? []);
        const seenNow: string[] = [];
        const procesados = cachedAny.map((c) => {
          const h = comboHash(c);
          seenNow.push(h);
          return { ...c, hash: h, isNew: false, customNote: notes[c.id] || '', isLearned: learned.includes(c.id) };
        });
        return { combos: procesados, fromCache: true, fetchedAt: Date.now(), nuevos: 0 };
      }
      // Fallback default combo if offline and no cache
      const defaultCombo: Combo = {
        id: `${character}-default-1`,
        character,
        notation: 'df+2 ► f,N,d,d/f+2',
        notationImages: [],
        damage: 55,
        hits: 5,
        version: 'v1.0',
        creator: 'Tekken 8 Overlay',
        notes: 'Modo Offline / No se pudo conectar a la web',
        tags: ['Launch'],
      };
      return { combos: [defaultCombo], fromCache: true, fetchedAt: Date.now(), nuevos: 0 };
    }
  });

  // -------------------------------------------------
  // Auto‑updater
  // -------------------------------------------------
  ipcMain.on('start-update-download', () => {
    autoUpdater.downloadUpdate().catch((err) => console.error('[autoUpdater] download falló:', err.message));
  });

  // Solo se descarga cuando el usuario pulsa "Actualizar ahora"
  autoUpdater.autoDownload = false;

  autoUpdater.on('update-available', (info) => {
    if (!win.isDestroyed()) win.webContents.send('update-available', { version: info.version });
  });

  autoUpdater.on('update-downloaded', () => {
    if (!win.isDestroyed()) win.webContents.send('update-downloaded');
  });

  autoUpdater.on('error', (err) => console.error('[autoUpdater]', err.message));

  if (app.isPackaged) {
    autoUpdater
      .checkForUpdates()
      .catch((err) => console.error('[autoUpdater] check falló:', err.message));
  }

  ipcMain.on('quit-and-install', () => {
    autoUpdater.quitAndInstall();
  });

  // -------------------------------------------------
  // Additional IPC handlers
  // -------------------------------------------------
  ipcMain.handle('get-dynamic-characters', async () => {
    return { ...CHARACTER_SLUGS };
  });
  ipcMain.handle('sync-all-characters', async () => {
    return { total: 0, nuevos: 0 };
  });
  ipcMain.handle('add-custom-combo', (_, data: Partial<Combo>) => {
    const list = store.get('customCombos') ?? [];
    const newCombo: Combo = {
      id: `custom-${Date.now()}`,
      character: data.character || 'Unknown',
      notation: data.notation || '',
      notationImages: data.notationImages || [],
      damage: data.damage || 0,
      hits: data.hits || 0,
      version: data.version || '',
      difficulty: data.difficulty,
      tags: data.tags || [],
      creator: data.creator || '',
      source: data.source || '',
      notes: data.notes || '',
    };
    store.set('customCombos', [newCombo, ...list]);
    return { ok: true, combo: newCombo };
  });
  ipcMain.handle('get-custom-combos', (_, character?: string) => {
    const list = store.get('customCombos') ?? [];
    if (character) {
      return list.filter(c => c.character.toLowerCase() === character.toLowerCase());
    }
    return list;
  });
  ipcMain.handle('delete-custom-combo', (_, id: string) => {
    const list = store.get('customCombos') ?? [];
    store.set('customCombos', list.filter(c => c.id !== id));
    return { ok: true };
  });
  ipcMain.handle('save-custom-combos', (_, character: string, combos: Combo[]) => {
    const list = store.get('customCombos') ?? [];
    const filtered = list.filter(c => c.character.toLowerCase() !== character.toLowerCase());
    const updated = [...filtered, ...combos];
    store.set('customCombos', updated);
    return { ok: true };
  });
  ipcMain.handle('fetch-youtube-meta', async (_, url: string) => {
    try {
      const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
      if (!res.ok) return { ok: false, error: 'No se pudo obtener metadatos de YouTube' };
      const data = await res.json();
      return {
        ok: true,
        title: data.title,
        uploader: data.author_name,
        source: url,
      };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  });
  ipcMain.handle('get-character-list', () => CHARACTER_NAMES);
  ipcMain.handle('clear-cache', (_, character?: string) => {
    clearCache(character);
    return true;
  });
  ipcMain.handle('fetch-player-stats', (_, tekkenId: string) => fetchPlayerStatsFromWeb(tekkenId));
  ipcMain.handle('fetch-player-stats-api-key', (_, { apiKey, tekkenId }) => fetchPlayerStatsWithApiKey(apiKey, tekkenId));
  // -------------------------------------------------
  // Ventana: cerrar, minimizar, opacidad, colapsar, horizontal
  // -------------------------------------------------
  let isHorizontal = false;
  let isCollapsed = false;
  let collapsedBounds: Electron.Rectangle | null = null;
  let verticalBounds: Electron.Rectangle | null = null;

  ipcMain.on('close-window', () => {
    if (!win.isDestroyed()) win.close();
  });

  ipcMain.on('minimize-window', () => {
    if (!win.isDestroyed()) win.minimize();
  });

  ipcMain.on('set-ignore-mouse', (_, ignore: boolean) => {
    if (!win.isDestroyed()) win.setIgnoreMouseEvents(ignore, { forward: true });
  });

  ipcMain.on('set-opacity', (_, opacity: number) => {
    if (win.isDestroyed()) return;
    const value = Number(opacity);
    if (Number.isFinite(value)) win.setOpacity(Math.min(1, Math.max(0.2, value)));
  });

  ipcMain.on('toggle-collapse', () => {
    if (win.isDestroyed()) return;
    const bounds = win.getBounds();
    isCollapsed = !isCollapsed;
    if (isCollapsed) {
      collapsedBounds = bounds;
      win.setSize(bounds.width, Math.min(bounds.height, 64));
    } else if (collapsedBounds) {
      win.setBounds(collapsedBounds);
      collapsedBounds = null;
    }
  });

  ipcMain.on('toggle-horizontal', () => {
    if (win.isDestroyed()) return;
    const display = screen.getDisplayMatching(win.getBounds());
    isHorizontal = !isHorizontal;
    if (isHorizontal) {
      verticalBounds = win.getBounds();
      win.setResizable(false);
      win.setBounds({
        x: display.workArea.x,
        y: display.workArea.y,
        width: display.workArea.width,
        height: 300,
      });
    } else {
      win.setResizable(true);
      win.setBounds(
        verticalBounds ?? {
          x: display.workArea.x + 80,
          y: display.workArea.y + 80,
          width: 600,
          height: 600,
        }
      );
      verticalBounds = null;
    }
    win.webContents.send('horizontal-changed', isHorizontal);
  });

  // -------------------------------------------------
  // Modo práctica
  // -------------------------------------------------
  ipcMain.on('open-practice', (_, combo: Combo) => {
    if (combo) openPracticeWindow(combo);
  });

  // -------------------------------------------------
  // Inicio automático con Windows
  // -------------------------------------------------
  ipcMain.handle('set-auto-launch', (_, enable: boolean) => {
    app.setLoginItemSettings({ openAtLogin: enable, args: ['--hidden'] });
    return app.getLoginItemSettings().openAtLogin;
  });

  // -------------------------------------------------
  // Sincronización de todos los personajes
  // -------------------------------------------------
  let syncRunning = false;
  ipcMain.handle('sync-all-characters', async () => {
    if (syncRunning) return { total: 0, nuevos: 0, alreadyRunning: true };
    syncRunning = true;
    const characters = CHARACTER_NAMES;
    let total = 0;
    let nuevos = 0;

    try {
      for (let i = 0; i < characters.length; i++) {
        const name = characters[i];
        if (win.isDestroyed()) break;
        win.webContents.send('sync-progress', { done: i, total: characters.length, current: name });

        try {
          const slug = await getSlugForCharacter(name);
          const result = await scrapeCharacterCombos(slug, name);
          const previous = new Set((store.get('seenHashes') ?? {})[name] ?? []);
          nuevos += result.combos.filter((c) => !previous.has(comboHash(c))).length;
          total += result.combos.length;
          setCachedCombos(name, result.combos, result.rawHtml);
          store.set('seenHashes', {
            ...(store.get('seenHashes') ?? {}),
            [name]: result.combos.map((c) => comboHash(c)),
          });
        } catch (err) {
          console.error('[sync-all] fallo con', name, (err as Error).message);
        }
      }

      if (!win.isDestroyed()) {
        win.webContents.send('sync-progress', { done: characters.length, total: characters.length, current: '' });
      }
      return { total, nuevos };
    } finally {
      syncRunning = false;
    }
  });

  ipcMain.handle('get-auto-launch', () => {
    // Devuelve el estado actual de “auto‑launch” del cliente
    return app.getLoginItemSettings().openAtLogin;
  });
}