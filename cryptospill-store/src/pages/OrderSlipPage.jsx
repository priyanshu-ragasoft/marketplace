import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from '../router/RouterContext'
import OrderSlip from '../components/marketplace/OrderSlip'
import { confirmStoreOrder, createStoreDelivery, listMyOrders, updateStoreOrderAddress } from '../services/storeDeliveryService'
import { confirmStoreRewards } from '../services/storeRewardService'
import { createStorePayment, verifyStorePayment } from '../services/storePaymentService'
import { prepareStoreWallet, sendStoreAo1, sendStoreUsdt } from '../utils/storeWallet'
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
      country: details.country || 'United States',
      state: details.state || ''
    }))
  } catch {
    // The order record still keeps the address.
  }
}

function checkoutNotice(message) {
  const text = String(message || '').trim()
  if (/invalid id|not existed or invalid|cast to objectid/i.test(text)) {
    return 'Your payment is safe. Stay on this page while the order finishes confirming.'
  }
  return text
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
  const [payStatus, setPayStatus] = useState('')
  const [paid, setPaid] = useState(false)
  const [error, setError] = useState('')
  const payLock = useRef(false)
  const [receipt, setReceipt] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(`store-pay:${orderId}`) || 'null')?.receipt || null
    } catch {
      return null
    }
  })

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
        const alreadyConfirmed = found?.paymentStatus === 'escrow_secured' || ['confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'].includes(found?.status)
        setPaid(Boolean(alreadyConfirmed))
        setSnapshot(readOrderSlip(orderId))
        if (alreadyConfirmed) navigate(`/order/${encodeURIComponent(orderId)}/confirmed`, { replace: true })
      })
      .catch((err) => {
        if (!cancelled) setError(checkoutNotice(err.message) || 'Could not open this order.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [orderId])

  useEffect(() => {
    let saved = null
    try { saved = JSON.parse(sessionStorage.getItem(`store-pay:${orderId}`) || 'null') } catch { saved = null }
    if (!saved?.payment_id || saved.ao1_payment_tx_hash) return undefined
    let stop = false
    const watch = async () => {
      if (!saved.usd_tx_hash && !saved.ao1_tx_hash && saved.stage !== 'ao1_credited') {
        let looked = null
        try { looked = await verifyStorePayment({ payment_id: saved.payment_id }) } catch { looked = null }
        if (stop) return
        const status = String(looked?.status || '').toLowerCase()
        const hash = looked?.usd_tx_hash || ''
        if (status === 'confirmed') {
          openConfirmation(orderId)
          return
        }
        if (!hash && !looked?.ao1_tx_hash && status !== 'ao1_credited') return
        saved = {
          ...saved,
          usd_tx_hash: hash,
          ao1_tx_hash: looked?.ao1_tx_hash || '',
          stage: status === 'ao1_credited' ? 'ao1_credited' : saved.stage
        }
        sessionStorage.setItem(`store-pay:${orderId}`, JSON.stringify(saved))
      }
      const waitingForReturn = saved.stage === 'ao1_credited'
      if (!waitingForReturn) setSecuring(true)
      while (!stop) {
        let step = null
        try {
          step = await verifyStorePayment({
            payment_id: saved.payment_id,
            ...(saved.usd_tx_hash ? { usd_tx_hash: saved.usd_tx_hash } : {})
          })
        } catch {
          step = null
        }
        if (stop) return
        const status = String(step?.status || '').toLowerCase()
        if (status === 'ao1_pending' || (status === 'pending' && step?.ao1_tx_hash)) {
          const receipt = {
            stage: 'ao1_credited',
            usdt: saved.usdt,
            wallet: saved.wallet,
            treasury: saved.treasury,
            usdTx: step.usd_tx_hash || saved.usd_tx_hash,
            returnAo1: step.amount_ao1,
            ao1Treasury: step.ao1_treasury_address,
            ao1Tx: step.ao1_tx_hash
          }
          setReceipt(receipt)
          setSecuring(false)
          setError('')
          setPayStatus(`${step.amount_ao1 || 'AO1'} AO1 is on the way to your wallet. Tap Confirm AO1 return. Do not send USDT again.`)
          sessionStorage.setItem(`store-pay:${orderId}`, JSON.stringify({
            ...saved,
            stage: 'ao1_credited',
            usd_tx_hash: step.usd_tx_hash || saved.usd_tx_hash,
            amount_ao1: step.amount_ao1,
            ao1_tx_hash: step.ao1_tx_hash,
            ao1_treasury_address: step.ao1_treasury_address,
            ao1_chain_id: step.ao1_chain_id,
            ao1_rpc_url: step.ao1_rpc_url,
            receipt
          }))
          saved = { ...saved, stage: 'ao1_credited', usd_tx_hash: step.usd_tx_hash || saved.usd_tx_hash }
          await new Promise((resolve) => setTimeout(resolve, 4000))
          continue
        }
        if (status === 'ao1_credited') {
          const receipt = {
            stage: 'ao1_credited',
            usdt: saved.usdt,
            wallet: saved.wallet,
            treasury: saved.treasury,
            usdTx: step.usd_tx_hash || saved.usd_tx_hash,
            returnAo1: step.amount_ao1,
            ao1Treasury: step.ao1_treasury_address,
            ao1Tx: step.ao1_tx_hash
          }
          setReceipt(receipt)
          setSecuring(false)
          setPayStatus(`${step.amount_ao1 || 'AO1'} AO1 is in your wallet. Tap Confirm AO1 return.`)
          sessionStorage.setItem(`store-pay:${orderId}`, JSON.stringify({
            ...saved,
            stage: 'ao1_credited',
            usd_tx_hash: step.usd_tx_hash || saved.usd_tx_hash,
            amount_ao1: step.amount_ao1,
            ao1_tx_hash: step.ao1_tx_hash,
            ao1_treasury_address: step.ao1_treasury_address,
            ao1_chain_id: step.ao1_chain_id,
            ao1_rpc_url: step.ao1_rpc_url,
            receipt
          }))
          saved = { ...saved, stage: 'ao1_credited', usd_tx_hash: step.usd_tx_hash || saved.usd_tx_hash }
          await new Promise((resolve) => setTimeout(resolve, 4000))
          continue
        }
        if (status === 'confirmed') {
          setSecuring(false)
          openConfirmation(orderId)
          return
        }
        setPayStatus(waitingForReturn
          ? 'USDT is already paid. Tap Confirm and send the AO1 back in MetaMask.'
          : step?.seen_usdt != null
            ? `Wallet sent ${step.seen_usdt} USDT. This order needs ${step.needed_usdt} USDT.`
            : 'Waiting for the exact USDT transfer on BscScan.')
        await new Promise((resolve) => setTimeout(resolve, 5000))
      }
    }
    watch()
    return () => {
      stop = true
      setSecuring(false)
    }
  }, [orderId])

  const leave = () => {
    clearOrderSlip()
    navigate('/')
  }

  const openConfirmation = (id) => {
    const orderKey = id || orderId
    sessionStorage.removeItem(`store-pay:${orderKey}`)
    if (onCartCleared) onCartCleared()
    navigate(`/order/${encodeURIComponent(orderKey)}/confirmed`, { replace: true })
  }

  const pay = async (details) => {
    if (payLock.current || securing || paid) return
    payLock.current = true
    const walletPromise = prepareStoreWallet()
    setSecuring(true)
    setError('')
    setPayStatus('Approve the connection in the MetaMask app.')
    const payment = paymentFromOrder(order, snapshot)
    const checkoutRef = crypto.randomUUID?.() || `escrow-${Date.now()}`
    try {
      if (receipt?.stage === 'ao1_credited' || details?.confirmReturn) {
        const id = order?._id || order?.id || orderId
        let saved = null
        try { saved = JSON.parse(sessionStorage.getItem(`store-pay:${id}`) || 'null') } catch { saved = null }
        const wallet = await walletPromise
        let treasury = saved?.ao1_treasury_address || receipt.ao1Treasury
        let amountAo1 = saved?.amount_ao1 || receipt.returnAo1
        let chainId = saved?.ao1_chain_id
        let rpcUrl = saved?.ao1_rpc_url
        let paymentId = saved?.payment_id
        let usdTx = saved?.usd_tx_hash || receipt.usdTx || ''
        if (!treasury || !chainId || !rpcUrl || !paymentId) {
          const intent = await createStorePayment({
            order_id: id,
            wallet_address: wallet,
            chain: 'bsc',
            token: 'USDT'
          })
          treasury = intent.ao1_treasury_address
          amountAo1 = intent.amount_ao1
          chainId = intent.ao1_chain_id
          rpcUrl = intent.ao1_rpc_url
          paymentId = intent.payment_id
          usdTx = intent.usd_tx_hash || usdTx
        }
        setPayStatus(`Approve sending ${amountAo1} AO1 in the MetaMask popup.`)
        const sendPromise = sendStoreAo1({
          from: wallet,
          to: treasury,
          amountAo1,
          chainId,
          rpcUrl
        }).then((hash) => ({ hash })).catch((error) => ({ error }))
        const until = Date.now() + 90 * 1000
        let verified = null
        let sendResult = null
        while (Date.now() < until) {
          const raced = await Promise.race([
            sendPromise.then((result) => ({ result })),
            new Promise((resolve) => setTimeout(() => resolve({}), 3000))
          ])
          if (raced.result) sendResult = raced.result
          try {
            verified = await verifyStorePayment({
              payment_id: paymentId,
              ...(usdTx ? { usd_tx_hash: usdTx } : {}),
              ...(sendResult?.hash ? { ao1_payment_tx_hash: sendResult.hash } : {})
            })
          } catch {
            verified = null
          }
          if (String(verified?.status || '').toLowerCase() === 'confirmed') break
          verified = null
          if (sendResult?.error && !sendResult?.hash) break
        }
        if (String(verified?.status || '').toLowerCase() !== 'confirmed') {
          setSecuring(false)
          throw sendResult?.error || new Error('Payment failed')
        }
        const confirmedOrder = await confirmStoreOrder({
          id,
          checkoutRef,
          paymentCurrency: payment?.name || payment?.code || 'USDT BEP20',
          paymentAmount: Number(saved?.usdt) || 0,
          ao1Amount: Number(amountAo1) || 0
        })
        if (confirmedOrder) setOrder(confirmedOrder)
        openConfirmation(id)
        return
      }
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
            image: item.image || '',
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
      const reward = snapshot?.rewardConfirm
      if (reward?.points > 0) {
        try {
          const confirmed = await confirmStoreRewards({ checkoutRef, ...reward })
          const pointsAvailable = Number(confirmed?.pointsAvailable)
          if (Number.isFinite(pointsAvailable) && onRewardPointsUpdated) onRewardPointsUpdated(pointsAvailable)
        } catch (err) {
          setError(checkoutNotice(err.message) || 'Reward points were not applied.')
        }
      }

      const wallet = await walletPromise
      const intent = await createStorePayment({
        order_id: id,
        wallet_address: wallet,
        chain: 'bsc',
        token: 'USDT'
      })
      const progressKey = `store-pay:${id}`
      let progress = null
      try { progress = JSON.parse(sessionStorage.getItem(progressKey) || 'null') } catch { progress = null }
      const samePayment = progress?.payment_id === intent.payment_id
      if (samePayment && progress?.stage === 'ao1_credited' && progress.ao1_treasury_address && !progress.ao1_payment_tx_hash) {
        setPayStatus(`${progress.amount_ao1} AO1 is in your wallet. Approve sending it in MetaMask.`)
        const ao1Hash = await sendStoreAo1({
          from: wallet,
          to: progress.ao1_treasury_address,
          amountAo1: progress.amount_ao1,
          chainId: progress.ao1_chain_id,
          rpcUrl: progress.ao1_rpc_url
        })
        const verified = await verifyStorePayment({
          payment_id: intent.payment_id,
          usd_tx_hash: progress.usd_tx_hash,
          ao1_payment_tx_hash: ao1Hash
        })
        if (String(verified?.status || '').toLowerCase() !== 'confirmed') {
          throw new Error('AO1 purchase is still confirming. Tap the button again in a moment.')
        }
        const confirmedOrder = await confirmStoreOrder({
          id,
          checkoutRef,
          paymentCurrency: payment?.name || payment?.code || 'USDT BEP20',
          paymentAmount: Number(intent.usd_amount) || 0,
          ao1Amount: Number(progress.amount_ao1) || 0
        })
        if (confirmedOrder) setOrder(confirmedOrder)
        openConfirmation(id)
        return
      }
      if (intent.ao1_tx_hash && intent.usd_tx_hash) {
        setError('')
        setPayStatus('USDT is already paid. Checking the AO1 already in your wallet.')
        const step = await verifyStorePayment({
          payment_id: intent.payment_id,
          usd_tx_hash: intent.usd_tx_hash
        })
        if (step?.ao1_tx_hash || String(step?.status || '').toLowerCase() === 'ao1_credited') {
          const ready = {
            stage: 'ao1_credited',
            usdt: intent.usd_amount,
            wallet,
            treasury: intent.to_address || intent.ao1_treasury_address,
            usdTx: intent.usd_tx_hash,
            returnAo1: step.amount_ao1 || intent.amount_ao1,
            ao1Treasury: step.ao1_treasury_address || intent.ao1_treasury_address,
            ao1Tx: step.ao1_tx_hash || intent.ao1_tx_hash
          }
          setReceipt(ready)
          sessionStorage.setItem(progressKey, JSON.stringify({
            payment_id: intent.payment_id,
            stage: 'ao1_credited',
            usd_tx_hash: intent.usd_tx_hash,
            amount_ao1: step.amount_ao1 || intent.amount_ao1,
            ao1_tx_hash: step.ao1_tx_hash || intent.ao1_tx_hash,
            ao1_treasury_address: step.ao1_treasury_address || intent.ao1_treasury_address,
            ao1_chain_id: step.ao1_chain_id || intent.ao1_chain_id,
            ao1_rpc_url: step.ao1_rpc_url || intent.ao1_rpc_url,
            receipt: ready
          }))
          setPayStatus(`${step.amount_ao1 || intent.amount_ao1} AO1 is in your wallet. Tap Confirm AO1 return.`)
          setSecuring(false)
          return
        }
      }
      const alreadyPaid = Boolean(intent.usd_tx_hash || intent.ao1_tx_hash)
      setPayStatus(alreadyPaid
        ? 'USDT is already paid. Checking the AO1 in your wallet. Do not send USDT again.'
        : samePayment && progress?.stage === 'ao1_credited'
          ? `${progress.amount_ao1} AO1 is already in your wallet. Confirm the AO1 return in MetaMask.`
          : 'Approve the USDT transfer in MetaMask. It will bring you back to this page.')
      sessionStorage.setItem(progressKey, JSON.stringify({
        ...(progress || {}),
        payment_id: intent.payment_id,
        wallet,
        usdt: intent.usd_amount,
        treasury: intent.to_address,
        usd_tx_hash: intent.usd_tx_hash || progress?.usd_tx_hash || '',
        ao1_tx_hash: intent.ao1_tx_hash || progress?.ao1_tx_hash || ''
      }))
      let walletHash = intent.usd_tx_hash || (samePayment ? (progress?.usd_tx_hash || '') : '')
      if (!walletHash && !intent.ao1_tx_hash && progress?.stage !== 'ao1_credited') {
        try {
          const looked = await verifyStorePayment({ payment_id: intent.payment_id })
          if (looked?.usd_tx_hash) walletHash = looked.usd_tx_hash
          if (String(looked?.status || '').toLowerCase() === 'confirmed') {
            setSecuring(false)
            openConfirmation(id)
            return
          }
        } catch {
          // This order still needs its own USDT transfer.
        }
      }
      let sendPromise = null
      if (!walletHash && !intent.ao1_tx_hash && progress?.stage !== 'ao1_credited') {
        setPayStatus(`Approve ${intent.usd_amount} USDT in MetaMask. BscScan checks it as soon as the transfer is sent.`)
        sendPromise = sendStoreUsdt({
          from: wallet,
          tokenAddress: intent.usd_token_address || intent.token_address,
          to: intent.to_address,
          amount: intent.usd_amount,
          decimals: Number(intent.usd_token_decimals ?? intent.token_decimals),
          chainId: intent.chain_id
        }).then((hash) => {
          walletHash = hash
          console.log('[StorePayment] transaction id', walletHash)
          console.log('[StorePayment] BscScan', `https://bscscan.com/tx/${walletHash}`)
          sessionStorage.setItem(progressKey, JSON.stringify({
            ...(progress || {}),
            payment_id: intent.payment_id,
            wallet,
            usdt: intent.usd_amount,
            treasury: intent.to_address,
            usd_tx_hash: walletHash
          }))
          setPayStatus('USDT sent. Checking this transfer on BscScan.')
          return hash
        })
      }

      let usdHash = walletHash || (samePayment && progress?.stage === 'ao1_credited' ? progress?.usd_tx_hash : '') || ''
      let sendFailed = null
      let lookups = 0
      while (!usdHash && (sendPromise || lookups < 1)) {
        lookups += 1
        const raced = sendPromise
          ? await Promise.race([
            sendPromise.then((hash) => ({ hash })).catch((error) => ({ error })),
            new Promise((resolve) => setTimeout(() => resolve({}), 3000))
          ])
          : {}
        if (raced.hash) usdHash = raced.hash
        if (raced.error) sendFailed = raced.error
        if (!usdHash) {
          try {
            const looked = await verifyStorePayment({ payment_id: intent.payment_id })
            if (looked?.usd_tx_hash) usdHash = looked.usd_tx_hash
            if (String(looked?.status || '').toLowerCase() === 'confirmed') {
              setSecuring(false)
              openConfirmation(id)
              return
            }
            if (looked?.ao1_tx_hash || String(looked?.status || '').toLowerCase() === 'ao1_credited') {
              usdHash = looked.usd_tx_hash || usdHash
              walletHash = usdHash
              break
            }
          } catch {
            // The wallet may still be approving this order's USDT.
          }
        }
        if (sendFailed && !usdHash) break
        if (!sendPromise || lookups >= 8) break
      }
      usdHash = walletHash || usdHash
      if (!usdHash) {
        setSecuring(false)
        throw sendFailed || new Error('Payment failed')
      }

      let credited = samePayment && progress?.stage === 'ao1_credited' ? progress : null
      let lastStep = null
      for (let attempt = 1; attempt <= 3 && !credited; attempt += 1) {
        setPayStatus(`Checking this USDT transfer on BscScan (${attempt} of 3).`)
        let step = null
        try {
          step = await verifyStorePayment({
            payment_id: intent.payment_id,
            usd_tx_hash: usdHash
          })
        } catch {
          step = null
        }
        lastStep = step
        usdHash = step?.usd_tx_hash || usdHash
        const stepStatus = String(step?.status || '').toLowerCase()
        if (stepStatus === 'confirmed') {
          setSecuring(false)
          openConfirmation(id)
          return
        }
        if (stepStatus === 'ao1_credited') {
          credited = step
          break
        }
        if (step?.ao1_tx_hash) {
          credited = step
          break
        }
        if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 2000))
      }
      const creditedStatus = String(credited?.status || credited?.stage || '').toLowerCase()
      if (!credited?.ao1_tx_hash && creditedStatus !== 'ao1_credited') {
        if (lastStep?.ao1_tx_hash || intent.ao1_tx_hash) credited = lastStep?.ao1_tx_hash ? lastStep : intent
      }
      if (!credited?.ao1_tx_hash && creditedStatus !== 'ao1_credited') {
        throw new Error('Payment failed')
      }
      usdHash = credited.usd_tx_hash || usdHash
      const creditedReceipt = {
        stage: 'ao1_credited',
        usdt: intent.usd_amount,
        wallet,
        treasury: intent.to_address,
        usdTx: usdHash,
        creditedAo1: credited.gas_buffer_ao1 ? `${credited.amount_ao1} + ${credited.gas_buffer_ao1} gas` : credited.amount_ao1,
        returnAo1: credited.amount_ao1,
        ao1Treasury: credited.ao1_treasury_address,
        ao1Tx: credited.ao1_tx_hash
      }
      setReceipt(creditedReceipt)
      setError('')
      sessionStorage.setItem(progressKey, JSON.stringify({
        payment_id: intent.payment_id,
        stage: 'ao1_credited',
        usd_tx_hash: usdHash,
        amount_ao1: credited.amount_ao1,
        ao1_tx_hash: credited.ao1_tx_hash,
        ao1_treasury_address: credited.ao1_treasury_address,
        ao1_chain_id: credited.ao1_chain_id,
        ao1_rpc_url: credited.ao1_rpc_url,
        status: 'ao1_credited',
        receipt: creditedReceipt
      }))

      setPayStatus(`${credited.amount_ao1} AO1 is in your wallet. Tap Confirm AO1 return. MetaMask will open on that tap.`)
      setSecuring(false)
      return
    } catch (err) {
      const raw = checkoutNotice(err.message) || 'Could not complete the payment.'
      if (receipt?.stage === 'ao1_credited' || details?.confirmReturn) {
        setError('')
        setPayStatus(`${raw} USDT is already paid. Tap Confirm AO1 return and approve only the AO1 transfer in MetaMask.`)
      } else if (/idbdatabase|database connection is closing/i.test(raw)) {
        setError('')
        setPayStatus('MetaMask connection reset. Tap Pay again.')
      } else if (/abort|failed to fetch|network|load failed/i.test(raw)) {
        setPayStatus('Stay on this page. Do not send USDT again.')
        setError('')
      } else {
        setError(raw)
      }
    } finally {
      payLock.current = false
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
      status={payStatus}
      receipt={receipt}
      onPay={pay}
      onDone={leave}
    />
  )
}
