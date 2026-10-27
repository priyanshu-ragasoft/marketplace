import React, { useEffect, useRef, useState } from 'react'

const INDIA_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
]

export const LOCATIONS = {
  India: INDIA_STATES,
  'United States': ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'],
  'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
  'United Arab Emirates': ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'],
  Canada: ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan'],
  Australia: ['Australian Capital Territory', 'New South Wales', 'Northern Territory', 'Queensland', 'South Australia', 'Tasmania', 'Victoria', 'Western Australia'],
  'Saudi Arabia': ['Riyadh', 'Makkah', 'Madinah', 'Eastern Province', 'Asir', 'Tabuk', 'Qassim'],
  Singapore: ['Singapore'],
  Germany: ['Bavaria', 'Berlin', 'Hamburg', 'Hesse', 'North Rhine-Westphalia', 'Saxony'],
  France: ['Île-de-France', 'Provence-Alpes-Côte d\'Azur', 'Auvergne-Rhône-Alpes', 'Occitanie', 'Nouvelle-Aquitaine'],
  Nepal: ['Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim'],
  Bangladesh: ['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh']
}

const PIN_ISO = {
  India: 'in',
  'United States': 'us',
  'United Kingdom': 'gb',
  Canada: 'ca',
  Australia: 'au',
  Germany: 'de',
  France: 'fr',
  Spain: 'es',
  Brazil: 'br'
}

const STATE_ALIASES = {
  nctofdelhi: 'Delhi',
  delhi: 'Delhi',
  orissa: 'Odisha',
  pondicherry: 'Puducherry',
  uttaranchal: 'Uttarakhand'
}

function compactName(value) {
  return String(value || '').toLowerCase().replace(/[^a-z]/g, '')
}

export function matchCountry(value) {
  if (!value) return 'United States'
  return Object.keys(LOCATIONS).find((name) => compactName(name) === compactName(value)) || 'United States'
}

function matchState(country, value) {
  const list = LOCATIONS[country] || []
  const needle = STATE_ALIASES[compactName(value)] || value
  return list.find((name) => compactName(name) === compactName(needle)) || ''
}

