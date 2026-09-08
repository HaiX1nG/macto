import { useState, useEffect, useRef, useMemo } from 'react'
import { Avatar } from 'antd'
import { cn } from '@renderer/utils/cn'

interface MentionUser {
  id: number | string
  username: string
  displayName?: string
  avatar?: string
}

interface MentionAutocompleteProps {
  users: MentionUser[]
  searchText: string
  position: { top: number; left: number }
  onSelect: (user: MentionUser) => void
  onClose: () => void
  visible: boolean
}

export function MentionAutocomplete({
  users,
  searchText,
  position,
  onSelect,
  onClose,
  visible,
}: MentionAutocompleteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  // Filter users by search text
  const filteredUsers = useMemo(() => {
    if (!searchText) return users.slice(0, 10)
    const lowerSearch = searchText.toLowerCase()
    return users
      .filter(
        (user) =>
          user.username.toLowerCase().includes(lowerSearch) ||
          (user.displayName?.toLowerCase().includes(lowerSearch) ?? false)
      )
      .slice(0, 10)
  }, [users, searchText])

  // Reset selected index when filtered users change
  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredUsers.length])

  // Handle keyboard navigation
  useEffect(() => {
    if (!visible) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) =>
          Math.min(prev + 1, filteredUsers.length - 1)
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && filteredUsers.length > 0) {
        e.preventDefault()
        onSelect(filteredUsers[selectedIndex])
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [visible, filteredUsers, selectedIndex, onSelect, onClose])

  // Close on click outside
  useEffect(() => {
    if (!visible) return

    const handleClickOutside = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [visible, onClose])

  if (!visible || filteredUsers.length === 0) return null

  return (
    <div
      ref={listRef}
      className="fixed z-50 bg-[var(--color-bg-secondary)] rounded-lg shadow-lg border border-[var(--color-border)] overflow-hidden min-w-[200px] max-w-[280px]"
      style={{ top: position.top, left: position.left }}
    >
      <div className="px-3 py-2 border-b border-[var(--color-border)]">
        <span className="text-xs text-[var(--color-text-muted)]">提及成员</span>
      </div>
      <div className="max-h-[200px] overflow-y-auto">
        {filteredUsers.map((user, index) => (
          <button
            key={user.id}
            onClick={() => onSelect(user)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors',
              index === selectedIndex
                ? 'bg-[var(--color-primary)]/10'
                : 'hover:bg-[var(--color-bg-darker)]'
            )}
          >
            <Avatar
              size={24}
              src={user.avatar}
              className="bg-gradient-to-br from-[var(--color-avatar-gradient-start)] to-[var(--color-avatar-gradient-end)] flex-shrink-0"
            >
              {user.username.charAt(0).toUpperCase()}
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[var(--color-text-normal)] truncate">
                {user.displayName || user.username}
              </div>
              {user.displayName && (
                <div className="text-xs text-[var(--color-text-muted)] truncate">
                  @{user.username}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default MentionAutocomplete
