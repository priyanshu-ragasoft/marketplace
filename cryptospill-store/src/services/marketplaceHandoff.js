import { connectWithWalletConnect, restoreWalletConnect } from '../utils/walletConnectService'

function exchangeUrl() {
  const raw = import.meta.env.VITE_API_BASE_URL
  const base = (raw ? raw.trim().replace(/\/+$/, '') : 'https://apis.cryptospill.io')
  return `${base}/api/v1/user/auth/marketplace/exchange`
}

async function connectedWalletAddress() {
  const restored = await restoreWalletConnect().catch(() => null)
  if (restored?.address) return restored.address

  const ethereum = typeof window !== 'undefined' ? window.ethereum : null
  if (ethereum?.request) {
    const existing = await ethereum.request({ method: 'eth_accounts' }).catch(() => [])
    if (existing?.[0]) return existing[0]
    const requested = await ethereum.request({ method: 'eth_requestAccounts' })
    if (requested?.[0]) return requested[0]
  }

  const connected = await connectWithWalletConnect()
  return connected?.address || ''
}

/**
 * Redeem the token the main app put on the marketplace URL.
 * Succeeds only when that user exists and the connected wallet is theirs.
 */
export async function exchangeMarketplaceToken(token) {
  const walletAddress = await connectedWalletAddress()
  if (!walletAddress) {
    throw new Error('Connect the wallet linked to this account.')
  }

  const response = await fetch(exchangeUrl(), {
    method: 'POST',
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token,
      wallet_address: walletAddress,
    }),
  })

  const result = await response.json().catch(() => null)
  const apiMessage = typeof result?.message === 'string' ? result.message.trim() : ''
  if (!response.ok || result?.success === false) {
    throw new Error(apiMessage || 'This login link was not accepted.')
  }

  const backendData = result?.data || result
  return {
    wallet_address: backendData.wallet_address || walletAddress,
    user_name: backendData.user_name,
    username: backendData.user_name,
    display_name: backendData.display_name || backendData.user_name,
    name: backendData.display_name || backendData.user_name,
    connected_wallet: 'WalletConnect',
    ...backendData,
  }
}
