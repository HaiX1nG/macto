import type { ReactNode } from 'react'
import { Badge } from 'antd'
import { BellOutlined } from '@ant-design/icons'
import { HeaderButton } from '@renderer/components/ui/HeaderButton'

interface NotificationBellProps {
  /** 未读通知数，>0 时在按钮右上角显示红色徽标 */
  readonly unreadCount: number
  /** 是否高亮（面板展开时点亮铃铛） */
  readonly active?: boolean
  /** 点击回调 */
  readonly onClick?: () => void
}

/**
 * NotificationBellButton - 通知铃铛按钮，右上角带未读红点/徽标。
 *
 * 复用 HeaderButton 的尺寸与交互，用 Antd Badge 叠加未读数。
 * 未读数超过 99 时徽标显示 "99+"，0 时不显示。
 */
export function NotificationBellButton({ unreadCount, active, onClick }: NotificationBellProps): ReactNode {
  return (
    <Badge
      count={unreadCount}
      overflowCount={99}
      offset={[-2, 4]}
      size="small"
      color="var(--color-dnd)"
      className="flex items-center"
    >
      <HeaderButton
        icon={<BellOutlined />}
        label="通知"
        active={active}
        onClick={onClick}
      />
    </Badge>
  )
}

export default NotificationBellButton
