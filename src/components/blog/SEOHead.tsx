import { Helmet } from 'react-helmet-async'
import type { BlogPostFrontmatter } from '@/types/blog'
import { getCanonicalUrl, getOgImage, siteConfig } from '@/utils/blog'

interface SEOHeadProps {
  frontmatter?: BlogPostFrontmatter
  type?: 'article' | 'website'
}

export function SEOHead({ frontmatter, type = 'website' }: SEOHeadProps) {
  const isArticle = type === 'article' && frontmatter

  const title = isArticle
    ? `${frontmatter.title} | ${siteConfig.name} Blog`
    : `${siteConfig.name} - ${siteConfig.description}`

  const description = frontmatter?.description || siteConfig.description
  const canonicalUrl = frontmatter
    ? getCanonicalUrl(frontmatter.slug)
    : siteConfig.url
  const ogImage = `${siteConfig.url}${getOgImage(frontmatter?.image)}`
  const author = frontmatter?.author || siteConfig.author

  // JSON-LD structured data for blog posts
  const jsonLd = isArticle
    ? {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: frontmatter.title,
        description: frontmatter.description,
        image: ogImage,
        datePublished: frontmatter.date,
        dateModified: frontmatter.date,
        author: {
          '@type': 'Person',
          name: author,
        },
        publisher: {
          '@type': 'Organization',
          name: siteConfig.name,
          logo: {
            '@type': 'ImageObject',
            url: `${siteConfig.url}/logo.png`,
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': canonicalUrl,
        },
        keywords: frontmatter.tags?.join(', '),
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: siteConfig.name,
        description: siteConfig.description,
        url: siteConfig.url,
      }

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={frontmatter?.title || siteConfig.name} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteConfig.name} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={frontmatter?.title || siteConfig.name} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Article-specific meta tags */}
      {isArticle && (
        <>
          <meta property="article:published_time" content={frontmatter.date} />
          <meta property="article:author" content={author} />
          {frontmatter.tags?.map((tag) => (
            <meta property="article:tag" content={tag} key={tag} />
          ))}
        </>
      )}

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  )
}
