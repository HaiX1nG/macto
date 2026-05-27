import { useEffect, useRef } from 'react'
import { useAuthStore } from '../stores/authStore'

const POLL_INTERVAL = 30000

export function useUserStatusPolling() {
  const { isAuthenticated, currentUser, fetchUserInfo } = useAuthStore()
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      return
    }

    const pollUserStatus = async () => {
      try {
        await fetchUserInfo()
      } catch (err) {
        console.error('Failed to poll user status:', err)
      }
    }

    intervalRef.current = window.setInterval(pollUserStatus, POLL_INTERVAL)

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isAuthenticated, currentUser, fetchUserInfo])

  return null
}