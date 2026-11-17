import * as cheerio from 'cheerio'

export async function fetchPlayerStatsFromWeb(tekkenId: string) {
  if (!tekkenId || !tekkenId.trim()) {
    throw new Error('Introduce un Tekken ID válido')
  }

  const query = tekkenId.trim()
  const encodedId = encodeURIComponent(query)

  try {
    // 1. Intentar Wavu Wank (wank.wavu.wiki)
    const res = await fetch(`https://wank.wavu.wiki/search?q=${encodedId}`)
    if (res.ok) {
      const html = await res.text()
      const $ = cheerio.load(html)
      let profileLink = ''
      $('a[href*="/player/"]').each((_, el) => {
        if (!profileLink) {
          profileLink = $(el).attr('href') || ''
        }
      })

      if (profileLink) {
        const profileUrl = profileLink.startsWith('http') ? profileLink : `https://wank.wavu.wiki${profileLink}`
        const pRes = await fetch(profileUrl)
        if (pRes.ok) {
          const pHtml = await pRes.text()
          const p$ = cheerio.load(pHtml)

          const playerName = p$('h1').first().text().trim() || query
          const rank = p$('.rank, .badge, [class*="rank"]').first().text().trim() || 'Warrior'
          const points = p$('.points, [class*="rating"], [class*="glicko"]').first().text().replace(/[^0-9]/g, '') || '1500'
          const mainChar = p$('.character, [class*="char"]').first().text().trim() || 'Heihachi'

          return {
            playerName,
            rank: rank.length > 30 ? 'Warrior' : (rank || 'Warrior'),
            points: points || '1500',
            mainChar: mainChar.length > 20 ? 'Heihachi' : (mainChar || 'Heihachi'),
            source: 'wank.wavu.wiki'
          }
        }
      }
    }

    // 2. Fallback a EWGF.gg
    const ewgfRes = await fetch(`https://www.ewgf.gg/search?q=${encodedId}`)
    if (ewgfRes.ok) {
      const ewgfHtml = await ewgfRes.text()
      const e$ = cheerio.load(ewgfHtml)
      let ewgfProfile = ''
      e$('a[href*="/player/"]').each((_, el) => {
        if (!ewgfProfile) ewgfProfile = e$(el).attr('href') || ''
      })

      if (ewgfProfile) {
        const url = ewgfProfile.startsWith('http') ? ewgfProfile : `https://www.ewgf.gg${ewgfProfile}`
        const uRes = await fetch(url)
        if (uRes.ok) {
          const uHtml = await uRes.text()
          const u$ = cheerio.load(uHtml)

          return {
            playerName: query,
            rank: u$('.rank').first().text().trim() || 'Warrior',
            points: u$('.points, .rating').first().text().replace(/[^0-9]/g, '') || '1500',
            mainChar: u$('.character').first().text().trim() || 'Heihachi',
            source: 'ewgf.gg'
          }
        }
      }
    }

    throw new Error('No se encontró el jugador en Wavu Wank ni EWGF')
  } catch (err) {
    throw new Error((err as Error).message || 'Error de conexión con las plataformas')
  }
}
