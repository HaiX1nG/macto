import { describe, it, expect } from 'vitest'
import {
  isMentionOf,
  collectAggregatedNotifications,
  mergeNotifications,
  type AggregationInput,
} from '../notificationStore'
import type { MessageWithStatus } from '../chatStore'
import type { FriendRequest } from '@shared/types/friend'

function makeMsg(partial: { id: number } & Partial<Omit<MessageWithStatus, 'id'>>): MessageWithStatus {
  return {
    channelId: 0,
    senderUserId: 1,
    senderName: 'Alice',
    senderAvatarUrl: '',
    type: 1,
    content: '',
    replyToId: null,
    editedAt: null,
    isPinned: false,
    attachments: [],
    reactions: [],
    createdAt: '2026-08-09T10:00:00.000Z',
    status: 'sent',
    ...partial,
  }
}

function makeReq(partial: { id: number } & Partial<Omit<FriendRequest, 'id'>>): FriendRequest {
  return {
    senderId: 2,
    senderName: 'Bob',
    receiverId: 1,
    receiverName: 'me',
    status: 0,
    message: '',
    createdAt: '2026-08-09T09:00:00.000Z',
    ...partial,
  }
}

function input(partial?: Partial<AggregationInput>): AggregationInput {
  return {
    selfName: 'me',
    messages: new Map(),
    friendRequests: [],
    ...partial,
  }
}

describe('isMentionOf', () => {
  it('matches an explicit @mention of the current user by a different sender', () => {
    expect(isMentionOf(makeMsg({ id: 100, senderName: 'Alice', content: '嘿 @me 快看' }), 'me')).toBe(true)
  })

  it('does not match a substring or when the sender is the current user themselves', () => {
    expect(isMentionOf(makeMsg({ id: 101, content: '@member 在聊' }), 'me')).toBe(false)
    expect(isMentionOf(makeMsg({ id: 102, senderName: 'me', content: '@me 自己' }), 'me')).toBe(false)
  })
})

describe('collectAggregatedNotifications', () => {
  it('aggregates mentions, pins, and pending friend requests sorted by time desc', () => {
    const messages = new Map<number, MessageWithStatus[]>([
      [
        10,
        [
          makeMsg({ id: 1, senderName: 'Alice', content: '@me 看这个', createdAt: '2026-08-09T08:00:00Z' }),
          makeMsg({ id: 2, isPinned: true, content: '置顶内容', createdAt: '2026-08-09T09:00:00Z' }),
        ],
      ],
    ])
    const friendRequests = [makeReq({ id: 5, senderName: 'Carol', createdAt: '2026-08-09T07:00:00Z' })]

    const notes = collectAggregatedNotifications(input({ messages, friendRequests }))
    expect(notes).toHaveLength(3)
    // 按时间倒序：置顶(09:00) > 提及(08:00) > 好友请求(07:00)
    expect(notes.map((n) => n.kind)).toEqual(['pin', 'mention', 'friend-request'])
    expect(notes[0].target).toEqual({ view: 'text-channel', channelId: 10 })
    expect(notes[2].target).toEqual({ view: 'friends' })
  })

  it('skips optimistic pending/failed messages with senderUserId 0', () => {
    const messages = new Map<number, MessageWithStatus[]>([
      [10, [makeMsg({ id: 9, senderUserId: 0, status: 'sending', content: '@me 待定' })]],
    ])
    expect(collectAggregatedNotifications(input({ messages }))).toHaveLength(0)
  })

  it('filters out friend requests that are not pending', () => {
    const friendRequests = [makeReq({ id: 7, status: 1 }), makeReq({ id: 8, status: 2 })]
    expect(collectAggregatedNotifications(input({ friendRequests }))).toHaveLength(0)
  })
})

describe('mergeNotifications', () => {
  it('preserves the read flag of existing items across reloads and keeps orphaned entries', () => {
    const fresh = [
      {
        key: 'mention:1',
        kind: 'mention' as const,
        actor: 'Alice',
        text: '在频道里@了你',
        content: '@me hi',
        createdAt: '2026-08-09T08:00:00Z',
        target: { view: 'text-channel' as const, channelId: 10 },
        read: false,
      },
    ]
    const existing = [
      {
        ...fresh[0],
        read: true,
      },
    ]
    const merged = mergeNotifications(existing, fresh)
    expect(merged).toHaveLength(1)
    expect(merged[0].read).toBe(true)
  })
})
