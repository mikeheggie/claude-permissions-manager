/// <reference types="vite/client" />

declare module '*.mdx' {
  import type { ComponentType } from 'react'
  import type { BlogPostFrontmatter } from './blog'

  export const frontmatter: BlogPostFrontmatter
  const MDXComponent: ComponentType
  export default MDXComponent
}
