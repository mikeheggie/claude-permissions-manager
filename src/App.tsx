import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'

// Lazy load pages for code splitting
const Home = lazy(() => import('@/pages/Home').then(m => ({ default: m.Home })))
const Blog = lazy(() => import('@/pages/Blog').then(m => ({ default: m.Blog })))
const BlogPost = lazy(() => import('@/pages/BlogPost').then(m => ({ default: m.BlogPost })))

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="animate-pulse text-foreground-secondary">Loading...</div>
    </div>
  )
}

function App() {
  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
        </Routes>
      </Suspense>
      <Analytics />
    </>
  )
}

export default App
