/**
 * App Component
 *
 * Main application component for Macto - Voice & Chat Application.
 */

import { ConfigProvider, App as AntdApp } from 'antd'
import { theme } from 'antd'
import { useThemeStore } from './stores/themeStore'
import { useAuthStore } from './stores/authStore'
import { MainLayout } from './components/layout/MainLayout'
import { LoginPage } from './components/auth/LoginPage'
import { useWebSocketStatus } from './hooks/useWebSocketStatus'
import './styles/index.css'

// 主题颜色映射
const themeColors: Record<string, { primary: string; bg: string; text: string }> = {
  sakura: { primary: '#f8b4c4', bg: '#fff5f7', text: '#4a2c3a' },
  ancient: { primary: '#c9a86c', bg: '#1a1612', text: '#f0e6d8' },
  tech: { primary: '#00d4ff', bg: '#0a0e17', text: '#f0faff' },
}

function AppContent() {
  const { theme: appTheme } = useThemeStore()
  const { isAuthenticated } = useAuthStore()

  // Initialize WebSocket for status sync
  useWebSocketStatus()

  const currentTheme = themeColors[appTheme] || themeColors.sakura
  const isDark = appTheme === 'ancient' || appTheme === 'tech'

  return (
    <ConfigProvider
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
            bodyBg: currentTheme.bg,
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
      </AntdApp>
    </ConfigProvider>
  )
}

export default function App() {
  return <AppContent />
}