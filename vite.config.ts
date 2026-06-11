import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import rehypePrismPlus from 'rehype-prism-plus'
import Sitemap from 'vite-plugin-sitemap'
import { fileURLToPath, URL } from 'node:url'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

// Get blog post slugs from MDX files
function getBlogSlugs(): string[] {
  const blogDir = join(process.cwd(), 'src/content/blog')
  try {
    const files = readdirSync(blogDir)
    return files
      .filter(file => file.endsWith('.mdx'))
      .map(file => `/blog/${file.replace('.mdx', '')}`)
  } catch {
    return []
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // MDX must come before React plugin
    mdx({
      providerImportSource: '@mdx-js/react',
      remarkPlugins: [
        remarkFrontmatter,
        [remarkMdxFrontmatter, { name: 'frontmatter' }],
      ],
      rehypePlugins: [
        [rehypePrismPlus, { ignoreMissing: true }],
      ],
    }),
    react(),
    Sitemap({
      hostname: 'https://www.y2all.com',
      dynamicRoutes: [
        '/blog',
        ...getBlogSlugs(),
      ],
      // Homepage '/' is auto-added by the plugin - don't duplicate it
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2020',
    sourcemap: true,
  },
})
