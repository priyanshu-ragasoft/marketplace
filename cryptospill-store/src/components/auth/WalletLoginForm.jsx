import React, { useState } from 'react'
import { connectWithWalletConnect, disconnectWalletConnect } from '../../utils/walletConnectService'

// Official WalletConnect Brand Icon
function WalletConnectBrandIcon({ className = "w-full h-full" }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#3B99FC" />
      <path
        d="M9.8 12.8c3.4-3.4 9-3.4 12.4 0l.4.4a.4.4 0 010 .6l-1.4 1.4a.3.3 0 01-.4 0l-.6-.6c-2.4-2.4-6.2-2.4-8.6 0l-.6.6a.3.3 0 01-.4 0L9.4 13.8a.4.4 0 010-.6l.4-.4zm15.4 3l1.2 1.2a.4.4 0 010 .6l-5.6 5.6a.4.4 0 01-.6 0l-4-4a.3.3 0 00-.4 0l-4 4a.4.4 0 01-.6 0l-5.6-5.6a.4.4 0 010-.6l1.2-1.2a.4.4 0 01.6 0l4 4a.3.3 0 00.4 0l4-4a.4.4 0 01.6 0l4 4a.3.3 0 00.4 0l4-4a.4.4 0 01.6 0z"
        fill="#FFFFFF"
      />
    </svg>
  )
}

