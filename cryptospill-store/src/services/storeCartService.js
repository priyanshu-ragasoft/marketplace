import { fetchWithGatewayFallback, parseApiError } from './storeAuthService'

function token() {
  try {
    return localStorage.getItem('access_token') || null
  } catch {
    return null
  }
}

async function cartRequest(endpoint, options = {}) {
  const access = token()
  if (!access) {
    const err = new Error('Sign in to use your cart.')
    err.status = 401
    throw err
  }

  const response = await fetchWithGatewayFallback(endpoint, {
    ...options,
    headers: {
      Accept: 'application/json, */*',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${access}`,
      ...(options.headers || {})
    }
  })
  const raw = await response.text()
  let json = {}
  try {
    json = raw ? JSON.parse(raw) : {}
  } catch {
    json = { message: raw, code: response.status }
  }
  const ok = json?.success === true || json?.status === true
  if (!ok) {
    throw new Error(parseApiError(json, response.status) || 'Cart request failed.')
  }
  return json.data && typeof json.data === 'object' ? json.data : json
}

export function mapCartItems(data) {
  const items = Array.isArray(data?.items) ? data.items : []
  return items.map((item) => ({
    id: item.productId,
    title: item.title,
    priceUSD: Number(item.priceUSD) || 0,
    quantity: Number(item.quantity) || 1,
    image: item.image || ''
  }))
}

export async function fetchStoreCart() {
  const data = await cartRequest('/store/cart', { method: 'GET' })
  return mapCartItems(data)
}

export async function addStoreCartItem(product) {
  const data = await cartRequest('/store/cart/items', {
    method: 'POST',
    body: JSON.stringify({
      productId: String(product._id || product.id),
      title: product.title || 'Product',
      priceUSD: Number(product.priceUSD) || 0,
      image: product.image || '',
      quantity: 1
    })
  })
  return mapCartItems(data)
}

export async function updateStoreCartItem(productId, quantity) {
  const data = await cartRequest('/store/cart/items', {
    method: 'PUT',
    body: JSON.stringify({ productId: String(productId), quantity })
  })
  return mapCartItems(data)
}

export async function removeStoreCartItem(productId) {
  const data = await cartRequest(`/store/cart/items/${encodeURIComponent(productId)}`, { method: 'DELETE' })
  return mapCartItems(data)
}

export async function clearStoreCart() {
  const data = await cartRequest('/store/cart', { method: 'DELETE' })
  return mapCartItems(data)
}
