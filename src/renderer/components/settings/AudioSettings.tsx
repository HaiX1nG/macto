import { useState, useEffect } from 'react'
import { Slider, Select, Spin } from 'antd'
import { AudioOutlined, SoundOutlined } from '@ant-design/icons'
import { Modal } from '@renderer/components/ui/Modal'
import { cn } from '@renderer/utils/cn'

interface AudioDevice {
  deviceId: string
  label: string
}

interface AudioSettingsProps {
  open: boolean
  onClose: () => void
}

export function AudioSettings({ open, onClose }: AudioSettingsProps) {
  const [loading, setLoading] = useState(false)
  const [inputDevices, setInputDevices] = useState<AudioDevice[]>([])
  const [outputDevices, setOutputDevices] = useState<AudioDevice[]>([])

  const [selectedInput, setSelectedInput] = useState<string>('')
  const [selectedOutput, setSelectedOutput] = useState<string>('')
  const [inputVolume, setInputVolume] = useState(100)
  const [outputVolume, setOutputVolume] = useState(100)

  useEffect(() => {
    if (open) {
      setLoading(true)
      // Request permission first
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => navigator.mediaDevices.enumerateDevices())
        .then((devices) => {
          const inputs: AudioDevice[] = []
          const outputs: AudioDevice[] = []

          devices.forEach((device) => {
            if (device.kind === 'audioinput') {
              inputs.push({
                deviceId: device.deviceId,
                label: device.label || `麦克风 ${device.deviceId.slice(0, 8)}`,
              })
            } else if (device.kind === 'audiooutput') {
              outputs.push({
                deviceId: device.deviceId,
                label: device.label || `扬声器 ${device.deviceId.slice(0, 8)}`,
              })
            }
          })

          setInputDevices(inputs)
          setOutputDevices(outputs)

          // Set defaults
          if (inputs.length > 0 && !selectedInput) {
            setSelectedInput(inputs[0].deviceId)
          }
          if (outputs.length > 0 && !selectedOutput) {
            setSelectedOutput(outputs[0].deviceId)
          }

          setLoading(false)
        })
        .catch((err) => {
          console.error('Failed to load audio devices:', err)
          setLoading(false)
        })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleSave = () => {
    // Save settings to localStorage
    localStorage.setItem('audioInputDevice', selectedInput)
    localStorage.setItem('audioOutputDevice', selectedOutput)
    localStorage.setItem('audioInputVolume', String(inputVolume))
    localStorage.setItem('audioOutputVolume', String(outputVolume))
    onClose()
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="音频设置"
      size="md"
      footer={
        <>
          <button
            onClick={onClose}
            className={cn(
              'px-5 py-2.5 rounded-xl font-medium',
              'bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-darker)]',
              'text-[var(--color-text-normal)]',
              'transition-colors duration-150 ease-out'
            )}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className={cn(
              'px-5 py-2.5 rounded-xl font-medium',
              'bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/80',
              'text-[var(--color-bg-base)]',
              'transition-colors duration-150 ease-out'
            )}
          >
            保存
          </button>
        </>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spin />
        </div>
      ) : (
        <div className="space-y-6 py-4">
          {/* Input Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-normal)]">
              <AudioOutlined />
              <span>麦克风设置</span>
            </div>

            <div className="space-y-2 pl-6">
              <label className="text-xs text-[var(--color-text-muted)]">麦克风设备</label>
              <Select
                value={selectedInput}
                onChange={setSelectedInput}
                className="w-full"
                options={inputDevices.map(d => ({ value: d.deviceId, label: d.label }))}
                placeholder="选择麦克风"
              />
            </div>

            <div className="space-y-2 pl-6">
              <label className="text-xs text-[var(--color-text-muted)]">麦克风音量: {inputVolume}%</label>
              <Slider
                value={inputVolume}
                onChange={setInputVolume}
                min={0}
                max={100}
              />
            </div>
          </div>

          {/* Output Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-normal)]">
              <SoundOutlined />
              <span>扬声器设置</span>
            </div>

            <div className="space-y-2 pl-6">
              <label className="text-xs text-[var(--color-text-muted)]">扬声器设备</label>
              <Select
                value={selectedOutput}
                onChange={setSelectedOutput}
                className="w-full"
                options={outputDevices.map(d => ({ value: d.deviceId, label: d.label }))}
                placeholder="选择扬声器"
              />
            </div>

            <div className="space-y-2 pl-6">
              <label className="text-xs text-[var(--color-text-muted)]">扬声器音量: {outputVolume}%</label>
              <Slider
                value={outputVolume}
                onChange={setOutputVolume}
                min={0}
                max={100}
              />
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
