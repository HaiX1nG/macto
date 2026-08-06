/**
 * @deprecated 此组件已在页面结构重塑（Phase 1A-1D）中弃用。
 * 由 src/renderer/pages/HomePage + NavigationShell 替代。
 * 后续清理阶段将删除此文件，请勿在新代码中引用。
 */
import React, { useEffect, useMemo } from 'react'
import { Row, Col, Card, Typography, Button, Space } from 'antd'
import {
  TeamOutlined,
  VideoCameraOutlined,
  AudioOutlined,
  SettingOutlined,
  RightOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { motion } from 'framer-motion'
import { cn } from '@renderer/utils/cn'
import { EmptyState } from '@renderer/components/ui/EmptyState'
import { Skeleton, SkeletonCard } from '@renderer/components/ui/Skeleton'
import { useRoomStore } from '@renderer/stores/roomStore'
import { useAuthStore } from '@renderer/stores/authStore'
import type { RoomInfoResponse } from '@shared/types/api'

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

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
  }
}

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
  }
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
  }
}

/**
 * Convert RoomInfoResponse to Channel format for display
 */
function roomToChannel(room: RoomInfoResponse): Channel {
  const isVoiceRoom = room.roomType === 2
  return {
    id: String(room.id),
    name: room.roomName,
    type: isVoiceRoom ? 'voice' : 'meeting',
    icon: isVoiceRoom ? <AudioOutlined /> : <TeamOutlined />,
  }
}

/**
 * Statistics Card Component with loading state
 */
interface StatCardProps {
  title: string
  subtitle: string
  value: number | string
  valueLabel: string
  icon: React.ReactNode
  borderColor: string
  iconBgColor: string
  iconTextColor: string
  isLoading?: boolean
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  subtitle,
  value,
  valueLabel,
  icon,
  borderColor,
  iconBgColor,
  iconTextColor,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Card
        className={cn(
          'rounded-2xl border-t-4',
          borderColor,
          'hover:shadow-xl hover:-translate-y-1',
          'transition-[transform,box-shadow,border-color] duration-200'
        )}
        styles={{ body: { padding: '24px' } }}
      >
        <SkeletonCard showAvatar={false} lines={2} />
      </Card>
    )
  }

  return (
    <motion.div variants={itemVariants}>
      <Card
        className={cn(
          'rounded-2xl border-t-4',
          borderColor,
          'hover:shadow-xl hover:-translate-y-1',
          'transition-[transform,box-shadow,border-color] duration-200'
        )}
        styles={{ body: { padding: '24px' } }}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className={cn(
            'w-12 h-12 rounded-xl',
            iconBgColor,
            'flex items-center justify-center',
            iconTextColor
          )}>
            {icon}
          </div>
          <div>
            <Title level={5} className="mb-0 text-[var(--color-text-normal)]">{title}</Title>
            <Text type="secondary" className="text-sm text-[var(--color-text-muted)]">{subtitle}</Text>
          </div>
        </div>
        <div className="text-3xl font-bold text-[var(--color-text-normal)]">
          {value}
        </div>
        <Text type="secondary" className="text-sm mt-2 block text-[var(--color-text-muted)]">
          {valueLabel}
        </Text>
      </Card>
    </motion.div>
  )
}

