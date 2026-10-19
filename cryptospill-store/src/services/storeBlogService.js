import {
  getStoreAccessToken,
  clearStoreAuth
} from './storeStorage'
import {
  getStoreApiBaseUrl,
  fetchWithGatewayFallback,
  normalizeBaseUrl
} from './storeAuthService'

/**
 * Handle store session expiration or Invalid Store errors (401)
 */
function handleInvalidStoreSession(message) {
  clearStoreAuth()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('cryptospill_store_session_expired', {
        detail: { reason: message || 'Store session expired or invalid' }
      })
    )
  }
}

/**
 * Authorized fetch wrapper for Store Admin blog endpoints.
 * Automatically adds:
 * Authorization: Bearer <store access_token>
 */
async function authorizedStoreBlogFetch(endpoint, options = {}) {
  const token = getStoreAccessToken()
  if (!token) {
    handleInvalidStoreSession('Store authentication required.')
    const err = new Error('Invalid Store: Authentication required.')
    err.status = 401
    err.code = 401
    throw err
  }

  const headers = {
    Accept: 'application/json, */*',
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`
  }

  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  let response
  let resultJson = null

  try {
    response = await fetchWithGatewayFallback(endpoint, {
      ...options,
      headers
    })

    const rawText = await response.text()
    try {
      resultJson = JSON.parse(rawText)
    } catch {
      resultJson = { message: rawText, code: response.status }
    }
  } catch (netErr) {
    const error = new Error(netErr.message || 'Network error connecting to store blog service')
    error.status = 0
    error.code = 0
    throw error
  }

  if (response.status === 401) {
    handleInvalidStoreSession(resultJson?.message || 'Invalid Store')
    const err = new Error(resultJson?.message || 'Unauthorized store session')
    err.status = 401
    err.code = 401
    throw err
  }

  if (!response.ok || resultJson?.success === false) {
    const err = new Error(resultJson?.message || `Request failed (${response.status})`)
    err.status = response.status
    err.code = resultJson?.code || response.status
    err.data = resultJson?.data
    throw err
  }

  return resultJson
}

// =========================================================================
// 1. PUBLIC STOREFRONT BLOG ENDPOINTS (STRICTLY NO Authorization Header)
// =========================================================================

/**
 * GET /api/v1/store/blog/websidelist?page=1&limit=12&search_key=&category=
 * Public storefront blog list.
 * STRICTLY NO Authorization header.
 * Only returns published blogs (isActive === true).
 * response shape: { success, message, data: { result, totalCount }, code }
 */
export async function getPublicWebsiteBlogs({
  page = 1,
  limit = 12,
  search_key = '',
  category = ''
} = {}) {
  const baseUrl = getStoreApiBaseUrl()
  const query = new URLSearchParams()
  query.append('page', String(page || 1))
  query.append('limit', String(limit || 12))

  if (search_key && search_key.trim()) {
    query.append('search_key', search_key.trim())
  }

  if (category && category.trim() && category.toLowerCase() !== 'all') {
    query.append('category', category.trim())
  }

  const endpoint = `/store/blog/websidelist?${query.toString()}`

  // Candidate URLs handling dev proxy and direct host fallback
  const candidateUrls = [`${baseUrl}${endpoint}`]
  const envBase = normalizeBaseUrl()
  if (baseUrl === '/api/v1' && `${envBase}${endpoint}` !== candidateUrls[0]) {
    candidateUrls.push(`${envBase}${endpoint}`)
  }

  let lastError = null

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json, */*'
          // STRICTLY NO Authorization header
        }
      })

      const rawText = await response.text()
      let resultJson = null
      try {
        resultJson = JSON.parse(rawText)
      } catch {
        resultJson = { message: rawText, code: response.status }
      }

      if (response.ok && resultJson && resultJson.success !== false) {
        const rows = Array.isArray(resultJson.data?.result)
          ? resultJson.data.result
          : Array.isArray(resultJson.data)
          ? resultJson.data
          : []
        const totalCount =
          typeof resultJson.data?.totalCount === 'number'
            ? resultJson.data.totalCount
            : rows.length

        return {
          success: true,
          message: resultJson.message || 'Public blogs fetched successfully',
          data: {
            result: rows,
            totalCount
          },
          code: resultJson.code || 200
        }
      }

      if (resultJson && resultJson.success === false) {
        return {
          success: false,
          message: resultJson.message || 'Failed to load public blogs',
          data: {
            result: [],
            totalCount: 0
          },
          code: resultJson.code || response.status
        }
      }
    } catch (err) {
      lastError = err
    }
  }

  return {
    success: false,
    message: lastError?.message || 'Could not connect to blog service',
    data: {
      result: [],
      totalCount: 0
    },
    code: 500
  }
}

/**
 * Backward compatible alias for existing imports
 */
export const getPublicBlogs = getPublicWebsiteBlogs

/**
 * GET /api/v1/store/blog/websidelist/:slug
 * Public single article by slug or ID.
 * STRICTLY NO Authorization header.
 * Automatically increments views by +1 on backend.
 * response shape: { success, message, data: { ...article }, code }
 */
export async function getPublicWebsiteBlogBySlug(slug) {
  if (!slug) {
    throw new Error('Article slug is required')
  }

  const baseUrl = getStoreApiBaseUrl()
  const endpoint = `/store/blog/websidelist/${encodeURIComponent(slug)}`

  const candidateUrls = [`${baseUrl}${endpoint}`]
  const envBase = normalizeBaseUrl()
  if (baseUrl === '/api/v1' && `${envBase}${endpoint}` !== candidateUrls[0]) {
    candidateUrls.push(`${envBase}${endpoint}`)
  }

  let lastError = null

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json, */*'
          // STRICTLY NO Authorization header
        }
      })

      const rawText = await response.text()
      let resultJson = null
      try {
        resultJson = JSON.parse(rawText)
      } catch {
        resultJson = { message: rawText, code: response.status }
      }

      if (response.ok && resultJson && resultJson.success !== false) {
        return {
          success: true,
          message: resultJson.message || 'Article details fetched successfully',
          data: resultJson.data || null,
          code: resultJson.code || 200
        }
      }

      if (resultJson && resultJson.success === false) {
        const error = new Error(resultJson.message || 'Article not found')
        error.code = resultJson.code || response.status
        error.status = response.status
        throw error
      }
    } catch (err) {
      lastError = err
    }
  }

  throw lastError || new Error('Article not found')
}

/**
 * Backward compatible alias
 */
export const getPublicBlogBySlug = getPublicWebsiteBlogBySlug

// =========================================================================
// 2. STORE ADMIN BLOG ENDPOINTS (Bearer token required)
// =========================================================================

/**
 * GET /api/v1/store/blog/list
 * Admin list with search, category, active filters and pagination.
 */
export async function listStoreBlogs({
  page = 1,
  limit = 20,
  search_key = '',
  category = '',
  isActive = '',
  sort_column = 'createdAt',
  sort_direction = 'desc'
} = {}) {
  const query = new URLSearchParams()
  query.append('page', String(page || 1))
  query.append('limit', String(limit || 20))

  if (search_key && search_key.trim()) {
    query.append('search_key', search_key.trim())
  }
  if (category && category.trim() && category.toLowerCase() !== 'all') {
    query.append('category', category.trim())
  }
  if (isActive !== undefined && isActive !== null && isActive !== '') {
    query.append('isActive', String(isActive))
  }
  if (sort_column) {
    query.append('sort_column', sort_column)
  }
  if (sort_direction) {
    query.append('sort_direction', sort_direction)
  }

  const res = await authorizedStoreBlogFetch(`/store/blog/list?${query.toString()}`, {
    method: 'GET'
  })

  const rows = Array.isArray(res.data?.result)
    ? res.data.result
    : Array.isArray(res.data)
    ? res.data
    : []
  const totalCount =
    typeof res.data?.totalCount === 'number' ? res.data.totalCount : rows.length

  return {
    rows,
    totalCount,
    page,
    limit
  }
}

/**
 * GET /api/v1/store/blog/details/:id
 * Single blog details for admin editing.
 */
export async function getStoreBlogDetails(id) {
  if (!id) throw new Error('Blog ID is required')
  const res = await authorizedStoreBlogFetch(`/store/blog/details/${id}`, {
    method: 'GET'
  })
  return res.data || {}
}

/**
 * POST /api/v1/store/blog/create
 * Create new blog article.
 */
export async function createStoreBlog(payload) {
  const body = {
    title: payload.title?.trim() || '',
    slug: payload.slug?.trim() || '',
    category: payload.category || 'General',
    author: {
      name: payload.authorName?.trim() || 'CryptoSpill Editorial',
      role: payload.authorRole?.trim() || 'Staff Writer',
      avatar: payload.authorAvatar?.trim() || ''
    },
    readTime: payload.readTime?.trim() || '4 min read',
    coverImage: payload.coverImage?.trim() || '',
    summary: payload.summary?.trim() || '',
    content: payload.content?.trim() || '',
    tags: Array.isArray(payload.tags)
      ? payload.tags
      : (payload.tags || '')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
    isActive: payload.isActive !== false
  }

  const res = await authorizedStoreBlogFetch('/store/blog/create', {
    method: 'POST',
    body: JSON.stringify(body)
  })

  return res.data || {}
}

/**
 * PUT /api/v1/store/blog/update/:id
 * Update blog article.
 */
export async function updateStoreBlog(id, payload) {
  if (!id) throw new Error('Blog ID is required')

  const body = {}

  if (payload.title !== undefined) body.title = payload.title.trim()
  if (payload.slug !== undefined) body.slug = payload.slug.trim()
  if (payload.category !== undefined) body.category = payload.category
  if (
    payload.authorName !== undefined ||
    payload.authorRole !== undefined ||
    payload.authorAvatar !== undefined
  ) {
    body.author = {
      name: payload.authorName?.trim() || '',
      role: payload.authorRole?.trim() || '',
      avatar: payload.authorAvatar?.trim() || ''
    }
  }
  if (payload.readTime !== undefined) body.readTime = payload.readTime.trim()
  if (payload.coverImage !== undefined) body.coverImage = payload.coverImage.trim()
  if (payload.summary !== undefined) body.summary = payload.summary.trim()
  if (payload.content !== undefined) body.content = payload.content.trim()
  if (payload.tags !== undefined) {
    body.tags = Array.isArray(payload.tags)
      ? payload.tags
      : payload.tags.split(',').map((t) => t.trim()).filter(Boolean)
  }
  if (payload.isActive !== undefined) body.isActive = Boolean(payload.isActive)

  const res = await authorizedStoreBlogFetch(`/store/blog/update/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  })

  return res.data || {}
}

