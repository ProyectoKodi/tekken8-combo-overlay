import { useEffect, useState } from 'react'

export default function UpdateBanner() {
  const [updateInfo, setUpdateInfo] = useState<{ version: string } | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const unAvail = window.electronAPI.onUpdateAvailable((info) => setUpdateInfo(info))
    const unDown = window.electronAPI.onUpdateDownloaded(() => {
      setIsDownloading(false)
      setIsReady(true)
    })
    return () => { unAvail(); unDown() }
  }, [])

  if (!updateInfo) return null

  const handleUpdate = () => {
    if (isReady) {
      window.electronAPI.quitAndInstall()
    } else {
      setIsDownloading(true)
      window.electronAPI.startUpdateDownload()
    }
  }

  return (
    <div className="bg-overlay-accent/20 border-b border-overlay-accent/50 px-4 py-1 flex items-center justify-between animate-slide-down">
      <span className="text-[10px] font-hud text-white">
        {isReady 
          ? '¡Actualización lista! Reinicia para aplicar.' 
          : `Nueva versión disponible: v${updateInfo.version}`}
      </span>
      <button 
        onClick={handleUpdate} 
        disabled={isDownloading}
        className="text-[9px] font-bold bg-overlay-accent text-black px-2 py-0.5 rounded hover:opacity-90 disabled:opacity-50"
      >
        {isDownloading ? 'Descargando…' : isReady ? 'Reiniciar e Instalar' : 'Actualizar ahora'}
      </button>
    </div>
  )
}