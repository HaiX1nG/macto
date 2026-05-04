import type { Server, Channel, Message, User, ServerMember, VoiceParticipant } from '@shared/types/kook'

// ==================== 用户数据 ====================

export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'megumikato',
    displayName: '小猫',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=megumikato',
    status: 'online',
    customStatus: '正在写代码',
    bio: '全栈开发者 | 热爱编程和游戏'
  },
  {
    id: 'user-2',
    name: 'sakura',
    displayName: '樱花',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sakura',
    status: 'online',
    bio: '设计师'
  },
  {
    id: 'user-3',
    name: 'yuki',
    displayName: '雪',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yuki',
    status: 'idle',
    customStatus: '休息中'
  },
  {
    id: 'user-4',
    name: 'haru',
    displayName: '春',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=haru',
    status: 'dnd',
    customStatus: '开会中'
  },
  {
    id: 'user-5',
    name: 'natsu',
    displayName: '夏',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=natsu',
    status: 'online',
    bio: '游戏玩家'
  },
  {
    id: 'user-6',
    name: 'aki',
    displayName: '秋',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aki',
    status: 'offline'
  },
  {
    id: 'user-7',
    name: 'fuyu',
    displayName: '冬',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fuyu',
    status: 'online'
  },
  {
    id: 'user-8',
    name: 'hana',
    displayName: '花',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hana',
    status: 'idle'
  }
]

export const currentUser: User = mockUsers[0]

// ==================== 服务器数据 ====================

export const mockServers: Server[] = [
  {
    id: 'server-1',
    name: '技术交流群',
    icon: 'https://api.dicebear.com/7.x/identicon/svg?seed=tech',
    description: '程序员技术交流社区',
    ownerId: 'user-1',
    memberCount: 128,
    createdAt: Date.now() - 100000000,
    roles: [
      { id: 'role-1', serverId: 'server-1', name: '管理员', color: '#f5222d', position: 1, permissions: [] },
      { id: 'role-2', serverId: 'server-1', name: '开发者', color: '#1890ff', position: 2, permissions: [] },
      { id: 'role-3', serverId: 'server-1', name: '成员', color: '#52c41a', position: 3, permissions: [] }
    ],
    channels: [
      { id: 'ch-1', serverId: 'server-1', name: '公告', type: 'text', topic: '服务器公告和通知', position: 0 },
      { id: 'ch-2', serverId: 'server-1', name: '欢迎', type: 'text', topic: '新人欢迎', position: 1 },
      { id: 'ch-3', serverId: 'server-1', name: '文字频道', type: 'category', position: 2 },
      { id: 'ch-4', serverId: 'server-1', name: '综合讨论', type: 'text', parentId: 'ch-3', position: 3, unreadCount: 5 },
      { id: 'ch-5', serverId: 'server-1', name: '前端开发', type: 'text', parentId: 'ch-3', position: 4 },
      { id: 'ch-6', serverId: 'server-1', name: '后端开发', type: 'text', parentId: 'ch-3', position: 5 },
      { id: 'ch-7', serverId: 'server-1', name: '语音频道', type: 'category', position: 6 },
      { id: 'ch-8', serverId: 'server-1', name: '综合语音', type: 'voice', parentId: 'ch-7', position: 7 },
      { id: 'ch-9', serverId: 'server-1', name: '游戏语音', type: 'voice', parentId: 'ch-7', position: 8 },
    ]
  },
  {
    id: 'server-2',
    name: '游戏玩家联盟',
    icon: 'https://api.dicebear.com/7.x/identicon/svg?seed=game',
    description: '游戏爱好者社区',
    ownerId: 'user-5',
    memberCount: 256,
    createdAt: Date.now() - 50000000,
    roles: [
      { id: 'role-4', serverId: 'server-2', name: '管理员', color: '#722ed1', position: 1, permissions: [] },
      { id: 'role-5', serverId: 'server-2', name: '玩家', color: '#13c2c2', position: 2, permissions: [] }
    ],
    channels: [
      { id: 'ch-10', serverId: 'server-2', name: '公告', type: 'text', position: 0 },
      { id: 'ch-11', serverId: 'server-2', name: '游戏讨论', type: 'text', position: 1, unreadCount: 12 },
      { id: 'ch-12', serverId: 'server-2', name: '游戏语音', type: 'voice', position: 2 },
      { id: 'ch-13', serverId: 'server-2', name: '开黑房间', type: 'voice', position: 3 },
    ]
  },
  {
    id: 'server-3',
    name: '设计工作室',
    icon: 'https://api.dicebear.com/7.x/identicon/svg?seed=design',
    description: '设计师交流平台',
    ownerId: 'user-2',
    memberCount: 64,
    createdAt: Date.now() - 30000000,
    roles: [],
    channels: [
      { id: 'ch-14', serverId: 'server-3', name: '作品分享', type: 'text', position: 0 },
      { id: 'ch-15', serverId: 'server-3', name: '设计讨论', type: 'text', position: 1 },
      { id: 'ch-16', serverId: 'server-3', name: '协作语音', type: 'voice', position: 2 },
    ]
  },
  {
    id: 'server-4',
    name: '学习小组',
    icon: 'https://api.dicebear.com/7.x/identicon/svg?seed=study',
    description: '一起学习进步',
    ownerId: 'user-3',
    memberCount: 32,
    createdAt: Date.now() - 20000000,
    roles: [],
    channels: [
      { id: 'ch-17', serverId: 'server-4', name: '学习计划', type: 'text', position: 0 },
      { id: 'ch-18', serverId: 'server-4', name: '问题讨论', type: 'text', position: 1 },
      { id: 'ch-19', serverId: 'server-4', name: '学习语音', type: 'voice', position: 2 },
    ]
  }
]

