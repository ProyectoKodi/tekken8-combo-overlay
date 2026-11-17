import React, { useState, useEffect } from 'react'
import { useOverlayStore } from '../store/overlayStore'

const RANGOS = ["Beginner", "1st Dan", "2nd Dan", "Trainee", "Brawler", "Ranger", "Warrior", "Assailant", "Dominator", "Eliminator", "Challenger", "Revenger", "Destroyer", "Fujin", "Raijin", "Kishin", "Bushin", "Tekken King", "Tekken Supreme", "God of Destruction"]
const PERSONAJES = ["Heihachi", "Kazuya", "Jin", "Jun", "Paul", "Law", "King", "Jack-8", "Lars", "Xiaoyu", "Nina", "Leroy", "Asuka", "Hwoarang", "Bryan", "Claudio", "Azucena", "Raven", "Yoshimitsu", "Shaheen", "Steve", "Sergei", "Leo", "Victor", "Reina", "Eddy"]

interface RankTrackerProps {
  compact?: boolean
}

const RankTracker: React.FC<RankTrackerProps> = ({ compact }) => {
  const { tekkenId, setTekkenId, rankData, setRankData, incrementWin, incrementLoss, resetSession, fetchOnlineRankData, t } = useOverlayStore()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(rankData || {
    playerName: tekkenId || 'SpringanVnzla',
    tekkenIdCode: '2MJ4-GEqa-Dqrj',
    rank: 'God of Destruction',
    points: '245856',
    glicko: 'μ 1327',
    prowess: '248.183',
    region: 'Americas',
    mainChar: 'Victor',
    wins: 0,
    losses: 0
  })
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  useEffect(() => {
    if (rankData) {
      setFormData(prev => ({ ...prev, ...rankData }))
    } else if (tekkenId) {
      setFormData(prev => ({ ...prev, playerName: tekkenId }))
    }
  }, [rankData, tekkenId])

  const handleSave = () => {
    setTekkenId(formData.playerName)
    setRankData(formData)
    setIsEditing(false)
  }

  const handleSyncOnline = async () => {
    const idToSearch = formData.tekkenIdCode || formData.playerName || tekkenId
    if (!idToSearch) {
      setSyncMsg('Introduce un ID')
      setTimeout(() => setSyncMsg(''), 3000)
      return
    }
    setSyncing(true)
    setSyncMsg('Consultando Wavu API...')
    try {
      await fetchOnlineRankData(idToSearch)
      setSyncing(false)
      setSyncMsg('¡Sincronizado con Wavu!')
      setTimeout(() => setSyncMsg(''), 3000)
    } catch {
      setSyncing(false)
      setSyncMsg('No hallado en API (Usa Guardar)')
      setTimeout(() => setSyncMsg(''), 3000)
    }
  }

  const totalMatches = (rankData?.wins ?? formData.wins ?? 0) + (rankData?.losses ?? formData.losses ?? 0)
  const winRate = totalMatches > 0 ? Math.round(((rankData?.wins ?? formData.wins ?? 0) / totalMatches) * 100) : 0

  const selectStyle = "bg-neutral-900 text-white p-1.5 rounded border border-overlay-accent/30 outline-none w-full text-xs"
  const inputStyle = "bg-neutral-900 border border-overlay-accent/30 rounded px-2 py-1.5 text-white text-xs w-full"

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 p-3 bg-black/95 border border-overlay-accent rounded-lg no-drag cursor-default z-50 w-72 text-white text-xs font-hud shadow-2xl">
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-bold text-overlay-accent uppercase">⚙️ EWGF / Wavu Profile Editor</h3>
          <button onClick={() => setIsEditing(false)} className="text-white/40 hover:text-white">✕</button>
        </div>
        <p className="text-[9px] text-white/50 mb-1">Usa Web Sync para consultar la API de Wavu Wank (`?_format=json`) o guarda manual:</p>

        <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-1">
          <label className="text-[10px] text-white/50">Player Name / Tekken ID</label>
          <input type="text" value={formData.playerName} onChange={(e) => setFormData({...formData, playerName: e.target.value})} placeholder="SpringanVnzla" className={inputStyle} />

          <label className="text-[10px] text-white/50">Tekken ID Code</label>
          <input type="text" value={formData.tekkenIdCode} onChange={(e) => setFormData({...formData, tekkenIdCode: e.target.value})} placeholder="2MJ4-GEqa-Dqrj" className={inputStyle} />

          <label className="text-[10px] text-white/50">Rank</label>
          <select value={formData.rank} onChange={(e) => setFormData({...formData, rank: e.target.value})} className={selectStyle}>
              {RANGOS.map(r => <option key={r} value={r} className="bg-neutral-900">{r}</option>)}
          </select>

          <label className="text-[10px] text-white/50">Main Character</label>
          <select value={formData.mainChar} onChange={(e) => setFormData({...formData, mainChar: e.target.value})} className={selectStyle}>
              {PERSONAJES.map(p => <option key={p} value={p} className="bg-neutral-900">{p}</option>)}
          </select>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-white/50">Glicko (μ)</label>
              <input type="text" value={formData.glicko} onChange={(e) => setFormData({...formData, glicko: e.target.value})} placeholder="μ 1327" className={inputStyle} />
            </div>
            <div>
              <label className="text-[10px] text-white/50">Tekken Prowess</label>
              <input type="text" value={formData.prowess} onChange={(e) => setFormData({...formData, prowess: e.target.value})} placeholder="248.183" className={inputStyle} />
            </div>
          </div>
        </div>

        <div className="flex gap-1.5 mt-2">
          <button onClick={handleSave} className="flex-1 text-black font-bold uppercase cursor-pointer bg-overlay-accent p-2 rounded hover:bg-white transition-colors text-[10px]">Guardar</button>
          <button onClick={handleSyncOnline} disabled={syncing} className="flex-1 text-white font-bold uppercase cursor-pointer bg-sky-600 p-2 rounded hover:bg-sky-500 transition-colors text-[10px] disabled:opacity-50">
            {syncing ? 'Sync...' : '🔄 Web Sync'}
          </button>
        </div>
        {syncMsg && <div className="text-center text-[10px] text-amber-400 mt-1">{syncMsg}</div>}
      </div>
    )
  }

  if (compact) {
    return (
      <div className="flex items-center justify-between bg-black/90 border border-overlay-accent/40 rounded px-3 py-1.5 text-xs font-hud no-drag cursor-pointer shadow-lg" onClick={() => setIsEditing(true)}>
        <div className="flex items-center gap-2">
          <span className="text-overlay-accent font-bold">{rankData?.playerName || formData.playerName || 'Player'}</span>
          <span className="text-white/30">|</span>
          <span className="text-white/80 font-semibold">{rankData?.rank || formData.rank || 'Warrior'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-sky-400 font-bold">{rankData?.glicko || formData.glicko || 'μ 1327'}</span>
          <span className="text-emerald-400 text-[10px] font-bold">W:{rankData?.wins ?? 0} L:{rankData?.losses ?? 0} ({winRate}%)</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative bg-gradient-to-r from-[#0d1117] via-[#161b22] to-[#0d1117] border border-overlay-accent/40 rounded-xl p-3 backdrop-blur-md w-full no-drag overflow-hidden shadow-2xl flex items-center justify-between h-28 text-white font-hud">

        {/* Izquierda: Avatar / Glicko badge */}
        <div className="flex items-center gap-3">
          <div className="relative w-16 h-16 rounded-lg bg-neutral-800 border border-overlay-accent/30 overflow-hidden flex items-center justify-center shadow-inner">
            <span className="text-2xl font-black text-overlay-accent uppercase">{rankData?.mainChar?.[0] || formData.mainChar?.[0] || 'T'}</span>
            <div className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] text-center text-emerald-400 font-bold py-0.5 px-1 border-t border-white/10">
              {rankData?.glicko || formData.glicko || 'μ 1327'}
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-black uppercase tracking-wide text-white drop-shadow">{rankData?.playerName || formData.playerName}</span>
              <span className="text-[9px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded tracking-wider">{rankData?.region || formData.region || 'Americas'}</span>
            </div>
            <div className="text-[10px] text-white/50 tracking-wider flex items-center gap-1.5 mt-0.5">
              <span>{rankData?.tekkenIdCode || formData.tekkenIdCode}</span>
              <span className="text-overlay-accent font-semibold">• Main: {rankData?.mainChar || formData.mainChar}</span>
            </div>
            {/* Wins / Losses quick counter */}
            <div className="flex items-center gap-2 mt-1.5 text-[10px]">
              <span className="text-emerald-400 font-bold">W: {rankData?.wins ?? 0}</span>
              <button onClick={(e) => { e.stopPropagation(); incrementWin(); }} className="bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 px-1 rounded text-[9px]">+</button>
              <span className="text-rose-400 font-bold ml-1">L: {rankData?.losses ?? 0}</span>
              <button onClick={(e) => { e.stopPropagation(); incrementLoss(); }} className="bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 px-1 rounded text-[9px]">+</button>
              <span className="text-white/40 ml-1">({winRate}% WR)</span>
              <button onClick={(e) => { e.stopPropagation(); resetSession(); }} className="text-white/30 hover:text-white/70 text-[8px] ml-1" title="Reset W/L">↺</button>
            </div>
          </div>
        </div>

        {/* Derecha: Rango y Tekken Prowess (Estilo EWGF.gg / Wavu) */}
        <div className="flex flex-col items-end justify-center pr-2">
            <div className="text-[13px] font-black text-amber-400 uppercase tracking-widest italic drop-shadow-lg text-right max-w-[200px] truncate">
                {rankData?.rank || formData.rank || 'God of Destruction'}
            </div>
            <div className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">
                Tekken Prowess
            </div>
            <div className="text-[13px] font-bold text-overlay-accent tracking-widest">
                {rankData?.prowess || formData.prowess || '248.183'}
            </div>
        </div>

        {/* Botón de configuración en esquina superior derecha */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <button onClick={() => setIsEditing(true)} className="text-[8px] font-hud text-white/40 hover:text-overlay-accent uppercase bg-black/40 px-2 py-1 rounded border border-white/10 flex items-center gap-1">
            ⚙️ Editar
          </button>
        </div>
    </div>
  )
}
export default RankTracker