async function lookupPin(pin, country) {
  const iso = PIN_ISO[country] || 'in'
  try {
    const response = await fetch(`https://api.zippopotam.us/${iso}/${encodeURIComponent(pin)}`)
    if (response.ok) {
      const data = await response.json()
      const place = data.places?.[0]
      if (place?.state) {
        return { country: matchCountry(data.country || country), state: place.state }
      }
    }
  } catch {
    // Fall through to the India PIN directory.
  }

  if ((PIN_ISO[country] || 'in') !== 'in' || !/^\d{6}$/.test(pin)) {
    throw new Error('No location found for this PIN.')
  }

  const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`)
  if (!response.ok) throw new Error('No location found for this PIN.')
  const data = await response.json()
  const office = data?.[0]?.PostOffice?.[0]
  if (data?.[0]?.Status !== 'Success' || !office?.State) {
    throw new Error('No location found for this PIN.')
  }
  return { country: 'India', state: office.State }
}

const PHONE_RULES = {
  '+91': { min: 10, max: 10, pattern: /^[6-9]\d{9}$/, example: 'ten digit Indian mobile', message: 'Enter a valid Indian mobile number.' },
  '+1': { min: 10, max: 10, pattern: /^[2-9]\d{9}$/, example: 'ten digit US/Canada number', message: 'Enter a valid US or Canada number.' },
  '+44': { min: 10, max: 10, example: 'ten digit UK mobile', message: 'Enter a valid UK mobile number.' },
  '+971': { min: 9, max: 9, pattern: /^5\d{8}$/, example: 'nine digit UAE mobile', message: 'Enter a valid UAE mobile number.' },
  '+966': { min: 9, max: 9, pattern: /^5\d{8}$/, example: 'nine digit Saudi mobile', message: 'Enter a valid Saudi mobile number.' },
  '+65': { min: 8, max: 8, pattern: /^[89]\d{7}$/, example: 'eight digit Singapore mobile', message: 'Enter a valid Singapore mobile number.' },
  '+60': { min: 9, max: 10, example: 'Malaysia mobile digits', message: 'Enter a valid Malaysia number.' },
  '+61': { min: 9, max: 9, example: 'nine digit Australia mobile', message: 'Enter a valid Australia number.' },
  '+62': { min: 9, max: 12, example: 'Indonesia mobile digits', message: 'Enter a valid Indonesia number.' },
  '+63': { min: 10, max: 10, pattern: /^9\d{9}$/, example: 'ten digit Philippines mobile', message: 'Enter a valid Philippines mobile number.' },
  '+66': { min: 9, max: 9, example: 'nine digit Thailand mobile', message: 'Enter a valid Thailand number.' },
  '+81': { min: 10, max: 10, example: 'ten digit Japan mobile', message: 'Enter a valid Japan number.' },
  '+82': { min: 9, max: 11, example: 'South Korea mobile digits', message: 'Enter a valid South Korea number.' },
  '+86': { min: 11, max: 11, pattern: /^1\d{10}$/, example: 'eleven digit China mobile', message: 'Enter a valid China mobile number.' },
  '+84': { min: 9, max: 10, example: 'Vietnam mobile digits', message: 'Enter a valid Vietnam number.' },
  '+92': { min: 10, max: 10, pattern: /^3\d{9}$/, example: 'ten digit Pakistan mobile', message: 'Enter a valid Pakistan mobile number.' },
  '+880': { min: 10, max: 10, pattern: /^1\d{9}$/, example: 'ten digit Bangladesh mobile', message: 'Enter a valid Bangladesh mobile number.' },
  '+94': { min: 9, max: 9, example: 'nine digit Sri Lanka mobile', message: 'Enter a valid Sri Lanka number.' },
  '+977': { min: 10, max: 10, pattern: /^9\d{9}$/, example: 'ten digit Nepal mobile', message: 'Enter a valid Nepal mobile number.' },
  '+49': { min: 10, max: 11, example: 'Germany mobile digits', message: 'Enter a valid Germany number.' },
  '+33': { min: 9, max: 9, example: 'nine digit France mobile', message: 'Enter a valid France number.' },
  '+39': { min: 9, max: 10, example: 'Italy mobile digits', message: 'Enter a valid Italy number.' },
  '+34': { min: 9, max: 9, example: 'nine digit Spain mobile', message: 'Enter a valid Spain number.' },
  '+55': { min: 10, max: 11, example: 'Brazil mobile digits', message: 'Enter a valid Brazil number.' },
  '+27': { min: 9, max: 9, example: 'nine digit South Africa mobile', message: 'Enter a valid South Africa number.' },
  '+234': { min: 10, max: 10, example: 'ten digit Nigeria mobile', message: 'Enter a valid Nigeria number.' },
  '+254': { min: 9, max: 9, example: 'nine digit Kenya mobile', message: 'Enter a valid Kenya number.' },
  '+7': { min: 10, max: 10, example: 'ten digit Russia mobile', message: 'Enter a valid Russia number.' }
}

export function phoneDigits(value) {
  return String(value || '').replace(/\D/g, '')
}

export function phoneRule(countryCode) {
  return PHONE_RULES[countryCode] || { min: 6, max: 15, example: '5551234567', message: 'Enter a valid phone number.' }
}

export function phoneValidationMessage(countryCode, phone) {
  const digits = phoneDigits(phone)
  const rule = phoneRule(countryCode)
  if (!digits) return 'Enter the phone number.'
  if (digits.length < rule.min || digits.length > rule.max || (rule.pattern && !rule.pattern.test(digits))) {
    return rule.message
  }
  return ''
}

export const COUNTRY_CODES = [
  { code: '+1', iso: 'us', name: 'United States' },
  { code: '+91', iso: 'in', name: 'India' },
  { code: '+44', iso: 'gb', name: 'United Kingdom' },
  { code: '+971', iso: 'ae', name: 'United Arab Emirates' },
  { code: '+966', iso: 'sa', name: 'Saudi Arabia' },
  { code: '+65', iso: 'sg', name: 'Singapore' },
  { code: '+60', iso: 'my', name: 'Malaysia' },
  { code: '+61', iso: 'au', name: 'Australia' },
  { code: '+62', iso: 'id', name: 'Indonesia' },
  { code: '+63', iso: 'ph', name: 'Philippines' },
  { code: '+66', iso: 'th', name: 'Thailand' },
  { code: '+81', iso: 'jp', name: 'Japan' },
  { code: '+82', iso: 'kr', name: 'South Korea' },
  { code: '+86', iso: 'cn', name: 'China' },
  { code: '+84', iso: 'vn', name: 'Vietnam' },
  { code: '+92', iso: 'pk', name: 'Pakistan' },
  { code: '+880', iso: 'bd', name: 'Bangladesh' },
  { code: '+94', iso: 'lk', name: 'Sri Lanka' },
  { code: '+977', iso: 'np', name: 'Nepal' },
  { code: '+49', iso: 'de', name: 'Germany' },
  { code: '+33', iso: 'fr', name: 'France' },
  { code: '+39', iso: 'it', name: 'Italy' },
  { code: '+34', iso: 'es', name: 'Spain' },
  { code: '+55', iso: 'br', name: 'Brazil' },
  { code: '+27', iso: 'za', name: 'South Africa' },
  { code: '+234', iso: 'ng', name: 'Nigeria' },
  { code: '+254', iso: 'ke', name: 'Kenya' },
  { code: '+7', iso: 'ru', name: 'Russia' }
]

export const COUNTRY_OPTIONS = ['United States', ...Object.keys(LOCATIONS).filter((name) => name !== 'United States')]

export function dialCodeForCountry(country) {
  if (country === 'Canada') return '+1'
  return COUNTRY_CODES.find((item) => item.name === country)?.code || '+1'
}

export function countryForDialCode(code) {
  const item = COUNTRY_CODES.find((row) => row.code === code)
  return item && LOCATIONS[item.name] ? item.name : ''
}

function Flag({ iso }) {
  return (
    <img
      src={`https://flagcdn.com/w40/${iso}.png`}
      alt=""
      className="h-3.5 w-5 rounded-sm object-cover"
    />
  )
}

