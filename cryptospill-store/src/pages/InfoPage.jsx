import React, { useState } from 'react'
import { useRouter, Link } from '../router/RouterContext'

export default function InfoPage({ pageSlug }) {
  const { navigate } = useRouter()
  const [activeFaq, setActiveFaq] = useState(null)
  const [trackingInput, setTrackingInput] = useState('')
  const [trackingResult, setTrackingResult] = useState(null)

  // Merchant Application Form State
  const [merchantForm, setMerchantForm] = useState({
    businessName: '',
    email: '',
    telegram: '',
    inventoryType: 'hardware',
    monthlyVolume: '$50,000 - $100,000',
    notes: '',
  })
  const [merchantSubmitted, setMerchantSubmitted] = useState(false)

  const handleTrackSubmit = (e) => {
    e.preventDefault()
    if (trackingInput.trim()) {
      setTrackingResult({
        orderId: trackingInput.toUpperCase(),
        carrier: 'FedEx International Priority Air',
        trackingNumber: 'FX-' + Math.floor(10000000 + Math.random() * 90000000),
        status: 'In Transit — Customs Cleared',
        origin: 'San Francisco, CA (Authorized Depot)',
        destination: 'Delivered via Escrow Protection',
        estimatedDelivery: 'Within 48 Hours',
        currentStep: 3,
      })
    }
  }

  const handleMerchantSubmit = (e) => {
    e.preventDefault()
    setMerchantSubmitted(true)
    setTimeout(() => {
      setMerchantSubmitted(false)
      setMerchantForm({
        businessName: '',
        email: '',
        telegram: '',
        inventoryType: 'hardware',
        monthlyVolume: '$50,000 - $100,000',
        notes: '',
      })
    }, 4000)
  }

  // Metadata per slug
  const getPageMeta = () => {
    switch (pageSlug) {
      case 'track-order':
        return {
          section: 'Help & Escrow',
          badge: 'Live Air Logistics',
          title: 'Track Active Order & Air Transit',
          subtitle: 'Real-time smart contract milestone tracking with FedEx & DHL air cargo integration.',
        }
      case 'escrow-guide':
        return {
          section: 'Help & Escrow',
          badge: 'Smart Contract Vault',
          title: 'How Escrow Protects You',
          subtitle: 'Zero buyer fees. Your crypto payment is locked in multi-sig vault until you inspect the device.',
        }
      case 'replacement-policy':
        return {
          section: 'Help & Escrow',
          badge: 'Hassle-Free Returns',
          title: '14-Day Replacement Policy',
          subtitle: 'Immediate advance replacement coverage on sealed Apple hardware and digital products.',
        }
      case 'shipping-coverage':
        return {
          section: 'Help & Escrow',
          badge: 'Worldwide Logistics',
          title: 'Shipping Coverage & Air Freight',
          subtitle: 'Priority air delivery via FedEx & DHL with 100% full-value crypto insurance.',
        }
      case 'warranty':
        return {
          section: 'Help & Escrow',
          badge: 'Official Serial Check',
          title: 'Warranty & Serial Verification',
          subtitle: 'Every hardware device comes with genuine Apple 1-Year Limited Worldwide Warranty.',
        }
      case 'faq':
        return {
          section: 'Help & Escrow',
          badge: 'Shopper Support',
          title: 'Frequently Asked Questions',
          subtitle: 'Answers to top questions regarding crypto checkout, delivery times, and escrow releases.',
        }
      case 'become-merchant':
        return {
          section: 'Merchant & Trust',
          badge: 'Partner Program',
          title: 'Become an Authorized Merchant',
          subtitle: 'Sell verified Apple inventory to global crypto buyers with instant escrow settlement.',
        }
      case 'standards':
        return {
          section: 'Merchant & Trust',
          badge: 'Quality Control',
          title: 'Merchant Standards & SLA',
          subtitle: 'Strict seller criteria: genuine factory-sealed stock, 24-hour dispatch, and serial logging.',
        }
      case 'payouts':
        return {
          section: 'Merchant & Trust',
          badge: 'Instant Liquidity',
          title: 'Instant Multi-Coin Payouts',
          subtitle: 'Automated settlement in USDT, USDC, BTC, ETH, or fiat bank wires within seconds.',
        }
      case 'escrow-rules':
        return {
          section: 'Merchant & Trust',
          badge: 'Protocol Rules',
          title: 'Escrow Rules & Multi-Sig Contract',
          subtitle: 'Transparent on-chain rules governing buyer protection, merchant releases, and dispute arbitration.',
        }
      case 'privacy':
        return {
          section: 'Legal & Compliance',
          badge: 'Web3 Privacy',
          title: 'Privacy Policy',
          subtitle: 'We respect decentralized sovereignty. No personal tracking, no marketing cookies, no KYC selling.',
        }
      case 'terms':
        return {
          section: 'Legal & Compliance',
          badge: 'User Agreement',
          title: 'Terms of Service & Sale',
          subtitle: 'Official decentralized marketplace terms, escrow protocols, and price-lock guarantees.',
        }
      default:
        return {
          section: 'Help Desk',
          badge: 'Knowledge Base',
          title: 'CryptoSpill Knowledge Center',
          subtitle: 'Decentralized marketplace guides, buyer protection, and merchant policies.',
        }
    }
  }

  const meta = getPageMeta()

  // Sidebar Links
  const helpLinks = [
    { slug: 'track-order', label: 'Track Active Order' },
    { slug: 'escrow-guide', label: 'How Escrow Protects You' },
    { slug: 'replacement-policy', label: '14-Day Replacement Policy' },
    { slug: 'shipping-coverage', label: 'Shipping Coverage' },
    { slug: 'warranty', label: 'Warranty Verification' },
    { slug: 'faq', label: 'Frequently Asked Questions' },
  ]

  const merchantLinks = [
    { slug: 'become-merchant', label: 'Become a Merchant' },
    { slug: 'standards', label: 'Merchant Standards' },
    { slug: 'payouts', label: 'Instant Payouts' },
    { slug: 'escrow-rules', label: 'Escrow Rules & Multi-Sig' },
    { slug: 'privacy', label: 'Privacy Policy' },
    { slug: 'terms', label: 'Terms of Service' },
  ]

  // Render Page Content
  const renderContent = () => {
    switch (pageSlug) {

      // 1. TRACK ACTIVE ORDER
      case 'track-order':
        return (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs sm:text-sm leading-relaxed">
              <strong className="font-bold">Real-Time Escrow Tracking:</strong> Every order on CryptoSpill is secured by smart contract escrow. Enter your Order ID (e.g. CS-89421) or connected wallet address to inspect the live status.
            </div>

            <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                placeholder="Enter Order ID (e.g. CS-89421) or Wallet Hash..."
                required
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 shadow-xs"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-yellow-400 hover:text-black text-white font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer shrink-0"
              >
                Track Shipment
              </button>
            </form>

            {/* Live Tracking Result Card */}
            {trackingResult && (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded bg-yellow-400 text-black">
                      {trackingResult.carrier}
                    </span>
                    <h4 className="text-lg font-bold text-slate-900 mt-1.5">
                      Tracking: {trackingResult.trackingNumber}
                    </h4>
                    <p className="text-xs text-slate-500">Order: {trackingResult.orderId}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-slate-500 font-medium">Status:</p>
                    <p className="text-sm font-bold text-emerald-600 flex items-center gap-1 sm:justify-end">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {trackingResult.status}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Estimated: {trackingResult.estimatedDelivery}</p>
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="space-y-4">
                  <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Shipment Milestones:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                      <p className="font-bold">1. Escrow Locked</p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">Smart contract deposit confirmed</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                      <p className="font-bold">2. Serial Recorded</p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">Official Apple serial bound</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 font-bold">
                      <p>3. In Air Transit</p>
                      <p className="text-[11px] font-normal text-amber-800 mt-0.5">FedEx Priority flight underway</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500">
                      <p className="font-semibold">4. Delivery &amp; Inspection</p>
                      <p className="text-[11px] mt-0.5">48-Hr buyer escrow release</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!trackingResult && (
              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-500 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto text-xl">
                  📦
                </div>
                <h4 className="text-sm font-bold text-slate-800">Sample Active Tracking Lookup</h4>
                <p className="text-xs max-w-md mx-auto">
                  Type any order number (e.g. <span className="font-mono font-bold text-slate-900">CS-98214</span>) above to simulate live parcel checkpoint telemetry.
                </p>
              </div>
            )}
          </div>
        )

      // 2. HOW ESCROW PROTECTS YOU
      case 'escrow-guide':
        return (
          <div className="space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
              <strong className="font-bold text-slate-900">0% Buyer Escrow Guarantee:</strong> Shoppers pay exactly $0 in escrow fees. When you order an iPhone, Mac, or digital code on CryptoSpill, 100% of your funds remain in an audited cryptographic multi-sig vault.
            </div>

            <h3 className="text-base font-bold text-slate-900 pt-2">The 4-Step Escrow Lifecycle</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="w-7 h-7 rounded-lg bg-yellow-400 text-black font-black flex items-center justify-center text-xs mb-2">1</span>
                <h4 className="font-bold text-slate-900 mb-1">Buyer Funds Escrow</h4>
                <p className="text-xs text-slate-500">
                  Buyer selects item and deposits ETH, BTC, or USDT. Tokens are held inside the autonomous smart contract lock.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="w-7 h-7 rounded-lg bg-yellow-400 text-black font-black flex items-center justify-center text-xs mb-2">2</span>
                <h4 className="font-bold text-slate-900 mb-1">Merchant Dispatches Goods</h4>
                <p className="text-xs text-slate-500">
                  Merchant uploads air waybill tracking and records the physical Apple serial number to the order record within 24 hours.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="w-7 h-7 rounded-lg bg-yellow-400 text-black font-black flex items-center justify-center text-xs mb-2">3</span>
                <h4 className="font-bold text-slate-900 mb-1">Inspection Window</h4>
                <p className="text-xs text-slate-500">
                  Buyer receives the factory-sealed device and has 48 hours to check coverage on Apple.com before funds can be released.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="w-7 h-7 rounded-lg bg-yellow-400 text-black font-black flex items-center justify-center text-xs mb-2">4</span>
                <h4 className="font-bold text-slate-900 mb-1">Instant Multi-Sig Release</h4>
                <p className="text-xs text-slate-500">
                  Buyer signs release transaction &rarr; merchant receives instant crypto payout. If any issue arises, 24/7 human arbitrators intervene.
                </p>
              </div>
            </div>
          </div>
        )

      // 3. 14-DAY REPLACEMENT POLICY
      case 'replacement-policy':
        return (
          <div className="space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              Every physical Apple hardware device ordered on CryptoSpill includes an unconditional <strong className="text-slate-900">14-Day Advance Replacement Guarantee</strong>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-1">DOA Advance Swap</h4>
                <p className="text-slate-500">If your sealed device arrives damaged or non-functional, a replacement unit is dispatched within 24 hours.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-1">Prepaid Return Label</h4>
                <p className="text-slate-500">FedEx Express return waybill is generated automatically at zero expense to the buyer.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-1">Full Crypto Refund</h4>
                <p className="text-slate-500">If replacement stock is unavailable, 100% of your escrowed crypto deposit is refunded back to your wallet.</p>
              </div>
            </div>
          </div>
        )

      // 4. SHIPPING COVERAGE
      case 'shipping-coverage':
        return (
          <div className="space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              We partner exclusively with <strong className="text-slate-900">FedEx International Priority</strong> and <strong className="text-slate-900">DHL Express</strong>. Every consignment is insured for 100% replacement value.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-200 rounded-xl overflow-hidden text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold">
                    <th className="p-3 border-b border-slate-200">Region</th>
                    <th className="p-3 border-b border-slate-200">Carrier</th>
                    <th className="p-3 border-b border-slate-200">Transit Duration</th>
                    <th className="p-3 border-b border-slate-200">Insurance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">North America</td>
                    <td className="p-3">FedEx Priority Air</td>
                    <td className="p-3 font-bold text-amber-700">24 &ndash; 48 Hours</td>
                    <td className="p-3 text-emerald-600 font-bold">100% Included</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">European Union &amp; UK</td>
                    <td className="p-3">DHL Express World</td>
                    <td className="p-3 font-bold text-amber-700">24 &ndash; 48 Hours</td>
                    <td className="p-3 text-emerald-600 font-bold">100% Included</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">Middle East &amp; GCC</td>
                    <td className="p-3">FedEx Air Priority</td>
                    <td className="p-3 font-bold text-amber-700">48 &ndash; 72 Hours</td>
                    <td className="p-3 text-emerald-600 font-bold">100% Included</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">Asia-Pacific</td>
                    <td className="p-3">DHL Express Aviation</td>
                    <td className="p-3 font-bold text-amber-700">48 &ndash; 72 Hours</td>
                    <td className="p-3 text-emerald-600 font-bold">100% Included</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )

      // 5. WARRANTY VERIFICATION
      case 'warranty':
        return (
          <div className="space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              All hardware units sold on CryptoSpill are original, unopened, factory-sealed devices accompanied by Apple&rsquo;s 1-Year Limited Worldwide Warranty.
            </p>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900">How to Verify Your Apple Serial Number:</h4>
              <ol className="list-decimal list-inside space-y-2 text-xs">
                <li>Locate the 10-12 character serial number on the back of the sealed retail box or under iPhone Settings &rarr; General &rarr; About.</li>
                <li>Visit the official Apple verification portal: <a href="https://checkcoverage.apple.com" target="_blank" rel="noopener noreferrer" className="text-amber-600 font-bold hover:underline">checkcoverage.apple.com</a></li>
                <li>Enter the serial number and complete the Apple captcha.</li>
                <li>Review the active warranty status, telephone technical support date, and AppleCare eligibility.</li>
              </ol>
            </div>
          </div>
        )

      // 6. FAQ
      case 'faq': {
        const faqs = [
          { q: 'How does CryptoSpill guarantee authenticity?', a: 'All merchants are vetted authorized distributors. Serial numbers are logged prior to dispatch, and funds remain locked in escrow until the customer inspects the sealed device.' },
          { q: 'Which cryptocurrencies are supported?', a: 'We accept Bitcoin (BTC), Ethereum (ETH), USDT, USDC, Solana (SOL), and native SPILL tokens with zero conversion markup.' },
          { q: 'What happens if the package does not arrive?', a: 'Every parcel is insured. If tracking indicates non-delivery or lost cargo, the smart contract escrow automatically refunds 100% of your deposit.' },
          { q: 'Are Apple Gift Card codes delivered instantly?', a: 'Yes! Gift card codes and digital licenses are dispathed instantly to your registered email and on-screen receipt upon blockchain transaction confirmation.' },
        ]

        return (
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full p-4 sm:p-5 text-left font-bold text-xs sm:text-sm text-slate-900 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer"
                >
                  <span>{f.q}</span>
                  <span className="text-amber-600 text-lg">{activeFaq === i ? '−' : '+'}</span>
                </button>
                {activeFaq === i && (
                  <div className="p-4 sm:p-5 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      }

      // 7. BECOME A MERCHANT
      case 'become-merchant':
        return (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm leading-relaxed">
              <strong className="font-bold text-slate-900">Verified Apple Merchant Portal:</strong> Expand your inventory sales to global crypto high-net-worth buyers with automated multi-sig escrow settlements.
            </div>

            {merchantSubmitted ? (
              <div className="p-8 rounded-3xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-fadeIn">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-2xl mx-auto">
                  ✓
                </div>
                <h4 className="text-base font-bold text-emerald-950">Application Submitted Successfully!</h4>
                <p className="text-xs text-emerald-800 max-w-md mx-auto">
                  Our merchant verification desk will reach out via your Telegram / Email within 24 business hours to complete API key activation.
                </p>
              </div>
            ) : (
              <form onSubmit={handleMerchantSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1">Company / Store Name *</label>
                    <input
                      type="text"
                      required
                      value={merchantForm.businessName}
                      onChange={(e) => setMerchantForm({ ...merchantForm, businessName: e.target.value })}
                      placeholder="e.g. Apex Hardware Labs LLC"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1">Business Email *</label>
                    <input
                      type="email"
                      required
                      value={merchantForm.email}
                      onChange={(e) => setMerchantForm({ ...merchantForm, email: e.target.value })}
                      placeholder="dealer@company.com"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 shadow-2xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1">Telegram Handle *</label>
                    <input
                      type="text"
                      required
                      value={merchantForm.telegram}
                      onChange={(e) => setMerchantForm({ ...merchantForm, telegram: e.target.value })}
                      placeholder="@yourmerchantdesk"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1">Estimated Monthly Volume</label>
                    <select
                      value={merchantForm.monthlyVolume}
                      onChange={(e) => setMerchantForm({ ...merchantForm, monthlyVolume: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 shadow-2xs"
                    >
                      <option>$10,000 - $50,000</option>
                      <option>$50,000 - $100,000</option>
                      <option>$100,000 - $500,000</option>
                      <option>$500,000+</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">Stock Category &amp; Warehousing Details</label>
                  <textarea
                    rows={3}
                    value={merchantForm.notes}
                    onChange={(e) => setMerchantForm({ ...merchantForm, notes: e.target.value })}
                    placeholder="Describe your current Apple stock, warehouse locations, and proof of distributor authorization..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 shadow-2xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-yellow-400 hover:text-black text-white font-bold text-xs sm:text-sm transition-all shadow-sm cursor-pointer"
                >
                  Submit Merchant Application &rarr;
                </button>
              </form>
            )}
          </div>
        )

      // 8. MERCHANT STANDARDS
      case 'standards':
        return (
          <div className="space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <h4 className="font-bold text-slate-900">CryptoSpill Merchant Service Level Agreement (SLA)</h4>
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h5 className="font-bold text-slate-900">1. Sealed Stock Only</h5>
                <p className="text-slate-500 mt-0.5">Refurbished or opened hardware is strictly prohibited. Only genuine factory-sealed Apple stock with active serial numbers may be fulfilled.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h5 className="font-bold text-slate-900">2. 24-Hour Air Dispatch</h5>
                <p className="text-slate-500 mt-0.5">Orders must receive scanned FedEx / DHL air manifests within 24 hours of escrow smart contract funding.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <h5 className="font-bold text-slate-900">3. Serial Number Pre-Registration</h5>
                <p className="text-slate-500 mt-0.5">Merchants must upload the box serial photo to the encrypted escrow portal prior to handover to courier.</p>
              </div>
            </div>
          </div>
        )

      // 9. INSTANT PAYOUTS
      case 'payouts':
        return (
          <div className="space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              Merchants benefit from immediate liquidity. The moment a customer confirms package receipt or the 48-hour inspection timer elapses, escrow releases funds directly.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-black text-amber-700 block mb-1">STABLECOIN SETTLEMENT</span>
                <p className="text-slate-600">USDT and USDC settlements occur in &lt; 30 seconds on Ethereum, Polygon, or Arbitrum with zero holding periods.</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-black text-amber-700 block mb-1">NATIVE CRYPTO OR FIAT</span>
                <p className="text-slate-600">Optionally receive BTC, ETH, SOL, or automated SEPA / SWIFT bank transfers with verified accounting invoices.</p>
              </div>
            </div>
          </div>
        )

      // 10. ESCROW RULES & MULTI-SIG
      case 'escrow-rules':
        return (
          <div className="space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <h4 className="font-bold text-slate-900">Technical Multi-Signature Arbitration Protocol</h4>
            <p>
              CryptoSpill employs a <strong className="text-slate-900">2-of-3 Multi-Signature Smart Contract</strong> on Ethereum and EVM-compatible chains:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-700">
              <li><strong className="text-slate-900">Key 1 (Buyer):</strong> Held in user&rsquo;s Web3 wallet to confirm successful delivery and release funds.</li>
              <li><strong className="text-slate-900">Key 2 (Merchant):</strong> Held by authorized dealer to approve refunds if stock is unavailable.</li>
              <li><strong className="text-slate-900">Key 3 (Marketplace Arbitrator):</strong> Only invoked if an unresolved dispute arises (carrier loss, damaged goods).</li>
            </ul>
          </div>
        )

      // 11. PRIVACY
      case 'privacy':
        return (
          <div className="space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-2">
              <h4 className="font-bold text-yellow-400">Our Web3 Privacy Commitment</h4>
              <p className="text-xs text-slate-300">
                CryptoSpill does not sell, broker, or monetize shopper data. Physical shipping addresses are encrypted using GPG keys and purged 14 days post-delivery.
              </p>
            </div>
            <p>
              No tracking cookies or marketing ad networks are loaded on our marketplace store. All blockchain interactions are decentralized and cryptographically signed.
            </p>
          </div>
        )

      // 12. TERMS OF SERVICE
      case 'terms':
        return (
          <div className="space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <p>
              By accessing the CryptoSpill Decentralized Marketplace, buyers and sellers agree to smart contract escrow execution, 30-minute crypto price lock intervals, and carrier tracking milestones.
            </p>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
              <p><strong className="text-slate-900">1. Price Lock:</strong> Crypto rates are locked for 30 minutes during checkout to protect against market volatility.</p>
              <p><strong className="text-slate-900">2. Authenticity:</strong> All hardware devices must carry original verifiable Apple serial numbers.</p>
              <p><strong className="text-slate-900">3. Disputes:</strong> In the event of transit discrepancy, official FedEx / DHL courier inspection reports govern resolution.</p>
            </div>
          </div>
        )

      default:
        return (
          <div className="text-xs text-slate-500">
            Select a topic from the directory to review detailed documentation.
          </div>
        )
    }
  }

  return (
    <div className="w-full bg-[#f8fafc] text-slate-900 min-h-screen py-8 sm:py-12">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb Navigation & Top Action */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200/80 text-xs">
          <nav className="flex items-center gap-2 text-slate-500 font-medium">
            <Link to="/" className="hover:text-amber-600 transition flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Home</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">{meta.section}</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-bold truncate max-w-[200px] sm:max-w-none">{meta.title}</span>
          </nav>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-yellow-400 text-slate-700 hover:text-black font-bold text-xs flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Store Catalog</span>
          </button>
        </div>

        {/* Page Hero Header Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm mb-8">
          <div className="max-w-3xl">
            <span
              className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-md shadow-xs border border-yellow-300 inline-block mb-3"
              style={{ backgroundColor: '#facc15', color: '#000000' }}
            >
              {meta.badge}
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-950 tracking-tight leading-tight mb-2">
              {meta.title}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
              {meta.subtitle}
            </p>
          </div>
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Main Content Area (8 Cols) */}
          <div className="lg:col-span-8">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm">
              {renderContent()}
            </div>
          </div>

          {/* Right Sidebar Directory & Contacts (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">

            {/* Quick Navigation Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4 pb-2 border-b border-slate-100">
                Help &amp; Escrow Directory
              </h3>
              <ul className="space-y-1 text-xs">
                {helpLinks.map((link) => {
                  const isActive = pageSlug === link.slug
                  return (
                    <li key={link.slug}>
                      <button
                        type="button"
                        onClick={() => navigate(`/help/${link.slug}`)}
                        className={`w-full text-left px-3 py-2 rounded-xl font-bold transition flex items-center justify-between cursor-pointer ${isActive
                            ? 'bg-yellow-400 text-black shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-amber-700'
                          }`}
                      >
                        <span>{link.label}</span>
                        {isActive && <span>&rarr;</span>}
                      </button>
                    </li>
                  )
                })}
              </ul>

              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mt-6 mb-4 pb-2 border-b border-slate-100">
                Merchant &amp; Trust Directory
              </h3>
              <ul className="space-y-1 text-xs">
                {merchantLinks.map((link) => {
                  const isActive = pageSlug === link.slug
                  return (
                    <li key={link.slug}>
                      <button
                        type="button"
                        onClick={() => navigate(link.slug === 'privacy' || link.slug === 'terms' ? `/legal/${link.slug}` : `/merchant/${link.slug}`)}
                        className={`w-full text-left px-3 py-2 rounded-xl font-bold transition flex items-center justify-between cursor-pointer ${isActive
                            ? 'bg-yellow-400 text-black shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-amber-700'
                          }`}
                      >
                        <span>{link.label}</span>
                        {isActive && <span>&rarr;</span>}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Support Desk Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold text-lg">
                💬
              </div>
              <h4 className="text-sm font-bold text-slate-900">Need Dedicated Assistance?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Our decentralized shopper desk and smart contract escrow arbitrators are on duty 24/7.
              </p>
              <div className="pt-2 text-xs space-y-1.5 font-medium">
                <p>
                  <span className="text-slate-400">Support:</span>{' '}
                  <a href="mailto:support@cryptospill.store" className="text-slate-900 font-bold hover:text-amber-600 transition">
                    support@cryptospill.store
                  </a>
                </p>

              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-yellow-400 hover:text-black text-white font-bold text-xs transition shadow-2xs cursor-pointer"
                >
                  Browse Store Catalog &rarr;
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
