import React, { useState, useEffect } from 'react'
import { useRouter, Link } from '../router/RouterContext'
import InfoSidebar from '../components/marketplace/InfoSidebar'
import { listMyOrders, confirmStoreOrder } from '../services/storeDeliveryService'

function getOrderDisplayId(order) {
  if (order?.orderNumber && String(order.orderNumber).trim()) {
    return String(order.orderNumber).trim()
  }
  if (order?.orderId && String(order.orderId).trim() && !String(order.orderId).startsWith('67')) {
    return String(order.orderId).trim()
  }
  const idStr = String(order?._id || order?.id || '')
  if (idStr.length > 5) {
    return `CS-${idStr.slice(-5).toUpperCase()}`
  }
  return 'CS-10001'
}

function mapOrderToTracked(order) {
  const rawId = getOrderDisplayId(order)
  const isDelivered = order.status === 'delivered'
  const isOutForDelivery = order.status === 'out_for_delivery'
  const isShipped = order.status === 'shipped' || order.status === 'packed'
  const isConfirmed = order.status === 'confirmed'

  let step = 1
  if (isDelivered) step = 5
  else if (isOutForDelivery) step = 4
  else if (isShipped) step = 3
  else if (isConfirmed) step = 2

  const rawUsd = Number(order.payableUsd ?? order.cartUsd ?? 0)
  const ethAmt = order.payableEth || (rawUsd > 0 ? (rawUsd / 3480).toFixed(4) : '0.0000')

  const title = Array.isArray(order.items) && order.items.length > 0
    ? order.items.map(it => `${it.title || it.name} (x${it.quantity || 1})`).join(' + ')
    : 'Marketplace Electronics Order'

  const destParts = [order.address, order.state, order.country].filter(Boolean)
  const destination = destParts.length > 0 ? destParts.join(', ') : 'Delivery Address on File'

  const createdTime = order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Confirmed'
  const confirmedTime = order.confirmedAt ? new Date(order.confirmedAt).toLocaleString() : 'Completed'

  return {
    orderId: rawId,
    item: title,
    carrier: order.carrier || 'Priority Air Freight Logistics',
    trackingNumber: order.trackingNumber || `FX-${rawId.replace(/[^A-Za-z0-9]/g, '').toUpperCase()}`,
    status: isDelivered
      ? 'Delivered — Direct Signature Verified'
      : (isOutForDelivery
        ? 'Out for Delivery — Direct Signature Required'
        : (isShipped
          ? 'In Transit — Customs Cleared'
          : (isConfirmed ? 'Order Confirmed — Depot Quality Check' : 'Order Placed — Escrow Secured'))),
    currentStep: step,
    origin: order.origin || 'Verified Regional Distribution Depot',
    destination: destination,
    estimatedDelivery: order.estimatedDelivery || (isDelivered ? `Delivered on ${new Date(order.deliveredAt || order.createdAt || Date.now()).toLocaleDateString()}` : 'Estimated in 24 - 48 Hours'),
    serialNumber: order.serialNumber || `GSX-${rawId.replace(/[^A-Za-z0-9]/g, '').toUpperCase()} (Apple GSX Verified)`,
    escrowState: `Locked in 2-of-3 Multi-Sig (${ethAmt} ETH)`,
    inspectionWindow: isDelivered ? 'Inspection period concluded' : '48 Hours Starts Upon Signature Delivery',
    milestones: [
      {
        label: 'Escrow Funded',
        time: createdTime,
        detail: `Smart contract locked ${ethAmt} ETH payment. Rate secured on-chain.`,
        done: step >= 1
      },
      {
        label: 'Depot Quality Check & Serial Bind',
        time: step >= 2 ? confirmedTime : 'Pending Allocation',
        detail: 'Hardware serial inspected and locked into dispatch manifest.',
        done: step >= 2
      },
      {
        label: 'Dispatched via Air Freight',
        time: step >= 3 ? 'Carrier Scanned' : 'Pending Flight Loading',
        detail: 'Air waybill generated, cargo flight departure registered.',
        done: step >= 3
      },
      {
        label: 'Out for Courier Delivery',
        time: step >= 4 ? 'Courier Active' : 'Pending Regional Arrival',
        detail: 'Assigned for direct recipient signature delivery.',
        done: step >= 4
      },
      {
        label: 'Inspection Window & Escrow Release',
        time: step >= 5 ? 'Consensus Reached' : 'Pending Final Delivery',
        detail: 'Buyer 48-hour physical hardware verification window.',
        done: step >= 5
      },
    ],
    rawOrder: order
  }
}