export function FieldSelect({ value, onChange, options, placeholder = 'Select', disabled = false, className = '', menuMinWidth = 0, ariaLabel = 'Select' }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [menuStyle, setMenuStyle] = useState(null)
  const buttonRef = useRef(null)
  const searchRef = useRef(null)
  const selected = options.find((item) => item.value === value)
  const showSearch = options.length > 6
  const needle = query.trim().toLowerCase()
  const filtered = needle
    ? options.filter((item) => item.label.toLowerCase().includes(needle) || String(item.value).toLowerCase().includes(needle))
    : options

  useEffect(() => {
    if (!open) return undefined
    const place = () => {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      const width = Math.max(rect.width, menuMinWidth)
      const spaceBelow = window.innerHeight - rect.bottom
      const openUp = spaceBelow < 280 && rect.top > spaceBelow
      const left = Math.min(rect.left, window.innerWidth - width - 8)
      setMenuStyle({
        left: Math.max(8, left),
        width,
        ...(openUp ? { bottom: window.innerHeight - rect.top + 6 } : { top: rect.bottom + 6 })
      })
    }
    place()
    const timer = window.setTimeout(() => searchRef.current?.focus(), 0)
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, menuMinWidth])

  return (
    <>
      <button
        type="button"
        ref={buttonRef}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => {
          if (disabled) return
          setQuery('')
          setOpen((current) => !current)
        }}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2 text-left text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${open ? 'border-slate-900 ring-2 ring-slate-900/10' : 'border-slate-200 hover:border-slate-300'} ${className}`}
      >
        <span className={`flex min-w-0 items-center gap-2 ${selected ? 'font-semibold text-slate-900' : 'font-medium text-slate-400'}`}>
          {selected?.iso && <Flag iso={selected.iso} />}
          <span className="truncate">{selected?.label || placeholder}</span>
        </span>
        <svg className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.25" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <>
          <button type="button" aria-label="Close menu" className="fixed inset-0 z-[110] cursor-default" onClick={() => setOpen(false)} />
          <div className="fixed z-[120] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.14)]" style={menuStyle}>
            {showSearch && (
              <div className="border-b border-slate-100 p-2">
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search"
                  className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-900"
                />
              </div>
            )}
            <ul className="max-h-56 overflow-y-auto py-1" role="listbox">
              {filtered.length === 0 && <li className="px-3 py-2.5 text-sm text-slate-400">No matches</li>}
              {filtered.map((item) => {
                const active = item.value === value
                return (
                  <li key={item.iso || item.value || item.label}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        onChange(item.value)
                        setOpen(false)
                      }}
                      className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm ${active ? 'bg-slate-50 font-semibold text-slate-900' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      {item.iso && <Flag iso={item.iso} />}
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {active && (
                        <svg className="h-4 w-4 shrink-0 text-[#D1A61B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </>
      )}
    </>
  )
}

const EMPTY = {
  firstName: '',
  lastName: '',
  email: '',
  countryCode: '+1',
  phone: '',
  address: '',
  pin: '',
  country: 'United States',
  state: ''
}

function Field({ label, children }) {
  return (
    <div className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </div>
  )
}

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-900'

export default function DeliveryDetailsForm({ userName = '', initialValues, submitting = false, error = '', onClose, onSubmit }) {
  const [form, setForm] = useState(() => {
    const country = matchCountry(initialValues?.country)
    return {
      ...EMPTY,
      ...initialValues,
      country,
      state: matchState(country, initialValues?.state)
    }
  })
  const [localError, setLocalError] = useState('')
  const [pinStatus, setPinStatus] = useState('')
  const [pinMessage, setPinMessage] = useState('')

  useEffect(() => {
    if (!initialValues?.address && !initialValues?.firstName && !initialValues?.pin) return
    const country = matchCountry(initialValues.country)
    setForm({
      ...EMPTY,
      ...initialValues,
      country,
      state: matchState(country, initialValues.state) || initialValues.state || ''
    })
  }, [initialValues?.address, initialValues?.pin, initialValues?.firstName, initialValues?.lastName, initialValues?.phone, initialValues?.email, initialValues?.state, initialValues?.country, initialValues?.countryCode])

  const setField = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
  }

  const stateOptions = LOCATIONS[form.country] || []

  const fillFromPin = async (pinValue, countryValue) => {
    const pin = String(pinValue || '').trim()
    const country = countryValue || form.country || 'United States'
    if (pin.replace(/\D/g, '').length < 4) {
      setPinStatus('error')
      setPinMessage('Enter the PIN code first.')
      return
    }
    setPinStatus('loading')
    setPinMessage('')
    try {
      const found = await lookupPin(pin, country)
      const nextCountry = matchCountry(found.country)
      const nextState = matchState(nextCountry, found.state) || found.state
      setForm((current) => ({ ...current, country: nextCountry, state: nextState }))
      setPinStatus('done')
      setPinMessage(`${nextState}, ${nextCountry}`)
    } catch (err) {
      setPinStatus('error')
      setPinMessage(err.message || 'No location found for this PIN.')
    }
  }

  const onPinChange = (event) => {
    const pin = event.target.value
    setForm((current) => ({ ...current, pin }))
    setPinMessage('')
    const digits = pin.replace(/\D/g, '')
    if (form.country === 'United States' && digits.length === 6) {
      fillFromPin(digits, 'United States')
    }
  }

  const onCountryChange = (event) => {
    const country = event.target.value
    setForm((current) => ({
      ...current,
      country,
      countryCode: dialCodeForCountry(country),
      state: (LOCATIONS[country] || []).includes(current.state) ? current.state : ''
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const details = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      countryCode: form.countryCode.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      pin: form.pin.trim(),
      country: form.country.trim(),
      state: form.state.trim()
    }

    if (!details.firstName || !details.lastName) {
      setLocalError('Enter first and last name.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) {
      setLocalError('Enter a valid email.')
      return
    }
    if (!/^\+\d{1,4}$/.test(details.countryCode)) {
      setLocalError('Select a country code.')
      return
    }
    const phoneMessage = phoneValidationMessage(details.countryCode, details.phone)
    if (phoneMessage) {
      setLocalError(phoneMessage)
      return
    }
    if (details.address.length < 5) {
      setLocalError('Enter the delivery address.')
      return
    }
    if (details.pin.length < 3) {
      setLocalError('Enter the PIN code.')
      return
    }
    if (details.country.length < 2 || details.state.length < 2) {
      setLocalError('Select country and state.')
      return
    }

    setLocalError('')
    onSubmit(details)
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 p-0 sm:p-6">
      <button type="button" aria-label="Close delivery form" className="absolute inset-0 cursor-default" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative flex h-full max-h-none w-full max-w-2xl flex-col overflow-hidden bg-white text-slate-900 shadow-2xl sm:h-auto sm:max-h-[92vh] sm:rounded-3xl sm:border sm:border-slate-200">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-600">Delivery</p>
            {userName && (
              <p className="mt-1 text-sm font-bold text-slate-900">{userName}</p>
            )}
            <h3 className="mt-1 text-xl font-black">Where should we deliver?</h3>
            {form.address && (
              <p className="mt-1 text-xs font-semibold text-slate-500">Your saved address is filled in. Change it if this order should go somewhere else.</p>
            )}
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-slate-100 px-2.5 py-1 text-sm cursor-pointer">✕</button>
        </div>

        <div className="space-y-3 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="First name">
              <input className={inputClass} value={form.firstName} onChange={setField('firstName')} autoComplete="given-name" />
            </Field>
            <Field label="Last name">
              <input className={inputClass} value={form.lastName} onChange={setField('lastName')} autoComplete="family-name" />
            </Field>
          </div>
          <Field label="Email">
            <input type="email" className={inputClass} value={form.email} onChange={setField('email')} autoComplete="email" />
          </Field>
          <Field label="Phone">
            <div className="flex gap-2">
              <div className="w-[6.75rem] shrink-0">
                <FieldSelect
                  ariaLabel="Country code"
                  value={form.countryCode}
                  menuMinWidth={148}
                  className="py-2.5"
                  options={COUNTRY_CODES.map((item) => ({ value: item.code, label: item.code, iso: item.iso }))}
                  onChange={(code) => setForm((current) => {
                    const nextCountry = countryForDialCode(code)
                    const list = LOCATIONS[nextCountry] || []
                    return {
                      ...current,
                      countryCode: code,
                      ...(nextCountry
                        ? { country: nextCountry, state: list.includes(current.state) ? current.state : '' }
                        : {})
                    }
                  })}
                />
              </div>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                className={inputClass}
                value={form.phone}
                maxLength={phoneRule(form.countryCode).max}
                placeholder={phoneRule(form.countryCode).example}
                onChange={(event) => {
                  const max = phoneRule(form.countryCode).max
                  setField('phone')({ target: { value: phoneDigits(event.target.value).slice(0, max) } })
                }}
              />
            </div>
          </Field>
          <Field label="Address">
            <textarea rows={3} className={inputClass} value={form.address} onChange={setField('address')} autoComplete="street-address" />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
            <Field label="PIN">
              <input className={inputClass} value={form.pin} onChange={onPinChange} autoComplete="postal-code" inputMode="numeric" />
            </Field>
            <div className="sm:pt-5">
              <button
                type="button"
                onClick={() => fillFromPin(form.pin, form.country)}
                disabled={pinStatus === 'loading'}
                className="h-[42px] w-full rounded-xl bg-slate-900 px-4 text-xs font-bold text-white cursor-pointer disabled:opacity-60 sm:w-auto"
              >
                {pinStatus === 'loading' ? 'Finding...' : 'Autofill'}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Country">
              <FieldSelect
                ariaLabel="Country"
                value={form.country}
                className="py-2.5"
                options={COUNTRY_OPTIONS.map((country) => ({ value: country, label: country }))}
                onChange={(country) => onCountryChange({ target: { value: country } })}
              />
            </Field>
            <Field label="State">
              <FieldSelect
                ariaLabel="State"
                value={stateOptions.includes(form.state) ? form.state : ''}
                placeholder="Select state"
                className="py-2.5"
                options={stateOptions.map((state) => ({ value: state, label: state }))}
                onChange={(state) => setField('state')({ target: { value: state } })}
              />
            </Field>
          </div>
          {pinMessage && (
            <p className={`text-xs font-semibold ${pinStatus === 'error' ? 'text-rose-600' : 'text-emerald-700'}`}>{pinMessage}</p>
          )}
          {(localError || error) && (
            <p className="text-xs font-semibold text-rose-600">{localError || error}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 cursor-pointer">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white cursor-pointer disabled:opacity-70"
          >
            {submitting ? 'Saving...' : 'Continue to escrow'}
          </button>
        </div>
      </form>
    </div>
  )
}
