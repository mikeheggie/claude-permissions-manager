import type { BlogPost, BlogPostFrontmatter } from '@/types/blog'
import { isPostPublished, sortPostsByDate, getBlogPostUrl, calculateReadingTime } from '@/utils/blog'
import type { ComponentType } from 'react'

// Eagerly import all MDX files from the blog content directory
// This uses Vite's glob import feature
const modules = import.meta.glob<{
  default: ComponentType
  frontmatter: BlogPostFrontmatter
}>('./*.mdx', { eager: true })

/**
 * Get all published blog posts, sorted by date (newest first)
 */
export function getBlogPosts(): BlogPost[] {
  const posts: BlogPost[] = []

  for (const path in modules) {
    const mod = modules[path]
    if (!mod) continue

    const frontmatter = mod.frontmatter

    // Skip invalid posts or unpublished posts
    if (!frontmatter || !isPostPublished(frontmatter)) {
      continue
    }

    posts.push({
      frontmatter,
      content: mod.default,
      readingTime: calculateReadingTime(frontmatter.description),
      url: getBlogPostUrl(frontmatter.slug),
    })
  }

  return sortPostsByDate(posts)
}

/**
 * Get a single blog post by slug
 */
export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  const posts = getBlogPosts()
  return posts.find((post) => post.frontmatter.slug === slug)
}

/**
 * Get all blog post slugs (for sitemap generation)
 */
export function getAllSlugs(): string[] {
  return getBlogPosts().map((post) => post.frontmatter.slug)
}
