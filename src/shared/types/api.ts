/**
 * API Types - Legacy compatibility re-export
 *
 * All types have been migrated to domain-specific files.
 * This file re-exports from those files so that existing imports
 * from '@shared/types/api' continue to resolve during the migration period.
 *
 * @deprecated Import from specific domain files or '@shared/types' instead.
 */

export type {
  ApiResponse,
  PaginatedData,
  PaginationParams,
} from './common'

export type {
  UserStatus,
  RegisterRequest,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  UpdateProfileRequest,
  ChangePasswordRequest,
  UserInfoResponse,
  SetCustomStatusRequest,
  UserOnlineStatusResponse,
  DeleteAccountRequest,
} from './auth'

export type {
  Permission,
  PermissionKey,
} from './permission'

export type {
  Server,
  ServerDetail,
  Role,
  ServerMember,
  CreateServerRequest,
  UpdateServerRequest,
  JoinServerRequest,
  UpdateServerMemberRequest,
  CreateRoleRequest,
  UpdateRoleRequest,
} from './server'

export type {
  ChannelType,
  Channel,
  ChannelTreeNode,
  CreateChannelRequest,
  UpdateChannelRequest,
  ReorderChannelsRequest,
} from './channel'

export type {
  MessageType,
  MessageAttachment,
  MessageReaction,
  ChannelMessage,
  SendMessageRequest,
  UpdateMessageRequest,
  ReactionRequest,
  MessageListParams,
} from './message'

export type {
  VoiceParticipant,
  SetMuteRequest,
  ScreenShareSession,
  WebRTCSignalRequest,
} from './voice'

export type {
  PlaylistItemStatus,
  PlaylistItem,
  AddPlaylistItemRequest,
  ReorderPlaylistRequest,
} from './playlist'

export type {
  FriendRequestStatus,
  FriendRequest,
  Friendship,
  PrivateMessage,
  Conversation,
  SendFriendRequestPayload,
  HandleFriendRequestPayload,
  SendPrivateMessageRequest,
} from './friend'
