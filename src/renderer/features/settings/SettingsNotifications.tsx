import { useState, useEffect, useCallback } from 'react'
import { Switch, Select, Button, Divider, App, Alert } from 'antd'
import { BellOutlined, SoundOutlined, DesktopOutlined, MessageOutlined, UserOutlined, SettingOutlined, WarningOutlined, InfoCircleOutlined } from '@ant-design/icons'

/** Notification permission status */
type PermissionStatus = 'granted' | 'denied' | 'default' | 'unknown'

/** Environment detection for Electron API availability */
type ElectronEnvironment = 'electron' | 'browser' | 'unknown'

interface NotificationSettings {
  enableNotifications: boolean
  enableSound: boolean
  enableDesktop: boolean
  messageNotification: 'all' | 'mentions' | 'none'
  voiceNotification: boolean
  friendRequestNotification: boolean
  roomInviteNotification: boolean
}

/**
 * Get user-friendly guidance for opening system settings based on platform
 */
const getSystemSettingsGuidance = (): string => {
  const platform = navigator.platform.toLowerCase()

  if (platform.includes('mac')) {
    return '系统偏好设置 > 通知 > Macto'
  }
  if (platform.includes('win')) {
    return '设置 > 系统 > 通知和操作 > Macto'
  }
  if (platform.includes('linux')) {
    return '系统设置 > 通知 > Macto'
  }

  return '系统设置 > 通知 > Macto'
}

