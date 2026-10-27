import { fetchWithGatewayFallback, parseApiError } from './storeAuthService'

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
    const raw = parseApiError(resultJson, response.status) || 'Payment request failed.'
    const err = new Error(raw)
    err.status = statusCode
    err.errorCode = resultJson?.data?.error || ''
    throw err
  }

  if (resultJson?.data && typeof resultJson.data === 'object') return resultJson.data
  return resultJson
}

async function authorizedFetch(endpoint, options = {}) {
  const token = getUserAccessToken()
  if (!token) {
    const err = new Error('Sign in to pay for this order.')
    err.status = 401
    throw err
  }
  const response = await fetchWithGatewayFallback(endpoint, {
    ...options,
    headers: {
      Accept: 'application/json, */*',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  })
  const rawText = await response.text()
  let resultJson = {}
  try {
    resultJson = rawText ? JSON.parse(rawText) : {}
  } catch {
    resultJson = { message: rawText, code: response.status }
  }
  return unwrap(resultJson, response)
}

export function createStorePayment(body) {
  return authorizedFetch('/store/create-payment', {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export function listStorePayments() {
  return authorizedFetch('/store/payment-statement', { method: 'GET' })
}

export function verifyStorePayment(body) {
  return authorizedFetch('/store/verify-payment', {
    method: 'POST',
    body: JSON.stringify(body)
  })
}
