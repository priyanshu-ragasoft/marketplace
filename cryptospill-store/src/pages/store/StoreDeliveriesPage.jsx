import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { listStoreDeliveries, updateStoreOrderStatus } from '../../services/storeDeliveryService'

const STATUSES = [
  { id: 'placed', label: 'Placed' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'packed', label: 'Packed' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'out_for_delivery', label: 'Out for delivery' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' }
]

const STATUS_STYLE = {
  placed: 'bg-amber-50 text-amber-800 border-amber-200',
  confirmed: 'bg-sky-50 text-sky-800 border-sky-200',
  packed: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  shipped: 'bg-violet-50 text-violet-800 border-violet-200',
  out_for_delivery: 'bg-orange-50 text-orange-800 border-orange-200',
  delivered: 'bg-emerald-50 text-emerald-800 border-emerald-200',
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

function statusLabel(status) {
  return STATUSES.find((item) => item.id === status)?.label || 'Placed'
}

function customerName(order) {
  return [order.firstName, order.lastName].filter(Boolean).join(' ') || order.user_name || 'Customer'
}

function phoneText(order) {
  return [order.countryCode, order.phone].filter(Boolean).join(' ')
}

function lineTotal(item) {
  return (Number(item.priceUSD) || 0) * (Number(item.quantity) || 1)
}

function StatusPill({ status }) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLE[status] || STATUS_STYLE.placed}`}>
      {statusLabel(status)}
    </span>
  )
}

export default function StoreDeliveriesPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState('')
  const [draftStatus, setDraftStatus] = useState('placed')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const rows = await listStoreDeliveries()
      setOrders(rows)
      setSelectedId((current) => current || rows[0]?._id || '')
    } catch (err) {
      setOrders([])
      setError(err.message || 'Could not load orders.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const selected = orders.find((order) => order._id === selectedId) || null

  useEffect(() => {
    setDraftStatus(selected?.status || 'placed')
    setSaveError('')
  }, [selected?._id, selected?.status])

  const visible = useMemo(() => {
    if (filter === 'all') return orders
    return orders.filter((order) => (order.status || 'placed') === filter)
  }, [orders, filter])

  const counts = useMemo(() => {
    const tally = { all: orders.length }
    STATUSES.forEach((item) => {
      tally[item.id] = orders.filter((order) => (order.status || 'placed') === item.id).length
    })
    return tally
  }, [orders])

  const paidVolume = orders
    .filter((order) => order.paymentStatus === 'escrow_secured' && order.status !== 'cancelled')
    .reduce((sum, order) => sum + (Number(order.payableUsd ?? order.cartUsd) || 0), 0)

  const awaiting = counts.placed || 0
  const fulfilling = (counts.confirmed || 0) + (counts.packed || 0) + (counts.shipped || 0) + (counts.out_for_delivery || 0)

  const saveStatus = async () => {
    if (!selected?._id || draftStatus === selected.status) return
    setSaving(true)
    setSaveError('')
    try {
      const updated = await updateStoreOrderStatus({ id: selected._id, status: draftStatus })
      const next = updated?.order || updated
      setOrders((current) => current.map((order) => (order._id === selected._id ? { ...order, ...next } : order)))
    } catch (err) {
      setSaveError(err.message || 'Could not update the order.')
    } finally {
      setSaving(false)
    }
  }

  const deskEmpty = !loading && !error && orders.length === 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Summary label="Orders" value={counts.all} hint="All checkouts" />
        <Summary label="Awaiting payment" value={awaiting} hint="Placed, not paid" />
        <Summary label="In fulfillment" value={fulfilling} hint="Confirmed through delivery" />
        <Summary label="Paid volume" value={money(paidVolume)} hint="Escrow secured" />
      </div>

      {deskEmpty && (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-50">
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          </span>
          <h3 className="mt-4 text-lg font-black text-slate-900">No orders yet</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            A checkout shows up here once, with its order number, customer, payment, and delivery status.
          </p>
          <button type="button" onClick={load} className="mt-5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white cursor-pointer">
            Refresh
          </button>
        </div>
      )}

      {!deskEmpty && (
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3">
            <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>All {counts.all}</FilterChip>
            {STATUSES.map((item) => (
              <FilterChip key={item.id} active={filter === item.id} onClick={() => setFilter(item.id)}>
                {item.label} {counts[item.id] || 0}
              </FilterChip>
            ))}
            <button type="button" onClick={load} className="ml-auto rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white cursor-pointer">
              Refresh
            </button>
          </div>

          {loading && <p className="px-5 py-10 text-sm text-slate-500">Loading orders...</p>}
          {!loading && error && <p className="px-5 py-10 text-sm font-semibold text-rose-600">{error}</p>}
          {!loading && !error && visible.length === 0 && (
            <p className="px-5 py-10 text-sm text-slate-500">No orders in this status.</p>
          )}

          {!loading && !error && visible.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-bold">Order</th>
                    <th className="px-4 py-3 font-bold">Customer</th>
                    <th className="px-4 py-3 font-bold">Total</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((order) => (
                    <tr
                      key={order._id}
                      onClick={() => setSelectedId(order._id)}
                      className={`cursor-pointer ${selectedId === order._id ? 'bg-yellow-50' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-black text-slate-900">{order.orderNumber || 'CS-—'}</p>
                        <p className="text-[11px] text-slate-500">{formatWhen(order.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{customerName(order)}</p>
                        <p className="text-[11px] text-slate-500">{phoneText(order)}</p>
                      </td>
                      <td className="px-4 py-3 font-black text-slate-900">{money(order.payableUsd ?? order.cartUsd)}</td>
                      <td className="px-4 py-3"><StatusPill status={order.status || 'placed'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {!selected && (
            <div className="px-6 py-16 text-center">
              <p className="text-sm font-black text-slate-900">Order details</p>
              <p className="mt-1 text-sm text-slate-500">Select an order to see the customer, items, payment, and timeline.</p>
            </div>
          )}
          {selected && (
            <div className="space-y-5 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-600">Order</p>
                  <h3 className="mt-1 text-2xl font-black text-slate-900">{selected.orderNumber || 'CS-—'}</h3>
                  <p className="mt-1 text-xs text-slate-500">Placed {formatWhen(selected.createdAt)}</p>
                </div>
                <StatusPill status={selected.status || 'placed'} />
              </div>

              <OrderTrack status={selected.status || 'placed'} />

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={draftStatus}
                  onChange={(event) => setDraftStatus(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-slate-900"
                >
                  {STATUSES.map((item) => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={saveStatus}
                  disabled={saving || draftStatus === (selected.status || 'placed')}
                  className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? 'Updating...' : 'Update order'}
                </button>
              </div>
              {saveError && <p className="text-xs font-semibold text-rose-600">{saveError}</p>}

              <section className="grid gap-3 sm:grid-cols-2">
                <Info title="Customer" lines={[customerName(selected), selected.email, phoneText(selected), selected.user_name ? `@${selected.user_name}` : '']} />
                <Info title="Ship to" lines={[selected.address, [selected.state, selected.country].filter(Boolean).join(', '), selected.pin]} />
              </section>

              <section className="rounded-xl border border-slate-200">
                <p className="border-b border-slate-200 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Items</p>
                <ul className="divide-y divide-slate-100">
                  {(selected.items || []).map((item, index) => (
                    <li key={`${item.productId || item.title}-${index}`} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                      <span className="text-slate-700">{item.quantity || 1} × {item.title}</span>
                      <span className="font-semibold text-slate-900">{money(lineTotal(item))}</span>
                    </li>
                  ))}
                  {(selected.items || []).length === 0 && <li className="px-3 py-3 text-sm text-slate-500">No items on this order.</li>}
                </ul>
              </section>

              <section className="space-y-1 text-sm">
                <Row label="Cart total" value={money(selected.cartUsd)} />
                <Row label="Amount due" value={money(selected.payableUsd ?? selected.cartUsd)} strong />
                <Row label="Payment" value={PAYMENT_LABEL[selected.paymentStatus] || 'Payment pending'} />
                {selected.paymentCurrency && (
                  <Row label="Paid in" value={`${Number(selected.paymentAmount || 0).toLocaleString()} ${selected.paymentCurrency}`} />
                )}
                {Number(selected.ao1Amount) > 0 && <Row label="AO1" value={Number(selected.ao1Amount).toLocaleString()} />}
                {selected.confirmedAt && <Row label="Confirmed" value={formatWhen(selected.confirmedAt)} />}
                {selected.deliveredAt && <Row label="Delivered" value={formatWhen(selected.deliveredAt)} />}
              </section>

              <section>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Timeline</p>
                <ol className="mt-2 space-y-2">
                  {(selected.timeline || []).slice().reverse().map((event, index) => (
                    <li key={`${event.status}-${event.at}-${index}`} className="rounded-xl bg-slate-50 px-3 py-2">
                      <p className="text-sm font-bold text-slate-900">{statusLabel(event.status)}</p>
                      <p className="text-xs text-slate-600">{event.note}</p>
                      <p className="text-[11px] text-slate-400">{formatWhen(event.at)}</p>
                    </li>
                  ))}
                  {(selected.timeline || []).length === 0 && <p className="mt-2 text-xs text-slate-500">No status history yet.</p>}
                </ol>
              </section>
            </div>
          )}
        </aside>
      </div>
      )}
    </div>
  )
}

const TRACK = [
  { id: 'placed', label: 'Placed' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'packed', label: 'Packed' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'out_for_delivery', label: 'Out' },
  { id: 'delivered', label: 'Delivered' }
]

function OrderTrack({ status }) {
  const cancelled = status === 'cancelled'
  const current = TRACK.findIndex((item) => item.id === status)
  return (
    <div>
      <div className="grid grid-cols-6 gap-1">
        {TRACK.map((item, index) => {
          const reached = !cancelled && current >= index
          return (
            <div key={item.id}>
              <div className={`h-1 rounded-full ${reached ? 'bg-slate-900' : 'bg-slate-200'}`} />
              <p className={`mt-1 truncate text-[10px] font-bold ${reached ? 'text-slate-900' : 'text-slate-400'}`}>{item.label}</p>
            </div>
          )
        })}
      </div>
      {cancelled && <p className="mt-2 text-xs font-bold text-rose-600">This order is cancelled.</p>}
    </div>
  )
}

function Summary({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-900">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p>}
    </div>
  )
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold cursor-pointer ${active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
    >
      {children}
    </button>
  )
}

function Info({ title, lines }) {
  const rows = lines.filter(Boolean)
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{title}</p>
      {rows.map((line) => (
        <p key={line} className="mt-0.5 text-sm text-slate-800">{line}</p>
      ))}
      {rows.length === 0 && <p className="mt-0.5 text-sm text-slate-400">—</p>}
    </div>
  )
}

function Row({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className={strong ? 'font-black text-slate-900' : 'font-semibold text-slate-800'}>{value}</span>
    </div>
  )
}
