/**
 * Image URL Normalizer for CryptoSpill Storefront & Admin
 * Ensures uploaded images pointing to localhost:5300 or relative /uploads
 * are converted to the live public API domain (https://apis.cryptospill.io).
 */

const LIVE_API_BASE = 'https://apis.cryptospill.io'

export function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string') return ''

  const trimmed = url.trim()
  if (!trimmed) return ''

  // Preserve local Data URLs, Blobs, and Vite asset imports (relative without /uploads)
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed
  }

  // 1. Replace http://localhost:5300 or http://127.0.0.1:5300 with live API domain
  if (/^https?:\/\/(localhost|127\.0\.0\.1):5300/i.test(trimmed)) {
    return trimmed.replace(/^https?:\/\/(localhost|127\.0\.0\.1):5300/i, LIVE_API_BASE)
  }

  // 2. Relative upload paths: /uploads/... or uploads/...
  if (trimmed.startsWith('/uploads/')) {
    return `${LIVE_API_BASE}${trimmed}`
  }
  if (trimmed.startsWith('uploads/')) {
    return `${LIVE_API_BASE}/${trimmed}`
  }

  // 3. Force HTTPS for apis.cryptospill.io to avoid mixed content warnings
  if (trimmed.startsWith('http://apis.cryptospill.io')) {
    return trimmed.replace('http://apis.cryptospill.io', 'https://apis.cryptospill.io')
  }

  return trimmed
}

export default normalizeImageUrl
