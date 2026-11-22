import { create } from 'zustand'
import { getTranslation, Language } from '../locales'
import type { Combo } from '../types/combo'
import { ROUTINE_ID } from '../types/combo'
import { pushToast } from './toastStore'
import { bannerPortrait } from '../utils/bannerAssets'

export type ThemeColor = 'dorado' | 'azul' | 'rojo' | 'verde'
/** Temas antiguos que se mapean a los nuevos al cargar preferencias. */
const LEGACY_THEME: Record<string, ThemeColor> = { rosa: 'dorado' }
export const normalizeTheme = (v: unknown): ThemeColor => LEGACY_THEME[v as string] ?? ((v as ThemeColor) in LEGACY_THEME || ['dorado', 'azul', 'rojo', 'verde'].includes(v as string) ? (v as ThemeColor) : 'dorado')

export interface FilterState {
  activeTags: string[]
  sort: 'default' | 'damage' | 'hits'
  searchQuery: string
  showOnlyFavorites: boolean
  showOnlyLearned: boolean
  minDamage: number
  difficulty: '' | 'facil' | 'media' | 'dificil'
}

interface OverlayStore {
  selectedCharacter: string | null
  setCharacter: (name: string) => void
  clearCharacter: () => void
  loadRoutine: () => Promise<void>
  combos: Combo[]
  loading: boolean
  error: string | null
  fromCache: boolean
  fetchedAt: number | null
  loadCombos: (character: string) => Promise<void>
  refreshCombos: () => Promise<void>
  isEditingLayout: boolean
  toggleEditingLayout: () => void
  filters: FilterState
  setFilter: (patch: Partial<FilterState>) => void
  toggleTag: (tag: string) => void
  clearFilters: () => void
  filteredCombos: () => Combo[]
  favoriteIds: Set<string>
  loadFavorites: () => Promise<void>
  isFavorite: (id: string) => boolean
  toggleFavorite: (id: string) => Promise<void>
  learnedIds: Set<string>
  isLearned: (id: string) => boolean
  toggleLearned: (id: string) => Promise<void>
  opacity: number
  setOpacity: (v: number) => void
  recentCombos: Combo[]
  showOnlyRecent: boolean
  setShowOnlyRecent: (val: boolean) => void
  addRecentCombo: (combo: Combo) => void
  isFocusMode: boolean
  toggleFocusMode: () => void
  themeColor: ThemeColor
  setThemeColor: (color: ThemeColor) => void
  dynamicCharacters: Record<string, string> | null
  loadDynamicCharacters: () => Promise<void>
  language: Language
  setLanguage: (lang: Language) => void
  t: (path: string, params?: Record<string, string | number>) => string
  isClickThrough: boolean
  toggleClickThrough: () => void
  setClickThrough: (val: boolean) => void
  /** Carga las preferencias (tema, idioma, recientes, ficha de rango) desde el main. */
  initPrefs: () => Promise<void>
  /** Escala global de la UI: 0.9 | 1 | 1.25 */
  uiScale: number
  setUiScale: (scale: number) => void
  /** URL del fondo propio del banner (o vacío si no se eligió). */
  customBannerUrl: string
  setCustomBannerUrl: (url: string) => void
  /** Botones de acción de las tarjetas siempre visibles (vs. hover). */
  alwaysShowActions: boolean
  setAlwaysShowActions: (v: boolean) => void
  /** Abrir en la última vista al arrancar. */
  restoreLastView: boolean
  setRestoreLastView: (v: boolean) => void
  /** Fondo negro puro (OLED) para juego nocturno. */
  oled: boolean
  setOled: (v: boolean) => void
  /** Lista en modo compacto (una línea por combo). */
  compactList: boolean
  setCompactList: (v: boolean) => void
  /** Sonido sutil al marcar un combo como aprendido. */
  soundFeedback: boolean
  setSoundFeedback: (v: boolean) => void
  /** Buscador global (Ctrl+F) abierto. */
  showGlobalSearch: boolean
  setShowGlobalSearch: (v: boolean) => void
  isCompactMode: boolean
  toggleCompactMode: () => void
  isTournamentMode: boolean
  toggleTournamentMode: () => void
  isStreamerMode: boolean
  toggleStreamerMode: () => void
  tekkenId: string
  setTekkenId: (id: string) => void
  rankData: any | null
  setRankData: (data: any) => void
  incrementWin: () => void
  incrementLoss: () => void
  resetSession: () => void
}

