import { useState, useRef, useEffect } from 'react'
import { Popover } from 'antd'
import { SmileOutlined } from '@ant-design/icons'
import { cn } from '@renderer/utils/cn'

// Common emoji list
const EMOJI_LIST = [
  // Faces
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
  '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋',
  '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐',
  '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌',
  // Reactions
  '👍', '👎', '👏', '🙌', '🤝', '🙏', '✌️', '🤞', '👌', '🤟',
  '💪', '🦾', '👋', '🤚', '✋', '🖖', '👌', '👍', '👎', '👊',
  // Hearts
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️',
  // Objects
  '🎉', '🎊', '🎁', '🎈', '🏆', '🎮', '🎯', '🎲', '📱', '💻',
  '📷', '🎬', '🎵', '🎶', '🔥', '⭐', '✨', '💫', '🌟', '💥',
]

const EMOJI_CATEGORIES = [
  { name: '表情', icon: '😀', start: 0, end: 40 },
  { name: '手势', icon: '👍', start: 40, end: 60 },
  { name: '爱心', icon: '❤️', start: 60, end: 80 },
  { name: '物品', icon: '🎉', start: 80, end: 100 },
]

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
}

export function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState(0)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Filter emojis by search
  const filteredEmojis = search
    ? EMOJI_LIST.filter(() => true) // For now, show all since we don't have names
    : EMOJI_LIST.slice(EMOJI_CATEGORIES[category].start, EMOJI_CATEGORIES[category].end)

  const handleSelect = (emoji: string) => {
    onSelect(emoji)
    setOpen(false)
    setSearch('')
  }

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div ref={containerRef}>
      <Popover
        open={open}
        onOpenChange={setOpen}
        trigger="click"
        placement="topLeft"
        styles={{
          content: {
            backgroundColor: 'var(--color-bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            padding: 0,
            width: 320,
          },
        }}
        content={
          <div className="p-2">
            {/* Search */}
            <div className="px-2 mb-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索表情..."
                className="w-full h-8 px-3 bg-[var(--color-bg-tertiary)] rounded-lg text-sm text-[var(--color-text-normal)] placeholder-[var(--color-text-muted)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
              />
            </div>

            {/* Categories */}
            <div className="flex gap-1 px-2 mb-2 border-b border-[var(--color-border)] pb-2">
              {EMOJI_CATEGORIES.map((cat, i) => (
                <button
                  key={cat.name}
                  onClick={() => setCategory(i)}
                  className={cn(
                    'w-8 h-8 rounded flex items-center justify-center text-lg',
                    'transition-colors',
                    category === i
                      ? 'bg-[var(--color-bg-tertiary)]'
                      : 'hover:bg-[var(--color-bg-tertiary)]/50'
                  )}
                >
                  {cat.icon}
                </button>
              ))}
            </div>

            {/* Emoji Grid */}
            <div className="grid grid-cols-10 gap-0.5 p-1 max-h-[200px] overflow-y-auto scrollbar-thin">
              {(search ? EMOJI_LIST : filteredEmojis).map((emoji, i) => (
                <button
                  key={`${emoji}-${i}`}
                  onClick={() => handleSelect(emoji)}
                  className={cn(
                    'w-7 h-7 flex items-center justify-center text-lg',
                    'rounded hover:bg-[var(--color-bg-tertiary)]',
                    'transition-transform hover:scale-125'
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Category Label */}
            <div className="px-2 pt-2 border-t border-[var(--color-border)] mt-2">
              <span className="text-xs text-[var(--color-text-muted)]">
                {EMOJI_CATEGORIES[category].name}
              </span>
            </div>
          </div>
        }
      >
        <button
          className={cn(
            'w-8 h-8 flex items-center justify-center',
            'text-[var(--color-text-muted)] hover:text-[var(--color-text-normal)]',
            'rounded hover:bg-[var(--color-bg-tertiary)]',
            'transition-colors'
          )}
        >
          <SmileOutlined className="text-lg" />
        </button>
      </Popover>
    </div>
  )
}

export default EmojiPicker
