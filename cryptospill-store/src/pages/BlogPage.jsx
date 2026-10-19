import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useRouter } from '../router/RouterContext'
import {
  getPublicWebsiteBlogs,
  getPublicWebsiteBlogBySlug,
  getBlogHeroBannerConfig
} from '../services/storeBlogService'

// Tracks fetched slugs in memory to prevent double-fetching / double-views in React StrictMode
const fetchedSlugCache = new Set()

/**
 * Safe inline Markdown renderer that avoids raw HTML injection (zero XSS).
 * Parses: links [label](url), bold **text**, inline `code`.
 */
function renderInlineMarkdown(text) {
  if (!text) return null

  // Pattern to tokenize: [link](url) | **bold** | `code`
  const tokenRegex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`)/g

  const parts = []
  let lastIndex = 0
  let match
  let keyIdx = 0

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    if (match[2] && match[3]) {
      // Link [label](url)
      const label = match[2]
      const url = match[3]
      const isExternal = url.startsWith('http://') || url.startsWith('https://')
      parts.push(
        <a
          key={`link-${keyIdx++}`}
          href={url}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2 transition"
        >
          {label}
        </a>
      )
    } else if (match[4]) {
      // Bold **text**
      parts.push(
        <strong key={`bold-${keyIdx++}`} className="font-extrabold text-slate-900">
          {match[4]}
        </strong>
      )
    } else if (match[5]) {
      // Inline code `text`
      parts.push(
        <code
          key={`code-${keyIdx++}`}
          className="px-1.5 py-0.5 rounded-md bg-slate-100 text-amber-700 font-mono text-[11px] sm:text-xs border border-slate-200"
        >
          {match[5]}
        </code>
      )
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}

/**
 * Safe block Markdown renderer for paragraphs, headings, blockquotes, code blocks, lists.
 */
function MarkdownArticleBody({ content }) {
  if (!content) {
    return <p className="text-slate-500 italic">No article content available.</p>
  }

  // Split into block paragraphs by 2 or more newlines
  const rawBlocks = content.split(/\r?\n\r?\n/)

  return (
    <div className="space-y-5 text-slate-700 text-sm sm:text-base leading-relaxed">
      {rawBlocks.map((block, idx) => {
        const trimmed = block.trim()
        if (!trimmed) return null

        // Fenced code block: ```code```
        if (trimmed.startsWith('```') && trimmed.endsWith('```')) {
          const lines = trimmed.slice(3, -3).trim().split('\n')
          return (
            <div
              key={idx}
              className="my-4 p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs sm:text-sm overflow-x-auto border border-neutral-800 shadow-inner"
            >
              <pre className="whitespace-pre">
                {lines.join('\n')}
              </pre>
            </div>
          )
        }

        // Headings: #, ##, ###, ####
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={idx} className="text-2xl sm:text-3xl font-black text-slate-900 pt-3 pb-1 tracking-tight border-b border-slate-100">
              {renderInlineMarkdown(trimmed.replace(/^#\s+/, ''))}
            </h1>
          )
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={idx} className="text-xl sm:text-2xl font-extrabold text-slate-900 pt-4 pb-1 tracking-tight border-b border-slate-100">
              {renderInlineMarkdown(trimmed.replace(/^##\s+/, ''))}
            </h2>
          )
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-lg sm:text-xl font-bold text-slate-900 pt-3 tracking-tight">
              {renderInlineMarkdown(trimmed.replace(/^###\s+/, ''))}
            </h3>
          )
        }
        if (trimmed.startsWith('#### ')) {
          return (
            <h4 key={idx} className="text-base sm:text-lg font-bold text-slate-900 pt-2">
              {renderInlineMarkdown(trimmed.replace(/^####\s+/, ''))}
            </h4>
          )
        }

        // Blockquote: > text
        if (trimmed.startsWith('> ')) {
          const quoteText = trimmed.replace(/^>\s*/gm, '')
          return (
            <blockquote
              key={idx}
              className="border-l-4 border-yellow-400 bg-amber-50/70 p-4 rounded-r-2xl my-3 text-slate-800 italic"
            >
              {renderInlineMarkdown(quoteText)}
            </blockquote>
          )
        }

        // Unordered List: lines starting with - or *
        const lines = trimmed.split(/\r?\n/)
        const isUnorderedList = lines.every((l) => /^\s*[-*]\s+/.test(l))
        if (isUnorderedList) {
          return (
            <ul key={idx} className="space-y-2 pl-5 list-disc marker:text-amber-500">
              {lines.map((l, lIdx) => (
                <li key={lIdx} className="leading-relaxed">
                  {renderInlineMarkdown(l.replace(/^\s*[-*]\s+/, ''))}
                </li>
              ))}
            </ul>
          )
        }

        // Ordered List: lines starting with 1., 2., etc.
        const isOrderedList = lines.every((l) => /^\s*\d+\.\s+/.test(l))
        if (isOrderedList) {
          return (
            <ol key={idx} className="space-y-2 pl-5 list-decimal marker:font-bold marker:text-amber-600">
              {lines.map((l, lIdx) => (
                <li key={lIdx} className="leading-relaxed">
                  {renderInlineMarkdown(l.replace(/^\s*\d+\.\s+/, ''))}
                </li>
              ))}
            </ol>
          )
        }

        // Regular Paragraph with inline line-breaks preserved
        return (
          <p key={idx} className="leading-relaxed">
            {lines.map((line, lineIdx) => (
              <React.Fragment key={lineIdx}>
                {renderInlineMarkdown(line)}
                {lineIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}

export default function BlogPage() {
  const { currentPath, navigate } = useRouter()

  // Detect if current route is an article detail view: /blog/:slug
  const activeSlug = useMemo(() => {
    const match = currentPath.match(/^\/blog\/(.+)$/)
    if (match && match[1]) {
      return decodeURIComponent(match[1].split('?')[0])
    }
    return null
  }, [currentPath])

  // =========================================================================
  // 1. ARTICLE DETAIL VIEW STATE
  // =========================================================================
  const [article, setArticle] = useState(null)
  const [isLoadingArticle, setIsLoadingArticle] = useState(false)
  const [articleError, setArticleError] = useState('')
  const [relatedArticles, setRelatedArticles] = useState([])
  const [isCopied, setIsCopied] = useState(false)

  // Single-fetch guard for article page to prevent double view count in StrictMode
  const activeFetchSlugRef = useRef(null)

  useEffect(() => {
    if (!activeSlug) {
      setArticle(null)
      setArticleError('')
      setIsLoadingArticle(false)
      // Reset SEO tags when not on article
      document.title = 'CryptoSpill Marketplace | Blog & Hardware Guides'
      return
    }

    // Check if currently fetching this exact slug
    if (activeFetchSlugRef.current === activeSlug) {
      return
    }
    activeFetchSlugRef.current = activeSlug

    let isSubscribed = true
    setIsLoadingArticle(true)
    setArticleError('')

    getPublicWebsiteBlogBySlug(activeSlug)
      .then((res) => {
        if (!isSubscribed) return
        if (res.success && res.data) {
          setArticle(res.data)
          fetchedSlugCache.add(activeSlug)

          // SEO Tags
          const articleTitle = res.data.title || 'Marketplace Article'
          const articleSummary = res.data.summary || 'CryptoSpill decentralized hardware marketplace insights.'
          document.title = `${articleTitle} | CryptoSpill Blog`

          // Update meta description
          let metaDesc = document.querySelector('meta[name="description"]')
          if (!metaDesc) {
            metaDesc = document.createElement('meta')
            metaDesc.name = 'description'
            document.head.appendChild(metaDesc)
          }
          metaDesc.content = articleSummary

          // Update canonical link
          let canonicalLink = document.querySelector('link[rel="canonical"]')
          if (!canonicalLink) {
            canonicalLink = document.createElement('link')
            canonicalLink.rel = 'canonical'
            document.head.appendChild(canonicalLink)
          }
          canonicalLink.href = `${window.location.origin}/blog/${res.data.slug || activeSlug}`

          // Fetch related articles from same category
          if (res.data.category) {
            getPublicWebsiteBlogs({
              category: res.data.category,
              limit: 4
            }).then((relRes) => {
              if (isSubscribed && relRes.success) {
                const list = (relRes.data?.result || []).filter(
                  (item) => item.slug !== activeSlug && item._id !== res.data._id
                )
                setRelatedArticles(list.slice(0, 3))
              }
            }).catch(() => {})
          }
        } else {
          setArticleError(res.message || 'Data not existed or invalid id')
        }
      })
      .catch((err) => {
        if (!isSubscribed) return
        console.warn('Error fetching blog article:', err.message)
        setArticleError(err.message || 'Article not found or invalid id')
      })
      .finally(() => {
        if (isSubscribed) {
          setIsLoadingArticle(false)
        }
      })

    return () => {
      isSubscribed = false
    }
  }, [activeSlug])

  const handleCopyShareLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2500)
    }
  }

  // =========================================================================
  // 2. BLOG LISTING PAGE STATE (/blog)
  // =========================================================================
  const [blogs, setBlogs] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 12

  const [searchInput, setSearchInput] = useState('')
  const [searchKey, setSearchKey] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Hero Banner Dynamic Configuration State
  const [bannerConfig, setBannerConfig] = useState(() => getBlogHeroBannerConfig())

  useEffect(() => {
    const handleBannerUpdate = (e) => {
      if (e.detail) {
        setBannerConfig(e.detail)
      }
    }
    window.addEventListener('cryptospill_blog_banner_updated', handleBannerUpdate)
    return () => {
      window.removeEventListener('cryptospill_blog_banner_updated', handleBannerUpdate)
    }
  }, [])

  const [isLoadingList, setIsLoadingList] = useState(true)
  const [listError, setListError] = useState('')

  // Debounce search input into searchKey
  const searchTimeoutRef = useRef(null)
  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearchInput(val)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      setPage(1)
      setSearchKey(val.trim())
    }, 400)
  }

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat)
    setPage(1)
  }

  // Fetch blog listing from LIVE backend API
  const fetchBlogList = useCallback(async (targetPage, activeSearch, activeCat) => {
    setIsLoadingList(true)
    setListError('')
    try {
      const res = await getPublicWebsiteBlogs({
        page: targetPage,
        limit,
        search_key: activeSearch,
        category: activeCat === 'all' ? '' : activeCat
      })

      if (res.success) {
        setBlogs(res.data?.result || [])
        setTotalCount(res.data?.totalCount || 0)
      } else {
        setBlogs([])
        setTotalCount(0)
        setListError(res.message || 'Failed to load blogs from server')
      }
    } catch (err) {
      setBlogs([])
      setTotalCount(0)
      setListError(err.message || 'Network error fetching articles')
    } finally {
      setIsLoadingList(false)
    }
  }, [limit])

  // Trigger listing fetch when not on single article view
  useEffect(() => {
    if (!activeSlug) {
      document.title = 'Blog & Tech Guides | CryptoSpill Marketplace'
      fetchBlogList(page, searchKey, selectedCategory)
    }
  }, [activeSlug, page, searchKey, selectedCategory, fetchBlogList])

  // Extract unique category pills dynamically from fetched blogs + standard options
  const categoryPills = useMemo(() => {
    const set = new Set(['all'])
    blogs.forEach((b) => {
      if (b.category && b.category.trim()) {
        set.add(b.category.trim())
      }
    })
    // Ensure common presets are available
    set.add('Security & Escrow')
    set.add('Apple Hardware')
    set.add('Crypto & Web3')
    return Array.from(set)
  }, [blogs])

  const totalPages = Math.max(1, Math.ceil(totalCount / limit))

  // =========================================================================
  // RENDER: ARTICLE DETAIL PAGE (/blog/:slug)
  // =========================================================================
  if (activeSlug) {
    if (isLoadingArticle) {
      return (
        <div className="min-h-[70vh] bg-[#f8fafc] flex flex-col items-center justify-center p-6 font-['Plus_Jakarta_Sans',sans-serif]">
          <div className="w-12 h-12 border-3 border-yellow-400 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-bold text-slate-600">Loading article...</p>
        </div>
      )
    }

    if (articleError || !article) {
      return (
        <div className="min-h-[70vh] bg-[#f8fafc] flex flex-col items-center justify-center p-6 font-['Plus_Jakarta_Sans',sans-serif]">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 font-black text-2xl">
              !
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2">Article Not Found</h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
              {articleError || 'The article you are looking for does not exist or has been removed.'}
            </p>
            <button
              type="button"
              onClick={() => navigate('/blog')}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-yellow-400 hover:text-black text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              &larr; Back to Blog Listing
            </button>
          </div>
        </div>
      )
    }

    const formattedDate = new Date(article.createdAt || Date.now()).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })

    return (
      <div className="min-h-screen bg-[#fafbfc] py-10 px-4 sm:px-6 lg:px-8 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="max-w-4xl mx-auto">
          {/* Top Breadcrumb & Back Action */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="hover:text-amber-600 transition cursor-pointer"
              >
                Storefront
              </button>
              <span>/</span>
              <button
                type="button"
                onClick={() => navigate('/blog')}
                className="hover:text-amber-600 transition cursor-pointer font-semibold"
              >
                Blog
              </button>
              <span>/</span>
              <span className="text-slate-800 font-bold truncate max-w-[200px] sm:max-w-xs">
                {article.title}
              </span>
            </div>

            <button
              type="button"
              onClick={() => navigate('/blog')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:border-yellow-400 hover:text-black transition shadow-2xs cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>All Articles</span>
            </button>
          </div>

          {/* Main Article Container */}
          <article className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden mb-10">
            {/* Cover Image */}
            {article.coverImage && (
              <div className="w-full h-64 sm:h-96 relative bg-slate-950 overflow-hidden">
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />
                {article.category && (
                  <span className="absolute top-5 left-5 px-3 py-1 rounded-full bg-yellow-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-md">
                    {article.category}
                  </span>
                )}
              </div>
            )}

            <div className="p-6 sm:p-10">
              {/* Header Meta: Author, Date, Read Time, Views */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  {article.author?.avatar ? (
                    <img
                      src={article.author.avatar}
                      alt={article.author.name || 'Author'}
                      className="w-11 h-11 rounded-full object-cover border border-amber-300/40 shadow-xs"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-yellow-400 text-slate-950 font-black text-sm flex items-center justify-center shadow-xs">
                      {article.author?.name?.[0]?.toUpperCase() || 'C'}
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">
                      {article.author?.name || 'CryptoSpill Editorial'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {article.author?.role || 'Staff Contributor'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formattedDate}
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {article.readTime || '4 min read'}
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {article.views || 0} views
                  </span>
                </div>
              </div>

              {/* Title & Summary */}
              <div className="py-6">
                <h1 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight tracking-tight mb-4">
                  {article.title}
                </h1>
                {article.summary && (
                  <div className="text-base sm:text-lg text-slate-700 font-medium leading-relaxed bg-amber-50/70 border-l-4 border-yellow-400 p-4 rounded-r-2xl">
                    {article.summary}
                  </div>
                )}
              </div>

              {/* Body Content with Safe Markdown Parser */}
              <div className="pt-2 border-t border-slate-100">
                <MarkdownArticleBody content={article.content} />
              </div>

              {/* Tags & Share Toolbar */}
              <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 mr-1 uppercase tracking-wider text-[11px]">
                    Tags:
                  </span>
                  {Array.isArray(article.tags) && article.tags.length > 0 ? (
                    article.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold"
                      >
                        #{tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No tags</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    <span>{isCopied ? 'Link Copied!' : 'Share Article'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-yellow-400 hover:text-black text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    Shop Hardware &rarr;
                  </button>
                </div>
              </div>
            </div>
          </article>

          {/* Related Articles Section */}
          {relatedArticles.length > 0 && (
            <div className="mt-12 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Related in {article.category}
                </h3>
                <button
                  type="button"
                  onClick={() => navigate('/blog')}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 transition"
                >
                  View All &rarr;
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {relatedArticles.map((rel) => (
                  <div
                    key={rel._id || rel.slug}
                    onClick={() => {
                      navigate(`/blog/${rel.slug}`)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="group bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md hover:border-yellow-400 transition cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      {rel.coverImage && (
                        <div className="h-32 rounded-xl overflow-hidden mb-3 bg-slate-900">
                          <img
                            src={rel.coverImage}
                            alt={rel.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        </div>
                      )}
                      <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider mb-1">
                        {rel.category}
                      </p>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-amber-600 transition line-clamp-2 leading-snug">
                        {rel.title}
                      </h4>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 mt-3 group-hover:text-slate-900 transition">
                      Read story &rarr;
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // =========================================================================
  // RENDER: BLOG LISTING PAGE (/blog)
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#fafbfc] pb-16 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#121212] via-[#1a1a1a] to-[#222222] text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-neutral-800">
        {/* Optional Custom Background Image with dark overlay */}
        {bannerConfig?.backgroundImage && (
          <div className="absolute inset-0 z-0">
            <img
              src={bannerConfig.backgroundImage}
              alt="Blog Hero Background"
              className="w-full h-full object-cover object-center"
            />
            <div
              className="absolute inset-0 bg-neutral-950"
              style={{ opacity: (bannerConfig.overlayOpacity ?? 75) / 100 }}
            />
          </div>
        )}

        <div className="relative z-10 max-w-[1440px] mx-auto text-center space-y-4">
          {bannerConfig?.badgeText && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-400 text-xs font-black uppercase tracking-wider shadow-sm">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              {bannerConfig.badgeText}
            </div>
          )}

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
            {bannerConfig?.title || 'Marketplace Insights, Escrow Guides & Tech Drops'}
          </h1>

          <p className="text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto font-normal leading-relaxed">
            {bannerConfig?.subtitle || 'Read verified guides on smart contract escrow security, Apple serial check protocols, and decentralized Web3 payments.'}
          </p>

          {/* Search Input for Live API Reload */}
          <div className="max-w-xl mx-auto pt-4">
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={handleSearchChange}
                placeholder={bannerConfig?.searchPlaceholder || 'Search articles by title, summary, or tags...'}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-neutral-900/90 border border-neutral-700 text-white placeholder-neutral-500 text-xs sm:text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition shadow-inner"
              />
              <svg className="w-5 h-5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('')
                    setSearchKey('')
                    setPage(1)
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs px-2 py-1 bg-neutral-800 rounded-lg cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* Category Pills Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-2.5 shadow-sm mb-8 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {categoryPills.map((cat) => {
            const isActive = selectedCategory.toLowerCase() === cat.toLowerCase()
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategorySelect(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 capitalize ${
                  isActive
                    ? 'bg-slate-900 text-yellow-400 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {cat === 'all' ? 'All Articles' : cat}
              </button>
            )
          })}
        </div>

        {/* Server Error State */}
        {listError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold mb-6 flex items-center justify-between">
            <span>{listError}</span>
            <button
              type="button"
              onClick={() => fetchBlogList(page, searchKey, selectedCategory)}
              className="px-3 py-1 bg-white rounded-lg border border-rose-300 hover:bg-rose-100 text-rose-800 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoadingList ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-3 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-500">Loading articles from CryptoSpill API...</p>
          </div>
        ) : blogs.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No articles found</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              {searchKey
                ? `No articles match "${searchKey}". Try adjusting your keywords.`
                : 'There are currently no published articles in this category.'}
            </p>
            {(searchKey || selectedCategory !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('')
                  setSearchKey('')
                  setSelectedCategory('all')
                  setPage(1)
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-yellow-400 hover:text-black transition cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          /* Card Grid */
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {blogs.map((blog) => {
                const publishedDate = new Date(blog.createdAt || Date.now()).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })

                return (
                  <div
                    key={blog._id || blog.slug}
                    onClick={() => {
                      navigate(`/blog/${blog.slug}`)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="group bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-yellow-400/60 transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer"
                  >
                    <div>
                      {/* Cover Thumbnail */}
                      <div className="h-48 relative overflow-hidden bg-slate-950">
                        {blog.coverImage ? (
                          <img
                            src={blog.coverImage}
                            alt={blog.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center text-slate-500 text-xs font-mono">
                            CryptoSpill Story
                          </div>
                        )}
                        {blog.category && (
                          <div className="absolute top-3 left-3">
                            <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-xs text-yellow-400 text-[10px] font-black uppercase tracking-wider border border-white/10">
                              {blog.category}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content Card Body */}
                      <div className="p-5 sm:p-6">
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2 font-medium">
                          <span>{publishedDate}</span>
                          <span>&bull;</span>
                          <span>{blog.readTime || '4 min read'}</span>
                          <span>&bull;</span>
                          <span>{blog.views || 0} views</span>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-amber-600 transition leading-snug mb-2 line-clamp-2">
                          {blog.title}
                        </h3>

                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                          {blog.summary}
                        </p>
                      </div>
                    </div>

                    {/* Author & Read Action Footer */}
                    <div className="px-5 sm:px-6 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {blog.author?.avatar ? (
                          <img
                            src={blog.author.avatar}
                            alt={blog.author.name || 'Author'}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-yellow-400 text-slate-950 text-[11px] font-black flex items-center justify-center">
                            {blog.author?.name?.[0]?.toUpperCase() || 'C'}
                          </div>
                        )}
                        <span className="text-xs font-semibold text-slate-700 truncate max-w-[120px]">
                          {blog.author?.name || 'Staff'}
                        </span>
                      </div>

                      <span className="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition flex items-center gap-1">
                        Read &rarr;
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1))
                    window.scrollTo({ top: 300, behavior: 'smooth' })
                  }}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                >
                  &larr; Previous
                </button>

                <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 shadow-2xs">
                  <span>Page</span>
                  <span className="text-slate-900 font-extrabold">{page}</span>
                  <span>of</span>
                  <span>{totalPages}</span>
                </div>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => {
                    setPage((p) => p + 1)
                    window.scrollTo({ top: 300, behavior: 'smooth' })
                  }}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                >
                  Next &rarr;
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
