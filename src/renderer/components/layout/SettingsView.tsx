/**
 * SettingsView Component
 *
 * The settings view for user preferences and application configuration.
 */

import React from 'react'
import { Button, Typography, Switch, Slider, Select, Card, Tabs } from 'antd'
import { AudioOutlined, VideoCameraOutlined, BellOutlined, InfoCircleOutlined, SaveOutlined, ReloadOutlined, SettingOutlined, DesktopOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'
import { useThemeStore, type AppTheme } from '@renderer/stores/themeStore'

const { Title, Text } = Typography
const { TabPane } = Tabs
const { Option } = Select

interface AudioSettings {
  microphone: string
  speakers: string
  inputVolume: number
  outputVolume: number
  noiseSuppression: boolean
  echoCancellation: boolean
}

interface VideoSettings {
  camera: string
  quality: 'low' | 'medium' | 'high'
  resolution: '480p' | '720p' | '1080p'
  frameRate: number
}

interface SettingsViewProps {
  audioSettings?: AudioSettings
  onAudioSettingsChange?: (settings: Partial<AudioSettings>) => void
  videoSettings?: VideoSettings
  onVideoSettingsChange?: (settings: Partial<VideoSettings>) => void
  notificationsEnabled?: boolean
  onNotificationsToggle?: (enabled: boolean) => void
}

const themeOptions: Array<{
  value: AppTheme
  label: string
  description: string
  preview: React.ReactNode
}> = [
  {
    value: 'sakura',
    label: '日本樱花风',
    description: '柔和的粉色系，温馨浪漫',
    preview: (
      <div className="flex gap-1">
        <div className="w-6 h-6 rounded bg-[#f8b4c4]" />
        <div className="w-6 h-6 rounded bg-[#ffd6e0]" />
        <div className="w-6 h-6 rounded bg-[#fff5f7]" />
      </div>
    ),
  },
  {
    value: 'ancient',
    label: '中国古风',
    description: '典雅的金棕色，古朴大气',
    preview: (
      <div className="flex gap-1">
        <div className="w-6 h-6 rounded bg-[#c9a86c]" />
        <div className="w-6 h-6 rounded bg-[#231e19]" />
        <div className="w-6 h-6 rounded bg-[#e8dcc8]" />
      </div>
    ),
  },
  {
    value: 'tech',
    label: '科技风',
    description: '炫酷的霓虹蓝，未来感十足',
    preview: (
      <div className="flex gap-1">
        <div className="w-6 h-6 rounded bg-[#00d4ff]" />
        <div className="w-6 h-6 rounded bg-[#7b2dff]" />
        <div className="w-6 h-6 rounded bg-[#0a0e17]" />
      </div>
    ),
  },
]

export const SettingsView: React.FC<SettingsViewProps> = ({
  audioSettings = {
    microphone: 'default',
    speakers: 'default',
    inputVolume: 70,
    outputVolume: 70,
    noiseSuppression: true,
    echoCancellation: true,
  },
  onAudioSettingsChange,
  videoSettings = {
    camera: 'default',
    quality: 'medium',
    resolution: '720p',
    frameRate: 30,
  },
  onVideoSettingsChange,
  notificationsEnabled = true,
  onNotificationsToggle,
}) => {
  const { theme, setTheme } = useThemeStore()

  return (
    <div className="flex h-screen bg-[var(--color-bg-secondary)] transition-colors duration-300">
      {/* Sidebar */}
      <div className={cn(
        'w-64 bg-[var(--color-bg-tertiary)]',
        'border-r border-[var(--color-border)]',
        'flex flex-col transition-colors duration-300'
      )}>
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl',
              'bg-gradient-to-br from-[var(--color-primary)] to-purple-600',
              'flex items-center justify-center',
              'text-white font-bold shadow-lg'
            )}>
              <SettingOutlined className="text-lg" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--color-text-normal)]">设置</h1>
              <Text className="text-xs text-[var(--color-text-muted)]">个性化配置</Text>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-1 overflow-y-auto py-4">
          <Tabs
            defaultActiveKey="appearance"
            tabPosition="left"
            className="settings-tabs h-full"
          >
            <TabPane
              tab={
                <span className="flex items-center gap-3 px-4 py-3">
                  <DesktopOutlined className="text-lg" />
                  <span className="font-medium">外观</span>
                </span>
              }
              key="appearance"
            />
            <TabPane
              tab={
                <span className="flex items-center gap-3 px-4 py-3">
                  <AudioOutlined className="text-lg" />
                  <span className="font-medium">音频</span>
                </span>
              }
              key="audio"
            />
            <TabPane
              tab={
                <span className="flex items-center gap-3 px-4 py-3">
                  <VideoCameraOutlined className="text-lg" />
                  <span className="font-medium">视频</span>
                </span>
              }
              key="video"
            />
            <TabPane
              tab={
                <span className="flex items-center gap-3 px-4 py-3">
                  <BellOutlined className="text-lg" />
                  <span className="font-medium">通知</span>
                </span>
              }
              key="notifications"
            />
            <TabPane
              tab={
                <span className="flex items-center gap-3 px-4 py-3">
                  <InfoCircleOutlined className="text-lg" />
                  <span className="font-medium">关于</span>
                </span>
              }
              key="about"
            />
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-[var(--color-text-normal)]">设置</h1>
            <Text className="text-lg text-[var(--color-text-muted)]">管理您的偏好和配置</Text>
          </div>

          {/* Theme Section */}
          <SettingsSection
            icon={<DesktopOutlined />}
            title="主题"
            description="选择您喜欢的界面风格"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {themeOptions.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={cn(
                    'p-5 rounded-2xl border-2 cursor-pointer',
                    'transition-all duration-200',
                    'hover:scale-[1.02] active:scale-[0.98]',
                    theme === t.value
                      ? 'border-[var(--color-primary)] bg-[var(--color-bg-darker)] shadow-lg'
                      : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'
                  )}
                >
                  <div className="mb-4">{t.preview}</div>
                  <h3 className="font-bold text-[var(--color-text-normal)] mb-1">{t.label}</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">{t.description}</p>
                  {theme === t.value && (
                    <div className="mt-3 text-sm text-[var(--color-primary)] font-medium">
                      ✓ 已选择
                    </div>
                  )}
                </button>
              ))}
            </div>
          </SettingsSection>

          {/* Audio Section */}
          <SettingsSection
            icon={<AudioOutlined />}
            title="音频"
          >
            <div className="space-y-6">
              <div>
                <Text className="block mb-3 font-semibold text-[var(--color-text-normal)]">
                  输入设备
                </Text>
                <Select
                  value={audioSettings.microphone}
                  onChange={(value) => onAudioSettingsChange?.({ microphone: value })}
                  className="w-full"
                >
                  <Option value="default">默认麦克风</Option>
                  <Option value="external">外部麦克风</Option>
                </Select>
              </div>

              <div>
                <Text className="block mb-3 font-semibold text-[var(--color-text-normal)]">
                  输出设备
                </Text>
                <Select
                  value={audioSettings.speakers}
                  onChange={(value) => onAudioSettingsChange?.({ speakers: value })}
                  className="w-full"
                >
                  <Option value="default">默认扬声器</Option>
                  <Option value="external">外部扬声器</Option>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Text className="font-semibold text-[var(--color-text-normal)]">输入音量</Text>
                  <Text className="font-bold text-[var(--color-primary)]">{audioSettings.inputVolume}%</Text>
                </div>
                <Slider
                  value={audioSettings.inputVolume}
                  onChange={(value) => onAudioSettingsChange?.({ inputVolume: value })}
                  min={0}
                  max={100}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Text className="font-semibold text-[var(--color-text-normal)]">输出音量</Text>
                  <Text className="font-bold text-[var(--color-primary)]">{audioSettings.outputVolume}%</Text>
                </div>
                <Slider
                  value={audioSettings.outputVolume}
                  onChange={(value) => onAudioSettingsChange?.({ outputVolume: value })}
                  min={0}
                  max={100}
                  className="w-full"
                />
              </div>

              <SettingsToggle
                title="噪声抑制"
                description="自动减少背景噪声"
                checked={audioSettings.noiseSuppression}
                onChange={(checked) => onAudioSettingsChange?.({ noiseSuppression: checked })}
              />

              <SettingsToggle
                title="回声消除"
                description="减少回声和混响"
                checked={audioSettings.echoCancellation}
                onChange={(checked) => onAudioSettingsChange?.({ echoCancellation: checked })}
              />
            </div>
          </SettingsSection>

          {/* Video Section */}
          <SettingsSection
            icon={<VideoCameraOutlined />}
            title="视频"
          >
            <div className="space-y-6">
              <div>
                <Text className="block mb-3 font-semibold text-[var(--color-text-normal)]">
                  摄像头
                </Text>
                <Select
                  value={videoSettings.camera}
                  onChange={(value) => onVideoSettingsChange?.({ camera: value })}
                  className="w-full"
                >
                  <Option value="default">默认摄像头</Option>
                  <Option value="external">外部摄像头</Option>
                </Select>
              </div>

              <div>
                <Text className="block mb-3 font-semibold text-[var(--color-text-normal)]">
                  画质
                </Text>
                <Select
                  value={videoSettings.quality}
                  onChange={(value) => onVideoSettingsChange?.({ quality: value as 'low' | 'medium' | 'high' })}
                  className="w-full"
                >
                  <Option value="low">低 (节省带宽)</Option>
                  <Option value="medium">中 (推荐)</Option>
                  <Option value="high">高 (最佳画质)</Option>
                </Select>
              </div>

              <div>
                <Text className="block mb-3 font-semibold text-[var(--color-text-normal)]">
                  分辨率
                </Text>
                <Select
                  value={videoSettings.resolution}
                  onChange={(value) => onVideoSettingsChange?.({ resolution: value as '480p' | '720p' | '1080p' })}
                  className="w-full"
                >
                  <Option value="480p">480p (854x480)</Option>
                  <Option value="720p">720p (1280x720)</Option>
                  <Option value="1080p">1080p (1920x1080)</Option>
                </Select>
              </div>

              <div>
                <Text className="block mb-3 font-semibold text-[var(--color-text-normal)]">
                  帧率 (FPS)
                </Text>
                <Select
                  value={videoSettings.frameRate}
                  onChange={(value) => onVideoSettingsChange?.({ frameRate: value })}
                  className="w-full"
                >
                  <Option value={15}>15 FPS</Option>
                  <Option value={30}>30 FPS</Option>
                  <Option value={60}>60 FPS</Option>
                </Select>
              </div>
            </div>
          </SettingsSection>

          {/* Notifications Section */}
          <SettingsSection
            icon={<BellOutlined />}
            title="通知"
          >
            <SettingsToggle
              title="启用通知"
              description="接收新消息和活动提醒"
              checked={notificationsEnabled}
              onChange={onNotificationsToggle}
              large
            />
          </SettingsSection>

          {/* Save Button */}
          <div className="flex justify-end gap-4 pt-8 border-t border-[var(--color-border)] mt-8">
            <Button
              size="large"
              icon={<ReloadOutlined />}
              onClick={() => window.location.reload()}
              className="rounded-xl px-6"
            >
              重置
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              className="px-10 rounded-xl font-semibold"
            >
              保存设置
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface SettingsSectionProps {
  icon: React.ReactNode
  title: string
  description?: string
  children: React.ReactNode
}

