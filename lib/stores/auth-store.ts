import { create } from "zustand"
import { persist } from "zustand/middleware"
import { ApiError, api, configureApi } from "@/lib/api/client"
import { clean } from "@/lib/api/mappers"
import type { User } from "@/lib/types"

interface LoginResult {
  user: Record<string, unknown>
  accessToken: string
  refreshToken: string
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  /** True once this browser session's token has been checked against the server (not persisted). */
  validated: boolean
  /** Checks the stored token with the server. Resolves false (and clears the session) when it is missing or no longer valid. */
  validate: () => Promise<boolean>
  setUser: (user: User) => void
  setTokens: (token: string, refreshToken: string) => void
  login: (email: string, password: string, totpCode?: string) => Promise<void>
  logout: () => Promise<void>
  /** Re-reads the signed-in user (role, branch) from the server. */
  refreshUser: () => Promise<void>
  updateUser: (user: Partial<User>) => void
  setLoading: (loading: boolean) => void
}

const toUser = (raw: Record<string, unknown>): User => clean<User>(raw)

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      validated: false,
      validate: async () => {
        if (!get().token) { set({ validated: true, isAuthenticated: false, user: null }); return false }
        try {
          await get().refreshUser()
          set({ validated: true })
          return true
        } catch (e) {
          // No connection is not the same as a bad token: a till must keep working offline.
          if (e instanceof ApiError && e.status === 0) { set({ validated: true }); return true }
          set({ user: null, token: null, refreshToken: null, isAuthenticated: false, validated: true })
          return false
        }
      },
      setUser: (user) => set({ user, isAuthenticated: true }),
      setTokens: (token, refreshToken) => set({ token, refreshToken }),
      login: async (email, password, totpCode) => {
        set({ isLoading: true })
        try {
          const res = await api<LoginResult>("/auth/login", { method: "POST", public: true, body: { email, password, ...(totpCode ? { totpCode } : {}) } })
          set({ user: toUser(res.user), token: res.accessToken, refreshToken: res.refreshToken, isAuthenticated: true, isLoading: false, validated: true })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },
      logout: async () => {
        const { refreshToken, token } = get()
        // Clear locally first so the UI leaves immediately; revoking on the server is best effort.
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false, validated: false })
        const { useDataStore } = await import("@/lib/stores/data-store")
        useDataStore.getState().reset()
        if (token) {
          try {
            await fetch(`${(await import("@/lib/api/client")).API_BASE}/auth/logout`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify(refreshToken ? { refreshToken } : {}),
            })
          } catch { /* offline: the refresh token simply expires */ }
        }
      },
      refreshUser: async () => {
        const me = await api<Record<string, unknown>>("/auth/me")
        set({ user: toUser(me) })
      },
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: "pos-auth",
      version: 2,
      // Sessions from the old demo login carry fake tokens; drop them so everyone signs in against the server.
      migrate: () => ({ user: null, token: null, refreshToken: null, isAuthenticated: false }) as never,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

configureApi({
  get: () => ({ accessToken: useAuthStore.getState().token, refreshToken: useAuthStore.getState().refreshToken }),
  set: (token, refreshToken) => useAuthStore.setState({ token, refreshToken }),
  lost: () => {
    useAuthStore.setState({ user: null, token: null, refreshToken: null, isAuthenticated: false })
    void import("@/lib/stores/data-store").then((m) => m.useDataStore.getState().reset())
  },
})
