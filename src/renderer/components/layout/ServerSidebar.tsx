import { useState } from 'react'
import { Tooltip } from 'antd'
import { PlusOutlined, CompassOutlined, DownloadOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'
import { useServerStore } from '@renderer/stores/serverStore'
import type { Server } from '@shared/types/kook'

export function ServerSidebar() {
  const { servers, currentServerId, setCurrentServer } = useServerStore()

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
          hasNotification={server.channels.some(c => c.unreadCount && c.unreadCount > 0)}
        />
      ))}

      {/* Add Server Button */}
      <ServerIcon
        icon={<PlusOutlined className="text-[var(--color-primary)] text-xl" />}
        name="添加服务器"
        onClick={() => {}}
        isAction
      />

      <ServerIcon
        icon={<CompassOutlined className="text-[var(--color-primary)] text-xl" />}
        name="探索服务器"
        onClick={() => {}}
        isAction
      />

      <ServerIcon
        icon={<DownloadOutlined className="text-[var(--color-primary)] text-xl" />}
        name="下载应用"
        onClick={() => {}}
        isAction
      />
    </div>
  )
}

interface ServerIconProps {
  server?: Server
  icon?: React.ReactNode
  name: string
  isActive?: boolean
  onClick?: () => void
  isAction?: boolean
  hasNotification?: boolean
}

function ServerIcon({ server, icon, name, isActive, onClick, isAction, hasNotification }: ServerIconProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
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
  )
}
