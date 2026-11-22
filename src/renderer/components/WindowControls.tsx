import { useEffect, useState } from 'react'
import { useOverlayStore, type ThemeColor } from '../store/overlayStore'
import type { Language } from '../locales'
import HelpModal from './HelpModal' // <--- IMPORTAMOS EL MODAL

export default function WindowControls() {
  // Selectores finos: la barra solo se re-renderiza si cambia algo que muestra
  const opacity = useOverlayStore((s) => s.opacity)
  const setOpacity = useOverlayStore((s) => s.setOpacity)
  const selectedCharacter = useOverlayStore((s) => s.selectedCharacter)
  const clearCharacter = useOverlayStore((s) => s.clearCharacter)
  const themeColor = useOverlayStore((s) => s.themeColor)
  const setThemeColor = useOverlayStore((s) => s.setThemeColor)
  const language = useOverlayStore((s) => s.language)
  const setLanguage = useOverlayStore((s) => s.setLanguage)
  const t = useOverlayStore((s) => s.t)
  const isClickThrough = useOverlayStore((s) => s.isClickThrough)
  const toggleClickThrough = useOverlayStore((s) => s.toggleClickThrough)
  const isCompactMode = useOverlayStore((s) => s.isCompactMode)
  const toggleCompactMode = useOverlayStore((s) => s.toggleCompactMode)
  const isTournamentMode = useOverlayStore((s) => s.isTournamentMode)
  const toggleTournamentMode = useOverlayStore((s) => s.toggleTournamentMode)
  const isStreamerMode = useOverlayStore((s) => s.isStreamerMode)
  const toggleStreamerMode = useOverlayStore((s) => s.toggleStreamerMode)
  const uiScale = useOverlayStore((s) => s.uiScale)
  const setUiScale = useOverlayStore((s) => s.setUiScale)
  const [tekkenRunning, setTekkenRunning] = useState<boolean | null>(null)

  // Indicador de detección de Tekken 8 (watcher del proceso main)
  useEffect(() => {
    window.electronAPI.getTekkenStatus().then(setTekkenRunning).catch(() => {})
    const un = window.electronAPI.onTekkenStatus(setTekkenRunning)
    return un
  }, [])
  const [autoLaunch, setAutoLaunchState] = useState(false)
  const [showHelp, setShowHelp] = useState(false) // <--- ESTADO PARA EL MODAL

  useEffect(() => { window.electronAPI.getAutoLaunch().then(setAutoLaunchState) }, [])

  const handleAutoLaunch = async () => { const next = !autoLaunch; await window.electronAPI.setAutoLaunch(next); setAutoLaunchState(next) }
  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => setThemeColor(e.target.value as ThemeColor)
  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => setLanguage(e.target.value as Language)

  return (
    <>
      <div className="drag-region flex items-center justify-between px-2 py-0.5 border-b border-white/5 bg-black/20 cursor-crosshair">
        <div className="no-drag flex items-center gap-1" data-safe>
          {selectedCharacter ? (
            <button onClick={clearCharacter} className="text-[10px] text-overlay-muted hover:text-white transition-colors px-1 py-0.5 rounded hover:bg-white/10" title={t('app.back')}>{t('app.back')}</button>
          ) : (
            <span className="text-[10px] font-hud font-semibold text-overlay-accent tracking-widest uppercase">{t('app.title')}</span>
          )}
          {/* Watcher de Tekken: píldora destacada, punto pulsante cuando corre */}
          <span
            className={`flex items-center gap-1.5 text-[8px] font-hud font-bold uppercase tracking-wider px-2 py-1 rounded-full border transition-all ${tekkenRunning ? 'bg-emerald-400/15 border-emerald-400/60 text-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.25)]' : 'bg-white/5 border-white/10 text-white/25'}`}
            title={tekkenRunning ? t('tips.tekken_detected') : t('tips.tekken_hidden')}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${tekkenRunning ? 'bg-emerald-400 animate-pulse' : 'bg-white/25'}`} />
            Tekken
          </span>
        </div>

        <div className="no-drag flex items-center gap-1" data-safe>
          {/* Búsqueda global entre todos los personajes (Ctrl+F) */}
          <button
            onClick={() => useOverlayStore.getState().setShowGlobalSearch(true)}
            className="text-[9px] px-1 py-0.5 rounded border border-white/10 text-white/40 hover:text-white/80 transition-colors"
            title={`${t('search.title')} (Ctrl+F)`}
          >
            🔍
          </button>

          {/* BOTÓN DE AYUDA NUEVO (Al lado del Modo Streamer) */}
          <button
            onClick={() => setShowHelp(true)}
            className="text-[9px] px-1 py-0.5 rounded border border-white/10 text-white/40 hover:text-white/80 transition-colors"
            title={t('tips.help')}
          >
            ❓
          </button>

          <button onClick={toggleStreamerMode} className={`text-[9px] px-1 py-0.5 rounded border transition-colors ${isStreamerMode ? 'border-pink-500/50 bg-pink-500/20 text-pink-400' : 'border-white/10 text-white/40 hover:text-white/80'}`} title={t('tips.streamer_mode')}>👁️</button>
          <button onClick={toggleTournamentMode} className={`text-[9px] px-1 py-0.5 rounded border transition-colors ${isTournamentMode ? 'border-amber-500/50 bg-amber-500/20 text-amber-400' : 'border-white/10 text-white/40 hover:text-white/80'}`} title={t('tips.tournament_mode')}>🏆</button>
          <button onClick={toggleClickThrough} className={`text-[9px] px-1 py-0.5 rounded border transition-colors ${isClickThrough ? 'border-red-500/50 bg-red-500/20 text-red-400 ring-1 ring-red-500/40 animate-pulse' : 'border-white/10 text-white/40 hover:text-white/80'}`} title={t('tips.lock')}> {isClickThrough ? '🔒' : '🔓'} </button>
          <button onClick={toggleCompactMode} className={`text-[9px] px-1 py-0.5 rounded border transition-colors ${isCompactMode ? 'border-overlay-accent/60 bg-overlay-accent/20 text-overlay-accent' : 'border-white/10 text-white/40 hover:text-white/80'}`} title={t('tips.compact_mode')}>📏</button>

          <select value={language} onChange={handleLangChange} className="text-[8px] font-hud bg-white/5 border border-white/10 rounded px-1 py-0.5 text-white/50 outline-none cursor-pointer hover:border-white/30 no-drag" title={t('tips.language')}>
            <option value="es" className="bg-zinc-900">🇪🇸 ES</option>
            <option value="en" className="bg-zinc-900">🇺🇸 EN</option>
            <option value="pt" className="bg-zinc-900">🇧🇷 PT</option>
          </select>

          <select value={themeColor} onChange={handleThemeChange} className="text-[9px] font-hud bg-white/5 border border-white/10 rounded px-1 py-0.5 text-white/50 outline-none cursor-pointer hover:border-white/30 no-drag" title={`${t('tips.theme')}: ${t(`themes.${themeColor}`)}`}>
            {/* Puntos de color: compactos; el nombre completo va en el tooltip */}
            <option value="dorado" className="bg-zinc-900">🟡</option>
            <option value="azul" className="bg-zinc-900">🔵</option>
            <option value="rojo" className="bg-zinc-900">🔴</option>
            <option value="verde" className="bg-zinc-900">🟢</option>
          </select>

          <select value={uiScale} onChange={(e) => setUiScale(parseFloat(e.target.value))} className="text-[8px] font-hud bg-white/5 border border-white/10 rounded px-1 py-0.5 text-white/50 outline-none cursor-pointer hover:border-white/30 no-drag" title={t('settings.ui_scale') || 'Escala de la interfaz'}>
            <option value="0.9" className="bg-zinc-900">90%</option>
            <option value="1" className="bg-zinc-900">100%</option>
            <option value="1.25" className="bg-zinc-900">125%</option>
          </select>

          <button onClick={handleAutoLaunch} className={`text-[8px] font-hud px-1 py-0.5 rounded border transition-colors ${autoLaunch ? 'border-overlay-accent/60 bg-overlay-accent/20 text-overlay-accent' : 'border-white/10 text-white/25 hover:text-white/60 hover:border-white/25'}`} title={t('tips.autostart')}>⚡</button>
          <input type="range" min={0.2} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} className="w-10 h-1 accent-overlay-accent cursor-pointer" title={t('tips.opacity')} />
          <button onClick={() => window.electronAPI.minimizeWindow()} className="w-4 h-4 flex items-center justify-center rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors text-[10px]" title={t('tips.minimize')}>–</button>
          <button onClick={() => window.electronAPI.closeWindow()} className="w-4 h-4 flex items-center justify-center rounded hover:bg-red-500/70 text-white/50 hover:text-white transition-colors text-[10px]" title={t('tips.close_window')}>✕</button>
        </div>
      </div>

      {/* MODAL DE AYUDA */}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </>
  )
}