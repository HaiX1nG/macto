import { useEffect, useCallback, useRef } from 'react'
import { useSettingsStore } from '../stores/settingsStore'

interface NotificationOptions {
  title: string
  body: string
  roomId?: number
  senderId?: number
}

interface NotificationClickData {
  roomId?: number
  senderId?: number
}

/**
 * Hook for managing desktop notifications in the renderer process
 */
export function useNotification() {
  const { showNotification: notificationEnabled } = useSettingsStore()
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
      if (!notificationEnabled) {
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
              roomId: options.roomId,
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
    [notificationEnabled]
  )

  /**
   * Show a message notification
   */
  const showMessageNotification = useCallback(
    async (params: {
      senderName: string
      messagePreview: string
      roomId: number
      senderId: number
    }): Promise<boolean> => {
      return showNotification({
        title: params.senderName,
        body: params.messagePreview,
        roomId: params.roomId,
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
    useSettingsStore.getState().setShowNotification(enabled)
  }, [])

  /**
   * Get notification enabled state
   */
  const getEnabled = useCallback(async (): Promise<boolean> => {
    if (window.electronAPI?.getNotificationEnabled) {
      const result = await window.electronAPI.getNotificationEnabled()
      return result.enabled
    }
    return notificationEnabled
  }, [notificationEnabled])

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
