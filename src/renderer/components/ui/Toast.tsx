/**
 * Toast Component
 *
 * Wrapper for Ant Design message/notification with custom styling
 */

import { App, Button } from 'antd'
import type { Key } from 'react'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useEffect, useRef } from 'react'

// Toast options type
interface ToastOptions {
  duration?: number
}

// Create a hook to use toast in components
export function useToast() {
  const { message, notification } = App.useApp()

  const toast = {
    // Simple messages
    success: (content: string, options?: ToastOptions) => {
      return message.success({
        content,
        duration: options?.duration ?? 2,
        icon: <CheckCircleOutlined className="text-[var(--color-online)]" />,
      })
    },

    error: (content: string, options?: ToastOptions) => {
      return message.error({
        content,
        duration: options?.duration ?? 3,
        icon: <CloseCircleOutlined className="text-[var(--color-dnd)]" />,
      })
    },

    warning: (content: string, options?: ToastOptions) => {
      return message.warning({
        content,
        duration: options?.duration ?? 3,
        icon: <ExclamationCircleOutlined className="text-[var(--color-idle)]" />,
      })
    },

    info: (content: string, options?: ToastOptions) => {
      return message.info({
        content,
        duration: options?.duration ?? 2,
        icon: <InfoCircleOutlined className="text-[var(--color-primary)]" />,
      })
    },

    loading: (content: string, options?: ToastOptions) => {
      return message.loading({
        content,
        duration: options?.duration ?? 0, // Infinite until manually closed
        icon: <LoadingOutlined className="text-[var(--color-primary)]" />,
      })
    },

    // Notifications with title
    notify: {
      success: (title: string, description?: string, options?: ToastOptions) => {
        return notification.success({
          message: title,
          description,
          duration: options?.duration ?? 4,
          placement: 'topRight',
          icon: <CheckCircleOutlined className="text-[var(--color-online)]" />,
        })
      },

      error: (title: string, description?: string, options?: ToastOptions & { retryAction?: () => void }) => {
        return notification.error({
          message: title,
          description,
          duration: options?.duration ?? 5,
          placement: 'topRight',
          icon: <CloseCircleOutlined className="text-[var(--color-dnd)]" />,
          btn: options?.retryAction ? (
            <Button size="small" type="primary" icon={<ReloadOutlined />} onClick={options.retryAction}>
              重试
            </Button>
          ) : undefined,
        })
      },

      warning: (title: string, description?: string, options?: ToastOptions) => {
        return notification.warning({
          message: title,
          description,
          duration: options?.duration ?? 4,
          placement: 'topRight',
          icon: <ExclamationCircleOutlined className="text-[var(--color-idle)]" />,
        })
      },

      info: (title: string, description?: string, options?: ToastOptions) => {
        return notification.info({
          message: title,
          description,
          duration: options?.duration ?? 4,
          placement: 'topRight',
          icon: <InfoCircleOutlined className="text-[var(--color-primary)]" />,
        })
      },
    },

    // Dismiss all
    dismissAll: () => {
      message.destroy()
      notification.destroy()
    },
  }

  return toast
}

// Network status toast - shows offline/online status
export function useNetworkToast() {
  const toastRef = useRef<Key | null>(null)
  const { message } = App.useApp()

  useEffect(() => {
    const handleOffline = () => {
      toastRef.current = message.loading({
        content: '网络连接已断开，正在等待恢复...',
        duration: 0,
        icon: <CloseCircleOutlined className="text-[var(--color-dnd)]" />,
      })
    }

    const handleOnline = () => {
      if (toastRef.current) {
        message.destroy(toastRef.current)
      }
      message.success({
        content: '网络已恢复连接',
        duration: 2,
        icon: <CheckCircleOutlined className="text-[var(--color-online)]" />,
      })
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [message])
}

// Toast with undo action
interface UndoToastOptions {
  duration?: number
  onUndo: () => void
}

export function useUndoToast() {
  const { notification } = App.useApp()

  return (message: string, options: UndoToastOptions) => {
    return notification.info({
      message,
      duration: options.duration ?? 5,
      placement: 'bottomRight',
      btn: (
        <Button
          size="small"
          type="primary"
          onClick={() => {
            options.onUndo()
            notification.destroy()
          }}
        >
          撤销
        </Button>
      ),
    })
  }
}

export default useToast