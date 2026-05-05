import { useState } from 'react'
import { Tooltip, Modal, Input, App, Avatar, Dropdown, Spin, Button } from 'antd'
import { PlusOutlined, CompassOutlined, SettingOutlined, EditOutlined, DeleteOutlined, LoadingOutlined, UserOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'
import { useServerStore } from '@renderer/stores/serverStore'
import { useAuthStore } from '@renderer/stores/authStore'
import { useUserStore } from '@renderer/stores/userStore'
import { roomService } from '@renderer/services'
import { SettingsModal } from './SettingsModal'
import type { Server } from '@shared/types/kook'
import type { UserStatus } from '@shared/types/kook'
import type { RoomInfoResponse } from '@shared/types/api'

export function ServerSidebar() {
  const { servers, currentServerId, setCurrentServer, addServer, removeServer } = useServerStore()
  const { currentUser, setCustomStatus } = useAuthStore()
  const { status, setStatus } = useUserStore()
  const { message } = App.useApp()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showExploreModal, setShowExploreModal] = useState(false)
  const [showCustomStatusModal, setShowCustomStatusModal] = useState(false)
  const [customStatusText, setCustomStatusText] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [serverToDelete, setServerToDelete] = useState<Server | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [publicRooms, setPublicRooms] = useState<RoomInfoResponse[]>([])
  const [exploreLoading, setExploreLoading] = useState(false)

  const handleCreateServer = async () => {
    if (!roomName.trim()) {
      message.warning('请输入房间名称')
      return
    }
    setLoading(true)
    try {
      const room = await roomService.createRoom({ roomName: roomName.trim(), roomType: 2, isPrivate: false })
      addServer({
        id: String(room.id),
        name: room.roomName,
        icon: undefined,
        banner: undefined,
        description: undefined,
        ownerId: String(room.hostUserId),
        channels: [
          { id: String(room.id), serverId: String(room.id), name: '聊天室', type: 'text' as const, position: 0, topic: '' },
          { id: `${room.id}-voice`, serverId: String(room.id), name: '语音室', type: 'voice' as const, position: 1 },
        ],
        roles: [],
        memberCount: 1,
        createdAt: new Date(room.createdAt).getTime(),
      })
      message.success('房间创建成功')
      setShowCreateModal(false)
      setRoomName('')
    } catch (_err) {
      message.error('创建房间失败')
    } finally {
      setLoading(false)
    }
  }

  const handleExploreServers = async () => {
    setShowExploreModal(true)
    setExploreLoading(true)
    try {
      const rooms = await roomService.getPublicRooms()
      setPublicRooms(rooms)
    } catch (err) {
      console.error('Failed to fetch public rooms:', err)
      message.error('获取公开房间列表失败')
    } finally {
      setExploreLoading(false)
    }
  }

  const handleJoinPublicRoom = async (roomId: number) => {
    try {
      await roomService.joinRoom(roomId)
      message.success('已加入房间')
      // Refresh room list
      const rooms = await roomService.getRoomList()
      const newRoom = rooms.find(r => r.id === roomId)
      if (newRoom) {
        addServer({
          id: String(newRoom.id),
          name: newRoom.roomName,
          icon: undefined,
          banner: undefined,
          description: undefined,
          ownerId: String(newRoom.hostUserId),
          channels: [
            { id: String(newRoom.id), serverId: String(newRoom.id), name: '聊天室', type: 'text' as const, position: 0, topic: '' },
            { id: `${newRoom.id}-voice`, serverId: String(newRoom.id), name: '语音室', type: 'voice' as const, position: 1 },
          ],
          roles: [],
          memberCount: newRoom.participantCount,
          createdAt: new Date(newRoom.createdAt).getTime(),
        })
      }
      setShowExploreModal(false)
    } catch (err) {
      console.error('Failed to join room:', err)
      message.error('加入房间失败')
    }
  }

  const handleStatusChange = async (newStatus: UserStatus) => {
    setStatus(newStatus)
    // Map local status to backend custom status
    const statusText = newStatus === 'online' ? '' :
                       newStatus === 'idle' ? '空闲' :
                       newStatus === 'dnd' ? '请勿打扰' : '隐身'
    await setCustomStatus({ customStatus: statusText })
  }

  const handleSetCustomStatus = async () => {
    await setCustomStatus({ customStatus: customStatusText.trim() })
    setShowCustomStatusModal(false)
    setCustomStatusText('')
    message.success('自定义状态已设置')
  }

  const handleDeleteServer = (server: Server) => {
    setServerToDelete(server)
    setDeleteModalOpen(true)
  }

  const confirmDeleteServer = async () => {
    if (!serverToDelete) return

    setDeleteLoading(true)
    try {
      await roomService.deleteRoom(Number(serverToDelete.id))
      removeServer(serverToDelete.id)
      message.success('房间已删除')
      setDeleteModalOpen(false)
      setServerToDelete(null)
    } catch (err) {
      console.error('Failed to delete room:', err)
      // Try to get error message from response
      let errorMessage = '删除房间失败'
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { code?: number; message?: string } } }
        if (axiosErr.response?.data?.code === 40004) {
          errorMessage = '只有房主才能删除房间'
        } else if (axiosErr.response?.data?.message) {
          errorMessage = axiosErr.response.data.message
        }
      }
      message.error(errorMessage)
    } finally {
      setDeleteLoading(false)
    }
  }

  const statusMenuItems = [
    { key: 'online', label: <div className="flex items-center gap-3 py-1"><span className="w-3 h-3 rounded-full bg-[var(--color-online)]" /><span>在线</span></div>, onClick: () => handleStatusChange('online') },
    { key: 'idle', label: <div className="flex items-center gap-3 py-1"><span className="w-3 h-3 rounded-full bg-[var(--color-idle)]" /><span>空闲</span></div>, onClick: () => handleStatusChange('idle') },
    { key: 'dnd', label: <div className="flex items-center gap-3 py-1"><span className="w-3 h-3 rounded-full bg-[var(--color-dnd)]" /><span>请勿打扰</span></div>, onClick: () => handleStatusChange('dnd') },
    { key: 'offline', label: <div className="flex items-center gap-3 py-1"><span className="w-3 h-3 rounded-full bg-gray-500" /><span>隐身</span></div>, onClick: () => handleStatusChange('offline') },
    { type: 'divider' as const },
    { key: 'custom', label: <div className="flex items-center gap-3 py-1"><EditOutlined className="text-[var(--color-text-muted)]" /><span>设置自定义状态</span></div>, onClick: () => setShowCustomStatusModal(true) }
  ]

  const statusColors: Record<string, string> = {
    online: 'bg-[var(--color-online)]',
    idle: 'bg-[var(--color-idle)]',
    dnd: 'bg-[var(--color-dnd)]',
    offline: 'bg-gray-500'
  }

  const displayName = currentUser?.username || '用户'
  const avatar = currentUser?.avatarUrl || undefined

  return (
    <div className="w-[72px] bg-[var(--color-bg-darkest)] flex flex-col items-center py-3 gap-2 h-full flex-shrink-0">
      {/* Home Button */}
      <ServerIcon
        icon={
          <svg viewBox="0 0 28 20" className="w-7 h-5 text-white" fill="currentColor">
            <path d="M23.0212 1.67671C21.3107 0.879656 19.5079 0.318797 17.6584 0C17.4062 0.461742 17.1749 0.934541 16.9708 1.4184C15.003 1.12145 12.9974 1.12145 11.0283 1.4184C10.819 0.934541 10.589 0.461744 10.3416 0C8.49087 0.322199 6.68661 0.885653 4.97361 1.68345C1.53179 6.77853 0.559612 11.7417 1.04602 16.6309C3.04912 18.1166 5.31187 19.2137 7.72333 19.8612C8.25832 19.1384 8.73498 18.3699 9.14898 17.5624C8.37544 17.2724 7.62992 16.9089 6.92297 16.4756C7.10261 16.3474 7.27777 16.2131 7.44717 16.0745C11.7197 18.0621 16.3394 18.0621 20.5554 16.0745C20.7248 16.2131 20.8999 16.3474 21.0796 16.4756C20.3714 16.9102 19.6246 17.275 18.8497 17.5637C19.2637 18.3711 19.7403 19.1397 20.2753 19.8625C22.6881 19.2137 24.9508 18.1153 26.954 16.6309C27.5307 10.9745 26.0372 6.05798 23.0212 1.67671ZM9.68041 13.6383C8.39754 13.6383 7.34085 12.4453 7.34085 10.994C7.34085 9.54272 8.37155 8.34973 9.68041 8.34973C10.9893 8.34973 12.0455 9.54272 12.0187 10.994C12.0187 12.4453 10.9893 13.6383 9.68041 13.6383ZM18.3161 13.6383C17.0332 13.6383 15.9765 12.4453 15.9765 10.994C15.9765 9.54272 17.0072 8.34973 18.3161 8.34973C19.6249 8.34973 20.6811 9.54272 20.6544 10.994C20.6544 12.4453 19.6249 13.6383 18.3161 13.6383Z" />
          </svg>
        }
        name="首页"
        isActive={!currentServerId}
        onClick={() => setCurrentServer(null)}
      />

      {/* Divider */}
      <div className="w-8 h-[2px] bg-[var(--color-border)] rounded-full my-1" />

      {/* Server List */}
      {servers.map((server) => (
        <ServerIcon
          key={server.id}
          server={server}
          name={server.name}
          isActive={currentServerId === server.id}
          onClick={() => setCurrentServer(server.id)}
          onDelete={() => handleDeleteServer(server)}
          hasNotification={server.channels.some(c => c.unreadCount && c.unreadCount > 0)}
        />
      ))}

      {/* Add Server Button */}
      <ServerIcon
        icon={<PlusOutlined className="text-[var(--color-primary)] text-xl" />}
        name="添加服务器"
        onClick={() => setShowCreateModal(true)}
        isAction
      />

      <ServerIcon
        icon={<CompassOutlined className="text-[var(--color-primary)] text-xl" />}
        name="探索服务器"
        onClick={handleExploreServers}
        isAction
      />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings Button */}
      <ServerIcon
        icon={<SettingOutlined className="text-[var(--color-primary)] text-xl" />}
        name="设置"
        onClick={() => setSettingsOpen(true)}
        isAction
      />

      {/* User Avatar */}
      <Dropdown menu={{ items: statusMenuItems }} trigger={['click']} placement="topLeft">
        <div className="relative cursor-pointer flex-shrink-0 mb-2">
          <Avatar size={40} src={avatar} className="bg-gradient-to-br from-blue-500 to-purple-600 cursor-pointer hover:opacity-80 transition-opacity">
            {displayName.charAt(0).toUpperCase()}
          </Avatar>
          <span className={cn("absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[var(--color-bg-darkest)]", statusColors[status])} />
        </div>
      </Dropdown>

      {/* Create Server Modal */}
      <Modal
        open={showCreateModal}
        title="创建房间"
        onCancel={() => setShowCreateModal(false)}
        onOk={handleCreateServer}
        okText="创建"
        cancelText="取消"
        confirmLoading={loading}
        styles={{
          body: { backgroundColor: 'var(--color-bg-secondary)' },
        }}
      >
        <div className="py-4">
          <Input
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="输入房间名称"
            prefix={<PlusOutlined className="text-[var(--color-text-muted)]" />}
            className="rounded-lg"
          />
        </div>
      </Modal>

      {/* Explore Servers Modal */}
      <Modal
        open={showExploreModal}
        title="探索房间"
        onCancel={() => setShowExploreModal(false)}
        footer={null}
        width={500}
        styles={{
          body: { backgroundColor: 'var(--color-bg-secondary)', maxHeight: '60vh', overflowY: 'auto' },
        }}
      >
        <div className="py-4 space-y-4">
          {exploreLoading ? (
            <div className="flex justify-center py-8">
              <Spin indicator={<LoadingOutlined className="text-[var(--color-primary)]" spin />} />
            </div>
          ) : publicRooms.length === 0 ? (
            <div className="text-center py-8">
              <CompassOutlined className="text-4xl text-[var(--color-text-muted)] mb-2" />
              <p className="text-sm text-[var(--color-text-muted)]">暂无公开房间</p>
            </div>
          ) : (
            publicRooms.map(room => (
              <div
                key={room.id}
                className="flex items-center gap-3 p-3 bg-[var(--color-bg-tertiary)] rounded-lg hover:bg-[var(--color-bg-darker)] transition-colors"
              >
                <Avatar
                  size={48}
                  className="bg-gradient-to-br from-[var(--color-primary)] to-purple-600 flex-shrink-0"
                >
                  {room.roomName.charAt(0).toUpperCase()}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-[var(--color-text-normal)] truncate">{room.roomName}</h4>
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <UserOutlined />
                    <span>{room.participantCount} 人</span>
                  </div>
                </div>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleJoinPublicRoom(room.id)}
                  className="rounded-lg"
                >
                  加入
                </Button>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Settings Modal */}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Custom Status Modal */}
      <Modal
        open={showCustomStatusModal}
        title="设置自定义状态"
        onCancel={() => {
          setShowCustomStatusModal(false)
          setCustomStatusText('')
        }}
        onOk={handleSetCustomStatus}
        okText="设置"
        cancelText="取消"
        styles={{
          body: { backgroundColor: 'var(--color-bg-secondary)' },
        }}
      >
        <div className="py-4">
          <Input
            value={customStatusText}
            onChange={(e) => setCustomStatusText(e.target.value)}
            placeholder="输入自定义状态..."
            prefix={<EditOutlined className="text-[var(--color-text-muted)]" />}
            className="rounded-lg"
            maxLength={100}
          />
        </div>
      </Modal>

      {/* Delete Server Modal */}
      <Modal
        open={deleteModalOpen}
        title="删除房间"
        onCancel={() => {
          setDeleteModalOpen(false)
          setServerToDelete(null)
        }}
        onOk={confirmDeleteServer}
        okText="删除"
        cancelText="取消"
        okButtonProps={{ danger: true, loading: deleteLoading }}
        styles={{
          body: { backgroundColor: 'var(--color-bg-secondary)' },
        }}
      >
        <div className="py-4">
          <p className="text-[var(--color-text-normal)]">
            确定要删除房间 <strong>"{serverToDelete?.name}"</strong> 吗？
          </p>
          <p className="text-[var(--color-text-muted)] text-sm mt-2">
            此操作不可撤销，房间内的所有数据将被删除。
          </p>
        </div>
      </Modal>
    </div>
  )
}

