import { getStoreAccessToken, clearStoreAuth } from './storeStorage'
import { getStoreApiBaseUrl, setStoreApiBaseUrl, parseApiError, fetchWithGatewayFallback } from './storeAuthService'

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
 * Authorized fetch wrapper for Admin Product endpoints.
 * Automatically adds: Authorization: Bearer <store access_token>
 */
async function authorizedStoreProductFetch(endpoint, options = {}) {
  const token = getStoreAccessToken()
  if (!token) {
    handleInvalidStoreSession('Store authentication required.')
    const err = new Error('Invalid Store: Authentication required.')
    err.status = 401
    err.code = 401
    throw err
  }

  const headers = {
    'Accept': 'application/json, */*',
    ...(options.headers || {}),
    'Authorization': `Bearer ${token}`
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
    const err = new Error(netErr.message || 'Unable to connect to store products API.')
    err.status = 503
    err.code = 503
    throw err
  }

  const statusCode = resultJson?.code || response.status
  const isSuccess =
    resultJson?.success === true ||
    resultJson?.status === true ||
    (statusCode >= 200 && statusCode < 300 && resultJson?.success !== false && resultJson?.status !== false)

  if (statusCode === 401) {
    const msg = resultJson?.message || 'Invalid Store Token'
    handleInvalidStoreSession(msg)
    const err = new Error(msg)
    err.status = 401
    err.code = 401
    throw err
  }

  if (!isSuccess) {
    const errorMsg = resultJson?.message || parseApiError(resultJson, response.status)
    const err = new Error(errorMsg)
    err.status = statusCode
    err.code = statusCode
    err.data = resultJson
    throw err
  }

  return resultJson
}

function cleanVariants(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => ({
      model: String(item?.model || '').trim(),
      storage: String(item?.storage || '').trim(),
      color: String(item?.color || '').trim(),
      colorHex: String(item?.colorHex || '').trim(),
      price: item?.price ? Number(item.price) || 0 : 0,
      image: String(item?.image || '').trim(),
      inStock: item?.inStock !== false,
    }))
    .filter((item) => item.model || item.storage || item.color || item.image)
}

/**
 * GET /store/product/list?search_key=&category=&stock=&sort=&page=1&limit=100
 * category is category _id, or omit for all.
 * stock is all, inStock, or outOfStock.
 * sort is newest, price-asc, price-desc, or rating.
 * Returns: { success, message, data: { result, stats: { total, inStockCount, outOfStockCount, catCount }, totalCount }, code }
 */
export async function getStoreProductList(params = {}) {
  const query = new URLSearchParams()
  query.append('search_key', String(params.search_key || ''))

  // category is the category _id, or omit it for all categories.
  if (params.category && params.category !== 'all' && String(params.category).trim() !== '') {
    query.append('category', String(params.category).trim())
  }
  if (params.subcategory && params.subcategory !== 'all' && String(params.subcategory).trim() !== '') {
    query.append('subcategory', String(params.subcategory).trim())
  }

  query.append('stock', String(params.stock || 'all'))
  query.append('sort', String(params.sort || 'newest'))
  query.append('page', String(params.page || 1))
  query.append('limit', String(params.limit || 100))

  const res = await authorizedStoreProductFetch(`/store/product/list?${query.toString()}`, {
    method: 'GET'
  })

  const data = res.data || {}
  const rows = Array.isArray(data.result)
    ? data.result
    : Array.isArray(data.products)
    ? data.products
    : Array.isArray(data.list)
    ? data.list
    : Array.isArray(data)
    ? data
    : []
  const stats = data.stats || {
    total: typeof data.totalCount === 'number' ? data.totalCount : rows.length,
    inStockCount: rows.filter((r) => r.inStock !== false).length,
    outOfStockCount: rows.filter((r) => r.inStock === false).length,
    catCount: new Set(rows.map((r) => r.category || r.category_id)).size
  }
  const totalCount = typeof data.totalCount === 'number' ? data.totalCount : rows.length

  return {
    success: true,
    message: res.message || 'Products retrieved successfully',
    data: {
      result: rows,
      stats,
      totalCount
    },
    code: res.code || 200
  }
}