/**
 * DELETE /api/v1/store/blog/delete/:id
 * Delete blog article.
 */
export async function deleteStoreBlog(id) {
  if (!id) throw new Error('Blog ID is required')
  const res = await authorizedStoreBlogFetch(`/store/blog/delete/${id}`, {
    method: 'DELETE'
  })
  return res.data || {}
}

// =========================================================================
// 3. BLOG HERO BANNER CONFIGURATION (Image, Title, Subtitle, Badge)
// =========================================================================
const BLOG_HERO_BANNER_STORAGE_KEY = 'cryptospill_store_blog_hero_banner_config'

export const DEFAULT_BLOG_HERO_BANNER = {
  badgeText: 'CRYPTOSPILL EDITORIAL & HARDWARE GUIDES',
  title: 'Marketplace Insights, Escrow Guides & Tech Drops',
  subtitle: 'Read verified guides on smart contract escrow security, Apple serial check protocols, and decentralized Web3 payments.',
  backgroundImage: '',
  overlayOpacity: 75,
  searchPlaceholder: 'Search articles by title, summary, or tags...'
}

export function getBlogHeroBannerConfig() {
  if (typeof window === 'undefined') return DEFAULT_BLOG_HERO_BANNER
  try {
    const raw = localStorage.getItem(BLOG_HERO_BANNER_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...DEFAULT_BLOG_HERO_BANNER, ...parsed }
    }
  } catch (e) {
    // fallback
  }
  return DEFAULT_BLOG_HERO_BANNER
}

export function saveBlogHeroBannerConfig(config) {
  if (typeof window === 'undefined') return DEFAULT_BLOG_HERO_BANNER
  try {
    const merged = { ...DEFAULT_BLOG_HERO_BANNER, ...config }
    localStorage.setItem(BLOG_HERO_BANNER_STORAGE_KEY, JSON.stringify(merged))
    window.dispatchEvent(
      new CustomEvent('cryptospill_blog_banner_updated', {
        detail: merged
      })
    )
    return merged
  } catch (e) {
    console.error('Failed to save blog hero banner config:', e)
    return DEFAULT_BLOG_HERO_BANNER
  }
}

