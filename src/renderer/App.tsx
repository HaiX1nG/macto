/**
 * App Component
 *
 * Main application component for Macto - Voice & Chat Application.
 */

import { ConfigProvider, App as AntdApp } from 'antd'
import { theme } from 'antd'
import { useEffect } from 'react'
import { useThemeStore } from './stores/themeStore'
import { useAuthStore } from './stores/authStore'
import { MainLayout } from './components/layout/MainLayout'
import { LoginPage } from './components/auth/LoginPage'
import { UpdateNotification } from './components/UpdateNotification'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { WebSocketIndicator } from './components/ui/WebSocketIndicator'
import { useUserStatusPolling } from './hooks/useUserStatusPolling'
import './styles/index.css'

// 主题颜色映射
const themeColors: Record<string, { primary: string; bg: string; text: string }> = {
  sakura: { primary: '#f8b4c4', bg: '#fff5f7', text: '#4a2c3a' },
  ancient: { primary: '#c9a86c', bg: '#1a1612', text: '#f0e6d8' },
  tech: { primary: '#00d4ff', bg: '#0a0e17', text: '#f0faff' },
}

function AppContent() {
  const { theme: appTheme, initTheme } = useThemeStore()
  const { isAuthenticated, initAuth } = useAuthStore()

  // Initialize theme on app start
  useEffect(() => {
    initTheme()
  }, [initTheme])

  // Initialize auth from stored tokens on app start
  useEffect(() => {
    initAuth()
  }, [initAuth])

  // Apply theme to document
  useEffect(() => {
    const isDark = appTheme === 'ancient' || appTheme === 'tech'
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    document.documentElement.setAttribute('data-theme', appTheme)
  }, [appTheme])

  // Poll user status for sync with backend
  useUserStatusPolling()

  const currentTheme = themeColors[appTheme] || themeColors.sakura
  const isDark = appTheme === 'ancient' || appTheme === 'tech'

  return (
    <ConfigProvider
      getPopupContainer={(node) => {
        if (node) {
          // Find the closest modal container or return parent
          const findModalContainer = (el: HTMLElement): HTMLElement | null => {
            if (el.classList.contains('macto-modal-container')) return el
            if (el.parentElement) return findModalContainer(el.parentElement)
            return null
          }
          const modalContainer = findModalContainer(node)
          if (modalContainer) return modalContainer
          return node.parentNode as HTMLElement
        }
        return document.body
      }}
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: currentTheme.primary,
          colorBgContainer: currentTheme.bg,
          colorBgElevated: currentTheme.bg,
          colorText: currentTheme.text,
          borderRadius: 8,
        },
        components: {
          Modal: {
            contentBg: currentTheme.bg,
            headerBg: currentTheme.bg,
            footerBg: currentTheme.bg,
            titleColor: currentTheme.text,
          },
          Tabs: {
            itemColor: currentTheme.text,
            itemSelectedColor: currentTheme.primary,
            inkBarColor: currentTheme.primary,
          },
        },
      }}
    >
      <AntdApp>
        {isAuthenticated ? <MainLayout /> : <LoginPage />}
        <UpdateNotification />
        <WebSocketIndicator />
      </AntdApp>
    </ConfigProvider>
  )
}

export default function App() {
  return (
    <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <AppContent />
    </ErrorBoundary>
  )
}