/**
 * POST /store/product/create
 * body: { title, category, priceUSD, priceCrypto, image, merchant, badge, rating, reviews, inStock, description, specs, isActive, isFeatured, sortOrder }
 */
export async function createStoreProduct(productData) {
  if (!productData?.title || !productData.title.trim()) {
    throw new Error('Product title is required.')
  }
  const priceUSD = Number(productData.priceUSD)
  if (isNaN(priceUSD) || priceUSD <= 0) {
    throw new Error('priceUSD must be a number greater than 0.')
  }

  const payload = {
    title: productData.title.trim(),
    category: productData.category || '',
    subcategory: productData.subcategory ? String(productData.subcategory).trim() : '',
    priceUSD: priceUSD,
    priceCrypto: productData.priceCrypto ? String(productData.priceCrypto).trim() : '',
    image: productData.image ? String(productData.image).trim() : '',
    merchant: productData.merchant ? String(productData.merchant).trim() : 'Apple Authorized Escrow Store',
    badge: productData.badge ? String(productData.badge).trim().toUpperCase() : '',
    rating: typeof productData.rating === 'number' ? productData.rating : parseFloat(productData.rating) || 5.0,
    reviews: typeof productData.reviews === 'number' ? productData.reviews : parseInt(productData.reviews, 10) || 0,
    inStock: productData.inStock !== false,
    description: productData.description ? String(productData.description).trim() : '',
    specs: Array.isArray(productData.specs)
      ? productData.specs.map((s) => String(s).trim()).filter(Boolean)
      : [],
    isActive: productData.isActive !== false,
    isFeatured: Boolean(productData.isFeatured),
    sortOrder: Number(productData.sortOrder) || 0,
    variants: cleanVariants(productData.variants),
  }

  const res = await authorizedStoreProductFetch('/store/product/create', {
    method: 'POST',
    body: JSON.stringify(payload)
  })

  return {
    success: true,
    message: res.message || 'Product created successfully',
    data: res.data || {},
    code: res.code || 200
  }
}

/**
 * PUT /store/product/update/:product_id
 * body: { title, category, priceUSD, priceCrypto, image, merchant, badge, rating, reviews, inStock, description, specs, isActive, isFeatured, sortOrder }
 */
