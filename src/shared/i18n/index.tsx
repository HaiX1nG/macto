import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Locale } from './zh'

// Available languages
export const LOCALES = ['zh', 'en'] as const
export type Locale = typeof LOCALES[number]

// Translation messages type
export type TranslationMessages = typeof zh

// Context type
interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  toggleLocale: () => void
  t: (key: string) => string
  isChinese: boolean
  isEnglish: boolean
}

// Create context
const I18nContext = createContext<I18nContextType | undefined>(undefined)

// Get system locale
const getSystemLocale = (): Locale => {
  if (typeof window !== 'undefined' && window.navigator) {
    const navLocale = window.navigator.language
    if (navLocale.includes('zh')) return 'zh'
  }
  return 'en'
}

// Translation function
const getTranslation = (locale: Locale, key: string): string => {
  const messages = locale === 'zh' ? zh : en
  const keys = key.split('.')
  let value: unknown = messages

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      return key
    }
  }

  return typeof value === 'string' ? value : key
}

// Provider component
export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem('locale') as Locale
    return saved && LOCALES.includes(saved) ? saved : getSystemLocale()
  })

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)
  }

  const toggleLocale = () => {
    setLocaleState(prev => prev === 'zh' ? 'en' : 'zh')
  }

  const t = (key: string) => getTranslation(locale, key)

  const value: I18nContextType = {
    locale,
    setLocale,
    toggleLocale,
    t,
    isChinese: locale === 'zh',
    isEnglish: locale === 'en',
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

// Custom hook
export const useI18n = () => {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}
