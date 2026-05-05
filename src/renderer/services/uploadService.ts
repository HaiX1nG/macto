import apiClient from './apiClient'
import type { ApiResponse } from '@shared/types/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'

export interface UploadResponse {
  url: string
  filename: string
  size: number
  type: 'image' | 'video' | 'audio' | 'file'
}

export const uploadService = {
  async uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const accessToken = apiClient.getAccessToken()
    if (!accessToken) {
      throw new Error('未登录')
    }

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: '上传失败' }))
      throw new Error(errorData.message || '上传失败')
    }

    const result: ApiResponse<UploadResponse> = await response.json()
    return result.data
  },

  async uploadImage(file: File): Promise<UploadResponse> {
    if (!file.type.startsWith('image/')) {
      throw new Error('只能上传图片文件')
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      throw new Error('图片大小不能超过 10MB')
    }

    return this.uploadFile(file)
  },

  async uploadAttachment(file: File): Promise<UploadResponse> {
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      throw new Error('文件大小不能超过 50MB')
    }

    return this.uploadFile(file)
  },

  getFileType(file: File): 'image' | 'video' | 'audio' | 'file' {
    if (file.type.startsWith('image/')) return 'image'
    if (file.type.startsWith('video/')) return 'video'
    if (file.type.startsWith('audio/')) return 'audio'
    return 'file'
  },
}

export default uploadService