interface ServerIconProps {
  server?: Server
  icon?: React.ReactNode
  name: string
  isActive?: boolean
  onClick?: () => void
  onDelete?: () => void
  isAction?: boolean
  hasNotification?: boolean
}

function ServerIcon({ server, icon, name, isActive, onClick, onDelete, isAction, hasNotification }: ServerIconProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const contextMenuItems = server && onDelete ? [
    {
      key: 'delete',
      label: (
        <div className="flex items-center gap-2 text-[var(--color-dnd)]">
          <DeleteOutlined />
          <span>删除房间</span>
        </div>
      ),
      onClick: onDelete,
    },
  ] : []

  return (
    <Dropdown
      menu={{ items: contextMenuItems }}
      trigger={['contextMenu']}
      disabled={!server}
    >
      <div className="relative flex items-center justify-center group">
        {/* Active Indicator */}
        <div
          className={cn(
            "absolute left-0 w-1 rounded-r-full transition-all duration-200",
            "top-1/2 -translate-y-1/2",
            isActive ? "h-10 bg-[var(--color-text-normal)]" : "h-5 bg-[var(--color-text-normal)] opacity-0 group-hover:opacity-100"
          )}
        />

        {/* Notification Dot */}
        {hasNotification && !isActive && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[var(--color-dnd)] rounded-full border-4 border-[var(--color-bg-darkest)] z-10" />
        )}

        <Tooltip
          title={name}
          placement="right"
          open={showTooltip}
          onOpenChange={setShowTooltip}
          styles={{ container: { backgroundColor: 'var(--color-bg-darker)', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', fontWeight: 500, color: 'var(--color-text-normal)' } }}
        >
          <button
            onClick={onClick}
            className={cn(
              "w-12 h-12 flex items-center justify-center overflow-hidden",
              "transition-all duration-200",
              isActive ? "rounded-2xl" : "rounded-full hover:rounded-2xl",
              isAction && "bg-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/30",
              !isAction && !server?.icon && !icon && "bg-[var(--color-accent)]",
              server?.icon && "bg-transparent"
            )}
          >
            {server?.icon ? (
              <img src={server.icon} alt={server.name} className="w-full h-full object-cover" />
            ) : icon ? (
              icon
            ) : (
              <span className="text-white font-semibold text-lg">
                {server?.name?.charAt(0)?.toUpperCase() || name.charAt(0)}
              </span>
            )}
          </button>
        </Tooltip>
      </div>
    </Dropdown>
  )
}
