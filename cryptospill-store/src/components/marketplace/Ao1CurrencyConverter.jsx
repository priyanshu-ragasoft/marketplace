import React, { useEffect, useMemo, useRef, useState } from 'react'

const AO1_PER_INR = 10

const DEFAULT_ASSET = 'crypto:usdt-bep20'

const CRYPTO = [
  { id: 'usdt-bep20', code: 'USDT', name: 'USDT BEP20', gecko: 'tether', digits: 2 },
  { id: 'usdt', code: 'USDT', name: 'Tether', gecko: 'tether', digits: 2 },
  { id: 'usdt-erc20', code: 'USDT', name: 'USDT ERC20', gecko: 'tether', digits: 2 },
  { id: 'usdt-trc20', code: 'USDT', name: 'Tether TRC20', gecko: 'tether', digits: 2 },
  { id: 'btc', code: 'BTC', name: 'Bitcoin', gecko: 'bitcoin', digits: 8 },
  { id: 'eth', code: 'ETH', name: 'Ethereum', gecko: 'ethereum', digits: 6 },
  { id: 'trx', code: 'TRX', name: 'Tron', gecko: 'tron', digits: 4 },
  { id: 'bnb', code: 'BNB', name: 'BNB BEP20', gecko: 'binancecoin', digits: 6 },
  { id: 'usdc', code: 'USDC', name: 'USD Coin', gecko: 'usd-coin', digits: 2 },
  { id: 'sol', code: 'SOL', name: 'Solana', gecko: 'solana', digits: 6 },
  { id: 'xrp', code: 'XRP', name: 'XRP', gecko: 'ripple', digits: 4 },
  { id: 'doge', code: 'DOGE', name: 'Dogecoin', gecko: 'dogecoin', digits: 4 },
  { id: 'ada', code: 'ADA', name: 'Cardano', gecko: 'cardano', digits: 4 },
  { id: 'ltc', code: 'LTC', name: 'Litecoin', gecko: 'litecoin', digits: 6 },
  { id: 'ton', code: 'TON', name: 'Toncoin', gecko: 'the-open-network', digits: 4 },
  { id: 'link', code: 'LINK', name: 'Chainlink', gecko: 'chainlink', digits: 4 },
  { id: 'avax', code: 'AVAX', name: 'Avalanche', gecko: 'avalanche-2', digits: 6 },
  { id: 'dot', code: 'DOT', name: 'Polkadot', gecko: 'polkadot', digits: 4 },
  { id: 'bch', code: 'BCH', name: 'Bitcoin Cash', gecko: 'bitcoin-cash', digits: 6 },
  { id: 'xlm', code: 'XLM', name: 'Stellar', gecko: 'stellar', digits: 4 },
  { id: 'uni', code: 'UNI', name: 'Uniswap', gecko: 'uniswap', digits: 4 },
  { id: 'shib', code: 'SHIB', name: 'Shiba Inu', gecko: 'shiba-inu', digits: 8 }
]

const FLAG_ISO = {
  EUR: 'eu',
  GBP: 'gb',
  USD: 'us',
  AUD: 'au',
  NZD: 'nz',
  XAF: 'cm',
  XOF: 'sn',
  XCD: 'ag',
  ANG: 'cw',
  XPF: 'pf'
}

const BINANCE_SYMBOL = {
  bitcoin: 'BTCUSDT',
  ethereum: 'ETHUSDT',
  tron: 'TRXUSDT',
  binancecoin: 'BNBUSDT',
  solana: 'SOLUSDT',
  ripple: 'XRPUSDT',
  dogecoin: 'DOGEUSDT',
  cardano: 'ADAUSDT',
  litecoin: 'LTCUSDT',
  'the-open-network': 'TONUSDT',
  chainlink: 'LINKUSDT',
  'avalanche-2': 'AVAXUSDT',
  polkadot: 'DOTUSDT',
  'bitcoin-cash': 'BCHUSDT',
  stellar: 'XLMUSDT',
  uniswap: 'UNIUSDT',
  'shiba-inu': 'SHIBUSDT',
  'usd-coin': 'USDCUSDT'
}

const inputClass = 'w-full bg-transparent text-right text-xl font-black text-slate-900 outline-none'

function formatAmount(value, digits = 2) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return ''
  return amount.toLocaleString('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: amount >= 1 ? Math.min(2, digits) : 0
  })
}