export const SettingsNotifications = () => {
  const { message } = App.useApp()

  const [settings, setSettings] = useState<NotificationSettings>({
    enableNotifications: true,
    enableSound: true,
    enableDesktop: true,
    messageNotification: 'all',
    voiceNotification: true,
    friendRequestNotification: true,
    roomInviteNotification: true,
  })

  const [notificationSupported, setNotificationSupported] = useState(true)
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('unknown')
  const [electronEnv, setElectronEnv] = useState<ElectronEnvironment>('unknown')
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)

  /**
   * Detect the current environment (Electron or browser)
   */
  const detectEnvironment = useCallback((): ElectronEnvironment => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      return 'electron'
    }
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return 'browser'
    }
    return 'unknown'
  }, [])

  /**
   * Check notification permission status
   */
  const checkPermissionStatus = useCallback(async (env: ElectronEnvironment): Promise<PermissionStatus> => {
    // Electron environment
    if (env === 'electron' && window.electronAPI?.getNotificationPermission) {
      try {
        const status = await window.electronAPI.getNotificationPermission()
        return status as PermissionStatus
      } catch (err) {
        console.error('Failed to check Electron notification permission:', err)
        return 'unknown'
      }
    }

    // Browser environment
    if (env === 'browser' && 'Notification' in window) {
      return Notification.permission as PermissionStatus
    }

    return 'unknown'
  }, [])

  // Check if Electron notifications are supported and get permission status
  useEffect(() => {
    const checkSupport = async () => {
      const env = detectEnvironment()
      setElectronEnv(env)

      // Check if notifications are supported
      if (env === 'electron') {
        if (window.electronAPI?.isNotificationSupported) {
          try {
            const supported = await window.electronAPI.isNotificationSupported()
            setNotificationSupported(supported)
          } catch (err) {
            console.error('Failed to check notification support:', err)
            setNotificationSupported(false)
          }
        } else {
          // Fallback: assume supported if electronAPI exists but method doesn't
          setNotificationSupported(true)
        }
      } else if (env === 'browser') {
        setNotificationSupported('Notification' in window)
      } else {
        setNotificationSupported(false)
      }

      // Check permission status
      const status = await checkPermissionStatus(env)
      setPermissionStatus(status)
    }
    checkSupport()
  }, [detectEnvironment, checkPermissionStatus])

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('notification-settings')
    if (saved) {
      try {
        setSettings(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load notification settings:', e)
      }
    }
  }, [])

  // Save settings to localStorage
  const updateSetting = <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
    try {
      const newSettings = { ...settings, [key]: value }
      setSettings(newSettings)
      localStorage.setItem('notification-settings', JSON.stringify(newSettings))

      // Sync with Electron main process
      if (key === 'enableDesktop' && window.electronAPI?.setNotificationEnabled) {
        window.electronAPI.setNotificationEnabled(value as boolean).catch((err: unknown) => {
          console.error('Failed to sync notification setting:', err)
          message.error('同步通知设置失败，请稍后重试')
        })
      }
    } catch (err) {
      console.error('Failed to save notification settings:', err)
      message.error('保存设置失败，请稍后重试')
    }
  }

  /**
   * Request notification permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsRequestingPermission(true)

    try {
      // Electron environment
      if (electronEnv === 'electron' && window.electronAPI?.requestNotificationPermission) {
        try {
          const granted = await window.electronAPI.requestNotificationPermission()
          const newStatus = granted ? 'granted' : 'denied'
          setPermissionStatus(newStatus)
          return granted
        } catch (err) {
          console.error('Failed to request Electron notification permission:', err)
          message.error('请求通知权限失败，请稍后重试')
          return false
        }
      }

      // Browser environment
      if (electronEnv === 'browser' && 'Notification' in window) {
        const permission = await Notification.requestPermission()
        setPermissionStatus(permission as PermissionStatus)
        return permission === 'granted'
      }

      // Unknown environment
      message.warning('当前环境不支持通知功能')
      return false
    } catch (err) {
      console.error('Unexpected error requesting permission:', err)
      message.error('请求权限时发生意外错误')
      return false
    } finally {
      setIsRequestingPermission(false)
    }
  }, [electronEnv, message])

  /**
   * Request notification permission / test notification
   */
  const testNotification = useCallback(async () => {
    // Check environment first
    if (electronEnv === 'unknown') {
      message.warning('无法确定当前运行环境，通知功能不可用')
      return
    }

    // Electron environment
    if (electronEnv === 'electron') {
      if (!window.electronAPI) {
        message.warning('Electron API 不可用，请确保应用正确加载')
        return
      }

      if (!window.electronAPI.sendNotification) {
        message.warning('当前版本不支持发送通知，请更新应用')
        return
      }

      try {
        // Check permission first
        if (permissionStatus !== 'granted') {
          const granted = await requestPermission()
          if (!granted) {
            if (permissionStatus === 'denied') {
              message.warning('通知权限已被拒绝，请在系统设置中允许 Macto 发送通知')
            }
            return
          }
        }

        const result = await window.electronAPI.sendNotification(
          'Macto 测试通知',
          '桌面通知功能正常工作！'
        )
        if (result.success) {
          message.success('测试通知已发送')
        } else {
          message.error(result.error || '发送通知失败')
        }
      } catch (err) {
        console.error('Failed to send test notification:', err)
        const errorMessage = err instanceof Error ? err.message : '发送通知失败，请稍后重试'
        message.error(errorMessage)
      }
      return
    }

    // Browser environment
    if (electronEnv === 'browser') {
      if (!('Notification' in window)) {
        message.warning('您的浏览器不支持桌面通知')
        return
      }

      // Check permission status
      if (Notification.permission === 'granted') {
        try {
          new Notification('Macto 测试通知', {
            body: '桌面通知功能正常工作！',
            icon: '/favicon.ico'
          })
          message.success('测试通知已发送')
        } catch (err) {
          console.error('Failed to create browser notification:', err)
          message.error('创建通知失败')
        }
        return
      }

      if (Notification.permission === 'denied') {
        message.warning('通知权限已被拒绝，请在浏览器设置中允许通知')
        return
      }

      // Request permission
      const granted = await requestPermission()
      if (granted) {
        try {
          new Notification('Macto 测试通知', {
            body: '桌面通知功能正常工作！',
            icon: '/favicon.ico'
          })
          message.success('已获得通知权限，测试通知已发送')
        } catch (err) {
          console.error('Failed to create notification after permission granted:', err)
          message.error('创建通知失败')
        }
      }
    }
  }, [electronEnv, permissionStatus, requestPermission, message])

  // Test notification sound
  const testNotificationSound = () => {
    try {
      const audio = new Audio()
      audio.src = 'data:audio/wav;base64,UklGRl9vT19teleR4EP5fd5Nt1GQU/od/h2m8TC0Gg4ODabA4LRKHf4NhrCgtFot/g2GgKC0ai4ODXZwoLRqLg4NdnCgtGouDg12cKC0ai4ODXZwoLRqLg4NdnCgtGouDg12cKC0ai4ODXZwo='
      audio.volume = 0.5
      audio.play().catch(() => {
        message.error('无法播放提示音')
      })
    } catch (err) {
      console.error('Failed to play notification sound:', err)
      message.error('播放提示音失败')
    }
  }

  /**
   * Render permission status indicator
   */
  const renderPermissionStatus = () => {
    if (!settings.enableDesktop || !notificationSupported) {
      return null
    }

    if (electronEnv === 'unknown') {
      return (
        <Alert
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          message="开发环境提示"
          description="当前运行在浏览器开发环境，桌面通知功能需要在 Electron 应用中使用。"
          className="mt-3"
        />
      )
    }

    if (permissionStatus === 'denied') {
      return (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          message="通知权限已被拒绝"
          description={
            <span>
              请前往 <strong>{getSystemSettingsGuidance()}</strong> 开启通知权限
            </span>
          }
          className="mt-3"
        />
      )
    }

    if (permissionStatus === 'default') {
      return (
        <Alert
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          message="通知权限未设置"
          description="点击「测试」按钮请求通知权限"
          className="mt-3"
        />
      )
    }

    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-[var(--color-text-normal)] mb-1">通知设置</h3>
        <p className="text-sm text-[var(--color-text-muted)]">管理消息提醒</p>
      </div>

      {/* Master Toggle */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--color-bg-tertiary)]">
        <div className="flex items-center gap-3">
          <BellOutlined className="text-xl text-[var(--color-primary)]" />
          <div>
            <span className="font-medium text-[var(--color-text-normal)]">启用通知</span>
            <p className="text-xs text-[var(--color-text-muted)]">接收消息和活动通知</p>
          </div>
        </div>
        <Switch
          checked={settings.enableNotifications}
          onChange={(checked) => updateSetting('enableNotifications', checked)}
        />
      </div>

      {settings.enableNotifications && (
        <>
          {/* Notification Types */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-[var(--color-text-normal)]">通知类型</h4>

            {/* Message Notification */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
              <div className="flex items-center gap-3">
                <MessageOutlined className="text-[var(--color-text-muted)]" />
                <div>
                  <span className="font-medium text-[var(--color-text-normal)]">消息通知</span>
                  <p className="text-xs text-[var(--color-text-muted)]">新消息提醒</p>
                </div>
              </div>
              <Select
                value={settings.messageNotification}
                onChange={(value) => updateSetting('messageNotification', value)}
                options={[
                  { value: 'all', label: '所有消息' },
                  { value: 'mentions', label: '仅@提及' },
                  { value: 'none', label: '关闭' },
                ]}
                className="w-28"
              />
            </div>

            {/* Voice Notification */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
              <div className="flex items-center gap-3">
                <SoundOutlined className="text-[var(--color-text-muted)]" />
                <div>
                  <span className="font-medium text-[var(--color-text-normal)]">语音通知</span>
                  <p className="text-xs text-[var(--color-text-muted)]">有人加入/离开语音频道</p>
                </div>
              </div>
              <Switch
                checked={settings.voiceNotification}
                onChange={(checked) => updateSetting('voiceNotification', checked)}
              />
            </div>

            {/* Friend Request Notification */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
              <div className="flex items-center gap-3">
                <UserOutlined className="text-[var(--color-text-muted)]" />
                <div>
                  <span className="font-medium text-[var(--color-text-normal)]">好友请求</span>
                  <p className="text-xs text-[var(--color-text-muted)]">新的好友请求提醒</p>
                </div>
              </div>
              <Switch
                checked={settings.friendRequestNotification}
                onChange={(checked) => updateSetting('friendRequestNotification', checked)}
              />
            </div>

            {/* Room Invite Notification */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
              <div className="flex items-center gap-3">
                <DesktopOutlined className="text-[var(--color-text-muted)]" />
                <div>
                  <span className="font-medium text-[var(--color-text-normal)]">房间邀请</span>
                  <p className="text-xs text-[var(--color-text-muted)]">被邀请加入房间时提醒</p>
                </div>
              </div>
              <Switch
                checked={settings.roomInviteNotification}
                onChange={(checked) => updateSetting('roomInviteNotification', checked)}
              />
            </div>
          </div>

          <Divider className="my-4 border-[var(--color-border)]" />

          {/* Notification Methods */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-[var(--color-text-normal)]">通知方式</h4>

            {/* Sound */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
              <div className="flex items-center gap-3">
                <SoundOutlined className="text-[var(--color-text-muted)]" />
                <div>
                  <span className="font-medium text-[var(--color-text-normal)]">提示音</span>
                  <p className="text-xs text-[var(--color-text-muted)]">收到通知时播放声音</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.enableSound}
                  onChange={(checked) => updateSetting('enableSound', checked)}
                />
                <Button
                  size="small"
                  onClick={testNotificationSound}
                  disabled={!settings.enableSound}
                >
                  测试
                </Button>
              </div>
            </div>

            {/* Desktop Notification */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
              <div className="flex items-center gap-3">
                <DesktopOutlined className="text-[var(--color-text-muted)]" />
                <div>
                  <span className="font-medium text-[var(--color-text-normal)]">桌面通知</span>
                  <p className="text-xs text-[var(--color-text-muted)]">在系统通知中心显示</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.enableDesktop}
                  onChange={(checked) => updateSetting('enableDesktop', checked)}
                  disabled={!notificationSupported}
                />
                <Button
                  size="small"
                  onClick={testNotification}
                  disabled={!settings.enableDesktop || !notificationSupported || isRequestingPermission}
                  loading={isRequestingPermission}
                >
                  测试
                </Button>
              </div>
            </div>

            {!notificationSupported && (
              <p className="text-xs text-[var(--color-text-muted)] italic">
                * 当前系统不支持桌面通知
              </p>
            )}

            {/* Permission Status Alerts */}
            {renderPermissionStatus()}
          </div>

          {/* Notification Preview */}
          <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
            <div className="flex items-center gap-2 mb-2">
              <SettingOutlined className="text-[var(--color-text-muted)]" />
              <span className="text-sm font-medium text-[var(--color-text-normal)]">通知预览</span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              当前设置：{settings.messageNotification === 'all' ? '所有消息' : settings.messageNotification === 'mentions' ? '仅@提及' : '关闭'}通知
              {settings.enableSound && ' · 提示音'}
              {settings.enableDesktop && notificationSupported && ' · 桌面通知'}
            </p>
          </div>
        </>
      )}
    </div>
  )
}

export default SettingsNotifications
