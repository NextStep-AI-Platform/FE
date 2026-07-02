import { createContext, useCallback, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  setAuthTheming: (enabled: boolean) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
  setAuthTheming: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('ns-theme') as Theme) ?? 'dark'
  })
  const [authTheming, setAuthTheming] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    if (!authTheming) {
      root.classList.remove('light')
      return
    }
    root.classList.toggle('light', theme === 'light')
    localStorage.setItem('ns-theme', theme)
  }, [theme, authTheming])

  const toggleTheme = useCallback(() => {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setAuthTheming }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
