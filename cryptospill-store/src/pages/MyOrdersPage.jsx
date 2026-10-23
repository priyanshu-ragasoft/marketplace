import React, { useEffect, useMemo, useState } from 'react'
import { Link, useRouter } from '../router/RouterContext'
import { listMyOrders } from '../services/storeDeliveryService'

const STATUS_LABEL = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  packed: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
}

const STATUS_STYLE = {
  placed: 'bg-amber-50 text-amber-800 border-amber-200',
  confirmed: 'bg-sky-50 text-sky-800 border-sky-200',
  packed: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  shipped: 'bg-blue-50 text-blue-700 border-blue-200',
  out_for_delivery: 'bg-orange-50 text-orange-800 border-orange-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200'
}

const PAYMENT_LABEL = {
  pending: 'Payment pending',
  escrow_secured: 'Escrow secured',
  refunded: 'Refunded'
}

function money(value) {
  const amount = Number(value)
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : '—'
}

function formatWhen(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

function statusOf(order) {
  return order.status || 'placed'
}

function customerName(order) {
  return [order.firstName, order.lastName].filter(Boolean).join(' ') || 'Customer'
}

export default function MyOrdersPage() {
  const { navigate } = useRouter()
  const [activeFilter, setActiveFilter] = useState('all')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const currentUser = (() => {
    try {
      const stored = localStorage.getItem('currentUser')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })()

  const walletAddr = currentUser?.wallet_address || ''
  const shortWallet = walletAddr.length > 12 ? `${walletAddr.slice(0, 6)}...${walletAddr.slice(-4)}` : walletAddr || 'Not connected'
  const displayName = currentUser?.display_name || currentUser?.user_name || 'Shopper'

  useEffect(() => {
    let cancelled = false
    listMyOrders()
      .then((rows) => {
        if (!cancelled) setOrders(rows)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load your orders.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filteredOrders = useMemo(() => {
    if (activeFilter === 'escrow') return orders.filter((order) => order.paymentStatus === 'escrow_secured' && statusOf(order) !== 'delivered' && statusOf(order) !== 'cancelled')
    if (activeFilter === 'delivered') return orders.filter((order) => statusOf(order) === 'delivered')
    if (activeFilter === 'active') return orders.filter((order) => !['delivered', 'cancelled'].includes(statusOf(order)))
    return orders
  }, [orders, activeFilter])

  const spent = orders
    .filter((order) => statusOf(order) !== 'cancelled')
    .reduce((sum, order) => sum + (Number(order.payableUsd ?? order.cartUsd) || 0), 0)
  const escrowCount = orders.filter((order) => order.paymentStatus === 'escrow_secured' && !['delivered', 'cancelled'].includes(statusOf(order))).length
  const shippingCount = orders.filter((order) => ['packed', 'shipped', 'out_for_delivery'].includes(statusOf(order))).length

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-900 pb-20">
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
            <span className="text-slate-900 font-bold">My Orders</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-50 border border-yellow-200 text-yellow-900 text-xs font-bold uppercase tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-[#D1A61B] animate-pulse" />
              <span>Your orders</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">My Orders</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
              Every order you place, with its number, items, delivery address, payment, and the latest status.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex items-center gap-4 shrink-0">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm uppercase shadow-xs shrink-0" style={{ backgroundColor: '#D1A61B', color: '#000000' }}>
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-extrabold text-slate-900 text-sm">{displayName}</p>
              <span className="font-mono text-xs font-bold text-slate-600">{shortWallet}</span>
              <p className="text-[11px] text-slate-400 mt-0.5">{orders.length} {orders.length === 1 ? 'order' : 'orders'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Stat label="Orders" value={String(orders.length)} detail={money(spent)} />
          <Stat label="In escrow" value={String(escrowCount)} detail="Payment held until delivery" />
          <Stat label="Shipping" value={String(shippingCount)} detail="Packed, shipped, or out for delivery" />
          <Stat label="Delivered" value={String(orders.filter((order) => statusOf(order) === 'delivered').length)} detail="Completed orders" />
        </div>

        <div className="flex items-center gap-2 border-b border-slate-200 pb-4 mb-6 overflow-x-auto">
          <Filter active={activeFilter === 'all'} onClick={() => setActiveFilter('all')}>All ({orders.length})</Filter>
          <Filter active={activeFilter === 'active'} onClick={() => setActiveFilter('active')}>Active ({orders.filter((order) => !['delivered', 'cancelled'].includes(statusOf(order))).length})</Filter>
          <Filter active={activeFilter === 'escrow'} onClick={() => setActiveFilter('escrow')}>In escrow ({escrowCount})</Filter>
          <Filter active={activeFilter === 'delivered'} onClick={() => setActiveFilter('delivered')}>Delivered ({orders.filter((order) => statusOf(order) === 'delivered').length})</Filter>
          <button type="button" onClick={() => navigate('/account/escrow')} className="ml-auto px-4 py-2 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition cursor-pointer shrink-0">
            Escrow vault
          </button>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading your orders...</p>}
        {!loading && error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
        {!loading && !error && filteredOrders.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center">
            <p className="text-sm font-bold text-slate-900">No orders in this view</p>
            <p className="mt-1 text-xs text-slate-500">Orders appear here after you check out from the cart.</p>
          </div>
        )}

        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const status = statusOf(order)
            const items = Array.isArray(order.items) ? order.items : []
            const timeline = Array.isArray(order.timeline) ? order.timeline : []
            return (
              <article key={order._id || order.orderNumber} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-extrabold text-slate-900">{order.orderNumber || 'Order'}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500">{formatWhen(order.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{PAYMENT_LABEL[order.paymentStatus] || 'Payment pending'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-black text-slate-900">{money(order.payableUsd ?? order.cartUsd)}</p>
                      {Number(order.cartUsd) !== Number(order.payableUsd) && (
                        <p className="text-[11px] text-slate-400">Cart {money(order.cartUsd)}</p>
                      )}
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${STATUS_STYLE[status] || STATUS_STYLE.placed}`}>
                      {STATUS_LABEL[status] || status}
                    </span>
                  </div>
                </div>

                <div className="grid gap-6 py-5 lg:grid-cols-3">
                  <div className="space-y-3 lg:col-span-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50">
                      <p className="border-b border-slate-200 px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Items</p>
                      <ul className="divide-y divide-slate-200">
                        {items.map((item, index) => (
                          <li key={`${item.productId || item.title}-${index}`} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                            <span className="font-semibold text-slate-800">{item.quantity || 1} × {item.title}</span>
                            <span className="font-bold text-slate-900">{money((Number(item.priceUSD) || 0) * (Number(item.quantity) || 1))}</span>
                          </li>
                        ))}
                        {items.length === 0 && <li className="px-4 py-3 text-sm text-slate-500">No items on this order.</li>}
                      </ul>
                    </div>
                    <div className="grid gap-3 text-xs sm:grid-cols-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400">Deliver to</p>
                        <p className="mt-1 font-semibold text-slate-800">{customerName(order)}</p>
                        <p className="text-slate-600">{[order.countryCode, order.phone].filter(Boolean).join(' ')}</p>
                        <p className="text-slate-600">{order.email}</p>
                        <p className="mt-1 text-slate-700">{order.address}</p>
                        <p className="font-semibold text-slate-800">{[order.state, order.country, order.pin].filter(Boolean).join(', ')}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400">Payment</p>
                        <p className="mt-1 font-semibold text-slate-800">{PAYMENT_LABEL[order.paymentStatus] || 'Payment pending'}</p>
                        {order.paymentCurrency && (
                          <p className="text-slate-600">{Number(order.paymentAmount || 0).toLocaleString()} {order.paymentCurrency}</p>
                        )}
                        {Number(order.ao1Amount) > 0 && <p className="text-slate-600">{Number(order.ao1Amount).toLocaleString()} AO1</p>}
                        {order.confirmedAt && <p className="mt-1 text-slate-500">Confirmed {formatWhen(order.confirmedAt)}</p>}
                        {order.deliveredAt && <p className="text-slate-500">Delivered {formatWhen(order.deliveredAt)}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Status</p>
                    <ol className="mt-3 space-y-3">
                      {(timeline.length ? timeline : [{ status, note: STATUS_LABEL[status], at: order.createdAt }]).map((event, index) => (
                        <li key={`${event.status}-${event.at}-${index}`} className="flex gap-2">
                          <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${index === timeline.length - 1 || timeline.length === 0 ? 'bg-[#D1A61B]' : 'bg-slate-300'}`} />
                          <div>
                            <p className="text-sm font-bold text-slate-900">{STATUS_LABEL[event.status] || event.status}</p>
                            {event.note && <p className="text-xs text-slate-500">{event.note}</p>}
                            <p className="text-[11px] text-slate-400">{formatWhen(event.at)}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, detail }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
      <p className="text-[11px] text-slate-500 mt-0.5">{detail}</p>
    </div>
  )
}

function Filter({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${active ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
    >
      {children}
    </button>
  )
}
