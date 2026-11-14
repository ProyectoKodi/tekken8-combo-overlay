import { create } from 'zustand'
import type { Combo, FilterState, ComboListItem } from '../types/combo'
import { FAVORITES_SEPARATOR } from '../types/combo'
import type { Language } from '../locales'
import { getTranslation } from '../locales'

export type ThemeColor = 'dorado' | 'azul' | 'rojo' | 'verde' | 'rosa'

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
  filters: FilterState
  setFilter: (patch: Partial<FilterState>) => void
  toggleTag: (tag: string) => void
  clearFilters: () => void
  filteredCombos: () => ComboListItem[]
  favoriteIds: Set<string>
  loadFavorites: () => Promise<void>
  toggleFavorite: (id: string) => Promise<void>
  isFavorite: (id: string) => boolean
  learnedIds: Set<string>
  toggleLearned: (id: string) => Promise<void>
  isLearned: (id: string) => boolean
  collapsed: boolean
  toggleCollapse: () => void
  isHorizontal: boolean
  setHorizontal: (v: boolean) => void
  opacity: number
  setOpacity: (v: number) => void
  recentCombos: Combo[]
  addRecentCombo: (combo: Combo) => void
  showOnlyRecent: boolean
  setShowOnlyRecent: (val: boolean) => void
  isFocusMode: boolean
  toggleFocusMode: () => void
  themeColor: ThemeColor
  setThemeColor: (color: ThemeColor) => void
  dynamicCharacters: Record<string, string> | null
  loadDynamicCharacters: () => Promise<void>
  language: Language
  setLanguage: (lang: Language) => void
  t: (path: string, params?: Record<string, string>) => string
  isClickThrough: boolean
  toggleClickThrough: () => void
  setClickThrough: (val: boolean) => void
  isCompactMode: boolean
  toggleCompactMode: () => void
  isTournamentMode: boolean
  toggleTournamentMode: () => void
  isStreamerMode: boolean
  toggleStreamerMode: () => void
}

const defaultFilters: FilterState = { activeTags: [], sort: 'default', searchQuery: '', showOnlyFavorites: false, showOnlyLearned: false, minDamage: 0, difficulty: '' }
const getInitialRecent = (): Combo[] => { try { const saved = localStorage.getItem('t8_recent_combos'); return saved ? JSON.parse(saved) : [] } catch { return [] } }
const getInitialTheme = (): ThemeColor => { try { return (localStorage.getItem('t8_theme') as ThemeColor) || 'dorado' } catch { return 'dorado' } }
const getInitialLang = (): Language => { try { return (localStorage.getItem('t8_lang') as Language) || 'es' } catch { return 'es' } }
const applyTheme = (color: ThemeColor) => { const themes: Record<ThemeColor, string> = { dorado: '#fbbf24', azul: '#38bdf8', rojo: '#ef4444', verde: '#4ade80', rosa: '#f472b6' }; document.documentElement.style.setProperty('--accent-color', themes[color]); localStorage.setItem('t8_theme', color) }

