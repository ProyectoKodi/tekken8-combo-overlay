import React, { useState, useEffect } from 'react'
import { useOverlayStore } from '../store/overlayStore'
import { CHARACTER_NAMES } from '../types/combo'
import type { RankData } from '../types/rank'
import { DEFAULT_PROFILE } from '../types/rank'
import { TEKKEN_RANKS } from '../utils/bannerLookup'
import PlayerBanner from './PlayerBanner'

const RANGOS = TEKKEN_RANKS

const PERSONAJES = CHARACTER_NAMES

interface RankTrackerProps {
  compact?: boolean
}

const RankTracker: React.FC<RankTrackerProps> = ({ compact }) => {
  const { tekkenId, setTekkenId, rankData, setRankData, incrementWin, incrementLoss, resetSession, t } = useOverlayStore()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(rankData || {
    playerName: '',
    tekkenIdCode: '',
    rank: 'Beginner',
    points: '0',
    glicko: '',
    prowess: '',
    region: '',
    mainChar: 'Heihachi',
    wins: 0,
    losses: 0,
    platform: 'Steam',
    language: 'Spanish (Español)',
    message: '',
    lastSeen: 'hace unos momentos'
  })

  useEffect(() => {
    if (rankData) setFormData(rankData)
  }, [rankData])

  const handleSave = () => {
    setTekkenId(formData.playerName)
    setRankData(formData)
    setIsEditing(false)
  }

  const handleClear = () => {
    localStorage.removeItem('t8_rank_data')
    setRankData(null)
    setFormData({
      playerName: '', tekkenIdCode: '', rank: 'Beginner', points: '0', glicko: '', prowess: '', region: '', mainChar: 'Heihachi', wins: 0, losses: 0, platform: 'Steam', language: 'Spanish (Español)', message: '', lastSeen: 'hace unos momentos'
    })
    setIsEditing(false)
  }

  // Función para abrir la web de ewgf.gg (usando el navegador por defecto o ventana flotante)
  const openEwgfProfile = () => {
    // Si el usuario ya tiene un Tekken ID, podemos intentar buscar directamente
    const query = formData.tekkenIdCode || formData.playerName
    const url = query 
      ? `https://ewgf.gg/search?q=${encodeURIComponent(query)}` 
      : 'https://ewgf.gg'
    
    // Usamos window.open (abrirá en el navegador por defecto)
    // Si prefieres ventana flotante, tendrías que configurar un IPC
    window.open(url, '_blank')
  }

  const totalMatches = (rankData?.wins ?? 0) + (rankData?.losses ?? 0)
  const winRate = totalMatches > 0 ? Math.round(((rankData?.wins ?? 0) / totalMatches) * 100) : 0

  const inputStyle = "bg-[#0f172a] border border-white/10 rounded px-2 py-1.5 text-white text-xs w-full focus:border-overlay-accent outline-none"
  const labelStyle = "text-[10px] text-white/50 uppercase tracking-wider font-bold mb-1"

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 p-3 bg-[#0f172a] border border-overlay-accent rounded-lg no-drag cursor-default z-50 w-80 text-white text-xs font-hud shadow-2xl">
        <div className="flex justify-between items-center mb-1 border-b border-white/10 pb-2">
          <h3 className="font-bold text-overlay-accent uppercase">⚙️ Editor de Perfil</h3>
          <button onClick={() => setIsEditing(false)} className="text-white/40 hover:text-white">✕</button>
        </div>

        {/* BOTÓN PARA IR A EWGF.GG */}
        <button 
          onClick={openEwgfProfile} 
          className="w-full text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 py-1.5 rounded transition-colors flex items-center justify-center gap-1"
        >
          🌐 Consultar en EWGF.gg
        </button>

        <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1">
          <div>
            <label className={labelStyle}>Nombre</label>
            <input type="text" value={formData.playerName} onChange={(e) => setFormData({...formData, playerName: e.target.value})} placeholder="Tu nombre..." className={inputStyle} />
          </div>
          <div>
            <label className={labelStyle}>Tekken ID</label>
            <input type="text" value={formData.tekkenIdCode} onChange={(e) => setFormData({...formData, tekkenIdCode: e.target.value})} placeholder="XXXX-XXXX-XXXX" className={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelStyle}>Rango</label>
              <select value={formData.rank} onChange={(e) => setFormData({...formData, rank: e.target.value})} className={inputStyle}>
                  {RANGOS.map(r => <option key={r} value={r} className="bg-neutral-900">{r}</option>)}
              </select>
            </div>
            <div>
              <label className={labelStyle}>Main</label>
              <select value={formData.mainChar} onChange={(e) => setFormData({...formData, mainChar: e.target.value})} className={inputStyle}>
                  {PERSONAJES.map(p => <option key={p} value={p} className="bg-neutral-900">{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelStyle}>Glicko (μ)</label>
              <input type="text" value={formData.glicko} onChange={(e) => setFormData({...formData, glicko: e.target.value})} placeholder="μ 1327" className={inputStyle} />
            </div>
            <div>
              <label className={labelStyle}>Prowess</label>
              <input type="text" value={formData.prowess} onChange={(e) => setFormData({...formData, prowess: e.target.value})} placeholder="248.183" className={inputStyle} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelStyle}>Región</label>
              <input type="text" value={formData.region} onChange={(e) => setFormData({...formData, region: e.target.value})} placeholder="Americas" className={inputStyle} />
            </div>
            <div>
              <label className={labelStyle}>Plataforma</label>
              <input type="text" value={formData.platform} onChange={(e) => setFormData({...formData, platform: e.target.value})} placeholder="Steam" className={inputStyle} />
            </div>
          </div>
          <div>
            <label className={labelStyle}>Idioma</label>
            <input type="text" value={formData.language} onChange={(e) => setFormData({...formData, language: e.target.value})} placeholder="Spanish (Español)" className={inputStyle} />
          </div>
          <div>
            <label className={labelStyle}>Mensaje</label>
            <input type="text" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} placeholder="¡A pelear!" className={inputStyle} />
          </div>
          <div>
            <label className={labelStyle}>Última conexión</label>
            <input type="text" value={formData.lastSeen} onChange={(e) => setFormData({...formData, lastSeen: e.target.value})} placeholder="hace 3 días" className={inputStyle} />
          </div>
        </div>

        <div className="flex gap-2 mt-2 pt-2 border-t border-white/10">
          <button onClick={handleSave} className="flex-1 text-black font-bold uppercase bg-overlay-accent p-2 rounded hover:bg-white transition-colors text-[10px]">Guardar</button>
          <button onClick={handleClear} className="text-rose-400 font-bold uppercase bg-rose-950/40 p-2 rounded hover:bg-rose-900/60 transition-colors text-[10px]">Borrar</button>
        </div>
      </div>
    )
  }

  if (!rankData) {
    return (
      <div className="relative bg-[#0f172a] border border-white/10 rounded-xl p-2.5 w-full no-drag shadow-lg flex items-center justify-between h-14 text-white font-hud">
        <span className="text-[10px] font-bold text-white/50 uppercase">Rank Tracker (Vacío)</span>
        <button onClick={() => setIsEditing(true)} className="text-[9px] font-hud text-overlay-accent uppercase bg-overlay-accent/10 hover:bg-overlay-accent/30 px-2.5 py-1 rounded border border-overlay-accent/30">
          ⚙️ Configurar
        </button>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="flex items-center justify-between bg-[#0f172a] border border-white/10 rounded px-3 py-1.5 text-xs font-hud no-drag cursor-pointer shadow-lg" onClick={() => setIsEditing(true)}>
        <div className="flex items-center gap-2">
          <span className="text-overlay-accent font-bold">{rankData.playerName || 'Player'}</span>
          <span className="text-white/30">|</span>
          <span className="text-white/80 font-semibold">{rankData.rank || 'Warrior'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-sky-400 font-bold">{rankData.glicko || ''}</span>
          <span className="text-emerald-400 text-[10px] font-bold">W:{rankData.wins ?? 0} L:{rankData.losses ?? 0} ({winRate}%)</span>
        </div>
      </div>
    )
  }

  // DISEÑO PRINCIPAL: ficha de jugador con el banner
  const profile: RankData = { ...DEFAULT_PROFILE, ...(rankData as Partial<RankData>) }

  return (
    <PlayerBanner
      profile={profile}
      onEdit={() => setIsEditing(true)}
      onWin={incrementWin}
      onLoss={incrementLoss}
      onReset={resetSession}
    />
  )
}
export default RankTracker