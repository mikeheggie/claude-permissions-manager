import type { BlogPost, BlogPostFrontmatter } from '@/types/blog'

const SITE_URL = 'https://www.y2all.com'
const WORDS_PER_MINUTE = 200

/**
 * Calculate reading time in minutes based on word count
 */
export function calculateReadingTime(content: string): number {
  const wordCount = content.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE))
}

/**
 * Generate URL for a blog post
 */
export function getBlogPostUrl(slug: string): string {
  return `/blog/${slug}`
}

/**
 * Generate canonical URL for a blog post
 */
export function getCanonicalUrl(slug: string): string {
  return `${SITE_URL}/blog/${slug}`
}

/**
 * Check if a post should be visible (not draft and not future-dated)
 */
export function isPostPublished(frontmatter: BlogPostFrontmatter): boolean {
  // Exclude drafts in production
  if (frontmatter.draft && import.meta.env.PROD) {
    return false
  }

  // Exclude future-dated posts
  const postDate = new Date(frontmatter.date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (postDate > today) {
    return false
  }

  return true
}

/**
 * Sort posts by date (newest first)
 */
export function sortPostsByDate(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort((a, b) => {
    const dateA = new Date(a.frontmatter.date)
    const dateB = new Date(b.frontmatter.date)
    return dateB.getTime() - dateA.getTime()
  })
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Get default Open Graph image
 */
export function getOgImage(image?: string): string {
  return image || '/y2all-seo-graph-min.jpg'
}

/**
 * Site configuration
 */
export const siteConfig = {
  name: 'Yes to All',
  description: 'Manage Claude Code permissions with ease',
  url: SITE_URL,
  author: 'Yes to All Team',
} as const
