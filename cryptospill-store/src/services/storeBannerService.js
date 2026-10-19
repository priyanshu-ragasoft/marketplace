import {
  getStoreAccessToken,
  clearStoreAuth
} from './storeStorage'
import { getStoreApiBaseUrl, setStoreApiBaseUrl, parseApiError, fetchWithGatewayFallback, normalizeBaseUrl } from './storeAuthService'

/**
 * Handle store session expiration (401)
 */
function handleInvalidStoreSession(message) {
  clearStoreAuth()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cryptospill_store_session_expired', {
      detail: { reason: message || 'Store session expired or invalid' }
    }))
  }
}

/**
 * Authorized fetch wrapper for Store Banner endpoints.
 * Automatically adds: Authorization: Bearer <store access_token>
 * If token is missing or 401 is returned, purges store auth and dispatches session expired.
 */
async function authorizedStoreBannerFetch(endpoint, options = {}) {
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

  // If not FormData, default to application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
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
    const err = new Error(netErr.message || 'Network error communicating with store API.')
    err.status = 503
    err.code = 503
    throw err
  }

  const statusCode = resultJson?.code || response.status
  const isSuccess = response.ok && (resultJson?.status === true || resultJson?.success === true || resultJson?.code === 200)

  // 401: Token missing or expired
  if (response.status === 401 || statusCode === 401) {
    const errorMsg = resultJson?.message || 'Invalid or expired store session'
    handleInvalidStoreSession(errorMsg)
    const err = new Error(errorMsg)
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
    err.is417 = (statusCode === 417)
    err.is400 = (statusCode === 400)
    throw err
  }

  return resultJson
}

// =========================================================================
// 1. IMAGE UPLOAD: POST /api/v1/upload/image
// =========================================================================
export async function uploadBannerImage(file) {
  if (!file) {
    throw new Error('No image file selected.')
  }

  const token = getStoreAccessToken()
  const baseUrl = getStoreApiBaseUrl()

  const candidateBases = [baseUrl]
  const envBase = normalizeBaseUrl()
  if (baseUrl.startsWith('/') && !candidateBases.includes(envBase)) {
    candidateBases.push(envBase)
  }

  const candidatePaths = ['/upload/image', '/upload']
  const candidateFieldNames = ['image', 'file']

  let lastError = null

  for (const base of candidateBases) {
    for (const path of candidatePaths) {
      for (const fieldName of candidateFieldNames) {
        try {
          const formData = new FormData()
          formData.append(fieldName, file)

          const headers = {
            'Accept': 'application/json, */*'
          }
          if (token) {
            headers['Authorization'] = `Bearer ${token}`
          }

          const response = await fetch(`${base}${path}`, {
            method: 'POST',
            headers,
            body: formData
          })

          if (!response.ok) {
            const rawText = await response.text()
            let errMsg = response.statusText
            try {
              const parsed = JSON.parse(rawText)
              errMsg = parsed?.message || errMsg
            } catch {}
            lastError = new Error(errMsg || `Upload HTTP ${response.status}`)
            continue
          }

          const rawText = await response.text()
          let resultJson = null
          try {
            resultJson = JSON.parse(rawText)
          } catch {
            resultJson = { url: rawText }
          }

          const data = resultJson?.data || resultJson || {}
          const uploadedUrl =
            data?.full_url ||
            data?.media_url ||
            data?.url ||
            data?.image ||
            data?.file ||
            data?.path ||
            (typeof data === 'string' ? data : '')

          if (uploadedUrl) {
            return uploadedUrl
          }
        } catch (fetchErr) {
          lastError = fetchErr
        }
      }
    }
  }

  throw lastError || new Error('Image upload failed: Server endpoint unreachable.')
}

// =========================================================================
// 2. STORE BANNER APIS
// =========================================================================

/**
 * GET /store/banner/list?page=1&limit=20&search_key=&sort_column=sortOrder&sort_direction=desc&isActive=
 * Response data is { result: Banner[], totalCount: number }.
 */
export async function listStoreBanners({
  page = 1,
  limit = 20,
  search_key = '',
  sort_column = 'sortOrder',
  sort_direction = 'desc',
  isActive = ''
} = {}) {
  const queryParams = new URLSearchParams()
  queryParams.set('page', String(page))
  queryParams.set('limit', String(limit))
  queryParams.set('search_key', search_key ? search_key.trim() : '')
  queryParams.set('sort_column', sort_column || 'sortOrder')
  queryParams.set('sort_direction', sort_direction || 'desc')

  // Active filter: All / Active / Inactive, sent as isActive true, false, or omitted.
  if (isActive === true || isActive === 'true') {
    queryParams.set('isActive', 'true')
  } else if (isActive === false || isActive === 'false') {
    queryParams.set('isActive', 'false')
  }

  const endpoint = `/store/banner/list?${queryParams.toString()}`
  const res = await authorizedStoreBannerFetch(endpoint, {
    method: 'GET'
  })

  const data = res?.data || {}
  const rows = Array.isArray(data?.result) ? data.result : []
  const totalCount = typeof data?.totalCount === 'number' ? data.totalCount : rows.length

  return {
    status: res.status ?? res.success,
    message: res.message || 'Banners retrieved successfully',
    code: res.code || 200,
    rows,
    totalCount
  }
}

