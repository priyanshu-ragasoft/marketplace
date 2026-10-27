import {
  getStoreAccessToken,
  getStoreRefreshToken,
  setStoreTokens,
  setStoreProfile,
  clearStoreAuth
} from './storeStorage'

export function normalizeBaseUrl(url) {
  const envDefault = import.meta.env.VITE_STORE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'https://apis.cryptospill.io'
  if (!url) {
    url = envDefault
  }
  let clean = url.trim().replace(/\/+$/, '')
  if (!clean.includes('/api/v1')) {
    clean = `${clean}/api/v1`
  }
  return clean
}

/**
 * When running on localhost (Vite dev server), use relative '/api/v1' path
 * so requests go through Vite's proxy (configured from .env, zero CORS preflight).
 * Otherwise use the configured backend URL directly from .env.
 */
export function getStoreApiBaseUrl() {
  // Clear any stale local development override from localStorage
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('cryptospill_store_api_base')
      if (stored && (stored.includes('localhost') || stored.includes('192.168.') || stored.includes('127.0.0.1'))) {
        localStorage.removeItem('cryptospill_store_api_base')
      }
    } catch {}
  }

  // Check if we're running on Vite dev server (localhost)
  const host = typeof window !== 'undefined' ? window.location.hostname : ''
  const localHost = host === 'localhost' || host === '127.0.0.1' || /^192\.168\.\d+\.\d+$/.test(host) || /^10\.\d+\.\d+\.\d+$/.test(host)
  const isLocalDev = typeof window !== 'undefined' &&
    localHost &&
    (window.location.port === '5173' || window.location.port === '5174')

  // In local dev, use Vite proxy path — same origin, zero CORS preflight
  if (isLocalDev) {
    try {
      const override = localStorage.getItem('cryptospill_store_api_base')
      if (override && override.trim() && override.startsWith('https://')) {
        return normalizeBaseUrl(override)
      }
    } catch {}
    return '/api/v1'
  }

  // Production / non-local: use configured URL
  try {
    const override = localStorage.getItem('cryptospill_store_api_base')
    if (override && override.trim()) {
      return normalizeBaseUrl(override)
    }
  } catch {}

  const envStoreBase = import.meta.env.VITE_STORE_API_BASE_URL
  if (envStoreBase && envStoreBase.trim()) {
    return normalizeBaseUrl(envStoreBase)
  }

  const envGeneralBase = import.meta.env.VITE_API_BASE_URL
  if (envGeneralBase && envGeneralBase.trim()) {
    return normalizeBaseUrl(envGeneralBase)
  }

  return 'https://apis.cryptospill.io/api/v1'
}

export function setStoreApiBaseUrl(url) {
  try {
    if (!url) {
      localStorage.removeItem('cryptospill_store_api_base')
    } else {
      localStorage.setItem('cryptospill_store_api_base', normalizeBaseUrl(url))
    }
  } catch {}
}

/**
 * Fetch with seamless gateway fallback.
 * In local dev, requests go via Vite proxy (same-origin, no CORS).
 * In production, falls back to .env base URL.
 */
export async function fetchWithGatewayFallback(endpoint, options = {}) {
  const primaryBase = getStoreApiBaseUrl()
  const primaryUrl = `${primaryBase}${endpoint}`

  // If using Vite proxy (relative path), no fallback needed — proxy handles routing
  if (primaryBase.startsWith('/')) {
    return fetch(primaryUrl, options)
  }

  // Non-proxy mode: try primary with timeout, fallback to .env base
  const envBase = normalizeBaseUrl(import.meta.env.VITE_STORE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'https://apis.cryptospill.io')
  const altBase = primaryBase !== envBase ? envBase : null

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 3500)

  try {
    const response = await fetch(primaryUrl, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timer)
    return response
  } catch (primaryErr) {
    clearTimeout(timer)

    if (altBase) {
      try {
        const altUrl = `${altBase}${endpoint}`
        const altResponse = await fetch(altUrl, options)
        if (altResponse.ok) {
          setStoreApiBaseUrl(altBase)
        }
        return altResponse
      } catch (altErr) {
        throw new Error(altErr.message || primaryErr.message || 'Unable to connect to store API.')
      }
    } else {
      throw new Error(primaryErr.message || 'Unable to connect to store API.')
    }
  }
}

