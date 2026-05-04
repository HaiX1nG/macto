/**
 * HomeView Component
 *
 * The home page/dashboard view of the Macto application.
 * Displays welcome message, statistics cards, and quick action buttons.
 */

import React from 'react'
import { Row, Col, Card, Typography, Button, Space } from 'antd'
import { TeamOutlined, VideoCameraOutlined, AudioOutlined, SettingOutlined, RightOutlined, PlusOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'

const { Title, Text } = Typography

interface Channel {
  id: string
  name: string
  type: 'voice' | 'video' | 'meeting'
  unread?: number
  icon: React.ReactNode
}

interface HomeViewProps {
  channels?: Channel[]
  onEnterChannel?: () => void
  onCreateChannel?: () => void
}

export const HomeView: React.FC<HomeViewProps> = ({
  channels = [],
  onEnterChannel,
  onCreateChannel,
}) => {
  const totalParticipants = 0

  return (
    <div className="flex h-screen bg-[var(--color-bg-secondary-light)] dark:bg-[var(--color-bg-dark)] transition-colors duration-300">
      {/* Sidebar */}
      <div className={cn(
        'w-64 bg-white dark:bg-[var(--color-bg-dark)]',
        'border-r border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]',
        'flex flex-col transition-colors duration-300'
      )}>
        {/* Logo */}
        <div className="p-6 border-b border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl',
              'bg-gradient-to-br from-blue-500 to-purple-600',
              'flex items-center justify-center',
              'text-white font-bold text-lg',
              'shadow-[var(--shadow-lg)] shadow-blue-500/30'
            )}>
              M
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">Macto</h1>
              <Text type="secondary" className="text-xs">语音 & 屏幕</Text>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-3 py-4 space-y-1 flex-1 overflow-y-auto">
          <Button
            type="text"
            block
            icon={<TeamOutlined />}
            onClick={onEnterChannel}
            className={cn(
              'w-full justify-start rounded-xl',
              'bg-blue-50 dark:bg-blue-900/20',
              'text-[var(--color-primary)] dark:text-[var(--color-primary)]',
              'hover:bg-[var(--color-primary-light)] dark:hover:bg-[var(--color-primary-light)]/10',
              'transition-all duration-200'
            )}
          >
            频道列表
          </Button>
          <Button
            type="text"
            block
            icon={<AudioOutlined />}
            className={cn(
              'w-full justify-start rounded-[var(--radius-xl)]',
              'text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]',
              'hover:bg-[var(--color-bg-tertiary-light)] dark:hover:bg-[var(--color-bg-tertiary-dark)]',
              'transition-[var(--transition-all)]'
            )}
          >
            语音频道
          </Button>
          <Button
            type="text"
            block
            icon={<VideoCameraOutlined />}
            className={cn(
              'w-full justify-start rounded-[var(--radius-xl)]',
              'text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]',
              'hover:bg-[var(--color-bg-tertiary-light)] dark:hover:bg-[var(--color-bg-tertiary-dark)]',
              'transition-[var(--transition-all)]'
            )}
          >
            屏幕分享
          </Button>
          <Button
            type="text"
            block
            icon={<SettingOutlined />}
            className={cn(
              'w-full justify-start rounded-[var(--radius-xl)]',
              'text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]',
              'hover:bg-[var(--color-bg-tertiary-light)] dark:hover:bg-[var(--color-bg-tertiary-dark)]',
              'transition-[var(--transition-all)]'
            )}
          >
            设置
          </Button>
        </div>

        {/* User */}
        <div className="p-4 border-t border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]">
          <div className={cn(
            'flex items-center gap-3 px-3 py-3 rounded-[var(--radius-xl)]',
            'hover:bg-[var(--color-bg-tertiary-light)] dark:hover:bg-[var(--color-bg-tertiary-dark)]',
            'transition-colors cursor-pointer'
          )}>
            <div className={cn(
              'w-8 h-8 rounded-full',
              'bg-gradient-to-br from-blue-500 to-purple-600',
              'flex items-center justify-center',
              'text-white text-xs font-bold'
            )}>
              U
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[var(--color-text-light)] dark:text-[var(--color-text-dark)] truncate">用户</div>
              <div className="text-xs text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] truncate">在线</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className={cn(
          'h-16 bg-white/80 dark:bg-[var(--color-bg-dark)]/80',
          'backdrop-blur-[var(--blur-md)]',
          'border-b border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]',
          'flex items-center justify-between px-6',
          'sticky top-0 z-10',
          'transition-colors duration-300'
        )}>
          <h1 className="text-2xl font-bold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">首页</h1>
          <div className="flex items-center gap-4">
            <div className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full',
              'bg-[var(--color-success-light)] dark:bg-[var(--color-success-light)]/10',
              'text-[var(--color-success)] dark:text-[var(--color-success)]',
              'text-sm font-medium'
            )}>
              <span className="w-2 h-2 bg-[var(--color-success)] rounded-full animate-pulse" />
              在线
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {/* Welcome */}
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)] mb-3">
                欢迎使用 Macto
              </h2>
              <p className="text-lg text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
                开始您的语音和屏幕分享体验
              </p>
            </div>

            {/* Statistics */}
            <Row gutter={[24, 24]} className="mb-12">
              <Col xs={24} sm={12} lg={8}>
                <Card
                  className={cn(
                    'rounded-[var(--radius-2xl)] border-t-4 border-t-[var(--color-primary)]',
                    'hover:shadow-[var(--shadow-xl)] hover:-translate-y-1',
                    'transition-[var(--transition-all)]'
                  )}
                  styles={{ body: { padding: '28px' } }}
                >
                  <div className="flex items-center gap-4 mb-5">
                    <div className={cn(
                      'w-14 h-14 rounded-[var(--radius-2xl)]',
                      'bg-[var(--color-primary-light)] dark:bg-[var(--color-primary-light)]/10',
                      'flex items-center justify-center',
                      'text-[var(--color-primary)] dark:text-[var(--color-primary)]'
                    )}>
                      <TeamOutlined className="text-2xl" />
                    </div>
                    <div>
                      <Title level={5} className="mb-0 text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">频道</Title>
                      <Text type="secondary" className="text-sm">所有频道</Text>
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">
                    {channels.length}
                  </div>
                  <Text type="secondary" className="text-sm mt-2 block">
                    {channels.length} 个频道
                  </Text>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={8}>
                <Card
                  className={cn(
                    'rounded-[var(--radius-2xl)] border-t-4 border-t-purple-500',
                    'hover:shadow-[var(--shadow-xl)] hover:-translate-y-1',
                    'transition-[var(--transition-all)]'
                  )}
                  styles={{ body: { padding: '28px' } }}
                >
                  <div className="flex items-center gap-4 mb-5">
                    <div className={cn(
                      'w-14 h-14 rounded-[var(--radius-2xl)]',
                      'bg-purple-100 dark:bg-purple-900/30',
                      'flex items-center justify-center',
                      'text-purple-600 dark:text-purple-400'
                    )}>
                      <TeamOutlined className="text-2xl" />
                    </div>
                    <div>
                      <Title level={5} className="mb-0 text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">参与者</Title>
                      <Text type="secondary" className="text-sm">当前在线</Text>
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">
                    {totalParticipants}
                  </div>
                  <Text type="secondary" className="text-sm mt-2 block">
                    {totalParticipants} 人在线
                  </Text>
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={8}>
                <Card
                  className={cn(
                    'rounded-[var(--radius-2xl)] border-t-4 border-t-[var(--color-success)]',
                    'hover:shadow-[var(--shadow-xl)] hover:-translate-y-1',
                    'transition-[var(--transition-all)]'
                  )}
                  styles={{ body: { padding: '28px' } }}
                >
                  <div className="flex items-center gap-4 mb-5">
                    <div className={cn(
                      'w-14 h-14 rounded-[var(--radius-2xl)]',
                      'bg-[var(--color-success-light)] dark:bg-[var(--color-success-light)]/10',
                      'flex items-center justify-center',
                      'text-[var(--color-success)] dark:text-[var(--color-success)]'
                    )}>
                      <TeamOutlined className="text-2xl" />
                    </div>
                    <div>
                      <Title level={5} className="mb-0 text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">状态</Title>
                      <Text type="secondary" className="text-sm">应用状态</Text>
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">100%</div>
                  <Text type="secondary" className="text-sm mt-2 block">
                    系统正常运行
                  </Text>
                </Card>
              </Col>
            </Row>

            {/* Quick Actions */}
            <Card
              className={cn(
                'rounded-[var(--radius-2xl)] border-t-4 border-t-[var(--color-primary)]',
                'hover:shadow-[var(--shadow-xl)] hover:-translate-y-1',
                'transition-[var(--transition-all)]'
              )}
              styles={{ body: { padding: '36px' } }}
            >
              <div className="flex items-center gap-4 mb-8">
                <div className={cn(
                  'w-12 h-12 rounded-[var(--radius-xl)]',
                  'bg-[var(--color-primary-light)] dark:bg-[var(--color-primary-light)]/10',
                  'flex items-center justify-center',
                  'text-[var(--color-primary)] dark:text-[var(--color-primary)]'
                )}>
                  <TeamOutlined className="text-xl" />
                </div>
                <div>
                  <Title level={5} className="mb-0 text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">快速开始</Title>
                  <Text type="secondary" className="text-sm">开始使用 Macto</Text>
                </div>
              </div>
              <Space size="large">
                <Button
                  type="primary"
                  size="large"
                  onClick={onEnterChannel}
                  className="px-10 rounded-xl font-semibold"
                  icon={<RightOutlined />}
                >
                  进入频道
                </Button>
                <Button
                  size="large"
                  onClick={onCreateChannel}
                  className="px-10 rounded-xl font-semibold"
                  icon={<PlusOutlined />}
                >
                  创建频道
                </Button>
              </Space>
            </Card>

            {/* Recent Channels */}
            {channels.length > 0 && (
              <div className="mt-12">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]">最近频道</h3>
                    <Text type="secondary" className="text-sm">
                      快速访问您最近使用的频道
                    </Text>
                  </div>
                  <Button
                    type="text"
                    onClick={onEnterChannel}
                    className="text-[var(--color-primary)] dark:text-[var(--color-primary)] font-medium"
                  >
                    查看全部
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {channels.map((channel) => (
                    <div
                      key={channel.id}
                      onClick={onEnterChannel}
                      className={cn(
                        'group flex items-center gap-4 p-5 rounded-[var(--radius-2xl)]',
                        'bg-white dark:bg-[var(--color-bg-tertiary-dark)]',
                        'border border-[var(--color-border-light)] dark:border-[var(--color-border-dark)]',
                        'hover:border-[var(--color-primary)] dark:hover:border-[var(--color-primary)]',
                        'hover:shadow-[var(--shadow-lg)] hover:-translate-y-1',
                        'transition-[var(--transition-all)] cursor-pointer'
                      )}
                    >
                      <div className={cn(
                        'w-12 h-12 rounded-[var(--radius-xl)] flex items-center justify-center',
                        channel.type === 'voice'
                          ? 'bg-[var(--color-primary-light)] dark:bg-[var(--color-primary-light)]/10 text-[var(--color-primary)] dark:text-[var(--color-primary)]'
                          : channel.type === 'video'
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                            : 'bg-[var(--color-success-light)] dark:bg-[var(--color-success-light)]/10 text-[var(--color-success)] dark:text-[var(--color-success)]'
                      )}>
                        {channel.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={cn(
                          'font-semibold truncate',
                          'text-[var(--color-text-light)] dark:text-[var(--color-text-dark)]',
                          'group-hover:text-[var(--color-primary)] dark:group-hover:text-[var(--color-primary)]',
                          'transition-colors'
                        )}>
                          {channel.name}
                        </div>
                        <div className="text-xs text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] capitalize">
                          {channel.type === 'voice' ? '语音频道' : channel.type === 'video' ? '视频频道' : '会议'}
                        </div>
                      </div>
                      {channel.unread && channel.unread > 0 && (
                        <div className={cn(
                          'w-6 h-6 rounded-full',
                          'bg-[var(--color-error)] text-white',
                          'flex items-center justify-center',
                          'text-xs font-bold'
                        )}>
                          {channel.unread}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}