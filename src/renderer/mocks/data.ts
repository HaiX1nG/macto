/**
 * Mock data for development and testing.
 *
 * Uses the new KOOK-style type system (number IDs, server/channel domain types).
 * This is for dev-only mock purposes — real data comes from the Go backend.
 */

import type { Server } from '@shared/types/server'
import type { Channel, ChannelTreeNode } from '@shared/types/channel'
import type { ChannelMessage } from '@shared/types/message'
import type { VoiceParticipant } from '@shared/types/voice'
import type { UserStatus } from '@shared/types/auth'

// ==================== 用户数据 ====================

export interface MockUser {
  id: number
  username: string
  email: string
  avatarUrl: string
  bannerUrl: string
  bio: string
  customStatus: string
  status: UserStatus
  createdAt: string
}

export const mockUsers: MockUser[] = [
  {
    id: 1,
    username: 'megumikato',
    email: 'megumikato@example.com',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=megumikato',
    bannerUrl: '',
    bio: '全栈开发者 | 热爱编程和游戏',
    customStatus: '正在写代码',
    status: 'online',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    username: 'sakura',
    email: 'sakura@example.com',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sakura',
    bannerUrl: '',
    bio: '设计师',
    customStatus: '',
    status: 'online',
    createdAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 3,
    username: 'yuki',
    email: 'yuki@example.com',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yuki',
    bannerUrl: '',
    bio: '',
    customStatus: '休息中',
    status: 'idle',
    createdAt: '2024-01-03T00:00:00Z',
  },
  {
    id: 4,
    username: 'haru',
    email: 'haru@example.com',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=haru',
    bannerUrl: '',
    bio: '',
    customStatus: '开会中',
    status: 'dnd',
    createdAt: '2024-01-04T00:00:00Z',
  },
  {
    id: 5,
    username: 'natsu',
    email: 'natsu@example.com',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=natsu',
    bannerUrl: '',
    bio: '游戏玩家',
    customStatus: '',
    status: 'online',
    createdAt: '2024-01-05T00:00:00Z',
  },
  {
    id: 6,
    username: 'aki',
    email: 'aki@example.com',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aki',
    bannerUrl: '',
    bio: '',
    customStatus: '',
    status: 'offline',
    createdAt: '2024-01-06T00:00:00Z',
  },
  {
    id: 7,
    username: 'fuyu',
    email: 'fuyu@example.com',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fuyu',
    bannerUrl: '',
    bio: '',
    customStatus: '',
    status: 'online',
    createdAt: '2024-01-07T00:00:00Z',
  },
  {
    id: 8,
    username: 'hana',
    email: 'hana@example.com',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hana',
    bannerUrl: '',
    bio: '',
    customStatus: '',
    status: 'idle',
    createdAt: '2024-01-08T00:00:00Z',
  },
]

export const currentUser: MockUser = mockUsers[0]

// ==================== 服务器数据 ====================

