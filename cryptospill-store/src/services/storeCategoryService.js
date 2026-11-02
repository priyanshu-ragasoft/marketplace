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
 * Authorized fetch wrapper for Admin Category endpoints.
 * Automatically adds: Authorization: Bearer <store access_token>
 */
async function authorizedStoreCategoryFetch(endpoint, options = {}) {
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
    const err = new Error(netErr.message || 'Unable to connect to store categories API.')
    err.status = 503
    err.code = 503
    throw err
  }

  const statusCode = resultJson?.code || response.status
  const isSuccess = response.ok && (resultJson?.status === true || resultJson?.success === true || resultJson?.code === 200 || statusCode === 200)

  if (response.status === 401 || statusCode === 401) {
    const msg = resultJson?.message || 'Invalid Store Token'
    handleInvalidStoreSession(msg)
    const err = new Error(msg)
    err.status = 401
    err.code = 401
    err.data = resultJson
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

/**
 * GET /store/category/list?page=1&limit=100&search_key=&sort_column=sortOrder&sort_direction=asc&isActive=
 * Admin category list.
 */
export async function getStoreCategoryList(params = {}) {
  const query = new URLSearchParams()
  query.append('page', String(params.page || 1))
  query.append('limit', String(params.limit || 100))
  query.append('search_key', params.search_key ? String(params.search_key).trim() : '')
  query.append('sort_column', params.sort_column || 'sortOrder')
  query.append('sort_direction', params.sort_direction || 'asc')
  if (params.isActive === true || params.isActive === 'true') {
    query.append('isActive', 'true')
  } else if (params.isActive === false || params.isActive === 'false') {
    query.append('isActive', 'false')
  } else if (params.isActive === '') {
    query.append('isActive', '')
  }

  const res = await authorizedStoreCategoryFetch(`/store/category/list?${query.toString()}`, {
    method: 'GET'
  })

  const data = res?.data || {}
  let rows = Array.isArray(data.result)
    ? data.result
    : Array.isArray(data.categories)
    ? data.categories
    : Array.isArray(data.list)
    ? data.list
    : Array.isArray(data)
    ? data
    : []
  const totalCount = typeof data.totalCount === 'number' ? data.totalCount : rows.length

  return {
    success: true,
    message: res.message || 'Categories retrieved successfully',
    data: {
      result: rows,
      totalCount
    },
    code: res.code || 200
  }
}

/**
 * POST /store/category/create
 * body: { name, slug?, isActive?, sortOrder? }
 */
export async function createStoreCategory(categoryData) {
  if (!categoryData?.name || !categoryData.name.trim()) {
    throw new Error('Category name is required.')
  }

  const payload = {
    name: categoryData.name.trim()
  }

  if (categoryData.slug) payload.slug = String(categoryData.slug).trim()
  if (categoryData.parent_id) payload.parent_id = String(categoryData.parent_id).trim()
  if (categoryData.isActive !== undefined) payload.isActive = Boolean(categoryData.isActive)
  if (categoryData.sortOrder !== undefined) payload.sortOrder = Number(categoryData.sortOrder) || 0

  const res = await authorizedStoreCategoryFetch('/store/category/create', {
    method: 'POST',
    body: JSON.stringify(payload)
  })

  return {
    success: true,
    message: res.message || 'Category created successfully',
    data: res.data || {},
    code: res.code || 200
  }
}

/**
 * PUT /store/category/update/:category_id
 * body: { name?, slug?, isActive?, sortOrder? }
 */
export async function updateStoreCategory(categoryId, categoryData = {}) {
  if (!categoryId) {
    throw new Error('Category ID is required.')
  }

  const payload = {}
  if (categoryData.name !== undefined) payload.name = String(categoryData.name).trim()
  if (categoryData.slug !== undefined) payload.slug = String(categoryData.slug).trim()
  if (categoryData.parent_id !== undefined) payload.parent_id = categoryData.parent_id ? String(categoryData.parent_id).trim() : null
  if (categoryData.isActive !== undefined) payload.isActive = Boolean(categoryData.isActive)
  if (categoryData.sortOrder !== undefined) payload.sortOrder = Number(categoryData.sortOrder) || 0

  const res = await authorizedStoreCategoryFetch(`/store/category/update/${categoryId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })

  return {
    success: true,
    message: res.message || 'Category updated successfully',
    data: res.data || {},
    code: res.code || 200
  }
}

/**
 * DELETE /store/category/delete/:category_id
 */
export async function deleteStoreCategory(categoryId) {
  if (!categoryId) {
    throw new Error('Category ID is required.')
  }

  const res = await authorizedStoreCategoryFetch(`/store/category/delete/${categoryId}`, {
    method: 'DELETE'
  })

  return {
    success: true,
    message: res.message || 'Category deleted successfully',
    code: res.code || 200
  }
}

/**
 * GET /store/category/details/:category_id
 */
export async function getStoreCategoryDetails(categoryId) {
  if (!categoryId) {
    throw new Error('Category ID is required.')
  }

  const res = await authorizedStoreCategoryFetch(`/store/category/details/${categoryId}`, {
    method: 'GET'
  })

  return {
    success: true,
    message: res.message || 'Category details retrieved successfully',
    data: res.data || {},
    code: res.code || 200
  }
}
/**
 * GET /store/category/websidelist
 * Public storefront category list.
 * STRICTLY NO Authorization header.
 * data is an array: [{ _id, name, slug, sortOrder }]
 */
export async function getPublicWebsiteCategories() {
  const baseUrl = getStoreApiBaseUrl()
  const url = `${baseUrl}/store/category/websidelist`

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
    if (resultJson && Array.isArray(resultJson.data)) {
      return {
        success: true,
        message: resultJson.message || '',
        data: resultJson.data,
        code: resultJson.code || 200
      }
    }
    if (Array.isArray(resultJson)) {
      return {
        success: true,
        message: '',
        data: resultJson,
        code: 200
      }
    }
  } catch (err) {
    console.warn('getPublicWebsiteCategories error:', err.message)
  }

  return {
    success: false,
    message: 'Failed to load categories from API',
    data: [],
    code: 500
  }
}
