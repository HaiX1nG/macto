import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios'
import type { ApiResponse, LoginResponse, RefreshTokenResponse } from '@shared/types/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api/v1'
const IS_DEV = import.meta.env.DEV

/**
 * Custom error class for API errors with detailed information
 */
export class ApiClientError extends Error {
  public readonly statusCode: number
  public readonly businessCode?: number
  public readonly errorData?: unknown

  constructor(
    message: string,
    statusCode: number,
    businessCode?: number,
    errorData?: unknown
  ) {
    super(message)
    this.name = 'ApiClientError'
    this.statusCode = statusCode
    this.businessCode = businessCode
    this.errorData = errorData
  }
}

/**
 * Extract readable error message from backend response
 */
function extractErrorMessage(error: AxiosError<ApiResponse<unknown>>): string {
  const responseData = error.response?.data

  // Try to get message from backend response
  if (responseData && typeof responseData === 'object') {
    if ('message' in responseData && typeof responseData.message === 'string') {
      return responseData.message
    }
    if ('error' in responseData && typeof responseData.error === 'string') {
      return responseData.error
    }
    if ('msg' in responseData && typeof responseData.msg === 'string') {
      return responseData.msg
    }
  }

  // Fallback to HTTP status text or generic message
  return error.message || 'An unexpected error occurred'
}

/**
 * Get user-friendly error message based on HTTP status code
 */
function getHttpStatusMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Bad Request: The request was malformed or invalid'
    case 401:
      return 'Unauthorized: Authentication failed or token expired'
    case 403:
      return 'Forbidden: You do not have permission to access this resource'
    case 404:
      return 'Not Found: The requested resource does not exist'
    case 409:
      return 'Conflict: The request conflicts with the current state'
    case 422:
      return 'Unprocessable Entity: Validation failed'
    case 429:
      return 'Too Many Requests: Please try again later'
    case 500:
      return 'Internal Server Error: Something went wrong on the server'
    case 502:
      return 'Bad Gateway: The server received an invalid response'
    case 503:
      return 'Service Unavailable: The server is temporarily unavailable'
    case 504:
      return 'Gateway Timeout: The server did not respond in time'
    default:
      return `HTTP Error ${status}: An error occurred`
  }
}

/**
 * Log request details in development mode
 */
function logRequest(config: InternalAxiosRequestConfig): void {
  if (!IS_DEV) return

  const method = config.method?.toUpperCase() || 'GET'
  const url = config.url || ''
  const fullUrl = `${config.baseURL}${url}`

  // eslint-disable-next-line no-console
  console.group(`%c[API Request] ${method} ${url}`, 'color: #2196F3; font-weight: bold')
  // eslint-disable-next-line no-console
  console.log('Full URL:', fullUrl)
  if (config.params && Object.keys(config.params).length > 0) {
    // eslint-disable-next-line no-console
    console.log('Query Params:', config.params)
  }
  if (config.data) {
    // eslint-disable-next-line no-console
    console.log('Request Body:', config.data)
  }
  if (config.headers.Authorization) {
    // eslint-disable-next-line no-console
    console.log('Auth:', 'Bearer token present')
  }
  // eslint-disable-next-line no-console
  console.groupEnd()
}

/**
 * Log response details in development mode
 */
function logResponse(response: AxiosResponse): void {
  if (!IS_DEV) return

  const method = response.config.method?.toUpperCase() || 'GET'
  const url = response.config.url || ''
  const status = response.status

  const statusColor = status >= 200 && status < 300 ? '#4CAF50' : '#FF5722'

  // eslint-disable-next-line no-console
  console.group(`%c[API Response] ${method} ${url} - ${status}`, `color: ${statusColor}; font-weight: bold`)
  // eslint-disable-next-line no-console
  console.log('Status:', `${status} ${response.statusText}`)
  // eslint-disable-next-line no-console
  console.log('Data:', response.data)
  // eslint-disable-next-line no-console
  console.groupEnd()
}

/**
 * Log error details in development mode
 */
