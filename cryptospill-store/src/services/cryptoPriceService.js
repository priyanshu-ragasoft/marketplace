// Service to fetch live real-time Crypto prices (ETH, BTC, SOL, etc.)
// Uses Binance public API with CoinGecko fallback and in-memory caching

let cachedEthPrice = 3480
let lastFetchTime = 0
const CACHE_TTL_MS = 60 * 1000 // 1 minute cache

export async function fetchEthUsdPrice() {
  const now = Date.now()
  if (now - lastFetchTime < CACHE_TTL_MS && cachedEthPrice > 0) {
    return cachedEthPrice
  }

  try {
    // Attempt 1: Binance public ticker
    const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT', {
      headers: { Accept: 'application/json' }
    })
    if (res.ok) {
      const data = await res.json()
      const price = parseFloat(data.price)
      if (price > 0) {
        cachedEthPrice = Math.round(price * 100) / 100
        lastFetchTime = now
        return cachedEthPrice
      }
    }
  } catch {
    // Attempt 2: CoinGecko public fallback
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
      if (res.ok) {
        const data = await res.json()
        const price = parseFloat(data?.ethereum?.usd)
        if (price > 0) {
          cachedEthPrice = Math.round(price * 100) / 100
          lastFetchTime = now
          return cachedEthPrice
        }
      }
    } catch {
      // Keep last cached price
    }
  }

  return cachedEthPrice
}

export function getCachedEthUsdPrice() {
  return cachedEthPrice
}
