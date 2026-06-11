/**
 * ThemeToggle Component
 * Dark/light mode switch
 */

import { motion } from 'framer-motion'
import type { Theme } from '@/hooks/useTheme'

export interface ThemeToggleProps {
  /** Current theme */
  theme: Theme

  /** Callback when theme changes */
  onToggle: () => void

  /** Test ID for E2E testing */
  testId?: string
}

export function ThemeToggle({ theme, onToggle, testId }: ThemeToggleProps) {
  const isDark = theme === 'dark'

  return (
    <button
      onClick={onToggle}
      className={`
        relative inline-flex items-center justify-center
        w-11 h-11 rounded-xl
        bg-bg-tertiary/50 hover:bg-bg-tertiary
        border border-border hover:border-border-hover
        transition-all duration-200
        hover:shadow-md
      `}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      data-testid={testId}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 0 : 180 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="relative w-5 h-5"
      >
        {/* Sun icon */}
        <motion.svg
          className="absolute inset-0 text-amber-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          initial={false}
          animate={{ opacity: isDark ? 0 : 1, scale: isDark ? 0.5 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </motion.svg>

        {/* Moon icon */}
        <motion.svg
          className="absolute inset-0 text-accent-secondary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          initial={false}
          animate={{ opacity: isDark ? 1 : 0, scale: isDark ? 1 : 0.5 }}
          transition={{ duration: 0.2 }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </motion.svg>
      </motion.div>
    </button>
  )
}
