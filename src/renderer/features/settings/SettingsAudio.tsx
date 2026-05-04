import { useState, useEffect } from 'react'
import { useSettings } from '@renderer/hooks/useSettings'
import { Card, Select, Button, Slider } from 'antd'
import { AudioOutlined, ReloadOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'

export const SettingsAudio = () => {
  const {
    audioInputDeviceId,
    audioOutputDeviceId,
    setAudioInputDevice,
    setAudioOutputDevice,
    defaultVolume,
    setDefaultVolume,
  } = useSettings()

  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([])
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([])

  const loadDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      setInputDevices(devices.filter((d) => d.kind === 'audioinput'))
      setOutputDevices(devices.filter((d) => d.kind === 'audiooutput'))
    } catch (err) {
      console.error('Failed to load devices:', err)
    }
  }

  useEffect(() => {
    loadDevices()
  }, [])

  return (
    <div className="space-y-6">
      {/* Input Device */}
      <Card
        className={cn(
          'rounded-2xl border-l-4 border-l-blue-500',
          'hover:shadow-lg transition-shadow'
        )}
        styles={{ body: { padding: '24px' } }}
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3 mb-4">
            <div className={cn(
              'w-10 h-10 rounded-xl',
              'bg-blue-100 dark:bg-blue-900/30',
              'flex items-center justify-center',
              'text-blue-600 dark:text-blue-400'
            )}>
              <AudioOutlined className="text-xl" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">输入设备</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">选择麦克风</p>
            </div>
          </div>

          <Select
            value={audioInputDeviceId}
            onChange={setAudioInputDevice}
            placeholder="选择麦克风"
            className="w-full"
            prefix={<AudioOutlined />}
            allowClear
          >
            {inputDevices.map((device) => (
              <Select.Option key={device.deviceId} value={device.deviceId}>
                {device.label || '麦克风'}
              </Select.Option>
            ))}
          </Select>

          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={loadDevices}
            className="rounded-xl"
          >
            刷新设备
          </Button>
        </div>
      </Card>

      {/* Output Device */}
      <Card
        className={cn(
          'rounded-2xl border-l-4 border-l-purple-500',
          'hover:shadow-lg transition-shadow'
        )}
        styles={{ body: { padding: '24px' } }}
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3 mb-4">
            <div className={cn(
              'w-10 h-10 rounded-xl',
              'bg-purple-100 dark:bg-purple-900/30',
              'flex items-center justify-center',
              'text-purple-600 dark:text-purple-400'
            )}>
              <AudioOutlined className="text-xl" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">输出设备</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">选择扬声器</p>
            </div>
          </div>

          <Select
            value={audioOutputDeviceId}
            onChange={setAudioOutputDevice}
            placeholder="选择扬声器"
            className="w-full"
            prefix={<AudioOutlined />}
            allowClear
          >
            {outputDevices.map((device) => (
              <Select.Option key={device.deviceId} value={device.deviceId}>
                {device.label || '扬声器'}
              </Select.Option>
            ))}
          </Select>

          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={loadDevices}
            className="rounded-xl"
          >
            刷新设备
          </Button>
        </div>
      </Card>

      {/* Volume */}
      <Card
        className={cn(
          'rounded-2xl border-l-4 border-l-green-500',
          'hover:shadow-lg transition-shadow'
        )}
        styles={{ body: { padding: '24px' } }}
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3 mb-4">
            <div className={cn(
              'w-10 h-10 rounded-xl',
              'bg-green-100 dark:bg-green-900/30',
              'flex items-center justify-center',
              'text-green-600 dark:text-green-400'
            )}>
              <AudioOutlined className="text-xl" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">音量</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">设置默认音量</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-gray-600 dark:text-gray-400">
                默认音量
              </span>
              <span className="text-sm font-bold text-green-600 dark:text-green-400">
                {defaultVolume}%
              </span>
            </div>
            <Slider
              min={0}
              max={100}
              value={defaultVolume}
              onChange={setDefaultVolume}
              className="w-full"
              trackStyle={{ backgroundColor: '#52c41a', height: 6 }}
              railStyle={{ backgroundColor: '#e5e7eb', height: 6 }}
              handleStyle={{ borderColor: '#52c41a', width: 18, height: 18 }}
            />
          </div>
        </div>
      </Card>
    </div>
  )
}