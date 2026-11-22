import { useEffect } from 'react'
import { useOverlayStore } from './store/overlayStore'
import { pushToast } from './store/toastStore'
import WindowControls from './components/WindowControls'
import Toasts from './components/Toasts'
import SearchBar from './components/SearchBar'
import CharacterSelector from './components/CharacterSelector'
import FilterBar from './components/FilterBar'
import ComboList from './components/ComboList'
import PracticeView from './components/PracticeView'
import VideoView from './components/VideoView'
import SyncButton from './components/SyncButton'
import UpdateBanner from './components/UpdateBanner'
import RankTracker from './components/RankTracker'
import Onboarding from './components/Onboarding'
import GlobalSearch from './components/GlobalSearch'
import { useState } from 'react'
import { bannerPortrait } from './utils/bannerAssets'
import { ROUTINE_ID } from './types/combo'

const isPracticeMode = new URLSearchParams(window.location.search).get('mode') === 'practice'
const isVideoMode = new URLSearchParams(window.location.search).get('mode') === 'video'

export default function App() {
  // Selectores finos: la raíz no se re-renderiza con cada cambio del store
  const selectedCharacter = useOverlayStore((s) => s.selectedCharacter)
  const loadFavorites = useOverlayStore((s) => s.loadFavorites)
  const showOnlyRecent = useOverlayStore((s) => s.showOnlyRecent)
  const setShowOnlyRecent = useOverlayStore((s) => s.setShowOnlyRecent)
  const isFocusMode = useOverlayStore((s) => s.isFocusMode)
  const toggleFocusMode = useOverlayStore((s) => s.toggleFocusMode)
  const isCompactMode = useOverlayStore((s) => s.isCompactMode)
  const isStreamerMode = useOverlayStore((s) => s.isStreamerMode)
  const t = useOverlayStore((s) => s.t)
  const setClickThrough = useOverlayStore((s) => s.setClickThrough)
  const toggleStreamerMode = useOverlayStore((s) => s.toggleStreamerMode)
  const initPrefs = useOverlayStore((s) => s.initPrefs)
  const isClickThrough = useOverlayStore((s) => s.isClickThrough)
  const compactList = useOverlayStore((s) => s.compactList)
  const setCompactList = useOverlayStore((s) => s.setCompactList)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const showGlobalSearch = useOverlayStore((s) => s.showGlobalSearch)
  const setShowGlobalSearch = useOverlayStore((s) => s.setShowGlobalSearch)

  if (isVideoMode) return <VideoView />
  if (isPracticeMode) return <PracticeView />

  useEffect(() => {
    initPrefs().then(() => {
      // Recorrido inicial solo para usuarios nuevos (una vez)
      window.electronAPI.getUserPrefs().then((p) => {
        if (!p.onboarded) setShowOnboarding(true)
      }).catch(() => {})
    })
  }, [initPrefs])
  useEffect(() => { loadFavorites() }, [loadFavorites])

  useEffect(() => {
    const unlisten = window.electronAPI.onHotkeyClickThrough((isIgnoring) => { setClickThrough(isIgnoring) })
    return () => { if (typeof unlisten === 'function') unlisten() }
  }, [setClickThrough])

  // Primer bloqueo: toast con la pista de cómo desbloquear con el mouse
  useEffect(() => {
    if (isClickThrough && !localStorage.getItem('t8_lock_hint_shown')) {
      localStorage.setItem('t8_lock_hint_shown', '1')
      pushToast(t('toasts.lock_hint'), 'info', 6000)
    }
  }, [isClickThrough, t])

  // Cierre bloqueado por una sincronización en curso
  useEffect(() => {
    const un = window.electronAPI.onSyncInProgress(() => pushToast(t('toasts.sync_running'), 'warn', 5000))
    return un
  }, [t])

  // Ctrl+F: buscador global en el caché de todos los personajes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        setShowGlobalSearch(!useOverlayStore.getState().showGlobalSearch)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setShowGlobalSearch])

  // Personajes nuevos descubiertos durante el Sync (DLC): toast con salto directo
  useEffect(() => {
    const un = window.electronAPI.onNewCharactersFound(({ names }) => {
      if (!names?.length) return
      const shown = names.slice(0, 3).join(', ') + (names.length > 3 ? ` +${names.length - 3}` : '')
      const key = names.length === 1 ? 'toasts.new_chars_one' : 'toasts.new_chars'
      pushToast(
        t(key, { count: names.length, names: shown }),
        'info',
        12000,
        [],
        () => useOverlayStore.getState().setCharacter(names[0]),
      )
    })
    return un
  }, [t])

  // Zona segura del candado: con el candado activo el overlay ignora los
  // clics, pero el mousemove sigue llegando (forward: true). Si el cursor
  // pasa sobre un control [data-safe] (barra superior), avisamos al main
  // para que reactive el mouse solo ahí y el 🔒 se pueda desactivar con clic.
  useEffect(() => {
    if (!isClickThrough) { window.electronAPI.setClickThroughHover(false); return }
    let raf = 0
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const el = document.elementFromPoint(e.clientX, e.clientY)
        window.electronAPI.setClickThroughHover(!!(el && el.closest('[data-safe]')))
      })
    }
    window.addEventListener('mousemove', onMove, true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove, true)
      window.electronAPI.setClickThroughHover(false)
    }
  }, [isClickThrough])

  useEffect(() => {
    const unStreamer = window.electronAPI.onHotkeyStreamer(() => toggleStreamerMode())
    return () => { unStreamer() }
  }, [toggleStreamerMode])

  const transitionClass = 'opacity-100 transition-opacity duration-150'
  const containerBgClass = 'bg-transparent'

  return (
    <div className={`h-full flex flex-col ${transitionClass} cursor-crosshair ${containerBgClass}`}>
      <UpdateBanner />
      <WindowControls />

      {!isFocusMode && !isCompactMode && (
        <div className="px-4 py-2 flex flex-col gap-2">
          <RankTracker />
          <SearchBar />
        </div>
      )}

      {selectedCharacter ? (
        <>
          {!isCompactMode && (
            <div className="px-4 py-2 flex items-center gap-3 border-b border-white/5 bg-black/40">
              {bannerPortrait(selectedCharacter) && (
                <img src={bannerPortrait(selectedCharacter)!} alt="" draggable={false} className="w-6 h-6 rounded object-cover object-top border border-white/10 flex-shrink-0" />
              )}
              <span className="text-sm font-hud font-bold text-overlay-accent tracking-wide">{selectedCharacter}</span>
              <span className="text-[10px] text-white/25 font-hud">{t('app.combos')}</span>
              <div className="ml-auto flex items-center gap-1.5">
                {!isFocusMode && <CacheAge />}
                {!isFocusMode && <SyncButton />}
                <button onClick={() => setShowOnlyRecent(!showOnlyRecent)} className={`text-[9px] font-hud px-2 py-0.5 rounded border transition-colors no-drag cursor-pointer ${showOnlyRecent ? 'bg-indigo-500/30 border-indigo-500/60 text-indigo-300' : 'bg-transparent border-white/8 text-white/40 hover:text-white/80'}`}>{t('actions.recent')}</button>
                {/* Densidad de lista: tarjetas cómodas ↔ una línea por combo */}
                <button onClick={() => setCompactList(!compactList)} className={`text-[10px] font-hud px-2 py-0.5 rounded border transition-colors no-drag cursor-pointer ${compactList ? 'bg-overlay-accent/30 border-overlay-accent/60 text-overlay-accent' : 'bg-transparent border-white/8 text-white/40 hover:text-white/80'}`} title={`${t('settings.compact_list')} — ${t('settings.compact_list_hint')}`}>{compactList ? '≡' : '▤'}</button>
                <button onClick={toggleFocusMode} className={`text-[9px] font-hud px-2 py-0.5 rounded border transition-colors no-drag cursor-pointer ${isFocusMode ? 'bg-pink-500/30 border-pink-500/60 text-pink-300' : 'bg-transparent border-white/8 text-white/40 hover:text-white/80'}`}>{t('actions.focus')}</button>
                {!isFocusMode && (
                  <>
                    <button onClick={() => useOverlayStore.getState().refreshCombos()} className="text-[9px] font-hud text-white/30 hover:text-white/60 px-2 py-0.5 rounded border border-white/8 hover:border-white/20 transition-colors no-drag cursor-pointer">{t('actions.reload')}</button>
                  </>
                )}
              </div>
            </div>
          )}

          {!isFocusMode && !isCompactMode && <FilterBar />}
          <ComboList />
        </>
      ) : (
        <CharacterSelector />
      )}

      <Toasts />
      {showGlobalSearch && <GlobalSearch onClose={() => setShowGlobalSearch(false)} />}
      {showOnboarding && <Onboarding onDone={() => setShowOnboarding(false)} />}
    </div>
  )
}

/** Antigüedad del caché del personaje actual (junto al botón Recargar). */
function CacheAge() {
  const fetchedAt = useOverlayStore((s) => s.fetchedAt)
  if (!fetchedAt) return null
  const mins = Math.floor((Date.now() - fetchedAt) / 60000)
  const label = mins < 1 ? '<1 min' : mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)} h`
  return (
    <span
      className="text-[9px] font-hud text-white/25 no-drag flex-shrink-0"
      title={new Date(fetchedAt).toLocaleString()}
    >
      🕒 {label}
    </span>
  )
}
