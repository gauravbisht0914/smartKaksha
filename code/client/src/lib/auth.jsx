import { createContext, useCallback, useContext, useMemo } from 'react'
import useSWR from 'swr'
import { api, getToken, setToken } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const { data, isLoading, mutate } = useSWR(getToken() ? '/auth/me' : null, (p) => api(p), {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    onError: () => setToken(null),
  })

  const authenticate = useCallback(
    async (path, body) => {
      const result = await api(path, { method: 'POST', body })
      setToken(result.token)
      await mutate({ user: result.user }, { revalidate: false })
      return result.user
    },
    [mutate],
  )

  const logout = useCallback(async () => {
    setToken(null)
    await mutate(undefined, { revalidate: false })
  }, [mutate])

  const value = useMemo(
    () => ({
      user: data?.user ?? null,
      loading: Boolean(getToken()) && isLoading,
      login: (email, password) => authenticate('/auth/login', { email, password }),
      signup: (form) => authenticate('/auth/signup', form),
      logout,
    }),
    [data, isLoading, authenticate, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
