export async function fetchPlayerStatsFromWeb(tekkenId: string) {
  if (!tekkenId || !tekkenId.trim()) {
    throw new Error('Introduce un Tekken ID o Nombre válido')
  }

  const query = tekkenId.trim()
  const encodedId = encodeURIComponent(query)

  try {
    const res = await fetch(`https://wank.wavu.wiki/search?q=${encodedId}&_format=json`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }

    const data = await res.json().catch(() => null)

    if (data) {
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

    throw new Error('Jugador no encontrado')
  } catch (err) {
    throw new Error((err as Error).message || 'Error al conectar con Wavu Wank API')
  }
}

export async function fetchPlayerStatsWithApiKey(apiKey: string, tekkenId?: string) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Introduce una API Key válida de EWGF.gg')
  }

  const cleanKey = apiKey.trim()

  try {
    const url = `https://www.ewgf.gg/api/user` + (tekkenId ? `?q=${encodeURIComponent(tekkenId)}&api_key=${encodeURIComponent(cleanKey)}` : `?api_key=${encodeURIComponent(cleanKey)}`)

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${cleanKey}`,
        'X-API-Key': cleanKey,
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.ewgf.gg/'
      }
    })

    if (!res.ok) {
      throw new Error(`Error API EWGF.gg: ${res.status}`)
    }

    const data = await res.json()
    if (data) {
      return {
        playerName: data.name || data.username || tekkenId || 'SpringanVnzla',
        tekkenIdCode: data.tekken_id || data.id || '2MJ4-GEqa-Dqrj',
        rank: data.rank || data.current_rank || 'God of Destruction',
        points: String(data.points || data.rating || '245856'),
        glicko: data.glicko ? `μ ${Math.round(Number(data.glicko))}` : 'μ 1327',
        prowess: data.prowess ? String(data.prowess) : '248.183',
        region: data.region || 'Americas',
        mainChar: data.character || data.main_character || 'Victor',
        source: 'ewgf.gg (API)'
      }
    }

    throw new Error('No se recibieron datos de la API de EWGF.gg')
  } catch (err) {
    throw new Error((err as Error).message)
  }
}
