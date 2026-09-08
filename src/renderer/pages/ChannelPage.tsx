import type { ReactNode } from 'react'
import { ChatView } from '@renderer/components/chat/ChatView'
import type { ViewPageProps } from '@renderer/config/viewRegistry'

/**
 * ChannelPage - 文字频道聊天页。
 *
 * 包裹现有 ChatView。ChatView 自行从 roomStore 读取 currentChannelId，
 * 无需通过 params 传递。
 */
export function ChannelPage(_props: ViewPageProps): ReactNode {
  return <ChatView />
}

export default ChannelPage
