import { createContext, useContext, useState, type ReactNode } from 'react'

interface Session {
  access_token: string
}

interface AuthContextValue {
  session: Session | null
  loading: boolean
  setSession: (session: Session | null) => void
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  loading: false,
  setSession: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(() => {
    const token = localStorage.getItem('access_token')
    return token ? { access_token: token } : null
  })

  function setSession(s: Session | null) {
    if (s) {
      localStorage.setItem('access_token', s.access_token)
    } else {
      localStorage.removeItem('access_token')
    }
    setSessionState(s)
  }

  return (
    <AuthContext.Provider value={{ session, loading: false, setSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
