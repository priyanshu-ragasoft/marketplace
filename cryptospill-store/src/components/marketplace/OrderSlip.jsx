import React, { useEffect, useState } from 'react'
import { COUNTRY_CODES, COUNTRY_OPTIONS, FieldSelect, LOCATIONS, countryForDialCode, dialCodeForCountry, matchCountry, phoneDigits, phoneRule, phoneValidationMessage } from './DeliveryDetailsForm'
import logoImg from '../../assets/logo.png'

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
  const savedCountry = String(order?.country || '').trim()
  const hasPlace = Boolean(String(order?.address || '').trim() || String(order?.state || '').trim() || String(order?.pin || '').trim())
  const country = !savedCountry || (savedCountry === 'India' && !hasPlace)
    ? 'United States'
    : matchCountry(savedCountry)
  const states = LOCATIONS[country] || []
  const savedCode = order?.country && COUNTRY_CODES.some((item) => item.code === order?.countryCode) ? order.countryCode : ''
  return {
    firstName: order?.firstName || '',
    lastName: order?.lastName || '',
    email: order?.email || '',
    countryCode: savedCode || dialCodeForCountry(country),
    phone: order?.phone || '',
    address: order?.address || '',
    pin: order?.pin || '',
    country,
    state: states.includes(order?.state) ? order.state : ''
  }
}

const fieldClass = 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900'

