import { ipcMain, BrowserWindow, app, dialog, globalShortcut, screen } from 'electron';
import { execFile } from 'child_process';
import { join, extname } from 'path';
import { readFile, writeFile, copyFile, readdir, stat, mkdir, unlink } from 'fs/promises';
import * as cheerio from 'cheerio';
import { autoUpdater } from 'electron-updater';
import { scrapeCharacterCombos, discoverCharacters, type DiscoveredCharacter } from './scraper';
import { getCachedCombos, setCachedCombos, clearCache, remapAllCachedIds, getCachedSlug, setCachedSlug, getAllCachedCombos, getAllCacheInfo, migrateVariantCacheKeys, repairSlugCache } from './cache';
import { CHARACTER_NAMES, CHARACTER_SLUGS, normalizeCharName } from '../renderer/types/combo';
import { openPracticeWindow, registerPracticeIpc, repositionPractice } from './practiceWindow';
import { registerVideoIpc, closeVideoWindow } from './videoWindow';
import { ensureSharePortrait } from './bannerProtocol';
import { getFavorites, isFavorite, addFavorite, removeFavorite, setFavorites } from './favorites';
import { comboHash, makeComboId } from '../shared/comboHash';
import { getUserPrefs, mergeUserPrefs, setUserPref } from './userPrefs';
import { configurePresence, getPresenceStatus, updatePresence } from './discordPresence';
import { getHotkeyAccelerators, reapplyHotkeys, type HotkeyAction } from './hotkeys';
import Store from 'electron-store';
import type { Combo } from '../renderer/types/combo';

// -------------------------------------------------
// Store definition
// -------------------------------------------------
const store = new Store<{
  seenHashes: Record<string, string[]>;
  customNotes: Record<string, string>;
  learnedCombos: string[];
  idsMigrated: boolean;
  /** Combos nuevos detectados (p. ej. durante el Sync) aún no revisados por el usuario. */
  pendingNews: Record<string, number>;
  /** Hashes de los combos nuevos sin revisar, por personaje (para el badge NUEVO). */
  newHashes: Record<string, string[]>;
}>({
  name: 'combo-extras',
  defaults: { seenHashes: {}, customNotes: {}, learnedCombos: [], idsMigrated: false, pendingNews: {}, newHashes: {} }
});

/**
 * Resuelve el slug de la web para un personaje. Se cachea por personaje: el
 * índice de la web solo se descarga la primera vez (o si se limpia la caché).
 */
async function getSlugForCharacter(name: string): Promise<string> {
  const cached = getCachedSlug(name);
  if (cached) return cached;

  const cleanName = name.replace(/combos?/gi, '').trim().toLowerCase();
  const localMatch = Object.keys(CHARACTER_SLUGS).find(k => k.toLowerCase() === cleanName);
  if (localMatch) {
    setCachedSlug(name, CHARACTER_SLUGS[localMatch]);
    return CHARACTER_SLUGS[localMatch];
  }

  try {
    const res = await fetch('https://tekken8combo.kagewebsite.com/all-combos/');
    const html = await res.text();
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
    setCachedSlug(name, foundSlug);
    return foundSlug;
  } catch {
    // Sin red no se cachea: así el próximo intento vuelve a resolver de verdad.
    return name.toLowerCase().replace(/\s+/g, '-');
  }
}

/**
 * Migración única de ids.
 *
 * Los ids antiguos eran `personaje-indice`, así que cualquier reorden en la web
 * hacía que favoritos, notas y combos aprendidos apuntaran a otro combo. Al
 * arrancar se reescriben el caché y los datos del usuario a ids estables por
 * contenido (`personaje-hash`). Es idempotente: queda marcada en `idsMigrated`.
 */
