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

function matchCountry(value) {
  if (!value) return 'India'
  return Object.keys(LOCATIONS).find((name) => compactName(name) === compactName(value)) || 'India'
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

export const COUNTRY_CODES = [
  { code: '+1', iso: 'us' },
  { code: '+91', iso: 'in' },
  { code: '+44', iso: 'gb' },
  { code: '+971', iso: 'ae' },
  { code: '+966', iso: 'sa' },
  { code: '+65', iso: 'sg' },
  { code: '+60', iso: 'my' },
  { code: '+61', iso: 'au' },
  { code: '+62', iso: 'id' },
  { code: '+63', iso: 'ph' },
  { code: '+66', iso: 'th' },
  { code: '+81', iso: 'jp' },
  { code: '+82', iso: 'kr' },
  { code: '+86', iso: 'cn' },
  { code: '+84', iso: 'vn' },
  { code: '+92', iso: 'pk' },
  { code: '+880', iso: 'bd' },
  { code: '+94', iso: 'lk' },
  { code: '+977', iso: 'np' },
  { code: '+49', iso: 'de' },
  { code: '+33', iso: 'fr' },
  { code: '+39', iso: 'it' },
  { code: '+34', iso: 'es' },
  { code: '+55', iso: 'br' },
  { code: '+27', iso: 'za' },
  { code: '+234', iso: 'ng' },
  { code: '+254', iso: 'ke' },
  { code: '+7', iso: 'ru' }
]

function Flag({ iso }) {
  return (
    <img
      src={`https://flagcdn.com/w40/${iso}.png`}
      alt=""
      className="h-3.5 w-5 rounded-sm object-cover"
    />
  )
}

function CountryCodePicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState(null)
  const buttonRef = useRef(null)
  const selected = COUNTRY_CODES.find((item) => item.code === value) || COUNTRY_CODES[0]

  const toggle = () => {
    if (open) {
      setOpen(false)
      return
    }
    const rect = buttonRef.current.getBoundingClientRect()
    setMenuStyle({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 132) })
    setOpen(true)
  }

  return (
    <>
      <button
        type="button"
        ref={buttonRef}
        onClick={toggle}
        className="flex w-[6.75rem] shrink-0 items-center justify-between gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-slate-900"
        aria-label="Country code"
        aria-expanded={open}
      >
        <span className="flex items-center gap-1.5">
          <Flag iso={selected.iso} />
          <span>{selected.code}</span>
        </span>
        <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <>
          <button type="button" aria-label="Close country codes" className="fixed inset-0 z-[60] cursor-default" onClick={() => setOpen(false)} />
          <ul className="fixed z-[70] max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl" style={menuStyle}>
            {COUNTRY_CODES.map((item) => (
              <li key={item.iso}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(item.code)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm font-semibold ${item.code === selected.code ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  <Flag iso={item.iso} />
                  <span>{item.code}</span>
                </button>
              </li>
            ))}
          </ul>
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
  country: 'India',
  state: ''
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
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
    const country = countryValue || form.country || 'India'
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
    if ((form.country === 'India' || !form.country) && digits.length === 6) {
      fillFromPin(digits, 'India')
    }
  }

  const onCountryChange = (event) => {
    const country = event.target.value
    setForm((current) => ({
      ...current,
      country,
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
    if (details.phone.replace(/\D/g, '').length < 7) {
      setLocalError('Enter a valid phone number.')
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
              <CountryCodePicker
                value={form.countryCode}
                onChange={(code) => setForm((current) => ({ ...current, countryCode: code }))}
              />
              <input type="tel" className={inputClass} value={form.phone} onChange={setField('phone')} autoComplete="tel-national" placeholder="Phone number" />
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
              <select className={inputClass} value={form.country} onChange={onCountryChange} autoComplete="country-name">
                {Object.keys(LOCATIONS).map((country) => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </Field>
            <Field label="State">
              <select className={inputClass} value={stateOptions.includes(form.state) ? form.state : ''} onChange={setField('state')} autoComplete="address-level1">
                <option value="">Select state</option>
                {stateOptions.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
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
