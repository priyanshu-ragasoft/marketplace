import {
  getStoreAccessToken,
  clearStoreAuth
} from './storeStorage'
import { getStoreApiBaseUrl, setStoreApiBaseUrl, parseApiError, fetchWithGatewayFallback, normalizeBaseUrl } from './storeAuthService'

/**
 * Handle store session expiration or Invalid Store errors (401)
 */
function handleInvalidStoreSession(message) {
  clearStoreAuth()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cryptospill_store_session_expired', {
      detail: { reason: message || 'Invalid Store session' }
    }))
  }
}

/**
 * Authorized fetch wrapper for Store Admin announcement endpoints.
 * Automatically adds:
 * Authorization: Bearer <store access_token>
 * If token is missing or response is 401 (e.g. "Invalid Store"), purges store auth and dispatches redirect.
 */
async function authorizedStoreAnnouncementFetch(endpoint, options = {}) {
  const token = getStoreAccessToken()
  if (!token) {
    handleInvalidStoreSession('Store token missing')
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
    const err = new Error(netErr.message || 'Network error communicating with store API.')
    err.status = 503
    err.code = 503
    throw err
  }

  const statusCode = resultJson?.code || response.status
  const isSuccess = response.ok && (resultJson?.status === true || resultJson?.status === 'true' || resultJson?.code === 200)

  // 401: Invalid Store or Token expired
  if (response.status === 401 || statusCode === 401) {
    const errorMsg = resultJson?.message || 'Invalid Store'
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
// STORE ADMIN ANNOUNCEMENT ENDPOINTS
// =========================================================================

/**
 * 1) LIST STORE ANNOUNCEMENTS
 * GET /store/announcement/list?page=1&limit=20&search_key=&isActive=&sort_column=sortOrder&sort_direction=desc
 * Read rows from data.result. Read total from data.totalCount.
 */
export async function listStoreAnnouncements({
  page = 1,
  limit = 20,
  search_key = '',
  isActive = '',
  sort_column = 'sortOrder',
  sort_direction = 'desc'
} = {}) {
  const queryParams = new URLSearchParams()
  queryParams.set('page', String(page))
  queryParams.set('limit', String(limit))
  queryParams.set('search_key', search_key ? search_key.trim() : '')

  // The Active filter sends isActive=true.
  // The Inactive filter sends isActive=false.
  // All sends no isActive.
  if (isActive === true || isActive === 'true') {
    queryParams.set('isActive', 'true')
  } else if (isActive === false || isActive === 'false') {
    queryParams.set('isActive', 'false')
  }

  queryParams.set('sort_column', sort_column || 'sortOrder')
  queryParams.set('sort_direction', sort_direction || 'desc')

  const endpoint = `/store/announcement/list?${queryParams.toString()}`
  const res = await authorizedStoreAnnouncementFetch(endpoint, {
    method: 'GET'
  })

  const data = res?.data || {}
  const rows = Array.isArray(data?.result) ? data.result : []
  const totalCount = typeof data?.totalCount === 'number' ? data.totalCount : rows.length

  return {
    status: res.status,
    message: res.message || 'Announcements fetched successfully',
    code: res.code || 200,
    rows,
    totalCount
  }
}

/**
 * 2) CREATE STORE ANNOUNCEMENT
 * POST /store/announcement/create
 * Body: { message, linkUrl, isActive, sortOrder }
 * message is required. linkUrl may be an empty string.
 * If isActive is omitted, API stores true. If sortOrder is omitted, API stores 0.
 */
export async function createStoreAnnouncement({
  message,
  linkUrl = '',
  isActive = true,
  sortOrder = 0
}) {
  const payload = {
    message: message ? message.trim() : ''
  }

  if (linkUrl !== undefined && linkUrl !== null) {
    payload.linkUrl = String(linkUrl).trim()
  } else {
    payload.linkUrl = ''
  }

  if (typeof isActive === 'boolean') {
    payload.isActive = isActive
  } else if (isActive !== undefined && isActive !== null) {
    payload.isActive = Boolean(isActive)
  }

  if (sortOrder !== undefined && sortOrder !== null && sortOrder !== '') {
    payload.sortOrder = Number(sortOrder) || 0
  }

  const res = await authorizedStoreAnnouncementFetch('/store/announcement/create', {
    method: 'POST',
    body: JSON.stringify(payload)
  })

  return {
    status: res.status,
    message: res.message || 'Announcement created successfully',
    data: res.data || {},
    code: res.code || 200
  }
}

/**
 * 3) DETAILS FOR EDIT
 * GET /store/announcement/details/:announcement_id
 * Fill the modal from data.
 * 400 means this announcement does not belong to the logged-in store.
 */
export async function getStoreAnnouncementDetails(announcementId) {
  if (!announcementId) {
    throw new Error('Announcement ID is required.')
  }

  const res = await authorizedStoreAnnouncementFetch(`/store/announcement/details/${announcementId}`, {
    method: 'GET'
  })

  return {
    status: res.status,
    message: res.message,
    data: res.data || {},
    code: res.code || 200
  }
}

/**
 * 4) UPDATE STORE ANNOUNCEMENT
 * PUT /store/announcement/update/:announcement_id
 * Send ONLY the changed fields.
 * Allowed fields are message, linkUrl, isActive, and sortOrder.
 */
export async function updateStoreAnnouncement(announcementId, changedFields = {}) {
  if (!announcementId) {
    throw new Error('Announcement ID is required.')
  }

  const payload = {}
  const allowed = ['message', 'linkUrl', 'isActive', 'sortOrder']

  for (const key of allowed) {
    if (key in changedFields) {
      if (key === 'message') {
        payload.message = String(changedFields.message).trim()
      } else if (key === 'linkUrl') {
        payload.linkUrl = String(changedFields.linkUrl || '').trim()
      } else if (key === 'isActive') {
        payload.isActive = Boolean(changedFields.isActive)
      } else if (key === 'sortOrder') {
        payload.sortOrder = Number(changedFields.sortOrder) || 0
      }
    }
  }

  const res = await authorizedStoreAnnouncementFetch(`/store/announcement/update/${announcementId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })

  return {
    status: res.status,
    message: res.message || 'Announcement updated successfully',
    data: res.data || {},
    code: res.code || 200
  }
}

/**
 * 5) DELETE STORE ANNOUNCEMENT
 * DELETE /store/announcement/delete/:announcement_id
 * No body. On code 200, remove that row.
 */
export async function deleteStoreAnnouncement(announcementId) {
  if (!announcementId) {
    throw new Error('Announcement ID is required.')
  }

  const res = await authorizedStoreAnnouncementFetch(`/store/announcement/delete/${announcementId}`, {
    method: 'DELETE'
  })

  return {
    status: res.status,
    message: res.message || 'Announcement deleted successfully',
    code: res.code || 200
  }
}

// =========================================================================
// PUBLIC WEBSITE BANNER ENDPOINT
// =========================================================================



export async function getPublicActiveAnnouncements() {
  const baseUrl = getStoreApiBaseUrl()
  const candidateUrls = [
    `${baseUrl}/store/announcement/websidelist`
  ]

  const envBase = normalizeBaseUrl()
  if (baseUrl.startsWith('/') && `${envBase}/store/announcement/websidelist` !== candidateUrls[0]) {
    candidateUrls.push(`${envBase}/store/announcement/websidelist`)
  }

  // Also include /announcements/active as fallback
  candidateUrls.push(`${baseUrl}/announcements/active`)
  if (baseUrl.startsWith('/') && `${envBase}/announcements/active` !== candidateUrls[1]) {
    candidateUrls.push(`${envBase}/announcements/active`)
  }

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': '*/*'
          // Strictly NO Authorization header as per requirements
        }
      })

      if (!response.ok) {
        continue
      }

      const resultJson = await response.json()
      // Response format: { success: true, message: "...", data: [ ... ], code: 200 }
      if (resultJson && Array.isArray(resultJson.data)) {
        return resultJson.data
      }

      if (Array.isArray(resultJson)) {
        return resultJson
      }
    } catch {
      // Try next candidate
    }
  }

  return []
}
