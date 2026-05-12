import { useState } from 'react'
import { useAudio } from '@renderer/hooks/useAudio'
import { Card, Button, Slider, Select, Switch, message } from 'antd'
import { AudioOutlined, ReloadOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'

export const VoiceSettings = () => {
  const { isCapturing, isMuted, volume, startCapture, stopCapture, setMute, setVolume, devices, setDevices } = useAudio()
  const [inputDeviceId, setInputDeviceId] = useState('')

  const loadDevices = async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices()
      setDevices(deviceList)
      const audioInputDevices = deviceList.filter(device => device.kind === 'audioinput')
      setInputDeviceId(audioInputDevices[0]?.deviceId || '')
      message.success('设备已刷新')
    } catch (err) {
      console.error('Failed to load devices:', err)
      message.error('加载设备失败')
    }
  }

  const handleDeviceChange = (value: string) => {
    setInputDeviceId(value)
  }

  return (
    <div className="space-y-6">
      {/* Audio Status */}
      <Card
        className={cn(
          'rounded-2xl border-l-4 border-l-green-500',
          'hover:shadow-lg transition-shadow'
        )}
        styles={{ body: { padding: '24px' } }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-4 h-4 rounded-full',
              isCapturing ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50' : 'bg-red-500'
            )} />
            <div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {isCapturing ? '麦克风已激活' : '麦克风已停止'}
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {isCapturing ? '正在捕获音频输入' : '点击开始捕获音频'}
              </p>
            </div>
          </div>
          <Button
            type={isCapturing ? 'default' : 'primary'}
            icon={isCapturing ? <CheckCircleOutlined /> : <AudioOutlined />}
            onClick={isCapturing ? stopCapture : startCapture}
            className={cn(
              'rounded-xl px-6 font-semibold',
              isCapturing ? 'border-red-500 text-red-500 hover:bg-red-50' : ''
            )}
          >
            {isCapturing ? '停止' : '开始'}
          </Button>
        </div>
      </Card>

      {/* Audio Controls */}
      <Card
        className={cn(
          'rounded-2xl border-l-4 border-l-blue-500',
          'hover:shadow-lg transition-shadow'
        )}
        styles={{ body: { padding: '24px' } }}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              音频控制
            </h3>
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={loadDevices}
              className="rounded-xl"
            >
              刷新
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <div>
              <span className="font-medium text-gray-900 dark:text-white">静音</span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                关闭麦克风输入
              </p>
            </div>
            <Switch
              checked={isMuted}
              onChange={setMute}
              checkedChildren="开"
              unCheckedChildren="关"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-gray-900 dark:text-white">音量</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {Math.round(volume)}%
              </span>
            </div>
            <Slider
              min={0}
              max={100}
              value={volume}
              onChange={setVolume}
              className="w-full"
              trackStyle={{ backgroundColor: '#1890ff', height: 6 }}
              railStyle={{ backgroundColor: '#e5e7eb', height: 6 }}
              handleStyle={{ borderColor: '#1890ff', width: 18, height: 18 }}
            />
          </div>
        </div>
      </Card>

      {/* Device Selection */}
      <Card
        className={cn(
          'rounded-2xl border-l-4 border-l-purple-500',
          'hover:shadow-lg transition-shadow'
        )}
        styles={{ body: { padding: '24px' } }}
      >
        <div className="space-y-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            输入设备
          </h3>
          <Select
            value={inputDeviceId}
            onChange={handleDeviceChange}
            placeholder="选择麦克风"
            className="w-full"
            prefix={<AudioOutlined />}
            allowClear
          >
            {devices
              .filter((d) => d.kind === 'audioinput')
              .map((device) => (
                <Select.Option key={device.deviceId} value={device.deviceId}>
                  {device.label || '麦克风'}
                </Select.Option>
              ))}
          </Select>
        </div>
      </Card>
    </div>
  )
}