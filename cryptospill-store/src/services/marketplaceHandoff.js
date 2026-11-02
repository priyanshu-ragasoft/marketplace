import { restoreWalletConnect } from '../utils/walletConnectService'

function exchangeUrl() {
  const raw = import.meta.env.VITE_API_BASE_URL
  const base = (raw ? raw.trim().replace(/\/+$/, '') : 'https://apis.cryptospill.io')
  return `${base}/api/v1/user/auth/marketplace/exchange`
}

function readTokenFromLocation() {
  const search = new URLSearchParams(window.location.search)
  const fromSearch = (search.get('token') || search.get('access_token') || '').trim()
  if (fromSearch) return fromSearch

  const hash = window.location.hash || ''
  const hashQuery = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : ''
  const fromHash = new URLSearchParams(hashQuery)
  return (fromHash.get('token') || fromHash.get('access_token') || '').trim()
}

export function takeMarketplaceToken() {
  const fromUrl = readTokenFromLocation()
  if (fromUrl) {
    sessionStorage.setItem('cryptospill_market_handoff', fromUrl)
    const params = new URLSearchParams(window.location.search)
    params.delete('token')
    params.delete('access_token')
    const next = params.toString()
    const path = window.location.pathname || '/'
    window.history.replaceState({}, '', `${path}${next ? `?${next}` : ''}`)
    return fromUrl
  }
  return (sessionStorage.getItem('cryptospill_market_handoff') || '').trim()
}

/**
 * Redeem the token the main app put on the marketplace URL.
 * The handoff token already belongs to the logged-in app user, so login
 * does not wait for a wallet popup on this site.
 */
export async function exchangeMarketplaceToken(token) {
  let walletAddress = ''
  try {
    const restored = await Promise.race([
      restoreWalletConnect().catch(() => null),
      new Promise((resolve) => setTimeout(() => resolve(null), 400)),
    ])
    walletAddress = restored?.address || ''
  } catch {
    walletAddress = ''
  }

  const response = await fetch(exchangeUrl(), {
    method: 'POST',
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token,
      ...(walletAddress ? { wallet_address: walletAddress } : {}),
    }),
  })

  const result = await response.json().catch(() => null)
  const apiMessage = typeof result?.message === 'string' ? result.message.trim() : ''
  if (!response.ok || result?.success === false) {
    throw new Error(apiMessage || 'This login link was not accepted.')
  }

  const backendData = result?.data || result
  sessionStorage.removeItem('cryptospill_market_handoff')
  return {
    wallet_address: backendData.wallet_address || walletAddress,
    user_name: backendData.user_name,
    username: backendData.user_name,
    display_name: backendData.display_name || backendData.user_name,
    name: backendData.display_name || backendData.user_name,
    connected_wallet: walletAddress ? 'WalletConnect' : '',
    ...backendData,
  }
}
