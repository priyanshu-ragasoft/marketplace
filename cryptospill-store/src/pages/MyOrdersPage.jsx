import React, { useEffect, useMemo, useState } from 'react'
import { Link, useRouter } from '../router/RouterContext'
import { listMyOrders } from '../services/storeDeliveryService'
import { listStorePayments } from '../services/storePaymentService'
import { removeStoreCartItem } from '../services/storeCartService'
import { getPublicWebsiteProducts } from '../services/storeProductService'
import { PRODUCTS } from '../components/marketplace/marketplaceData'
import { downloadOrderReceipt } from '../utils/orderReceiptPdf'

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

function pictureOf(row) {
  return row?.image || row?.imageUrl || row?.thumbnail || ''
}

function titlesMatch(left, right) {
  if (!left || !right) return false
  if (left === right) return true
  const [shorter, longer] = left.length < right.length ? [left, right] : [right, left]
  return shorter.length >= 8 && longer.includes(shorter)
}

function matchImage(item, extras) {
  if (pictureOf(item)) return pictureOf(item)
  const id = String(item?.productId || item?._id || item?.id || '')
  const title = String(item?.title || '').trim().toLowerCase()
  const found = extras.find((row) => {
    const rowId = String(row.productId || row._id || row.id || '')
    const rowTitle = String(row.title || '').trim().toLowerCase()
    return (id && rowId === id) || titlesMatch(title, rowTitle)
  })
  return pictureOf(found)
}

function slipPictures() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem('cryptospill_order_slip') || 'null')
    return Array.isArray(parsed?.items) ? parsed.items : []
  } catch {
    return []
  }
}