function parseAmount(value) {
  const amount = Number(String(value).replace(/,/g, ''))
  return Number.isFinite(amount) ? amount : NaN
}

function cleanDecimal(value) {
  const next = value.replace(/[^\d.]/g, '')
  const [whole, ...rest] = next.split('.')
  return rest.length ? `${whole}.${rest.join('')}` : whole
}

function currencyName(code) {
  try {
    return new Intl.DisplayNames(['en'], { type: 'currency' }).of(code) || code
  } catch {
    return code
  }
}

function flagIso(code) {
  if (FLAG_ISO[code]) return FLAG_ISO[code]
  const iso = code.slice(0, 2).toLowerCase()
  return /^[a-z]{2}$/.test(iso) ? iso : ''
}

function ao1FromFiat(amount, code, rates) {
  if (code === 'INR') return amount * AO1_PER_INR
  const inrPerUsd = rates.INR
  const perUsd = rates[code]
  if (!inrPerUsd || !perUsd) return NaN
  return (amount / perUsd) * inrPerUsd * AO1_PER_INR
}

function fiatFromAo1(ao1, code, rates) {
  if (code === 'INR') return ao1 / AO1_PER_INR
  const inrPerUsd = rates.INR
  const perUsd = rates[code]
  if (!inrPerUsd || !perUsd) return NaN
  return (ao1 / AO1_PER_INR / inrPerUsd) * perUsd
}

function ao1FromCrypto(amount, usdPrice, rates) {
  const inrPerUsd = rates.INR
  if (!inrPerUsd || !usdPrice) return NaN
  return amount * usdPrice * inrPerUsd * AO1_PER_INR
}

function cryptoFromAo1(ao1, usdPrice, rates) {
  const inrPerUsd = rates.INR
  if (!inrPerUsd || !usdPrice) return NaN
  return (ao1 / AO1_PER_INR / inrPerUsd) / usdPrice
}

function LetterMark({ code }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-black text-white">
      {code.slice(0, 3)}
    </span>
  )
}

function CoinIcon({ code }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <LetterMark code={code} />
  return (
    <img
      src={`https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@0.18.1/128/color/${code.toLowerCase()}.png`}
      alt=""
      className="h-8 w-8 shrink-0 rounded-full bg-white object-cover"
      onError={() => setFailed(true)}
    />
  )
}

function Mark({ item }) {
  if (item.kind === 'crypto') return <CoinIcon code={item.code} />
  const iso = flagIso(item.code)
  if (!iso) return <LetterMark code={item.code} />
  return (
    <img
      src={`https://flagcdn.com/w40/${iso}.png`}
      alt=""
      className="h-8 w-8 shrink-0 rounded-full object-cover"
      onError={(event) => {
        event.currentTarget.style.display = 'none'
      }}
    />
  )
}

