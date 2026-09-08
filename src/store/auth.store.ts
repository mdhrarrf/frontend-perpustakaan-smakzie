import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/types'

interface AuthState {
  user:  AuthUser | null
  token: string | null
  isAuthenticated: boolean
  role: string | null
  rememberMe: boolean

  setAuth: (user: AuthUser, token: string, role?: string, rememberMe?: boolean) => void
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
      rememberMe:      true,

      setAuth: (user, token, role, rememberMe = true) =>
        set((state) => ({
          user,
          token,
          isAuthenticated: true,
          role: role ?? (user as any)?.role ?? state.role,
          rememberMe,
        })),

      setRole: (role) =>
        set({ role }),

      logout: () =>
        set({ user: null, token: null, isAuthenticated: false, role: null }),
    }),
    {
      name: 'perpustakaan-auth',
      partialize: (state) => ({
        user:            state.user,
        token:           state.token,
        role:            state.role,
        isAuthenticated: Boolean(state.token),
        rememberMe:      state.rememberMe,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.token) {
          state.isAuthenticated = true
        }
      },
    },
  ),
)
