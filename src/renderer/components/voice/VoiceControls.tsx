import { useState } from 'react'
import { Dropdown } from 'antd'
import {
  AudioMutedOutlined,
  AudioOutlined,
  SoundOutlined,
  DesktopOutlined,
  SettingOutlined,
  PhoneOutlined,
} from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'
import {
  VoiceControlPanel,
  VoiceControlButton,
  VolumeControl,
} from '@renderer/components/ui/VoiceControl'

interface VoiceControlsProps {
  /** Whether the user is currently muted */
  isMuted: boolean
  /** Current volume level (0-100) */
  volume: number
  /** Available audio devices */
  devices?: MediaDeviceInfo[]
  /** Currently selected device ID */
  selectedDeviceId?: string
  /** Callback when mute state changes */
  onMuteToggle: () => void
  /** Callback when volume changes */
  onVolumeChange: (volume: number) => void
  /** Callback when device changes */
  onDeviceChange?: (deviceId: string) => void
  /** Callback when user leaves the session */
  onLeaveSession: () => void
  /** Callback for screen share toggle */
  onScreenShareToggle?: () => void
  /** Whether screen sharing is active */
  isScreenSharing?: boolean
  /** Optional className */
  className?: string
}

/**
 * VoiceControls - Complete voice control panel for voice sessions
 *
 * Fixed bottom control bar with mute, volume, device selection, and leave session.
 * Uses the existing VoiceControlPanel and VoiceControlButton from ui/VoiceControl.
 */
export default function VoiceControls({
  isMuted,
  volume,
  devices = [],
  selectedDeviceId,
  onMuteToggle,
  onVolumeChange,
  onDeviceChange,
  onLeaveSession,
  onScreenShareToggle,
  isScreenSharing = false,
  className,
}: VoiceControlsProps) {
  const [showVolume, setShowVolume] = useState(false)

  // Device selection menu items
  const deviceMenuItems = devices.map((device) => ({
    key: device.deviceId,
    label: device.label || `设备 ${device.deviceId.slice(0, 8)}`,
    onClick: () => onDeviceChange?.(device.deviceId),
  }))

  // Add a separator and current selection
  const menuItems =
    devices.length > 0
      ? [
          ...deviceMenuItems,
          { key: 'divider', type: 'divider' as const },
          {
            key: 'current',
            label: `当前: ${devices.find((d) => d.deviceId === selectedDeviceId)?.label || '默认设备'}`,
            disabled: true,
          },
        ]
      : []

  return (
    <VoiceControlPanel className={className}>
      <div className="flex items-center justify-between gap-4">
        {/* Left section - Mute and Volume */}
        <div className="flex items-center gap-2">
          {/* Mute/Unmute Button */}
          <VoiceControlButton
            active={isMuted}
            variant={isMuted ? 'danger' : 'default'}
            onClick={onMuteToggle}
            label={isMuted ? '取消静音' : '静音'}
          >
            {isMuted ? (
              <AudioMutedOutlined className="text-xl" />
            ) : (
              <AudioOutlined className="text-xl" />
            )}
          </VoiceControlButton>

          {/* Volume Control with toggle */}
          <div className="relative">
            <VoiceControlButton
              active={showVolume}
              onClick={() => setShowVolume(!showVolume)}
              label="音量"
            >
              <SoundOutlined className="text-xl" />
            </VoiceControlButton>

            {/* Volume Slider Popup */}
            {showVolume && (
              <div
                className={cn(
                  'absolute bottom-full left-1/2 -translate-x-1/2 mb-2',
                  'bg-[var(--color-bg-base)]/95 backdrop-blur-md',
                  'border border-[var(--color-border)]',
                  'rounded-2xl p-4 shadow-2xl',
                  'w-64'
                )}
              >
                <VolumeControl
                  value={volume}
                  onChange={onVolumeChange}
                  muted={isMuted}
                  icon={
                    volume === 0 || isMuted ? (
                      <AudioMutedOutlined />
                    ) : volume < 50 ? (
                      <SoundOutlined />
                    ) : (
                      <AudioOutlined />
                    )
                  }
                />
              </div>
            )}
          </div>
        </div>

        {/* Center section - Screen Share & Settings */}
        <div className="flex items-center gap-2">
          {/* Device Selection Dropdown */}
          {devices.length > 0 && (
            <Dropdown
              menu={{ items: menuItems }}
              placement="top"
              trigger={['click']}
            >
              <div>
                <VoiceControlButton label="设备">
                  <SettingOutlined className="text-xl" />
                </VoiceControlButton>
              </div>
            </Dropdown>
          )}

          {/* Screen Share Button */}
          {onScreenShareToggle && (
            <VoiceControlButton
              active={isScreenSharing}
              onClick={onScreenShareToggle}
              label="屏幕共享"
            >
              <DesktopOutlined className="text-xl" />
            </VoiceControlButton>
          )}
        </div>

        {/* Right section - Leave Session */}
        <div>
          <VoiceControlButton
            variant="danger"
            onClick={onLeaveSession}
            label="离开"
          >
            <PhoneOutlined
              className="text-xl"
              style={{ transform: 'rotate(135deg)' }}
            />
          </VoiceControlButton>
        </div>
      </div>
    </VoiceControlPanel>
  )
}