/**
 * GET /store/banner/details/:banner_id
 * Response data is one banner.
 */
export async function getStoreBannerDetails(bannerId) {
  if (!bannerId) {
    throw new Error('Banner ID is required.')
  }

  const res = await authorizedStoreBannerFetch(`/store/banner/details/${bannerId}`, {
    method: 'GET'
  })

  return {
    status: res.status ?? res.success,
    message: res.message,
    data: res.data || {},
    code: res.code || 200
  }
}

/**
 * POST /store/banner/create
 * JSON body. title is required. Other fields are optional.
 */
export async function createStoreBanner(bannerData) {
  if (!bannerData?.title || !bannerData.title.trim()) {
    throw new Error('Title is required.')
  }

  const payload = {
    title: bannerData.title.trim()
  }

  if (bannerData.offerText !== undefined) payload.offerText = String(bannerData.offerText).trim()
  if (bannerData.subtitle !== undefined) payload.subtitle = String(bannerData.subtitle).trim()
  if (bannerData.rewardText !== undefined) payload.rewardText = String(bannerData.rewardText).trim()
  if (bannerData.badgeText !== undefined) payload.badgeText = String(bannerData.badgeText).trim()
  if (bannerData.liveLabel !== undefined) payload.liveLabel = String(bannerData.liveLabel || 'LIVE NOW').trim()
  if (bannerData.image !== undefined) payload.image = String(bannerData.image).trim()
  if (bannerData.backgroundColor !== undefined) payload.backgroundColor = String(bannerData.backgroundColor || '#1c1c1c').trim()
  if (bannerData.linkUrl !== undefined) payload.linkUrl = String(bannerData.linkUrl).trim()
  if (bannerData.isActive !== undefined) payload.isActive = Boolean(bannerData.isActive)
  if (bannerData.sortOrder !== undefined) payload.sortOrder = Number(bannerData.sortOrder) || 0

  const res = await authorizedStoreBannerFetch('/store/banner/create', {
    method: 'POST',
    body: JSON.stringify(payload)
  })

  return {
    status: res.status ?? res.success,
    message: res.message || 'Banner created successfully',
    data: res.data || {},
    code: res.code || 200
  }
}

/**
 * PUT /store/banner/update/:banner_id
 * JSON body. Send only changed fields. title is optional here.
 */
export async function updateStoreBanner(bannerId, changedFields = {}) {
  if (!bannerId) {
    throw new Error('Banner ID is required.')
  }

  const payload = {}
  const allowed = [
    'title',
    'offerText',
    'subtitle',
    'rewardText',
    'badgeText',
    'liveLabel',
    'image',
    'backgroundColor',
    'linkUrl',
    'isActive',
    'sortOrder'
  ]

  for (const key of allowed) {
    if (key in changedFields) {
      if (key === 'isActive') {
        payload.isActive = Boolean(changedFields.isActive)
      } else if (key === 'sortOrder') {
        payload.sortOrder = Number(changedFields.sortOrder) || 0
      } else {
        payload[key] = String(changedFields[key] ?? '').trim()
      }
    }
  }

  const res = await authorizedStoreBannerFetch(`/store/banner/update/${bannerId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })

  return {
    status: res.status ?? res.success,
    message: res.message || 'Banner updated successfully',
    data: res.data || {},
    code: res.code || 200
  }
}

/**
 * DELETE /store/banner/delete/:banner_id
 * Soft delete. Remove the row from the table after success.
 */
export async function deleteStoreBanner(bannerId) {
  if (!bannerId) {
    throw new Error('Banner ID is required.')
  }

  const res = await authorizedStoreBannerFetch(`/store/banner/delete/${bannerId}`, {
    method: 'DELETE'
  })

  return {
    status: res.status ?? res.success,
    message: res.message || 'Banner deleted successfully',
    code: res.code || 200
  }
}

// =========================================================================
// 3. PUBLIC HOMEPAGE CAROUSEL API: GET /api/v1/store/banner/websidelist
// =========================================================================
export async function getPublicWebsiteBanners() {
  const baseUrl = getStoreApiBaseUrl()
  const candidateUrls = [
    `${baseUrl}/store/banner/websidelist`
  ]

  const envBase = normalizeBaseUrl()
  if (baseUrl.startsWith('/') && `${envBase}/store/banner/websidelist` !== candidateUrls[0]) {
    candidateUrls.push(`${envBase}/store/banner/websidelist`)
  }

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, */*'
          // Strictly NO auth token
        }
      })

      if (!response.ok) {
        continue
      }

      const resultJson = await response.json()
      if (resultJson && Array.isArray(resultJson.data)) {
        // Keep the API order. Do not sort again on the client.
        return resultJson.data
      }

      if (Array.isArray(resultJson)) {
        return resultJson
      }
    } catch {
      // Try next candidate URL
    }
  }

  return []
}
