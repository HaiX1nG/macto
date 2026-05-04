import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios'
import type { ApiResponse, LoginResponse, RefreshTokenResponse } from '@shared/types/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'

class ApiClient {
  private instance: AxiosInstance
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private refreshPromise: Promise<string> | null = null

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
        if (this.accessToken && config.headers) {
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
        const originalRequest = error.config

        // If 401, handle token refresh or logout
        if (error.response?.status === 401 && originalRequest) {
          // If we have a refresh token, try to refresh
          if (this.refreshToken) {
            // Prevent multiple refresh requests
            if (!this.refreshPromise) {
              this.refreshPromise = this.doRefreshToken()
            }

            try {
              const newToken = await this.refreshPromise
              this.refreshPromise = null

              // Retry original request with new token
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`
              }
              return this.instance(originalRequest)
            } catch (refreshError) {
              this.refreshPromise = null
              this.clearTokens()
              window.dispatchEvent(new CustomEvent('auth:logout'))
              return Promise.reject(refreshError)
            }
          }

          // No refresh token, clear and logout
          this.clearTokens()
          window.dispatchEvent(new CustomEvent('auth:logout'))
        }

        return Promise.reject(error)
      }
    )
  }

  private async doRefreshToken(): Promise<string> {
    const response = await this.instance.post<ApiResponse<RefreshTokenResponse>>(
      '/auth/refresh',
      { refreshToken: this.refreshToken }
    )

    const { accessToken, refreshToken } = response.data.data
    this.setTokens(accessToken, refreshToken)
    return accessToken
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