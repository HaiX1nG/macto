import { useWebRTCStore } from '@renderer/stores/webrtcStore'
import { RemoteScreenView } from './RemoteScreenView'

export function RemoteScreensContainer() {
  const remoteScreens = useWebRTCStore((state) => state.remoteScreens)

  if (remoteScreens.size === 0) return null

  const screens = Array.from(remoteScreens.values())

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-medium text-[var(--color-text-muted)] mb-2">
        屏幕共享 ({screens.length})
      </h3>
      <div className="grid gap-4">
        {screens.map((screen) => (
          <RemoteScreenView key={screen.userId} screen={screen} />
        ))}
      </div>
    </div>
  )
}