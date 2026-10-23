import React, { useEffect, useState } from 'react'
import { useRouter } from '../router/RouterContext'
import OrderSlip from '../components/marketplace/OrderSlip'
import { confirmStoreOrder, createStoreDelivery, listMyOrders, updateStoreOrderAddress } from '../services/storeDeliveryService'
import { confirmStoreRewards } from '../services/storeRewardService'

const SLIP_KEY = 'cryptospill_order_slip'
const ADDRESS_KEY = 'cryptospill_delivery_address'

export function saveOrderSlip(orderId, slip) {
  try {
    sessionStorage.setItem(SLIP_KEY, JSON.stringify({ orderId, ...slip }))
  } catch {
    // The order page can still load the saved order if this write fails.
  }
}

function readOrderSlip(orderId) {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(SLIP_KEY) || 'null')
    if (!parsed || String(parsed.orderId) !== String(orderId)) return null
    return parsed
  } catch {
    return null
  }
}

function clearOrderSlip() {
  try {
    sessionStorage.removeItem(SLIP_KEY)
  } catch {
    // Ignore storage failures.
  }
}

function writeSavedAddress(details) {
  try {
    localStorage.setItem(ADDRESS_KEY, JSON.stringify({
      firstName: details.firstName || '',
      lastName: details.lastName || '',
      email: details.email || '',
      countryCode: details.countryCode || '+1',
      phone: details.phone || '',
      address: details.address || '',
      pin: details.pin || '',
      country: details.country || 'India',
      state: details.state || ''
    }))
  } catch {
    // The order record still keeps the address.
  }
}

function paymentFromOrder(order, snapshot) {
  if (snapshot?.payment) return snapshot.payment
  if (!order) return null
  const points = Number(order.rewardPoints) || 0
  return {
    code: order.paymentCurrency || '',
    name: order.paymentCurrency || '',
    digits: 2,
    amount: Number(order.paymentAmount) || 0,
    ao1: Number(order.ao1Amount) || 0,
    reward: points > 0 ? {
      points,
      creditInr: Number(order.rewardCreditInr) || 0,
      creditUsd: Number(order.rewardCreditUsd) || 0,
      cartUsd: Number(order.cartUsd) || 0,
      payableUsd: Number(order.payableUsd) || 0
    } : null
  }
}

export default function OrderSlipPage({ orderId, onRewardPointsUpdated, onCartCleared }) {
  const { navigate } = useRouter()
  const [order, setOrder] = useState(null)
  const [snapshot, setSnapshot] = useState(() => readOrderSlip(orderId))
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)
  const [securing, setSecuring] = useState(false)
  const [paid, setPaid] = useState(false)
  const [error, setError] = useState('')

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

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const stored = readOrderSlip(orderId)
    if (orderId === 'slip') {
      setSnapshot(stored)
      setOrder(stored?.draft || null)
      setMissing(!stored?.draft)
      setPaid(false)
      setLoading(false)
      return undefined
    }
    listMyOrders()
      .then((rows) => {
        if (cancelled) return
        const found = (rows || []).find((row) => String(row._id || row.id) === String(orderId))
        setOrder(found || null)
        setMissing(!found)
        setPaid(found?.paymentStatus === 'escrow_secured' || ['confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'].includes(found?.status))
        setSnapshot(readOrderSlip(orderId))
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not open this order.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [orderId])

  const leave = () => {
    clearOrderSlip()
    navigate('/')
  }

  const pay = async (details) => {
    if (securing || paid) return
    setSecuring(true)
    setError('')
    const payment = paymentFromOrder(order, snapshot)
    const checkoutRef = crypto.randomUUID?.() || `escrow-${Date.now()}`
    try {
      let id = order?._id || order?.id
      if (!id) {
        const created = await createStoreDelivery({
          ...details,
          cartUsd: Number(snapshot?.draft?.cartUsd) || 0,
          payableUsd: Number(snapshot?.draft?.payableUsd) || 0,
          rewardPoints: Number(snapshot?.draft?.rewardPoints) || 0,
          rewardCreditInr: Number(snapshot?.draft?.rewardCreditInr) || 0,
          rewardCreditUsd: Number(snapshot?.draft?.rewardCreditUsd) || 0,
          items: (snapshot?.items || []).map((item) => ({
            productId: item.productId || '',
            title: item.title,
            priceUSD: Number(item.priceUSD) || 0,
            quantity: Number(item.quantity) || 1
          }))
        })
        const record = created?.order || created
        id = record?._id || record?.id
        if (record) setOrder(record)
        if (id) {
          saveOrderSlip(id, snapshot)
          navigate(`/order/${id}`, { replace: true })
        }
      }
      const updated = id ? await updateStoreOrderAddress({ id, ...details }) : null
      if (updated) setOrder(updated)
      writeSavedAddress(details)
      await new Promise((resolve) => setTimeout(resolve, 900))
      const reward = snapshot?.rewardConfirm
      if (reward?.points > 0) {
        try {
          const confirmed = await confirmStoreRewards({ checkoutRef, ...reward })
          const pointsAvailable = Number(confirmed?.pointsAvailable)
          if (Number.isFinite(pointsAvailable) && onRewardPointsUpdated) onRewardPointsUpdated(pointsAvailable)
        } catch (err) {
          setError(err.message || 'Reward points were not applied.')
        }
      }
      const confirmedOrder = await confirmStoreOrder({
        id: order?._id || order?.id || id,
        checkoutRef,
        paymentCurrency: payment?.name || payment?.code || '',
        paymentAmount: Number(payment?.amount) || 0,
        ao1Amount: Number(payment?.ao1) || 0
      })
      if (confirmedOrder) setOrder(confirmedOrder)
      setPaid(true)
      if (onCartCleared) onCartCleared()
    } catch (err) {
      setError(err.message || 'Could not complete the payment.')
    } finally {
      setSecuring(false)
    }
  }

  if (loading) {
    return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#fafafa] text-sm font-semibold text-slate-500">Opening your order...</div>
  }

  if (missing || !order) {
    return (
      <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-[#fafafa] px-6 text-center">
        <h1 className="text-2xl font-black text-slate-900">This order is not available</h1>
        <p className="mt-2 max-w-md text-sm text-slate-500">{error || 'Sign in with the same account to open the order slip.'}</p>
        <button type="button" onClick={() => navigate('/')} className="mt-5 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white cursor-pointer">Back home</button>
      </div>
    )
  }

  return (
    <OrderSlip
      order={order}
      payment={paymentFromOrder(order, snapshot)}
      items={snapshot?.items?.length ? snapshot.items : order.items}
      securing={securing}
      paid={paid}
      error={error}
      onPay={pay}
      onDone={leave}
    />
  )
}
