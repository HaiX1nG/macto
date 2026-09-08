import React from 'react'
import { Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import { cn } from '@renderer/utils/cn'

/**
 * DropdownMenu Item Interface
 */
interface DropdownMenuItem {
  /** Unique key for the item */
  key: string
  /** Display label */
  label: React.ReactNode
  /** Optional icon to display alongside the label */
  icon?: React.ReactNode
  /** Whether the item is disabled */
  disabled?: boolean
  /** Whether this item is a divider */
  divider?: boolean
  /** Whether this item is dangerous (red text) */
  danger?: boolean
  /** Click handler for this specific item */
  onClick?: () => void
}

/**
 * DropdownMenu Props Interface
 */
interface DropdownMenuProps {
  /** Array of menu items */
  items: DropdownMenuItem[]
  /** The element that triggers the dropdown */
  children: React.ReactNode
  /** Callback when an item is clicked, receives the item key */
  onSelect?: (key: string) => void
  /** Additional class names for the dropdown overlay */
  overlayClassName?: string
  /** Placement of the dropdown */
  placement?:
    | 'top'
    | 'bottom'
    | 'topLeft'
    | 'topRight'
    | 'bottomLeft'
    | 'bottomRight'
  /** Whether the dropdown is disabled */
  disabled?: boolean
  /** Whether to show an arrow pointing to the trigger element */
  arrow?: boolean
  /** Whether the dropdown is open (controlled) */
  open?: boolean
  /** Callback when the dropdown visibility changes */
  onOpenChange?: (open: boolean) => void
}

/**
 * DropdownMenu - A customizable dropdown menu with icons and dividers
 *
 * Built on top of Ant Design's Dropdown and Menu components with custom
 * Tailwind styling and animation support.
 *
 * @example
 * ```tsx
 * <DropdownMenu
 *   items={[
 *     { key: 'edit', label: 'Edit', icon: <EditIcon /> },
 *     { key: 'copy', label: 'Copy', icon: <CopyIcon /> },
 *     { key: 'divider', label: '', divider: true },
 *     { key: 'delete', label: 'Delete', icon: <DeleteIcon />, danger: true },
 *   ]}
 *   onSelect={(key) => console.log('Selected:', key)}
 * >
 *   <Button variant="ghost">Actions</Button>
 * </DropdownMenu>
 * ```
 */
export const DropdownMenu = ({
  items,
  children,
  onSelect,
  overlayClassName,
  placement = 'bottomLeft',
  disabled,
  arrow = false,
  open,
  onOpenChange,
}: DropdownMenuProps): React.ReactNode => {
  const handleMenuClick: MenuProps['onClick'] = (info) => {
    onSelect?.(info.key)
  }

  const menuItems: MenuProps['items'] = items.map((item) => {
    if (item.divider) {
      return { type: 'divider', key: item.key }
    }

    return {
      key: item.key,
      label: (
        <span className="flex items-center gap-2">
          {item.icon && <span className="flex items-center text-[var(--color-text-muted)]">{item.icon}</span>}
          <span>{item.label}</span>
        </span>
      ),
      disabled: item.disabled,
      danger: item.danger,
      onClick: item.onClick,
      className: cn(
        'transition-colors duration-150',
        !item.danger && 'hover:bg-[var(--color-bg-tertiary)]'
      ),
    }
  })

  return (
    <Dropdown
      menu={{ items: menuItems, onClick: handleMenuClick }}
      placement={placement}
      disabled={disabled}
      arrow={arrow}
      open={open}
      onOpenChange={onOpenChange}
      className={cn(
        // Custom animation: translateY(-10px -> 0) + opacity
        '[&_.ant-dropdown-menu]:animate-[fade-in-down_var(--duration-normal)_var(--ease-out)]',
        '[&_.ant-dropdown-menu]:bg-[var(--color-bg-base)]',
        '[&_.ant-dropdown-menu]:border',
        '[&_.ant-dropdown-menu]:border-[var(--color-border)]',
        '[&_.ant-dropdown-menu]:rounded-xl',
        '[&_.ant-dropdown-menu]:shadow-soft-lg',
        '[&_.ant-dropdown-menu]:p-1.5',
        '[&_.ant-dropdown-menu]:min-w-[180px]',
        // Menu item styling
        '[&_.ant-dropdown-menu-item]:rounded-lg',
        '[&_.ant-dropdown-menu-item]:px-3',
        '[&_.ant-dropdown-menu-item]:py-1.5',
        '[&_.ant-dropdown-menu-item]:text-sm',
        '[&_.ant-dropdown-menu-item]:text-[var(--color-text-normal)]',
        '[&_.ant-dropdown-menu-item]:transition-colors',
        '[&_.ant-dropdown-menu-item]:duration-150',
        // Hover state
        '[&_.ant-dropdown-menu-item]:hover:bg-[var(--color-bg-tertiary)]',
        // Danger item styling
        '[&_.ant-dropdown-menu-item-danger]:text-[var(--color-dnd)]',
        '[&_.ant-dropdown-menu-item-danger]:hover:bg-[var(--color-dnd)]/10',
        // Divider styling
        '[&_.ant-dropdown-menu-item-divider]:bg-[var(--color-divider)]',
        '[&_.ant-dropdown-menu-item-divider]:my-1',
        overlayClassName
      )}
    >
      {children}
    </Dropdown>
  )
}

DropdownMenu.displayName = 'DropdownMenu'
