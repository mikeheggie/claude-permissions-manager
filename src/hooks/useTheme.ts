/**
 * useTheme Hook
 * Theme preference management with system detection and localStorage persistence
 */

import { useState, useCallback, useEffect, useRef } from 'react'

export type Theme = 'dark' | 'light'

const THEME_STORAGE_KEY = 'theme-preference'

export interface UseThemeReturn {
  /** Current theme */
  theme: Theme

  /** Toggle between themes */
  toggle: () => void

  /** Set specific theme */
  setTheme: (theme: Theme) => void

  /** Whether system prefers dark mode */
  systemPrefersDark: boolean

  /** Reset to system preference (clears stored preference) */
  resetToSystem: () => void
}

/**
 * Get the system's preferred color scheme.
 */
function getSystemPreference(): Theme {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Get stored theme preference from localStorage.
 */
function getStoredPreference(): Theme | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') {
      return stored
    }
  } catch {
    // localStorage may not be available
  }
  return null
}

/**
 * Store theme preference in localStorage.
 */
function storePreference(theme: Theme): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // localStorage may not be available
  }
}

/**
 * Clear stored theme preference from localStorage.
 */
function clearStoredPreference(): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.removeItem(THEME_STORAGE_KEY)
  } catch {
    // localStorage may not be available
  }
}

/**
 * Get initial theme: stored preference > system preference
 */
function getInitialTheme(): Theme {
  const stored = getStoredPreference()
  if (stored) {
    return stored
  }
  return getSystemPreference()
}

/**
 * Apply the theme class to the document root with smooth transition.
 */
function applyTheme(theme: Theme, enableTransition: boolean = false): void {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement

  // Add transition class for smooth theme change
  if (enableTransition) {
    root.classList.add('theme-transition')
  }

  if (theme === 'light') {
    root.classList.add('light')
    root.classList.remove('dark')
  } else {
    root.classList.add('dark')
    root.classList.remove('light')
  }

  // Remove transition class after animation completes
  if (enableTransition) {
    setTimeout(() => {
      root.classList.remove('theme-transition')
    }, 550) // Slightly longer than the longest transition (500ms)
  }
}

/**
 * Hook for managing theme preference with system detection.
 * Theme preference is persisted to localStorage when explicitly set by user.
 */
export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() =>
    getSystemPreference() === 'dark'
  )
  const isInitialMount = useRef(true)
  const hasUserPreference = useRef<boolean>(getStoredPreference() !== null)

  // Apply theme on mount and when it changes
  useEffect(() => {
    // Skip transition on initial mount to avoid flash
    const enableTransition = !isInitialMount.current
    applyTheme(theme, enableTransition)
    isInitialMount.current = false
  }, [theme])

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent): void => {
      setSystemPrefersDark(e.matches)
      // Only auto-update if user hasn't set an explicit preference
      if (!hasUserPreference.current) {
        setThemeState(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  /**
   * Set the theme and persist to localStorage.
   */
  const setTheme = useCallback((newTheme: Theme): void => {
    setThemeState(newTheme)
    storePreference(newTheme)
    hasUserPreference.current = true
  }, [])

  /**
   * Toggle between dark and light themes.
   */
  const toggle = useCallback((): void => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }, [theme, setTheme])

  /**
   * Reset to system preference and clear stored preference.
   */
  const resetToSystem = useCallback((): void => {
    clearStoredPreference()
    hasUserPreference.current = false
    setThemeState(getSystemPreference())
  }, [])

  return {
    theme,
    toggle,
    setTheme,
    systemPrefersDark,
    resetToSystem,
  }
}
