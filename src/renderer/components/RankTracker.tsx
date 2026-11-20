import React, { useState, useEffect } from 'react'
import { useOverlayStore } from '../store/overlayStore'

// Lista actualizada de rangos de Tekken 8 (hasta God of Destruction)
const RANGOS = [
  "Beginner", "1st Dan", "2nd Dan", "Fighter", "Strategist", "Combatant", 
  "Brawler", "Ranger", "Cavalry", "Warrior", "Assailant", "Dominator", 
  "Vanquisher", "Destroyer", "Eliminator", "Challenger", "Revenger", 
  "Battle Ruler", "Fujin", "Raijin", "Kishin", "Bushin", "Tekken King", 
  "Tekken Emperor", "Tekken God", "Tekken God Supreme", "God of Destruction"
]

// Lista actualizada de personajes (Base + DLCs hasta la fecha)
const PERSONAJES = [
  "Alisa", "Anna", "Armor King", "Asuka", "Azucena", "Bob", "Bryan", "Claudio", 
  "Clive", "Devil Jin", "Dragunov", "Eddy", "Fahkumram", "Feng", "Heihachi", 
  "Hwoarang", "Jack-8", "Jin", "Jun", "Kazuya", "King", "Kuma", "Lars", "Law", 
  "Lee", "Leo", "Leroy", "Lidia", "Lili", "Miary Zo", "Nina", "Panda", "Paul", 
  "Raven", "Reina", "Roger Jr.", "Shaheen", "Steve", "Victor", "Xiaoyu", 
  "Yoshimitsu", "Zafina", "Yujiro Hanma", "Kunimitsu"
]

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

  // DISEÑO PRINCIPAL (Estilo Wavu Wank / Leaderboard)
  return (
    <div className="relative bg-[#0f172a] border border-[#1e293b] rounded-xl w-full no-drag overflow-hidden shadow-2xl flex flex-col md:flex-row text-white font-sans text-sm">
      
      {/* SECCIÓN IZQUIERDA: Avatar e Info */}
      <div className="flex flex-1 p-4 gap-5">
        {/* Avatar (Usamos la inicial del personaje o una imagen si tuvieras) */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-600 flex items-center justify-center relative shadow-inner overflow-hidden">
            <span className="text-5xl font-black text-slate-300 uppercase drop-shadow-md">{rankData.mainChar?.[0] || 'T'}</span>
          </div>
          
          {/* Glicko Badge (Estilo pill verde/rojo) */}
          <div className="flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full text-xs font-bold">
            <span>μ</span>
            <span>{rankData.glicko?.replace('μ ', '') || '1327'}</span>
            <span className="text-emerald-500/60 text-[10px]">σ² 75</span>
          </div>
          <span className="text-[9px] text-slate-500">actualizado recientemente</span>
        </div>

        {/* Info de Texto */}
        <div className="flex flex-col justify-start gap-2 flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-white tracking-wide">{rankData.playerName}</h2>
            <button onClick={() => setIsEditing(true)} className="text-slate-500 hover:text-slate-300 text-xs bg-slate-800/50 p-1.5 rounded-md border border-slate-700">⚙️</button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-mono bg-slate-800/50 px-1.5 py-0.5 rounded text-slate-300">{rankData.tekkenIdCode}</span>
            <button onClick={() => { navigator.clipboard.writeText(rankData.tekkenIdCode || ''); alert('ID copiado'); }} className="hover:text-white" title="Copiar ID">📋</button>
            <div className="w-px h-3 bg-slate-700 mx-1"></div>
            <div className="flex items-center gap-1 hover:text-white cursor-pointer"><span>👤</span> Perfil</div>
            <div className="flex items-center gap-1 hover:text-white cursor-pointer"><span>☆</span> Favorito</div>
            <div className="flex items-center gap-1 hover:text-white cursor-pointer"><span>🛡️</span> Seguro</div>
            <div className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 hover:bg-slate-700 cursor-pointer"><span>🔗</span> Compartir</div>
          </div>

          <div className="flex flex-col gap-1.5 mt-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 w-4 text-center">🎮</span>
              <span className="text-slate-400">Platform:</span>
              <span className="text-blue-400 font-semibold">{rankData.platform || 'Steam'}</span>
              <span className="text-blue-300 font-mono text-[10px]">{rankData.tekkenIdCode || '76561198013128627'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 w-4 text-center">🌐</span>
              <span className="text-slate-400">Language:</span>
              <span className="text-white font-semibold">{rankData.language || 'Spanish (Español)'}</span>
            </div>
            <div className="flex items-start gap-2 text-xs">
              <span className="text-slate-500 w-4 text-center mt-0.5">💬</span>
              <span className="text-slate-400">Player Message:</span>
            </div>
            <div className="ml-6 bg-slate-800/40 border border-slate-700 rounded p-1.5 text-slate-300 italic text-xs min-h-[28px]">
              "{rankData.message || '¡A pelear!'}"
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN DERECHA: Rango, Prowess, etc. */}
      <div className="bg-[#131c2e] border-l border-slate-800 p-4 w-full md:w-72 flex flex-col justify-between">
        
        {/* Rango visual (Aquí iría la imagen del rango, usamos texto estilizado) */}
        <div className="text-center flex flex-col items-center">
          <div className="relative">
            <span className="text-xl font-black text-amber-400 uppercase italic tracking-widest drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
              {rankData.rank || 'Tekken God'}
            </span>
            <div className="absolute -inset-1 bg-amber-500/20 blur-md rounded-full -z-10"></div>
          </div>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">All time highest rank</span>
          
          <div className="mt-2 bg-slate-800/80 border border-slate-700 rounded-full px-3 py-0.5 text-xs font-semibold text-slate-200">
            Top 83% in {rankData.region || 'Americas'}
          </div>
          <span className="text-[10px] text-slate-500 mt-1">Top 87% of Tekken Emperor</span>
        </div>

        {/* Detalles */}
        <div className="flex flex-col gap-2 mt-3 border-t border-slate-800 pt-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <span>📍</span> Region:
            </div>
            <span className="font-semibold text-white">{rankData.region || 'Americas'}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <span>📅</span> Last seen:
            </div>
            <span className="font-semibold text-white">{rankData.lastSeen || 'hace 3 días'}</span>
          </div>
        </div>

        {/* Tekken Prowess Box */}
        <div className="mt-3 bg-[#0a0f18] border border-slate-700 rounded-lg p-2 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest">Tekken Prowess</span>
            <span className="text-lg font-bold text-amber-400 tracking-wide">{rankData.prowess || '248.183'}</span>
          </div>
          <button onClick={() => setIsEditing(true)} className="text-slate-500 hover:text-white text-lg">✎</button>
        </div>

        {/* Contador de W/L */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-xs">
            <span className="text-emerald-400 font-bold">W: {rankData.wins ?? 0}</span>
            <button onClick={(e) => { e.stopPropagation(); incrementWin(); }} className="bg-emerald-500/10 hover:bg-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">+</button>
            <span className="text-rose-400 font-bold ml-2">L: {rankData.losses ?? 0}</span>
            <button onClick={(e) => { e.stopPropagation(); incrementLoss(); }} className="bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 px-2 py-0.5 rounded border border-rose-500/20">+</button>
            <span className="text-slate-500 ml-1">({winRate}%)</span>
            <button onClick={(e) => { e.stopPropagation(); resetSession(); }} className="text-slate-600 hover:text-white text-[10px]" title="Reset">↺</button>
        </div>

      </div>
    </div>
  )
}
export default RankTracker