import { useState, useCallback } from 'react'
import type { ReactNode, HTMLAttributes } from 'react'

interface CodeBlockProps extends HTMLAttributes<HTMLPreElement> {
  children?: ReactNode
}

export function CodeBlock({ children, className, ...props }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    // Extract text content from children
    const codeElement = (children as React.ReactElement)?.props?.children
    const text = typeof codeElement === 'string'
      ? codeElement
      : extractTextFromChildren(children)

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      console.error('Failed to copy to clipboard')
    }
  }, [children])

  return (
    <div className="relative group my-6">
      <pre
        className={`${className || ''} rounded-xl overflow-x-auto p-5 bg-bg-tertiary border border-border border-l-4 border-l-accent-primary/30 shadow-md`}
        {...props}
      >
        {children}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 p-2 rounded-lg bg-bg-secondary/80 hover:bg-bg-secondary border border-border/50 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={copied ? 'Copied!' : 'Copy code'}
      >
        {copied ? (
          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </div>
  )
}

// Helper to extract text from React children
function extractTextFromChildren(children: ReactNode): string {
  if (typeof children === 'string') {
    return children
  }
  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join('')
  }
  if (children && typeof children === 'object' && 'props' in children) {
    return extractTextFromChildren((children as React.ReactElement).props.children)
  }
  return ''
}
