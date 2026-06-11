import type { ReactNode } from 'react'

type CalloutType = 'info' | 'warning' | 'tip' | 'danger'

interface CalloutProps {
  type?: CalloutType
  children: ReactNode
}

const calloutStyles: Record<CalloutType, { bg: string; border: string; icon: string; iconColor: string }> = {
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    iconColor: 'text-blue-500',
  },
  warning: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    iconColor: 'text-yellow-500',
  },
  tip: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
    iconColor: 'text-green-500',
  },
  danger: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    iconColor: 'text-red-500',
  },
}

export function Callout({ type = 'info', children }: CalloutProps) {
  const styles = calloutStyles[type]

  return (
    <div className={`my-6 p-4 rounded-xl ${styles.bg} border ${styles.border}`}>
      <div className="flex gap-3">
        <svg
          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.iconColor}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={styles.icon} />
        </svg>
        <div className="text-foreground-secondary text-sm [&>p]:m-0">
          {children}
        </div>
      </div>
    </div>
  )
}
