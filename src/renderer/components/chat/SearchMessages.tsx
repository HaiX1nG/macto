import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { Input, List, Avatar, Empty, Spin, Select, Switch, Tooltip } from 'antd'
import { SearchOutlined, ClockCircleOutlined, MessageOutlined } from '@ant-design/icons'
import { Modal } from '@renderer/components/ui/Modal'
import { chatService } from '@renderer/services/chatService'
import { useRoomStore } from '@renderer/stores/roomStore'
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
  const [selectedRoomId, setSelectedRoomId] = useState<number | undefined>(undefined)
  const [searchAllRooms, setSearchAllRooms] = useState(false)

  const { rooms, currentRoomId } = useRoomStore()
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const roomOptions = useMemo(() => {
    return rooms.map(room => ({
      label: room.roomName,
      value: room.id,
    }))
  }, [rooms])

  const effectiveRoomId = searchAllRooms ? undefined : (selectedRoomId ?? (currentRoomId ? Number(currentRoomId) : undefined))

  const performSearch = useCallback(async (searchQuery: string, pageNum: number, roomId?: number) => {
    if (!searchQuery.trim()) {
      setResults([])
      setTotal(0)
      return
    }

    setLoading(true)
    try {
      const response = await chatService.searchMessages({
        query: searchQuery,
        roomId: roomId,
        page: pageNum,
        pageSize: 20,
      })
      if (pageNum === 1) {
        setResults(response.messages)
      } else {
        setResults(prev => [...prev, ...response.messages])
      }
      setTotal(response.total)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleQueryChange = (value: string) => {
    setQuery(value)
    setPage(1)
    setResults([])

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        performSearch(value, 1, effectiveRoomId)
      } else {
        setResults([])
        setTotal(0)
      }
    }, 300)
  }

  const handleRoomChange = (roomId: number | undefined) => {
    setSelectedRoomId(roomId)
    setPage(1)
    setResults([])
    if (query.trim()) {
      performSearch(query, 1, searchAllRooms ? undefined : roomId)
    }
  }

  const handleSearchAllChange = (checked: boolean) => {
    setSearchAllRooms(checked)
    setPage(1)
    setResults([])
    if (query.trim()) {
      performSearch(query, 1, checked ? undefined : effectiveRoomId)
    }
  }

  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
      setTotal(0)
      setPage(1)
      setSelectedRoomId(undefined)
      setSearchAllRooms(false)
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [open])

  useEffect(() => {
    if (open && currentRoomId && !selectedRoomId) {
      setSelectedRoomId(Number(currentRoomId))
    }
  }, [open, currentRoomId, selectedRoomId])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    performSearch(query, nextPage, effectiveRoomId)
  }

  const handleMessageClick = (message: MessageResponse) => {
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

  const getRoomName = (roomId: number) => {
    const room = rooms.find(r => r.id === roomId)
    return room?.roomName || `房间 ${roomId}`
  }

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
              checked={searchAllRooms}
              onChange={handleSearchAllChange}
              size="small"
            />
            <span className="text-sm text-[var(--color-text-normal)]">
              {searchAllRooms ? '所有房间' : '当前房间'}
            </span>
          </div>

          {!searchAllRooms && (
            <Select
              value={selectedRoomId}
              onChange={handleRoomChange}
              options={roomOptions}
              placeholder="选择房间"
              className="min-w-[150px]"
              size="small"
              allowClear
            />
          )}
        </div>

        {loading && results.length === 0 ? (
          <div className="flex justify-center py-8">
            <Spin />
          </div>
        ) : results.length > 0 ? (
          <>
            <div className="text-sm text-[var(--color-text-muted)]">
              找到 {total} 条结果
              {effectiveRoomId && (
                <span className="ml-2">
                  (在「{getRoomName(effectiveRoomId)}」中)
                </span>
              )}
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
                      className="text-[var(--color-primary)] hover:underline disabled:opacity-50 transition-colors"
                    >
                      {loading ? '加载中...' : '加载更多'}
                    </button>
                  </div>
                ) : null
              }
              renderItem={(message) => (
                <List.Item
                  className="hover:bg-[var(--color-bg-secondary)] dark:hover:bg-[var(--color-bg-tertiary)] rounded-lg px-3 cursor-pointer transition-colors border-b border-[var(--color-border)] last:border-b-0"
                  onClick={() => handleMessageClick(message)}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        size={36}
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
                        {!effectiveRoomId && (
                          <Tooltip title={getRoomName(message.roomId)}>
                            <span className="text-xs text-[var(--color-primary)] flex items-center gap-1 cursor-pointer">
                              <MessageOutlined />
                              {getRoomName(message.roomId)}
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
