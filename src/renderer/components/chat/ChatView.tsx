import { useEffect, useState } from 'react'
import { useServerStore } from '@renderer/stores/serverStore'
import { useChatStore } from '@renderer/stores/chatStore'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { AudioOutlined, BellOutlined, PushpinOutlined, NumberOutlined, UserOutlined, SearchOutlined, InboxOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'
import type { Channel, Message } from '@shared/types/kook'

export function ChatView() {
  const { servers, currentServerId, currentChannelId } = useServerStore()
  const { messages, sendMessage, addMessage } = useChatStore()

  const currentServer = servers.find(s => s.id === currentServerId)
  const currentChannel = currentServer?.channels.find(c => c.id === currentChannelId)

  // Convert API messages to KOOK format for display
  const channelMessages: Message[] = messages.map(msg => ({
    id: String(msg.id),
    channelId: String(msg.roomId),
    authorId: String(msg.senderUserId),
    author: {
      id: String(msg.senderUserId),
      name: msg.senderName,
      displayName: msg.senderName,
      status: 'online' as const,
    },
    content: msg.content,
    timestamp: new Date(msg.createdAt).getTime(),
  }))

  const handleSendMessage = (content: string) => {
    if (!currentChannelId) return
    // Add message optimistically
    addMessage({
      id: Date.now(),
      roomId: Number(currentChannelId) || 0,
      senderUserId: 0,
      senderName: 'You',
      messageType: 1,
      content,
      createdAt: new Date().toISOString(),
    })
  }

  if (!currentServer || !currentChannel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--color-bg-base)]">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-[var(--color-bg-darker)] flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 28 20" className="w-10 h-8 text-[var(--color-text-muted)]" fill="currentColor">
              <path d="M23.0212 1.67671C21.3107 0.879656 19.5079 0.318797 17.6584 0C17.4062 0.461742 17.1749 0.934541 16.9708 1.4184C15.003 1.12145 12.9974 1.12145 11.0283 1.4184C10.819 0.934541 10.589 0.461744 10.3416 0C8.49087 0.322199 6.68661 0.885653 4.97361 1.68345C1.53179 6.77853 0.559612 11.7417 1.04602 16.6309C3.04912 18.1166 5.31187 19.2137 7.72333 19.8612C8.25832 19.1384 8.73498 18.3699 9.14898 17.5624C8.37544 17.2724 7.62992 16.9089 6.92297 16.4756C7.10261 16.3474 7.27777 16.2131 7.44717 16.0745C11.7197 18.0621 16.3394 18.0621 20.5554 16.0745C20.7248 16.2131 20.8999 16.3474 21.0796 16.4756C20.3714 16.9102 19.6246 17.275 18.8497 17.5637C19.2637 18.3711 19.7403 19.1397 20.2753 19.8625C22.6881 19.2137 24.9508 18.1153 26.954 16.6309C27.5307 10.9745 26.0372 6.05798 23.0212 1.67671ZM9.68041 13.6383C8.39754 13.6383 7.34085 12.4453 7.34085 10.994C7.34085 9.54272 8.37155 8.34973 9.68041 8.34973C10.9893 8.34973 12.0455 9.54272 12.0187 10.994C12.0187 12.4453 10.9893 13.6383 9.68041 13.6383ZM18.3161 13.6383C17.0332 13.6383 15.9765 12.4453 15.9765 10.994C15.9765 9.54272 17.0072 8.34973 18.3161 8.34973C19.6249 8.34973 20.6811 9.54272 20.6544 10.994C20.6544 12.4453 19.6249 13.6383 18.3161 13.6383Z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-[var(--color-text-normal)] mb-2">欢迎使用 Macto</h3>
          <p className="text-[var(--color-text-muted)]">选择一个服务器和频道开始聊天</p>
        </div>
      </div>
    )
  }

  if (currentChannel.type === 'voice') return <VoiceChannelView channel={currentChannel} />

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[var(--color-bg-base)]">
      {/* Header */}
      <div className="h-12 px-4 flex items-center gap-4 border-b border-[var(--color-border)] flex-shrink-0">
        <div className="flex items-center gap-2">
          <NumberOutlined className="text-[var(--color-text-muted)]" />
          <span className="font-semibold text-[var(--color-text-normal)]">{currentChannel.name}</span>
        </div>
        {currentChannel.topic && (
          <>
            <div className="w-px h-6 bg-[var(--color-border)]" />
            <span className="text-sm text-[var(--color-text-muted)] truncate max-w-[300px]">{currentChannel.topic}</span>
          </>
        )}
        <div className="ml-auto flex items-center gap-2">
          <HeaderBtn icon={<BellOutlined />} />
          <HeaderBtn icon={<PushpinOutlined />} />
          <HeaderBtn icon={<UserOutlined />} />
          <div className="w-px h-6 bg-[var(--color-border)] mx-1" />
          <div className="relative">
            <input type="text" placeholder="搜索" className="w-36 h-7 pl-7 pr-2 bg-[var(--color-bg-darkest)] border-none rounded text-sm text-[var(--color-text-normal)] placeholder-[var(--color-text-muted)] focus:outline-none focus:w-56 transition-all" />
            <SearchOutlined className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          </div>
          <HeaderBtn icon={<InboxOutlined />} />
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={channelMessages} />

      {/* Input */}
      <MessageInput onSend={handleSendMessage} channelName={currentChannel.name} />
    </div>
  )
}

function HeaderBtn({ icon }: { icon: React.ReactNode }) {
  return <button className="w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)] hover:bg-[var(--color-bg-darker)] rounded transition-colors">{icon}</button>
}

function VoiceChannelView({ channel }: { channel: Channel }) {
  const [isConnected, setIsConnected] = useState(false)

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[var(--color-bg-base)]">
      <div className="h-12 px-4 flex items-center gap-4 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <AudioOutlined className="text-[var(--color-text-muted)]" />
          <span className="font-semibold text-[var(--color-text-normal)]">{channel.name}</span>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-[var(--color-bg-darker)] flex items-center justify-center mx-auto mb-4">
            <AudioOutlined className="text-3xl text-[var(--color-text-muted)]" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--color-text-normal)] mb-2">{channel.name}</h3>
          <p className="text-[var(--color-text-muted)] mb-6">语音频道</p>
          <button onClick={() => setIsConnected(!isConnected)} className={cn("px-6 py-3 rounded font-medium transition-colors", isConnected ? "bg-[var(--color-dnd)] hover:opacity-90 text-white" : "bg-[var(--color-primary)] hover:opacity-90 text-white")}>
            {isConnected ? '断开连接' : '加入语音'}
          </button>
        </div>
      </div>
    </div>
  )
}
