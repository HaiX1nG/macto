import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { Input, List, Avatar, Empty, Spin, Switch, Tooltip } from 'antd'
import { SearchOutlined, ClockCircleOutlined, MessageOutlined } from '@ant-design/icons'
import { Modal } from '@renderer/components/ui/Modal'
import { messageService } from '@renderer/services/messageService'
import { useServerStore } from '@renderer/stores/serverStore'
import { useUIStore } from '@renderer/stores/uiStore'
import type { ChannelMessage } from '@shared/types/message'

interface SearchMessagesProps {
  open: boolean
  onClose: () => void
  onMessageClick?: (message: ChannelMessage) => void
}

export function SearchMessages({ open, onClose, onMessageClick }: SearchMessagesProps) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ChannelMessage[]>([])
  const [searchAllChannels, setSearchAllChannels] = useState(false)

  const { servers, currentServerId } = useServerStore()
  const { currentChannelId } = useUIStore()
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const effectiveChannelId = searchAllChannels ? undefined : currentChannelId ?? undefined

  const performSearch = useCallback(async (searchQuery: string, channelId?: number) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const response = await messageService.searchMessages(searchQuery, channelId)
      setResults(response)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleQueryChange = (value: string) => {
    setQuery(value)
    setResults([])

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        void performSearch(value, effectiveChannelId)
      } else {
        setResults([])
      }
    }, 300)
  }

  const handleSearchAllChange = (checked: boolean) => {
    setSearchAllChannels(checked)
    setResults([])
    if (query.trim()) {
      void performSearch(query, checked ? undefined : effectiveChannelId)
    }
  }

  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
      setSearchAllChannels(false)
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [open])

  const handleMessageClick = (message: ChannelMessage) => {
    onMessageClick?.(message)
    onClose()
  }

  const highlightContent = (content: string, searchTerm: string) => {
    if (!searchTerm.trim()) return content

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = content.split(regex)

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-300 dark:bg-yellow-600 text-inherit rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  const getServerName = useMemo(() => {
    const server = servers.find(s => s.id === currentServerId)
    return server?.name || '当前服务器'
  }, [servers, currentServerId])

  // Suppress unused warning - getServerName is used in the UI
  void getServerName

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="搜索消息"
      size="lg"
      showCloseButton={false}
    >
      <div className="space-y-4">
        <Input
          prefix={<SearchOutlined className="text-[var(--color-text-muted)]" />}
          placeholder="输入关键词搜索消息..."
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          size="large"
          allowClear
          autoFocus
        />

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--color-text-muted)]">搜索范围:</span>
            <Switch
              checked={searchAllChannels}
              onChange={handleSearchAllChange}
              size="small"
            />
            <span className="text-sm text-[var(--color-text-normal)]">
              {searchAllChannels ? '所有频道' : '当前频道'}
            </span>
          </div>
        </div>

        {loading && results.length === 0 ? (
          <div className="flex justify-center py-8">
            <Spin />
          </div>
        ) : results.length > 0 ? (
          <>
            <div className="text-sm text-[var(--color-text-muted)]">
              找到 {results.length} 条结果
              {effectiveChannelId && (
                <span className="ml-2">
                  (在当前频道中)
                </span>
              )}
            </div>
            <List
              dataSource={results}
              className="max-h-[400px] overflow-y-auto"
              renderItem={(message) => (
                <List.Item
                  className="hover:bg-[var(--color-bg-secondary)] dark:hover:bg-[var(--color-bg-tertiary)] rounded-lg px-3 cursor-pointer transition-colors border-b border-[var(--color-border)] last:border-b-0"
                  onClick={() => handleMessageClick(message)}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        size={36}
                        src={message.senderAvatarUrl || undefined}
                        className="bg-gradient-to-br from-[var(--color-avatar-gradient-start)] to-[var(--color-avatar-gradient-end)] flex items-center justify-center text-white font-medium"
                      >
                        {message.senderName.charAt(0).toUpperCase()}
                      </Avatar>
                    }
                    title={
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-[var(--color-text-normal)]">
                          {message.senderName}
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                          <ClockCircleOutlined />
                          {new Date(message.createdAt).toLocaleString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {!effectiveChannelId && (
                          <Tooltip title={`频道 ${message.channelId}`}>
                            <span className="text-xs text-[var(--color-primary)] flex items-center gap-1 cursor-pointer">
                              <MessageOutlined />
                              {`频道 ${message.channelId}`}
                            </span>
                          </Tooltip>
                        )}
                      </div>
                    }
                    description={
                      <div className="text-[var(--color-text-muted)] line-clamp-2 text-sm">
                        {highlightContent(message.content, query)}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </>
        ) : query.trim() ? (
          <Empty
            description="未找到相关消息"
            className="py-8"
          />
        ) : (
          <div className="text-center py-8 text-[var(--color-text-muted)]">
            输入关键词搜索消息
          </div>
        )}
      </div>
    </Modal>
  )
}

export default SearchMessages