export default function Ao1CurrencyConverter({ payableUsd = 0, onClose, onConfirm }) {
  const [rates, setRates] = useState(null)
  const [cryptoPrices, setCryptoPrices] = useState({})
  const [loading, setLoading] = useState(true)
  const [rateError, setRateError] = useState('')
  const [assetId, setAssetId] = useState(DEFAULT_ASSET)
  const [query, setQuery] = useState('')
  const [listOpen, setListOpen] = useState(false)
  const [ao1Text, setAo1Text] = useState('')
  const [coinText, setCoinText] = useState('')
  const editedRef = useRef(false)
  const ao1TextRef = useRef('')

  const loadRates = () => {
    let cancelled = false
    setLoading(true)
    setRateError('')
    const geckoIds = [...new Set(CRYPTO.map((item) => item.gecko))].join(',')

    const loadCrypto = fetch('https://api.binance.com/api/v3/ticker/price')
      .then((response) => (response.ok ? response.json() : []))
      .then((rows) => {
        const bySymbol = {}
        ;(Array.isArray(rows) ? rows : []).forEach((row) => {
          const price = Number(row.price)
          if (row.symbol && price > 0) bySymbol[row.symbol] = price
        })
        const prices = { tether: 1 }
        Object.entries(BINANCE_SYMBOL).forEach(([gecko, symbol]) => {
          if (bySymbol[symbol] > 0) prices[gecko] = bySymbol[symbol]
        })
        if (Object.keys(prices).length > 2) return prices
        return fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${geckoIds}&vs_currencies=usd`)
          .then((response) => (response.ok ? response.json() : {}))
          .then((crypto) => {
            CRYPTO.forEach((item) => {
              const usd = Number(crypto?.[item.gecko]?.usd)
              if (usd > 0) prices[item.gecko] = usd
            })
            prices.tether = prices.tether || 1
            return prices
          })
          .catch(() => prices)
      })
      .catch(() => ({ tether: 1, 'usd-coin': 1 }))

    Promise.all([
      fetch('https://open.er-api.com/v6/latest/USD').then((response) => {
        if (!response.ok) throw new Error('Live currency rates are unavailable.')
        return response.json()
      }),
      loadCrypto
    ])
      .then(([fiat, prices]) => {
        if (cancelled) return
        const nextRates = fiat?.rates
        if (!nextRates || !Number(nextRates.INR)) {
          throw new Error('Live currency rates are unavailable.')
        }
        setRates(nextRates)
        setCryptoPrices(prices || { tether: 1 })
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setRateError(err.message || 'Live currency rates are unavailable.')
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }

  useEffect(() => loadRates(), [])

  const currencies = useMemo(() => {
    const crypto = CRYPTO.filter((item) => cryptoPrices[item.gecko] || item.gecko === 'tether' || item.gecko === 'usd-coin').map((item) => ({
      ...item,
      kind: 'crypto',
      id: `crypto:${item.id}`,
      usd: cryptoPrices[item.gecko] || 1
    }))
    const fiat = rates
      ? Object.keys(rates)
          .filter((code) => Number(rates[code]) > 0)
          .sort()
          .map((code) => ({
            id: `fiat:${code}`,
            kind: 'fiat',
            code,
            name: currencyName(code),
            digits: 2
          }))
      : []
    return [...crypto, ...fiat]
  }, [rates, cryptoPrices])

  const asset = currencies.find((item) => item.id === assetId) || currencies.find((item) => item.id === DEFAULT_ASSET) || currencies.find((item) => item.kind === 'crypto') || currencies[0]

  const convertFromAo1 = (ao1, item = asset) => {
    if (!item || !rates) return NaN
    if (item.kind === 'crypto') return cryptoFromAo1(ao1, item.usd, rates)
    return fiatFromAo1(ao1, item.code, rates)
  }

  const convertToAo1 = (amount, item = asset) => {
    if (!item || !rates) return NaN
    if (item.kind === 'crypto') return ao1FromCrypto(amount, item.usd, rates)
    return ao1FromFiat(amount, item.code, rates)
  }

  useEffect(() => {
    if (!rates || !asset) return
    const ao1 = editedRef.current
      ? parseAmount(ao1TextRef.current)
      : (Number(payableUsd) || 0) * Number(rates.INR) * AO1_PER_INR
    if (!Number.isFinite(ao1)) return
    const coin = convertFromAo1(ao1, asset)
    if (!Number.isFinite(coin)) return
    if (!editedRef.current) {
      const nextAo1 = formatAmount(ao1, 2)
      ao1TextRef.current = nextAo1
      setAo1Text(nextAo1)
    }
    setCoinText(formatAmount(coin, asset.digits))
  }, [rates, asset, payableUsd])

  const onAo1Change = (value) => {
    const clean = cleanDecimal(value)
    editedRef.current = true
    ao1TextRef.current = clean
    setAo1Text(clean)
    const ao1 = Number(clean)
    if (!asset || !Number.isFinite(ao1)) {
      setCoinText('')
      return
    }
    setCoinText(formatAmount(convertFromAo1(ao1), asset.digits))
  }

  const onCoinChange = (value) => {
    const clean = cleanDecimal(value)
    editedRef.current = true
    setCoinText(clean)
    const amount = Number(clean)
    if (!asset || !Number.isFinite(amount)) {
      ao1TextRef.current = ''
      setAo1Text('')
      return
    }
    const ao1 = formatAmount(convertToAo1(amount), 2)
    ao1TextRef.current = ao1
    setAo1Text(ao1)
  }

  const filtered = currencies.filter((item) => {
    const needle = query.trim().toLowerCase()
    if (!needle) return true
    return item.code.toLowerCase().includes(needle) || item.name.toLowerCase().includes(needle)
  })
  const cryptoList = filtered.filter((item) => item.kind === 'crypto')
  const fiatList = filtered.filter((item) => item.kind === 'fiat')

  const oneUnitAo1 = asset ? convertToAo1(1, asset) : NaN

  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button type="button" aria-label="Close converter" className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-600">Pay in AO1</p>
            <h3 className="mt-1 text-xl font-black">Currency converter</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {asset ? `${asset.name} from the current order value` : 'Live market rates'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-slate-100 px-2.5 py-1 text-sm cursor-pointer">✕</button>
        </div>

        <div className="space-y-3 overflow-y-auto px-5 py-4">
          {loading && <p className="text-sm text-slate-500">Loading live rates...</p>}
          {rateError && (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
              <span>{rateError}</span>
              <button type="button" onClick={loadRates} className="cursor-pointer underline">Retry</button>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setListOpen((open) => !open)}
                className="flex shrink-0 items-center gap-2 text-left cursor-pointer"
                aria-expanded={listOpen}
              >
                {asset && <Mark item={asset} />}
                <span className="whitespace-nowrap text-sm font-black">{asset ? asset.name : 'USDT BEP20'}</span>
                <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <input
                inputMode="decimal"
                value={coinText}
                onChange={(event) => onCoinChange(event.target.value)}
                onBlur={() => {
                  const amount = parseAmount(coinText)
                  if (asset && Number.isFinite(amount)) setCoinText(formatAmount(amount, asset.digits))
                }}
                placeholder={loading ? '…' : '0.00'}
                className="w-36 shrink-0 bg-transparent text-right text-xl font-black tabular-nums text-slate-900 outline-none"
                aria-label="Converted amount"
              />
            </div>

            {listOpen && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search currency"
                  className="mb-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-900"
                />
                <div className="max-h-52 overflow-y-auto">
                  {cryptoList.length > 0 && (
                    <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">Crypto</p>
                  )}
                  {cryptoList.map((item) => (
                    <CurrencyRow
                      key={item.id}
                      item={item}
                      amount={convertFromAo1(parseAmount(ao1Text), item)}
                      active={item.id === asset?.id}
                      onSelect={() => {
                        setAssetId(item.id)
                        setListOpen(false)
                        setQuery('')
                      }}
                    />
                  ))}
                  {fiatList.length > 0 && (
                    <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">Fiat</p>
                  )}
                  {fiatList.map((item) => (
                    <CurrencyRow
                      key={item.id}
                      item={item}
                      amount={convertFromAo1(parseAmount(ao1Text), item)}
                      active={item.id === asset?.id}
                      onSelect={() => {
                        setAssetId(item.id)
                        setListOpen(false)
                        setQuery('')
                      }}
                    />
                  ))}
                  {filtered.length === 0 && <p className="px-2 py-3 text-xs text-slate-500">No currency matches.</p>}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-yellow-200 bg-yellow-400 text-slate-950 shadow-sm">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <img src="/small.png" alt="AO1" className="h-9 w-9 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-black">AO1</p>
                </div>
              </div>
              <input
                inputMode="decimal"
                value={ao1Text}
                onChange={(event) => onAo1Change(event.target.value)}
                onBlur={() => {
                  const ao1 = parseAmount(ao1Text)
                  if (Number.isFinite(ao1)) setAo1Text(formatAmount(ao1, 2))
                }}
                className={inputClass}
                aria-label="AO1 amount"
              />
            </div>
          </div>

          {asset && Number.isFinite(oneUnitAo1) && (
            <p className="text-center text-[11px] font-semibold text-slate-500">
              Current value · 1 {asset.code} = {formatAmount(oneUnitAo1, oneUnitAo1 >= 1 ? 2 : 8)} AO1
            </p>
          )}
        </div>

        <div className="border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={() => onConfirm({
              code: asset?.code || '',
              name: asset?.name || asset?.code || '',
              digits: asset?.digits ?? 2,
              amount: parseAmount(coinText),
              ao1: parseAmount(ao1Text)
            })}
            disabled={loading || !rates}
            className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white cursor-pointer hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Continue to escrow
          </button>
        </div>
      </div>
    </div>
  )
}

function CurrencyRow({ item, amount, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left cursor-pointer ${active ? 'bg-yellow-50' : 'hover:bg-slate-50'}`}
    >
      <Mark item={item} />
      <span className="min-w-0">
        <span className="block whitespace-nowrap text-sm font-black text-slate-900">{item.name}</span>
      </span>
      {Number.isFinite(amount) && (
        <span className="ml-auto shrink-0 text-sm font-black tabular-nums text-slate-900">
          {formatAmount(amount, item.digits)}
        </span>
      )}
    </button>
  )
}