export const HomeView: React.FC<HomeViewProps> = ({
  channels: propChannels = [],
  onEnterChannel,
  onCreateChannel,
}) => {
  // Get data from stores using selectors for optimal re-renders
  const rooms = useRoomStore((state) => state.rooms)
  const isLoadingRooms = useRoomStore((state) => state.isLoading)
  const roomsError = useRoomStore((state) => state.error)
  const fetchRooms = useRoomStore((state) => state.fetchRooms)

  const currentUser = useAuthStore((state) => state.currentUser)
  const isLoadingUser = useAuthStore((state) => state.isLoading)
  const fetchUserInfo = useAuthStore((state) => state.fetchUserInfo)

  // Fetch data on mount
  useEffect(() => {
    fetchRooms()
    if (!currentUser) {
      fetchUserInfo()
    }
  }, [fetchRooms, fetchUserInfo, currentUser])

  // Calculate statistics from actual data
  const statistics = useMemo(() => {
    const activeRooms = rooms.filter((room) => room.participantCount > 0)
    const totalParticipants = rooms.reduce((sum, room) => sum + room.participantCount, 0)

    return {
      totalRooms: rooms.length,
      activeRooms: activeRooms.length,
      totalParticipants,
    }
  }, [rooms])

  // Convert rooms to channels for display
  const displayChannels = useMemo(() => {
    if (propChannels.length > 0) {
      return propChannels
    }
    // Show recent rooms (limit to 6 for display)
    return rooms.slice(0, 6).map(roomToChannel)
  }, [propChannels, rooms])

  // Determine loading state
  const isLoading = isLoadingRooms || isLoadingUser
  const hasError = roomsError !== null

  // Handle retry
  const handleRetry = () => {
    fetchRooms()
  }

  // Get user display name
  const userDisplayName = currentUser?.username || '用户'
  const userInitial = userDisplayName.charAt(0).toUpperCase()

  return (
    <div className="flex h-screen bg-[var(--color-bg-secondary)] animate-fade-in will-change-[opacity]">
      {/* Sidebar */}
      <div className={cn(
        'w-64 bg-[var(--color-bg-base)]',
        'border-r border-[var(--color-border)]',
        'flex flex-col transition-colors duration-200'
      )}>
        {/* Logo */}
        <div className="p-6 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl',
              'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)]',
              'flex items-center justify-center',
              'text-white font-bold text-lg',
              'shadow-lg shadow-[var(--color-primary)]/30'
            )}>
              M
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--color-text-normal)]">Macto</h1>
              <Text type="secondary" className="text-xs text-[var(--color-text-muted)]">语音 & 屏幕</Text>
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
              'bg-[var(--color-primary)]/10',
              'text-[var(--color-primary)]',
              'hover:bg-[var(--color-primary)]/20',
              'transition-[background-color,color] duration-150'
            )}
          >
            频道列表
          </Button>
          <Button
            type="text"
            block
            icon={<AudioOutlined />}
            className={cn(
              'w-full justify-start rounded-xl',
              'text-[var(--color-text-muted)]',
              'hover:bg-[var(--color-bg-tertiary)]',
              'transition-[background-color,color] duration-150'
            )}
          >
            语音频道
          </Button>
          <Button
            type="text"
            block
            icon={<VideoCameraOutlined />}
            className={cn(
              'w-full justify-start rounded-xl',
              'text-[var(--color-text-muted)]',
              'hover:bg-[var(--color-bg-tertiary)]',
              'transition-[background-color,color] duration-150'
            )}
          >
            屏幕分享
          </Button>
          <Button
            type="text"
            block
            icon={<SettingOutlined />}
            className={cn(
              'w-full justify-start rounded-xl',
              'text-[var(--color-text-muted)]',
              'hover:bg-[var(--color-bg-tertiary)]',
              'transition-[background-color,color] duration-150'
            )}
          >
            设置
          </Button>
        </div>

        {/* User */}
        <div className="p-4 border-t border-[var(--color-border)]">
          <div className={cn(
            'flex items-center gap-3 px-3 py-3 rounded-xl',
            'hover:bg-[var(--color-bg-tertiary)]',
            'transition-colors cursor-pointer'
          )}>
            {isLoadingUser ? (
              <Skeleton variant="circular" width={32} height={32} />
            ) : (
              <div className={cn(
                'w-8 h-8 rounded-full',
                'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)]',
                'flex items-center justify-center',
                'text-white text-xs font-bold'
              )}>
                {userInitial}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {isLoadingUser ? (
                <div className="space-y-1">
                  <Skeleton variant="text" width={60} height={14} />
                  <Skeleton variant="text" width={40} height={12} />
                </div>
              ) : (
                <>
                  <div className="text-sm font-medium text-[var(--color-text-normal)] truncate">
                    {userDisplayName}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] truncate">
                    {currentUser?.customStatus || '在线'}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className={cn(
          'h-16 bg-[var(--color-bg-base)]/80',
          'backdrop-blur-md',
          'border-b border-[var(--color-border)]',
          'flex items-center justify-between px-6',
          'sticky top-0 z-10',
          'transition-colors duration-200'
        )}>
          <h1 className="text-2xl font-bold text-[var(--color-text-normal)]">首页</h1>
          <div className="flex items-center gap-4">
            <div className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full',
              'bg-[var(--color-online)]/10',
              'text-[var(--color-online)]',
              'text-sm font-medium'
            )}>
              <span className="w-2 h-2 bg-[var(--color-online)] rounded-full animate-pulse" />
              在线
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            {/* Welcome */}
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="mb-8"
            >
              <h2 className="text-3xl font-bold text-[var(--color-text-normal)] mb-3">
                欢迎使用 Macto
              </h2>
              <p className="text-lg text-[var(--color-text-muted)]">
                开始您的语音和屏幕分享体验
              </p>
            </motion.div>

            {/* Error State */}
            <AnimatePresence>
              {hasError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    'mb-6 p-4 rounded-xl',
                    'bg-[var(--color-dnd)]/10',
                    'border border-[var(--color-dnd)]/20',
                    'flex items-center justify-between'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-[var(--color-dnd)]">
                      <TeamOutlined />
                    </div>
                    <div>
                      <div className="font-medium text-[var(--color-text-normal)]">加载失败</div>
                      <div className="text-sm text-[var(--color-text-muted)]">{roomsError}</div>
                    </div>
                  </div>
                  <Button
                    type="text"
                    icon={<ReloadOutlined />}
                    onClick={handleRetry}
                    className="text-[var(--color-dnd)] hover:bg-[var(--color-dnd)]/10"
                  >
                    重试
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Statistics */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <Row gutter={[24, 24]} className="mb-10">
                <Col xs={24} sm={12} lg={8}>
                  <StatCard
                    title="频道"
                    subtitle="所有频道"
                    value={statistics.totalRooms}
                    valueLabel={`${statistics.activeRooms} 个活跃频道`}
                    icon={<TeamOutlined className="text-2xl" />}
                    borderColor="border-t-[var(--color-primary)]"
                    iconBgColor="bg-[var(--color-primary)]/10"
                    iconTextColor="text-[var(--color-primary)]"
                    isLoading={isLoading}
                  />
                </Col>

                <Col xs={24} sm={12} lg={8}>
                  <StatCard
                    title="参与者"
                    subtitle="当前在线"
                    value={statistics.totalParticipants}
                    valueLabel={`${statistics.totalParticipants} 人在线`}
                    icon={<TeamOutlined className="text-2xl" />}
                    borderColor="border-t-[var(--color-accent)]"
                    iconBgColor="bg-[var(--color-accent)]/10"
                    iconTextColor="text-[var(--color-accent)]"
                    isLoading={isLoading}
                  />
                </Col>

                <Col xs={24} sm={12} lg={8}>
                  <StatCard
                    title="状态"
                    subtitle="应用状态"
                    value="100%"
                    valueLabel="系统正常运行"
                    icon={<TeamOutlined className="text-2xl" />}
                    borderColor="border-t-[var(--color-online)]"
                    iconBgColor="bg-[var(--color-online)]/10"
                    iconTextColor="text-[var(--color-online)]"
                    isLoading={false}
                  />
                </Col>
              </Row>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
            >
              <Card
                className={cn(
                  'rounded-2xl border-t-4 border-t-[var(--color-primary)]',
                  'hover:shadow-xl hover:-translate-y-1',
                  'transition-[transform,box-shadow,border-color] duration-200'
                )}
                styles={{ body: { padding: '32px' } }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className={cn(
                    'w-10 h-10 rounded-xl',
                    'bg-[var(--color-primary)]/10',
                    'flex items-center justify-center',
                    'text-[var(--color-primary)]'
                  )}>
                    <TeamOutlined className="text-xl" />
                  </div>
                  <div>
                    <Title level={5} className="mb-0 text-[var(--color-text-normal)]">快速开始</Title>
                    <Text type="secondary" className="text-sm text-[var(--color-text-muted)]">开始使用 Macto</Text>
                  </div>
                </div>
                <Space size="large">
                  <Button
                    type="primary"
                    size="large"
                    onClick={onEnterChannel}
                    className="px-8 rounded-xl font-semibold"
                    icon={<RightOutlined />}
                  >
                    进入频道
                  </Button>
                  <Button
                    size="large"
                    onClick={onCreateChannel}
                    className="px-8 rounded-xl font-semibold"
                    icon={<PlusOutlined />}
                  >
                    创建频道
                  </Button>
                </Space>
              </Card>
            </motion.div>

            {/* Recent Channels */}
            <div className="mt-10">
              {isLoading ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <Skeleton variant="text" width={120} height={24} />
                      <Skeleton variant="text" width={200} height={16} className="mt-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          'p-4 rounded-xl',
                          'bg-[var(--color-bg-base)]',
                          'border border-[var(--color-border)]'
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <Skeleton variant="rounded" width={40} height={40} />
                          <div className="flex-1 space-y-2">
                            <Skeleton variant="text" width={100} height={16} />
                            <Skeleton variant="text" width={60} height={12} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : displayChannels.length > 0 ? (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-[var(--color-text-normal)]">最近频道</h3>
                      <Text type="secondary" className="text-sm text-[var(--color-text-muted)]">
                        快速访问您最近使用的频道
                      </Text>
                    </div>
                    <Button
                      type="text"
                      onClick={onEnterChannel}
                      className="text-[var(--color-primary)] font-medium"
                    >
                      查看全部
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayChannels.map((channel) => (
                      <motion.div
                        key={channel.id}
                        variants={itemVariants}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onEnterChannel}
                        className={cn(
                          'group flex items-center gap-4 p-4 rounded-xl',
                          'bg-[var(--color-bg-base)]',
                          'border border-[var(--color-border)]',
                          'hover:border-[var(--color-primary)]',
                          'hover:shadow-lg',
                          'transition-all duration-200 cursor-pointer'
                        )}
                      >
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center',
                          channel.type === 'voice'
                            ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                            : channel.type === 'video'
                              ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                              : 'bg-[var(--color-online)]/10 text-[var(--color-online)]'
                        )}>
                          {channel.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={cn(
                            'font-semibold truncate',
                            'text-[var(--color-text-normal)]',
                            'group-hover:text-[var(--color-primary)]',
                            'transition-colors'
                          )}>
                            {channel.name}
                          </div>
                          <div className="text-xs text-[var(--color-text-muted)] capitalize">
                            {channel.type === 'voice' ? '语音频道' : channel.type === 'video' ? '视频频道' : '会议'}
                          </div>
                        </div>
                        {channel.unread && channel.unread > 0 && (
                          <div className={cn(
                            'w-6 h-6 rounded-full',
                            'bg-[var(--color-dnd)] text-white',
                            'flex items-center justify-center',
                            'text-xs font-bold'
                          )}>
                            {channel.unread}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <EmptyState
                  iconType="compass"
                  title="还没有频道"
                  description="创建一个新频道或加入已有频道，开始与好友交流"
                  action={onCreateChannel ? {
                    label: '创建频道',
                    onClick: onCreateChannel,
                    icon: <PlusOutlined />,
                    variant: 'primary',
                  } : undefined}
                  size="sm"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomeView
