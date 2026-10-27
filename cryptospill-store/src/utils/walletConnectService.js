// WalletConnect v2 Service for CryptoSpill Store
// Official EthereumProvider with QR Modal and Project ID

const PROJECT_ID =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ||
  'a161795d1950320fabc1655255a31172'

function pageUrl() {
  if (typeof window === 'undefined') return 'https://cryptospill.io'
  return window.location.href.split('#')[0]
}

function pageOrigin() {
  if (typeof window === 'undefined') return 'https://cryptospill.io'
  return window.location.origin
}

function isMobileWallet() {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

function walletMetadata() {
  const here = pageUrl()
  return {
    name: 'CryptoSpill Store',
    description: 'CryptoSpill Decentralized Escrow Marketplace',
    url: pageOrigin(),
    icons: ['https://cryptospill.io/favicon.ico'],
    redirect: {
      native: here,
      universal: here,
    },
  }
}

let lastWalletUri = ''

function openLink(link) {
  if (isMobileWallet()) {
    window.location.assign(link)
    return
  }
  const opened = window.open(link, '_blank')
  if (opened) return
  const anchor = document.createElement('a')
  anchor.href = link
  anchor.rel = 'noopener'
  anchor.click()
}

function metaMaskLink(uri) {
  const back = encodeURIComponent(pageUrl())
  if (!uri) return `https://metamask.app.link/?redirect=${back}`
  return `https://metamask.app.link/wc?uri=${encodeURIComponent(uri)}&redirect=${back}`
}

function openMetaMask(uri) {
  if (!isMobileWallet() || !uri || uri === lastWalletUri) return
  lastWalletUri = uri
  openLink(metaMaskLink(uri))
}

/** Open MetaMask for a request that is already waiting. Keep this page open. */
export function openMetaMaskForAction() {
  if (!isMobileWallet()) return
  const anchor = document.createElement('a')
  anchor.href = metaMaskLink('')
  anchor.target = '_blank'
  anchor.rel = 'noopener noreferrer'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

const rawWalletIds =
  import.meta.env.VITE_WALLETCONNECT_RECOMMENDED_WALLET_IDS ||
  'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96,4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0,971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709,38f5d18bd8522c244bdd70cb4a68e0e718865155811c043f052fb9f1c51de662,1ae92b26df02f0ffd630424b7900ed8022ebd9e10f669048ee3c32024124f21d,fd20dc426fb3704d1669236413dc8370377e2023a9b139366e0474a89669528e'

const RECOMMENDED_WALLET_IDS = rawWalletIds
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

let providerInstance = null
let bottomSheetInstalled = false

const BOTTOM_SHEET_CSS = `
.wcm-overlay {
  align-items: flex-end !important;
  padding: 0 !important;
}
.wcm-container {
  max-width: 440px !important;
  width: 100% !important;
  max-height: 100% !important;
  overflow: auto !important;
  border-radius: 8px 8px 0 0 !important;
}
.wcm-card {
  border-radius: 28px 28px 0 0 !important;
}
@media (max-width: 440px) {
  .wcm-container {
    max-width: 100% !important;
  }
}
`

function sheetMotion(closing) {
  return closing
    ? [{ transform: 'translateY(0px)' }, { transform: 'translateY(100%)' }]
    : [{ transform: 'translateY(100%)' }, { transform: 'translateY(0px)' }]
}

function sheetKeyframes(keyframes) {
  if (keyframes && !Array.isArray(keyframes)) {
    if (Array.isArray(keyframes.y)) return sheetMotion(parseFloat(keyframes.y[0]) < parseFloat(keyframes.y[1]))
    if (Array.isArray(keyframes.scale)) return sheetMotion(Number(keyframes.scale[0]) > Number(keyframes.scale[1]))
    return null
  }
  if (!Array.isArray(keyframes) || keyframes.length < 2) return null
  const start = String(keyframes[0]?.transform || '')
  const end = String(keyframes[keyframes.length - 1]?.transform || '')
  const closing = /50vh|100%/.test(end) || /scale\(0\.9/.test(end)
  const opening = !closing && (/50vh|scale\(|translateY\(/.test(start))
  if (!opening && !closing) return null
  return sheetMotion(closing)
}

function paintWalletConnectSheet(node) {
  if (!(node instanceof HTMLElement) || node.tagName.toLowerCase() !== 'wcm-modal') return
  const root = node.shadowRoot
  if (!root) return
  let style = root.querySelector('style[data-wc-sheet]')
  if (!style) {
    style = document.createElement('style')
    style.dataset.wcSheet = '1'
    root.appendChild(style)
  }
  style.textContent = BOTTOM_SHEET_CSS
}

/** Keep the official Connect your wallet modal as a bottom sheet on every screen size. */
function installWalletConnectBottomSheet() {
  if (bottomSheetInstalled || typeof window === 'undefined' || typeof Element === 'undefined') return
  bottomSheetInstalled = true

  const nativeAnimate = Element.prototype.animate
  Element.prototype.animate = function animateFromBottom(keyframes, options) {
    if (this.classList?.contains('wcm-container')) {
      const next = sheetKeyframes(keyframes)
      if (next) keyframes = next
    }
    return nativeAnimate.call(this, keyframes, options)
  }

  const scan = (root) => {
    paintWalletConnectSheet(root)
    root.querySelectorAll?.('wcm-modal').forEach(paintWalletConnectSheet)
  }

  const observer = new MutationObserver((records) => {
    records.forEach((record) => {
      record.addedNodes.forEach((node) => scan(node))
    })
  })
  observer.observe(document.documentElement, { childList: true, subtree: true })
  scan(document)
}

installWalletConnectBottomSheet()

async function getEthereumProviderClass() {
  if (typeof window === 'undefined') return null

  if (window.WalletConnectEthereumProvider) {
    return window.WalletConnectEthereumProvider.EthereumProvider || window.WalletConnectEthereumProvider
  }

  try {
    const mod = await import('https://esm.sh/@walletconnect/ethereum-provider@2.18.0?bundle')
    return mod.EthereumProvider || mod.default?.EthereumProvider || mod.default
  } catch (err1) {
    try {
      const mod = await import('https://cdn.jsdelivr.net/npm/@walletconnect/ethereum-provider@2.18.0/+esm')
      return mod.EthereumProvider || mod.default?.EthereumProvider || mod.default
    } catch (err2) {
      console.warn('Could not load WalletConnect via ESM CDN:', err1, err2)
      return null
    }
  }
}

async function initProvider(EthereumProvider) {
  const provider = await EthereumProvider.init({
    projectId: PROJECT_ID,
    showQrModal: !isMobileWallet(),
    qrModalOptions: {
      themeMode: 'light',
      explorerRecommendedWalletIds: RECOMMENDED_WALLET_IDS,
      themeVariables: {
        '--wcm-z-index': '99999',
        '--wcm-accent-color': '#3B99FC',
      },
    },
    chains: [56],
    optionalChains: [1, 56, 137, 42161, 71717],
    rpcMap: {
      1: 'https://cloudflare-eth.com',
      56: 'https://bsc-dataseed.binance.org',
      137: 'https://polygon-rpc.com',
      42161: 'https://arb1.arbitrum.io/rpc',
      71717: 'https://rpc.cryptospill.io',
    },
    metadata: walletMetadata(),
  })
  provider.on?.('display_uri', (uri) => {
    openMetaMask(uri)
  })
  return provider
}

function idbClosing(error) {
  return /idbdatabase|database connection is closing|indexeddb/i.test(String(error?.message || error || ''))
}

async function resetWalletConnectStorage() {
  if (typeof indexedDB === 'undefined' || !indexedDB.databases) return
  const rows = await indexedDB.databases().catch(() => [])
  await Promise.all((rows || []).filter((row) => /walletconnect|wallet-connect/i.test(row?.name || '')).map((row) => new Promise((resolve) => {
    const request = indexedDB.deleteDatabase(row.name)
    request.onsuccess = request.onerror = request.onblocked = () => resolve()
  })))
}

function plainAddress(value) {
  const match = String(value || '').match(/0x[a-fA-F0-9]{40}/)
  return match ? match[0] : String(value || '').trim()
}

function connectedResult(provider) {
  if (!provider?.session || !provider.accounts?.length) return null
  const meta = provider.session?.peer?.metadata || {}
  const icons = Array.isArray(meta.icons) ? meta.icons : []
  const walletIcon = icons.find((item) => typeof item === 'string' && item.trim()) || ''
  return {
    address: plainAddress(provider.accounts[0]),
    provider,
    walletName: String(meta.name || '').trim() || 'Wallet',
    walletIcon: String(walletIcon).trim(),
  }
}

/** Bring back the login session. Pay uses this instead of opening WalletConnect again. */
export async function restoreWalletConnect() {
  const EthereumProvider = await getEthereumProviderClass()
  if (!EthereumProvider) return null
  if (!providerInstance) providerInstance = await initProvider(EthereumProvider)
  if (providerInstance?.session && !providerInstance.accounts?.length && providerInstance.enable) {
    try { await providerInstance.enable() } catch { /* session is still the login connection */ }
  }
  return connectedResult(providerInstance)
}

/**
 * Connect via official WalletConnect modal
 */
export async function connectWithWalletConnect() {
  const EthereumProvider = await getEthereumProviderClass()

  if (!EthereumProvider) {
    throw new Error(
      'WalletConnect could not be loaded. Please check your internet connection.'
    )
  }

  // Helper to run connection on a clean or existing instance
  const runConnect = async (provider) => {
    // If already connected with active session
    const sessionUrl = provider.session?.self?.metadata?.url || ''
    const sessionMatchesPage = !sessionUrl || sessionUrl.startsWith(pageOrigin())
    if (provider.session && provider.accounts?.length > 0 && sessionMatchesPage) {
      return connectedResult(provider)
    }
    if (provider.session && !sessionMatchesPage) {
      try { await provider.disconnect() } catch { /* pair again against this page */ }
    }

    await provider.connect()

    if (!provider.accounts || provider.accounts.length === 0) {
      throw new Error('No accounts selected in WalletConnect')
    }

    return connectedResult(provider)
  }

  try {
    if (!providerInstance) {
      providerInstance = await initProvider(EthereumProvider)
    }
    return await runConnect(providerInstance)
  } catch (error) {
    console.warn('WalletConnect initial attempt failed:', error?.message)

    // Handle "Connection request reset" or stale pairing by resetting and retrying once cleanly
    const isReset =
      error?.message?.includes('Connection request reset') ||
      error?.message?.includes('reset') ||
      error?.message?.includes('already pending') ||
      error?.message?.includes('Pairing') ||
      idbClosing(error)

    if (isReset) {
      try {
        if (providerInstance) {
          await providerInstance.disconnect()
        }
      } catch (_) {}
      providerInstance = null
      if (idbClosing(error)) {
        await new Promise((resolve) => setTimeout(resolve, 400))
        await resetWalletConnectStorage()
      }

      // Clean retry
      try {
        providerInstance = await initProvider(EthereumProvider)
        return await runConnect(providerInstance)
      } catch (retryError) {
        if (retryError?.message?.includes('User closed modal')) {
          throw new Error('Connection closed by user.')
        }
        throw retryError
      }
    }

    if (error?.message?.includes('User closed modal')) {
      throw new Error('Connection closed by user.')
    }

    throw error
  }
}

/**
 * Disconnects active WalletConnect session
 */
export function getWalletConnectProvider() {
  if (providerInstance?.session && providerInstance.accounts?.length) return providerInstance
  return null
}

export async function disconnectWalletConnect() {
  if (providerInstance) {
    try {
      await providerInstance.disconnect()
    } catch (e) {
      // ignore
    }
    providerInstance = null
  }
}