function migrateLegacyComboIds(): void {
  if (store.get('idsMigrated')) return;

  const mapping = remapAllCachedIds((character, combo) =>
    makeComboId(character, combo.notation, combo.creator)
  );
  const remap = (id: string) => mapping.get(id) ?? id;

  setFavorites(getFavorites().map(remap));
  store.set('learnedCombos', [...new Set(store.get('learnedCombos').map(remap))]);

  const notes = store.get('customNotes') ?? {};
  const migratedNotes: Record<string, string> = {};
  for (const [id, note] of Object.entries(notes)) migratedNotes[remap(id)] = note;
  store.set('customNotes', migratedNotes);

  store.set('idsMigrated', true);
  console.log(`[migration] ids reescritos: ${mapping.size}`);
}

/**
 * Migra nombres de personajes con sufijo "combos" ("Kazuya combos") que
 * podían quedar en descubrimientos antiguos: la clave debe ser el nombre limpio.
 */function normalizeDiscovered(raw: Record<string, string>): Record<string, string> {
  const known = new Set(Object.keys(CHARACTER_SLUGS).map(normalizeCharName));
  const seen = new Set<string>();
  const out: Record<string, string> = {};
  for (const [name, slug] of Object.entries(raw)) {
    const clean = name.replace(/combos?/gi, '').trim();
    if (!clean) continue;
    const key = normalizeCharName(clean);
    if (known.has(key) || seen.has(key)) continue;
    seen.add(key);
    out[clean] = slug;
  }
  return out;
}

/**
 * Respaldo automático del perfil: cada 7 días escribe el mismo contenido que
 * "Exportar perfil" en `userData/backups/perfil-<fecha>.json`, conservando
 * las 3 copias más recientes. Restaurar = importar ese JSON con ⬆.
 */
