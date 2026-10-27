import { connectWithWalletConnect, getWalletConnectProvider, openMetaMaskForAction, restoreWalletConnect } from './walletConnectService'

const ADDRESS = /^0x[a-fA-F0-9]{40}$/
const TRANSFER_SELECTOR = 'a9059cbb'
const TX_RE = /^0x[a-fA-F0-9]{64}$/

export function isHexAddress(value) {
  return ADDRESS.test(String(value || '').trim())
}

export function decimalToUnits(amount, decimals) {
  const places = Number(decimals)
  if (!Number.isInteger(places) || places < 0 || places > 18) throw new Error('Invalid token decimals')
  const raw = String(amount ?? '').trim()
  if (!/^\d+(\.\d+)?$/.test(raw)) throw new Error('Invalid token amount')
  const [whole, frac = ''] = raw.split('.')
  if (frac.length > places) throw new Error('Amount has too many decimals')
  const digits = `${whole}${frac.padEnd(places, '0')}`.replace(/^0+/, '') || '0'
  return BigInt(digits)
}

function encodeErc20Transfer(to, amountUnits) {
  const recipient = String(to || '').trim().toLowerCase()
  if (!ADDRESS.test(recipient)) throw new Error('Invalid USDT recipient')
  const units = typeof amountUnits === 'bigint' ? amountUnits : BigInt(amountUnits)
  if (units <= 0n) throw new Error('USDT amount must be greater than 0')
  return `0x${TRANSFER_SELECTOR}${recipient.slice(2).padStart(64, '0')}${units.toString(16).padStart(64, '0')}`
}

function toHexQuantity(value) {
  const raw = String(value ?? '').trim()
  if (/^0x[0-9a-fA-F]+$/.test(raw)) return raw.toLowerCase() === '0x' ? '0x0' : raw
  return `0x${BigInt(raw).toString(16)}`
}

function isUserRejected(error) {
  const code = error?.code ?? error?.info?.error?.code
  if (code === 4001 || code === 'ACTION_REJECTED') return true
  return /reject|denied|cancelled|canceled/i.test(String(error?.message || ''))
}

function fundsError(error, asset) {
  const raw = `${error?.message || ''} ${error?.data?.message || ''}`
  if (/exceeds balance|transfer amount exceeds|insufficient .*balance/i.test(raw)) {
    return new Error(asset === 'USDT'
      ? `Not enough USDT in this wallet. Add USDT on BNB Smart Chain, then tap Pay again.`
      : `Not enough AO1 in this wallet to send the purchase amount back.`)
  }
  if (/insufficient funds/i.test(raw)) {
    return new Error(asset === 'USDT'
      ? 'Not enough BNB to pay the USDT network fee. Add a little BNB, then tap Pay again.'
      : 'Not enough AO1 for this transfer and its network fee.')
  }
  return null
}

let activeProvider = null

function injectedMetaMask() {
  if (typeof window === 'undefined') return null
  const eth = window.ethereum
  if (!eth) return null
  const list = Array.isArray(eth.providers) && eth.providers.length ? eth.providers : [eth]
  return list.find((provider) => provider?.isMetaMask && provider.request) || (eth.request ? eth : null)
}

function prefersWalletConnect() {
  try {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null')
    return user?.connected_wallet === 'WalletConnect'
  } catch {
    return false
  }
}

function getProviderSync() {
  if (activeProvider?.request) return activeProvider
  const walletConnect = getWalletConnectProvider()
  if (walletConnect?.request) {
    activeProvider = walletConnect
    return walletConnect
  }
  if (prefersWalletConnect()) return null
  const injected = injectedMetaMask()
  if (injected) {
    activeProvider = injected
    return injected
  }
  return null
}

async function getProvider() {
  const existing = getProviderSync()
  if (existing) return existing
  const connected = await connectWithWalletConnect()
  if (!connected?.provider?.request) throw new Error('Connect a wallet to pay')
  activeProvider = connected.provider
  return activeProvider
}

const BSC = {
  chainId: 56,
  chainName: 'BNB Smart Chain',
  rpcUrl: 'https://bsc-dataseed.binance.org/',
  symbol: 'BNB'
}

/** Use the wallet from login. A new WalletConnect prompt opens only when that session is gone. */
export function prepareStoreWallet() {
  if (prefersWalletConnect()) {
    return restoreWalletConnect().then((restored) => {
      if (restored?.provider?.request && isHexAddress(restored.address)) {
        activeProvider = restored.provider
        return String(restored.address).toLowerCase()
      }
      return connectWithWalletConnect()
    }).then(async (connected) => {
      if (typeof connected === 'string') return connected
      if (!connected?.provider?.request) throw new Error('Connect MetaMask with WalletConnect to pay')
      activeProvider = connected.provider
      const account = String(connected.address || '').toLowerCase()
      if (!isHexAddress(account)) throw new Error('Connect MetaMask to pay')
      return account
    })
  }
  const provider = getProviderSync()
  if (!provider) return connectedWallet()
  return provider.request({ method: 'eth_requestAccounts' }).then((accounts) => {
    const account = String((Array.isArray(accounts) ? accounts[0] : '') || '').toLowerCase()
    if (!isHexAddress(account)) throw new Error('Connect MetaMask to pay')
    return account
  })
}

async function readChainId(provider) {
  const hex = await provider.request({ method: 'eth_chainId' })
  return Number(hex)
}

async function readAccount(provider) {
  const accounts = await provider.request({ method: 'eth_accounts' })
  const account = Array.isArray(accounts) ? accounts[0] : ''
  return String(account || '').toLowerCase()
}

