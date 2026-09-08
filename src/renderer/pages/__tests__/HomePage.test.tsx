import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntdApp } from 'antd'
import { HomePage } from '../HomePage'
import { ChannelType } from '@shared/types/channel'
import type { ServerDetail } from '@shared/types/server'
import { useUIStore } from '@renderer/stores/uiStore'
import { useServerStore } from '@renderer/stores/serverStore'
import { useChannelStore } from '@renderer/stores/channelStore'

// antd App.useApp() resolves against the nearest <App> context. Wrap renders
// in <AntdApp> so messageApi (and onClose unmount) work without a real App root.
function renderPage(): void {
  render(
    <AntdApp>
      <HomePage params={{}} />
    </AntdApp>
  )
}

// Sample currentServer with one category, one text and one voice channel.
const server: ServerDetail = {
  id: 1,
  name: '测试服务器',
  iconUrl: '',
  bannerUrl: '',
  description: 'desc',
  ownerId: 1,
  inviteCode: 'code',
  isPrivate: false,
  maxMembers: 100,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  memberCount: 3,
  channels: [
    { id: 10, serverId: 1, name: '文字', type: ChannelType.Text, topic: '', parentId: null, position: 1, bitrate: 0, userLimit: 0, slowMode: 0, createdAt: '', updatedAt: '' },
    { id: 20, serverId: 1, name: '语音', type: ChannelType.Voice, topic: '', parentId: null, position: 2, bitrate: 0, userLimit: 0, slowMode: 0, createdAt: '', updatedAt: '' },
    { id: 30, serverId: 1, name: '分类', type: ChannelType.Category, topic: '', parentId: null, position: 3, bitrate: 0, userLimit: 0, slowMode: 0, createdAt: '', updatedAt: '' },
  ],
}

beforeEach(() => {
  vi.resetAllMocks()
  // Default mock: createChannel resolves + refreshes channel tree.
  useChannelStore.setState({ createChannel: vi.fn().mockImplementation(async () => {}) })
  // Start from a "no server" empty state.
  useServerStore.setState({ currentServer: null, members: [] })
  useUIStore.setState({ activeViewId: 'server-home', activeViewParams: {}, currentChannelId: null, currentServerId: null })
})

describe('HomePage', () => {
  describe('empty state (no currentServer)', () => {
    it('should render NoChannelSelected empty state', () => {
      renderPage()
      expect(screen.getByText('欢迎使用 Macto')).toBeInTheDocument()
      expect(screen.queryByText('创建频道')).not.toBeInTheDocument()
    })
  })

  describe('with a current server', () => {
    beforeEach(() => {
      useServerStore.setState({ currentServer: server })
    })

    it('should render server name and channel entries', () => {
      renderPage()
      expect(screen.getByText('测试服务器')).toBeInTheDocument()
      expect(screen.getByText('文字')).toBeInTheDocument()
      // '语音' appears in both the quick-action card and a channel entry
      expect(screen.getAllByText('语音').length).toBeGreaterThan(0)
    })

    it('should open create-channel modal when clicking 创建频道 and NOT auto-close while empty', async () => {
      const user = userEvent.setup()
      renderPage()
      // No modal initially
      expect(screen.queryByText('频道名称')).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /创建频道/ }))
      expect(screen.getByText('频道名称')).toBeInTheDocument()

      // Create button is disabled until a name is typed
      const save = screen.getByRole('button', { name: '创建' })
      expect(save).toBeDisabled()
      expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument()
    })

    it('should call channelStore.createChannel and close modal on save', async () => {
      const user = userEvent.setup()
      const createChannel = vi.fn().mockResolvedValue(undefined)
      useChannelStore.setState({ createChannel })

      renderPage()
      await user.click(screen.getByRole('button', { name: /创建频道/ }))

      await user.type(screen.getByPlaceholderText('频道名称'), '新频道')

      // switch to voice type
      await user.click(screen.getByLabelText('语音频道'))

      await user.click(screen.getByRole('button', { name: '创建' }))

      await waitFor(() => {
        expect(createChannel).toHaveBeenCalledWith(1, {
          name: '新频道',
          type: ChannelType.Voice,
          topic: '',
          parentId: undefined,
        })
      })
      // modal closes on success
      await waitFor(() => {
        expect(screen.queryByText('频道名称')).not.toBeInTheDocument()
      })
    })

    it('should not close modal when createChannel fails', async () => {
      const user = userEvent.setup()
      useChannelStore.setState({
        createChannel: vi.fn().mockRejectedValue(new Error('创建频道失败')),
      })

      renderPage()
      await user.click(screen.getByRole('button', { name: /创建频道/ }))
      await user.type(screen.getByPlaceholderText('频道名称'), '坏频道')
      await user.click(screen.getByRole('button', { name: '创建' }))

      // modal stays open on failure
      await waitFor(() => {
        expect(screen.getByText('频道名称')).toBeInTheDocument()
      })
    })
  })
})
