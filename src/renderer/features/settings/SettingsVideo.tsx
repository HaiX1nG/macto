import { useState, useEffect, useRef, useCallback } from 'react'
import { Select, Switch, Button, Slider, App } from 'antd'
import { VideoCameraOutlined, ReloadOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'

interface VideoSettings {
  cameraDeviceId: string
  quality: 'low' | 'medium' | 'high' | 'auto'
  mirror: boolean
  showPreview: boolean
  frameRate: number
}

const qualityOptions = [
  { value: 'auto', label: '自动', description: '根据网络自动调整' },
  { value: 'high', label: '高清 (720p)', description: '最佳画质' },
  { value: 'medium', label: '标清 (480p)', description: '平衡画质和性能' },
  { value: 'low', label: '流畅 (360p)', description: '节省带宽' },
]

export const SettingsVideo = () => {
  const { message } = App.useApp()

  const [settings, setSettings] = useState<VideoSettings>({
    cameraDeviceId: '',
    quality: 'auto',
    mirror: true,
    showPreview: true,
    frameRate: 30,
  })

  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([])
  const [testStream, setTestStream] = useState<MediaStream | null>(null)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Load camera devices
  const loadDevices = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true })
      const deviceList = await navigator.mediaDevices.enumerateDevices()
      const cameras = deviceList.filter(d => d.kind === 'videoinput')
      setCameraDevices(cameras)

      if (!settings.cameraDeviceId && cameras.length > 0) {
        updateSetting('cameraDeviceId', cameras[0].deviceId)
      }
    } catch (_err) {
      console.error('Failed to load camera devices:')
      message.error('无法获取摄像头列表，请检查权限')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message])

  useEffect(() => {
    loadDevices()
    // Load saved settings
    const saved = localStorage.getItem('video-settings')
    if (saved) {
      try {
        setSettings(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load video settings:', e)
      }
    }
  }, [loadDevices])

  // Update setting and save to localStorage
  const updateSetting = <K extends keyof VideoSettings>(key: K, value: VideoSettings[K]) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    localStorage.setItem('video-settings', JSON.stringify(newSettings))
  }

  // Get quality constraints
  const getQualityConstraints = useCallback((): MediaTrackConstraints => {
    const constraints: MediaTrackConstraints = {}

    switch (settings.quality) {
      case 'high':
        constraints.width = { ideal: 1280 }
        constraints.height = { ideal: 720 }
        break
      case 'medium':
        constraints.width = { ideal: 640 }
        constraints.height = { ideal: 480 }
        break
      case 'low':
        constraints.width = { ideal: 480 }
        constraints.height = { ideal: 360 }
        break
      default:
        // auto - let browser decide
        break
    }

    constraints.frameRate = { ideal: settings.frameRate }

    return constraints
  }, [settings.quality, settings.frameRate])

  // Start camera preview
  const startPreview = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: settings.cameraDeviceId ? { exact: settings.cameraDeviceId } : undefined,
          ...getQualityConstraints(),
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      setTestStream(stream)
      setIsPreviewing(true)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (_err) {
      console.error('Failed to start camera preview:')
      message.error('无法访问摄像头')
    }
  }, [settings.cameraDeviceId, message, getQualityConstraints])

  // Stop camera preview
  const stopPreview = useCallback(() => {
    if (testStream) {
      testStream.getTracks().forEach(track => track.stop())
      setTestStream(null)
    }
    setIsPreviewing(false)
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [testStream])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (testStream) {
        testStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [testStream])

  // Restart preview when settings change
  useEffect(() => {
    if (isPreviewing) {
      stopPreview()
      startPreview()
    }
  }, [settings.quality, settings.frameRate, isPreviewing, startPreview, stopPreview])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-[var(--color-text-normal)] mb-1">视频设置</h3>
        <p className="text-sm text-[var(--color-text-muted)]">配置摄像头和画质</p>
      </div>

      {/* Camera Device */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <VideoCameraOutlined className="text-[var(--color-primary)]" />
          <span className="font-medium text-[var(--color-text-normal)]">摄像头</span>
        </div>

        <div className="flex gap-2">
          <Select
            value={settings.cameraDeviceId || undefined}
            onChange={(value) => updateSetting('cameraDeviceId', value)}
            placeholder="选择摄像头设备"
            className="flex-1"
            options={cameraDevices.map(d => ({
              value: d.deviceId,
              label: d.label || `摄像头 ${d.deviceId.slice(0, 8)}`
            }))}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={loadDevices}
            title="刷新设备列表"
          />
        </div>
      </div>

      {/* Camera Preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-medium text-[var(--color-text-normal)]">摄像头预览</span>
          <Button
            type={isPreviewing ? 'primary' : 'default'}
            danger={isPreviewing}
            icon={isPreviewing ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={isPreviewing ? stopPreview : startPreview}
          >
            {isPreviewing ? '关闭预览' : '开启预览'}
          </Button>
        </div>

        <div className="relative rounded-lg overflow-hidden bg-[var(--color-bg-darker)] aspect-video">
          {isPreviewing ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                'w-full h-full object-cover',
                settings.mirror && 'scale-x-[-1]'
              )}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <VideoCameraOutlined className="text-4xl text-[var(--color-text-muted)] mb-2" />
                <p className="text-sm text-[var(--color-text-muted)]">点击上方按钮开启预览</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quality Settings */}
      <div className="space-y-3">
        <span className="font-medium text-[var(--color-text-normal)]">画质设置</span>

        <div className="grid grid-cols-2 gap-2">
          {qualityOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => updateSetting('quality', opt.value as VideoSettings['quality'])}
              className={cn(
                'p-3 rounded-lg border-2 cursor-pointer text-left',
                'transition-all duration-200',
                settings.quality === opt.value
                  ? 'border-[var(--color-primary)] bg-[var(--color-bg-tertiary)]'
                  : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
              )}
            >
              <h4 className="font-semibold text-[var(--color-text-normal)] text-sm">{opt.label}</h4>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{opt.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Frame Rate */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-medium text-[var(--color-text-normal)]">帧率</span>
          <span className="text-sm text-[var(--color-text-muted)]">{settings.frameRate} FPS</span>
        </div>
        <Slider
          value={settings.frameRate}
          onChange={(value) => updateSetting('frameRate', value)}
          min={15}
          max={60}
          step={5}
          marks={{ 15: '15', 30: '30', 60: '60' }}
          tooltip={{ formatter: (v) => `${v} FPS` }}
        />
      </div>

      {/* Mirror Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
        <div>
          <span className="font-medium text-[var(--color-text-normal)]">镜像画面</span>
          <p className="text-xs text-[var(--color-text-muted)]">左右翻转摄像头画面</p>
        </div>
        <Switch
          checked={settings.mirror}
          onChange={(checked) => updateSetting('mirror', checked)}
        />
      </div>

      {/* Hardware Acceleration */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
        <div>
          <span className="font-medium text-[var(--color-text-normal)]">硬件加速</span>
          <p className="text-xs text-[var(--color-text-muted)]">使用 GPU 加速视频处理</p>
        </div>
        <Switch defaultChecked />
      </div>

      {/* Screen Share Quality */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
        <div>
          <span className="font-medium text-[var(--color-text-normal)]">屏幕共享画质</span>
          <p className="text-xs text-[var(--color-text-muted)]">分享屏幕时的画质</p>
        </div>
        <Select
          value={settings.quality}
          onChange={(value) => updateSetting('quality', value as VideoSettings['quality'])}
          options={qualityOptions}
          className="w-24"
        />
      </div>
    </div>
  )
}

export default SettingsVideo