const SettingsSection = ({ icon, title, description, children }: SettingsSectionProps) => {
  return (
    <Card
      className={cn(
        'mb-6 rounded-2xl',
        'bg-[var(--color-bg-darker)]',
        'border border-[var(--color-border)]',
        'hover:shadow-lg transition-shadow'
      )}
      styles={{ body: { padding: '28px' } }}
    >
      <div className="flex items-center gap-4 mb-6">
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center',
          'bg-[var(--color-primary)]/20 text-[var(--color-primary)]'
        )}>
          {icon}
        </div>
        <div>
          <Title level={4} className="mb-0 text-[var(--color-text-normal)]">
            {title}
          </Title>
          {description && (
            <Text className="text-sm text-[var(--color-text-muted)]">{description}</Text>
          )}
        </div>
      </div>
      {children}
    </Card>
  )
}

interface SettingsToggleProps {
  title: string
  description: string
  checked: boolean
  onChange?: (checked: boolean) => void
  large?: boolean
}

const SettingsToggle = ({ title, description, checked, onChange, large = false }: SettingsToggleProps) => (
  <div className={cn(
    'flex items-center justify-between rounded-xl',
    'bg-[var(--color-bg-tertiary)]',
    large ? 'p-6' : 'p-4'
  )}>
    <div>
      <Text className={cn(
        'font-semibold text-[var(--color-text-normal)]',
        large && 'text-lg'
      )}>
        {title}
      </Text>
      <Text className={cn(
        'text-sm block mt-1 text-[var(--color-text-muted)]',
        large && 'text-base'
      )}>
        {description}
      </Text>
    </div>
    <Switch
      checked={checked}
      onChange={onChange}
    />
  </div>
)
