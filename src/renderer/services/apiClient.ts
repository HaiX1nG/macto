import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios'
import type { ApiResponse, LoginResponse, RefreshTokenResponse } from '@shared/types/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'

class ApiClient {
  private instance: AxiosInstance
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private isRefreshing: boolean = false

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
    this.loadTokensFromStorage()
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Skip auth for login/register endpoints
        const isAuthEndpoint = config.url?.includes('/auth/login') || config.url?.includes('/auth/register')
        if (this.accessToken && config.headers && !isAuthEndpoint) {
          config.headers.Authorization = `Bearer ${this.accessToken}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor - handle errors and token refresh
    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

        // Only handle 401 for requests that are NOT auth endpoints
        if (error.response?.status === 401 && originalRequest) {
          // Check if this is a login/register request - don't retry these
          const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
                                  originalRequest.url?.includes('/auth/register') ||
                                  originalRequest.url?.includes('/auth/refresh')

          if (isAuthEndpoint) {
            // For auth endpoints, just reject - don't try to refresh
            return Promise.reject(error)
          }

          // If already retried, don't try again
          if (originalRequest._retry) {
            this.clearTokens()
            window.dispatchEvent(new CustomEvent('auth:logout'))
            return Promise.reject(error)
          }

          // If we have a refresh token and not already refreshing, try to refresh
          if (this.refreshToken && !this.isRefreshing) {
            originalRequest._retry = true
            this.isRefreshing = true

            try {
              const newToken = await this.doRefreshToken()
              this.isRefreshing = false

              // Retry original request with new token
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`
              }
              return this.instance(originalRequest)
            } catch (refreshError) {
              this.isRefreshing = false
              this.clearTokens()
              window.dispatchEvent(new CustomEvent('auth:logout'))
              return Promise.reject(refreshError)
            }
          }

          // No refresh token or already refreshing - clear and logout
          if (!this.refreshToken) {
            this.clearTokens()
            window.dispatchEvent(new CustomEvent('auth:logout'))
          }
        }

        return Promise.reject(error)
      }
    )
  }

  private async doRefreshToken(): Promise<string> {
    try {
      const response = await this.instance.post<ApiResponse<RefreshTokenResponse>>(
        '/auth/refresh',
        { refreshToken: this.refreshToken }
      )

      const { accessToken, refreshToken } = response.data.data
      this.setTokens(accessToken, refreshToken)
      return accessToken
    } catch (err) {
      console.error('Token refresh failed:', err)
      throw err
    }
  }

  private loadTokensFromStorage() {
    const accessToken = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken')
    if (accessToken && refreshToken) {
      this.setTokens(accessToken, refreshToken)
    }
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
  }

  clearTokens() {
    this.accessToken = null
    this.refreshToken = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  getAccessToken(): string | null {
    return this.accessToken
  }

  isAuthenticated(): boolean {
    return !!this.accessToken
  }

  // Generic request methods
  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const response = await this.instance.get<ApiResponse<T>>(url, { params })
    return response.data.data
  }

  async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.instance.post<ApiResponse<T>>(url, data)
    return response.data.data
  }

  async put<T>(url: string, data?: unknown): Promise<T> {
    const response = await this.instance.put<ApiResponse<T>>(url, data)
    return response.data.data
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.instance.delete<ApiResponse<T>>(url)
    return response.data.data
  }

  // Auth-specific methods
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await this.post<LoginResponse>('/auth/login', { username, password })
    this.setTokens(response.accessToken, response.refreshToken)
    return response
  }

  async register(username: string, password: string, email: string): Promise<LoginResponse> {
    const response = await this.post<LoginResponse>('/auth/register', { username, password, email })
    this.setTokens(response.accessToken, response.refreshToken)
    return response
  }

  logout() {
    this.clearTokens()
    window.dispatchEvent(new CustomEvent('auth:logout'))
  }
}

export const apiClient = new ApiClient()
export default apiClient