export async function updateStoreProduct(productId, productData = {}) {
  if (!productId) {
    throw new Error('Product ID is required.')
  }

  const payload = {}
  if (productData.title !== undefined) payload.title = String(productData.title).trim()
  if (productData.category !== undefined) payload.category = String(productData.category).trim()
  if (productData.subcategory !== undefined) payload.subcategory = productData.subcategory ? String(productData.subcategory).trim() : ''
  if (productData.priceUSD !== undefined) {
    const p = Number(productData.priceUSD)
    if (isNaN(p) || p <= 0) throw new Error('priceUSD must be a number greater than 0.')
    payload.priceUSD = p
  }
  if (productData.priceCrypto !== undefined) payload.priceCrypto = String(productData.priceCrypto).trim()
  if (productData.image !== undefined) payload.image = String(productData.image).trim()
  if (productData.merchant !== undefined) payload.merchant = String(productData.merchant).trim()
  if (productData.badge !== undefined) payload.badge = String(productData.badge).trim().toUpperCase()
  if (productData.rating !== undefined) payload.rating = parseFloat(productData.rating) || 5.0
  if (productData.reviews !== undefined) payload.reviews = parseInt(productData.reviews, 10) || 0
  if (productData.inStock !== undefined) payload.inStock = Boolean(productData.inStock)
  if (productData.description !== undefined) payload.description = String(productData.description).trim()
  if (productData.specs !== undefined) {
    payload.specs = Array.isArray(productData.specs)
      ? productData.specs.map((s) => String(s).trim()).filter(Boolean)
      : []
  }
  if (productData.isActive !== undefined) payload.isActive = Boolean(productData.isActive)
  if (productData.isFeatured !== undefined) payload.isFeatured = Boolean(productData.isFeatured)
  if (productData.sortOrder !== undefined) payload.sortOrder = Number(productData.sortOrder) || 0
  if (productData.variants !== undefined) payload.variants = cleanVariants(productData.variants)

  const res = await authorizedStoreProductFetch(`/store/product/update/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })

  return {
    success: true,
    message: res.message || 'Product updated successfully',
    data: res.data || {},
    code: res.code || 200
  }
}

/**
 * DELETE /store/product/delete/:product_id
 */
export async function deleteStoreProduct(productId) {
  if (!productId) {
    throw new Error('Product ID is required.')
  }

  const res = await authorizedStoreProductFetch(`/store/product/delete/${productId}`, {
    method: 'DELETE'
  })

  return {
    success: true,
    message: res.message || 'Product deleted successfully',
    code: res.code || 200
  }
}

/**
 * GET /store/product/details/:product_id
 */
export async function getStoreProductDetails(productId) {
  if (!productId) {
    throw new Error('Product ID is required.')
  }

  const res = await authorizedStoreProductFetch(`/store/product/details/${productId}`, {
    method: 'GET'
  })

  return {
    success: true,
    message: res.message || 'Product details retrieved successfully',
    data: res.data || {},
    code: res.code || 200
  }
}

/**
 * GET /store/product/websidelist?page=1&limit=12&search_key=&category=&sort=featured
 * Public storefront product list.
 * STRICTLY NO Authorization header.
 * category is slug or all.
 * sort is featured, trending, newest, price-asc, price-desc, or rating.
 * returns: { success, message, data: { result, totalCount }, code }
 */
export async function getPublicWebsiteProducts(params = {}) {
  const baseUrl = getStoreApiBaseUrl()
  const query = new URLSearchParams()
  query.append('page', String(params.page || 1))
  query.append('limit', String(params.limit || 12))
  query.append('search_key', String(params.search_key || ''))

  const cat = params.category !== undefined && params.category !== null ? params.category : 'all'
  query.append('category', cat)
  if (params.subcategory && params.subcategory !== 'all') {
    query.append('subcategory', String(params.subcategory).trim())
  }
  if (params.min_price !== '' && params.min_price !== undefined && params.min_price !== null) {
    query.append('min_price', String(params.min_price))
  }
  if (params.max_price !== '' && params.max_price !== undefined && params.max_price !== null) {
    query.append('max_price', String(params.max_price))
  }
  if (params.stock && params.stock !== 'all') query.append('stock', String(params.stock))
  if (params.verified) query.append('verified', '1')
  query.append('sort', String(params.sort || 'featured'))

  const url = `${baseUrl}/store/product/websidelist?${query.toString()}`

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, */*'
        // Strictly NO token
      }
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const resultJson = await response.json()
    if (resultJson && resultJson.data) {
      const rows = Array.isArray(resultJson.data.result)
        ? resultJson.data.result
        : Array.isArray(resultJson.data)
        ? resultJson.data
        : []
      const totalCount =
        typeof resultJson.data.totalCount === 'number' ? resultJson.data.totalCount : rows.length

      return {
        success: true,
        message: resultJson.message || '',
        data: {
          result: rows,
          totalCount
        },
        code: resultJson.code || 200
      }
    }
  } catch (err) {
    console.warn('getPublicWebsiteProducts error:', err.message)
  }

  return {
    success: false,
    message: 'Failed to load products from API',
    data: {
      result: [],
      totalCount: 0
    },
    code: 500
  }
}
