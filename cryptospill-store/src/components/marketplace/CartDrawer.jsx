import React, { useEffect, useRef, useState } from 'react'
import { fetchInrPerUsd, quoteStoreRewards } from '../../services/storeRewardService'
import { createStoreDelivery } from '../../services/storeDeliveryService'
import Ao1CurrencyConverter from './Ao1CurrencyConverter'
import { saveOrderSlip } from '../../pages/OrderSlipPage'
import cartBag from '../../assets/cart-ao1.png'
import emptyCart from '../../assets/empty-cart.png'
import { useRouter } from '../../router/RouterContext'

import { fetchEthUsdPrice, getCachedEthUsdPrice } from '../../services/cryptoPriceService'

function roundUsd(value) {
  return Math.round(Number(value) * 100) / 100
}

function formatUsd(value) {
  return `$${Number(value).toFixed(2)}`
}

function formatEth(value) {
  return Number(value).toFixed(4)
}

function formatInr(value) {
  return `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

function formatPoints(value) {
  return Number(value).toLocaleString('en-US')
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onRewardPointsUpdated
}) {
  const { navigate } = useRouter()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutSuccess, setCheckoutSuccess] = useState(false)
  const [useRewardPoints, setUseRewardPoints] = useState(false)
  const [redeemMode, setRedeemMode] = useState('full')
  const [pointsInput, setPointsInput] = useState('')
  const [quote, setQuote] = useState(null)
  const [quoteError, setQuoteError] = useState('')
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [inrPerUsd, setInrPerUsd] = useState(null)
  const [ethRate, setEthRate] = useState(() => getCachedEthUsdPrice())
  const [rateError, setRateError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [converterOpen, setConverterOpen] = useState(false)

  const rewardsOnRef = useRef(false)
  const drawerOpenRef = useRef(isOpen)
  const quoteRequestRef = useRef(0)
  const confirmedCheckoutRef = useRef('')

  rewardsOnRef.current = useRewardPoints
  drawerOpenRef.current = isOpen

  const activeEthRate = Number(ethRate) > 0 ? Number(ethRate) : 3480
  const subtotalUSD = cartItems.reduce((acc, item) => acc + item.priceUSD * item.quantity, 0)
  const subtotalETH = (subtotalUSD / activeEthRate).toFixed(4)
  const cartUsd = roundUsd(subtotalUSD)
  const cartEth = Number(subtotalETH)

  const rewardsReady = Boolean(
    useRewardPoints &&
    !quoteLoading &&
    quote &&
    !quoteError &&
    quote.rewardsApplied !== false &&
    Number.isFinite(Number(quote.payableUsd)) &&
    Number.isFinite(Number(quote.payableEth))
  )

  const pointsPerInr = Number(quote?.pointsPerInr) > 0 ? Number(quote.pointsPerInr) : 10
  const discountUsd = rewardsReady ? roundUsd(cartUsd - Number(quote.payableUsd)) : 0
  const payUsd = rewardsReady ? Number(quote.payableUsd) : subtotalUSD
  const payEth = rewardsReady ? formatEth(quote.payableEth) : subtotalETH

  useEffect(() => {
    if (!isOpen) {
      setUseRewardPoints(false)
      setRedeemMode('full')
      setPointsInput('')
      setQuote(null)
      setQuoteError('')
      setConfirmError('')
      setIsCheckingOut(false)
      setCheckoutSuccess(false)
      setConverterOpen(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (cartItems.length === 0) {
      setUseRewardPoints(false)
    }
  }, [cartItems.length])

  useEffect(() => {
    if (!isOpen || cartItems.length === 0) return undefined

    let cancelled = false
    setRateError('')

    fetchInrPerUsd()
      .then((rate) => {
        if (!cancelled) setInrPerUsd(rate)
      })
      .catch((err) => {
        if (!cancelled) {
          setInrPerUsd(null)
          setRateError(err.message || 'Could not load today’s USD to INR rate.')
        }
      })

    fetchEthUsdPrice()
      .then((price) => {
        if (!cancelled && price > 0) setEthRate(price)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [isOpen, cartItems.length])

  useEffect(() => {
    if (!isOpen || cartItems.length === 0 || !inrPerUsd) {
      setQuoteLoading(false)
      if (!useRewardPoints) {
        setQuote(null)
        setQuoteError('')
      }
      return undefined
    }

    const typedPoints = pointsInput.trim() === '' ? null : Math.floor(Number(pointsInput))
    const manualPoints = Number.isInteger(typedPoints) && typedPoints > 0
    const redeeming = useRewardPoints && (redeemMode === 'full' || manualPoints)
    const requestId = quoteRequestRef.current + 1
    quoteRequestRef.current = requestId
    let cancelled = false
    const timer = setTimeout(() => {
      setQuoteLoading(true)
      if (useRewardPoints) setQuoteError('')

      quoteStoreRewards({
        cartUsd,
        cartEth,
        inrPerUsd,
        rewardsApplied: redeeming,
        ...(useRewardPoints && redeemMode === 'manual' && manualPoints ? { points: typedPoints } : {})
      })
      .then((data) => {
        if (cancelled || requestId !== quoteRequestRef.current) return
        setQuote(data)
        setQuoteError('')
      })
      .catch((err) => {
        if (cancelled || requestId !== quoteRequestRef.current) return
        setQuote(null)
        if (useRewardPoints) {
          setQuoteError(err.message || 'Could not apply reward points.')
        }
      })
      .finally(() => {
        if (!cancelled && requestId === quoteRequestRef.current) {
          setQuoteLoading(false)
        }
      })

    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [isOpen, cartItems.length, useRewardPoints, redeemMode, pointsInput, cartUsd, cartEth, inrPerUsd])

  if (!isOpen) return null

  const handleClose = () => {
    drawerOpenRef.current = false
    rewardsOnRef.current = false
    onClose()
  }

  const handleCheckout = () => {
    setConverterOpen(true)
  }

  const openOrderSlip = async (payment) => {
    const rewardsOn = rewardsReady && Number(quote?.pointsApplied) > 0
    let saved = null
    try {
      saved = JSON.parse(localStorage.getItem('cryptospill_delivery_address') || 'null')
    } catch {
      saved = null
    }
    const draft = {
      firstName: saved?.firstName || '',
      lastName: saved?.lastName || '',
      email: saved?.email || '',
      countryCode: saved?.countryCode || '+1',
      phone: saved?.phone || '',
      address: saved?.address || '',
      pin: saved?.pin || '',
      country: saved?.country || 'United States',
      state: saved?.state || '',
      cartUsd,
      payableUsd: payUsd,
      rewardPoints: rewardsOn ? Number(quote.pointsApplied) : 0,
      rewardCreditInr: rewardsOn ? Number(quote.creditInr) || 0 : 0,
      rewardCreditUsd: rewardsOn ? Math.max(cartUsd - Number(quote.payableUsd), 0) : 0
    }
    const items = cartItems.map((item) => ({
      productId: String(item.id || item._id || ''),
      title: item.title,
      image: item.image,
      priceUSD: Number(item.priceUSD) || 0,
      quantity: Number(item.quantity) || 1
    }))
    const slip = {
      payment: {
        ...payment,
        reward: rewardsOn ? {
          points: Number(quote.pointsApplied),
          creditInr: Number(quote.creditInr) || 0,
          creditUsd: draft.rewardCreditUsd,
          cartUsd,
          payableUsd: payUsd
        } : null
      },
      items,
      draft,
      rewardConfirm: rewardsOn ? {
        cartUsd,
        cartEth,
        inrPerUsd,
        points: Number(quote.pointsApplied)
      } : null
    }
    let orderId = 'slip'
    const addressReady = draft.firstName && draft.lastName && draft.email.includes('@') && draft.phone && draft.address && draft.pin && draft.state
    if (addressReady) {
      try {
        const created = await createStoreDelivery({ ...draft, items })
        const record = created?.order || created
        orderId = record?._id || record?.id || 'slip'
        if (orderId !== 'slip') slip.draft = { ...draft, ...record }
      } catch {
        orderId = 'slip'
      }
    }
    saveOrderSlip(orderId, slip)
    setConverterOpen(false)
    onClose()
    navigate(`/order/${orderId}`)
  }

  const rewardsPending = useRewardPoints && !quoteError && !rateError && (quoteLoading || !inrPerUsd || !quote)
  const visibleQuoteError = useRewardPoints ? (quoteError || rateError) : ''
  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 text-slate-900 flex flex-col justify-between shadow-2xl h-full">

          {/* Drawer Header with Yellow Dot */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-3">
              <img src={cartBag} alt="" className="h-11 w-11 object-contain" />
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-950">Your cart</h2>
                <p className="text-xs font-medium text-slate-500">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Checkout Success Screen */}
          {checkoutSuccess ? (
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mb-4 shadow-sm">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-slate-950">Order placed</h3>
              <p className="mt-1 max-w-xs text-sm text-slate-500">
                Your payment is in. Finish delivery details on the order slip.
              </p>
              {confirmError && (
                <p className="text-xs text-rose-600 mt-3 max-w-xs">{confirmError}</p>
              )}
            </div>
          ) : (
            <>
              {/* Cart Items List */}
              {cartItems.length > 0 ? (
                <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"
                    >
                      <img
                        src={item.image}
                        alt=""
                        className="h-16 w-16 shrink-0 rounded-xl border border-slate-100 bg-slate-50 object-contain p-1.5"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-bold text-slate-950">{item.title}</h4>
                        <p className="mt-0.5 text-xs text-slate-500">{formatUsd(item.priceUSD)} each</p>
                        <div className="mt-2 inline-flex items-center rounded-full border border-slate-200 bg-slate-50">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="flex h-7 w-7 cursor-pointer items-center justify-center text-sm font-bold text-slate-700"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="min-w-5 text-center text-xs font-bold text-slate-950">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="flex h-7 w-7 cursor-pointer items-center justify-center text-sm font-bold text-slate-700"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <p className="text-sm font-black text-slate-950">{formatUsd(item.priceUSD * item.quantity)}</p>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="cursor-pointer text-[11px] font-bold text-slate-400 hover:text-rose-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                  <img src={emptyCart} alt="" className="h-30 w-30 object-contain" />
                  <h3 className="mt-3 text-lg font-black text-slate-950">Your cart is empty</h3>
                  <p className="mt-1 max-w-[16rem] text-sm text-slate-500">Browse the store and add something you want delivered.</p>
                </div>
              )}

              {/* Drawer Footer with Totals and Checkout */}
              {cartItems.length > 0 && (
                <div className="space-y-3 border-t border-slate-200 bg-white px-5 py-4">
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-900">{formatUsd(subtotalUSD)}</span>
                  </div>
                  <div className="flex items-end justify-between border-t border-slate-100 pt-3">
                    <span className="text-sm font-bold text-slate-950">To pay</span>
                    <p className="text-2xl font-black tracking-tight text-slate-950">{formatUsd(payUsd)}</p>
                  </div>

                  <div className="space-y-2 rounded-2xl border border-[#D1A61B]/30 bg-[#D1A61B]/5 px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">Apply rewards</p>
                        <p className="text-[11px] text-slate-500">Points lower the amount you pay.</p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={useRewardPoints}
                        aria-label="Use reward points"
                        onClick={() => setUseRewardPoints((on) => !on)}
                        className={`relative w-11 h-6 rounded-full transition cursor-pointer shrink-0 ${useRewardPoints ? 'bg-slate-900' : 'bg-slate-300'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition ${useRewardPoints ? 'translate-x-5' : ''}`} />
                      </button>
                    </div>

                    {useRewardPoints && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setRedeemMode('full')}
                          className={`rounded-lg px-2 py-1.5 text-[11px] font-bold cursor-pointer ${redeemMode === 'full' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}
                        >
                          Use all
                        </button>
                        <button
                          type="button"
                          onClick={() => setRedeemMode('manual')}
                          className={`rounded-lg px-2 py-1.5 text-[11px] font-bold cursor-pointer ${redeemMode === 'manual' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}
                        >
                          Choose amount
                        </button>
                      </div>
                    )}

                    {useRewardPoints && redeemMode === 'full' && quote?.pointsAvailable != null && (
                      <p className="text-[11px] text-slate-500">{formatPoints(quote.pointsAvailable)} points available</p>
                    )}

                    {useRewardPoints && redeemMode === 'manual' && (
                      <label className="block pt-1">
                        <span className="text-[11px] font-semibold text-slate-600">How many points?</span>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          inputMode="numeric"
                          value={pointsInput}
                          placeholder="For example, 100"
                          onChange={(event) => setPointsInput(event.target.value.replace(/[^\d]/g, ''))}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                        />
                        {quote?.pointsAvailable != null && (
                          <span className="mt-1 block text-[11px] text-slate-500">
                            You can use up to {formatPoints(quote.pointsAvailable)} points
                          </span>
                        )}
                      </label>
                    )}

                    {useRewardPoints && quoteLoading && !visibleQuoteError && (
                      <p className="text-[11px] text-slate-500">Checking your points...</p>
                    )}

                    {visibleQuoteError && (
                      <p className="text-[11px] text-rose-600 leading-snug">{visibleQuoteError}</p>
                    )}

                    {useRewardPoints && rewardsReady && (
                      <div className="space-y-1.5 pt-1 border-t border-slate-100 text-[11px]">
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Points used</span>
                          <span className="font-bold text-slate-900">{formatPoints(quote.pointsApplied)}</span>
                        </div>


                        <div className="flex items-center justify-between text-slate-900 font-bold pt-1">
                          <span>You pay</span>
                          <span className="text-right">
                            <span className="block">{formatUsd(quote.payableUsd)}</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={isCheckingOut || rewardsPending}
                    className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-yellow-400 hover:text-black active:bg-yellow-500 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                  >
                    {isCheckingOut ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Opening checkout...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue to checkout</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onClearCart}
                    className="w-full cursor-pointer pt-1 text-center text-[11px] font-bold text-slate-400 hover:text-rose-600"
                  >
                    Remove all items
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {converterOpen && (
        <Ao1CurrencyConverter
          payableUsd={payUsd}
          onClose={() => setConverterOpen(false)}
          onConfirm={(payment) => openOrderSlip(payment)}
        />
      )}
    </div>
  )
}