export const STORE_API_BASE_URL = getStoreApiBaseUrl()

/**
 * Extract exact backend error message from response data or status code
 */
export function parseApiError(errorData, status) {
  if (typeof errorData === 'string') {
    const trimmed = errorData.trim()
    // Handle HTML Express error responses cleanly
    if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || trimmed.includes('Cannot POST')) {
      const match = trimmed.match(/Cannot POST ([^<\n]+)/i)
      if (match) {
        return `Backend route not found: Cannot POST ${match[1]}. Please verify server route or switch to Cloud API gateway (apis.cryptospill.io).`
      }
      return 'Backend returned HTML error page (404/500). Please check server route configuration.'
    }
    return trimmed
  }

  if (errorData && typeof errorData === 'object') {
    // 1. data.message as requested in prompt specs
    if (errorData.data && typeof errorData.data === 'object' && errorData.data.message) {
      return typeof errorData.data.message === 'string' ? errorData.data.message.trim() : JSON.stringify(errorData.data.message)
    }

    // 2. data as string (e.g. data: "\"email\" must be a valid email")
    if (typeof errorData.data === 'string' && errorData.data.trim()) {
      return errorData.data.trim()
    }

    // 3. message field (string or array)
    if (errorData.message) {
      if (typeof errorData.message === 'string' && errorData.message.trim()) {
        return errorData.message.trim()
      }
      if (Array.isArray(errorData.message) && errorData.message.length > 0) {
        return errorData.message.map(m => typeof m === 'object' ? (m.message || JSON.stringify(m)) : String(m)).join(', ')
      }
      if (typeof errorData.message === 'object') {
        return errorData.message.message || JSON.stringify(errorData.message)
      }
    }

    // 4. error string
    if (typeof errorData.error === 'string' && errorData.error.trim()) {
      return errorData.error.trim()
    }

    // 5. errors array
    if (Array.isArray(errorData.errors) && errorData.errors.length > 0) {
      return errorData.errors.map(e => typeof e === 'object' ? (e.message || JSON.stringify(e)) : String(e)).join(', ')
    }

    // 6. details array (Joi validation)
    if (Array.isArray(errorData.details) && errorData.details.length > 0) {
      return errorData.details.map(d => d.message || JSON.stringify(d)).join(', ')
    }
  }

  if (status === 400) {
    return 'Invalid request details or credentials'
  }
  if (status === 401) {
    return 'Invalid or expired store session'
  }
  if (status === 403) {
    return 'Store access forbidden or refresh token expired'
  }
  if (status === 404) {
    return 'Store authentication endpoint not found on current server (404).'
  }
  if (status === 417) {
    return 'Validation failed. Please verify input fields.'
  }
  if (status >= 500) {
    return 'Store authentication server error. Please try again shortly.'
  }

  return 'An unexpected error occurred. Please try again.'
}

/**
 * Safely parse response as JSON or text
 */
async function safeReadResponse(response) {
  try {
    const rawText = await response.text()
    try {
      return JSON.parse(rawText)
    } catch {
      return rawText
    }
  } catch {
    return null
  }
}

/**
 * 1) LOGIN
 * POST /store/auth/login
 * No token header.
 */
