import { useEffect, useMemo, useState } from 'react'
import { Avatar, Dropdown } from 'antd'
import { cn } from '@renderer/utils/cn'
import { useServerStore } from '@renderer/stores/serverStore'
import { roomService } from '@renderer/services'
import type { ParticipantResponse } from '@shared/types/api'
import type { ServerMember } from '@shared/types/kook'

// Convert API participant to local member format
function participantToMember(p: ParticipantResponse): ServerMember {
  return {
    id: `${p.userId}`,
    serverId: '',
    userId: String(p.userId),
    user: {
      id: String(p.userId),
      name: p.username,
      displayName: p.username,
      avatar: p.avatarUrl,
      status: 'online',
    },
    nickname: undefined,
    roles: p.role === 1 ? ['房主'] : p.role === 2 ? ['管理员'] : [],
    joinedAt: new Date(p.joinedAt).getTime(),
    isOwner: p.role === 1,
  }
}

export function MemberList() {
  const { currentServerId, members, setMembers } = useServerStore()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchMembers = async () => {
      if (!currentServerId) return

      // Check if we already have members for this server
      if (members.has(currentServerId)) return

      setLoading(true)
      try {
        // currentServerId is the room ID
        const participants = await roomService.getRoomParticipants(Number(currentServerId))
        const convertedMembers = participants.map(participantToMember)
        setMembers(currentServerId, convertedMembers)
      } catch (err) {
        console.error('Failed to fetch participants:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMembers()
  }, [currentServerId, members, setMembers])

  const serverMembers = currentServerId ? members.get(currentServerId) || [] : []
  const onlineMembers = serverMembers.filter(m => m.user.status !== 'offline')
  const offlineMembers = serverMembers.filter(m => m.user.status === 'offline')

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
      <div className="w-[240px] bg-[var(--color-bg-secondary)] flex items-center justify-center h-full flex-shrink-0">
        <div className="text-[var(--color-text-muted)]">加载中...</div>
      </div>
    )
  }

  return (
    <div className="w-[240px] bg-[var(--color-bg-secondary)] flex flex-col h-full flex-shrink-0">
      <div className="flex-1 overflow-y-auto px-2 py-4 scrollbar-thin">
        {Object.entries(roleGroups).map(([roleName, members]) => (
          <MemberCategory key={roleName} title={roleName} members={members} />
        ))}
        {offlineMembers.length > 0 && <MemberCategory title="离线" members={offlineMembers} isOffline />}
      </div>
    </div>
  )
}

interface MemberCategoryProps {
  title: string
  members: ServerMember[]
  isOffline?: boolean
}

function MemberCategory({ title, members, isOffline }: MemberCategoryProps) {
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
          {members.map(member => <MemberItem key={member.id} member={member} isOffline={isOffline} />)}
        </div>
      )}
    </div>
  )
}

interface MemberItemProps {
  member: ServerMember
  isOffline?: boolean
}

function MemberItem({ member, isOffline }: MemberItemProps) {
  const statusColors: Record<string, string> = { online: 'bg-[var(--color-online)]', idle: 'bg-[var(--color-idle)]', dnd: 'bg-[var(--color-dnd)]', offline: 'bg-gray-500' }
  const avatarSrc = member.user.avatar || undefined

  return (
    <Dropdown menu={{ items: [{ key: 'profile', label: '查看资料' }, { key: 'message', label: '发送消息' }] }} trigger={['contextMenu']}>
      <button className={cn("w-full flex items-center gap-3 px-2 py-1.5 rounded hover:bg-[var(--color-bg-darker)] transition-colors", isOffline && "opacity-50")}>
        <div className="relative flex-shrink-0">
          <Avatar size={32} src={avatarSrc} className="bg-gradient-to-br from-blue-500 to-purple-600">
            {member.user.name.charAt(0).toUpperCase()}
          </Avatar>
          <span className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--color-bg-secondary)]", statusColors[member.user.status])} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className={cn("text-sm font-medium truncate", isOffline ? "text-[var(--color-text-muted)]" : "text-[var(--color-text-normal)]")}>{member.nickname || member.user.displayName || member.user.name}</div>
          {member.user.customStatus && !isOffline && <div className="text-xs text-[var(--color-text-muted)] truncate">{member.user.customStatus}</div>}
        </div>
      </button>
    </Dropdown>
  )
}
