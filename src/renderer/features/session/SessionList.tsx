import { cn } from '@renderer/utils/cn'
import { Card, Tag, Avatar } from 'antd'

export interface Session {
  id: string
  name: string
  hostId: string
  participants: number
  status: 'active' | 'completed' | 'full'
  createdAt: number
  isActive: boolean
}

interface SessionListProps {
  sessions: Session[]
  onSessionClick?: (session: Session) => void
  className?: string
}

export const SessionList = ({
  sessions,
  onSessionClick,
  className,
}: SessionListProps) => {
  if (sessions.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-16', className)}>
        <div className={cn(
          'w-20 h-20 rounded-2xl',
          'bg-[var(--color-bg-tertiary-light)] dark:bg-[var(--color-bg-tertiary-dark)]',
          'flex items-center justify-center mb-6'
        )}>
          <svg className="w-10 h-10 text-[var(--color-text-tertiary-light)] dark:text-[var(--color-text-tertiary-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)] text-lg">暂无会话</p>
        <p className="text-[var(--color-text-tertiary-light)] dark:text-[var(--color-text-tertiary-dark)] text-sm mt-2">创建一个新会话开始使用</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {sessions.map((session) => (
        <SessionItem
          key={session.id}
          session={session}
          onClick={() => onSessionClick?.(session)}
        />
      ))}
    </div>
  )
}

interface SessionItemProps {
  session: Session
  onClick?: () => void
}

const SessionItem = ({ session, onClick }: SessionItemProps) => {
  const statusConfig = {
    active: {
      color: 'success',
      label: '进行中',
      dotClass: 'bg-green-500 animate-pulse',
    },
    completed: {
      color: 'default',
      label: '已结束',
      dotClass: 'bg-gray-400',
    },
    full: {
      color: 'error',
      label: '已满员',
      dotClass: 'bg-red-500',
    },
  }

  const config = statusConfig[session.status]

  return (
    <Card
      hoverable
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-2xl',
        'border-l-4 border-l-[var(--color-primary)]',
        'hover:shadow-xl hover:-translate-y-1',
        'transition-all duration-300'
      )}
      styles={{ body: { padding: '20px' } }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Avatar
            className={cn(
              'bg-gradient-to-br from-[var(--color-primary)] to-purple-600',
              'text-white font-bold text-lg',
              'shadow-lg shadow-[var(--color-primary)]/30'
            )}
            size={52}
          >
            {session.name.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <h3 className="font-bold text-[var(--color-text-light)] dark:text-[var(--color-text-dark)] mb-1.5 text-lg">
              {session.name}
            </h3>
            <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary-light)] dark:text-[var(--color-text-secondary-dark)]">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {session.participants} 人
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {new Date(session.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn('w-2.5 h-2.5 rounded-full', config.dotClass)} />
          <Tag
            color={config.color}
            className="rounded-full px-3 py-1 font-medium"
          >
            {config.label}
          </Tag>
        </div>
      </div>
    </Card>
  )
}