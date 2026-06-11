import { useParams, Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SEOHead } from '@/components/blog/SEOHead'
import { MDXProvider } from '@/components/blog/MDXProvider'
import { useTheme } from '@/hooks/useTheme'
import { ThemeToggle } from '@/components/ThemeToggle'
import { GitHubLink } from '@/components/GitHubLink'
import { formatDate, calculateReadingTime } from '@/utils/blog'
import { getBlogPosts } from '@/content/blog'

export function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const { theme, toggle: toggleTheme } = useTheme()

  const posts = getBlogPosts()
  const post = posts.find((p) => p.frontmatter.slug === slug)

  if (!post) {
    return <Navigate to="/blog" replace />
  }

  const { frontmatter, content: Content } = post

  return (
    <div className="min-h-screen bg-bg flex flex-col relative overflow-hidden">
      {/* Decorative Background Orbs */}
      <div className="bg-orb-1" aria-hidden="true" />
      <div className="bg-orb-2" aria-hidden="true" />

      {/* Subtle Grid Pattern */}
      <div className="fixed inset-0 bg-grid pointer-events-none" aria-hidden="true" />

      <SEOHead frontmatter={frontmatter} type="article" />

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 dark:border-white/5 bg-surface/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between py-4 px-6">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-accent-primary flex items-center justify-center shadow-lg shadow-accent-primary/25">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground tracking-tight">
                  Yes to All
                </h1>
              </div>
            </Link>
          </motion.div>

          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Link
              to="/blog"
              className="text-sm font-medium text-foreground-secondary hover:text-accent-primary transition-colors"
            >
              Blog
            </Link>
            <GitHubLink />
            <ThemeToggle
              theme={theme}
              onToggle={toggleTheme}
              testId="theme-toggle"
            />
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1">
        <article className="max-w-2xl mx-auto px-6 py-6">
          {/* Back to Blog */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm text-foreground-secondary hover:text-accent-primary transition-colors mb-8"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Blog
            </Link>
          </motion.div>

          {/* Article Header */}
          <motion.header
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
              {frontmatter.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-foreground-secondary">
              <time dateTime={frontmatter.date}>
                {formatDate(frontmatter.date)}
              </time>
              <span className="text-foreground-muted">·</span>
              <span>{calculateReadingTime(frontmatter.description)} min read</span>
              {frontmatter.author && (
                <>
                  <span className="text-foreground-muted">·</span>
                  <span>By {frontmatter.author}</span>
                </>
              )}
            </div>
            {frontmatter.tags && frontmatter.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {frontmatter.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs font-medium rounded-full bg-bg-tertiary text-foreground-secondary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </motion.header>

          {/* Article Content */}
          <motion.div
            className="prose prose-lg dark:prose-invert max-w-none"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <MDXProvider>
              <Content />
            </MDXProvider>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            className="mt-12 p-6 rounded-2xl bg-gradient-to-br from-accent-primary/10 to-accent-primary/5 border border-accent-primary/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Ready to stop the permission prompts?
            </h3>
            <p className="text-foreground-secondary mb-4">
              Use Yes to All to merge your Claude Code permissions and never click "Allow" again.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-primary text-white font-medium hover:bg-accent-primary-hover transition-colors"
            >
              Try Yes to All
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </motion.div>
        </article>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 dark:border-white/5 py-5">
        <div className="max-w-2xl mx-auto text-center text-sm text-foreground-muted px-6">
          <p>
            Made for managing{' '}
            <a
              href="https://docs.anthropic.com/en/docs/claude-code/settings"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent-primary hover:text-accent-primary-hover transition-colors"
            >
              Claude Code permissions
            </a>
          </p>
          <div className="mt-2 flex justify-center">
            <GitHubLink label="Open source on GitHub" className="text-foreground-muted" />
          </div>
        </div>
      </footer>
    </div>
  )
}