export const useOverlayStore = create<OverlayStore>((set, get) => {
  const initialTheme = getInitialTheme()
  setTimeout(() => applyTheme(initialTheme), 0)
  return {
    selectedCharacter: null, setCharacter: (name) => { set({ selectedCharacter: name, combos: [], customCombos: [], error: null, filters: defaultFilters, showOnlyRecent: false }); get().loadCombos(name) }, clearCharacter: () => set({ selectedCharacter: null, combos: [], customCombos: [], error: null, showOnlyRecent: false }),
    combos: [], customCombos: [], loading: false, error: null, fromCache: false, fetchedAt: null,
    loadCombos: async (character) => {
      set({ loading: true, error: null })
      try { const result = await window.electronAPI.fetchCombos(character); const custom = await window.electronAPI.getCustomCombos(character); const learned = await window.electronAPI.getLearnedCombos(); set({ combos: result.combos, customCombos: custom ?? [], learnedIds: new Set(learned), fromCache: result.fromCache, fetchedAt: result.fetchedAt ?? Date.now(), loading: false }) } 
      catch (err) { set({ error: (err as Error).message, loading: false }) }
    },
    refreshCombos: async () => { const char = get().selectedCharacter; if (!char) return; await window.electronAPI.clearCache(char); await get().loadCombos(char) },
    filters: defaultFilters, setFilter: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })), toggleTag: (tag) => set((s) => { const active = s.filters.activeTags; const next = active.includes(tag) ? active.filter((t) => t !== tag) : [...active, tag]; return { filters: { ...s.filters, activeTags: next } } }), clearFilters: () => set({ filters: defaultFilters }),
    filteredCombos: () => {
      const { combos, customCombos, filters, favoriteIds, learnedIds, showOnlyRecent, recentCombos } = get()
      let result: Combo[] = showOnlyRecent ? [...recentCombos] : [...customCombos, ...combos]
      if (filters.activeTags.length > 0) result = result.filter((c) => filters.activeTags.every((t) => c.tags.includes(t)))
      if (filters.minDamage > 0) result = result.filter((c) => (c.damage ?? 0) >= filters.minDamage)
      if (filters.difficulty) result = result.filter((c) => c.difficulty === filters.difficulty)
      if (filters.searchQuery.trim()) { const q = filters.searchQuery.toLowerCase().trim(); result = result.filter((c) => c.notation.toLowerCase().includes(q) || c.notes.toLowerCase().includes(q) || (c.creator ?? '').toLowerCase().includes(q)) }
      if (filters.sort === 'damage') result.sort((a, b) => b.damage - a.damage); else if (filters.sort === 'hits') result.sort((a, b) => b.hits - a.hits)
      if (filters.showOnlyFavorites) result = result.filter((c) => favoriteIds.has(c.id)); if (filters.showOnlyLearned) result = result.filter((c) => learnedIds.has(c.id))
      if (showOnlyRecent) return result
      const favs = result.filter((c) => favoriteIds.has(c.id)); const rest = result.filter((c) => !favoriteIds.has(c.id))
      if (favs.length > 0) return [...favs, FAVORITES_SEPARATOR, ...rest] as ComboListItem[]
      return result
    },
    favoriteIds: new Set<string>(), loadFavorites: async () => { const ids = await window.electronAPI.getFavorites(); set({ favoriteIds: new Set(ids) }) }, toggleFavorite: async (id: string) => { set((s) => { const next = new Set(s.favoriteIds); if (next.has(id)) next.delete(id); else next.add(id); return { favoriteIds: next } }); await window.electronAPI.toggleFavorite(id) }, isFavorite: (id: string) => get().favoriteIds.has(id),
    learnedIds: new Set<string>(), toggleLearned: async (id: string) => { set((s) => { const next = new Set(s.learnedIds); if (next.has(id)) next.delete(id); else next.add(id); return { learnedIds: next } }); await window.electronAPI.toggleLearned(id) }, isLearned: (id: string) => get().learnedIds.has(id),
    collapsed: false, toggleCollapse: () => { set((s) => ({ collapsed: !s.collapsed })); window.electronAPI.toggleCollapse() }, isHorizontal: false, setHorizontal: (v) => set({ isHorizontal: v }), opacity: 1, setOpacity: (v) => { set({ opacity: v }); window.electronAPI.setOpacity(v) },
    recentCombos: getInitialRecent(), showOnlyRecent: false, setShowOnlyRecent: (val) => set({ showOnlyRecent: val }), addRecentCombo: (combo) => { set((s) => { const filtered = s.recentCombos.filter(c => c.id !== combo.id); const newRecent = [combo, ...filtered].slice(0, 10); localStorage.setItem('t8_recent_combos', JSON.stringify(newRecent)); return { recentCombos: newRecent } }) },
    isFocusMode: false, toggleFocusMode: () => set((s) => ({ isFocusMode: !s.isFocusMode })), themeColor: initialTheme, setThemeColor: (color) => { applyTheme(color); set({ themeColor: color }) }, dynamicCharacters: null, loadDynamicCharacters: async () => { try { const chars = await window.electronAPI.getDynamicCharacters(); if (chars && Object.keys(chars).length > 0) set({ dynamicCharacters: chars }) } catch (e) {} }, language: getInitialLang(), setLanguage: (lang) => { localStorage.setItem('t8_lang', lang); set({ language: lang }) }, t: (path, params) => getTranslation(get().language, path, params),
    
    isClickThrough: false, 
    // Ahora solo PIDE el cambio, el proceso main es quien decide y avisa de vuelta
    toggleClickThrough: () => { 
      window.electronAPI.toggleClickThrough() 
    },
    // Esta función la usa el App.tsx cuando recibe el aviso del proceso main
    setClickThrough: (val: boolean) => set({ isClickThrough: val }), 
    
    isCompactMode: false, toggleCompactMode: () => set((s) => ({ isCompactMode: !s.isCompactMode })),
    isTournamentMode: false, toggleTournamentMode: () => set((s) => ({ isTournamentMode: !s.isTournamentMode })),
    isStreamerMode: false, toggleStreamerMode: () => set((s) => ({ isStreamerMode: !s.isStreamerMode })),
  }
})