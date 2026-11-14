// Hash determinista para detectar duplicados y combos nuevos.
export function comboHash(c: {
  character: string
  notation: string
  creator?: string
  damage?: number
}): string {
  const s = [
    c.character.trim().toLowerCase(),
    c.notation.replace(/\s+/g, '').toLowerCase(),
    (c.creator ?? '').trim().toLowerCase(),
    c.damage ?? 0,
  ].join('|')

  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return (h >>> 0).toString(16)
}