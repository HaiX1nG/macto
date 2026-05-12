import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DownloadOutlined, ReloadOutlined, CloseOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { Button } from './ui/Button'

interface UpdateInfo {
  version: string
  releaseDate: string
  releaseNotes?: string | null
}

interface UpdateProgress {
  bytesPerSecond: number
  percent: number
  total: number
  transferred: number
}

type UpdateState = 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error'

interface UpdateNotificationProps {
  className?: string
}

export function UpdateNotification({ className = '' }: UpdateNotificationProps) {
  const [updateState, setUpdateState] = useState<UpdateState>('idle')
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<UpdateProgress | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDismissed, setIsDismissed] = useState(false)

  // Set up update event listeners
  useEffect(() => {
    if (!window.electronAPI) return

    const unsubscribers: Array<() => void> = []

    // Update checking
    unsubscribers.push(
      window.electronAPI.onUpdateChecking(() => {
        setUpdateState('checking')
        setErrorMessage(null)
      })
    )

    // Update available
    unsubscribers.push(
      window.electronAPI.onUpdateAvailable((info: UpdateInfo) => {
        setUpdateState('available')
        setUpdateInfo(info)
        setIsDismissed(false)
      })
    )

    // Update not available
    unsubscribers.push(
      window.electronAPI.onUpdateNotAvailable(() => {
        setUpdateState('idle')
      })
    )

    // Download progress
    unsubscribers.push(
      window.electronAPI.onUpdateProgress((progress: UpdateProgress) => {
        setUpdateState('downloading')
        setDownloadProgress(progress)
      })
    )

    // Update downloaded
    unsubscribers.push(
      window.electronAPI.onUpdateDownloaded((info: UpdateInfo) => {
        setUpdateState('downloaded')
        setUpdateInfo(info)
        setDownloadProgress(null)
      })
    )

    // Update error
    unsubscribers.push(
      window.electronAPI.onUpdateError((error: { message: string }) => {
        setUpdateState('error')
        setErrorMessage(error.message)
      })
    )

    return () => {
      unsubscribers.forEach((unsub) => unsub())
    }
  }, [])

  const handleDownload = useCallback(async () => {
    if (!window.electronAPI) return
    setUpdateState('downloading')
    setDownloadProgress({ bytesPerSecond: 0, percent: 0, total: 0, transferred: 0 })
    await window.electronAPI.downloadUpdate()
  }, [])

  const handleInstall = useCallback(async () => {
    if (!window.electronAPI) return
    await window.electronAPI.quitAndInstall()
  }, [])

  const handleDismiss = useCallback(() => {
    setIsDismissed(true)
  }, [])

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  const formatSpeed = (bytesPerSecond: number): string => {
    return `${formatBytes(bytesPerSecond)}/s`
  }

  // Don't render if idle, checking, or dismissed
  if (updateState === 'idle' || updateState === 'checking' || isDismissed) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`fixed top-4 right-4 z-50 max-w-sm ${className}`}
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-blue-900/30 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <CheckCircleOutlined className="text-blue-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Update Available
              </span>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <CloseOutlined className="text-sm" />
            </button>
          </div>

          {/* Content */}
          <div className="px-4 py-3">
            {updateState === 'available' && updateInfo && (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Version <span className="font-medium text-gray-900 dark:text-gray-100">{updateInfo.version}</span> is now available.
                </p>
                {updateInfo.releaseNotes && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                    {updateInfo.releaseNotes}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    size="small"
                    onClick={handleDownload}
                    className="flex items-center gap-1"
                  >
                    <DownloadOutlined className="text-sm" />
                    Download
                  </Button>
                  <Button
                    size="small"
                    variant="ghost"
                    onClick={handleDismiss}
                  >
                    Later
                  </Button>
                </div>
              </>
            )}

            {updateState === 'downloading' && downloadProgress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Downloading...</span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">
                    {downloadProgress.percent.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${downloadProgress.percent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{formatBytes(downloadProgress.transferred)} / {formatBytes(downloadProgress.total)}</span>
                  <span>{formatSpeed(downloadProgress.bytesPerSecond)}</span>
                </div>
              </div>
            )}

            {updateState === 'downloaded' && updateInfo && (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Version <span className="font-medium text-gray-900 dark:text-gray-100">{updateInfo.version}</span> is ready to install.
                </p>
                <Button
                  size="small"
                  onClick={handleInstall}
                  className="flex items-center gap-1"
                >
                  <ReloadOutlined className="text-sm" />
                  Restart & Install
                </Button>
              </>
            )}

            {updateState === 'error' && errorMessage && (
              <>
                <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                  Update failed: {errorMessage}
                </p>
                <Button
                  size="small"
                  variant="ghost"
                  onClick={handleDismiss}
                >
                  Dismiss
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
