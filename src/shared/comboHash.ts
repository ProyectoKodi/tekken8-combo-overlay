// Hash determinista (djb2) compartido por la detección de duplicados y por los ids de combo.
function hashString(value: string): string {
  let h = 5381
  for (let i = 0; i < value.length; i++) h = ((h << 5) + h + value.charCodeAt(i)) | 0
  return (h >>> 0).toString(16)
}

/**
 * Huella del contenido de un combo. Sirve para detectar combos nuevos o duplicados:
 * cambia si cambia el daño, y por eso NO se usa como id.
 */
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

  return hashString(s)
}

/**
 * Identidad estable de un combo: depende solo de personaje, notación y autor,
 * nunca del orden de la lista ni del daño. Así los favoritos, notas y combos
 * aprendidos siguen apuntando al mismo combo cuando la web se reordena.
 */
export function comboId(character: string, notation: string, creator = ''): string {
  return hashString(
    [
      character.replace(/\s+/g, ' ').trim().toLowerCase(),
      notation.replace(/\s+/g, '').toLowerCase(),
      creator.replace(/\s+/g, ' ').trim().toLowerCase(),
    ].join('|')
  )
}

/** Id público usado en la UI: `<personaje>-<hash>`, siempre en minúsculas. */
export function makeComboId(character: string, notation: string, creator = ''): string {
  const prefix = character.trim().toLowerCase().replace(/\s+/g, '-')
  return `${prefix}-${comboId(character, notation, creator)}`
}