function logError(error: AxiosError<ApiResponse<unknown>>): void {
  if (!IS_DEV) return

  const method = error.config?.method?.toUpperCase() || 'GET'
  const url = error.config?.url || ''
  const status = error.response?.status || 'NETWORK_ERROR'

  // eslint-disable-next-line no-console
  console.group(`%c[API Error] ${method} ${url} - ${status}`, 'color: #F44336; font-weight: bold')
  if (error.response) {
    // eslint-disable-next-line no-console
    console.log('Status:', `${error.response.status} ${error.response.statusText}`)
    // eslint-disable-next-line no-console
    console.log('Response Data:', error.response.data)
  } else if (error.request) {
    // eslint-disable-next-line no-console
    console.log('No Response Received')
    // eslint-disable-next-line no-console
    console.log('Request:', error.request)
  } else {
    // eslint-disable-next-line no-console
    console.log('Error Message:', error.message)
  }
  // eslint-disable-next-line no-console
  console.groupEnd()
}

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
    // Request interceptor - add auth token and logging
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Skip auth for login/register endpoints
        const isAuthEndpoint = config.url?.includes('/auth/login') || config.url?.includes('/auth/register')
        if (this.accessToken && config.headers && !isAuthEndpoint) {
          config.headers.Authorization = `Bearer ${this.accessToken}`
        }

        // Log request in development mode
        logRequest(config)

        return config
      },
      (error) => {
        if (IS_DEV) {
          console.error('[API Request Error]', error)
        }
        return Promise.reject(error)
      }
    )

    // Response interceptor - handle errors, logging, and token refresh
    this.instance.interceptors.response.use(
      (response) => {
        // Log successful response
        logResponse(response)
        return response
      },
      async (error: AxiosError<ApiResponse<unknown>>) => {
        // Log error in development mode
        logError(error)

        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

        // Handle network errors (no response)
        if (!error.response) {
          const networkError = new ApiClientError(
            'Network Error: Unable to connect to the server. Please check your internet connection.',
            0
          )
          return Promise.reject(networkError)
        }

        const statusCode = error.response.status
        const responseData = error.response.data

        // Extract business code if present
        const businessCode = responseData && typeof responseData === 'object' && 'code' in responseData
          ? (responseData as { code?: number }).code
          : undefined

        // Only handle 401 for requests that are NOT auth endpoints
        if (statusCode === 401 && originalRequest) {
          // Check if this is a login/register request - don't retry these
          const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
                                  originalRequest.url?.includes('/auth/register') ||
                                  originalRequest.url?.includes('/auth/refresh')

          if (isAuthEndpoint) {
            // For auth endpoints, create specific error and reject
            const authError = new ApiClientError(
              extractErrorMessage(error) || 'Authentication failed',
              statusCode,
              businessCode,
              responseData
            )
            return Promise.reject(authError)
          }

          // If already retried, don't try again
          if (originalRequest._retry) {
            this.clearTokens()
            window.dispatchEvent(new CustomEvent('auth:logout'))
            const authExpiredError = new ApiClientError(
              'Session expired. Please log in again.',
              statusCode,
              businessCode,
              responseData
            )
            return Promise.reject(authExpiredError)
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
            } catch (_refreshError) {
              this.isRefreshing = false
              this.clearTokens()
              window.dispatchEvent(new CustomEvent('auth:logout'))
              const refreshFailedError = new ApiClientError(
                'Session refresh failed. Please log in again.',
                statusCode,
                businessCode,
                responseData
              )
              return Promise.reject(refreshFailedError)
            }
          }

          // No refresh token or already refreshing - clear and logout
          if (!this.refreshToken) {
            this.clearTokens()
            window.dispatchEvent(new CustomEvent('auth:logout'))
          }
        }

        // Create detailed error for other HTTP status codes
        const errorMessage = extractErrorMessage(error) || getHttpStatusMessage(statusCode)
        const apiError = new ApiClientError(
          errorMessage,
          statusCode,
          businessCode,
          responseData
        )

        return Promise.reject(apiError)
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
