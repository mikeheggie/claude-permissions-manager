import type { ComponentType } from 'react'

export interface BlogPostFrontmatter {
  title: string
  slug: string
  date: string
  description: string
  author?: string
  tags?: string[]
  image?: string
  draft?: boolean
}

export interface BlogPost {
  frontmatter: BlogPostFrontmatter
  content: ComponentType
  readingTime: number
  url: string
}

