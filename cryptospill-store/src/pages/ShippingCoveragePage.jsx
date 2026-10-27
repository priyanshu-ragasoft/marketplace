import React, { useState } from 'react'
import { useRouter, Link } from '../router/RouterContext'
import InfoSidebar from '../components/marketplace/InfoSidebar'

export default function ShippingCoveragePage() {
  const { navigate } = useRouter()

  // Interactive transit calculator state
  const [selectedRegion, setSelectedRegion] = useState('na')
  const [shippingMethod, setShippingMethod] = useState('express')
  const [searchFilter, setSearchFilter] = useState('')

  const regionsData = {
    na: {
      name: 'North America (USA & Canada)',
      carrier: 'FedEx International Priority Air',
      carrierCode: 'FX-AIR-PRIORITY',
      depot: 'San Francisco Vault Hub (SFO)',
      transitStandard: '24 – 48 Hours',
      transitExpress: '18 – 24 Hours (Next-Day Flight)',
      customs: 'DDP (Delivered Duty Paid) – Zero Customs Fees',
      lithiumCompliance: 'IATA Section II PI 967 Compliant',
      insurance: '100% Full Escrow Value Insured by Lloyd’s Syndicate',
      onTimeRate: '99.9%',
      flightRoute: 'SFO Hub ➔ Regional Express Cargo Hub ➔ Direct Signature Courier',
    },
    eu: {
      name: 'European Union & United Kingdom',
      carrier: 'DHL Express Aviation (Air Freight)',
      carrierCode: 'DHL-AVIATION-EU',
      depot: 'Frankfurt Central Depository (FRA Vault)',
      transitStandard: '24 – 48 Hours',
      transitExpress: '24 Hours (Next-Day Priority)',
      customs: 'Pre-cleared Intra-EU Transit (Zero VAT Surprises at Doorstep)',
      lithiumCompliance: 'IATA PI 967 Certified Dual-Wall Packaging',
      insurance: '100% Full Value Smart Contract Bonded',
      onTimeRate: '99.8%',
      flightRoute: 'FRA Vault ➔ European Air Network ➔ Dedicated Courier Van',
    },
    gulf: {
      name: 'Middle East & GCC (UAE, Saudi Arabia, Qatar)',
      carrier: 'FedEx Priority Air / Emirates SkyCargo',
      carrierCode: 'EK-SKYCARGO-DXB',
      depot: 'Dubai South Air Logistics Depot (DXB Vault)',
      transitStandard: '48 – 72 Hours',
      transitExpress: '36 – 48 Hours (Direct Flight Dispatch)',
      customs: 'DDP Clearance via Dubai Logistics City Free Zone',
      lithiumCompliance: 'IATA UN3481 Class 9 Aviation Certified',
      insurance: '100% Declared Escrow Collateral Policy',
      onTimeRate: '99.7%',
      flightRoute: 'DXB Vault ➔ Direct GCC Air Bridge ➔ In-Hand Handover',
    },
    in: {
      name: 'India & South Asia (Metros & Major Cities)',
      carrier: 'FedEx Express Air / DHL Express Aviation',
      carrierCode: 'FX-IN-AIR',
      depot: 'Dubai Logistics City / Mumbai Air Cargo Hub (BOM)',
      transitStandard: '48 – 72 Hours',
      transitExpress: '36 – 48 Hours Priority Air',
      customs: 'Formal DDP Clearance (All Import Duties & GST Pre-Cleared)',
      lithiumCompliance: 'IATA Lithium Battery Air Safety Certified',
      insurance: '100% Escrow Backed Protection Guarantee',
      onTimeRate: '99.6%',
      flightRoute: 'Regional Air Hub ➔ BOM/DEL Gateway ➔ Express Direct Courier',
    },
    apac: {
      name: 'Asia-Pacific (Singapore, Hong Kong, Japan, Australia)',
      carrier: 'DHL Express Worldwide Aviation / Singapore Post Air',
      carrierCode: 'DHL-APAC-EXPRESS',
      depot: 'Singapore Changi Air Cargo Complex (SIN Vault)',
      transitStandard: '48 – 72 Hours',
      transitExpress: '36 – 48 Hours Express Cargo',
      customs: 'Free-Trade DDP Express Air Clearance',
      lithiumCompliance: 'Strict Lithium Metal/Ion Flight Standard',
      insurance: '100% Smart Contract Backed Air Marine Coverage',
      onTimeRate: '99.8%',
      flightRoute: 'SIN Cargo Terminal ➔ Trans-Pacific Air ➔ Direct Signature',
    },
    latam: {
      name: 'Latin America & Caribbean',
      carrier: 'DHL Express Aviation Priority Air',
      carrierCode: 'DHL-LATAM-AIR',
      depot: 'Miami Transit Logistics Depository (MIA Vault)',
      transitStandard: '3 – 5 Business Days',
      transitExpress: '2 – 3 Business Days Priority',
      customs: 'Formal Broker Customs Entry with Prepaid Duties',
      lithiumCompliance: 'UN3481 Built-in Battery Certified Box',
      insurance: '100% Escrow Collateral Guarantee',
      onTimeRate: '99.4%',
      flightRoute: 'MIA Hub ➔ Regional Capital Airport ➔ Armored Courier',
    },
  }

  const currentInfo = regionsData[selectedRegion]

  const slaTableData = [
    { zone: '🇺🇸 United States (Domestic 50 States)', carrier: 'FedEx Priority Overnight / 2-Day Air', dispatch: '< 12 Hours', time: '18 – 24 Hours', customs: 'Pre-Cleared (US Depot)', tag: 'Fastest' },
    { zone: '🇨🇦 Canada (Provinces & Major Metros)', carrier: 'FedEx International Priority Air', dispatch: '< 24 Hours', time: '24 – 48 Hours', customs: 'DDP (GST/PST Prepaid)', tag: 'Express' },
    { zone: '🇪🇺 EU (Germany, France, Italy, Spain, etc.)', carrier: 'DHL Express Worldwide Aviation', dispatch: '< 24 Hours', time: '24 – 48 Hours', customs: 'Zero Customs (Frankfurt Vault)', tag: 'Pre-cleared' },
    { zone: '🇬🇧 United Kingdom (London & Regional)', carrier: 'DHL Express UK Air Priority', dispatch: '< 24 Hours', time: '24 – 48 Hours', customs: 'DDP (HMRC Duty Paid)', tag: 'Express' },
    { zone: '🇦🇪 UAE & GCC (Dubai, Abu Dhabi, Riyadh)', carrier: 'FedEx Priority / Emirates SkyCargo', dispatch: '< 24 Hours', time: '36 – 48 Hours', customs: 'DDP Dubai Free Zone Cleared', tag: 'Fastest' },
    { zone: '🇮🇳 India (Delhi, Mumbai, Bengaluru, etc.)', carrier: 'FedEx Air Freight / DHL Worldwide', dispatch: '< 24 Hours', time: '36 – 48 Hours', customs: 'Pre-Cleared DDP Express', tag: 'Insured' },
    { zone: '🇸🇬 Singapore, 🇭🇰 Hong Kong, 🇯🇵 Japan', carrier: 'DHL Aviation Asia Air', dispatch: '< 24 Hours', time: '36 – 48 Hours', customs: 'Pre-cleared Direct Delivery', tag: 'Direct' },
    { zone: '🇦🇺 Australia & New Zealand', carrier: 'FedEx International Priority Air', dispatch: '< 24 Hours', time: '48 – 72 Hours', customs: 'DDP Formal Broker Entry', tag: 'Insured' },
  ]

  const filteredSla = slaTableData.filter(row => 
    !searchFilter || row.zone.toLowerCase().includes(searchFilter.toLowerCase()) || row.carrier.toLowerCase().includes(searchFilter.toLowerCase())
  )

  return (
    <div className="w-full bg-[#f8fafc] text-slate-900 min-h-screen py-8 sm:py-12 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200/80 text-xs">
          <nav className="flex items-center gap-2 text-slate-500 font-medium">
            <Link to="/" className="hover:text-amber-600 transition flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Home</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">Help &amp; Escrow</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-bold">Shipping Coverage</span>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/help/track-order')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Track Active Order</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-yellow-400 text-slate-700 hover:text-black font-bold text-xs flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            >
              <span>Catalog</span>
            </button>
          </div>
        </div>

        {/* Premium Luxury Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6 sm:p-10 lg:p-12 border border-slate-800 shadow-xl mb-8">
          
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#D1A61B]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-4xl">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Priority Air Cargo &bull; Temperature-Controlled Aviation</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Global Air Freight &amp; <span className="text-[#D1A61B]">Insured Transit</span> Coverage
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm lg:text-base mt-3 leading-relaxed max-w-3xl">
              Every Apple device order is fulfilled directly from bonded authorized depository vaults via FedEx International Priority Air and DHL Express Aviation with 100% full-value crypto escrow transit underwriting.
            </p>

            {/* 4 Fast High-Impact Pill Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-2">
              <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800 backdrop-blur-sm">
                <span className="text-xl sm:text-2xl font-black text-white block">18 – 24h</span>
                <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">Fastest Express SLA</span>
              </div>
              <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800 backdrop-blur-sm">
                <span className="text-xl sm:text-2xl font-black text-emerald-400 block">100% DDP</span>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Zero Customs Surprises</span>
              </div>
              <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800 backdrop-blur-sm">
                <span className="text-xl sm:text-2xl font-black text-amber-300 block">Lloyd's Synd.</span>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Escrow Transit Bonded</span>
              </div>
              <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800 backdrop-blur-sm">
                <span className="text-xl sm:text-2xl font-black text-blue-400 block">Photo ID</span>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Direct Handover Only</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Interactive Transit Calculator & SLA Tool */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D1A61B] animate-ping" />
                    <h2 className="text-xl font-black text-slate-950">
                      Live Transit &amp; Route Telemetry Estimator
                    </h2>
                  </div>
                  <p className="text-slate-500 text-xs mt-1">
                    Select your destination zone below to inspect active cargo corridors, assigned carriers, and transit guarantees.
                  </p>
                </div>
                <span className="text-[11px] font-bold px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Air Hubs Operational 24/7</span>
                </span>
              </div>

              {/* Region Selector Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
                {[
                  { id: 'na', label: 'North America', flag: '🇺🇸 / 🇨🇦' },
                  { id: 'eu', label: 'Europe / UK', flag: '🇪🇺 / 🇬🇧' },
                  { id: 'gulf', label: 'Middle East', flag: '🇦🇪 / 🇸🇦' },
                  { id: 'in', label: 'India / S. Asia', flag: '🇮🇳 / 🇦🇪' },
                  { id: 'apac', label: 'Asia-Pacific', flag: '🇸🇬 / 🇯🇵' },
                  { id: 'latam', label: 'Latin America', flag: '🇧🇷 / 🇲🇽' },
                ].map((reg) => (
                  <button
                    key={reg.id}
                    type="button"
                    onClick={() => setSelectedRegion(reg.id)}
                    className={`p-3.5 rounded-2xl border text-left transition text-xs font-bold cursor-pointer relative overflow-hidden ${
                      selectedRegion === reg.id
                        ? 'border-yellow-400 bg-amber-50 text-slate-950 ring-2 ring-yellow-400/30 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-lg mb-1">{reg.flag}</div>
                    <div className="leading-tight text-[11px]">{reg.label}</div>
                    {selectedRegion === reg.id && (
                      <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#D1A61B]" />
                    )}
                  </button>
                ))}
              </div>

              {/* Service Level Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl mb-6 text-xs">
                <span className="font-bold text-slate-700">Flight Priority Level:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShippingMethod('express')}
                    className={`px-3.5 py-2 rounded-xl font-bold cursor-pointer transition flex items-center gap-1.5 ${
                      shippingMethod === 'express'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:text-black'
                    }`}
                  >
                    <span className="text-amber-400">⚡</span>
                    <span>Priority Air Express</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShippingMethod('standard')}
                    className={`px-3.5 py-2 rounded-xl font-bold cursor-pointer transition flex items-center gap-1.5 ${
                      shippingMethod === 'standard'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:text-black'
                    }`}
                  >
                    <span>✈️ Standard Cargo</span>
                  </button>
                </div>
              </div>

              {/* Active Route Telemetry Visual Box */}
              <div className="border border-slate-200 rounded-3xl p-6 bg-gradient-to-br from-slate-50 via-white to-amber-50/20 space-y-5">
                
                {/* Header with Live Flight Route */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Selected Air Corridor</span>
                    <h3 className="text-lg font-black text-slate-950 mt-0.5">{currentInfo.name}</h3>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estimated Flight Transit</span>
                    <span className="text-base sm:text-lg font-black text-amber-700">
                      {shippingMethod === 'express' ? currentInfo.transitExpress : currentInfo.transitStandard}
                    </span>
                  </div>
                </div>

                {/* Visual 3-Stage Flight Pathway */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Live Flight Pathway Telemetry</span>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center">1</span>
                      <div>
                        <p className="font-bold text-slate-900">Origin Vault Hub</p>
                        <p className="text-[11px] text-slate-500">{currentInfo.depot}</p>
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-1 text-amber-600 font-bold text-xs">
                      <span>✈️</span>
                      <span className="w-12 h-0.5 bg-amber-300" />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-400 text-black font-bold text-[10px] flex items-center justify-center">2</span>
                      <div>
                        <p className="font-bold text-slate-900">High-Altitude Air Corridor</p>
                        <p className="text-[11px] text-slate-500">{currentInfo.carrier}</p>
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-1 text-emerald-600 font-bold text-xs">
                      <span>📦</span>
                      <span className="w-12 h-0.5 bg-emerald-300" />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center">3</span>
                      <div>
                        <p className="font-bold text-slate-900">Direct In-Person Handover</p>
                        <p className="text-[11px] text-slate-500">Photo ID Signature Required</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4 Details Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <span className="text-slate-400 font-bold block mb-1">Primary Aviation Carrier</span>
                    <span className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      {currentInfo.carrier}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{currentInfo.carrierCode}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <span className="text-slate-400 font-bold block mb-1">Customs Clearance Protocol</span>
                    <span className="font-bold text-emerald-700 text-sm">{currentInfo.customs}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Zero import tax or duties asked at doorstep</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <span className="text-slate-400 font-bold block mb-1">Aviation Lithium Battery Standard</span>
                    <span className="font-bold text-slate-900 text-sm">{currentInfo.lithiumCompliance}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">State of charge certified &lt; 30% for aircraft cargo safety</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <span className="text-slate-400 font-bold block mb-1">Historical On-Time Carrier SLA</span>
                    <span className="font-black text-amber-700 text-base">{currentInfo.onTimeRate}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Direct courier flight tracking telemetry</span>
                  </div>
                </div>

                {/* Insurance Callout */}
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3 text-xs text-amber-950 font-medium">
                  <span className="text-xl shrink-0">🛡️</span>
                  <div className="leading-relaxed">
                    <strong className="font-extrabold text-amber-950">100% Escrow Transit Marine &amp; Cargo Guarantee:</strong> {currentInfo.insurance}. 
                    If carrier telemetry reports transit loss or package tampering, 100% of escrow funds are immediately unlocked for wallet refund or priority replacement swap.
                  </div>
                </div>
              </div>

            </div>

            {/* Carrier SLA Table with Live Search Filter */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-black text-slate-950">
                    International Air Freight Matrix &amp; Delivery SLA
                  </h2>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Physical hardware ships exclusively via premium aviation channels. Never ground transport or unmonitored drops.
                  </p>
                </div>

                <div className="sm:w-64">
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filter country or carrier..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-yellow-400"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold">
                      <th className="p-3.5">Destination Zone</th>
                      <th className="p-3.5">Carrier Partner</th>
                      <th className="p-3.5">Dispatch SLA</th>
                      <th className="p-3.5">Flight Transit</th>
                      <th className="p-3.5">Customs Entry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredSla.map((row, idx) => (
                      <tr key={idx} className="hover:bg-amber-50/40 transition">
                        <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                          <span>{row.zone}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold">{row.tag}</span>
                        </td>
                        <td className="p-3.5 text-slate-700 font-medium">{row.carrier}</td>
                        <td className="p-3.5 text-slate-500 font-mono">{row.dispatch}</td>
                        <td className="p-3.5 font-bold text-amber-700">{row.time}</td>
                        <td className="p-3.5 text-emerald-700 font-semibold">{row.customs}</td>
                      </tr>
                    ))}
                    {filteredSla.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-6 text-center text-slate-400">
                          No destination zone matching "{searchFilter}".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Packaging, Privacy & Tamper-Evident Protocols */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  Discreet Packaging &amp; Tamper-Evident Security Architecture
                </h2>
                <p className="text-slate-500 text-xs mt-0.5">
                  How high-value cryptocurrency hardware purchases are disguised and protected during air transit.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200/90 shadow-2xs hover:border-[#D1A61B] transition">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-[#D1A61B] font-black flex items-center justify-center text-sm mb-3.5 shadow-xs">
                    01
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm mb-1.5">
                    Unbranded Plain Outer Cartons
                  </h3>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Cartons carry zero logos, zero Apple branding, and zero cryptocurrency references on external waybills to prevent transit theft or courier tampering.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200/90 shadow-2xs hover:border-[#D1A61B] transition">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-[#D1A61B] font-black flex items-center justify-center text-sm mb-3.5 shadow-xs">
                    02
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm mb-1.5">
                    Holographic Security Tape
                  </h3>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Every package is sealed with serialized tamper-void holographic security tape. Any attempt to peel open leaves irreversible visible void patterns.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200/90 shadow-2xs hover:border-[#D1A61B] transition">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-[#D1A61B] font-black flex items-center justify-center text-sm mb-3.5 shadow-xs">
                    03
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm mb-1.5">
                    Direct Biometric / Photo ID Signature
                  </h3>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Couriers are legally prohibited from leaving packages at doorsteps or mailrooms. In-person signature with recipient verification is mandatory.
                  </p>
                </div>
              </div>

              {/* Lithium Flight Safety Box */}
              <div className="p-6 rounded-2xl bg-slate-950 text-white space-y-3 border border-slate-800 shadow-md">
                <div className="flex items-center gap-2 text-[#D1A61B] font-bold text-xs uppercase tracking-wider">
                  <span>✈️ IATA Lithium-Ion Compliance (UN3481)</span>
                </div>
                <h3 className="text-base font-extrabold text-white">
                  Aviation Safety Regulations for iPhone, iPad, MacBook &amp; Watch
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  All devices containing rechargeable lithium batteries are shipped strictly according to <strong>IATA Section II of Packing Instruction 967</strong>. Batteries are certified at state-of-charge below 30% for aircraft cargo bay safety, packed inside double-walled ESD flame-retardant outer chambers.
                </p>
              </div>
            </div>

            {/* Insurance & Claims Protocol */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <h2 className="text-lg font-black text-slate-950">
                100% Escrow Transit Marine &amp; Air Cargo Insurance
              </h2>
              <p className="text-slate-600 text-xs leading-relaxed">
                Traditional couriers offer limited liability of only $100 for lost parcels. On CryptoSpill, every single shipment is backed by our dedicated <strong>Escrow Transit Underwriting Fund</strong>:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                  <h4 className="font-bold text-emerald-950 mb-1">In-Transit Loss or Damage</h4>
                  <p className="text-emerald-800 leading-relaxed">
                    If carrier tracking indicates non-delivery past 7 business days or damaged packaging upon delivery scan, the smart contract automatically approves a 100% wallet refund or dispatches a replacement.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                  <h4 className="font-bold text-emerald-950 mb-1">Customs Impound / Border Delay</h4>
                  <p className="text-emerald-800 leading-relaxed">
                    Because shipments are processed as DDP (Delivery Duty Paid), customs duties are prepaid. In the rare event of a border delay over 96 hours, buyer may trigger full escrow cancelation.
                  </p>
                </div>
              </div>

              {/* Bottom CTA Bar */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs text-slate-500 font-medium">Have an active shipment? Inspect your live air waybill:</span>
                <button
                  type="button"
                  onClick={() => navigate('/help/track-order')}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-[#D1A61B] hover:text-black text-white font-bold text-xs transition cursor-pointer shadow-xs"
                >
                  Track My Consignment &bull; Live Telemetry
                </button>
              </div>
            </div>

          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4">
            <InfoSidebar currentSlug="shipping-coverage" />
          </div>

        </div>

      </div>
    </div>
  )
}
