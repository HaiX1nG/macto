import { useState, useEffect, useRef } from 'react'
import { useScreen } from '@renderer/hooks/useScreen'
import { Card, Button, Input, Switch, Select, App } from 'antd'
import { DesktopOutlined, LockOutlined, ReloadOutlined, StopOutlined, EyeOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'

export const ScreenControl = () => {
  const { isSharing, controlEnabled, startSharing, stopSharing, enableControl, disableControl, localStream } = useScreen()
  const { message: messageApi } = App.useApp()
  const [sessionId, setSessionId] = useState('')
  const [error, setError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)

  // Update video preview when stream changes
  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream
    }
  }, [localStream])

  const handleStartSharing = async () => {
    if (!sessionId.trim()) {
      setError('请输入会话 ID')
      return
    }
    setError('')
    try {
      await startSharing(Number(sessionId))
      messageApi.success('屏幕分享已开始')
    } catch (_err) {
      setError('开始分享失败')
      messageApi.error('开始分享失败')
    }
  }

  const handleStopSharing = async () => {
    try {
      await stopSharing(Number(sessionId))
      messageApi.success('屏幕分享已停止')
    } catch (_err) {
      messageApi.error('停止分享失败')
    }
  }

  return (
    <div className="space-y-6">
      {/* Screen Status */}
      <Card
        className={cn(
          'rounded-2xl border-l-4 border-l-green-500',
          'hover:shadow-lg transition-shadow'
        )}
        styles={{ body: { padding: '24px' } }}
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                'w-4 h-4 rounded-full',
                isSharing ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50' : 'bg-gray-500'
              )} />
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {isSharing ? '屏幕分享已激活' : '屏幕分享未激活'}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {isSharing ? '正在共享您的屏幕' : '开始共享您的屏幕'}
                </p>
              </div>
            </div>
          </div>

          {!isSharing ? (
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="输入会话 ID"
                  value={sessionId}
                  onChange={(e) => {
                    setSessionId(e.target.value)
                    setError('')
                  }}
                  prefix={<DesktopOutlined className="text-gray-400" />}
                  allowClear
                  className={cn(
                    'rounded-xl py-2.5',
                    error && 'border-red-500 focus:border-red-500'
                  )}
                />
                {error && (
                  <p className="text-xs text-red-500 mt-2">{error}</p>
                )}
              </div>
              <Button
                type="primary"
                icon={<DesktopOutlined />}
                onClick={handleStartSharing}
                className="rounded-xl px-6 font-semibold"
              >
                开始分享
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                danger
                icon={<StopOutlined />}
                onClick={handleStopSharing}
                className="rounded-xl px-6 font-semibold"
              >
                停止分享
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Screen Preview */}
      {isSharing && localStream && (
        <Card
          className={cn(
            'rounded-2xl border-l-4 border-l-blue-500',
            'hover:shadow-lg transition-shadow'
          )}
          styles={{ body: { padding: '24px' } }}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                屏幕预览
              </h3>
              <Button
                size="small"
                icon={<EyeOutlined />}
                className="rounded-xl"
              >
                全屏查看
              </Button>
            </div>
            <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 rounded text-xs text-white">
                正在分享
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Screen Controls */}
      {isSharing && (
        <Card
          className={cn(
            'rounded-2xl border-l-4 border-l-purple-500',
            'hover:shadow-lg transition-shadow'
          )}
          styles={{ body: { padding: '24px' } }}
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                屏幕控制
              </h3>
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => messageApi.info('控制已刷新')}
                className="rounded-xl"
              >
                刷新
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <div>
                <span className="font-medium text-gray-900 dark:text-white">
                  允许远程控制
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  允许其他用户控制您的屏幕
                </p>
              </div>
              <Switch
                checked={controlEnabled}
                onChange={controlEnabled ? disableControl : enableControl}
                checkedChildren={<LockOutlined />}
                unCheckedChildren={<DesktopOutlined />}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <div>
                <span className="font-medium text-gray-900 dark:text-white">
                  分享音频
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  同时分享系统音频
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <div>
                <span className="font-medium text-gray-900 dark:text-white">
                  画质设置
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  调整分享画质
                </p>
              </div>
              <Select
                defaultValue="auto"
                options={[
                  { value: 'auto', label: '自动' },
                  { value: 'high', label: '高清' },
                  { value: 'medium', label: '标清' },
                  { value: 'low', label: '流畅' },
                ]}
                className="w-24"
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}