import React, { useState } from 'react'
import { useOverlayStore } from '../store/overlayStore'

const RANGOS = ["Beginner", "1st Dan", "2nd Dan", "Trainee", "Brawler", "Ranger", "Warrior", "Assailant", "Dominator", "Eliminator", "Challenger", "Revenger", "Destroyer", "Fujin", "Raijin", "Kishin", "Bushin", "Tekken King", "Tekken Supreme", "God of Destruction"]
const PERSONAJES = ["Heihachi", "Kazuya", "Jin", "Jun", "Paul", "Law", "King", "Jack-8", "Lars", "Xiaoyu", "Nina", "Leroy", "Asuka", "Hwoarang", "Bryan", "Claudio", "Azucena", "Raven", "Yoshimitsu", "Shaheen", "Steve", "Sergei", "Leo", "Victor", "Reina", "Eddy"]

const RankTracker: React.FC = () => {
  const { tekkenId, setTekkenId, rankData, setRankData } = useOverlayStore()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(rankData || { playerName: tekkenId || '', rank: 'Warrior', points: '0', mainChar: 'Heihachi' })

  const handleSave = () => {
    setTekkenId(formData.playerName)
    setRankData(formData)
    setIsEditing(false)
  }

  const selectStyle = "bg-neutral-900 text-white p-1 rounded border border-overlay-accent/30 outline-none w-full text-xs";
  const inputStyle = "bg-neutral-900 border border-overlay-accent/30 rounded px-2 py-1 text-white text-xs w-full";

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 p-3 bg-black/95 border border-overlay-accent rounded-lg no-drag cursor-default z-50 w-60 text-white text-xs font-hud">
        <h3 className="font-bold text-overlay-accent uppercase mb-1">Editar Perfil</h3>
        <input type="text" value={formData.playerName} onChange={(e) => setFormData({...formData, playerName: e.target.value})} placeholder="Tekken ID..." className={inputStyle} />
        <select value={formData.rank} onChange={(e) => setFormData({...formData, rank: e.target.value})} className={selectStyle}>
            {RANGOS.map(r => <option key={r} value={r} className="bg-neutral-900">{r}</option>)}
        </select>
        <select value={formData.mainChar} onChange={(e) => setFormData({...formData, mainChar: e.target.value})} className={selectStyle}>
            {PERSONAJES.map(p => <option key={p} value={p} className="bg-neutral-900">{p}</option>)}
        </select>
        <input type="number" value={formData.points} onChange={(e) => setFormData({...formData, points: e.target.value})} placeholder="Puntos..." className={inputStyle} />
        <button onClick={handleSave} className="text-black font-bold uppercase cursor-pointer mt-2 bg-overlay-accent p-2 rounded hover:bg-white transition-colors">Guardar</button>
      </div>
    )
  }

  return (
    <div className="relative bg-gradient-to-r from-black/90 to-black/60 border border-overlay-accent/30 rounded-lg p-0 backdrop-blur-md w-full no-drag overflow-hidden shadow-2xl flex items-center h-24">
        {/* Banner Izquierdo - Texto */}
        <div className="flex-1 p-4 flex flex-col justify-center">
            <span className="text-[10px] font-hud text-white/50 uppercase tracking-widest">{tekkenId || 'PLAYER'}</span>
            <div className="text-[20px] font-hud font-black text-white uppercase italic tracking-wider leading-none shadow-black drop-shadow-md">
                {formData.playerName || 'NAME'}
            </div>
            <div className="text-[12px] font-hud font-bold text-overlay-accent uppercase tracking-wider">
                {rankData?.mainChar || 'Character'}
            </div>
        </div>

        {/* Banner Central - Rango/Puntos */}
        <div className="flex flex-col items-center justify-center px-4 border-l border-white/10 h-full bg-black/20">
            <span className="text-[8px] text-white/40 uppercase tracking-widest mb-1">Ranking Oficial</span>
            <div className="text-[12px] font-hud font-bold bg-overlay-accent/20 text-overlay-accent px-3 py-1 rounded border border-overlay-accent/50 uppercase tracking-wider mb-1">
                {rankData?.rank || 'Warrior'}
            </div>
            <div className="text-[10px] font-hud text-white tracking-widest font-bold">
                {rankData?.points || '0'} PTS
            </div>
        </div>

        {/* Botón Editor en esquina */}
        <button onClick={() => setIsEditing(true)} className="absolute top-2 right-2 text-[8px] font-hud text-white/30 hover:text-overlay-accent uppercase">Editor</button>
    </div>
  )
}
export default RankTracker
