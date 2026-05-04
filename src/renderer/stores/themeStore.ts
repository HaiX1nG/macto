import { create } from 'zustand'

export type AppTheme = 'sakura' | 'ancient' | 'tech'

export interface ThemeState {
  theme: AppTheme
  setTheme: (theme: AppTheme) => void
  initTheme: () => void
}

const applyThemeToDocument = (theme: AppTheme) => {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('app-theme', theme)
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'sakura',

  setTheme: (theme) => {
    set({ theme })
    applyThemeToDocument(theme)
  },

  initTheme: () => {
    const savedTheme = localStorage.getItem('app-theme') as AppTheme | null
    if (savedTheme && ['sakura', 'ancient', 'tech'].includes(savedTheme)) {
      set({ theme: savedTheme })
      applyThemeToDocument(savedTheme)
    } else {
      applyThemeToDocument('sakura')
    }
  },
}))
