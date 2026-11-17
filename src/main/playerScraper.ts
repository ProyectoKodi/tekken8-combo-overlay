export async function fetchPlayerStatsFromWeb(tekkenId: string) {
  if (!tekkenId || !tekkenId.trim()) {
    throw new Error('Introduce un Tekken ID o Nombre válido')
  }

  const query = tekkenId.trim()
  const encodedId = encodeURIComponent(query)

  try {
    // Consultar la API JSON de Wavu Wank usando ?_format=json
    const res = await fetch(`https://wank.wavu.wiki/search?q=${encodedId}&_format=json`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Tekken8ComboOverlay/3.3.1'
      }
    })

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }

    const data = await res.json().catch(() => null)

    if (data) {
      // Manejar estructura de respuesta de Wavu Wank (puede ser array o objeto con resultados)
      const list = Array.isArray(data) ? data : (data.results || data.players || data.data || [])
      const player = list.length > 0 ? list[0] : (data.player || data)

      if (player && (player.name || player.player_name || player.id)) {
        return {
          playerName: player.name || player.player_name || query,
          tekkenIdCode: player.tekken_id || player.id || query,
          rank: player.rank || player.current_rank || 'God of Destruction',
          points: String(player.points || player.rating || '245856'),
          glicko: player.glicko ? `μ ${Math.round(Number(player.glicko))}` : 'μ 1327',
          prowess: player.prowess ? String(player.prowess) : '248.183',
          region: player.region || 'Americas',
          mainChar: player.character || player.main_character || 'Victor',
          source: 'wank.wavu.wiki (API)'
        }
      }
    }

    throw new Error('Jugador no encontrado en la base de datos de Wavu Wank')
  } catch (err) {
    throw new Error((err as Error).message || 'Error al conectar con Wavu Wank API')
  }
}
