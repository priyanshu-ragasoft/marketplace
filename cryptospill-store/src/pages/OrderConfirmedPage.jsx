import React, { useEffect, useState } from 'react'
import { useRouter } from '../router/RouterContext'
import { listMyOrders } from '../services/storeDeliveryService'
import { getPublicWebsiteProducts } from '../services/storeProductService'
import logoImg from '../assets/logo.png'
import { downloadOrderReceipt } from '../utils/orderReceiptPdf'

function money(value) {
  const amount = Number(value)
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : '—'
}

function formatWhen(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function savedItemImages(orderId) {
  try {
    const parsed = JSON.parse(sessionStorage.getItem('cryptospill_order_slip') || 'null')
    if (!parsed) return []
    const sameOrder = !parsed.orderId || String(parsed.orderId) === String(orderId) || parsed.orderId === 'slip'
    return sameOrder ? parsed.items || [] : []
  } catch {
    return []
  }
}

function matchImage(item, extras) {
  if (item?.image) return item.image
  const id = String(item?.productId || item?._id || item?.id || '')
  const title = String(item?.title || '').trim().toLowerCase()
  const found = extras.find((row) => {
    const rowId = String(row.productId || row._id || row.id || '')
    const rowTitle = String(row.title || '').trim().toLowerCase()
    return (id && rowId === id) || (title && rowTitle === title)
  })
  return found?.image || ''
}

function PaperEdge({ edge = 'top' }) {
  const top = edge === 'top'
  return (
    <div
      aria-hidden
      className="h-4 w-full"
      style={{
        background: top
          ? 'radial-gradient(circle at 12px 0, transparent 11px, #ffffff 12px) 0 0 / 24px 16px repeat-x'
          : 'radial-gradient(circle at 12px 16px, transparent 11px, #ffffff 12px) 0 0 / 24px 16px repeat-x'
      }}
    />
  )
}

function ItemPhoto({ src, title }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm font-black text-slate-400">
        {(title || 'Item').slice(0, 1)}
      </span>
    )
  }
  return (
    <img
      src={src}
      alt=""
      className="h-14 w-14 shrink-0 rounded-lg border border-slate-200 bg-slate-50 object-contain p-1"
      onError={() => setFailed(true)}
    />
  )
}