async function backupProfileIfDue(): Promise<void> {
  const dir = join(app.getPath('userData'), 'backups');
  await mkdir(dir, { recursive: true });
  const backups = (await readdir(dir)).filter((f) => /^perfil-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().reverse();
  if (backups[0]) {
    const last = await stat(join(dir, backups[0]));
    if (Date.now() - last.mtimeMs < 7 * 24 * 60 * 60 * 1000) return; // aún no toca
  }
  const data = buildProfileData();
  await writeFile(join(dir, `perfil-${new Date().toISOString().slice(0, 10)}.json`), JSON.stringify(data, null, 2), 'utf-8');
  // Rotación: solo quedan las 3 copias más nuevas
  for (const old of backups.slice(2)) await unlink(join(dir, old)).catch(() => {});
  console.log('[backup] perfil respaldado');
}

/** Contenido compartido entre "Exportar perfil" y el respaldo automático. */
function buildProfileData() {
  const { theme, language, tekkenId, rankData, customBannerUrl } = getUserPrefs();
  return {
    notes: store.get('customNotes'),
    learned: store.get('learnedCombos'),
    favorites: getFavorites(),
    prefs: { theme, language, tekkenId, rankData, customBannerUrl },
  };
}

export function registerIpcHandlers(win: BrowserWindow): void {
  try {
    migrateLegacyComboIds();
  } catch (err) {
    console.error('[migration] falló:', (err as Error).message);
  }

  // Claves de caché con variantes de nombre ("Roger Jr" → "Roger Jr.")
  try {
    migrateVariantCacheKeys();
  } catch (err) {
    console.error('[migración de caché] falló:', (err as Error).message);
  }

  // Mapa de slugs: purga objetos corruptos y canoniza el roster
  try {
    repairSlugCache();
  } catch (err) {
    console.error('[reparación de slugs] falló:', (err as Error).message);
  }

  registerPracticeIpc();
  registerVideoIpc();

  // Respaldo semanal del perfil (silencioso, en userData/backups)
  backupProfileIfDue().catch((err) => console.error('[backup] falló:', (err as Error).message));

  // -------------------------------------------------
  // Favoritos, Aprendidos, Notas, Exportar/Importar Perfil
  // -------------------------------------------------
  ipcMain.handle('get-favorites', () => getFavorites());
  ipcMain.handle('toggle-favorite', (_, id: string) => {
    if (isFavorite(id)) { removeFavorite(id); return false; }
    addFavorite(id);
    return true;
  });
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
  ipcMain.handle('export-profile', async () => {
    const { filePath } = await dialog.showSaveDialog(win, { title: 'Exportar Perfil', defaultPath: 'tekken8-profile.json', filters: [{ name: 'JSON', extensions: ['json'] }] });
    if (!filePath) return { ok: false, error: 'Cancelado' };
    await writeFile(filePath, JSON.stringify(buildProfileData(), null, 2), 'utf-8');
    return { ok: true };
  });
  ipcMain.handle('import-profile', async () => {
    const { filePaths } = await dialog.showOpenDialog(win, { title: 'Importar Perfil', properties: ['openFile'], filters: [{ name: 'JSON', extensions: ['json'] }] });
    if (!filePaths || filePaths.length === 0) return { ok: false, error: 'Cancelado' };
    try {
      const data = JSON.parse(await readFile(filePaths[0], 'utf-8'));
      if (data.notes && typeof data.notes === 'object') store.set('customNotes', { ...store.get('customNotes'), ...data.notes });
      if (Array.isArray(data.learned)) store.set('learnedCombos', [...new Set([...store.get('learnedCombos'), ...data.learned])]);
      if (Array.isArray(data.favorites)) data.favorites.forEach((id: string) => addFavorite(id));
      // Preferencias del perfil (tema, idioma, Tekken ID y ficha de rango)
      if (data.prefs && typeof data.prefs === 'object') mergeUserPrefs(data.prefs);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: 'Error' };
    }
  });

  // -------------------------------------------------
  // Preferencias de usuario (tema, idioma, recientes, ficha de rango)
  // -------------------------------------------------
  ipcMain.handle('get-user-prefs', () => getUserPrefs());
  ipcMain.handle('set-user-pref', (_, key: string, value: unknown) => {
    mergeUserPrefs({ [key]: value });
    return { ok: true };
  });

  // Escala de UI: zoom nativo de Chromium + ventana redimensionada en la misma
  // proporción y acotada a la pantalla, para que el contenido nunca se corte.
  let lastUiScale = getUserPrefs().uiScale || 1;
  ipcMain.handle('apply-ui-scale', (_, scale: number) => {
    // Máximo 125%: por encima, la UI deja de ser usable en pantallas normales
    const value = Math.min(typeof scale === 'number' && scale >= 0.5 && scale <= 3 ? scale : lastUiScale, 1.25);
    if (!win.isDestroyed()) {
      const [w, h] = win.getContentSize();
      const ratio = value / lastUiScale;
      win.webContents.setZoomFactor(value);
      win.setContentSize(Math.round(w * ratio), Math.round(h * ratio));
      // Si la ventana agrandada no cabe en la pantalla, acotarla dentro del área útil
      const b = win.getBounds();
      const wa = screen.getDisplayMatching(b).workArea;
      const width = Math.min(b.width, wa.width);
      const height = Math.min(b.height, wa.height);
      const x = Math.max(wa.x, Math.min(b.x, wa.x + wa.width - width));
      const y = Math.max(wa.y, Math.min(b.y, wa.y + wa.height - height));
      win.setBounds({ x, y, width, height });
    }
    lastUiScale = value;
    return { ok: true };
  });
  // Migración única desde localStorage: el renderer envía los valores que
  // guardaba antes y el main los adopta como fuente única de verdad.
  ipcMain.handle('migrate-legacy-prefs', (_, patch: Record<string, unknown>) => {
    if (patch && typeof patch === 'object') mergeUserPrefs(patch);
    return getUserPrefs();
  });

  // -------------------------------------------------
  // Fetch Combos
  // -------------------------------------------------
  ipcMain.handle('fetch-combos', async (_, character: string) => {
    try {
      let combos: Combo[] = [];
      let fromCache = false;
      let nuevos = 0;
      const slug = await getSlugForCharacter(character);
      const cached = getCachedCombos(character);
      // Hashes de combos nuevos sin revisar (p. ej. detectados en un Sync)
      const pendingNew = new Set((store.get('newHashes') ?? {})[character] ?? []);

      if (cached) {
        // Vista desde el caché (típico tras un Sync): los combos nuevos sin
        // revisar llevan el badge NUEVO
        fromCache = true;
        combos = cached;
      } else {
        // Fresh scrape: lo que no se haya visto antes es nuevo
        const res = await scrapeCharacterCombos(slug, character);
        combos = res;
        // No cachear resultados vacíos: una entrada vacía con timestamp
        // fresco haría creer que el caché es válido (puntito verde sin datos)
        if (res.length > 0) setCachedCombos(character, combos);
      }

      const notes = store.get('customNotes');
      const learned = store.get('learnedCombos');
        // Hashes calculados una sola vez y reutilizados para el badge,
        // las notas y el registro de vistos
        const vistos = new Set(store.get('seenHashes')[character] ?? []);
        const hashes = new Map<string, string>();
        const procesados = combos.map((c) => {
          const h = comboHash(c);
          hashes.set(c.id, h);
          const esNuevo = fromCache ? pendingNew.has(h) : !vistos.has(h);
          if (esNuevo) nuevos++;
          return { ...c, hash: h, isNew: esNuevo, customNote: notes[c.id] || '', isLearned: learned.includes(c.id) };
        });

        if (!fromCache) {
          store.set('seenHashes', { ...store.get('seenHashes'), [character]: combos.map((c) => hashes.get(c.id)!) });
        }

      // El usuario está viendo este personaje ahora: se consume su noticia
      // pendiente y su badge (los marcados acaba de verlos en pantalla).
      const pn = { ...(store.get('pendingNews') ?? {}) };
      if (pn[character]) { pn[character] = 0; store.set('pendingNews', pn) }
      const nh = { ...(store.get('newHashes') ?? {}) };
      if (nh[character]?.length) { delete nh[character]; store.set('newHashes', nh) }

      return { combos: procesados, fromCache, fetchedAt: Date.now(), nuevos };
    } catch (err) {
      console.error('[fetch-combos] error:', (err as Error).message);
      const cachedAny = getCachedCombos(character);
      if (cachedAny) {
        const pendingNew = new Set((store.get('newHashes') ?? {})[character] ?? []);
        const notes = store.get('customNotes');
        const learned = store.get('learnedCombos');
        const procesados = cachedAny.map((c) => ({
          ...c,
          hash: comboHash(c),
          isNew: pendingNew.has(comboHash(c)),
          customNote: notes[c.id] || '',
          isLearned: learned.includes(c.id),
        }));
        const pn = { ...(store.get('pendingNews') ?? {}) };
        if (pn[character]) { pn[character] = 0; store.set('pendingNews', pn) }
        const nh = { ...(store.get('newHashes') ?? {}) };
        if (nh[character]?.length) { delete nh[character]; store.set('newHashes', nh) }
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
    return { ...CHARACTER_SLUGS, ...normalizeDiscovered(getUserPrefs().discoveredCharacters) };
  });
  ipcMain.handle('clear-cache', (_, character?: string) => {
    clearCache(character);
    return true;
  });
  // -------------------------------------------------
  // Ventana: cerrar, minimizar, opacidad
  // -------------------------------------------------
  ipcMain.on('close-window', () => {
    // No cerrar en medio de una sincronización de todos los personajes:
    // avisamos a la UI (toast) y el usuario decide reintentar después.
    if (syncRunning) {
      if (!win.isDestroyed()) win.webContents.send('sync-in-progress');
      return;
    }
    if (!win.isDestroyed()) win.close();
  });

  ipcMain.on('minimize-window', () => {
    if (!win.isDestroyed()) win.minimize();
  });

  ipcMain.on('set-opacity', (_, opacity: number) => {
    if (win.isDestroyed()) return;
    const value = Number(opacity);
    if (Number.isFinite(value)) win.setOpacity(Math.min(1, Math.max(0.2, value)));
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
    if (syncRunning) return { total: 0, nuevos: 0, failed: [], alreadyRunning: true };
    syncRunning = true;
    // --- Descubrimiento de personajes nuevos (DLC) ---
    // El índice de la web se revisa en cada Sync: si aparece un slug que no
    // conocemos, se registra y se scrapea en el mismo pase (con badge NUEVO).
    const knownNames = new Set(
      Object.keys(CHARACTER_SLUGS).map(normalizeCharName),
    );
    let discoveredNew: DiscoveredCharacter[] = [];
    try {
      const found = await discoverCharacters();
      const disc = { ...normalizeDiscovered(getUserPrefs().discoveredCharacters) };
      const discKeys = new Set(Object.keys(disc).map(normalizeCharName));
      for (const d of found) {
        const clean = d.name.replace(/combos?/gi, '').trim();
        const key = normalizeCharName(clean);
        if (!clean || knownNames.has(key) || discKeys.has(key)) continue;
        discKeys.add(key);
        disc[clean] = d.slug;
        discoveredNew.push({ name: clean, slug: d.slug });
      }
      // Persistir SIEMPRE la lista normalizada: auto-repara duplicados legacy
      // (p. ej. "Roger Jr" guardado aunque "Roger Jr." ya existía)
      setUserPref('discoveredCharacters', disc);
    } catch (err) {
      console.error('[sync-all] descubrimiento falló:', (err as Error).message);
    }

    const characters = [...CHARACTER_NAMES, ...discoveredNew.map((d) => d.name)];
    let total = 0;
    let nuevos = 0;
    const failed: string[] = [];

    try {
      for (let i = 0; i < characters.length; i++) {
        const name = characters[i];
        if (win.isDestroyed()) break;
        win.webContents.send('sync-progress', { done: i, total: characters.length, current: name });
        // Reflejar el progreso en la barra de tareas
        win.setProgressBar(i / characters.length);

        try {
          const disc = getUserPrefs().discoveredCharacters;
          const slug = discoveredNew.some((d) => d.name === name)
            ? disc[name]
            : await getSlugForCharacter(name);
          const result = await scrapeCharacterCombos(slug, name);
          if (result.length === 0) {
            // Scrape sin combos: no es un éxito silencioso. Purga cualquier
            // entrada vacía previa (como la de "Yujiro Hanma") y avisa.
            clearCache(name);
            failed.push(name);
            continue;
          }
          const previous = new Set((store.get('seenHashes') ?? {})[name] ?? []);
          // Hash de cada combo calculado una sola vez para todo el proceso
          const hashes = result.map((c) => comboHash(c));
          const nuevosHashes = result.filter((_, i) => !previous.has(hashes[i])).map((_, i) => hashes[i]);
          const nuevosChar = nuevosHashes.length;
          nuevos += nuevosChar;
          total += result.length;
          if (result.length > 0) setCachedCombos(name, result);
          store.set('seenHashes', {
            ...(store.get('seenHashes') ?? {}),
            [name]: hashes,
          });
          // Pendiente de revisar: se notificará al arrancar (get-pending-news)
          const pn = { ...(store.get('pendingNews') ?? {}) };
          pn[name] = nuevosChar;
          store.set('pendingNews', pn);
          const nh = { ...(store.get('newHashes') ?? {}) };
          nh[name] = nuevosHashes;
          store.set('newHashes', nh);
        } catch (err) {
          // Estado de sync honesto: acumulamos los personajes que fallaron
          console.error('[sync-all] fallo con', name, (err as Error).message);
          failed.push(name);
        }
      }

      if (!win.isDestroyed()) {
        win.webContents.send('sync-progress', { done: characters.length, total: characters.length, current: '' });
        if (discoveredNew.length > 0) {
          win.webContents.send('new-characters-found', { names: discoveredNew.map((d) => d.name) });
        }
      }
      return { total, nuevos, failed };
    } finally {
      syncRunning = false;
      if (!win.isDestroyed()) win.setProgressBar(-1);
    }
  });

  // -------------------------------------------------
  // Personalización visual
  // -------------------------------------------------
  // Elegir una imagen propia como fondo del banner: se copia a userData y
  // se referencia por file:// para que sobreviva a movimientos del original.
  ipcMain.handle('pick-banner-image', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Elegir fondo del banner',
      properties: ['openFile'],
      filters: [{ name: 'Imagen', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
    });
    if (canceled || !filePaths[0]) return { ok: false };
    try {
      const dest = join(app.getPath('userData'), `banner-custom${extname(filePaths[0]).toLowerCase()}`);
      await copyFile(filePaths[0], dest);
      // Protocolo propio banner:// (un <img file://> está bloqueado por webSecurity)
      const url = `banner://local/banner-custom${extname(filePaths[0]).toLowerCase()}`;
      setUserPref('customBannerUrl', url);
      return { ok: true, url };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  });

  // Posición de la tira de práctica: arriba <-> abajo (persistido)
  ipcMain.handle('toggle-practice-position', () => {
    const cur = getUserPrefs().practicePosition === 'bottom' ? 'bottom' : 'top';
    const next = cur === 'top' ? 'bottom' : 'top';
    setUserPref('practicePosition', next);
    repositionPractice();
    return { ok: true, position: next };
  });

  // -------------------------------------------------
  // Aviso de combos nuevos pendientes de revisar (se acumulan en el Sync)
  // -------------------------------------------------
  ipcMain.handle('get-pending-news', () => store.get('pendingNews') ?? {});

  // -------------------------------------------------
  // Progreso de maestría: combos aprendidos vs total cacheado, por personaje
  // -------------------------------------------------
  ipcMain.handle('get-mastery-progress', () => {
    const learned = new Set(store.get('learnedCombos') ?? []);
    const all = getAllCachedCombos();
    const progress: Record<string, { learned: number; total: number }> = {};
    for (const [character, combos] of Object.entries(all)) {
      progress[character] = {
        learned: combos.filter((c) => learned.has(c.id)).length,
        total: combos.length,
      };
    }
    return progress;
  });

  // -------------------------------------------------
  // "Mi rutina": favoritos de TODOS los personajes cacheados en una lista
  // continua, con separador por personaje (se construye en orden estable).
  // -------------------------------------------------
  ipcMain.handle('get-routine-combos', () => {
    const favSet = new Set(getFavorites());
    const notes = store.get('customNotes');
    const learned = new Set(store.get('learnedCombos'));
    const all = getAllCachedCombos();
    const disc = normalizeDiscovered(getUserPrefs().discoveredCharacters);
    const order = [...CHARACTER_NAMES, ...Object.keys(disc)];
    const out: Combo[] = [];
    for (const name of order) {
      const cached = all[name];
      if (!cached) continue;
      const favs = cached.filter((c) => favSet.has(c.id));
      if (favs.length === 0) continue;
      out.push({
        id: `__sep__${name}`, character: name, notation: '', notationImages: [],
        damage: 0, hits: 0, version: '', creator: '', notes: '', tags: [],
      } as unknown as Combo);
      for (const c of favs) {
        out.push({ ...c, hash: comboHash(c), isNew: false, customNote: notes[c.id] || '', isLearned: learned.has(c.id) });
      }
    }
    return out;
  });

  // -------------------------------------------------
  // Modo mini-tarjeta de la tira de práctica
  // (registrado en practiceWindow.ts junto a toggle-practice-mini)
  // -------------------------------------------------

  // -------------------------------------------------
  // Retrato local para la tarjeta de progreso (banner://, sin CORS)
  // -------------------------------------------------
  ipcMain.handle('get-share-portrait', async (_, name: string) => {
    try {
      const url = await ensureSharePortrait(String(name || ''));
      return { url };
    } catch {
      return { url: null };
    }
  });

  // -------------------------------------------------
  // Búsqueda global Ctrl+F: recorre el caché de TODOS los personajes
  // -------------------------------------------------
  ipcMain.handle('global-search', (_, query: string) => {
    const q = String(query || '').trim().toLowerCase();
    if (q.length < 2) return [];
    const all = getAllCachedCombos();
    const notes = store.get('customNotes');
    const out: Array<{ character: string; combo: Combo }> = [];
    for (const [character, combos] of Object.entries(all)) {
      for (const c of combos) {
        const note = notes[c.id] || '';
        const hit =
          c.notation.toLowerCase().includes(q) ||
          (c.creator || '').toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q)) ||
          note.toLowerCase().includes(q);
        if (hit) {
          out.push({ character, combo: { ...c, customNote: note } });
          if (out.length >= 60) return out;
        }
      }
    }
    return out;
  });

  // -------------------------------------------------
  // Frescura del caché por personaje (indicador del grid)
  // -------------------------------------------------
  ipcMain.handle('get-cache-freshness', () => getAllCacheInfo());

  // -------------------------------------------------
  // Respaldos: listar y restaurar desde Ayuda
  // -------------------------------------------------
  ipcMain.handle('list-backups', async () => {
    try {
      const dir = join(app.getPath('userData'), 'backups');
      const files = (await readdir(dir)).filter((f) => /^perfil-\d{4}-\d{2}-\d{2}\.json$/.test(f));
      const out = [];
      for (const file of files) {
        const st = await stat(join(dir, file));
        out.push({ file, mtimeMs: st.mtimeMs, size: st.size });
      }
      return out.sort((a, b) => b.mtimeMs - a.mtimeMs);
    } catch {
      return [];
    }
  });
  ipcMain.handle('restore-backup', async (_, file: string) => {
    // Solo nombres de respaldo válidos: nada de rutas arbitrarias
    if (!/^perfil-\d{4}-\d{2}-\d{2}\.json$/.test(String(file || ''))) {
      return { ok: false, error: 'invalid-name' };
    }
    try {
      const dir = join(app.getPath('userData'), 'backups');
      const data = JSON.parse(await readFile(join(dir, file), 'utf-8'));
      if (data.notes && typeof data.notes === 'object') store.set('customNotes', { ...store.get('customNotes'), ...data.notes });
      if (Array.isArray(data.learned)) store.set('learnedCombos', [...new Set([...store.get('learnedCombos'), ...data.learned])]);
      if (Array.isArray(data.favorites)) data.favorites.forEach((id: string) => addFavorite(id));
      if (data.prefs && typeof data.prefs === 'object') mergeUserPrefs(data.prefs);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  });

  // -------------------------------------------------
  // Discord Rich Presence
  // -------------------------------------------------
  ipcMain.handle('get-discord-status', () => getPresenceStatus());
  ipcMain.handle('set-discord-client-id', (_, clientId: string) => {
    setUserPref('discordClientId', typeof clientId === 'string' ? clientId.trim() : '');
    configurePresence();
    return { ok: true, status: getPresenceStatus() };
  });

  // -------------------------------------------------
  // Atajos reasignables
  // -------------------------------------------------
  ipcMain.handle('get-hotkeys', () => getHotkeyAccelerators());
  ipcMain.handle('set-hotkey', (_, action: string, accelerator: string) => {
    if (!['toggleClickThrough', 'toggleOverlay', 'streamerMode', 'practiceNext', 'practicePrev'].includes(action)) {
      return { ok: false, error: 'unknown-action' } as const;
    }
    if (!accelerator || accelerator.length > 30) {
      return { ok: false, error: 'invalid-accelerator' } as const;
    }
    const current = getHotkeyAccelerators();
    // No puede repetirse con otro atajo
    for (const [k, v] of Object.entries(current)) {
      if (k !== action && v === accelerator) return { ok: false, error: 'duplicate' } as const;
    }
    const previous = current[action as HotkeyAction];
    setUserPref('hotkeys', { ...current, [action]: accelerator });
    reapplyHotkeys(win);
    // Si el registro global falló (conflicto con el SO u otra app), revertimos
    if (!globalShortcut.isRegistered(accelerator)) {
      setUserPref('hotkeys', { ...current, [action]: previous });
      reapplyHotkeys(win);
      return { ok: false, error: 'register-failed' } as const;
    }
    return { ok: true } as const;
  });

  ipcMain.handle('get-auto-launch', () => {
    // Devuelve el estado actual de “auto‑launch” del cliente
    return app.getLoginItemSettings().openAtLogin;
  });
}