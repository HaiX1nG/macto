import { useEffect, useCallback, useRef } from 'react'
import { useUIStore } from '../stores/uiStore'

interface NotificationOptions {
  title: string
  body: string
  channelId?: number
  senderId?: number
}

interface NotificationClickData {
  channelId?: number
  senderId?: number
}

/**
 * Hook for managing desktop notifications in the renderer process.
 *
 * Notification enabled state lives in uiStore.settings.showNotification.
 */
export function useNotification() {
  const showNotificationSetting = useUIStore((s) => s.settings.showNotification)
  const setShowNotification = useUIStore((s) => s.setShowNotification)
  const clickCallbackRef = useRef<((data: NotificationClickData) => void) | null>(null)

  // Register notification click handler
  useEffect(() => {
    if (!window.electronAPI?.onNotificationClick) return

    const unsubscribe = window.electronAPI.onNotificationClick((data: NotificationClickData) => {
      if (clickCallbackRef.current) {
        clickCallbackRef.current(data)
      }
    })

    return unsubscribe
  }, [])

  /**
   * Set callback for notification clicks
   */
  const onNotificationClick = useCallback((callback: (data: NotificationClickData) => void) => {
    clickCallbackRef.current = callback
  }, [])

  /**
   * Check if notifications are supported
   */
  const isSupported = useCallback(async (): Promise<boolean> => {
    if (!window.electronAPI?.isNotificationSupported) {
      // Fallback to browser check
      return 'Notification' in window
    }
    return window.electronAPI.isNotificationSupported()
  }, [])

  /**
   * Show a desktop notification
   */
  const showNotification = useCallback(
    async (options: NotificationOptions): Promise<boolean> => {
      // Check if notifications are enabled in settings
      if (!showNotificationSetting) {
        return false
      }

      // Check if window is focused (don't notify if user is looking at the app)
      if (document.hasFocus()) {
        return false
      }

      // Use Electron notification API if available
      if (window.electronAPI?.sendNotification) {
        try {
          const result = await window.electronAPI.sendNotification(
            options.title,
            options.body,
            {
              channelId: options.channelId,
              senderId: options.senderId,
            }
          )
          return result.success
        } catch (err) {
          console.error('Failed to show Electron notification:', err)
          return false
        }
      }

      // Fallback to browser notification API
      if ('Notification' in window) {
        try {
          if (Notification.permission !== 'granted') {
            const permission = await Notification.requestPermission()
            if (permission !== 'granted') {
              return false
            }
          }

          new Notification(options.title, {
            body: options.body,
            icon: '/favicon.ico',
          })
          return true
        } catch (err) {
          console.error('Failed to show browser notification:', err)
          return false
        }
      }

      console.warn('Notifications are not supported')
      return false
    },
    [showNotificationSetting]
  )

  /**
   * Show a message notification
   */
  const showMessageNotification = useCallback(
    async (params: {
      senderName: string
      messagePreview: string
      channelId: number
      senderId: number
    }): Promise<boolean> => {
      return showNotification({
        title: params.senderName,
        body: params.messagePreview,
        channelId: params.channelId,
        senderId: params.senderId,
      })
    },
    [showNotification]
  )

  /**
   * Set notification enabled state
   */
  const setEnabled = useCallback(async (enabled: boolean): Promise<void> => {
    if (window.electronAPI?.setNotificationEnabled) {
      await window.electronAPI.setNotificationEnabled(enabled)
    }
    setShowNotification(enabled)
  }, [setShowNotification])

  /**
   * Get notification enabled state
   */
  const getEnabled = useCallback(async (): Promise<boolean> => {
    if (window.electronAPI?.getNotificationEnabled) {
      const result = await window.electronAPI.getNotificationEnabled()
      return result.enabled
    }
    return showNotificationSetting
  }, [showNotificationSetting])

  return {
    isSupported,
    showNotification,
    showMessageNotification,
    onNotificationClick,
    setEnabled,
    getEnabled,
  }
}

export default useNotification
