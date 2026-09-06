import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/types'

interface AuthState {
  user:  AuthUser | null
  token: string | null
  isAuthenticated: boolean
  role: string | null

  setAuth: (user: AuthUser, token: string) => void
  setRole: (role: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:            null,
      token:           null,
      isAuthenticated: false,
      role:            null,

      setAuth: (user, token) =>
        set({ user, token, isAuthenticated: true }),

      setRole: (role) =>
        set({ role }),

      logout: () =>
        set({ user: null, token: null, isAuthenticated: false, role: null }),
    }),
    {
      name: 'perpustakaan-auth',
      // Hanya persist token dan user dasar, bukan data sensitif lain
      partialize: (state) => ({
        user:  state.user,
        token: state.token,
        role:  state.role,
      }),
    },
  ),
)