const defaultFilters: FilterState = { activeTags: [], sort: 'default', searchQuery: '', showOnlyFavorites: false, showOnlyLearned: false, minDamage: 0, difficulty: '' }
/** El tema es una paleta completa (acento + fondo) definida en globals.css. */
const applyTheme = (color: ThemeColor) => { document.documentElement.dataset.theme = color }
/** Escala global de la UI: se aplica con el zoom nativo de Chromium vía IPC. */
const applyUiScale = (scale: number) => { window.electronAPI.applyUiScale(scale).catch(() => {}) }

/** Claves legacy de localStorage que migraron al proceso main (user-prefs). */
const LEGACY_KEYS = ['t8_theme', 't8_lang', 't8_tekken_id', 't8_recent_combos', 't8_rank_data'] as const

function readLegacyPrefs(): Record<string, unknown> {
  const patch: Record<string, unknown> = {}
  try {
    const theme = localStorage.getItem('t8_theme'); if (theme) patch.theme = theme
    const lang = localStorage.getItem('t8_lang'); if (lang) patch.language = lang
    const tekkenId = localStorage.getItem('t8_tekken_id'); if (tekkenId) patch.tekkenId = tekkenId
    const recent = localStorage.getItem('t8_recent_combos'); if (recent) patch.recentCombos = JSON.parse(recent)
    const rank = localStorage.getItem('t8_rank_data'); if (rank) patch.rankData = JSON.parse(rank)
  } catch { /* valores corruptos se ignoran */ }
  return patch
}

