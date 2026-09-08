import apiClient from './apiClient'
import type {
  Channel,
  ChannelTreeNode,
  CreateChannelRequest,
  UpdateChannelRequest,
  ReorderChannelsRequest,
} from '@shared/types/channel'

export const channelService = {
  async createChannel(serverId: number, data: CreateChannelRequest): Promise<Channel> {
    return apiClient.post<Channel>(`/servers/${serverId}/channels`, data)
  },

  async getChannelTree(serverId: number): Promise<ChannelTreeNode[]> {
    return apiClient.get<ChannelTreeNode[]>(`/servers/${serverId}/channels`)
  },

  async updateChannel(
    serverId: number,
    channelId: number,
    data: UpdateChannelRequest
  ): Promise<Channel> {
    return apiClient.put<Channel>(`/servers/${serverId}/channels/${channelId}`, data)
  },

  async deleteChannel(serverId: number, channelId: number): Promise<void> {
    return apiClient.delete<void>(`/servers/${serverId}/channels/${channelId}`)
  },

  async reorderChannels(serverId: number, data: ReorderChannelsRequest): Promise<void> {
    return apiClient.put<void>(`/servers/${serverId}/channels/reorder`, data)
  },
}

export default channelService
