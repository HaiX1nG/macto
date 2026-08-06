import { useEffect, useMemo, useState, useCallback } from 'react'
import { Avatar, Dropdown, message, Tooltip } from 'antd'
import type { MenuProps } from 'antd'
import { UserOutlined, MessageOutlined, AudioMutedOutlined, UserDeleteOutlined, CrownOutlined, CopyOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'
import { useRoomStore } from '@renderer/stores/serverStore'
import { useAuthStore } from '@renderer/stores/authStore'
import { roomService, authService } from '@renderer/services'
import { EmptyMembers } from '@renderer/components/ui/EmptyState'
import { SkeletonMember } from '@renderer/components/ui/Skeleton'
import { Modal } from '@renderer/components/ui/Modal'
import type { ParticipantResponse, UserOnlineStatusResponse, UserInfoResponse } from '@shared/types/api'
import type { ServerMember, UserStatus } from '@shared/types/kook'

const mutedMembers = new Set<string>()

function isMemberMuted(userId: string): boolean {
  return mutedMembers.has(userId)
}

function toggleMemberMute(userId: string): boolean {
  if (mutedMembers.has(userId)) {
    mutedMembers.delete(userId)
    return false
  } else {
    mutedMembers.add(userId)
    return true
  }
}

function participantToMember(p: ParticipantResponse, status?: UserOnlineStatusResponse): ServerMember {
  let userStatus: UserStatus = 'online'
  let customStatus = ''

  if (status) {
    customStatus = status.customStatus || ''
    if (!status.isOnline) {
      userStatus = 'offline'
    } else if (customStatus === '空闲') {
      userStatus = 'idle'
    } else if (customStatus === '请勿打扰') {
      userStatus = 'dnd'
    } else if (customStatus === '隐身') {
      userStatus = 'offline'
    }
  }

  return {
    id: `${p.userId}`,
    serverId: '',
    userId: String(p.userId),
    user: {
      id: String(p.userId),
      name: p.username,
      displayName: p.username,
      avatar: p.avatarUrl,
      status: userStatus,
      customStatus: customStatus,
    },
    nickname: undefined,
    roles: p.role === 1 ? ['房主'] : p.role === 2 ? ['管理员'] : [],
    joinedAt: new Date(p.joinedAt).getTime(),
    isOwner: p.role === 1,
  }
}

export function MemberList() {
  const { currentRoomId, serverMembers, getServerMembers, setServerMembers } = useRoomStore()
  const [loading, setLoading] = useState(false)
  const [profileMember, setProfileMember] = useState<ServerMember | null>(null)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileData, setProfileData] = useState<UserInfoResponse | null>(null)

  const handleOpenProfile = useCallback(async (member: ServerMember) => {
    setProfileMember(member)
    setProfileModalOpen(true)
    setProfileLoading(true)

    try {
      const userInfo = await authService.getUserInfoById(Number(member.userId))
      setProfileData(userInfo)
    } catch (err) {
      console.error('Failed to fetch user profile:', err)
      setProfileData(null)
    } finally {
      setProfileLoading(false)
    }
  }, [])

  useEffect(() => {
    const fetchMembers = async () => {
      if (!currentRoomId) return

      if (serverMembers.length > 0) return

      setLoading(true)
      try {
        const participants = await roomService.getRoomParticipants(Number(currentRoomId))

        const statusPromises = participants.map(p =>
          authService.getUserOnlineStatus(p.userId).catch(() => null)
        )
        const statuses = await Promise.all(statusPromises)

        const convertedMembers = participants.map((p, i) =>
          participantToMember(p, statuses[i] || undefined)
        )
        setServerMembers(convertedMembers)
      } catch (err) {
        console.error('Failed to fetch participants:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMembers()
  }, [currentRoomId, serverMembers, setServerMembers])

  useEffect(() => {
    if (!currentRoomId) return

    const pollStatus = async () => {
      const roomMembers = getServerMembers(currentRoomId)
      if (!roomMembers || roomMembers.length === 0) return

      try {
        const statusPromises = roomMembers.map(m =>
          authService.getUserOnlineStatus(Number(m.userId)).catch(() => null)
        )
        const statuses = await Promise.all(statusPromises)

        const updatedMembers = roomMembers.map((m, i) => {
          const status = statuses[i]
          if (!status) return m

          let userStatus: UserStatus = 'online'
          const customStatus = status.customStatus || ''

          if (!status.isOnline) {
            userStatus = 'offline'
          } else if (customStatus === '空闲') {
            userStatus = 'idle'
          } else if (customStatus === '请勿打扰') {
            userStatus = 'dnd'
          } else if (customStatus === '隐身') {
            userStatus = 'offline'
          }

          return {
            ...m,
            user: {
              ...m.user,
              status: userStatus,
              customStatus: customStatus,
            }
          }
        })

        setServerMembers(updatedMembers)
      } catch (err) {
        console.error('Failed to poll member status:', err)
      }
    }

    const interval = setInterval(pollStatus, 30000)
    return () => clearInterval(interval)
  }, [currentRoomId, getServerMembers, setServerMembers])

  const roomMembers = currentRoomId ? getServerMembers(currentRoomId) : []
  const onlineMembers = roomMembers.filter(m => m.user.status !== 'offline')
  const offlineMembers = roomMembers.filter(m => m.user.status === 'offline')

  const roleGroups = useMemo(() => {
    const groups: { [key: string]: ServerMember[] } = {}
    onlineMembers.forEach(member => {
      const roleName = member.roles[0] || '成员'
      if (!groups[roleName]) groups[roleName] = []
      groups[roleName].push(member)
    })
    return groups
  }, [onlineMembers])

  if (loading) {
    return (
      <div className="w-[240px] bg-[var(--color-bg-secondary)] border-l border-[var(--color-border)] flex flex-col h-full flex-shrink-0">
        <div className="flex-1 overflow-hidden px-2 py-4 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonMember key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (!currentRoomId || roomMembers.length === 0) {
    return (
      <div className="w-[240px] bg-[var(--color-bg-secondary)] border-l border-[var(--color-border)] flex flex-col h-full flex-shrink-0">
        <div className="flex-1 flex items-center justify-center">
          <EmptyMembers />
        </div>
      </div>
    )
  }

  return (
    <div className="w-[240px] bg-[var(--color-bg-secondary)] border-l border-[var(--color-border)] flex flex-col h-full flex-shrink-0">
      <div className="flex-1 overflow-y-auto px-2 py-4 scrollbar-thin">
        {Object.entries(roleGroups).map(([roleName, members]) => (
          <MemberCategory key={roleName} title={roleName} members={members} onOpenProfile={handleOpenProfile} />
        ))}
        {offlineMembers.length > 0 && (
          <MemberCategory title="离线" members={offlineMembers} isOffline onOpenProfile={handleOpenProfile} />
        )}
      </div>

      <UserProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        member={profileMember}
        profileData={profileData}
        loading={profileLoading}
      />
    </div>
  )
}

interface MemberCategoryProps {
  title: string
  members: ServerMember[]
  isOffline?: boolean
  onOpenProfile: (member: ServerMember) => void
}

function MemberCategory({ title, members, isOffline, onOpenProfile }: MemberCategoryProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="mb-4">
      <button onClick={() => setCollapsed(!collapsed)} className={cn("w-full flex items-center gap-1 px-2 py-1.5 text-xs font-semibold uppercase tracking-wide", isOffline ? "text-[var(--color-text-muted)]" : "text-[var(--color-text-muted)]", "hover:text-[var(--color-text-normal)]")}>
        <svg className={cn("w-3 h-3 transition-transform", collapsed && "-rotate-90")} viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5H7z" /></svg>
        <span className="flex-1 text-left">{title}</span>
        <span className="text-[var(--color-text-muted)]">{members.length}</span>
      </button>
      {!collapsed && (
        <div className="space-y-0.5 mt-1">
          {members.map(member => <MemberItem key={member.id} member={member} isOffline={isOffline} onOpenProfile={onOpenProfile} />)}
        </div>
      )}
    </div>
  )
}

interface MemberItemProps {
  member: ServerMember
  isOffline?: boolean
  onOpenProfile: (member: ServerMember) => void
}

function MemberItem({ member, isOffline, onOpenProfile }: MemberItemProps) {
  const { currentRoomId, getServerMembers, removeServerMember: removeMember } = useRoomStore()
  const { currentUser } = useAuthStore()
  const [isMuted, setIsMuted] = useState(() => isMemberMuted(member.userId))
  const [kickLoading, setKickLoading] = useState(false)

  const statusColors: Record<string, string> = {
    online: 'bg-[var(--color-online)]',
    idle: 'bg-[var(--color-idle)]',
    dnd: 'bg-[var(--color-dnd)]',
    offline: 'bg-[var(--color-offline)]'
  }
  const avatarSrc = member.user.avatar || undefined

  const roomMembers = currentRoomId ? getServerMembers(currentRoomId) : []
  const currentMember = roomMembers.find(m => m.userId === String(currentUser?.id))
  const canManageMembers = currentMember?.isOwner || currentMember?.roles.includes('管理员')

  const isTargetOwner = member.isOwner || member.roles.includes('房主')
  const isSelf = member.userId === String(currentUser?.id)

  const handleViewProfile = useCallback(() => {
    onOpenProfile(member)
  }, [member, onOpenProfile])

  const handleSendMessage = useCallback(() => {
    navigator.clipboard.writeText(member.user.name)
    message.success(`已复制用户名: ${member.user.name}`)
  }, [member.user.name])

  const handleToggleMute = useCallback(() => {
    const newMutedState = toggleMemberMute(member.userId)
    setIsMuted(newMutedState)
    message.success(newMutedState ? `已静音 ${member.user.displayName || member.user.name}` : `已取消静音 ${member.user.displayName || member.user.name}`)
  }, [member.userId, member.user.displayName, member.user.name])

  const handleKick = useCallback(async () => {
    if (!currentRoomId) return

    setKickLoading(true)
    try {
      await roomService.kickParticipant(Number(currentRoomId), Number(member.userId))
      removeMember(member.userId)
      message.success(`已将 ${member.user.displayName || member.user.name} 移出房间`)
    } catch (_err) {
      message.info('踢出功能开发中，后端 API 尚未实现')
    } finally {
      setKickLoading(false)
    }
  }, [currentRoomId, member.userId, member.user.displayName, member.user.name, removeMember])

  const handleSetAdmin = useCallback(async () => {
    if (!currentRoomId) return

    try {
      await roomService.setParticipantRole(Number(currentRoomId), Number(member.userId), 2)
      message.success(`已将 ${member.user.displayName || member.user.name} 设为管理员`)
    } catch (_err) {
      message.info('设置管理员功能开发中，后端 API 尚未实现')
    }
  }, [currentRoomId, member.userId, member.user.displayName, member.user.name])

  const menuItems: MenuProps['items'] = useMemo(() => {
    const items: MenuProps['items'] = [
      {
        key: 'profile',
        label: '查看资料',
        icon: <UserOutlined />,
        onClick: handleViewProfile,
      },
      {
        key: 'message',
        label: '发送消息',
        icon: <MessageOutlined />,
        onClick: handleSendMessage,
      },
      {
        key: 'copy-name',
        label: '复制用户名',
        icon: <CopyOutlined />,
        onClick: handleSendMessage,
      },
      { type: 'divider' },
      {
        key: 'mute',
        label: isMuted ? '取消静音' : '静音',
        icon: <AudioMutedOutlined />,
        onClick: handleToggleMute,
      },
    ]

    if (canManageMembers && !isSelf && !isTargetOwner) {
      items.push(
        { type: 'divider' },
        {
          key: 'kick',
          label: (
            <span className="text-[var(--color-dnd)]">
              {kickLoading ? '移出中...' : '踢出'}
            </span>
          ),
          icon: <UserDeleteOutlined className="text-[var(--color-dnd)]" />,
          onClick: handleKick,
          disabled: kickLoading,
        }
      )

      if (!member.roles.includes('管理员')) {
        items.push({
          key: 'set-admin',
          label: '设为管理员',
          icon: <CrownOutlined />,
          onClick: handleSetAdmin,
        })
      }
    }

    return items
  }, [
    handleViewProfile,
    handleSendMessage,
    handleToggleMute,
    handleKick,
    handleSetAdmin,
    isMuted,
    canManageMembers,
    isSelf,
    isTargetOwner,
    kickLoading,
    member.roles,
  ])

  return (
    <Dropdown
      menu={{ items: menuItems }}
      trigger={['contextMenu']}
      styles={{ root: { zIndex: 1500 } }}
    >
      <button
        className={cn(
          "w-full flex items-center gap-3 px-2 py-1.5 rounded",
          "hover:bg-[var(--color-bg-darker)] transition-colors",
          isOffline && "opacity-50",
          isMuted && "opacity-60"
        )}
      >
        <div className="relative flex-shrink-0">
          <Avatar
            size={32}
            src={avatarSrc}
            className="bg-gradient-to-br from-[var(--color-avatar-gradient-start)] to-[var(--color-avatar-gradient-end)]"
          >
            {member.user.name.charAt(0).toUpperCase()}
          </Avatar>
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full",
              "border-2 border-[var(--color-bg-secondary)]",
              statusColors[member.user.status]
            )}
          />
          {isMuted && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center">
              <AudioMutedOutlined className="text-[10px] text-[var(--color-text-muted)]" />
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1">
            <div
              className={cn(
                "text-sm font-medium truncate",
                isOffline ? "text-[var(--color-text-muted)]" : "text-[var(--color-text-normal)]"
              )}
            >
              {member.nickname || member.user.displayName || member.user.name}
            </div>
            {member.isOwner && (
              <Tooltip title="房主">
                <CrownOutlined className="text-xs text-[var(--color-idle)]" />
              </Tooltip>
            )}
            {member.roles.includes('管理员') && !member.isOwner && (
              <Tooltip title="管理员">
                <CrownOutlined className="text-xs text-[var(--color-primary)]" />
              </Tooltip>
            )}
          </div>
          {member.user.customStatus && !isOffline && (
            <div className="text-xs text-[var(--color-text-muted)] truncate">
              {member.user.customStatus}
            </div>
          )}
        </div>
      </button>
    </Dropdown>
  )
}

interface UserProfileModalProps {
  open: boolean
  onClose: () => void
  member: ServerMember | null
  profileData: UserInfoResponse | null
  loading: boolean
}

function UserProfileModal({ open, onClose, member, profileData, loading }: UserProfileModalProps) {
  if (!member) return null

  const displayName = profileData?.username || member.user.displayName || member.user.name
  const avatarUrl = profileData?.avatarUrl || member.user.avatar
  const email = profileData?.email
  const createdAt = profileData?.createdAt || new Date(member.joinedAt).toISOString()
  const customStatus = profileData?.customStatus || member.user.customStatus

  const statusColors: Record<string, string> = {
    online: 'bg-[var(--color-online)]',
    idle: 'bg-[var(--color-idle)]',
    dnd: 'bg-[var(--color-dnd)]',
    offline: 'bg-[var(--color-offline)]'
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="用户资料"
      size="md"
    >
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar
                size={64}
                src={avatarUrl}
                className="bg-gradient-to-br from-[var(--color-avatar-gradient-start)] to-[var(--color-avatar-gradient-end)]"
              >
                {displayName.charAt(0).toUpperCase()}
              </Avatar>
              <span
                className={cn(
                  "absolute -bottom-1 -right-1 w-4 h-4 rounded-full",
                  "border-2 border-[var(--color-bg-secondary)]",
                  statusColors[member.user.status]
                )}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-[var(--color-text-normal)]">
                  {displayName}
                </h3>
                {member.isOwner && (
                  <Tooltip title="房主">
                    <CrownOutlined className="text-[var(--color-idle)]" />
                  </Tooltip>
                )}
                {member.roles.includes('管理员') && !member.isOwner && (
                  <Tooltip title="管理员">
                    <CrownOutlined className="text-[var(--color-primary)]" />
                  </Tooltip>
                )}
              </div>
              {customStatus && (
                <p className="text-sm text-[var(--color-text-muted)]">{customStatus}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">用户名</p>
              <p className="text-sm text-[var(--color-text-normal)]">{member.user.name}</p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">角色</p>
              <p className="text-sm text-[var(--color-text-normal)]">
                {member.roles.length > 0 ? member.roles.join(', ') : '普通成员'}
              </p>
            </div>
            {email && (
              <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
                <p className="text-xs text-[var(--color-text-muted)] mb-1">邮箱</p>
                <p className="text-sm text-[var(--color-text-normal)]">{email}</p>
              </div>
            )}
            <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">加入时间</p>
              <p className="text-sm text-[var(--color-text-normal)]">
                {new Date(createdAt).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">在线状态</p>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "w-3 h-3 rounded-full",
                  statusColors[member.user.status]
                )}
              />
              <p className="text-sm text-[var(--color-text-normal)]">
                {member.user.status === 'online' ? '在线' :
                 member.user.status === 'idle' ? '空闲' :
                 member.user.status === 'dnd' ? '请勿打扰' : '离线'}
              </p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}