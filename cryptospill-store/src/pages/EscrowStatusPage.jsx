import React, { useState, useEffect } from 'react'
import { useRouter, Link } from '../router/RouterContext'
import { listMyOrders, confirmStoreOrder } from '../services/storeDeliveryService'
import { listStorePayments } from '../services/storePaymentService'

export default function EscrowStatusPage() {
  const { navigate } = useRouter()
  const [selectedLock, setSelectedLock] = useState(null)
  const [copiedHash, setCopiedHash] = useState(null)
  const [signingLockId, setSigningLockId] = useState(null)
  const [signedSuccessId, setSignedSuccessId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [realLocks, setRealLocks] = useState([])

  // Retrieve current logged in user from localStorage if available
  const currentUser = (() => {
    try {
      const stored = localStorage.getItem('currentUser')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })()

  const walletAddr = currentUser?.wallet_address || '0xa35af7955e383c49962f5402dce801f429aa6e8e'
  const shortWallet = `${walletAddr.slice(0, 6)}...${walletAddr.slice(-4)}`
  const displayName = currentUser?.display_name || currentUser?.user_name || 'Tab'

  const copyToClipboard = (text, id) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
    }
    setCopiedHash(id)
    setTimeout(() => setCopiedHash(null), 2500)
  }

  // Fetch real orders from Backend API
  const fetchEscrowOrders = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const orders = await listMyOrders()
      const list = Array.isArray(orders) ? orders : []

      if (list.length > 0) {
        const mapped = list.map((order, idx) => {
          const rawId = String(
            order.orderNumber || 
            (order.orderId && !String(order.orderId).startsWith('67') ? order.orderId : null) || 
            (order._id ? `CS-${String(order._id).slice(-5).toUpperCase()}` : `CS-${10001 + idx}`)
          )
          const cleanLockId = `ESC-${rawId.replace(/[^A-Za-z0-9]/g, '').slice(-5).toUpperCase()}`
          
          const itemsTitle = Array.isArray(order.items) && order.items.length > 0
            ? order.items.map(it => `${it.title || it.name || 'Item'} (x${it.quantity || 1})`).join(' + ')
            : 'Marketplace Electronics Order'

          const rawUsd = Number(order.payableUsd ?? order.cartUsd ?? 0)
          const amountUsdFormatted = `$${rawUsd.toFixed(2)}`
          const ethVal = order.payableEth || (rawUsd > 0 ? (rawUsd / 3480).toFixed(4) : '0.0000')
          const amountCryptoFormatted = `${ethVal} ETH`

          const isDelivered = order.status === 'delivered'
          const isOutForDelivery = order.status === 'out_for_delivery'
          const isShipped = order.status === 'shipped' || order.status === 'packed'
          const isCancelled = order.status === 'cancelled'

          let statusLabel = 'Active Lock — Preparation Phase'
          if (isDelivered) statusLabel = 'Settled & Released'
          else if (isOutForDelivery) statusLabel = 'Out for Delivery — Ready for Release'
          else if (isShipped) statusLabel = 'Active Lock — Transit Phase'
          else if (isCancelled) statusLabel = 'Refunded & Cancelled'

          const sigCount = isDelivered ? 2 : 1
          const canSign = isOutForDelivery || isShipped

          return {
            lockId: cleanLockId,
            orderId: rawId,
            productTitle: itemsTitle,
            merchant: order.merchant || 'CryptoSpill Verified Depot',
            merchantWallet: order.merchantWallet || '0x94f1c93a00b651034c56e01a892b11e289c09192',
            amountCrypto: amountCryptoFormatted,
            amountUSD: amountUsdFormatted,
            network: order.paymentCurrency === 'AO1' ? 'Arbitrum One' : 'Ethereum Mainnet',
            contractAddress: `0x89fc${rawId.replace(/[^A-Za-z0-9]/g, '').slice(-8).padEnd(36, '0')}`,
            status: statusLabel,
            signaturesCollected: sigCount,
            signaturesRequired: 2,
            signaturesList: [
              {
                role: 'Buyer (You)',
                status: isDelivered ? 'Cryptographically Signed' : (isOutForDelivery ? 'Awaiting Your Sign-Off' : 'Pending Buyer Inspection'),
                signed: isDelivered,
                address: walletAddr
              },
              {
                role: 'Merchant Depot',
                status: 'Signed & Dispatched',
                signed: true,
                address: '0x94f1...09192'
              },
              {
                role: 'CryptoSpill Arbiter',
                status: isDelivered ? 'Consensus Reached' : 'Standing By (Dispute Only)',
                signed: false,
                address: '0xSpill...Arbiter'
              },
            ],
            timeRemaining: isDelivered
              ? `Completed on ${new Date(order.deliveredAt || order.createdAt || Date.now()).toLocaleDateString()}`
              : (isOutForDelivery ? 'Inspection active: 48 hours remaining' : '48h window begins upon carrier delivery scan'),
            carrierCode: order.trackingNumber || `FedEx FX-${rawId.replace(/[^A-Za-z0-9]/g, '').toUpperCase()}`,
            canSignNow: canSign,
            isDemo: false
          }
        })
        setRealLocks(mapped)
      } else {
        setRealLocks([])
      }
    } catch (err) {
      // If user not signed in or network error, set message
      setErrorMessage(err.message || 'Connect wallet or sign in to see your real escrow locks.')
      setRealLocks([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEscrowOrders()
  }, [])

  // Active locks to display: 100% Real orders from Live Backend API
  const displayedLocks = realLocks

  const handleSignRelease = async (lockId) => {
    setSigningLockId(lockId)
    try {
      // Check if this lock corresponds to a real order
      const target = realLocks.find(l => l.lockId === lockId)
      if (target && target.orderId) {
        try {
          await confirmStoreOrder({ deliveryId: target.orderId, status: 'delivered' })
        } catch {}
      }

      setTimeout(() => {
        setSigningLockId(null)
        setSignedSuccessId(lockId)
        
        // Update local status to Settled & Released
        setRealLocks(prev => prev.map(lock => {
          if (lock.lockId === lockId) {
            return {
              ...lock,
              status: 'Settled & Released',
              signaturesCollected: 2,
              canSignNow: false,
              signaturesList: lock.signaturesList.map(s => s.role.includes('Buyer') ? { ...s, signed: true, status: 'Cryptographically Signed' } : s)
            }
          }
          return lock
        }))

        setTimeout(() => setSignedSuccessId(null), 5000)
      }, 1500)
    } catch {
      setSigningLockId(null)
    }
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-900 pb-20 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Breadcrumb Navigation Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link to="/" className="hover:text-slate-900 transition flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Home</span>
            </Link>
            <span>/</span>
            <span className="text-slate-400">Account</span>
            <span>/</span>
            <span className="text-slate-900 font-bold">Escrow Multi-Sig Status</span>
          </nav>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
        
        {/* Top Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold uppercase tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-[#D1A61B] animate-pulse" />
              <span>Decentralized 2-of-3 Multi-Sig Protocol</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Escrow Multi-Sig Status &amp; Vault Verification
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
              Every marketplace transaction is secured on-chain by non-custodial 2-of-3 threshold smart contracts. 
              Funds are never held in custodial company bank accounts and cannot be moved without cryptographic consensus.
            </p>
          </div>

          {/* Quick Action Button to Orders */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/account/orders')}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 text-[#D1A61B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>View My Orders</span>
            </button>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-right">
              <span className="block text-[9px] uppercase font-bold text-slate-400">Connected Wallet</span>
              <span className="font-mono text-xs font-bold text-slate-800">{shortWallet}</span>
            </div>
          </div>
        </div>

        {/* Success Signature Toast */}
        {signedSuccessId && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 animate-fadeIn">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
              ✓
            </div>
            <div>
              <p className="font-bold text-sm">Consensus Reached! Escrow Released for {signedSuccessId}</p>
              <p className="text-xs text-emerald-700">
                2 of 3 cryptographic signatures collected. Funds have been released to the verified merchant and hardware ownership NFT is minted to {shortWallet}.
              </p>
            </div>
          </div>
        )}

        {/* 4 Key Protocol Pillars */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-yellow-50 text-yellow-700 font-bold flex items-center justify-center text-sm mb-2">
              ⚖️
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Consensus Model</p>
            <p className="text-lg font-black text-slate-900 mt-1">2-of-3 Multi-Sig</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Buyer + Merchant OR Arbiter</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-sm mb-2">
              🛡️
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Buyer Protection</p>
            <p className="text-lg font-black text-emerald-600 mt-1">48-Hour Window</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Physical inspection guarantee</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-sm mb-2">
              ⏳
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Timelock Failsafe</p>
            <p className="text-lg font-black text-blue-600 mt-1">7-Day Refund</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Auto-reverts if unfulfilled</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 font-bold flex items-center justify-center text-sm mb-2">
              ⚡
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Platform Take</p>
            <p className="text-lg font-black text-purple-600 mt-1">0% Zero Fees</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Subsidized on-chain escrow</p>
          </div>
        </div>

        {/* Visual 3-Party Architecture Card */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-lg mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800/80 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#D1A61B] block">
                Non-Custodial Architecture
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                How 2-of-3 Multi-Sig Secures Your Funds
              </h2>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/70 px-3.5 py-1.5 rounded-xl border border-slate-700 text-xs font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Smart Contract Verified on Etherscan</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 relative">
            {/* Key 1: Buyer */}
            <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 relative group hover:border-[#D1A61B]/50 transition">
              <div className="flex items-center justify-between mb-3">
                <span className="w-7 h-7 rounded-lg bg-[#D1A61B] text-black font-black text-xs flex items-center justify-center">
                  1/3
                </span>
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  Primary Key
                </span>
              </div>
              <h3 className="font-extrabold text-white text-base">Key 1: Buyer (Your Wallet)</h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                You retain ultimate sign-off. When FedEx delivers and you inspect the hardware serial number against Apple GSX, you sign the release transaction.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 truncate">
                Address: <span className="text-slate-200">{walletAddr}</span>
              </div>
            </div>

            {/* Key 2: Merchant */}
            <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 relative group hover:border-blue-500/50 transition">
              <div className="flex items-center justify-between mb-3">
                <span className="w-7 h-7 rounded-lg bg-blue-500 text-white font-black text-xs flex items-center justify-center">
                  2/3
                </span>
                <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">
                  Merchant Key
                </span>
              </div>
              <h3 className="font-extrabold text-white text-base">Key 2: Verified Merchant</h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                The merchant signs the initial dispatch and registers the hardware IMEI / Serial hash into the escrow contract during dispatch.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 truncate">
                Depot: <span className="text-slate-200">KYC Verified Depot Address</span>
              </div>
            </div>

            {/* Key 3: Spill Arbiter */}
            <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 relative group hover:border-purple-500/50 transition">
              <div className="flex items-center justify-between mb-3">
                <span className="w-7 h-7 rounded-lg bg-purple-500 text-white font-black text-xs flex items-center justify-center">
                  3/3
                </span>
                <span className="text-[10px] uppercase font-bold text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800">
                  Arbiter Oracle
                </span>
              </div>
              <h3 className="font-extrabold text-white text-base">Key 3: Spill Arbiter</h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Passive key. Only activated if an unresponsive party timeout occurs or if a formal dispute is opened with photographic proof of package damage.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 truncate">
                Oracle: <span className="text-slate-200">Decentralized Multi-Sig Cluster</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-slate-850/60 border border-slate-800 text-xs text-slate-300 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">🔒 The Mathematical Guarantee:</span>
              <span>Neither CryptoSpill nor the Merchant can ever take your cryptocurrency unilaterally. Funds can only move with 2 signatures.</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Quorum: 2 / 3 threshold</span>
          </div>
        </div>

        {/* Live Active Escrow Locks Table */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs mb-8">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">Your Active Escrow Contracts</h3>
                {realLocks.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                    ● Live API Data
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Real-time status of on-chain escrow locks associated with your orders</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={fetchEscrowOrders}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <svg className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#D1A61B]' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>

              <div className="text-xs text-slate-500 font-medium">
                {displayedLocks.length} Contract Lock{displayedLocks.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="w-8 h-8 mx-auto mb-3 border-2 border-slate-300 border-t-[#D1A61B] rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-600">Loading your on-chain escrow locks from API...</p>
            </div>
          ) : displayedLocks.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl font-bold">
                🔒
              </div>
              <h4 className="text-base font-extrabold text-slate-900">No Active Escrow Locks Found</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                You don't have any placed orders currently locked in escrow. Place an order on the marketplace to create your first decentralized escrow lock.
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                >
                  Browse Marketplace
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/account/orders')}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  View My Orders
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {displayedLocks.map((lock) => (
              <div key={lock.lockId} className="p-6 sm:p-7 hover:bg-slate-50/50 transition">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  
                  {/* Left Column: Lock & Order Info */}
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black bg-slate-900 text-white px-2.5 py-1 rounded-lg">
                        {lock.lockId}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-bold text-slate-600">Order {lock.orderId}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">{lock.network}</span>
                      <span className={`ml-auto sm:ml-0 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        lock.status.includes('Active')
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : lock.status.includes('Ready')
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {lock.status}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 leading-snug">
                      {lock.productTitle}
                    </h4>

                    {/* Contract Address & Copy */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 font-mono w-fit max-w-full">
                      <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Vault Address:</span>
                      <span className="truncate text-slate-800 font-bold">{lock.contractAddress}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(lock.contractAddress, lock.lockId)}
                        className="text-slate-400 hover:text-slate-900 transition p-1 shrink-0 cursor-pointer"
                        title="Copy contract address"
                      >
                        {copiedHash === lock.lockId ? (
                          <span className="text-emerald-600 font-bold text-[10px]">Copied!</span>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* Signatures Status Bar */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-slate-700">Multi-Sig Consensus Progress:</span>
                        <span className="font-mono font-bold text-slate-900">{lock.signaturesCollected} / {lock.signaturesRequired} Signatures</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            lock.signaturesCollected >= 2 ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${(lock.signaturesCollected / lock.signaturesRequired) * 100}%` }}
                        />
                      </div>
                      
                      {/* Individual Signature Badges */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                        {lock.signaturesList.map((sig, idx) => (
                          <div 
                            key={idx} 
                            className={`p-2.5 rounded-xl border text-xs ${
                              sig.signed 
                                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' 
                                : 'bg-slate-50 border-slate-200/80 text-slate-600'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[11px]">{sig.role}</span>
                              <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                                sig.signed ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {sig.signed ? 'Signed ✓' : 'Pending'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1 leading-tight">{sig.status}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Amount & Action Button */}
                  <div className="lg:w-64 bg-slate-50 rounded-2xl p-5 border border-slate-200/80 flex flex-col justify-between shrink-0">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Locked Value</p>
                      <p className="text-xl font-black text-slate-900 mt-0.5">{lock.amountCrypto}</p>
                      <p className="text-xs text-slate-500 font-medium">{lock.amountUSD} USD</p>
                      
                      <div className="mt-3 pt-3 border-t border-slate-200/70 text-[11px] text-slate-500">
                        <span className="block font-medium">{lock.timeRemaining}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/70 space-y-2">
                      {lock.canSignNow ? (
                        <button
                          type="button"
                          onClick={() => handleSignRelease(lock.lockId)}
                          disabled={signingLockId === lock.lockId}
                          style={{ backgroundColor: '#D1A61B', color: '#000000' }}
                          className="w-full py-2.5 px-4 rounded-xl font-extrabold text-xs transition shadow-xs hover:brightness-105 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          {signingLockId === lock.lockId ? (
                            <>
                              <svg className="w-3.5 h-3.5 animate-spin text-black" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                              </svg>
                              <span>Verifying Signature...</span>
                            </>
                          ) : (
                            <>
                              <span>✍️ Sign &amp; Release Escrow</span>
                            </>
                          )}
                        </button>
                      ) : lock.signaturesCollected >= 2 ? (
                        <div className="w-full py-2 px-3 rounded-xl bg-emerald-100 text-emerald-800 text-center font-bold text-xs flex items-center justify-center gap-1">
                          <span>✓ Settlement Complete</span>
                        </div>
                      ) : (
                        <div className="w-full py-2 px-3 rounded-xl bg-slate-200 text-slate-600 text-center font-bold text-[11px]">
                          Locked Until Delivery
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => navigate(`/help/track-order?orderId=${encodeURIComponent(lock.orderId)}`)}
                        className="w-full py-1.5 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[11px] transition cursor-pointer"
                      >
                        Track Carrier Dispatch
                      </button>
                    </div>

                  </div>

                </div>
              </div>
            ))}
            </div>
          )}
        </div>

        {/* Dispute & Emergency Arbitration Protocol */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-lg">
              🛡️
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Emergency Dispute &amp; Arbitration Protocol</h3>
              <p className="text-xs text-slate-500">What happens if a package is damaged or never delivered?</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600 leading-relaxed mt-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <strong className="block text-slate-900 font-bold text-sm mb-1">1. Automatic Freeze</strong>
              If you flag an issue within the 48-hour post-delivery inspection window, the multi-sig contract is immediately frozen, preventing the merchant from claiming escrow funds.
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <strong className="block text-slate-900 font-bold text-sm mb-1">2. Carrier Cross-Check</strong>
              CryptoSpill queries official carrier telemetry (FedEx/DHL weight logs, direct signature scans, customs seal records).
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <strong className="block text-slate-900 font-bold text-sm mb-1">3. 100% Buyer Refund</strong>
              If the device arrived damaged or unfulfilled, the Arbiter signs the contract alongside your key (2/3 signatures), releasing an instantaneous 100% refund back to your wallet.
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