export default function WalletLoginForm({ onLoginSuccess }) {
  const [userName, setUserName] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [isConnectingWallet, setIsConnectingWallet] = useState(false)
  const [isManualInputMode, setIsManualInputMode] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Directly triggers official WalletConnect QR Modal (300+ wallets)
  const handleConnectWalletConnect = async () => {
    setErrorMessage('')
    setIsConnectingWallet(true)

    try {
      const res = await connectWithWalletConnect()
      if (res && res.address) {
        setWalletAddress(res.address)
        setIsManualInputMode(false)
      }
    } catch (err) {
      if (err?.message?.includes('closed') || err?.message?.includes('cancelled')) {
        // user simply closed the QR modal
      } else {
        setErrorMessage(err.message || 'Failed to connect via WalletConnect.')
      }
    } finally {
      setIsConnectingWallet(false)
    }
  }

  const handleDisconnect = async () => {
    await disconnectWalletConnect()
    setWalletAddress('')
  }

  const handleCopyAddress = () => {
    if (!walletAddress) return
    navigator.clipboard.writeText(walletAddress)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 1800)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    const trimmedUser = userName.trim()
    const trimmedWallet = walletAddress.trim()

    // 1. Validation checks
    if (!trimmedUser && !trimmedWallet) {
      setErrorMessage('Username and Wallet connection are required')
      return
    }
    if (!trimmedUser) {
      setErrorMessage('Username is required')
      return
    }
    if (!trimmedWallet) {
      setErrorMessage('Please connect with WalletConnect or enter your address')
      return
    }

    // 2. Client-side validation: 0x + 40 hex characters
    const walletRegex = /^0x[a-fA-F0-9]{40}$/
    if (!walletRegex.test(trimmedWallet)) {
      setErrorMessage('Invalid wallet address (must start with 0x + 40 hex characters)')
      return
    }

    // 3. API Request
    const rawApi = import.meta.env.VITE_WALLET_LOGIN_API
    const rawBase = import.meta.env.VITE_API_BASE_URL
    const apiEndpoint = rawApi?.trim() || 
      `${(rawBase ? rawBase.trim().replace(/\/+$/, '') : 'https://apis.cryptospill.io')}/api/v1/user/auth/userwalletlogin`

    setIsLoading(true)

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: trimmedWallet,
          user_name: trimmedUser,
        }),
      })

      if (response.status === 429) {
        setErrorMessage('Try again later.')
        setIsLoading(false)
        return
      }

      if (response.status === 417) {
        setErrorMessage('Invalid wallet address')
        setIsLoading(false)
        return
      }

      if (response.status === 400) {
        setErrorMessage('Unable to sign in')
        setIsLoading(false)
        return
      }

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        const errorMsg = result?.message || 'Unable to sign in'
        setErrorMessage(errorMsg)
        setIsLoading(false)
        return
      }

      // Success
      if (result && (result.success || response.status === 200)) {
        const backendData = result.data || result
        const userData = {
          wallet_address: backendData.wallet_address || trimmedWallet,
          user_name: backendData.user_name || trimmedUser,
          username: backendData.user_name || trimmedUser,
          display_name: backendData.display_name || backendData.user_name || trimmedUser,
          name: backendData.display_name || backendData.user_name || trimmedUser,
          connected_wallet: 'WalletConnect',
          ...backendData,
        }

        if (userData.access_token) {
          localStorage.setItem('access_token', userData.access_token)
        }
        if (userData.refresh_token) {
          localStorage.setItem('refresh_token', userData.refresh_token)
        }
        localStorage.setItem('currentUser', JSON.stringify(userData))

        if (onLoginSuccess) {
          onLoginSuccess(userData)
        }
      } else {
        const fallbackMsg = result?.message || 'Unable to sign in'
        setErrorMessage(fallbackMsg)
      }
    } catch (err) {
      setErrorMessage('Unable to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
      {/* Error Alert Message */}
      {errorMessage && (
        <div 
          role="alert"
          className="p-3 sm:p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2 animate-fadeIn"
        >
          <svg className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="leading-snug">{errorMessage}</span>
        </div>
      )}

      {/* Username Field */}
      <div>
        <label 
          htmlFor="wallet-username" 
          className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5"
        >
          Username *
        </label>
        <div className="relative">
          <input
            id="wallet-username"
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            disabled={isLoading}
            placeholder="Enter your username"
            className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-slate-900 text-sm sm:text-base font-medium px-4 py-3 sm:py-3.5 rounded-xl border border-slate-300 focus:border-[#D1A61B] focus:ring-2 focus:ring-[#D1A61B]/20 outline-none transition placeholder-slate-400 disabled:opacity-60"
          />
        </div>
      </div>

      {/* Wallet Connection Field */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs sm:text-sm font-bold text-slate-800">
            Crypto Wallet *
          </label>
          <button
            type="button"
            onClick={() => setIsManualInputMode(!isManualInputMode)}
            className="text-[11px] sm:text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            {isManualInputMode ? '⚡ Connect via WalletConnect' : 'Or enter address manually'}
          </button>
        </div>

        {/* STATE A: Wallet Connected via WalletConnect */}
        {walletAddress && !isManualInputMode ? (
          <div className="w-full px-3.5 py-3 rounded-xl border border-blue-300/80 bg-blue-50/50 flex items-center justify-between gap-2 transition shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 shadow-2xs border border-blue-200 bg-white">
                <WalletConnectBrandIcon />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-xs font-bold text-blue-950 truncate">
                    WalletConnect Connected
                  </span>
                </div>
                <p className="font-mono text-xs text-slate-700 font-semibold tracking-tight truncate mt-0.5">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleCopyAddress}
                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer shadow-2xs"
                title="Copy address"
              >
                {isCopied ? 'Copied!' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 transition cursor-pointer shadow-2xs"
                title="Disconnect"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : !isManualInputMode ? (
          /* STATE B: Direct WalletConnect Trigger (Black Border & Black Button) */
          <button
            type="button"
            onClick={handleConnectWalletConnect}
            disabled={isConnectingWallet || isLoading}
            className="w-full min-h-[56px] px-3.5 sm:px-4 py-2.5 rounded-xl border border-black hover:border-black bg-white hover:bg-slate-50 text-slate-900 transition-all flex items-center justify-between gap-3 group cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.995]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl overflow-hidden shadow-2xs border border-slate-200 shrink-0 bg-white">
                <WalletConnectBrandIcon />
              </div>
              <div className="text-left min-w-0">
                <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-black transition block leading-tight">
                  Connect WalletConnect
                </span>
                <span className="text-[11px] text-slate-500 block leading-tight mt-1">
                  Scan QR with any mobile wallet
                </span>
              </div>
            </div>

            <div className="shrink-0">
              {isConnectingWallet ? (
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100">
                  <svg className="animate-spin h-3.5 w-3.5 text-black" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Connecting...</span>
                </span>
              ) : (
                <span className="text-xs font-bold text-white bg-black hover:bg-neutral-800 group-hover:shadow-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1">
                  <span>Connect</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                </span>
              )}
            </div>
          </button>
        ) : (
          /* STATE C: Manual Input Field */
          <div className="space-y-1">
            <input
              id="wallet-address"
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              disabled={isLoading}
              placeholder="0x followed by 40 hex characters"
              className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-slate-900 text-sm sm:text-base font-mono px-4 py-3 sm:py-3.5 rounded-xl border border-slate-300 focus:border-[#D1A61B] focus:ring-2 focus:ring-[#D1A61B]/20 outline-none transition placeholder-slate-400 disabled:opacity-60"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Must start with 0x followed by exactly 40 hexadecimal characters.
            </p>
          </div>
        )}
      </div>

      {/* Login Submit Button */}
      <div className="pt-1">
        <button
          type="submit"
          disabled={isLoading}
          style={{ backgroundColor: '#D1A61B', color: '#000000' }}
          className="w-full py-3.5 sm:py-4 hover:brightness-105 active:brightness-95 font-black text-sm sm:text-base tracking-wider uppercase rounded-xl shadow-xs hover:shadow transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Logging in...</span>
            </>
          ) : (
            <span>LOGIN</span>
          )}
        </button>
      </div>
    </form>
  )
}
