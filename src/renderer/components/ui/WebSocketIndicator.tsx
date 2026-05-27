import { useWebSocketStore } from '../../stores/websocketStore'

export function WebSocketIndicator() {
  const { connectionStatus, reconnectAttempt, maxReconnectAttempts } = useWebSocketStore()

  const statusConfig = {
    disconnected: {
      color: 'bg-gray-500',
      text: 'Disconnected',
      showRetry: false,
    },
    connecting: {
      color: 'bg-yellow-500',
      text: 'Connecting...',
      showRetry: false,
    },
    connected: {
      color: 'bg-green-500',
      text: 'Connected',
      showRetry: false,
    },
    reconnecting: {
      color: 'bg-orange-500',
      text: `Reconnecting (${reconnectAttempt}/${maxReconnectAttempts})`,
      showRetry: false,
    },
    error: {
      color: 'bg-red-500',
      text: 'Connection Error',
      showRetry: true,
    },
  }

  const config = statusConfig[connectionStatus]

  if (connectionStatus === 'connected') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-mac-secondarysystemgroupedbackground/90 px-3 py-2 shadow-lg backdrop-blur-md dark:bg-mac-secondarysystemgroupedbackground-dark/90">
      <div className={`h-2 w-2 rounded-full ${config.color} ${connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? 'animate-pulse' : ''}`} />
      <span className="text-xs text-mac-secondarylabel dark:text-mac-secondarylabel-dark">
        {config.text}
      </span>
    </div>
  )
}

export default WebSocketIndicator