/** Identificador especial de la vista "Mi rutina" (favoritos de todos). */
export const useOverlayStore = create<OverlayStore>((set, get) => {
  return {
    selectedCharacter: null, setCharacter: (name) => {
      window.electronAPI.setUserPref('lastCharacter', name).catch(() => {})
      if (name === ROUTINE_ID) { set({ selectedCharacter: ROUTINE_ID, combos: [], error: null, filters: defaultFilters, showOnlyRecent: false }); get().loadRoutine(); return }
      set({ selectedCharacter: name, combos: [], error: null, filters: defaultFilters, showOnlyRecent: false }); get().loadCombos(name)
    }, clearCharacter: () => set({ selectedCharacter: null, combos: [], error: null, showOnlyRecent: false }),
    combos: [], loading: false, error: null, fromCache: false, fetchedAt: null,
    loadCombos: async (character) => {
      set({ loading: true, error: null })
      try {
        const result = await window.electronAPI.fetchCombos(character);
        const learned = await window.electronAPI.getLearnedCombos();
        set({ combos: result.combos, learnedIds: new Set(learned), fromCache: result.fromCache, fetchedAt: result.fetchedAt ?? Date.now(), loading: false })
        if (result.nuevos && result.nuevos > 0) {
          pushToast(
            getTranslation(get().language, 'toasts.new_combos', { n: result.nuevos, char: character }),
            'info',
            8000,
            [bannerPortrait(character)].filter(Boolean) as string[],
            () => { get().setCharacter(character) },
          )
        }
      }
      catch (err) {
        console.error('[loadCombos] error:', err);
        set({ error: (err as Error).message, loading: false })
      }
    },
    refreshCombos: async () => { const char = get().selectedCharacter; if (!char) return; if (char === ROUTINE_ID) { await get().loadRoutine(); return } await window.electronAPI.clearCache(char); await get().loadCombos(char) },

    /** "Mi rutina": favoritos de todos los personajes cacheados, con separadores. */
    loadRoutine: async () => {
      set({ loading: true, error: null })
      try {
        const combos = await window.electronAPI.getRoutineCombos()
        set({ combos, loading: false, fromCache: true, fetchedAt: Date.now() })
      } catch (err) {
        set({ error: (err as Error).message, loading: false })
      }
    },

    isEditingLayout: false,
    toggleEditingLayout: () => set((s) => ({ isEditingLayout: !s.isEditingLayout })),

    tekkenId: '',
    setTekkenId: (id) => { set({ tekkenId: id }); window.electronAPI.setUserPref('tekkenId', id).catch(() => {}) },
    rankData: null,
    setRankData: (data) => { set({ rankData: data }); window.electronAPI.setUserPref('rankData', data).catch(() => {}) },
    incrementWin: () => {
        const s = get();
        if (!s.rankData) return;
        const newData = { ...s.rankData, wins: (s.rankData.wins || 0) + 1 };
        set({ rankData: newData });
        window.electronAPI.setUserPref('rankData', newData).catch(() => {});
    },
    incrementLoss: () => {
        const s = get();
        if (!s.rankData) return;
        const newData = { ...s.rankData, losses: (s.rankData.losses || 0) + 1 };
        set({ rankData: newData });
        window.electronAPI.setUserPref('rankData', newData).catch(() => {});
    },
    resetSession: () => {
        const s = get();
        if (!s.rankData) return;
        const newData = { ...s.rankData, wins: 0, losses: 0 };
        set({ rankData: newData });
        window.electronAPI.setUserPref('rankData', newData).catch(() => {});
    },

    filters: defaultFilters, setFilter: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })), toggleTag: (tag) => set((s) => { const active = s.filters.activeTags; const next = active.includes(tag) ? active.filter((t) => t !== tag) : [...active, tag]; return { filters: { ...s.filters, activeTags: next } } }), clearFilters: () => set({ filters: defaultFilters }),
    filteredCombos: () => {
      const { combos, filters, favoriteIds, learnedIds, showOnlyRecent, recentCombos } = get()
      let result: Combo[] = showOnlyRecent ? [...recentCombos] : [...combos]
      if (filters.searchQuery.trim()) { const q = filters.searchQuery.toLowerCase(); result = result.filter(c => c.notation.toLowerCase().includes(q) || c.tags.some(t => t.toLowerCase().includes(q)) || c.creator?.toLowerCase().includes(q) || c.customNote?.toLowerCase().includes(q)) }
      if (filters.showOnlyFavorites) result = result.filter(c => favoriteIds.has(c.id))
      if (filters.showOnlyLearned) result = result.filter(c => learnedIds.has(c.id))
      if (filters.minDamage > 0) result = result.filter(c => (c.damage ?? 0) >= filters.minDamage)
      if (filters.difficulty) result = result.filter(c => c.difficulty === filters.difficulty)
      if (filters.activeTags.length > 0) result = result.filter(c => filters.activeTags.every(t => c.tags.includes(t)))
      if (filters.sort === 'damage') result.sort((a, b) => (b.damage ?? 0) - (a.damage ?? 0))
      else if (filters.sort === 'hits') result.sort((a, b) => (b.hits ?? 0) - (a.hits ?? 0))
      return result
    },
    favoriteIds: new Set(),
    loadFavorites: async () => { const favs = await window.electronAPI.getFavorites(); set({ favoriteIds: new Set(favs) }) },
    isFavorite: (id) => get().favoriteIds.has(id),
    toggleFavorite: async (id) => { const added = await window.electronAPI.toggleFavorite(id); set(state => { const next = new Set(state.favoriteIds); if (added) next.add(id); else next.delete(id); return { favoriteIds: next } }) },
    learnedIds: new Set(),
    isLearned: (id) => get().learnedIds.has(id),
    toggleLearned: async (id) => { const learned = await window.electronAPI.toggleLearned(id); set(state => { const next = new Set(state.learnedIds); if (learned) next.add(id); else next.delete(id); return { learnedIds: next } }) },
    opacity: 1, setOpacity: (v) => { set({ opacity: v }); window.electronAPI.setOpacity(v) },
    recentCombos: [], showOnlyRecent: false, setShowOnlyRecent: (val) => set({ showOnlyRecent: val }), addRecentCombo: (combo) => { set((s) => { const filtered = s.recentCombos.filter(c => c.id !== combo.id); const newRecent = [combo, ...filtered].slice(0, 10); window.electronAPI.setUserPref('recentCombos', newRecent).catch(() => {}); return { recentCombos: newRecent } }) },
    isFocusMode: false, toggleFocusMode: () => set((s) => ({ isFocusMode: !s.isFocusMode })), themeColor: 'dorado', setThemeColor: (color) => { applyTheme(color); set({ themeColor: color }); window.electronAPI.setUserPref('theme', color).catch(() => {}) }, dynamicCharacters: null, loadDynamicCharacters: async () => { try { const chars = await window.electronAPI.getDynamicCharacters(); if (chars && Object.keys(chars).length > 0) set({ dynamicCharacters: chars }) } catch (e) {} }, language: 'es' as Language, setLanguage: (lang) => { set({ language: lang }); window.electronAPI.setUserPref('language', lang).catch(() => {}) }, t: (path, params) => getTranslation(get().language, path, params),

    isClickThrough: false,
    toggleClickThrough: () => { window.electronAPI.toggleClickThrough() },
    setClickThrough: (val: boolean) => set({ isClickThrough: val }),

    isCompactMode: false, toggleCompactMode: () => set((s) => ({ isCompactMode: !s.isCompactMode })),
    isTournamentMode: false, toggleTournamentMode: () => set((s) => ({ isTournamentMode: !s.isTournamentMode })),
    isStreamerMode: false, toggleStreamerMode: () => set((s) => ({ isStreamerMode: !s.isStreamerMode })),
  uiScale: 1,
  customBannerUrl: '',
  setCustomBannerUrl: (url) => { set({ customBannerUrl: url }); window.electronAPI.setUserPref('customBannerUrl', url).catch(() => {}) },
  alwaysShowActions: false,
  setAlwaysShowActions: (v) => { set({ alwaysShowActions: v }); window.electronAPI.setUserPref('alwaysShowActions', v).catch(() => {}) },
  restoreLastView: true,
  setRestoreLastView: (v) => { set({ restoreLastView: v }); window.electronAPI.setUserPref('restoreLastView', v).catch(() => {}) },
  oled: false,
  setOled: (v) => { set({ oled: v }); document.documentElement.classList.toggle('oled', v); window.electronAPI.setUserPref('oled', v).catch(() => {}) },
  compactList: false,
  setCompactList: (v) => { set({ compactList: v }); window.electronAPI.setUserPref('compactList', v).catch(() => {}) },
  soundFeedback: false,
  setSoundFeedback: (v) => { set({ soundFeedback: v }); window.electronAPI.setUserPref('soundFeedback', v).catch(() => {}) },
  showGlobalSearch: false,
  setShowGlobalSearch: (v) => set({ showGlobalSearch: v }),
  setUiScale: (scale) => { applyUiScale(scale); set({ uiScale: scale }); window.electronAPI.setUserPref('uiScale', scale).catch(() => {}) },

  /**
   * Carga las preferencias desde el proceso main. Si todavía hay valores en
   * las claves legacy de localStorage, los migra primero y limpia esas claves.
   */
  initPrefs: async () => {
    try {
      const legacy = readLegacyPrefs()
      let prefs: Record<string, any>
      if (Object.keys(legacy).length > 0) {
        prefs = await window.electronAPI.migrateLegacyPrefs(legacy)
        for (const key of LEGACY_KEYS) localStorage.removeItem(key)
      } else {
        prefs = await window.electronAPI.getUserPrefs()
      }
      const theme = normalizeTheme(prefs.theme)
      applyTheme(theme)
      set({
        themeColor: theme,
        language: (prefs.language as Language) || 'es',
        tekkenId: prefs.tekkenId || '',
        recentCombos: Array.isArray(prefs.recentCombos) ? prefs.recentCombos : [],
        rankData: prefs.rankData ?? null,
        uiScale: Math.min(typeof prefs.uiScale === 'number' ? prefs.uiScale : 1, 1.25),
        customBannerUrl: prefs.customBannerUrl || '',
        alwaysShowActions: !!prefs.alwaysShowActions,
        restoreLastView: prefs.restoreLastView !== false,
        oled: !!prefs.oled,
        compactList: !!prefs.compactList,
        soundFeedback: !!prefs.soundFeedback,
      })
      document.documentElement.classList.toggle('oled', !!prefs.oled)
      applyUiScale(Math.min(typeof prefs.uiScale === 'number' ? prefs.uiScale : 1, 1.25))
      // Abrir en la última vista (personaje o rutina) si el ajuste lo permite
      if (prefs.restoreLastView !== false && typeof prefs.lastCharacter === 'string' && prefs.lastCharacter) {
        get().setCharacter(prefs.lastCharacter)
      }
      // Aviso agregado de combos nuevos detectados en el Sync y aún sin revisar
      try {
        const news = await window.electronAPI.getPendingNews()
        const entries = Object.entries(news ?? {}).filter(([, n]) => (n as number) > 0)
        if (entries.length > 0) {
          const count = entries.reduce((s, [, n]) => s + (n as number), 0)
          const names = entries.slice(0, 3).map(([c]) => c).join(', ') + (entries.length > 3 ? ` +${entries.length - 3}` : '')
          // Retratos de los primeros personajes con noticias
          const portraits = entries
            .slice(0, 3)
            .map(([c]) => bannerPortrait(c))
            .filter(Boolean) as string[]
          pushToast(
            getTranslation(get().language, 'toasts.pending_news', { count, names }),
            'info',
            12000,
            portraits,
            // Clic → abre el primer personaje con noticias; si su caché expiró,
            // el propio fetch re-sincroniza y muestra los nuevos con badge
            () => { const first = entries[0]?.[0]; if (first) get().setCharacter(first) },
          )
        }
      } catch { /* sin aviso si falla */ }
    } catch (e) {
      console.error('[initPrefs] no se pudieron cargar las preferencias:', e)
    }
  },
  }
})
