import { createContext, useContext, useEffect, useState } from 'react'
import { useScreenStore } from '@renderer/stores/screenStore'

interface ScreenContextType {
  isShared: boolean
  controlEnabled: boolean
  screenStream: MediaStream | null
  startSharing: (roomId: number) => Promise<void>
  stopSharing: (roomId: number) => Promise<void>
  enableControl: () => void
  disableControl: () => void
}

const ScreenContext = createContext<ScreenContextType | undefined>(undefined)

export const ScreenProvider = ({ children }: { children: React.ReactNode }) => {
  const { isShared, controlEnabled, screenStream, startSharing, stopSharing, enableControl, disableControl } = useScreenStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ScreenContext.Provider value={{ isShared, controlEnabled, screenStream, startSharing, stopSharing, enableControl, disableControl }}>
      {children}
    </ScreenContext.Provider>
  )
}

export const useScreen = () => {
  const context = useContext(ScreenContext)
  if (!context) {
    throw new Error('useScreen must be used within a ScreenProvider')
  }
  return context
}