export default function OrderSlip({ order, payment, items = [], securing = false, paid = false, error = '', status = '', receipt = null, onPay, onDone }) {
  const code = payment?.code || order?.paymentCurrency || ''
  const name = payment?.name || code || 'Currency'
  const digits = Number.isFinite(Number(payment?.digits)) ? Number(payment.digits) : 2
  const orderUsd = Number(order?.payableUsd)
  const amount = /usdt/i.test(`${code} ${name}`) && orderUsd > 0
    ? orderUsd
    : Number(payment?.amount ?? order?.paymentAmount)
  const ao1 = Number(payment?.ao1 ?? order?.ao1Amount)
  const dueUsd = Number(payment?.reward?.payableUsd ?? order?.payableUsd ?? order?.cartUsd) || 0
  const cartUsd = Number(payment?.reward?.cartUsd ?? order?.cartUsd) || dueUsd
  const rewardPoints = Number(payment?.reward?.points ?? order?.rewardPoints) || 0
  const rewardCreditUsd = Number(payment?.reward?.creditUsd ?? order?.rewardCreditUsd) || Math.max(cartUsd - dueUsd, 0)
  const rewardUsed = rewardPoints > 0 && rewardCreditUsd > 0
  const baseUsd = cartUsd > 0 ? cartUsd : dueUsd
  const rate = baseUsd > 0 && Number.isFinite(amount) ? amount / baseUsd : 0
  const catalogRate = dueUsd > 0 && Number.isFinite(amount) ? amount / dueUsd : rate
  const perUnit = Number.isFinite(amount) && amount > 0 && Number.isFinite(ao1) ? ao1 / amount : NaN
  const [form, setForm] = useState(() => addressFromOrder(order))
  const [formError, setFormError] = useState('')
  const states = LOCATIONS[form.country] || []

  useEffect(() => {
    if (!order?.address && !order?.firstName) return
    setForm(addressFromOrder(order))
  }, [order?._id, order?.id])

  const setField = (key, value) => {
    setForm((current) => {
      const next = { ...current, [key]: value }
      if (key === 'country') {
        const list = LOCATIONS[value] || []
        next.state = list.includes(current.state) ? current.state : ''
        next.countryCode = dialCodeForCountry(value)
      }
      if (key === 'countryCode') {
        const nextCountry = countryForDialCode(value)
        if (nextCountry) {
          const list = LOCATIONS[nextCountry] || []
          next.country = nextCountry
          next.state = list.includes(current.state) ? current.state : ''
        }
      }
      return next
    })
  }

  const submitPay = () => {
    if (receipt?.stage === 'ao1_credited') {
      setFormError('')
      onPay({ ...form, confirmReturn: true })
      return
    }
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setFormError('Enter the first and last name.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setFormError('Enter a valid email.')
      return
    }
    const phoneMessage = phoneValidationMessage(form.countryCode, form.phone)
    if (phoneMessage) {
      setFormError(phoneMessage)
      return
    }
    if (form.address.trim().length < 5 || form.pin.trim().length < 3 || !form.state) {
      setFormError('Complete the address, PIN, and state.')
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
    <div className="relative min-h-screen bg-[#fafafa] text-slate-900">
      {securing && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 px-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white px-6 py-8 text-center shadow-xl">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
            <p className="mt-4 text-base font-black text-slate-900">Payment in progress</p>
            <p className="mt-2 text-sm font-semibold text-slate-600">{status || 'Approve the wallet prompt. This page keeps checking until you are back from MetaMask.'}</p>
          </div>
        </div>
      )}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
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
            {receipt && (
              <div className="mt-6 space-y-2 rounded-2xl bg-slate-50 px-4 py-4 text-sm">
                <p className="text-[11px] font-bold uppercase tracking-wide text-amber-600">
                  {receipt.stage === 'confirmed' ? 'Order confirmed with AO1' : 'AO1 is in your wallet'}
                </p>
                <Row label="USDT paid" value={`${receipt.usdt || amount} USDT`} strong />
                <Row label="From wallet" value={shortAddr(receipt.wallet)} />
                <Row label="USDT to company" value={shortAddr(receipt.treasury)} />
                {receipt.usdTx && <Tx label="USDT tx" hash={receipt.usdTx} href={`https://bscscan.com/tx/${receipt.usdTx}`} />}
                <Row label="AO1 received" value={`${receipt.creditedAo1 || ao1} AO1`} strong />
                <Row label="AO1 to send back" value={`${receipt.returnAo1 || ao1} AO1`} strong />
                <Row label="AO1 back to company" value={shortAddr(receipt.ao1Treasury || receipt.treasury)} />
                {receipt.ao1Tx && <Tx label="AO1 credit tx" hash={receipt.ao1Tx} />}
                {receipt.returnTx && <Tx label="AO1 return tx" hash={receipt.returnTx} />}
                <p className="pt-1 text-xs font-semibold text-slate-500">
                  {receipt.stage === 'confirmed'
                    ? 'The same wallet sent AO1 to the company wallet. This order is confirmed.'
                    : 'Order confirms only after this same wallet sends the AO1 back to the company wallet.'}
                </p>
              </div>
            )}
          </section>

          <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6">
            {/* CryptoSpill Authenticity Watermark */}
            <div
              aria-hidden="true"
              className="pointer-events-none select-none absolute inset-0 flex items-center justify-center overflow-hidden z-0"
            >
              <div className="flex flex-col items-center justify-center opacity-[0.045] transform scale-110">
                <img
                  src={logoImg}
                  alt=""
                  className="w-56 h-56 object-contain filter grayscale"
                />

              </div>
            </div>

            <div className="relative z-10">
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
                  </>
                )}
                <Row label={`Amount Payable (${name})`} value={`${formatCoin(amount, digits)} ${code}`} strong />

              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Delivery details</p>
            <p className="mt-1 text-xs text-slate-500">Check the name, phone, and address. Your order is delivered here.</p>
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
              <div className="block text-[11px] font-bold text-slate-500">
                Code
                <FieldSelect
                  ariaLabel="Country code"
                  value={form.countryCode}
                  disabled={paid}
                  menuMinWidth={148}
                  className="mt-1"
                  options={COUNTRY_CODES.map((item) => ({ value: item.code, label: item.code, iso: item.iso }))}
                  onChange={(code) => setField('countryCode', code)}
                />
              </div>
              <label className="block text-[11px] font-bold text-slate-500">
                Phone
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={form.phone}
                  maxLength={phoneRule(form.countryCode).max}
                  placeholder={phoneRule(form.countryCode).example}
                  onChange={(event) => setField('phone', phoneDigits(event.target.value).slice(0, phoneRule(form.countryCode).max))}
                  className={fieldClass}
                  disabled={paid}
                />
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
              <div className="block text-[11px] font-bold text-slate-500">
                Country
                <FieldSelect
                  ariaLabel="Country"
                  value={form.country}
                  disabled={paid}
                  className="mt-1"
                  options={COUNTRY_OPTIONS.map((country) => ({ value: country, label: country }))}
                  onChange={(country) => setField('country', country)}
                />
              </div>
              <div className="block text-[11px] font-bold text-slate-500">
                State
                <FieldSelect
                  ariaLabel="State"
                  value={states.includes(form.state) ? form.state : ''}
                  placeholder="Select state"
                  disabled={paid}
                  className="mt-1"
                  options={states.map((state) => ({ value: state, label: state }))}
                  onChange={(state) => setField('state', state)}
                />
              </div>
            </div>
          </section>
          {status && !error && !formError && <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">{status}</p>}
          {(formError || error) && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">{formError || error}</p>}
          <button
            type="button"
            onClick={submitPay}
            disabled={securing || paid}
            className="w-full rounded-2xl bg-slate-950 py-3.5 text-sm font-bold text-white cursor-pointer hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {securing ? 'Waiting for AO1 confirm...' : paid ? 'Order confirmed' : receipt?.stage === 'ao1_credited' ? `Confirm ${receipt.returnAo1 || formatCoin(ao1, 2)} AO1 return` : `Pay ${formatCoin(amount, digits)} ${name || code}`}
          </button>

        </div>
      </div>
    </div>
  )
}

function shortAddr(value) {
  const text = String(value || '')
  if (text.length < 12) return text || '—'
  return `${text.slice(0, 6)}...${text.slice(-4)}`
}

function Tx({ label, hash, href }) {
  const short = shortAddr(hash)
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      {href ? <a href={href} target="_blank" rel="noreferrer" className="font-semibold text-slate-900 underline">{short}</a> : <span className="font-semibold">{short}</span>}
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