export default function MyOrdersPage() {
  const { navigate } = useRouter()
  const [activeFilter, setActiveFilter] = useState('all')
  const [orders, setOrders] = useState([])
  const [catalog, setCatalog] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState(null)

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
  const walletRewards = Number(currentUser?.reward_points) || 0

  useEffect(() => {
    document.documentElement.style.overflow = ''
    document.body.style.overflow = ''
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      listMyOrders(),
      listStorePayments().catch(() => ({ payments: [] }))
    ])
      .then(([rows, data]) => {
        if (cancelled) return
        const list = Array.isArray(rows) ? rows : []
        setOrders(list)
        setPayments(Array.isArray(data?.payments) ? data.payments : [])
        Promise.all(list.filter((order) => order.paymentStatus === 'escrow_secured').map(async (order) => {
          const key = `cart-cleared:${order._id}`
          if (sessionStorage.getItem(key)) return
          sessionStorage.setItem(key, '1')
          await Promise.all((order.items || []).filter((item) => item.productId).map((item) => removeStoreCartItem(item.productId).catch(() => {})))
        })).then(() => window.dispatchEvent(new Event('store-cart-changed')))
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

  useEffect(() => {
    let cancelled = false
    getPublicWebsiteProducts({ page: 1, limit: 100, category: 'all' })
      .then((result) => {
        if (!cancelled) setCatalog(result?.data?.result || [])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const pictures = useMemo(() => [...catalog, ...PRODUCTS, ...slipPictures()], [catalog])

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
    <div className="min-h-screen bg-[#f4f6f8] pb-20 text-slate-900">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3.5 sm:px-6">
          <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
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

      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
        <div className="mb-6 flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">Account</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">My Orders</h1>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-500">
              Order number, items, delivery address, payment, and the latest status.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D1A61B] text-sm font-black uppercase text-black">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-slate-900">{displayName}</p>
              <p className="truncate font-mono text-xs font-bold text-slate-600">{shortWallet}</p>
              <p className="text-[11px] font-bold text-amber-700">Wallet rewards {Math.round(walletRewards).toLocaleString()} PTS</p>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Orders" value={String(orders.length)} detail={money(spent)} />
          <Stat label="In escrow" value={String(escrowCount)} detail="Payment held until delivery" />
          <Stat label="Shipping" value={String(shippingCount)} detail="Packed, shipped, or out for delivery" />
          <Stat label="Delivered" value={String(orders.filter((order) => statusOf(order) === 'delivered').length)} detail="Completed orders" />
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2">
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

        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const status = statusOf(order)
            const items = Array.isArray(order.items) ? order.items : []
            const timeline = Array.isArray(order.timeline) ? order.timeline : []
            const payment = payments.find((row) => String(row.order_id) === String(order._id))
            const cardId = String(order._id || order.orderNumber)
            const open = openId === cardId
            const openPath = order.paymentStatus === 'escrow_secured' || ['confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'].includes(status)
              ? `/order/${encodeURIComponent(order._id || order.id)}/confirmed`
              : `/order/${encodeURIComponent(order._id || order.id)}`
            const rewardPoints = Number(order.rewardPoints) || 0
            const rewardCreditUsd = Number(order.rewardCreditUsd) || 0
            const rewardUsed = rewardPoints > 0 && rewardCreditUsd > 0
            const itemLine = items.length
              ? `${items.length} ${items.length === 1 ? 'item' : 'items'} · ${items.map((item) => item.title).filter(Boolean).join(', ')}`
              : 'No items'
            return (
              <article key={cardId} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : cardId)}
                  className="flex w-full cursor-pointer flex-col gap-3 px-5 py-4 text-left hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-extrabold text-slate-900">{order.orderNumber || 'Order'}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500">{formatWhen(order.createdAt)}</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">{itemLine}</p>
                    {rewardUsed && (
                      <p className="mt-0.5 text-xs font-bold text-emerald-700">Redeemed {money(rewardCreditUsd)} · {Math.round(rewardPoints).toLocaleString()} PTS</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-black text-slate-900">{money(order.payableUsd ?? order.cartUsd)}</p>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${STATUS_STYLE[status] || STATUS_STYLE.placed}`}>
                      {STATUS_LABEL[status] || status}
                    </span>
                    <svg className={`h-4 w-4 text-slate-400 transition ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {open && <>
                <div className="grid gap-5 border-t border-slate-100 px-5 py-5 lg:grid-cols-[minmax(0,1.4fr)_280px] sm:px-6">
                  <div className="space-y-4">
                    <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
                      {items.map((item, index) => (
                        <li key={`${item.productId || item.title}-${index}`} className="flex items-center justify-between gap-3 px-3 py-3 text-sm">
                          <div className="flex min-w-0 items-center gap-3">
                            <ItemThumb src={matchImage(item, pictures)} title={item.title} />
                            <div className="min-w-0">
                              <p className="truncate font-bold text-slate-900">{item.title}</p>
                              <p className="text-xs text-slate-500">Qty {item.quantity || 1}</p>
                            </div>
                          </div>
                          <span className="shrink-0 font-black text-slate-900">{money((Number(item.priceUSD) || 0) * (Number(item.quantity) || 1))}</span>
                        </li>
                      ))}
                      {items.length === 0 && <li className="px-4 py-3 text-sm text-slate-500">No items on this order.</li>}
                    </ul>
                    <div className="grid gap-3 text-sm sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Deliver to</p>
                        <p className="mt-1 font-bold text-slate-900">{customerName(order)}</p>
                        <p className="text-slate-600">{[order.countryCode, order.phone].filter(Boolean).join(' ')}</p>
                        <p className="break-all text-slate-600">{order.email}</p>
                        <p className="mt-1 leading-relaxed text-slate-700">{order.address}</p>
                        <p className="font-semibold text-slate-800">{[order.state, order.country, order.pin].filter(Boolean).join(', ')}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Payment</p>
                        <p className="mt-1 font-bold text-slate-900">{PAYMENT_LABEL[order.paymentStatus] || 'Payment pending'}</p>
                        {order.paymentCurrency && (
                          <p className="text-slate-600">{Number(order.paymentAmount || 0).toLocaleString()} {order.paymentCurrency}</p>
                        )}
                        {Number(order.ao1Amount) > 0 && <p className="text-slate-600">{Number(order.ao1Amount).toLocaleString()} AO1</p>}
                        <p className={`mt-2 font-bold ${rewardUsed ? 'text-emerald-700' : 'text-slate-500'}`}>
                          Redeemed {rewardUsed ? money(rewardCreditUsd) : money(0)}
                        </p>
                        {rewardUsed && (
                          <p className="text-xs text-slate-600">{Math.round(rewardPoints).toLocaleString()} wallet reward points</p>
                        )}
                        <PaymentLines payment={payment} />
                        {order.confirmedAt && <p className="mt-1 text-xs text-slate-500">Confirmed {formatWhen(order.confirmedAt)}</p>}
                        {order.deliveredAt && <p className="text-xs text-slate-500">Delivered {formatWhen(order.deliveredAt)}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
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
                <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:px-6">
                  <button
                    type="button"
                    onClick={() => downloadOrderReceipt(order, payment)}
                    className="rounded-xl bg-[#D1A61B] px-4 py-2.5 text-xs font-black text-black cursor-pointer"
                  >
                    Download receipt
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/help/track-order?orderId=${encodeURIComponent(order.orderNumber || order.orderId || order._id || order.id)}`)}
                    className="rounded-xl border border-amber-300 bg-amber-50/70 hover:bg-amber-100/70 px-4 py-2.5 text-xs font-bold text-amber-900 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>📦 Track Escrow &amp; Logistics</span>
                  </button>
                  {(order._id || order.id) && (
                    <button
                      type="button"
                      onClick={() => navigate(`${openPath}?from=orders`)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-900 cursor-pointer"
                    >
                      View order
                    </button>
                  )}
                </div>
                </>}
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ItemThumb({ src, title }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-400">
        {(title || 'Item').slice(0, 1)}
      </span>
    )
  }
  return (
    <img
      src={src}
      alt=""
      className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 bg-white object-contain p-1"
      onError={() => setFailed(true)}
    />
  )
}

function shortHash(value) {
  const hash = `${value || ''}`
  if (hash.length < 16) return hash
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`
}

function PaymentLines({ payment }) {
  if (!payment) return <p className="mt-1 text-slate-500">No payment statement yet.</p>
  return (
    <div className="mt-2 space-y-1 text-slate-600">
      <p className="font-semibold text-slate-800">Statement {payment.status}</p>
      <p>{payment.usd_amount} USDT · {payment.payment_id}</p>
      {payment.usd_tx_hash && <p>USDT tx {shortHash(payment.usd_tx_hash)}</p>}
      {payment.ao1_credit_tx_hash && <p>AO1 received {shortHash(payment.ao1_credit_tx_hash)}</p>}
      {payment.ao1_return_tx_hash && <p>AO1 returned {shortHash(payment.ao1_return_tx_hash)}</p>}
      {payment.confirmed_at && <p>Paid {formatWhen(payment.confirmed_at)}</p>}
    </div>
  )
}

function Stat({ label, value, detail }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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
