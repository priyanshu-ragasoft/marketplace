import { fetchWithGatewayFallback, parseApiError } from './storeAuthService'
import { getStoreAccessToken, clearStoreAuth } from './storeStorage'

function getUserAccessToken() {
  try {
    return localStorage.getItem('access_token') || null
  } catch {
    return null
  }
}

function unwrap(resultJson, response) {
  const statusCode = resultJson?.code || response.status
  const isSuccess =
    resultJson?.success === true ||
    resultJson?.status === true ||
    (response.ok && resultJson?.success !== false && resultJson?.status !== false)

  if (!isSuccess) {
    const raw = parseApiError(resultJson, response.status) || 'Delivery request failed.'
    const message = /cannot post|<!doctype|<html/i.test(raw)
      ? 'Delivery service is unavailable. Restart the API server and try again.'
      : raw
    const err = new Error(message)
    err.status = statusCode
    throw err
  }

  if (resultJson?.data && typeof resultJson.data === 'object') return resultJson.data
  return resultJson
}

async function authorizedFetch(token, endpoint, options = {}) {
  let response
  let resultJson = null
  try {
    response = await fetchWithGatewayFallback(endpoint, {
      ...options,
      headers: {
        Accept: 'application/json, */*',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    })
    const rawText = await response.text()
    try {
      resultJson = rawText ? JSON.parse(rawText) : {}
    } catch {
      resultJson = { message: rawText, code: response.status }
    }
  } catch (netErr) {
    const err = new Error(netErr.message || 'Unable to reach the store API.')
    err.status = 503
    throw err
  }
  return unwrap(resultJson, response)
}

export function createStoreDelivery(body) {
  const token = getUserAccessToken()
  if (!token) {
    const err = new Error('Sign in to save delivery details.')
    err.status = 401
    throw err
  }
  return authorizedFetch(token, '/store/delivery', {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

function normalizeDeliveries(data) {
  if (Array.isArray(data)) return data
  if (!data || typeof data !== 'object') return []
  const candidates = [data.deliveries, data.result, data.rows, data.list, data.records, data.data]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate
  }
  if (data.firstName || data.email || data.address || data.phone) return [data]
  return []
}

export function confirmStoreOrder(body) {
  const token = getUserAccessToken()
  if (!token) {
    const err = new Error('Sign in to confirm the order.')
    err.status = 401
    throw err
  }
  return authorizedFetch(token, '/store/delivery/confirm', {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export function updateStoreOrderAddress(body) {
  const token = getUserAccessToken()
  if (!token) {
    const err = new Error('Sign in to update the delivery address.')
    err.status = 401
    throw err
  }
  return authorizedFetch(token, '/store/delivery/address', {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export function updateStoreOrderStatus(body) {
  const token = getStoreAccessToken()
  if (!token) {
    clearStoreAuth()
    const err = new Error('Store authentication required.')
    err.status = 401
    throw err
  }
  return authorizedFetch(token, '/store/delivery/status', {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export async function listMyOrders() {
  const token = getUserAccessToken()
  if (!token) {
    const err = new Error('Sign in to see your orders.')
    err.status = 401
    throw err
  }
  const data = await authorizedFetch(token, '/store/delivery/mine')
  return normalizeDeliveries(data)
}

export async function listStoreDeliveries() {
  const token = getStoreAccessToken()
  if (!token) {
    clearStoreAuth()
    const err = new Error('Store authentication required.')
    err.status = 401
    throw err
  }
  const data = await authorizedFetch(token, '/store/delivery/list')
  return normalizeDeliveries(data)
}
