/**
 * App Component
 *
 * Main application component for Macto - Voice & Chat Application.
 *
 * Performance optimizations applied:
 * - React.lazy + Suspense for route-level code splitting
 * - Core modules (chat, voice) loaded eagerly; secondary modules (settings, friends, screen share) lazy-loaded
 * - Unified Skeleton fallback for all lazy boundaries
 * - Performance metrics collection in dev mode
 */

import { ConfigProvider, App as AntdApp } from 'antd'
import { theme } from 'antd'
import { useEffect, lazy, Suspense } from 'react'
import { useTheme } from './hooks/useTheme'
import { useAuthStore } from './stores/authStore'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { SkeletonPage } from './components/ui/Skeleton'
import { usePerformanceMetrics, printPerformanceReport } from './hooks/usePerformanceMetrics'
import { ToastContainer } from './components/ui/Toast'

const MainLayout = lazy(() => import('./components/layout/MainLayout').then(m => ({ default: m.MainLayout })))
const LoginPage = lazy(() => import('./components/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const UpdateNotification = lazy(() => import('./components/UpdateNotification').then(m => ({ default: m.UpdateNotification })))
const WebSocketIndicator = lazy(() => import('./components/ui/WebSocketIndicator').then(m => ({ default: m.WebSocketIndicator })))
const WelcomeFlow = lazy(() => import('./components/onboarding/WelcomeFlow').then(m => ({ default: m.WelcomeFlow })))
import { useOnboarding } from './hooks/useOnboarding'
import { useUserStatusPolling } from './hooks/useUserStatusPolling'
import './styles/index.css'
import './styles/tokens/colors.css'
import './styles/tokens/motion.css'

// 主题颜色映射
const themeColors: Record<string, { primary: string; bg: string; text: string }> = {
  sakura: { primary: '#f8b4c4', bg: '#fff5f7', text: '#4a2c3a' },
  ancient: { primary: '#c9a86c', bg: '#1a1612', text: '#f0e6d8' },
  tech: { primary: '#00d4ff', bg: '#0a0e17', text: '#f0faff' },
}

function AppContent() {
  const { theme: appTheme } = useTheme()
  const { isAuthenticated, initAuth } = useAuthStore()
  const {
    showOnboarding,
    currentStep,
    completeOnboarding,
    skipOnboarding,
    nextStep,
    prevStep,
  } = useOnboarding()

  // Performance metrics collection (dev mode only)
  usePerformanceMetrics({
    enabled: import.meta.env.DEV,
    onReport: printPerformanceReport,
  })

  // Theme initialization is handled by useTheme hook (sets data-theme attribute)
  useEffect(() => {
    const cleanup = initAuth()
    return () => {
      cleanup?.()
    }
  }, [initAuth])

  // Apply theme to document (dark class for Antd algorithm)
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
        <ToastContainer />
        <Suspense fallback={<SkeletonPage />}>
          {isAuthenticated ? <MainLayout /> : <LoginPage />}
        </Suspense>
        <Suspense fallback={null}>
          <UpdateNotification />
        </Suspense>
        <Suspense fallback={null}>
          <WebSocketIndicator />
        </Suspense>
        {showOnboarding && (
          <Suspense fallback={null}>
            <WelcomeFlow
              currentStep={currentStep}
              onNext={nextStep}
              onPrev={prevStep}
              onSkip={skipOnboarding}
              onComplete={completeOnboarding}
            />
          </Suspense>
        )}
      </AntdApp>
    </ConfigProvider>
  )
}

export default function App() {
  return (
    <ErrorBoundary showDetails={import.meta.env.DEV}>
      <AppContent />
    </ErrorBoundary>
  )
}
