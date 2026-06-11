import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SEOHead } from '@/components/blog/SEOHead'
import { useTheme } from '@/hooks/useTheme'
import { ThemeToggle } from '@/components/ThemeToggle'
import { formatDate } from '@/utils/blog'
import { getBlogPosts } from '@/content/blog'

export function Blog() {
  const { theme, toggle: toggleTheme } = useTheme()
  const posts = getBlogPosts()

  return (
    <div className="min-h-screen bg-bg flex flex-col relative overflow-hidden">
      {/* Decorative Background Orbs */}
      <div className="bg-orb-1" aria-hidden="true" />
      <div className="bg-orb-2" aria-hidden="true" />

      {/* Subtle Grid Pattern */}
      <div className="fixed inset-0 bg-grid pointer-events-none" aria-hidden="true" />

      <SEOHead />

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
              className="text-sm font-medium text-accent-primary"
            >
              Blog
            </Link>
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
        <div className="max-w-2xl mx-auto px-6 py-6">
          {/* Page Header */}
          <motion.div
            className="mt-4 mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
              Blog
            </h1>
            <p className="text-foreground-secondary">
              Tips, tutorials, and guides for mastering Claude Code permissions and settings.
            </p>
          </motion.div>

          {/* Blog Posts List */}
          <div className="space-y-6">
            {posts.map((post, index) => (
              <motion.article
                key={post.frontmatter.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              >
                <Link
                  to={post.url}
                  className="block p-6 rounded-2xl bg-surface/60 border border-border/50 hover:border-accent-primary/50 hover:bg-surface/80 transition-all"
                >
                  <h2 className="text-xl font-semibold text-foreground mb-2 group-hover:text-accent-primary">
                    {post.frontmatter.title}
                  </h2>
                  <p className="text-foreground-secondary mb-4 line-clamp-2">
                    {post.frontmatter.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-foreground-muted">
                    <time dateTime={post.frontmatter.date}>
                      {formatDate(post.frontmatter.date)}
                    </time>
                    <span>·</span>
                    <span>{post.readingTime} min read</span>
                    {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
                      <>
                        <span>·</span>
                        <div className="flex gap-2">
                          {post.frontmatter.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-xs rounded-full bg-bg-tertiary"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>

          {/* Back to Tool CTA */}
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-accent-primary hover:text-accent-primary-hover transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Yes to All Tool
            </Link>
          </motion.div>
        </div>
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
        </div>
      </footer>
    </div>
  )
}