export async function connectedWallet() {
  const provider = await getProvider()
  let account = await readAccount(provider)
  if (!account) {
    const requested = await provider.request({ method: 'eth_requestAccounts' })
    account = String((Array.isArray(requested) ? requested[0] : '') || '').toLowerCase()
  }
  if (!isHexAddress(account)) throw new Error('Connect a wallet to pay')
  return account
}

function isNetworkError(error) {
  return /network request failed|failed to fetch|load failed|network error/i.test(String(error?.message || error || ''))
}

async function ensureChain(provider, { chainId, chainName, rpcUrl, symbol }) {
  const target = Number(chainId)
  const targetHex = `0x${target.toString(16)}`
  const onTarget = async () => {
    try {
      return (await readChainId(provider)) === target
    } catch (err) {
      if (isNetworkError(err)) return false
      throw err
    }
  }
  if (await onTarget()) return
  const switchChain = () => {
    const pending = provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: targetHex }] })
    openMetaMaskForAction()
    return pending
  }
  try {
    await switchChain()
  } catch (err) {
    if (isUserRejected(err)) throw err
    try {
      const adding = provider.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: targetHex,
          chainName,
          nativeCurrency: { name: symbol, symbol, decimals: 18 },
          rpcUrls: [rpcUrl]
        }]
      })
      openMetaMaskForAction()
      await adding
    } catch (addErr) {
      if (isUserRejected(addErr)) throw addErr
      if (isNetworkError(addErr) || isNetworkError(err)) {
        throw new Error(`MetaMask could not reach ${chainName}. Open MetaMask, switch to ${chainName}, then tap the button again.`)
      }
    }
    try {
      await switchChain()
    } catch (switchErr) {
      if (isUserRejected(switchErr)) throw switchErr
      if (!(await onTarget())) {
        throw new Error(`Open MetaMask and switch the network to ${chainName}, then tap the button again.`)
      }
    }
  }
  if (!(await onTarget())) {
    throw new Error(`Approve the switch to ${chainName} in your wallet, then tap the button again.`)
  }
}

async function sendTransaction(provider, tx) {
  try {
    const pending = provider.request({ method: 'eth_sendTransaction', params: [tx] })
    openMetaMaskForAction()
    return await pending
  } catch (err) {
    if (isUserRejected(err)) throw new Error('Payment was cancelled in the wallet.')
    const funds = fundsError(err, tx?.value && tx.value !== '0x0' ? 'AO1' : 'USDT')
    if (funds) throw funds
    if (isNetworkError(err)) {
      throw new Error('MetaMask could not reach the network. Open MetaMask, switch to the right network, then tap the button again.')
    }
    throw err
  }
}

async function readBalance(provider, tokenAddress, owner) {
  const data = `0x70a08231${String(owner).slice(2).padStart(64, '0')}`
  const result = await provider.request({ method: 'eth_call', params: [{ to: tokenAddress, data }, 'latest'] })
  return BigInt(result || '0x0')
}

async function readNativeBalance(provider, owner) {
  const result = await provider.request({ method: 'eth_getBalance', params: [owner, 'latest'] })
  return BigInt(result || '0x0')
}

export async function sendStoreUsdt({ from, tokenAddress, to, amount, decimals, chainId }) {
  const provider = await getProvider()
  await ensureChain(provider, {
    chainId,
    chainName: 'BNB Smart Chain',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    symbol: 'BNB'
  })
  const sender = await readAccount(provider)
  if (sender !== String(from).toLowerCase()) throw new Error('Connected wallet does not match the payment account')
  const needed = decimalToUnits(amount, decimals)
  const balance = await readBalance(provider, tokenAddress, sender)
  if (balance < needed) throw new Error('Not enough USDT in this wallet. Add USDT on BNB Smart Chain, then tap Pay again.')
  const gas = await readNativeBalance(provider, sender)
  if (gas < 50000000000000n) throw new Error('Not enough BNB to pay the USDT network fee. Add a little BNB, then tap Pay again.')
  const hash = await sendTransaction(provider, {
    from: sender,
    to: tokenAddress,
    value: '0x0',
    data: encodeErc20Transfer(to, decimalToUnits(amount, decimals)),
    chainId: `0x${Number(chainId).toString(16)}`
  })
  const tx = String(hash || '')
  if (!TX_RE.test(tx)) throw new Error('Wallet did not return a USDT transaction hash')
  console.log('[StorePayment] transaction id', tx)
  console.log('[StorePayment] BscScan', `https://bscscan.com/tx/${tx}`)
  return tx
}

export async function sendStoreAo1({ from, to, amountAo1, chainId, rpcUrl }) {
  const provider = await getProvider()
  await ensureChain(provider, {
    chainId,
    chainName: 'All One Mainnet',
    rpcUrl,
    symbol: 'AO1'
  })
  const sender = await readAccount(provider)
  if (sender !== String(from).toLowerCase()) throw new Error('Connected wallet does not match the payment account')
  const needed = decimalToUnits(amountAo1, 18)
  try {
    const balance = await readNativeBalance(provider, sender)
    if (balance < needed) throw new Error('Not enough AO1 in this wallet to send the purchase amount back.')
  } catch (err) {
    if (!isNetworkError(err) && !/not enough ao1/i.test(String(err?.message || ''))) throw err
    if (/not enough ao1/i.test(String(err?.message || ''))) throw err
  }
  const hash = await sendTransaction(provider, {
    from: sender,
    to,
    value: toHexQuantity(needed.toString()),
    chainId: `0x${Number(chainId).toString(16)}`
  })
  const tx = String(hash || '')
  if (!TX_RE.test(tx)) throw new Error('Wallet did not return an AO1 transaction hash')
  return tx
}
