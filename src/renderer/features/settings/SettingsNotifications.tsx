import { useState, useEffect, useCallback } from 'react'
import { Switch, Select, Button, Divider, App } from 'antd'
import { BellOutlined, SoundOutlined, DesktopOutlined, MessageOutlined, UserOutlined, SettingOutlined } from '@ant-design/icons'

interface NotificationSettings {
  enableNotifications: boolean
  enableSound: boolean
  enableDesktop: boolean
  messageNotification: 'all' | 'mentions' | 'none'
  voiceNotification: boolean
  friendRequestNotification: boolean
  roomInviteNotification: boolean
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

  // Check if Electron notifications are supported
  useEffect(() => {
    const checkSupport = async () => {
      if (window.electronAPI?.isNotificationSupported) {
        const supported = await window.electronAPI.isNotificationSupported()
        setNotificationSupported(supported)
      }
    }
    checkSupport()
  }, [])

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
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    localStorage.setItem('notification-settings', JSON.stringify(newSettings))

    // Sync with Electron main process
    if (key === 'enableDesktop' && window.electronAPI?.setNotificationEnabled) {
      window.electronAPI.setNotificationEnabled(value as boolean).catch((err: unknown) => {
        console.error('Failed to sync notification setting:', err)
      })
    }
  }

  // Request notification permission / test notification
  const testNotification = useCallback(async () => {
    if (window.electronAPI?.sendNotification) {
      try {
        const result = await window.electronAPI.sendNotification(
          'Macto 测试通知',
          '桌面通知功能正常工作！'
        )
        if (result.success) {
          message.success('测试通知已发送')
        } else {
          message.error('发送通知失败')
        }
      } catch (err) {
        console.error('Failed to send test notification:', err)
        message.error('发送通知失败')
      }
      return
    }

    // Fallback to browser notification
    if (!('Notification' in window)) {
      message.warning('您的浏览器不支持桌面通知')
      return
    }

    if (Notification.permission === 'granted') {
      new Notification('Macto 测试通知', {
        body: '桌面通知功能正常工作！',
        icon: '/favicon.ico'
      })
      message.success('测试通知已发送')
      return
    }

    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      new Notification('Macto 测试通知', {
        body: '桌面通知功能正常工作！',
        icon: '/favicon.ico'
      })
      message.success('已获得通知权限')
    } else {
      message.warning('通知权限被拒绝，请在系统设置中允许通知')
    }
  }, [message])

  // Test notification sound
  const testNotificationSound = () => {
    const audio = new Audio()
    audio.src = 'data:audio/wav;base64,UklGRl9vT19teleR4EP5fd5Nt1GQU/od/h2m8TC0Gg4ODabA4LRKHf4NhrCgtFot/g2GgKC0ai4ODXZwoLRqLg4NdnCgtGouDg12cKC0ai4ODXZwoLRqLg4NdnCgtGouDg12cKC0ai4ODXZwo='
    audio.volume = 0.5
    audio.play().catch(() => {
      message.error('无法播放提示音')
    })
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
                  disabled={!settings.enableDesktop || !notificationSupported}
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
