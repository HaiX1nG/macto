import { useRef, useEffect, useCallback } from 'react'
import { cn } from '@renderer/utils/cn'

interface AudioWaveformProps {
  /** Array of normalized audio data (0-1) for visualization */
  audioData?: number[]
  /** AnalyserNode for real-time frequency data */
  analyserNode?: AnalyserNode | null
  /** Canvas height in pixels */
  height?: number
  /** Bar count for the waveform */
  barCount?: number
  /** Color override - defaults to theme primary */
  color?: string
  /** Optional className */
  className?: string
}

/**
 * AudioWaveform - Canvas-based audio visualization component
 *
 * Renders a real-time audio waveform using Canvas API.
 * Supports both pre-computed audio data arrays and live AnalyserNode input.
 */
export default function AudioWaveform({
  audioData,
  analyserNode,
  height = 64,
  barCount = 60,
  color,
  className,
}: AudioWaveformProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const dataArrayRef = useRef<Uint8Array | null>(null)

  // Get the theme primary color from CSS variables
  const getPrimaryColor = useCallback(() => {
    if (color) return color
    const root = document.documentElement
    const computedStyle = getComputedStyle(root)
    const primaryColor = computedStyle.getPropertyValue('--color-primary').trim()
    return primaryColor || '#3b82f6'
  }, [color])

  // Draw the waveform on canvas
  const drawWaveform = useCallback(
    (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, data: number[]) => {
      const width = canvas.width
      const gap = 2
      const barWidth = (width - gap * (barCount - 1)) / barCount

      ctx.clearRect(0, 0, width, canvas.height)

      const primaryColor = getPrimaryColor()

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * data.length)
        const value = data[dataIndex] || 0
        const barHeight = value * (canvas.height - 4)
        const x = i * (barWidth + gap) + gap / 2
        const y = (canvas.height - barHeight) / 2

        // Create gradient for each bar
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight)
        gradient.addColorStop(0, `${primaryColor}40`) // 25% opacity
        gradient.addColorStop(0.5, primaryColor)
        gradient.addColorStop(1, `${primaryColor}40`) // 25% opacity

        ctx.fillStyle = gradient
        ctx.fillRect(x, y, Math.max(1, barWidth), barHeight)
      }
    },
    [barCount, getPrimaryColor]
  )

  // Animation loop for live analyser data
  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Handle analyser node data
    if (analyserNode) {
      if (!dataArrayRef.current || dataArrayRef.current.length !== analyserNode.frequencyBinCount) {
        dataArrayRef.current = new Uint8Array(analyserNode.frequencyBinCount)
      }
      const freqData = dataArrayRef.current
      // @ts-expect-error Type compatibility between Uint8Array variants
      analyserNode.getByteFrequencyData(freqData)

      // Normalize data to 0-1 range
      const normalizedData: number[] = []
      for (let i = 0; i < freqData.length; i++) {
        normalizedData.push(freqData[i] / 255)
      }
      drawWaveform(ctx, canvas, normalizedData)
    } else if (audioData) {
      // Use provided audio data
      drawWaveform(ctx, canvas, audioData)
    } else {
      // Default idle animation - subtle wave
      const time = Date.now() / 1000
      const idleData = Array.from({ length: barCount }, (_, i) => {
        const wave1 = Math.sin(i * 0.2 + time * 2) * 0.3
        const wave2 = Math.sin(i * 0.15 + time * 1.5) * 0.2
        return Math.max(0.05, 0.1 + wave1 + wave2)
      })
      drawWaveform(ctx, canvas, idleData)
    }

    animationRef.current = requestAnimationFrame(animate)
  }, [analyserNode, audioData, barCount, drawWaveform])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Set canvas resolution for high DPI displays
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.scale(dpr, dpr)

    // Start animation loop
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [animate])

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div
      className={cn(
        'w-full rounded-xl overflow-hidden',
        'bg-[var(--color-bg-secondary)]/30',
        'border border-[var(--color-border)]',
        className
      )}
      style={{ height }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
