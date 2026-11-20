import { create } from 'zustand'
import { getTranslation, Language } from '../locales'
import type { Combo } from '../types/combo'

export type ThemeColor = 'dorado' | 'azul' | 'rojo' | 'verde' | 'rosa'

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
  combos: Combo[]
  customCombos: Combo[]
  loading: boolean
  error: string | null
  fromCache: boolean
  fetchedAt: number | null
  loadCombos: (character: string) => Promise<void>
  refreshCombos: () => Promise<void>
  exportCustomCombos: () => string
  importCustomCombos: (jsonString: string) => Promise<void>
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
  collapsed: boolean
  toggleCollapse: () => void
  isHorizontal: boolean
  setHorizontal: (v: boolean) => void
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
const getInitialRecent = (): Combo[] => { try { const saved = localStorage.getItem('t8_recent_combos'); return saved ? JSON.parse(saved) : [] } catch { return [] } }
const getInitialTheme = (): ThemeColor => { try { return (localStorage.getItem('t8_theme') as ThemeColor) || 'dorado' } catch { return 'dorado' } }
const getInitialLang = (): Language => { try { return (localStorage.getItem('t8_lang') as Language) || 'es' } catch { return 'es' } }
const getInitialRankData = (): any => {
  try {
    const saved = localStorage.getItem('t8_rank_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.playerName === 'SpringanVnzla' || !parsed.playerName) {
        localStorage.removeItem('t8_rank_data');
        return null;
      }
      return parsed;
    }
    return null;
  } catch { return null }
}
const applyTheme = (color: ThemeColor) => { const themes: Record<ThemeColor, string> = { dorado: '#fbbf24', azul: '#38bdf8', rojo: '#ef4444', verde: '#4ade80', rosa: '#f472b6' }; document.documentElement.style.setProperty('--accent-color', themes[color]); localStorage.setItem('t8_theme', color) }

