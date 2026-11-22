import Store from 'electron-store'

/**
 * Preferencias de usuario unificadas en el proceso main. Antes vivían
 * repartidas entre `electron-store` (favoritos, notas, combos) y el
 * `localStorage` del renderer (tema, idioma, recientes, win/loss, Tekken ID).
 * Al centralizarlas aquí, "Exportar perfil" incluye todo.
 */
export interface UserPrefsSchema {
  /** Tema de acento: dorado | azul | rojo | verde | rosa */
  theme?: string
  /** Código de idioma de la UI: es | en | pt */
  language?: string
  tekkenId?: string
  /** Últimos combos practicados (máx. 10, el más reciente primero). */
  recentCombos?: unknown[]
  /** Ficha del Rank Tracker (RankData) o null si está vacía. */
  rankData?: unknown | null
  /** Escala global de la UI (0.9 = 90%, 1.25 = 125%…). Máx. 1.25. */
  uiScale?: number
  /** Atajos reasignables: { toggleClickThrough, toggleOverlay, streamerMode, … } */
  hotkeys?: Record<string, string>
  /** Imagen de fondo propia del banner (URL file://). */
  customBannerUrl?: string
  /** Posición de la tira de práctica: top | bottom */
  practicePosition?: 'top' | 'bottom'
  /** Client ID de la aplicación de Discord para Rich Presence. */
  discordClientId?: string
  /** Personajes descubiertos en la web (DLC): { nombre: slug }. */
  discoveredCharacters?: Record<string, string>
  /** Tira de práctica en modo mini-tarjeta (esquina). */
  practiceMini?: boolean
  /** Posición guardada de la mini-tarjeta { x, y }. */
  practiceMiniPos?: { x: number; y: number }
  /** Recorrido inicial ya visto. */
  onboarded?: boolean
  /** Última vista abierta (personaje o "Mi rutina") para restaurar al arrancar. */
  lastCharacter?: string
  /** Abrir en la última vista al arrancar. */
  restoreLastView?: boolean
  /** Botones de acción de las tarjetas siempre visibles (vs. al pasar el mouse). */
  alwaysShowActions?: boolean
  /** Fondo negro puro (OLED) para jugar de noche. */
  oled?: boolean
  /** Lista en modo compacto (una línea por combo). */
  compactList?: boolean
  /** Sonido sutil al marcar un combo como aprendido. */
  soundFeedback?: boolean
  /** Estadísticas de práctica: racha de días y segundos de hoy. */
  practiceStats?: { lastDate?: string; streak?: number; todaySeconds?: number }
}

const DEFAULTS: Required<UserPrefsSchema> = {
  theme: 'dorado',
  language: 'es',
  tekkenId: '',
  recentCombos: [],
  rankData: null,
  uiScale: 1,
  hotkeys: {},
  customBannerUrl: '',
  practicePosition: 'top',
  discordClientId: '',
  discoveredCharacters: {},
  practiceMini: false,
  practiceMiniPos: { x: 0, y: 0 },
  onboarded: false,
  lastCharacter: '',
  restoreLastView: true,
  alwaysShowActions: false,
  oled: false,
  compactList: false,
  soundFeedback: false,
  practiceStats: {},
}

const store = new Store<UserPrefsSchema>({
  name: 'user-prefs',
  defaults: DEFAULTS,
})

export function getUserPrefs(): Required<UserPrefsSchema> {
  return {
    theme: store.get('theme') ?? DEFAULTS.theme,
    language: store.get('language') ?? DEFAULTS.language,
    tekkenId: store.get('tekkenId') ?? DEFAULTS.tekkenId,
    recentCombos: store.get('recentCombos') ?? DEFAULTS.recentCombos,
    rankData: store.get('rankData') ?? DEFAULTS.rankData,
    uiScale: store.get('uiScale') ?? DEFAULTS.uiScale,
    hotkeys: store.get('hotkeys') ?? DEFAULTS.hotkeys,
    customBannerUrl: store.get('customBannerUrl') ?? DEFAULTS.customBannerUrl,
    practicePosition: store.get('practicePosition') ?? DEFAULTS.practicePosition,
    discordClientId: store.get('discordClientId') ?? DEFAULTS.discordClientId,
    discoveredCharacters: store.get('discoveredCharacters') ?? DEFAULTS.discoveredCharacters,
    practiceMini: store.get('practiceMini') ?? DEFAULTS.practiceMini,
    practiceMiniPos: store.get('practiceMiniPos') ?? DEFAULTS.practiceMiniPos,
    onboarded: store.get('onboarded') ?? DEFAULTS.onboarded,
    lastCharacter: store.get('lastCharacter') ?? DEFAULTS.lastCharacter,
    restoreLastView: store.get('restoreLastView') ?? DEFAULTS.restoreLastView,
    alwaysShowActions: store.get('alwaysShowActions') ?? DEFAULTS.alwaysShowActions,
    oled: store.get('oled') ?? DEFAULTS.oled,
    compactList: store.get('compactList') ?? DEFAULTS.compactList,
    soundFeedback: store.get('soundFeedback') ?? DEFAULTS.soundFeedback,
    practiceStats: store.get('practiceStats') ?? DEFAULTS.practiceStats,
  }
}

const VALID_KEYS = new Set(Object.keys(DEFAULTS))

export function setUserPref(key: string, value: unknown): void {
  if (!VALID_KEYS.has(key)) throw new Error(`Clave de preferencia desconocida: ${key}`)
  store.set(key as keyof UserPrefsSchema, value)
}

/** Fusión usada por la migración desde localStorage y por la importación de perfil. */
export function mergeUserPrefs(patch: Partial<Record<keyof UserPrefsSchema, unknown>>): void {
  for (const [key, value] of Object.entries(patch)) {
    if (VALID_KEYS.has(key)) setUserPref(key, value)
  }
}
