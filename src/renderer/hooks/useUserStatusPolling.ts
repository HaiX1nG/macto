import { useEffect, useRef } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useUserStore } from '../stores/userStore'

const POLL_INTERVAL = 30000 // 30 seconds

export function useUserStatusPolling() {
  const { isAuthenticated, currentUser, fetchUserInfo } = useAuthStore()
  const { setStatus } = useUserStore()
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      return
    }

    const pollUserStatus = async () => {
      try {
        // Fetch current user info to get updated status
        await fetchUserInfo()

        // Update local status based on customStatus from backend
        const updatedUser = useAuthStore.getState().currentUser
        if (updatedUser) {
          const customStatus = updatedUser.customStatus || ''
          if (customStatus === '') {
            setStatus('online')
          } else if (customStatus === '空闲') {
            setStatus('idle')
          } else if (customStatus === '请勿打扰') {
            setStatus('dnd')
          } else if (customStatus === '隐身') {
            setStatus('offline')
          }
        }
      } catch (err) {
        console.error('Failed to poll user status:', err)
      }
    }

    // Start polling
    intervalRef.current = window.setInterval(pollUserStatus, POLL_INTERVAL)

    // Cleanup on unmount or when auth state changes
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isAuthenticated, currentUser, fetchUserInfo, setStatus])

  return null
}