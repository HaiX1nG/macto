import { useState } from 'react'
import { Dropdown, Avatar } from 'antd'
import { AudioOutlined, AudioMutedOutlined, SoundOutlined, SettingOutlined, EditOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'
import { useAuthStore } from '@renderer/stores/authStore'
import { useUserStore } from '@renderer/stores/userStore'
import { SettingsModal } from './SettingsModal'

export function UserPanel() {
  const { currentUser } = useAuthStore()
  const { status, setStatus } = useUserStore()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const [isMuted, setIsMuted] = useState(false)
  const [isDeafened, setIsDeafened] = useState(false)

  const statusMenuItems = [
    { key: 'online', label: <div className="flex items-center gap-3 py-1"><span className="w-3 h-3 rounded-full bg-[var(--color-online)]" /><span>在线</span></div>, onClick: () => setStatus('online') },
    { key: 'idle', label: <div className="flex items-center gap-3 py-1"><span className="w-3 h-3 rounded-full bg-[var(--color-idle)]" /><span>空闲</span></div>, onClick: () => setStatus('idle') },
    { key: 'dnd', label: <div className="flex items-center gap-3 py-1"><span className="w-3 h-3 rounded-full bg-[var(--color-dnd)]" /><span>请勿打扰</span></div>, onClick: () => setStatus('dnd') },
    { key: 'offline', label: <div className="flex items-center gap-3 py-1"><span className="w-3 h-3 rounded-full bg-gray-500" /><span>隐身</span></div>, onClick: () => setStatus('offline') },
    { type: 'divider' as const },
    { key: 'custom', label: <div className="flex items-center gap-3 py-1"><EditOutlined className="text-[var(--color-text-muted)]" /><span>设置自定义状态</span></div> }
  ]

  const statusColors: Record<string, string> = {
    online: 'bg-[var(--color-online)]',
    idle: 'bg-[var(--color-idle)]',
    dnd: 'bg-[var(--color-dnd)]',
    offline: 'bg-gray-500'
  }

  // Use currentUser from authStore
  const displayName = currentUser?.username || '用户'
  const avatar = currentUser?.avatarUrl || undefined

  return (
    <>
      <div className="h-[52px] bg-[var(--color-bg-darker)] px-2 flex items-center gap-2 flex-shrink-0">
        <Dropdown menu={{ items: statusMenuItems }} trigger={['click']} placement="topLeft">
          <div className="relative cursor-pointer flex-shrink-0">
            <Avatar size={32} src={avatar} className="bg-gradient-to-br from-blue-500 to-purple-600">
              {displayName.charAt(0).toUpperCase()}
            </Avatar>
            <span className={cn("absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[var(--color-bg-darker)]", statusColors[status])} />
          </div>
        </Dropdown>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-[var(--color-text-normal)] truncate">{displayName}</div>
          <div className="text-xs text-[var(--color-text-muted)] truncate">{status === 'online' ? '在线' : status === 'idle' ? '空闲' : status === 'dnd' ? '请勿打扰' : '离线'}</div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => setIsMuted(!isMuted)} className={cn("w-8 h-8 rounded flex items-center justify-center hover:bg-[var(--color-bg-tertiary)]", isMuted ? "text-[var(--color-dnd)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)]")}>
            {isMuted ? <AudioMutedOutlined /> : <AudioOutlined />}
          </button>
          <button onClick={() => setIsDeafened(!isDeafened)} className={cn("w-8 h-8 rounded flex items-center justify-center hover:bg-[var(--color-bg-tertiary)]", isDeafened ? "text-[var(--color-dnd)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)]")}>
            <SoundOutlined />
          </button>
          <button onClick={() => setSettingsOpen(true)} className="w-8 h-8 rounded flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)] hover:bg-[var(--color-bg-tertiary)]">
            <SettingOutlined />
          </button>
        </div>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}