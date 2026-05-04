import { useState } from 'react'
import { useScreen } from '@renderer/hooks/useScreen'
import { Card, Button, Input, message, Switch } from 'antd'
import { DesktopOutlined, LockOutlined, ReloadOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'

export const ScreenControl = () => {
  const { isShared, controlEnabled, startSharing, stopSharing, enableControl, disableControl } = useScreen()
  const [sessionId, setSessionId] = useState('')
  const [error, setError] = useState('')

  const handleStartSharing = async () => {
    if (!sessionId.trim()) {
      setError('请输入会话 ID')
      return
    }
    setError('')
    try {
      await startSharing(sessionId)
      message.success('屏幕分享已开始')
    } catch (err) {
      console.error('Failed to start sharing:', err)
      setError('开始分享失败')
      message.error('开始分享失败')
    }
  }

  const handleStopSharing = async () => {
    try {
      await stopSharing(sessionId)
      message.success('屏幕分享已停止')
    } catch (err) {
      console.error('Failed to stop sharing:', err)
      message.error('停止分享失败')
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
                isShared ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50' : 'bg-gray-500'
              )} />
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {isShared ? '屏幕分享已激活' : '屏幕分享未激活'}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {isShared ? '正在共享您的屏幕' : '开始共享您的屏幕'}
                </p>
              </div>
            </div>
          </div>

          {!isShared ? (
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
            <Button
              danger
              icon={<DesktopOutlined />}
              onClick={handleStopSharing}
              className="rounded-xl px-6 font-semibold"
            >
              停止分享
            </Button>
          )}
        </div>
      </Card>

      {/* Screen Controls */}
      {isShared && (
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
                onClick={() => message.info('控制已刷新')}
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
          </div>
        </Card>
      )}
    </div>
  )
}