export async function loginStore({ email, password }) {
  const currentBase = getStoreApiBaseUrl()
  let url = `${currentBase}/store/auth/login`

  let response
  let resultJson

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': '*/*'
      },
      body: JSON.stringify({
        email: email.trim(),
        password
      })
    })

    resultJson = await safeReadResponse(response)
  } catch (netErr) {
    response = { ok: false, status: 503 }
    resultJson = netErr.message
  }

  // If local server returned 404 (e.g. Cannot POST /api/v1/store/auth/login),
  // automatically try fallback URLs:
  if (!response.ok && response.status === 404) {
    const candidateUrls = []
    
    // Fallback 1: without /api/v1 if it had it
    if (currentBase.includes('/api/v1')) {
      const stripped = currentBase.replace(/\/api\/v1\/?$/, '')
      candidateUrls.push(`${stripped}/store/auth/login`)
    } else {
      // Fallback 1b: with /api/v1 if it didn't have it
      candidateUrls.push(`${currentBase}/api/v1/store/auth/login`)
    }
    
    // Fallback 2: official cloud endpoint from .env
    const cloudBase = normalizeBaseUrl(import.meta.env.VITE_STORE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'https://apis.cryptospill.io')
    const cloudLoginUrl = `${cloudBase}/store/auth/login`
    if (!candidateUrls.includes(cloudLoginUrl)) {
      candidateUrls.push(cloudLoginUrl)
    }

    for (const altUrl of candidateUrls) {
      try {
        const altResponse = await fetch(altUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'accept': '*/*'
          },
          body: JSON.stringify({
            email: email.trim(),
            password
          })
        })
        const altJson = await safeReadResponse(altResponse)

        // If alternate didn't 404, adopt this working URL
        if (altResponse.status !== 404) {
          response = altResponse
          resultJson = altJson
          url = altUrl
          const newBase = altUrl.replace(/\/store\/auth\/login$/, '')
          setStoreApiBaseUrl(newBase)
          break
        }
      } catch {}
    }
  }

  if (!response.ok || resultJson?.status === false || resultJson?.success === false) {
    const errorMsg = parseApiError(resultJson, response.status)
    const error = new Error(errorMsg)
    error.status = response.status
    error.data = resultJson
    throw error
  }

  // Response structure: data has store profile plus access_token and refresh_token
  const payload = resultJson?.data || {}
  const accessToken = payload.access_token || resultJson?.access_token
  const refreshToken = payload.refresh_token || resultJson?.refresh_token

  if (!accessToken) {
    const errorMsg = parseApiError(resultJson, response.status) || 'Access token was not returned by the store server.'
    const error = new Error(errorMsg)
    error.data = resultJson
    throw error
  }

  // Save both tokens in store-only storage. Do not reuse admin token key.
  setStoreTokens(accessToken, refreshToken)

  // Save profile information if available (password is not in response)
  const profile = {
    first_name: payload.first_name || '',
    last_name: payload.last_name || '',
    full_name: payload.full_name || `${payload.first_name || ''} ${payload.last_name || ''}`.trim(),
    email: payload.email || email.trim(),
    phone_number: payload.phone_number || '',
    country_code: payload.country_code || '',
    profile_pic: payload.profile_pic || '',
    greet_msg: payload.greet_msg || ''
  }
  setStoreProfile(profile)

  return {
    message: resultJson?.message || 'Administrator Login Success',
    profile,
    tokens: {
      access_token: accessToken,
      refresh_token: refreshToken
    }
  }
}

/**
 * 4) REFRESH TOKEN
 * POST /store/auth/refresh_token
 * No Bearer header.
 * If 403, clear store tokens and go back to store login page.
 */
export async function refreshStoreToken() {
  const refreshToken = getStoreRefreshToken()
  if (!refreshToken) {
    clearStoreAuth()
    throw new Error('No store refresh token available.')
  }

  const response = await fetchWithGatewayFallback('/store/auth/refresh_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': '*/*'
      // Strictly NO Bearer header as per requirements
    },
    body: JSON.stringify({
      refresh_token: refreshToken
    })
  })

  const resultJson = await safeReadResponse(response)

  if (!response.ok) {
    if (response.status === 403 || response.status === 401) {
      // 403 forbidden: clear store tokens and return to store login page
      clearStoreAuth()
      window.dispatchEvent(new CustomEvent('cryptospill_store_session_expired'))
    }
    const errorMsg = parseApiError(resultJson, response.status)
    const error = new Error(errorMsg)
    error.status = response.status
    error.data = resultJson
    throw error
  }

  const data = resultJson?.data || resultJson || {}
  const newAccessToken = data.access_token
  const newRefreshToken = data.refresh_token || refreshToken

  if (!newAccessToken) {
    clearStoreAuth()
    window.dispatchEvent(new CustomEvent('cryptospill_store_session_expired'))
    throw new Error('Store server did not return a new access token.')
  }

  setStoreTokens(newAccessToken, newRefreshToken)

  return {
    access_token: newAccessToken,
    refresh_token: newRefreshToken
  }
}

