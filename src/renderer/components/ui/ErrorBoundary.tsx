/**
 * ErrorBoundary Component
 *
 * Catches JavaScript errors in child component tree and displays fallback UI
 */

import { Component, type ReactNode, type ErrorInfo } from 'react'
import { Button } from '@renderer/components/ui/Button'
import { ReloadOutlined, BugOutlined, HomeOutlined } from '@ant-design/icons'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    this.props.onError?.(error, errorInfo)

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    const { hasError, error, errorInfo } = this.state
    const { children, fallback, showDetails = false } = this.props

    if (hasError) {
      if (fallback) {
        return fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)] p-4">
          <div className="max-w-md w-full text-center animate-fade-in-up">
            {/* Error Icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--color-dnd)]/20 flex items-center justify-center">
              <BugOutlined className="text-4xl text-[var(--color-dnd)]" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-[var(--color-text-normal)] mb-2">
              出错了
            </h1>

            {/* Description */}
            <p className="text-[var(--color-text-muted)] mb-6">
              应用遇到了一个错误，请尝试刷新页面或返回首页。
            </p>

            {/* Error details (development mode) */}
            {showDetails && error && (
              <div className="mb-6 p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)] text-left overflow-auto max-h-48">
                <p className="text-sm font-medium text-[var(--color-dnd)] mb-2">
                  {error.toString()}
                </p>
                {errorInfo?.componentStack && (
                  <pre className="text-xs text-[var(--color-text-muted)] whitespace-pre-wrap">
                    {errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                icon={<ReloadOutlined />}
                onClick={this.handleRetry}
              >
                重试
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<ReloadOutlined />}
                onClick={this.handleReload}
              >
                刷新页面
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<HomeOutlined />}
                onClick={this.handleGoHome}
              >
                返回首页
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return children
  }
}

// Network error fallback component
export function NetworkErrorFallback({
  onRetry,
  message = '网络连接失败，请检查您的网络连接后重试。',
}: {
  onRetry?: () => void
  message?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in">
      <div className="w-16 h-16 mb-4 rounded-full bg-[var(--color-idle)]/20 flex items-center justify-center">
        <svg className="w-8 h-8 text-[var(--color-idle)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 6.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.657a9 9 0 001.414-7.072m0 0L5.636 5.636M3 3l1.828 1.828" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-text-normal)] mb-2">
        网络错误
      </h3>
      <p className="text-sm text-[var(--color-text-muted)] mb-4 max-w-xs">
        {message}
      </p>
      {onRetry && (
        <Button
          variant="primary"
          size="sm"
          icon={<ReloadOutlined />}
          onClick={onRetry}
        >
          重试
        </Button>
      )}
    </div>
  )
}

// Generic error fallback component
export function ErrorFallback({
  title = '出错了',
  message = '加载失败，请稍后重试。',
  onRetry,
  icon,
}: {
  title?: string
  message?: string
  onRetry?: () => void
  icon?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in">
      <div className="w-16 h-16 mb-4 rounded-full bg-[var(--color-dnd)]/20 flex items-center justify-center">
        {icon || (
          <svg className="w-8 h-8 text-[var(--color-dnd)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )}
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-text-normal)] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[var(--color-text-muted)] mb-4 max-w-xs">
        {message}
      </p>
      {onRetry && (
        <Button
          variant="primary"
          size="sm"
          icon={<ReloadOutlined />}
          onClick={onRetry}
        >
          重试
        </Button>
      )}
    </div>
  )
}

export default ErrorBoundary
