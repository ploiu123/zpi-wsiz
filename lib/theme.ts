export type Theme = 'light' | 'dark' | 'system'

export const THEME_STORAGE_KEY = 'theme'

export const LIGHT_SCHEME_QUERY = '(prefers-color-scheme: light)'

export function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia(LIGHT_SCHEME_QUERY).matches ? 'light' : 'dark'
}

export function applyTheme(theme: Theme) {
  const resolved = resolveTheme(theme)
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  root.classList.toggle('light', resolved === 'light')
}

export function readStoredTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    return isTheme(saved) ? saved : 'system'
  } catch {
    return 'system'
  }
}

export function storeTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
  }
}