// ==================== 成员数据 ====================

export const mockMembers: ServerMember[] = mockUsers.map((user, index) => ({
  id: `member-${user.id}`,
  serverId: 'server-1',
  userId: user.id,
  user,
  nickname: user.displayName,
  roles: index < 2 ? ['role-1'] : index < 4 ? ['role-2'] : ['role-3'],
  joinedAt: Date.now() - Math.random() * 100000000,
  isOwner: user.id === 'user-1'
}))

// ==================== 消息数据 ====================

const generateMessages = (channelId: string): Message[] => {
  const messages: Message[] = []
  const count = Math.floor(Math.random() * 20) + 10

  for (let i = 0; i < count; i++) {
    const author = mockUsers[Math.floor(Math.random() * mockUsers.length)]
    const timestamp = Date.now() - (count - i) * 60000 * Math.random() * 5

    messages.push({
      id: `msg-${channelId}-${i}`,
      channelId,
      authorId: author.id,
      author,
      content: getRandomMessageContent(),
      timestamp,
      reactions: Math.random() > 0.7 ? [
        { emoji: '👍', count: Math.floor(Math.random() * 5) + 1, users: [] },
        { emoji: '❤️', count: Math.floor(Math.random() * 3) + 1, users: [] }
      ] : undefined
    })
  }

  return messages
}

const getRandomMessageContent = (): string => {
  const contents = [
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
    '测试通过了 ✅'
  ]
  return contents[Math.floor(Math.random() * contents.length)]
}

export const mockMessages: Map<string, Message[]> = new Map()

mockServers.forEach(server => {
  server.channels.forEach(channel => {
    if (channel.type === 'text') {
      mockMessages.set(channel.id, generateMessages(channel.id))
    }
  })
})

// ==================== 语音参与者数据 ====================

export const mockVoiceParticipants: VoiceParticipant[] = [
  {
    id: 'vp-1',
    userId: 'user-1',
    user: mockUsers[0],
    isMuted: false,
    isDeafened: false,
    isSpeaking: false,
    volume: 80,
    joinedAt: Date.now() - 100000
  },
  {
    id: 'vp-2',
    userId: 'user-5',
    user: mockUsers[4],
    isMuted: true,
    isDeafened: false,
    isSpeaking: false,
    volume: 70,
    joinedAt: Date.now() - 50000
  },
  {
    id: 'vp-3',
    userId: 'user-7',
    user: mockUsers[6],
    isMuted: false,
    isDeafened: false,
    isSpeaking: true,
    volume: 75,
    joinedAt: Date.now() - 30000
  }
]

// ==================== 辅助函数 ====================

export const getServerById = (id: string): Server | undefined =>
  mockServers.find(s => s.id === id)

export const getChannelById = (id: string): Channel | undefined =>
  mockServers.flatMap(s => s.channels).find(c => c.id === id)

export const getUserById = (id: string): User | undefined =>
  mockUsers.find(u => u.id === id)

export const getMessagesByChannel = (channelId: string): Message[] =>
  mockMessages.get(channelId) || []

export const getMembersByServer = (serverId: string): ServerMember[] =>
  mockMembers.filter(m => m.serverId === serverId)