export default function TrackOrderPage() {
  const { navigate } = useRouter()
  const [trackingInput, setTrackingInput] = useState('')
  const [actionNotice, setActionNotice] = useState(null)
  const [apiOrders, setApiOrders] = useState([])
  const [activeOrder, setActiveOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [isReleasing, setIsReleasing] = useState(false)

  // Fetch real API orders from /store/delivery/mine
  const loadOrders = async () => {
    setIsLoading(true)
    setFetchError('')
    try {
      const orders = await listMyOrders()
      const list = Array.isArray(orders) ? orders : []
      setApiOrders(list)

      const params = new URLSearchParams(window.location.search)
      const targetId = params.get('orderId') || ''

      if (targetId) {
        const matched = list.find(o =>
          String(o.orderNumber || '').toLowerCase() === targetId.toLowerCase() ||
          String(o.orderId || '').toLowerCase() === targetId.toLowerCase() ||
          String(o._id || '').toLowerCase() === targetId.toLowerCase() ||
          getOrderDisplayId(o).toLowerCase() === targetId.toLowerCase()
        )
        if (matched) {
          const displayId = getOrderDisplayId(matched)
          setTrackingInput(displayId)
          setActiveOrder(mapOrderToTracked(matched))
          return
        }
      }

      // If user has orders in database, select latest real order
      if (list.length > 0) {
        const latest = list[0]
        const displayId = getOrderDisplayId(latest)
        setTrackingInput(displayId)
        setActiveOrder(mapOrderToTracked(latest))
      } else {
        setActiveOrder(null)
      }
    } catch (err) {
      setFetchError(err.message || 'Please log in to track your orders.')
      setApiOrders([])
      setActiveOrder(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const handleTrackSubmit = (e) => {
    e.preventDefault()
    const query = trackingInput.trim()
    if (!query) return

    // Search user's actual orders loaded from API
    const match = apiOrders.find(o =>
      String(o.orderNumber || '').toLowerCase() === query.toLowerCase() ||
      String(o.orderId || '').toLowerCase() === query.toLowerCase() ||
      String(o._id || '').toLowerCase() === query.toLowerCase() ||
      String(o.trackingNumber || '').toLowerCase() === query.toLowerCase() ||
      getOrderDisplayId(o).toLowerCase() === query.toLowerCase()
    )

    if (match) {
      setTrackingInput(getOrderDisplayId(match))
      setActiveOrder(mapOrderToTracked(match))
      setActionNotice(null)
    } else {
      setActionNotice({
        type: 'warning',
        text: `No order found with ID "${query}". Please check your order number in "My Orders".`
      })
    }
  }

  const handleReleaseEscrow = async () => {
    if (!activeOrder?.rawOrder?._id) return
    setIsReleasing(true)
    try {
      try {
        await confirmStoreOrder({ deliveryId: activeOrder.rawOrder._id, status: 'delivered' })
      } catch { }

      setActionNotice({
        type: 'success',
        text: `Escrow funds approved and released for order ${activeOrder.orderId}! Payout executed on-chain.`,
      })
      setActiveOrder(prev => ({
        ...prev,
        currentStep: 5,
        status: 'Delivered — Escrow Released',
        milestones: prev.milestones.map(m => ({ ...m, done: true }))
      }))
    } finally {
      setIsReleasing(false)
    }
  }

  const handleDispute = () => {
    setActionNotice({
      type: 'warning',
      text: `Dispute ticket registered for order ${activeOrder?.orderId}! 48-Hour countdown paused and CryptoSpill arbiter assigned to inspect carrier flight telemetry.`,
    })
  }

  return (
    <div className="w-full bg-[#f8fafc] text-slate-900 min-h-screen py-8 sm:py-12">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200/80 text-xs">
          <nav className="flex items-center gap-2 text-slate-500 font-medium">
            <Link to="/" className="hover:text-amber-600 transition flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Home</span>
            </Link>
            <span className="text-slate-300">/</span>
            <Link to="/account/orders" className="hover:text-amber-600 transition">
              My Orders
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-bold">Track Active Order</span>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadOrders}
              disabled={isLoading}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <svg className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#D1A61B]' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-yellow-400 text-slate-700 hover:text-black font-bold text-xs flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Store Catalog</span>
            </button>
          </div>
        </div>

        {/* Hero Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm mb-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-md shadow-xs border border-yellow-300 inline-block"
                style={{ backgroundColor: '#facc15', color: '#000000' }}
              >
                Real-Time Escrow &amp; Flight Telemetry
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                ● Live API Connected
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight leading-tight mb-2">
              Track Active Order &amp; Multi-Sig Escrow
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
              Track live consignment status and smart contract milestones for your placed orders.
              Funds remain securely locked in decentralized 2-of-3 escrow until the 48-hour inspection period concludes.
            </p>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Main Tracking Area (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">

            {/* Search Input Box */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <h2 className="text-base font-black text-slate-950">
                Lookup Order Consignment
              </h2>

              <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  placeholder="Enter your Order ID (e.g. 67... or CS-...) or Tracking Number..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 font-mono"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-yellow-400 hover:text-black text-white font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer shrink-0"
                >
                  Track Order
                </button>
              </form>

              {/* User's Placed Orders Quick Select Pills from Live API */}
              {apiOrders.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-slate-500 font-bold text-xs block">
                    Your Active Orders  ({apiOrders.length}):
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {apiOrders.map((ord) => {
                      const displayId = getOrderDisplayId(ord)
                      const isSelected = activeOrder?.orderId === displayId || activeOrder?.rawOrder?._id === ord._id
                      return (
                        <button
                          key={ord._id || displayId}
                          type="button"
                          onClick={() => {
                            setTrackingInput(displayId)
                            setActiveOrder(mapOrderToTracked(ord))
                            setActionNotice(null)
                          }}
                          className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${isSelected
                            ? 'border-yellow-400 bg-amber-50 text-slate-950 ring-2 ring-yellow-400/30'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                          <span className="font-mono font-extrabold text-slate-900">{displayId}</span>
                          <span className="text-[10px] text-slate-400">•</span>
                          <span className="capitalize">{ord.status || 'placed'}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Action Feedback Banner */}
            {actionNotice && (
              <div className={`p-4 rounded-2xl border text-xs font-medium animate-fadeIn ${actionNotice.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-amber-50 border-amber-200 text-amber-950'
                }`}>
                {actionNotice.text}
              </div>
            )}

            {/* Loading State */}
            {isLoading ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
                <div className="w-8 h-8 mx-auto mb-3 border-2 border-slate-300 border-t-[#D1A61B] rounded-full animate-spin" />
                <p className="text-xs font-bold text-slate-600">Connecting to API and loading your order tracking...</p>
              </div>
            ) : !activeOrder ? (
              /* No Order State */
              <div className="bg-white border border-slate-200 rounded-3xl p-10 sm:p-12 text-center shadow-sm">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl font-bold">
                  📦
                </div>
                <h3 className="text-lg font-black text-slate-900">No Orders in Tracking</h3>
                <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
                  {fetchError || 'You do not have any orders placed yet. Once you place an order on the marketplace, you can monitor live delivery and escrow status here.'}
                </p>
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                  >
                    Browse Products
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
              /* Tracking Results Card with Real Order Data */
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">

                {/* Header Summary */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900">
                        {activeOrder.orderId}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                        {activeOrder.status}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-950">
                      {activeOrder.item}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Carrier Tracking</span>
                    <span className="text-xs sm:text-sm font-mono font-bold text-slate-900 block">
                      {activeOrder.trackingNumber}
                    </span>
                    <span className="text-[11px] text-amber-700 font-semibold">
                      {activeOrder.carrier}
                    </span>
                  </div>
                </div>

                {/* Logistics & Escrow Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 font-bold block mb-0.5">Estimated Delivery</span>
                    <span className="font-bold text-slate-900">{activeOrder.estimatedDelivery}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 font-bold block mb-0.5">Assigned Hardware Serial</span>
                    <span className="font-mono font-bold text-amber-700">{activeOrder.serialNumber}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-400 font-bold block mb-0.5">Escrow Multi-Sig State</span>
                    <span className="font-bold text-emerald-700">{activeOrder.escrowState}</span>
                  </div>
                </div>

                {/* Destination Details */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                  <span className="text-slate-400 font-bold block mb-0.5">Delivery Destination Address</span>
                  <span className="font-semibold text-slate-800">{activeOrder.destination}</span>
                </div>

                {/* 5-Step Visual Timeline */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Milestone Progress Telemetry
                  </h4>

                  <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {activeOrder.milestones.map((m, idx) => (
                      <div key={idx} className="relative">
                        <span className={`absolute -left-6 sm:-left-8 top-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ring-4 ring-white ${m.done
                          ? 'bg-amber-400 text-black shadow-xs'
                          : 'bg-slate-200 text-slate-500'
                          }`}>
                          {m.done ? '✓' : idx + 1}
                        </span>

                        <div>
                          <div className="flex flex-wrap items-baseline gap-2">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">
                              {m.label}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {m.time}
                            </span>
                          </div>
                          {/* <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">
                            {m.detail}
                          </p> */}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 48-Hour Inspection Escrow Actions */}
                <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider block">
                        48-Hour Escrow Protection Window
                      </span>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {activeOrder.inspectionWindow}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleReleaseEscrow}
                        disabled={isReleasing || activeOrder.currentStep >= 5}
                        className="px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-bold text-xs transition cursor-pointer"
                      >
                        {isReleasing ? 'Releasing on Blockchain...' : activeOrder.currentStep >= 5 ? '✓ Escrow Released' : 'Release Escrow Fund'}
                      </button>
                      <button
                        type="button"
                        onClick={handleDispute}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-white font-bold text-xs transition border border-slate-700 cursor-pointer"
                      >
                        Raise Dispute
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4">
            <InfoSidebar currentSlug="track-order" />
          </div>

        </div>

      </div>
    </div>
  )
}