export const useOverlayStore = create<OverlayStore>((set, get) => {
  const initialTheme = getInitialTheme()
  setTimeout(() => applyTheme(initialTheme), 0)
  return {
    selectedCharacter: null, setCharacter: (name) => { set({ selectedCharacter: name, combos: [], customCombos: [], error: null, filters: defaultFilters, showOnlyRecent: false }); get().loadCombos(name) }, clearCharacter: () => set({ selectedCharacter: null, combos: [], customCombos: [], error: null, showOnlyRecent: false }),
    combos: [], customCombos: [], loading: false, error: null, fromCache: false, fetchedAt: null,
    loadCombos: async (character) => {
      set({ loading: true, error: null })
      try {
        console.log('[loadCombos] fetching combos for', character);
        const result = await window.electronAPI.fetchCombos(character);
        console.log('[loadCombos] fetchCombos result length:', result?.combos?.length);
        const custom = await window.electronAPI.getCustomCombos(character);
        console.log('[loadCombos] custom combos:', custom?.length);
        const learned = await window.electronAPI.getLearnedCombos();
        console.log('[loadCombos] learned combos:', learned?.length);
        set({ combos: result.combos, customCombos: custom ?? [], learnedIds: new Set(learned), fromCache: result.fromCache, fetchedAt: result.fetchedAt ?? Date.now(), loading: false })
      }
      catch (err) {
        console.error('[loadCombos] error:', err);
        set({ error: (err as Error).message, loading: false })
      }
    },
    refreshCombos: async () => { const char = get().selectedCharacter; if (!char) return; await window.electronAPI.clearCache(char); await get().loadCombos(char) },

    exportCustomCombos: () => { return JSON.stringify(get().customCombos, null, 2) },
    importCustomCombos: async (jsonString: string) => { try { const importedCombos = JSON.parse(jsonString) as Combo[]; const char = get().selectedCharacter; if (!char) throw new Error("No hay personaje seleccionado"); await window.electronAPI.saveCustomCombos(char, importedCombos); await get().loadCombos(char) } catch (err) { throw new Error("Error al importar combos: " + (err as Error).message) } },

    isEditingLayout: false,
    toggleEditingLayout: () => set((s) => ({ isEditingLayout: !s.isEditingLayout })),

    tekkenId: localStorage.getItem('t8_tekken_id') || '',
    setTekkenId: (id) => { localStorage.setItem('t8_tekken_id', id); set({ tekkenId: id }) },
    rankData: getInitialRankData(),
    setRankData: (data) => { localStorage.setItem('t8_rank_data', JSON.stringify(data)); set({ rankData: data }) },
    incrementWin: () => set((s) => {
        if (!s.rankData) return s;
        const newData = { ...s.rankData, wins: (s.rankData.wins || 0) + 1 };
        localStorage.setItem('t8_rank_data', JSON.stringify(newData));
        return { rankData: newData };
    }),
    incrementLoss: () => set((s) => {
        if (!s.rankData) return s;
        const newData = { ...s.rankData, losses: (s.rankData.losses || 0) + 1 };
        localStorage.setItem('t8_rank_data', JSON.stringify(newData));
        return { rankData: newData };
    }),
    resetSession: () => set((s) => {
        if (!s.rankData) return s;
        const newData = { ...s.rankData, wins: 0, losses: 0 };
        localStorage.setItem('t8_rank_data', JSON.stringify(newData));
        return { rankData: newData };
    }),

    filters: defaultFilters, setFilter: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })), toggleTag: (tag) => set((s) => { const active = s.filters.activeTags; const next = active.includes(tag) ? active.filter((t) => t !== tag) : [...active, tag]; return { filters: { ...s.filters, activeTags: next } } }), clearFilters: () => set({ filters: defaultFilters }),
    filteredCombos: () => {
      const { combos, customCombos, filters, favoriteIds, learnedIds, showOnlyRecent, recentCombos } = get()
      let result: Combo[] = showOnlyRecent ? [...recentCombos] : [...customCombos, ...combos]
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
    collapsed: false, toggleCollapse: () => { set((s) => ({ collapsed: !s.collapsed })); window.electronAPI.toggleCollapse() }, isHorizontal: false, setHorizontal: (v) => set({ isHorizontal: v }), opacity: 1, setOpacity: (v) => { set({ opacity: v }); window.electronAPI.setOpacity(v) },
    recentCombos: getInitialRecent(), showOnlyRecent: false, setShowOnlyRecent: (val) => set({ showOnlyRecent: val }), addRecentCombo: (combo) => { set((s) => { const filtered = s.recentCombos.filter(c => c.id !== combo.id); const newRecent = [combo, ...filtered].slice(0, 10); localStorage.setItem('t8_recent_combos', JSON.stringify(newRecent)); return { recentCombos: newRecent } }) },
    isFocusMode: false, toggleFocusMode: () => set((s) => ({ isFocusMode: !s.isFocusMode })), themeColor: initialTheme, setThemeColor: (color) => { applyTheme(color); set({ themeColor: color }) }, dynamicCharacters: null, loadDynamicCharacters: async () => { try { const chars = await window.electronAPI.getDynamicCharacters(); if (chars && Object.keys(chars).length > 0) set({ dynamicCharacters: chars }) } catch (e) {} }, language: getInitialLang(), setLanguage: (lang) => { localStorage.setItem('t8_lang', lang); set({ language: lang }) }, t: (path, params) => getTranslation(get().language, path, params),

    isClickThrough: false,
    toggleClickThrough: () => { window.electronAPI.toggleClickThrough() },
    setClickThrough: (val: boolean) => set({ isClickThrough: val }),

    isCompactMode: false, toggleCompactMode: () => set((s) => ({ isCompactMode: !s.isCompactMode })),
    isTournamentMode: false, toggleTournamentMode: () => set((s) => ({ isTournamentMode: !s.isTournamentMode })),
    isStreamerMode: false, toggleStreamerMode: () => set((s) => ({ isStreamerMode: !s.isStreamerMode })),
  }
})
