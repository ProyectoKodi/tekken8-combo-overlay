import es from './es.json'
import en from './en.json'
import pt from './pt.json'

export type Language = 'es' | 'en' | 'pt'

export const locales = {
  es,
  en,
  pt,
}

export const languageNames: Record<Language, string> = {
  es: 'Español',
  en: 'English',
  pt: 'Português',
}

export function getTranslation(lang: Language, path: string, params?: Record<string, string>): string {
  const keys = path.split('.')
  let current: any = locales[lang]

  for (const key of keys) {
    if (current[key] === undefined) {
      // Si no encuentra la traducción, intenta en español (fallback)
      let fallback: any = locales['es']
      for (const k of keys) {
        if (fallback[k] === undefined) return path
        fallback = fallback[k]
      }
      return typeof fallback === 'string' ? fallback : path
    }
    current = current[key]
  }

  if (typeof current !== 'string') return path

  let text = current
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      text = text.replace(`{{${key}}}`, val)
    })
  }
  return text
}