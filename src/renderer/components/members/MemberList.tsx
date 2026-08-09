import { useEffect, useMemo, useState, useCallback } from 'react'
import { Avatar, Dropdown, message, Tooltip } from 'antd'
import type { MenuProps } from 'antd'
import { UserOutlined, MessageOutlined, UserDeleteOutlined, CrownOutlined, CopyOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'
import { useServerStore } from '@renderer/stores/serverStore'
import { useAuthStore } from '@renderer/stores/authStore'
import { authService } from '@renderer/services'
import { EmptyMembers } from '@renderer/components/ui/EmptyState'
import { SkeletonMember } from '@renderer/components/ui/Skeleton'
import { Modal } from '@renderer/components/ui/Modal'
import type { ServerMember } from '@shared/types/server'
import type { UserInfoResponse } from '@shared/types/auth'

export function MemberList() {
  const { currentServerId, members, fetchMembers } = useServerStore()
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
      const userInfo = await authService.getUserInfoById(member.userId)
      setProfileData(userInfo)
    } catch (err) {
      console.error('Failed to fetch user profile:', err)
      setProfileData(null)
    } finally {
      setProfileLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!currentServerId) return

    setLoading(true)
    fetchMembers(currentServerId)
      .catch(err => console.error('Failed to fetch members:', err))
      .finally(() => setLoading(false))
  }, [currentServerId, fetchMembers])

  // Group members by role
  const roleGroups = useMemo(() => {
    const groups: { [key: string]: ServerMember[] } = {}
    const ownerMembers: ServerMember[] = []
    const regularMembers: ServerMember[] = []

    members.forEach(member => {
      if (member.isOwner) {
        ownerMembers.push(member)
      } else if (member.roles.length > 0) {
        const roleName = member.roles[0].name
        if (!groups[roleName]) groups[roleName] = []
        groups[roleName].push(member)
      } else {
        regularMembers.push(member)
      }
    })

    const result: { [key: string]: ServerMember[] } = {}
    if (ownerMembers.length > 0) result['房主'] = ownerMembers
    Object.entries(groups).forEach(([name, group]) => {
      result[name] = group
    })
    if (regularMembers.length > 0) result['成员'] = regularMembers

    return result
  }, [members])

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

  if (!currentServerId || members.length === 0) {
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
        {Object.entries(roleGroups).map(([roleName, groupMembers]) => (
          <MemberCategory
            key={roleName}
            title={roleName}
            members={groupMembers}
            onOpenProfile={handleOpenProfile}
          />
        ))}
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
  onOpenProfile: (member: ServerMember) => void
}

function MemberCategory({ title, members, onOpenProfile }: MemberCategoryProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="mb-4">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "w-full flex items-center gap-1 px-2 py-1.5 text-xs font-semibold uppercase tracking-wide",
          "text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)]"
        )}
      >
        <svg className={cn("w-3 h-3 transition-transform", collapsed && "-rotate-90")} viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5H7z" /></svg>
        <span className="flex-1 text-left">{title}</span>
        <span className="text-[var(--color-text-muted)]">{members.length}</span>
      </button>
      {!collapsed && (
        <div className="space-y-0.5 mt-1">
          {members.map(member => (
            <MemberItem
              key={member.id}
              member={member}
              onOpenProfile={onOpenProfile}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface MemberItemProps {
  member: ServerMember
  onOpenProfile: (member: ServerMember) => void
}

function MemberItem({ member, onOpenProfile }: MemberItemProps) {
  const { currentServerId, kickMember } = useServerStore()
  const { currentUser } = useAuthStore()
  const [kickLoading, setKickLoading] = useState(false)

  const avatarSrc = member.avatarUrl || undefined
  const isSelf = member.userId === currentUser?.id

  const handleViewProfile = useCallback(() => {
    onOpenProfile(member)
  }, [member, onOpenProfile])

  const handleSendMessage = useCallback(() => {
    navigator.clipboard.writeText(member.username)
    message.success(`已复制用户名: ${member.username}`)
  }, [member.username])

  const handleKick = useCallback(async () => {
    if (!currentServerId) return

    setKickLoading(true)
    try {
      await kickMember(currentServerId, member.userId)
      message.success(`已将 ${member.nickname || member.username} 移出服务器`)
    } catch (_err) {
      message.info('踢出功能开发中，后端 API 尚未实现')
    } finally {
      setKickLoading(false)
    }
  }, [currentServerId, member.userId, member.nickname, member.username, kickMember])

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
    ]

    if (!isSelf && !member.isOwner) {
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
    }

    return items
  }, [handleViewProfile, handleSendMessage, handleKick, isSelf, member.isOwner, kickLoading])

  const displayName = member.nickname || member.username

  return (
    <Dropdown
      menu={{ items: menuItems }}
      trigger={['contextMenu']}
      styles={{ root: { zIndex: 1500 } }}
    >
      <button
        className={cn(
          "w-full flex items-center gap-3 px-2 py-1.5 rounded",
          "hover:bg-[var(--color-bg-darker)] transition-colors"
        )}
      >
        <div className="relative flex-shrink-0">
          <Avatar
            size={32}
            src={avatarSrc}
            className="bg-gradient-to-br from-[var(--color-avatar-gradient-start)] to-[var(--color-avatar-gradient-end)]"
          >
            {member.username.charAt(0).toUpperCase()}
          </Avatar>
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1">
            <div className="text-sm font-medium truncate text-[var(--color-text-normal)]">
              {displayName}
            </div>
            {member.isOwner && (
              <Tooltip title="房主">
                <CrownOutlined className="text-xs text-[var(--color-idle)]" />
              </Tooltip>
            )}
            {member.roles.some(r => r.name === 'admin' || r.name === '管理员') && !member.isOwner && (
              <Tooltip title="管理员">
                <CrownOutlined className="text-xs text-[var(--color-primary)]" />
              </Tooltip>
            )}
          </div>
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

  const displayName = profileData?.username || member.nickname || member.username
  const avatarUrl = profileData?.avatarUrl || member.avatarUrl
  const email = profileData?.email
  const createdAt = profileData?.createdAt || member.joinedAt
  const customStatus = profileData?.customStatus

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
                src={avatarUrl || undefined}
                className="bg-gradient-to-br from-[var(--color-avatar-gradient-start)] to-[var(--color-avatar-gradient-end)]"
              >
                {displayName.charAt(0).toUpperCase()}
              </Avatar>
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
              </div>
              {customStatus && (
                <p className="text-sm text-[var(--color-text-muted)]">{customStatus}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">用户名</p>
              <p className="text-sm text-[var(--color-text-normal)]">{member.username}</p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">角色</p>
              <p className="text-sm text-[var(--color-text-normal)]">
                {member.roles.length > 0 ? member.roles.map(r => r.name).join(', ') : '普通成员'}
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
        </div>
      )}
    </Modal>
  )
}
