import { useUIStore } from '@renderer/stores/uiStore'
import { ConnectionState, getConnectionStateText, getConnectionFailureMessage } from '@shared/types/voice'

export function WebSocketIndicator() {
  const wsConnectionStatus = useUIStore((s) => s.wsConnectionStatus)
  const wsReconnectAttempt = useUIStore((s) => s.wsReconnectAttempt)
  const wsFailureCode = useUIStore((s) => s.wsFailureCode)

  const statusConfig: Record<ConnectionState, { color: string; pulse: boolean }> = {
    [ConnectionState.Disconnected]: {
      color: 'bg-gray-500',
      pulse: false,
    },
    [ConnectionState.Connecting]: {
      color: 'bg-yellow-500',
      pulse: true,
    },
    [ConnectionState.ConnectingSlow]: {
      color: 'bg-orange-500',
      pulse: true,
    },
    [ConnectionState.Connected]: {
      color: 'bg-green-500',
      pulse: false,
    },
    [ConnectionState.Reconnecting]: {
      color: 'bg-blue-500',
      pulse: true,
    },
    [ConnectionState.Failed]: {
      color: 'bg-red-500',
      pulse: false,
    },
  }

  const config = statusConfig[wsConnectionStatus]

  if (wsConnectionStatus === ConnectionState.Connected) {
    return null
  }

  const displayText = wsFailureCode
    ? getConnectionFailureMessage(wsFailureCode, wsReconnectAttempt)
    : getConnectionStateText(wsConnectionStatus, wsReconnectAttempt)

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-bg-secondary/90 px-3 py-2 shadow-lg backdrop-blur-md">
      <div className={`h-2 w-2 rounded-full ${config.color} ${config.pulse ? 'animate-pulse' : ''}`} />
      <span className="text-xs text-text-muted">
        {displayText}
      </span>
    </div>
  )
}

export default WebSocketIndicator
