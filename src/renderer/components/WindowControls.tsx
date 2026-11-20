import { useEffect, useState } from 'react'
import { useOverlayStore, type ThemeColor } from '../store/overlayStore'
import type { Language } from '../locales'
import HelpModal from './HelpModal' // <--- IMPORTAMOS EL MODAL

interface Props { compact?: boolean }

export default function WindowControls({ compact }: Props) {
  const { 
    opacity, setOpacity, selectedCharacter, clearCharacter, 
    themeColor, setThemeColor, language, setLanguage, t,
    isClickThrough, toggleClickThrough, isCompactMode, toggleCompactMode,
    isTournamentMode, toggleTournamentMode, isStreamerMode, toggleStreamerMode
  } = useOverlayStore()
  const [autoLaunch, setAutoLaunchState] = useState(false)
  const [showHelp, setShowHelp] = useState(false) // <--- ESTADO PARA EL MODAL

  useEffect(() => { window.electronAPI.getAutoLaunch().then(setAutoLaunchState) }, [])

  const handleAutoLaunch = async () => { const next = !autoLaunch; await window.electronAPI.setAutoLaunch(next); setAutoLaunchState(next) }
  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => setThemeColor(e.target.value as ThemeColor)
  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => setLanguage(e.target.value as Language)

  if (compact) {
    return (
      <div className="flex items-center gap-1 no-drag flex-shrink-0">
        <button onClick={() => window.electronAPI.minimizeWindow()} className="w-4 h-4 flex items-center justify-center rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors text-[10px]">–</button>
        <button onClick={() => window.electronAPI.closeWindow()} className="w-4 h-4 flex items-center justify-center rounded hover:bg-red-500/70 text-white/40 hover:text-white transition-colors text-[10px]">✕</button>
      </div>
    )
  }

  return (
    <>
      <div className="drag-region flex items-center justify-between px-2 py-0.5 border-b border-white/5 bg-black/20 cursor-crosshair">
        <div className="no-drag flex items-center gap-1.5">
          {selectedCharacter ? (
            <button onClick={clearCharacter} className="text-[10px] text-overlay-muted hover:text-white transition-colors px-1 py-0.5 rounded hover:bg-white/10" title={t('app.back')}>{t('app.back')}</button>
          ) : (
            <span className="text-[10px] font-hud font-semibold text-overlay-accent tracking-widest uppercase">{t('app.title')}</span>
          )}
        </div>

        <span className="text-[8px] text-white/20 font-mono tracking-tighter">F9</span>

        <div className="no-drag flex items-center gap-1">
          {/* BOTÓN DE AYUDA NUEVO (Al lado del Modo Streamer) */}
          <button 
            onClick={() => setShowHelp(true)} 
            className="text-[9px] px-1 py-0.5 rounded border border-white/10 text-white/40 hover:text-white/80 transition-colors"
            title="Ayuda / Guía de uso"
          >
            ❓
          </button>

          <button onClick={toggleStreamerMode} className={`text-[9px] px-1 py-0.5 rounded border transition-colors ${isStreamerMode ? 'border-pink-500/50 bg-pink-500/20 text-pink-400' : 'border-white/10 text-white/40 hover:text-white/80'}`} title="Modo Streamer">👁️</button>
          <button onClick={toggleTournamentMode} className={`text-[9px] px-1 py-0.5 rounded border transition-colors ${isTournamentMode ? 'border-amber-500/50 bg-amber-500/20 text-amber-400' : 'border-white/10 text-white/40 hover:text-white/80'}`} title="Modo Torneo">🏆</button>
          <button onClick={toggleClickThrough} className={`text-[9px] px-1 py-0.5 rounded border transition-colors ${isClickThrough ? 'border-red-500/50 bg-red-500/20 text-red-400' : 'border-white/10 text-white/40 hover:text-white/80'}`} title="Bloquear ratón (F8)"> {isClickThrough ? '🔒' : '🔓'} </button>
          <button onClick={toggleCompactMode} className={`text-[9px] px-1 py-0.5 rounded border transition-colors ${isCompactMode ? 'border-overlay-accent/60 bg-overlay-accent/20 text-overlay-accent' : 'border-white/10 text-white/40 hover:text-white/80'}`} title="Modo Compacto">📏</button>

          <select value={language} onChange={handleLangChange} className="text-[8px] font-hud bg-white/5 border border-white/10 rounded px-1 py-0.5 text-white/50 outline-none cursor-pointer hover:border-white/30 no-drag" title="Idioma / Language">
            <option value="es" className="bg-zinc-900">🇪🇸 ES</option>
            <option value="en" className="bg-zinc-900">🇺🇸 EN</option>
            <option value="pt" className="bg-zinc-900">🇧🇷 PT</option>
          </select>

          <select value={themeColor} onChange={handleThemeChange} className="text-[8px] font-hud bg-white/5 border border-white/10 rounded px-1 py-0.5 text-white/50 outline-none cursor-pointer hover:border-white/30 no-drag" title="Color del tema">
            <option value="dorado" className="bg-zinc-900">🟡</option>
            <option value="azul" className="bg-zinc-900">🔵</option>
            <option value="rojo" className="bg-zinc-900">🔴</option>
            <option value="verde" className="bg-zinc-900">🟢</option>
            <option value="rosa" className="bg-zinc-900">🩷</option>
          </select>

          <button onClick={handleAutoLaunch} className={`text-[8px] font-hud px-1 py-0.5 rounded border transition-colors ${autoLaunch ? 'border-overlay-accent/60 bg-overlay-accent/20 text-overlay-accent' : 'border-white/10 text-white/25 hover:text-white/60 hover:border-white/25'}`} title="Inicio automático">⚡</button>
          <input type="range" min={0.2} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} className="w-10 h-1 accent-overlay-accent cursor-pointer" title="Opacidad" />
          <button onClick={() => window.electronAPI.minimizeWindow()} className="w-4 h-4 flex items-center justify-center rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors text-[10px]">–</button>
          <button onClick={() => window.electronAPI.closeWindow()} className="w-4 h-4 flex items-center justify-center rounded hover:bg-red-500/70 text-white/50 hover:text-white transition-colors text-[10px]">✕</button>
        </div>
      </div>

      {/* MODAL DE AYUDA */}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </>
  )
}