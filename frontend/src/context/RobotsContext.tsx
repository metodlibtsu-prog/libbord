import { createContext, useContext, useState, type ReactNode } from 'react'

interface RobotsContextValue {
  excludeRobots: boolean
  setExcludeRobots: (v: boolean) => void
}

const RobotsContext = createContext<RobotsContextValue>({
  excludeRobots: true,
  setExcludeRobots: () => {},
})

export function RobotsProvider({ children }: { children: ReactNode }) {
  const [excludeRobots, setExcludeRobotsState] = useState<boolean>(() => {
    const saved = localStorage.getItem('excludeRobots')
    return saved === null ? true : saved === 'true'
  })

  const setExcludeRobots = (v: boolean) => {
    localStorage.setItem('excludeRobots', String(v))
    setExcludeRobotsState(v)
  }

  return (
    <RobotsContext.Provider value={{ excludeRobots, setExcludeRobots }}>
      {children}
    </RobotsContext.Provider>
  )
}

export function useRobots() {
  return useContext(RobotsContext)
}
