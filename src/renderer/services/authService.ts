import apiClient from './apiClient'
import type {
  LoginResponse,
  UserInfoResponse,
  UpdateProfileRequest,
  ChangePasswordRequest,
  SetCustomStatusRequest,
  UserOnlineStatusResponse,
} from '@shared/types/api'

export const authService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    return apiClient.login(username, password)
  },

  async register(username: string, password: string, email: string): Promise<LoginResponse> {
    return apiClient.register(username, password, email)
  },

  async refreshToken(): Promise<void> {
    // Handled automatically by apiClient interceptor
  },

  async getUserInfo(): Promise<UserInfoResponse> {
    return apiClient.get<UserInfoResponse>('/user/info')
  },

  async updateProfile(data: UpdateProfileRequest): Promise<UserInfoResponse> {
    return apiClient.put<UserInfoResponse>('/user/profile', data)
  },

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    return apiClient.put('/user/password', data)
  },

  async setCustomStatus(data: SetCustomStatusRequest): Promise<void> {
    return apiClient.put('/user/status', data)
  },

  async getUserOnlineStatus(userId: number): Promise<UserOnlineStatusResponse> {
    return apiClient.get<UserOnlineStatusResponse>(`/users/${userId}/online`)
  },

  async getUserInfoById(userId: number): Promise<UserInfoResponse> {
    return apiClient.get<UserInfoResponse>(`/users/${userId}/info`)
  },

  async deleteAccount(): Promise<void> {
    return apiClient.delete('/user/account')
  },

  logout(): void {
    apiClient.logout()
  },

  isAuthenticated(): boolean {
    return apiClient.isAuthenticated()
  },

  getAccessToken(): string | null {
    return apiClient.getAccessToken()
  },
}

export default authService