/**
 * Authenticated fetch helper for store endpoints with automatic single-retry token refresh
 */
async function authorizedStoreFetch(endpoint, options = {}, isRetry = false) {
  const token = getStoreAccessToken()
  if (!token) {
    clearStoreAuth()
    throw new Error('Store authentication required.')
  }

  const headers = {
    accept: '*/*',
    ...options.headers,
    Authorization: `Bearer ${token}`
  }

  const response = await fetchWithGatewayFallback(endpoint, {
    ...options,
    headers
  })

  // If token expired (401) and not already retrying, attempt refresh
  if (response.status === 401 && !isRetry) {
    try {
      await refreshStoreToken()
      // Retry once with new token
      return authorizedStoreFetch(endpoint, options, true)
    } catch (refreshErr) {
      clearStoreAuth()
      window.dispatchEvent(new CustomEvent('cryptospill_store_session_expired'))
      throw refreshErr
    }
  }

  return response
}

/**
 * 2) GET PROFILE
 * GET /store/auth/details
 * Bearer store access_token.
 */
export async function getStoreDetails() {
  const response = await authorizedStoreFetch('/store/auth/details', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  const resultJson = await safeReadResponse(response)

  if (!response.ok) {
    const errorMsg = parseApiError(resultJson, response.status)
    const error = new Error(errorMsg)
    error.status = response.status
    error.data = resultJson
    throw error
  }

  const profileData = resultJson?.data || resultJson || {}
  setStoreProfile(profileData)
  return profileData
}

/**
 * 2) UPDATE PROFILE
 * PUT /store/auth/profile
 * Bearer store access_token.
 * multipart/form-data, not JSON.
 * Fields: first_name, last_name, phone_number, country_code, greet_msg, file field name profile_pic.
 */
export async function updateStoreProfile(formData) {
  // IMPORTANT: For multipart/form-data, DO NOT set Content-Type header.
  // The browser automatically sets multipart/form-data with the boundary.
  const response = await authorizedStoreFetch('/store/auth/profile', {
    method: 'PUT',
    body: formData
  })

  const resultJson = await safeReadResponse(response)

  if (!response.ok) {
    const errorMsg = parseApiError(resultJson, response.status)
    const error = new Error(errorMsg)
    error.status = response.status
    error.data = resultJson
    throw error
  }

  // Refresh profile details on screen as per requirement
  let updatedDetails = null
  try {
    updatedDetails = await getStoreDetails()
  } catch {
    updatedDetails = resultJson?.data || null
  }

  return {
    message: resultJson?.message || 'Store profile updated successfully',
    data: updatedDetails
  }
}

/**
 * 3) CHANGE PASSWORD
 * POST /store/auth/change_password
 * Bearer store access_token.
 * Body: { old_password, new_password }
 */
export async function changeStorePassword({ old_password, new_password }) {
  const response = await authorizedStoreFetch('/store/auth/change_password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      old_password,
      new_password
    })
  })

  const resultJson = await safeReadResponse(response)

  if (!response.ok) {
    const errorMsg = parseApiError(resultJson, response.status)
    const error = new Error(errorMsg)
    error.status = response.status
    error.data = resultJson
    throw error
  }

  return {
    message: resultJson?.message || 'Password changed successfully',
    data: resultJson
  }
}

/**
 * 5) LOGOUT
 * POST /store/auth/logout
 * Bearer store access_token.
 * Then delete the stored store tokens and return to store login page.
 */
export async function logoutStore() {
  try {
    await authorizedStoreFetch('/store/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (err) {
    console.warn('Store logout API call completed with warning:', err.message)
  } finally {
    // Strictly clear all store tokens and profile regardless of network response
    clearStoreAuth()
    window.dispatchEvent(new CustomEvent('cryptospill_store_logged_out'))
  }
}
