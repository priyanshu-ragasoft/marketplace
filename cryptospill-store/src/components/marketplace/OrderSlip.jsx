import React, { useEffect, useState } from 'react'
import { COUNTRY_CODES, LOCATIONS } from './DeliveryDetailsForm'

function formatCoin(value, digits = 2) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  return amount.toLocaleString('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: amount >= 1 ? Math.min(2, digits) : 0
  })
}

function formatWhen(value) {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

function CoinMark({ code }) {
  const [failed, setFailed] = useState(false)
  if (!code || failed) {
    return (
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-[10px] font-black text-white">
        {(code || 'AO').slice(0, 3)}
      </span>
    )
  }
  return (
    <img
      src={`https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@0.18.1/128/color/${code.toLowerCase()}.png`}
      alt=""
      className="h-11 w-11 rounded-full bg-white object-cover"
      onError={() => setFailed(true)}
    />
  )
}

function addressFromOrder(order) {
  return {
    firstName: order?.firstName || '',
    lastName: order?.lastName || '',
    email: order?.email || '',
    countryCode: order?.countryCode || '+1',
    phone: order?.phone || '',
    address: order?.address || '',
    pin: order?.pin || '',
    country: LOCATIONS[order?.country] ? order.country : (order?.country || 'India'),
    state: order?.state || ''
  }
}

const fieldClass = 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900'

export default function OrderSlip({ order, payment, items = [], securing = false, paid = false, error = '', onPay, onDone }) {
  const code = payment?.code || order?.paymentCurrency || ''
  const name = payment?.name || code || 'Currency'
  const digits = Number.isFinite(Number(payment?.digits)) ? Number(payment.digits) : 2
  const amount = Number(payment?.amount ?? order?.paymentAmount)
  const ao1 = Number(payment?.ao1 ?? order?.ao1Amount)
  const dueUsd = Number(payment?.reward?.payableUsd ?? order?.payableUsd ?? order?.cartUsd) || 0
  const cartUsd = Number(payment?.reward?.cartUsd ?? order?.cartUsd) || dueUsd
  const rewardPoints = Number(payment?.reward?.points ?? order?.rewardPoints) || 0
  const rewardCreditInr = Number(payment?.reward?.creditInr ?? order?.rewardCreditInr) || 0
  const rewardCreditUsd = Number(payment?.reward?.creditUsd ?? order?.rewardCreditUsd) || Math.max(cartUsd - dueUsd, 0)
  const rewardUsed = rewardPoints > 0 && rewardCreditUsd > 0
  const baseUsd = cartUsd > 0 ? cartUsd : dueUsd
  const rate = baseUsd > 0 && Number.isFinite(amount) ? amount / baseUsd : 0
  const catalogRate = dueUsd > 0 && Number.isFinite(amount) ? amount / dueUsd : rate
  const perUnit = Number.isFinite(amount) && amount > 0 && Number.isFinite(ao1) ? ao1 / amount : NaN
  const [form, setForm] = useState(() => addressFromOrder(order))
  const [formError, setFormError] = useState('')
  const states = LOCATIONS[form.country] || []
  const stateOptions = form.state && !states.includes(form.state) ? [form.state, ...states] : states

  useEffect(() => {
    if (!order?.address && !order?.firstName) return
    setForm(addressFromOrder(order))
  }, [order?._id, order?.id])

  useEffect(() => {
    const root = document.documentElement
    const previousRoot = root.style.overflow
    const previousBody = document.body.style.overflow
    root.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previousRoot
      document.body.style.overflow = previousBody
    }
  }, [])

  const setField = (key, value) => {
    setForm((current) => {
      const next = { ...current, [key]: value }
      if (key === 'country') {
        const list = LOCATIONS[value] || []
        next.state = list.includes(current.state) ? current.state : (list[0] || '')
      }
      return next
    })
  }

  const submitPay = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setFormError('Enter the first and last name.')
      return
    }
    if (!form.email.includes('@')) {
      setFormError('Enter a valid email.')
      return
    }
    if (form.phone.trim().length < 7 || form.address.trim().length < 5 || form.pin.trim().length < 3 || !form.state) {
      setFormError('Complete the phone, address, PIN, and state.')
      return
    }
    setFormError('')
    onPay(form)
  }
  const lines = (items.length ? items : order?.items || []).map((item) => {
    const usd = (Number(item.priceUSD) || 0) * (Number(item.quantity) || 1)
    return {
      title: item.title,
      quantity: Number(item.quantity) || 1,
      image: item.image,
      coin: (rewardUsed ? catalogRate : rate) ? usd * (rewardUsed ? catalogRate : rate) : NaN
    }
  })

  return (
    <div className="fixed inset-0 z-[90] flex flex-col overflow-hidden bg-[#fafafa] text-slate-900">
      <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-600">Order slip</p>
            <h1 className="text-xl font-black tracking-tight sm:text-2xl">{order?.orderNumber || 'Order placed'}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
        
          <button type="button" onClick={onDone} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-bold cursor-pointer">Close</button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:py-10">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <CoinMark code={code} />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Payable in</p>
                  <p className="text-lg font-black">{name}</p>
                </div>
              </div>
              <p className="mt-6 text-5xl font-black tabular-nums tracking-tight sm:text-6xl">
                {formatCoin(amount, digits)}
                <span className="ml-3 text-xl font-bold text-slate-400">{code}</span>
              </p>
              <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2">
                  <img src="/small.png" alt="" className="h-8 w-8 rounded-full object-cover" />
                  <span className="text-sm font-bold">AO1</span>
                </div>
                <span className="text-lg font-black tabular-nums">{formatCoin(ao1, 2)}</span>
              </div>
              {Number.isFinite(perUnit) && (
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  1 {code} = {formatCoin(perUnit, perUnit >= 1 ? 2 : 8)} AO1
                </p>
              )}
              <p className="mt-4 text-xs text-slate-400">{formatWhen(order?.createdAt)}</p>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Items</p>
              <ul className="mt-3 divide-y divide-slate-100">
                {lines.map((item, index) => (
                  <li key={`${item.title}-${index}`} className="flex items-center gap-4 py-3">
                    {item.image && (
                      <img src={item.image} alt="" className="h-14 w-14 rounded-xl border border-slate-200 bg-slate-50 object-contain p-1" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{item.title}</p>
                      <p className="text-xs text-slate-500">Qty {item.quantity}</p>
                    </div>
                    <p className="text-sm font-black tabular-nums">
                      {formatCoin(item.coin, digits)} <span className="text-xs text-slate-400">{code}</span>
                    </p>
                  </li>
                ))}
                {lines.length === 0 && <li className="py-3 text-sm text-slate-500">No items on this order.</li>}
              </ul>
              <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                {rewardUsed && (
                  <>
                    <Row label="Cart" value={`${formatCoin(cartUsd * catalogRate, digits)} ${code}`} />
                    <Row label="Reward points" value={`${Math.round(rewardPoints).toLocaleString()} PTS`} />
                    <Row label="Reward credit" value={`- ${formatCoin(rewardCreditUsd * catalogRate, digits)} ${code}`} />
                    {rewardCreditInr > 0 && (
                      <p className="text-[11px] font-semibold text-slate-500">
                        {Math.round(rewardPoints).toLocaleString()} points · {rewardCreditInr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR credit
                      </p>
                    )}
                  </>
                )}
                <Row label={`Due in ${name}`} value={`${formatCoin(amount, digits)} ${code}`} strong />
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Delivery details</p>
              <p className="mt-1 text-xs text-slate-500">Change these before you pay. The order is updated with this address.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block text-[11px] font-bold text-slate-500">
                  First name
                  <input value={form.firstName} onChange={(event) => setField('firstName', event.target.value)} className={fieldClass} disabled={paid} />
                </label>
                <label className="block text-[11px] font-bold text-slate-500">
                  Last name
                  <input value={form.lastName} onChange={(event) => setField('lastName', event.target.value)} className={fieldClass} disabled={paid} />
                </label>
              </div>
              <label className="mt-3 block text-[11px] font-bold text-slate-500">
                Email
                <input type="email" value={form.email} onChange={(event) => setField('email', event.target.value)} className={fieldClass} disabled={paid} />
              </label>
              <div className="mt-3 grid grid-cols-[7rem_minmax(0,1fr)] gap-3">
                <label className="block text-[11px] font-bold text-slate-500">
                  Code
                  <select value={form.countryCode} onChange={(event) => setField('countryCode', event.target.value)} className={fieldClass} disabled={paid}>
                    {COUNTRY_CODES.map((item) => (
                      <option key={item.code} value={item.code}>{item.code}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-[11px] font-bold text-slate-500">
                  Phone
                  <input value={form.phone} onChange={(event) => setField('phone', event.target.value)} className={fieldClass} disabled={paid} />
                </label>
              </div>
              <label className="mt-3 block text-[11px] font-bold text-slate-500">
                Address
                <textarea value={form.address} onChange={(event) => setField('address', event.target.value)} rows={2} className={fieldClass} disabled={paid} />
              </label>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <label className="block text-[11px] font-bold text-slate-500">
                  PIN
                  <input value={form.pin} onChange={(event) => setField('pin', event.target.value)} className={fieldClass} disabled={paid} />
                </label>
                <label className="block text-[11px] font-bold text-slate-500">
                  Country
                  <select value={form.country} onChange={(event) => setField('country', event.target.value)} className={fieldClass} disabled={paid}>
                    {Object.keys(LOCATIONS).map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-[11px] font-bold text-slate-500">
                  State
                  <select value={form.state} onChange={(event) => setField('state', event.target.value)} className={fieldClass} disabled={paid}>
                    <option value="">Select</option>
                    {stateOptions.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </label>
              </div>
            </section>
            {(formError || error) && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">{formError || error}</p>}
            <button
              type="button"
              onClick={submitPay}
              disabled={securing || paid}
              className="w-full rounded-2xl bg-slate-950 py-3.5 text-sm font-bold text-white cursor-pointer hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {securing ? 'Paying...' : `${paid ? 'Paid' : 'Pay'} ${formatCoin(amount, digits)} ${name || code}`}
            </button>
           
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className={strong ? 'font-black tabular-nums text-slate-950' : 'font-semibold tabular-nums text-slate-800'}>{value}</span>
    </div>
  )
}