export default function OrderConfirmedPage({ orderId }) {
  const { navigate } = useRouter()
  const [order, setOrder] = useState(null)
  const [catalog, setCatalog] = useState([])
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    let cancelled = false
    listMyOrders()
      .then((rows) => {
        if (cancelled) return
        const found = (rows || []).find((row) => String(row._id || row.id) === String(orderId))
        setOrder(found || null)
        setMissing(!found)
      })
      .catch(() => {
        if (!cancelled) setMissing(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [orderId])

  useEffect(() => {
    const items = Array.isArray(order?.items) ? order.items : []
    if (!items.length || items.every((item) => item.image || matchImage(item, savedItemImages(orderId)))) return undefined
    let cancelled = false
    getPublicWebsiteProducts({ page: 1, limit: 100, category: 'all' })
      .then((result) => {
        if (!cancelled) setCatalog(result?.data?.result || [])
      })
      .catch(() => { })
    return () => {
      cancelled = true
    }
  }, [order, orderId])

  if (loading) {
    return <div className="flex min-h-[70vh] items-center justify-center bg-[#f1f3f6] text-sm font-semibold text-slate-500">Opening your order...</div>
  }

  if (missing || !order) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[#f1f3f6] px-6 text-center">
        <h1 className="text-2xl font-black text-slate-900">Order not found</h1>
        <button type="button" onClick={() => navigate('/account/orders')} className="mt-5 rounded-sm bg-[#D1A61B] px-5 py-2.5 text-sm font-bold text-black cursor-pointer">My orders</button>
      </div>
    )
  }

  const confirmed = order.paymentStatus === 'escrow_secured' || ['confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'].includes(order.status)
  if (!confirmed) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[#f1f3f6] px-6 text-center">
        <h1 className="text-2xl font-black text-slate-900">This order is not confirmed yet</h1>
        <p className="mt-2 max-w-md text-sm text-slate-500">Finish the payment on the checkout page. USDT that is already sent does not need to be sent again.</p>
        <button type="button" onClick={() => navigate(`/order/${encodeURIComponent(orderId)}`)} className="mt-5 rounded-sm bg-[#D1A61B] px-5 py-2.5 text-sm font-bold text-black cursor-pointer">Back to checkout</button>
      </div>
    )
  }

  const items = Array.isArray(order.items) ? order.items : []
  const photos = [...savedItemImages(orderId), ...catalog]
  const name = [order.firstName, order.lastName].filter(Boolean).join(' ')
  const placedAt = formatWhen(order.confirmedAt || order.createdAt)

  return (
    <div className="min-h-screen bg-[#e7edf2] px-4 pb-16 pt-8 text-slate-900 sm:pt-12">
      <div className="mx-auto w-full max-w-[440px] drop-shadow-[0_18px_28px_rgba(15,23,42,0.14)]">
        <PaperEdge />
        <div className="-my-px relative overflow-hidden bg-white px-6 pb-7 pt-6 text-center">
          {/* CryptoSpill Authenticity Watermark */}
          <div
            aria-hidden="true"
            className="pointer-events-none select-none absolute inset-0 flex items-center justify-center overflow-hidden z-0"
          >
            <div className="flex flex-col items-center justify-center opacity-[0.06] transform scale-125">
              <img
                src={logoImg}
                alt=""
                className="w-64 h-64 sm:w-72 sm:h-72 object-contain filter grayscale"
              />

            </div>
          </div>

          <div className="relative z-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#2fbe6a] text-white shadow-sm">
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="mt-4 text-[22px] font-black tracking-tight text-slate-950">Order placed</h1>
            <p className="mx-auto mt-2 max-w-[280px] text-[13px] leading-relaxed text-slate-500">Your order has been confirmed. The store will pack it and ship it to you.</p>

            <p className="mt-6 text-sm text-slate-500">Order Number:</p>
            <p className="mt-1 text-[34px] font-black leading-none tracking-tight text-slate-950">{order.orderNumber || 'Order confirmed'}</p>
            {placedAt && <p className="mt-2 text-xs text-slate-400">Confirmed {placedAt}</p>}

            <div className="my-5 border-t border-dashed border-slate-300" />

            <div className="text-left">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Items</p>
              <ul className="mt-2">
                {items.map((item, index) => (
                  <li key={`${item.productId || item.title}-${index}`} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <ItemPhoto src={matchImage(item, photos)} title={item.title} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">{item.title}</p>
                        <p className="text-xs text-slate-500">Qty {item.quantity || 1}</p>
                      </div>
                    </div>
                    <p className="shrink-0 text-sm font-black text-slate-900">{money((Number(item.priceUSD) || 0) * (Number(item.quantity) || 1))}</p>
                  </li>
                ))}
                {items.length === 0 && <li className="py-2 text-sm text-slate-500">Your items are saved on this order.</li>}
              </ul>
            </div>

            <div className="my-4 border-t border-dashed border-slate-300" />

            <div className="grid gap-4 text-left">
              <section>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Delivery address</p>
                <p className="mt-1.5 text-sm font-bold text-slate-900">{name || 'Customer'}</p>
                {order.phone && <p className="text-sm text-slate-600">{[order.countryCode, order.phone].filter(Boolean).join(' ')}</p>}
                {order.email && <p className="break-all text-sm text-slate-600">{order.email}</p>}
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{order.address}</p>
                <p className="text-sm font-semibold text-slate-800">{[order.state, order.country, order.pin].filter(Boolean).join(', ')}</p>
              </section>
              <section>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Payment</p>
                <p className="mt-1.5 text-sm font-bold text-emerald-700">Paid</p>
                <p className="text-sm text-slate-700">{money(order.payableUsd ?? order.paymentAmount ?? order.cartUsd)} · {Number(order.paymentAmount || 0).toLocaleString()} USDT</p>
                {Number(order.ao1Amount) > 0 && <p className="text-sm text-slate-700">{Number(order.ao1Amount).toLocaleString()} AO1 returned</p>}
                <p className="mt-1 text-xs leading-relaxed text-slate-500">Payment is held in escrow until the order is delivered.</p>
              </section>
            </div>

            <p className="mt-6 text-[28px] text-[#e11d48]" style={{ fontFamily: '"Segoe Script", "Brush Script MT", cursive' }}>Thank you!</p>
          </div>
        </div>
        <PaperEdge edge="bottom" />
      </div>

      <div className="mx-auto mt-6 flex w-full max-w-[440px] flex-col gap-3">
        <button
          type="button"
          onClick={() => downloadOrderReceipt(order, null)}
          className="rounded-sm bg-slate-900 hover:bg-slate-800 px-5 py-3 text-sm font-bold text-white cursor-pointer transition flex items-center justify-center gap-2 shadow-xs"
        >
          <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Download PDF Receipt</span>
        </button>
        <button type="button" onClick={() => navigate('/')} className="rounded-sm bg-[#D1A61B] px-5 py-3 text-sm font-black text-black cursor-pointer">Continue shopping</button>
        {new URLSearchParams(window.location.search).get('from') !== 'orders' && (
          <button type="button" onClick={() => navigate('/account/orders')} className="rounded-sm border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-900 cursor-pointer">View my orders</button>
        )}
      </div>
    </div>
  )
}