export const mockServers: Server[] = [
  {
    id: 1,
    name: '技术交流群',
    iconUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=tech',
    bannerUrl: '',
    description: '程序员技术交流社区',
    ownerId: 1,
    inviteCode: 'tech-invite',
    isPrivate: true,
    maxMembers: 500,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: '游戏玩家联盟',
    iconUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=game',
    bannerUrl: '',
    description: '游戏爱好者社区',
    ownerId: 5,
    inviteCode: 'game-invite',
    isPrivate: true,
    maxMembers: 500,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 3,
    name: '设计工作室',
    iconUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=design',
    bannerUrl: '',
    description: '设计师交流平台',
    ownerId: 2,
    inviteCode: 'design-invite',
    isPrivate: true,
    maxMembers: 500,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
  {
    id: 4,
    name: '学习小组',
    iconUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=study',
    bannerUrl: '',
    description: '一起学习进步',
    ownerId: 3,
    inviteCode: 'study-invite',
    isPrivate: true,
    maxMembers: 500,
    createdAt: '2024-01-04T00:00:00Z',
    updatedAt: '2024-01-04T00:00:00Z',
  },
]

// ==================== 频道数据 ====================

function makeChannel(
  id: number,
  serverId: number,
  name: string,
  type: 1 | 2 | 3,
  position: number,
  parentId: number | null = null,
  topic = ''
): Channel {
  return {
    id,
    serverId,
    name,
    type,
    topic,
    parentId,
    position,
    bitrate: 64000,
    userLimit: 0,
    slowMode: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }
}

export const mockChannels: Channel[] = [
  // Server 1 channels
  makeChannel(1, 1, '公告', 1, 0, null, '服务器公告和通知'),
  makeChannel(2, 1, '欢迎', 1, 1, null, '新人欢迎'),
  makeChannel(3, 1, '文字频道', 3, 2),
  makeChannel(4, 1, '综合讨论', 1, 3, 3),
  makeChannel(5, 1, '前端开发', 1, 4, 3),
  makeChannel(6, 1, '后端开发', 1, 5, 3),
  makeChannel(7, 1, '语音频道', 3, 6),
  makeChannel(8, 1, '综合语音', 2, 7, 7),
  makeChannel(9, 1, '游戏语音', 2, 8, 7),
  // Server 2 channels
  makeChannel(10, 2, '公告', 1, 0),
  makeChannel(11, 2, '游戏讨论', 1, 1),
  makeChannel(12, 2, '游戏语音', 2, 2),
  makeChannel(13, 2, '开黑房间', 2, 3),
  // Server 3 channels
  makeChannel(14, 3, '作品分享', 1, 0),
  makeChannel(15, 3, '设计讨论', 1, 1),
  makeChannel(16, 3, '协作语音', 2, 2),
  // Server 4 channels
  makeChannel(17, 4, '学习计划', 1, 0),
  makeChannel(18, 4, '问题讨论', 1, 1),
  makeChannel(19, 4, '学习语音', 2, 2),
]

// ==================== 成员数据 ====================

export interface MockServerMember {
  id: number
  serverId: number
  userId: number
  username: string
  avatarUrl: string
  nickname: string
  roles: never[]
  joinedAt: string
  isOwner: boolean
}

export const mockMembers: MockServerMember[] = mockUsers.map((user, index) => ({
  id: index + 1,
  serverId: 1,
  userId: user.id,
  username: user.username,
  avatarUrl: user.avatarUrl,
  nickname: user.username,
  roles: [],
  joinedAt: '2024-01-01T00:00:00Z',
  isOwner: user.id === 1,
}))

// ==================== 消息数据 ====================

const messageContents = [
  '大家好！',
  '今天天气不错',
  '有人在线吗？',
  '分享一下最近的项目',
  '这个功能怎么实现？',
  '我觉得可以用 React 来做',
  'TypeScript 真的很方便',
  '刚学会了一个新技巧',
  '推荐一个好用的工具',
  '代码写累了，休息一下',
  '晚上一起打游戏吗？',
  '这个设计很漂亮',
  '学习了！',
  '收到，马上处理',
  '好的，我来看看',
  '有遇到什么问题吗？',
  '可以帮忙看看这个 bug',
  '提交了 PR，请帮忙 review',
  '文档更新了',
  '测试通过了 ✅',
]

function generateMessages(channelId: number): ChannelMessage[] {
  const messages: ChannelMessage[] = []
  const count = Math.floor(Math.random() * 20) + 10

  for (let i = 0; i < count; i++) {
    const author = mockUsers[Math.floor(Math.random() * mockUsers.length)]
    const timestamp = new Date(Date.now() - (count - i) * 60000 * Math.random() * 5)

    messages.push({
      id: channelId * 1000 + i,
      channelId,
      senderUserId: author.id,
      senderName: author.username,
      senderAvatarUrl: author.avatarUrl,
      type: 1,
      content: messageContents[Math.floor(Math.random() * messageContents.length)],
      replyToId: null,
      replyTo: null,
      editedAt: null,
      isPinned: false,
      attachments: [],
      reactions: Math.random() > 0.7
        ? [
            { emoji: '👍', count: Math.floor(Math.random() * 5) + 1, users: [] },
            { emoji: '❤️', count: Math.floor(Math.random() * 3) + 1, users: [] },
          ]
        : [],
      createdAt: timestamp.toISOString(),
    })
  }

  return messages
}

export const mockMessages: Map<number, ChannelMessage[]> = new Map()

mockChannels.forEach((channel: Channel) => {
  if (channel.type === 1) {
    mockMessages.set(channel.id, generateMessages(channel.id))
  }
})

// ==================== 语音参与者数据 ====================

export const mockVoiceParticipants: VoiceParticipant[] = [
  {
    id: 1,
    channelId: 8,
    userId: 1,
    username: 'megumikato',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=megumikato',
    isMuted: false,
    isDeafened: false,
    isSpeaking: false,
    volume: 80,
    joinedAt: new Date(Date.now() - 100000).toISOString(),
  },
  {
    id: 2,
    channelId: 8,
    userId: 5,
    username: 'natsu',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=natsu',
    isMuted: true,
    isDeafened: false,
    isSpeaking: false,
    volume: 70,
    joinedAt: new Date(Date.now() - 50000).toISOString(),
  },
  {
    id: 3,
    channelId: 8,
    userId: 7,
    username: 'fuyu',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fuyu',
    isMuted: false,
    isDeafened: false,
    isSpeaking: true,
    volume: 75,
    joinedAt: new Date(Date.now() - 30000).toISOString(),
  },
]

// ==================== 辅助函数 ====================

export const getServerById = (id: number): Server | undefined =>
  mockServers.find((s) => s.id === id)

export const getChannelById = (id: number): Channel | undefined =>
  mockChannels.find((c) => c.id === id)

export const getUserById = (id: number): MockUser | undefined =>
  mockUsers.find((u) => u.id === id)

export const getMessagesByChannel = (channelId: number): ChannelMessage[] =>
  mockMessages.get(channelId) || []

export const getMembersByServer = (serverId: number): MockServerMember[] =>
  mockMembers.filter((m) => m.serverId === serverId)

export const getChannelsByServer = (serverId: number): Channel[] =>
  mockChannels.filter((c) => c.serverId === serverId)

export const getChannelTreeByServer = (serverId: number): ChannelTreeNode[] => {
  const channels = getChannelsByServer(serverId)
  const roots: ChannelTreeNode[] = []
  const childMap = new Map<number | null, Channel[]>()

  channels.forEach((ch) => {
    const parentKey = ch.parentId
    if (!childMap.has(parentKey)) {
      childMap.set(parentKey, [])
    }
    childMap.get(parentKey)!.push(ch)
  })

  function buildTree(parentId: number | null): ChannelTreeNode[] {
    const children = childMap.get(parentId) || []
    return children.map((ch) => ({
      ...ch,
      children: buildTree(ch.id),
    }))
  }

  roots.push(...buildTree(null))
  return roots
}
