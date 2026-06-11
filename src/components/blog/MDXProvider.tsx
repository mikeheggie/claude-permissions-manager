import { MDXProvider as BaseMDXProvider } from '@mdx-js/react'
import type { ReactNode, ComponentProps } from 'react'
import { Callout } from './Callout'
import { CodeBlock } from './CodeBlock'

// Custom components for MDX content
const components = {
  // Override default pre element with CodeBlock
  pre: (props: ComponentProps<'pre'>) => <CodeBlock {...props} />,

  // Custom inline code styling
  code: ({ children, ...props }: ComponentProps<'code'>) => {
    // If it's inside a pre, don't add extra styling
    const isInline = !props.className?.includes('language-')
    if (isInline) {
      return (
        <code
          className="px-1.5 py-0.5 rounded bg-bg-tertiary text-accent-primary text-sm font-mono"
          {...props}
        >
          {children}
        </code>
      )
    }
    return <code {...props}>{children}</code>
  },

  // Custom link styling
  a: ({ children, href, ...props }: ComponentProps<'a'>) => (
    <a
      href={href}
      className="text-accent-primary hover:text-accent-primary-hover underline underline-offset-2"
      {...(href?.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...props}
    >
      {children}
    </a>
  ),

  // Custom heading styles
  h2: ({ children, ...props }: ComponentProps<'h2'>) => (
    <h2
      className="text-2xl font-bold text-foreground mt-10 mb-5 tracking-tight"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: ComponentProps<'h3'>) => (
    <h3
      className="text-xl font-semibold text-foreground mt-8 mb-4"
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: ComponentProps<'h4'>) => (
    <h4
      className="text-lg font-semibold text-foreground mt-6 mb-2"
      {...props}
    >
      {children}
    </h4>
  ),

  // Paragraph styling
  p: ({ children, ...props }: ComponentProps<'p'>) => (
    <p
      className="text-foreground-secondary leading-7 mb-6"
      {...props}
    >
      {children}
    </p>
  ),

  // List styling
  ul: ({ children, ...props }: ComponentProps<'ul'>) => (
    <ul
      className="list-disc list-inside text-foreground-secondary mb-6 space-y-2"
      {...props}
    >
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: ComponentProps<'ol'>) => (
    <ol
      className="list-decimal list-inside text-foreground-secondary mb-6 space-y-2"
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ children, ...props }: ComponentProps<'li'>) => (
    <li className="leading-7" {...props}>
      {children}
    </li>
  ),

  // Blockquote styling
  blockquote: ({ children, ...props }: ComponentProps<'blockquote'>) => (
    <blockquote
      className="border-l-4 border-accent-primary/50 pl-4 py-1 my-6 italic text-foreground-secondary"
      {...props}
    >
      {children}
    </blockquote>
  ),

  // Horizontal rule
  hr: (props: ComponentProps<'hr'>) => (
    <hr className="my-8 border-border/50" {...props} />
  ),

  // Strong and emphasis
  strong: ({ children, ...props }: ComponentProps<'strong'>) => (
    <strong className="font-semibold text-foreground" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }: ComponentProps<'em'>) => (
    <em className="italic" {...props}>
      {children}
    </em>
  ),

  // Custom components available in MDX
  Callout,
}

interface MDXProviderProps {
  children: ReactNode
}

export function MDXProvider({ children }: MDXProviderProps) {
  return (
    <BaseMDXProvider components={components}>
      {children}
    </BaseMDXProvider>
  )
}
