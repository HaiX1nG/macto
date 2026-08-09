import { useUIStore } from '@renderer/stores/uiStore'

export function WebSocketIndicator() {
  const wsConnectionStatus = useUIStore((s) => s.wsConnectionStatus)
  const wsReconnectAttempt = useUIStore((s) => s.wsReconnectAttempt)
  const wsMaxReconnectAttempts = useUIStore((s) => s.wsMaxReconnectAttempts)

  const statusConfig: Record<string, { color: string; text: string }> = {
    disconnected: {
      color: 'bg-gray-500',
      text: 'Disconnected',
    },
    connecting: {
      color: 'bg-yellow-500',
      text: 'Connecting...',
    },
    connected: {
      color: 'bg-green-500',
      text: 'Connected',
    },
    reconnecting: {
      color: 'bg-orange-500',
      text: `Reconnecting (${wsReconnectAttempt}/${wsMaxReconnectAttempts})`,
    },
    error: {
      color: 'bg-red-500',
      text: 'Connection Error',
    },
  }

  const config = statusConfig[wsConnectionStatus]

  if (wsConnectionStatus === 'connected') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-mac-secondarysystemgroupedbackground/90 px-3 py-2 shadow-lg backdrop-blur-md dark:bg-mac-secondarysystemgroupedbackground-dark/90">
      <div className={`h-2 w-2 rounded-full ${config.color} ${wsConnectionStatus === 'connecting' || wsConnectionStatus === 'reconnecting' ? 'animate-pulse' : ''}`} />
      <span className="text-xs text-mac-secondarylabel dark:text-mac-secondarylabel-dark">
        {config.text}
      </span>
    </div>
  )
}

export default WebSocketIndicator
