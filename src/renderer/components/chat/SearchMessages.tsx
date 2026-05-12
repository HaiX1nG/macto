import { useState, useCallback, useEffect, useRef } from 'react'
import { Modal, Input, List, Avatar, Empty, Spin, Tag } from 'antd'
import { SearchOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { chatService } from '@renderer/services/chatService'
import { useServerStore } from '@renderer/stores/serverStore'
import type { MessageResponse } from '@shared/types/api'

interface SearchMessagesProps {
  open: boolean
  onClose: () => void
  onMessageClick?: (message: MessageResponse) => void
}

export function SearchMessages({ open, onClose, onMessageClick }: SearchMessagesProps) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<MessageResponse[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const { servers, currentServerId } = useServerStore()

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const currentServer = servers.find(s => s.id === currentServerId)
  const currentRoomId = currentServer?.channels.find(c => c.type !== 'voice')?.id

  const performSearch = useCallback(async (searchQuery: string, pageNum: number) => {
    if (!searchQuery.trim()) {
      setResults([])
      setTotal(0)
      return
    }

    setLoading(true)
    try {
      const response = await chatService.searchMessages({
        query: searchQuery,
        roomId: currentRoomId ? Number(currentRoomId) : undefined,
        page: pageNum,
        pageSize: 20,
      })
      setResults(response.messages)
      setTotal(response.total)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
    }
  }, [currentRoomId])

  // Handle query change with debounce
  const handleQueryChange = (value: string) => {
    setQuery(value)

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        setPage(1)
        performSearch(value, 1)
      } else {
        setResults([])
        setTotal(0)
      }
    }, 300)
  }

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
      setTotal(0)
      setPage(1)
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [open])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    performSearch(query, nextPage)
  }

  const handleMessageClick = (message: MessageResponse) => {
    onMessageClick?.(message)
    onClose()
  }

  // Highlight search term in content
  const highlightContent = (content: string, searchTerm: string) => {
    if (!searchTerm.trim()) return content

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = content.split(regex)

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-300 text-inherit rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={null}
      width={600}
      centered
      className="search-messages-modal"
      styles={{
        body: { padding: 0 },
      }}
    >
      <div className="p-4">
        {/* Search Input */}
        <Input
          prefix={<SearchOutlined className="text-[var(--color-text-muted)]" />}
          placeholder="搜索消息..."
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          size="large"
          allowClear
          autoFocus
          className="mb-4"
        />

        {/* Room filter indicator */}
        {currentRoomId && (
          <div className="mb-3 flex items-center gap-2">
            <Tag color="blue">当前频道</Tag>
            <span className="text-sm text-[var(--color-text-muted)]">
              {currentServer?.channels.find(c => c.id === currentRoomId)?.name || '未知频道'}
            </span>
          </div>
        )}

        {/* Results */}
        {loading && results.length === 0 ? (
          <div className="flex justify-center py-8">
            <Spin />
          </div>
        ) : results.length > 0 ? (
          <>
            <div className="mb-2 text-sm text-[var(--color-text-muted)]">
              找到 {total} 条结果
            </div>
            <List
              dataSource={results}
              className="max-h-[400px] overflow-y-auto"
              loadMore={
                results.length < total ? (
                  <div className="text-center mt-4">
                    <button
                      onClick={handleLoadMore}
                      disabled={loading}
                      className="text-[var(--color-primary)] hover:underline disabled:opacity-50"
                    >
                      {loading ? '加载中...' : '加载更多'}
                    </button>
                  </div>
                ) : null
              }
              renderItem={(message) => (
                <List.Item
                  className="hover:bg-[var(--color-bg-secondary)] rounded-lg px-3 cursor-pointer transition-colors"
                  onClick={() => handleMessageClick(message)}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        size={36}
                        className="bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
                      >
                        {message.senderName.charAt(0)}
                      </Avatar>
                    }
                    title={
                      <div className="flex items-center gap-2">
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
                      </div>
                    }
                    description={
                      <div className="text-[var(--color-text-muted)] line-clamp-2">
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
