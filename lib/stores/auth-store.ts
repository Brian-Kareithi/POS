import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User } from "@/lib/types"

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User) => void
  setTokens: (token: string, refreshToken: string) => void
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (user: Partial<User>) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      setTokens: (token, refreshToken) => set({ token, refreshToken }),
      login: async (email, password) => {
        set({ isLoading: true })
        try {
          await new Promise((r) => setTimeout(r, 800))
          const { mockUsers } = await import("@/lib/constants/mock-data")
          // Saved staff (including anyone added in Staff settings) come first, then the demo accounts.
          const { useDataStore } = await import("@/lib/stores/data-store")
          const saved = useDataStore.getState().users.find((u) => u.email.toLowerCase() === email.toLowerCase())
          const foundUser = saved ?? mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase())
          if (foundUser && useDataStore.getState().employees.find((e) => e.userId === foundUser.id)?.isActive === false) throw new Error("This account has been switched off. Ask the owner.")
          if (!foundUser) throw new Error("Invalid credentials")
          set({
            user: foundUser,
            token: "mock-jwt-token-" + Date.now(),
            refreshToken: "mock-refresh-token-" + Date.now(),
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },
      logout: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: "pos-auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
