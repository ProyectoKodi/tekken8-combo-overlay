import { useEffect, useState } from 'react'
import { useOverlayStore } from './store/overlayStore'
import WindowControls from './components/WindowControls'
import SearchBar from './components/SearchBar'
import CharacterSelector from './components/CharacterSelector'
import FilterBar from './components/FilterBar'
import ComboList from './components/ComboList'
import ComboListHorizontal from './components/ComboListHorizontal'
import PracticeView from './components/PracticeView'
import AddComboForm from './components/AddComboForm'
import SyncAllButton from './components/SyncAllButton'
import UpdateBanner from './components/UpdateBanner'
import RankTracker from './components/RankTracker'

const isPracticeMode = new URLSearchParams(window.location.search).get('mode') === 'practice'

export default function App() {
  const { selectedCharacter, collapsed, toggleCollapse, isHorizontal, setHorizontal, loadFavorites, showOnlyRecent, setShowOnlyRecent, isFocusMode, toggleFocusMode, isCompactMode, isStreamerMode, t, setClickThrough, toggleStreamerMode } = useOverlayStore()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  if (isPracticeMode) return <PracticeView />

  useEffect(() => { const unlisten = window.electronAPI.onHotkeyToggle(() => toggleCollapse()); return () => { if (typeof unlisten === 'function') unlisten() } }, [toggleCollapse])
  useEffect(() => { loadFavorites() }, [loadFavorites])
  useEffect(() => { const unlisten = window.electronAPI.onHorizontalChanged((val) => { setIsTransitioning(true); setTimeout(() => { setHorizontal(val); setIsTransitioning(false) }, 100) }); return () => { if (typeof unlisten === 'function') unlisten() } }, [setHorizontal])

  useEffect(() => {
    const unlisten = window.electronAPI.onHotkeyClickThrough((isIgnoring) => { setClickThrough(isIgnoring) })
    return () => { if (typeof unlisten === 'function') unlisten() }
  }, [setClickThrough])

  useEffect(() => {
    const unAdd = window.electronAPI.onHotkeyAddCombo(() => setShowAdd(true))
    const unStreamer = window.electronAPI.onHotkeyStreamer(() => toggleStreamerMode())
    return () => { unAdd(); unStreamer() }
  }, [toggleStreamerMode])

  if (collapsed) return <div className="h-full flex items-center cursor-crosshair"><WindowControls /></div>

  const transitionClass = isTransitioning ? 'opacity-0 transition-opacity duration-100' : 'opacity-100 transition-opacity duration-150'
  const containerBgClass = 'bg-transparent'

  if (isHorizontal) {
    return (
      <div className={`h-full flex flex-col ${transitionClass} cursor-crosshair ${containerBgClass}`}>
        <UpdateBanner />
        <div className="drag-region flex items-center gap-2 px-4 py-1.5 border-b border-white/5 bg-black/60">
           <span className="text-[11px] font-hud font-bold text-overlay-accent tracking-widest uppercase no-drag">{t('app.title')}</span>
           {selectedCharacter && (<><span className="text-white/20 text-xs">|</span><span className="text-xs font-hud font-semibold text-white/80 no-drag">{selectedCharacter}</span><button onClick={() => useOverlayStore.getState().clearCharacter()} className="text-[9px] text-white/30 hover:text-white/60 no-drag">✕</button></>)}
           {!isFocusMode && <div className="flex-1 no-drag"><SearchBar compact /></div>}
           {isFocusMode && <div className="flex-1 text-right no-drag"><RankTracker compact /></div>}
           <WindowControls compact />
        </div>
        {selectedCharacter && !isFocusMode && <div className="border-b border-white/5 bg-black/40"><FilterBar compact /></div>}
        {selectedCharacter ? <ComboListHorizontal /> : <div className="flex-1 flex items-center justify-center"><p className="text-white/30 text-xs font-hud">{t('labels.select_char')}</p></div>}
      </div>
    )
  }

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
              <span className="text-sm font-hud font-bold text-overlay-accent tracking-wide">{selectedCharacter}</span>
              <span className="text-[10px] text-white/25 font-hud">{t('app.combos')}</span>
              <div className="ml-auto flex items-center gap-1.5">
                {!isFocusMode && <SyncAllButton />}
                <button onClick={() => setShowOnlyRecent(!showOnlyRecent)} className={`text-[9px] font-hud px-2 py-0.5 rounded border transition-colors no-drag cursor-pointer ${showOnlyRecent ? 'bg-indigo-500/30 border-indigo-500/60 text-indigo-300' : 'bg-transparent border-white/8 text-white/40 hover:text-white/80'}`}>{t('actions.recent')}</button>
                <button onClick={toggleFocusMode} className={`text-[9px] font-hud px-2 py-0.5 rounded border transition-colors no-drag cursor-pointer ${isFocusMode ? 'bg-pink-500/30 border-pink-500/60 text-pink-300' : 'bg-transparent border-white/8 text-white/40 hover:text-white/80'}`}>{t('actions.focus')}</button>
                {!isFocusMode && (
                  <>
                    <button onClick={() => setShowAdd(true)} className="text-[9px] font-hud text-emerald-400/70 hover:text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 hover:border-emerald-500/40 no-drag cursor-pointer">{t('actions.add')}</button>
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

      {showAdd && <AddComboForm onClose={() => setShowAdd(false)} onSaved={() => useOverlayStore.getState().refreshCombos()} />}
    </div>
  )
}
