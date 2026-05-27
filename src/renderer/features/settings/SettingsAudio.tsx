import { useState, useEffect, useCallback } from 'react'
import { Select, Slider, Switch, Button, Progress, App } from 'antd'
import { AudioOutlined, AudioMutedOutlined, SoundOutlined, ReloadOutlined } from '@ant-design/icons'
import { useVoiceStore } from '@renderer/stores/voiceStore'

export const SettingsAudio = () => {
  const { message } = App.useApp()
  const {
    devices,
    inputDeviceId,
    outputDeviceId,
    volume,
    isMuted,
    setInputDevice,
    setOutputDevice,
    setVolume,
    setMute,
  } = useVoiceStore()

  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([])
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([])
  const [micLevel, setMicLevel] = useState(0)
  const [isTestingMic, setIsTestingMic] = useState(false)
  const [testStream, setTestStream] = useState<MediaStream | null>(null)
  const [noiseSuppression, setNoiseSuppression] = useState(true)
  const [echoCancellation, setEchoCancellation] = useState(true)

  // Load devices on mount
  useEffect(() => {
    loadDevices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices])

  const loadDevices = async () => {
    try {
      // Request permission first
      await navigator.mediaDevices.getUserMedia({ audio: true })
      const deviceList = await navigator.mediaDevices.enumerateDevices()

      const inputs = deviceList.filter(d => d.kind === 'audioinput')
      const outputs = deviceList.filter(d => d.kind === 'audiooutput')

      setInputDevices(inputs)
      setOutputDevices(outputs)

      // Set default if not set
      if (!inputDeviceId && inputs.length > 0) {
        setInputDevice(inputs[0].deviceId)
      }
      if (!outputDeviceId && outputs.length > 0) {
        setOutputDevice(outputs[0].deviceId)
      }
    } catch (err) {
      console.error('Failed to load devices:', err)
      message.error('无法获取设备列表，请检查权限')
    }
  }

  // Test microphone and show level
  const startMicTest = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: inputDeviceId ? { deviceId: { exact: inputDeviceId } } : true
      })
      setTestStream(stream)
      setIsTestingMic(true)

      // Create audio context for level analysis
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      analyser.fftSize = 256

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
        setMicLevel(Math.min(100, Math.round(average * 100 / 128)))
        if (isTestingMic) {
          requestAnimationFrame(updateLevel)
        }
      }
      updateLevel()
    } catch (_err) {
      console.error('Failed to test microphone:')
      message.error('无法访问麦克风')
    }
  }, [inputDeviceId, isTestingMic, message])

  const stopMicTest = useCallback(() => {
    if (testStream) {
      testStream.getTracks().forEach(track => track.stop())
      setTestStream(null)
    }
    setIsTestingMic(false)
    setMicLevel(0)
  }, [testStream])

  // Test output sound - play a simple beep
  const testOutputSound = () => {
    try {
      const audioContext = new AudioContext()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 440 // A4 note
      oscillator.type = 'sine'
      gainNode.gain.value = (volume / 100) * 0.3

      oscillator.start()
      setTimeout(() => {
        oscillator.stop()
        audioContext.close()
      }, 500)
    } catch (_err) {
      message.error('无法播放测试音频')
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (testStream) {
        testStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [testStream])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-[var(--color-text-normal)] mb-1">音频设置</h3>
        <p className="text-sm text-[var(--color-text-muted)]">配置麦克风和扬声器</p>
      </div>

      {/* Input Device */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <AudioOutlined className="text-[var(--color-primary)]" />
          <span className="font-medium text-[var(--color-text-normal)]">麦克风</span>
        </div>

        <div className="flex gap-2">
          <Select
            value={inputDeviceId || undefined}
            onChange={setInputDevice}
            placeholder="选择麦克风设备"
            className="flex-1"
            options={inputDevices.map(d => ({
              value: d.deviceId,
              label: d.label || `麦克风 ${d.deviceId.slice(0, 8)}`
            }))}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={loadDevices}
            title="刷新设备列表"
          />
        </div>

        {/* Mic Test */}
        <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-text-muted)]">麦克风测试</span>
            <Button
              type={isTestingMic ? 'primary' : 'default'}
              danger={isTestingMic}
              icon={isTestingMic ? <AudioMutedOutlined /> : <AudioOutlined />}
              onClick={isTestingMic ? stopMicTest : startMicTest}
              size="small"
            >
              {isTestingMic ? '停止测试' : '开始测试'}
            </Button>
          </div>
          {isTestingMic && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--color-text-muted)] w-8">音量</span>
                <Progress
                  percent={micLevel}
                  size="small"
                  showInfo={false}
                  strokeColor={{
                    '0%': 'var(--color-primary)',
                    '100%': 'var(--color-success)',
                  }}
                  trailColor="var(--color-bg-darker)"
                  className="flex-1"
                />
                <span className="text-xs text-[var(--color-text-muted)] w-8">{micLevel}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Output Device */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <SoundOutlined className="text-[var(--color-primary)]" />
          <span className="font-medium text-[var(--color-text-normal)]">扬声器</span>
        </div>

        <div className="flex gap-2">
          <Select
            value={outputDeviceId || undefined}
            onChange={setOutputDevice}
            placeholder="选择扬声器设备"
            className="flex-1"
            options={outputDevices.map(d => ({
              value: d.deviceId,
              label: d.label || `扬声器 ${d.deviceId.slice(0, 8)}`
            }))}
          />
          <Button
            icon={<SoundOutlined />}
            onClick={testOutputSound}
            title="测试扬声器"
          >
            测试
          </Button>
        </div>
      </div>

      {/* Volume Control */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-medium text-[var(--color-text-normal)]">主音量</span>
          <span className="text-sm text-[var(--color-text-muted)]">{volume}%</span>
        </div>
        <Slider
          value={volume}
          onChange={setVolume}
          min={0}
          max={100}
          tooltip={{ formatter: (v) => `${v}%` }}
        />
      </div>

      {/* Mute Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
        <div>
          <span className="font-medium text-[var(--color-text-normal)]">静音</span>
          <p className="text-xs text-[var(--color-text-muted)]">关闭麦克风输入</p>
        </div>
        <Switch
          checked={isMuted}
          onChange={(checked) => setMute(checked)}
          checkedChildren={<AudioMutedOutlined />}
          unCheckedChildren={<AudioOutlined />}
        />
      </div>

      {/* Noise Suppression */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
        <div>
          <span className="font-medium text-[var(--color-text-normal)]">噪音抑制</span>
          <p className="text-xs text-[var(--color-text-muted)]">减少背景噪音</p>
        </div>
        <Switch
          checked={noiseSuppression}
          onChange={setNoiseSuppression}
        />
      </div>

      {/* Echo Cancellation */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
        <div>
          <span className="font-medium text-[var(--color-text-normal)]">回声消除</span>
          <p className="text-xs text-[var(--color-text-muted)]">减少扬声器回声</p>
        </div>
        <Switch
          checked={echoCancellation}
          onChange={setEchoCancellation}
        />
      </div>
    </div>
  )
}

export default SettingsAudio
