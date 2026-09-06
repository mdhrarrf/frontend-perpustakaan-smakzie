import apiClient from './client'
import type { ApiResponse, AuthUser, LoginCredentials } from '@/types'

export const authService = {
  async login(credentials: LoginCredentials): Promise<{ user: AuthUser; token: string }> {
    const { data } = await apiClient.post<ApiResponse<AuthUser>>('/auth/login', credentials)
    const user = data.data!
    return { user, token: user.token! }
  },

  async me(): Promise<AuthUser> {
    const { data } = await apiClient.get<ApiResponse<AuthUser>>('/auth/me')
    return data.data!
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout')
  },
}
