import React, { useState, useMemo } from 'react'
import { useRouter, Link } from '../router/RouterContext'
import InfoSidebar from '../components/marketplace/InfoSidebar'

export default function FaqPage() {
  const { navigate } = useRouter()
  const [activeFaq, setActiveFaq] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [helpfulFeedback, setHelpfulFeedback] = useState({})
  const [quickOrderId, setQuickOrderId] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const [allExpanded, setAllExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState('faq') // 'faq' | 'escrowFlow' | 'disputeGuide'

  const faqs = [
    // Escrow & Crypto Payments
    {
      id: 1,
      cat: 'crypto',
      badge: 'Escrow Guarantee',
      q: 'How does CryptoSpill guarantee authenticity on Apple hardware?',
      a: 'All merchants on CryptoSpill are verified authorized distributors and audited volume sellers. Every device shipped is 100% factory-sealed with authentic verifiable serial numbers registered in Apple GSX. Furthermore, your payment remains locked inside the decentralized 2-of-3 smart contract escrow until you unbox, inspect, and verify coverage on Apple.com.',
      keyTakeaway: 'Funds never go to the merchant until you receive the package and approve the 48-hour inspection.',
      actionLink: { label: 'Inspect Escrow Vaults', path: '/escrow-status' }
    },
    {
      id: 2,
      cat: 'crypto',
      badge: 'Payment Rails',
      q: 'Which cryptocurrencies and networks are supported at checkout?',
      a: 'We accept Bitcoin (BTC), Ethereum (ETH), USDT (ERC-20, TRC-20, Arbitrum, Polygon, BEP-20), USDC, Solana (SOL), and native SPILL/AO1 tokens. Shoppers can connect MetaMask, Phantom, Coinbase Wallet, Trust Wallet, WalletConnect, or transfer directly to unique on-chain smart contract deposit addresses.',
      keyTakeaway: 'Zero transaction friction across all major Layer-1 and Layer-2 blockchains.',
      actionLink: { label: 'View Supported Rails', path: '/help/escrow-rules' }
    },
    {
      id: 3,
      cat: 'crypto',
      badge: 'Volatility Protection',
      q: 'How does the 30-Minute Crypto Price Lock protect me against market volatility?',
      a: 'Cryptocurrency markets fluctuate constantly. When you initiate checkout, our decentralized oracle feeds (Chainlink & Pyth Network) lock the exact crypto-to-USD exchange rate for 30 minutes. The crypto amount quoted at review is the exact amount deducted, protecting you against sudden market drops.',
      keyTakeaway: 'Guaranteed rate for 30 minutes. No slippage surprises.',
      actionLink: { label: 'Read Oracle Policy', path: '/help/escrow-rules' }
    },
    {
      id: 4,
      cat: 'crypto',
      badge: 'Zero Hidden Fees',
      q: 'Are there any hidden escrow fees, gas surcharges, or withdrawal costs?',
      a: 'Shoppers pay 0% escrow fee. The price you see on the product page in USD and crypto is the exact amount deducted. Platform underwriting and smart contract fees are fully subsidized or paid by merchants upon successful order settlement.',
      keyTakeaway: '0% buyer escrow fees. Transparent flat pricing.',
      actionLink: null
    },
    {
      id: 5,
      cat: 'crypto',
      badge: 'Multi-Sig Consensus',
      q: 'How do I release escrow funds once I receive my device?',
      a: 'Once your parcel arrives via FedEx or DHL, you have a 48-hour physical inspection window. Simply navigate to your "Escrow Multi-Sig Status" or "Track Order" page, verify the hardware serial against Apple GSX, and click "Sign & Release Escrow". If no dispute is filed within 48 hours, consensus is executed on-chain.',
      keyTakeaway: 'You retain full cryptographic control over when your money leaves escrow.',
      actionLink: { label: 'Track Active Order', path: '/help/track-order' }
    },
    
    // Shipping & Delivery
    {
      id: 6,
      cat: 'shipping',
      badge: 'Transit Insurance',
      q: 'What happens if my parcel is lost or damaged during air transit?',
      a: 'Every physical shipment via FedEx International Priority or DHL Express Aviation is 100% replacement-value insured under our bonded cargo underwriting syndicate. If carrier telemetry flags damage or loss, the smart contract automatically authorizes an immediate 100% wallet refund or dispatches a brand-new advance replacement unit.',
      keyTakeaway: '100% transit insurance. Zero risk of losing funds in mail.',
      actionLink: { label: 'View Coverage SLAs', path: '/help/shipping-coverage' }
    },
    {
      id: 7,
      cat: 'shipping',
      badge: 'Customs & Duties',
      q: 'Do I have to pay customs duties, VAT, or import taxes upon delivery?',
      a: 'No! All shipments to the USA, Canada, European Union, United Kingdom, UAE, and Singapore are dispatched strictly under DDP (Delivered Duty Paid) terms. All import duties, VAT, and broker handling fees are prepaid by the depot. The delivery courier will never demand cash on delivery.',
      keyTakeaway: 'DDP Delivered Duty Paid. Zero doorstep surprises.',
      actionLink: { label: 'Inspect Global Hubs', path: '/help/shipping-coverage' }
    },
    {
      id: 8,
      cat: 'shipping',
      badge: 'Packaging Privacy',
      q: 'Are parcels shipped discreetly for personal security?',
      a: 'Yes. All hardware is packed in heavy-duty unbranded cartons with tamper-evident serialized holographic void tape. The external shipping manifest carries generic electronic terminology and contains zero references to cryptocurrency, Bitcoin, or Apple logos to prevent courier theft.',
      keyTakeaway: 'Completely unbranded outer boxes with tamper-void holographic seals.',
      actionLink: null
    },
    {
      id: 9,
      cat: 'shipping',
      badge: 'Aviation Compliance',
      q: 'Are lithium-ion batteries safe to ship by international air freight?',
      a: 'All Apple devices containing lithium-ion batteries are certified under IATA Section II of Packing Instruction 967 (UN3481). Devices are state-of-charge compliant (< 30% battery capacity) and packed in ESD anti-static fire-retardant enclosures safe for commercial passenger and cargo air transport.',
      keyTakeaway: 'Certified IATA UN3481 flight-safe aviation packaging.',
      actionLink: { label: 'Aviation Safety Docs', path: '/help/shipping-coverage' }
    },

    // Apple Hardware & Warranty
    {
      id: 10,
      cat: 'hardware',
      badge: 'Official Warranty',
      q: 'Is the 1-Year Apple Warranty valid worldwide at any Apple Store?',
      a: 'Yes! Apple hardware includes an official 1-Year Limited Worldwide Warranty registered in Apple GSX (Global Service Exchange). You can bring your device to any official Apple Store (Genius Bar) or Apple Authorized Service Provider (AASP) worldwide without needing a printed paper receipt.',
      keyTakeaway: 'Universal Apple Store Genius Bar warranty honored worldwide.',
      actionLink: { label: 'Warranty Policy Guide', path: '/help/warranty' }
    },
    {
      id: 11,
      cat: 'hardware',
      badge: 'AppleCare+ Eligible',
      q: 'Can I purchase AppleCare+ for my device?',
      a: 'Yes. Because all inventory consists of authentic, unactivated sealed stock, you can purchase AppleCare+ directly through your device (under Settings > General > About > AppleCare+ Coverage Available) or via apple.com within 60 days of initial power-on setup.',
      keyTakeaway: '100% eligible for official AppleCare+ extended warranty.',
      actionLink: { label: 'AppleCare+ Details', path: '/help/warranty' }
    },
    {
      id: 12,
      cat: 'hardware',
      badge: '14-Day Replacement',
      q: 'How does the 14-Day Advance Replacement guarantee work?',
      a: 'If your hardware arrives defective (DOA), screen glitched, or cosmetically damaged in transit, you can initiate an RMA within 14 days. We provide a prepaid FedEx Express return waybill, and a brand-new sealed unit is dispatched within 24 hours of tracking scan.',
      keyTakeaway: '14-Day advance replacement guarantee with prepaid express air waybill.',
      actionLink: { label: 'Replacement Policy', path: '/help/replacement-policy' }
    },
    {
      id: 13,
      cat: 'hardware',
      badge: 'Instant Digital Drops',
      q: 'How fast are Apple Gift Cards and digital license keys delivered?',
      a: 'Digital products (such as $500 Apple Gift Cards, Apple One Family Passes, and Final Cut Pro licenses) are dispatched automatically within 60 seconds of blockchain transaction confirmation to your registered email address and on-screen receipt.',
      keyTakeaway: 'Instant 60-second automated digital delivery.',
      actionLink: null
    },

    // Merchant & Trust
    {
      id: 14,
      cat: 'merchant',
      badge: 'Security Architecture',
      q: 'What is the 2-of-3 Multi-Signature escrow architecture?',
      a: 'Every transaction creates an isolated cryptographic smart contract vault with 3 keys: Buyer Key, Merchant Key, and CryptoSpill Arbiter Key. To move funds, 2 signatures are mandatory. When satisfied, Buyer + Merchant sign and funds release. The Arbiter only signs if a dispute is raised with courier telemetry proof.',
      keyTakeaway: 'Neither CryptoSpill nor the Merchant can ever take your cryptocurrency unilaterally.',
      actionLink: { label: 'Escrow Deep Dive', path: '/help/escrow-rules' }
    },
    {
      id: 15,
      cat: 'merchant',
      badge: 'Merchant Audits',
      q: 'What standards must merchants meet to sell Apple hardware on the marketplace?',
      a: 'Merchants must submit audited wholesale inventory manifests, lock a security deposit bond in multi-sig escrow, maintain an air dispatch SLA under 24 hours, and maintain a dispute rate strictly below 0.3%. Counterfeit attempts result in immediate bond confiscation.',
      keyTakeaway: 'Strict enterprise vetting and on-chain security collateral.',
      actionLink: null
    },
    {
      id: 16,
      cat: 'merchant',
      badge: 'Privacy Protocol',
      q: 'How does CryptoSpill handle buyer privacy and shipping addresses?',
      a: 'Customer delivery addresses are stored in temporary RAM encrypted with merchant public PGP keys. Upon carrier delivery confirmation and 14-day warranty completion, delivery details are cryptographically shredded and expunged from all logs.',
      keyTakeaway: 'Ephemeral RAM encryption with automatic cryptographic shredding.',
      actionLink: null
    },
  ]

  // Filtered FAQs based on category and search query
  const filteredFaqs = useMemo(() => {
    return faqs.filter((item) => {
      const matchesCat = selectedCategory === 'all' || item.cat === selectedCategory
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch = !query || 
        item.q.toLowerCase().includes(query) || 
        item.a.toLowerCase().includes(query) || 
        item.badge.toLowerCase().includes(query)
      return matchesCat && matchesSearch
    })
  }, [faqs, selectedCategory, searchQuery])

  const popularTags = [
    '30-Min Price Lock',
    'Customs DDP',
    'AppleCare+',
    'Multi-Sig Escrow',
    'FedEx Priority Air',
    '1-Year Warranty'
  ]

  const handleFeedback = (id, type) => {
    setHelpfulFeedback(prev => ({ ...prev, [id]: type }))
  }

  const handleCopyLink = (id, e) => {
    e.stopPropagation()
    const url = `${window.location.origin}/help/faq#faq-${id}`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
    }
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  const handleToggleExpandAll = () => {
    if (allExpanded) {
      setActiveFaq(null)
      setAllExpanded(false)
    } else {
      setActiveFaq('ALL')
      setAllExpanded(true)
    }
  }

  const handleQuickTrack = (e) => {
    e.preventDefault()
    if (!quickOrderId.trim()) return
    navigate(`/help/track-order?orderId=${encodeURIComponent(quickOrderId.trim())}`)
  }

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
            <span className="text-slate-900 font-bold">Frequently Asked Questions</span>
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
              <span>Store Catalog</span>
            </button>
          </div>
        </div>

        {/* Premium Luxury Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6 sm:p-10 lg:p-12 border border-slate-800 shadow-xl mb-8">
          
          {/* Subtle Ambient Glowing Orbs */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#D1A61B]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-4xl">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Decentralized Escrow Knowledge Base &bull; 24/7 Verified Support</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Frequently Asked <span className="text-[#D1A61B]">Questions</span> &amp; Help Desk
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm lg:text-base mt-3 leading-relaxed max-w-3xl">
              Understand our 2-of-3 threshold smart contract vaults, 30-minute crypto price locks, insured express air freight, prepaid DDP customs, and official Apple worldwide warranty protection.
            </p>

            {/* 4 Feature Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-2">
              <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800 backdrop-blur-sm">
                <span className="text-xl sm:text-2xl font-black text-[#D1A61B] block">2-of-3</span>
                <span className="text-[11px] text-slate-300 font-bold uppercase tracking-wider">Multi-Sig Escrow</span>
              </div>
              <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800 backdrop-blur-sm">
                <span className="text-xl sm:text-2xl font-black text-emerald-400 block">30 Mins</span>
                <span className="text-[11px] text-slate-300 font-bold uppercase tracking-wider">Oracle Rate Lock</span>
              </div>
              <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800 backdrop-blur-sm">
                <span className="text-xl sm:text-2xl font-black text-blue-400 block">100% DDP</span>
                <span className="text-[11px] text-slate-300 font-bold uppercase tracking-wider">Prepaid Customs</span>
              </div>
              <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800 backdrop-blur-sm">
                <span className="text-xl sm:text-2xl font-black text-purple-400 block">1-Year GSX</span>
                <span className="text-[11px] text-slate-300 font-bold uppercase tracking-wider">Worldwide Warranty</span>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Mode Tabs: FAQ / Visual Escrow Flow / Dispute Arbitration */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'faq'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>📖</span>
            <span>All Knowledge Base FAQs</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400 text-black font-black">
              {faqs.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('escrowFlow')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'escrowFlow'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>🔐</span>
            <span>How Escrow Works (Visual Flow)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('disputeGuide')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'disputeGuide'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>⚖️</span>
            <span>Buyer Dispute &amp; Refund Rules</span>
          </button>
        </div>

        {/* Visual Escrow Flow Tab Content */}
        {activeTab === 'escrowFlow' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm mb-8 space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#D1A61B] block">Protocol Walkthrough</span>
                <h2 className="text-xl font-extrabold text-slate-900">How 2-of-3 Multi-Sig Escrow Protects Your Money</h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/help/escrow-rules')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer self-start sm:self-auto"
              >
                Read Smart Contract Rules &rarr;
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Step 1 */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative">
                <div className="w-8 h-8 rounded-xl bg-[#D1A61B] text-black font-black flex items-center justify-center text-sm shadow-xs">
                  1
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">Lock Funds in Vault</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  When you checkout, your cryptocurrency is deposited into an isolated smart contract on Ethereum / Polygon. Chainlink Oracles freeze your rate for 30 minutes. <strong>The merchant cannot touch your crypto.</strong>
                </p>
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 font-medium">
                  🔑 <strong>Keys:</strong> [1] Buyer &bull; [2] Merchant &bull; [3] Arbiter
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                  2
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">Insured Air Dispatch</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Merchant packs your authentic, sealed Apple device with serialized tamper-evident tape and ships via FedEx or DHL with DDP customs prepaid. Carrier telemetry links live to your order.
                </p>
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 font-medium">
                  📦 <strong>Tracking:</strong> Live telemetry &amp; flight corridor scans
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white font-black flex items-center justify-center text-sm shadow-xs">
                  3
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">48-Hr Inspect &amp; Release</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  You unbox your package, check Apple GSX coverage, and sign to release escrow funds. If damaged or counterfeit, you trigger a dispute for a 100% smart contract refund.
                </p>
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 font-medium">
                  🛡️ <strong>Safety:</strong> 2 signatures needed to unlock funds
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dispute Guide Tab Content */}
        {activeTab === 'disputeGuide' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm mb-8 space-y-5 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 block">Buyer Safeguard Guarantee</span>
                <h2 className="text-xl font-extrabold text-slate-900">What Happens If Something Goes Wrong?</h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/help/replacement-policy')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer self-start sm:self-auto"
              >
                14-Day Replacement Policy &rarr;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80">
                <span className="font-extrabold text-xs text-amber-950 block mb-1">🚨 Carrier Parcel Lost or Damaged</span>
                <p className="text-xs text-amber-900/80 leading-relaxed">
                  Carrier telemetry automatically notifies the escrow smart contract. Buyer Arbiter signature is executed immediately for a full 100% refund in crypto or instant free replacement.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
                <span className="font-extrabold text-xs text-emerald-950 block mb-1">🍏 Defective Hardware / DOA Screen</span>
                <p className="text-xs text-emerald-900/80 leading-relaxed">
                  Covered by both CryptoSpill 14-Day advance replacement and Apple’s 1-Year worldwide GSX warranty. We issue a free prepaid air return label.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80">
                <span className="font-extrabold text-xs text-blue-950 block mb-1">🛃 Customs Fee Demand at Door</span>
                <p className="text-xs text-blue-900/80 leading-relaxed">
                  All packages are strictly DDP (Delivered Duty Paid). If a regional courier makes an error and requests payment, CryptoSpill refunds it within 60 minutes from the merchant bond.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80">
                <span className="font-extrabold text-xs text-purple-950 block mb-1">⚖️ Neutral Arbiter Escalation</span>
                <p className="text-xs text-purple-900/80 leading-relaxed">
                  Neither the buyer nor merchant can take funds without 2 keys. If there is a disagreement, our audited arbiter verifies shipping weight logs and executes fair consensus.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main FAQ Content Area (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Search Bar & Filter Controls Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
              
              {/* Search input with sleek design */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions (e.g. escrow, rate lock, customs, applecare, refund, fedex)..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-10 py-3.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-[#D1A61B] focus:ring-2 focus:ring-[#D1A61B]/20 transition"
                />
                <svg className="w-5 h-5 text-slate-400 absolute left-4 top-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-3.5 text-xs text-slate-400 hover:text-slate-700 font-bold bg-slate-200/80 hover:bg-slate-300 rounded-full w-5 h-5 flex items-center justify-center cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Popular Search Tags */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                <span className="text-slate-400 font-bold text-[11px]">Popular:</span>
                {popularTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSearchQuery(tag)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-900 text-slate-600 font-semibold text-[11px] transition cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Category Pills & Expand/Collapse Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                  {[
                    { id: 'all', label: 'All Topics', icon: '🌟', count: faqs.length },
                    { id: 'crypto', label: 'Crypto & Escrow', icon: '🔒', count: faqs.filter(f => f.cat === 'crypto').length },
                    { id: 'shipping', label: 'Shipping & Customs', icon: '✈️', count: faqs.filter(f => f.cat === 'shipping').length },
                    { id: 'hardware', label: 'Hardware & Warranty', icon: '🍏', count: faqs.filter(f => f.cat === 'hardware').length },
                    { id: 'merchant', label: 'Merchant & Trust', icon: '🛡️', count: faqs.filter(f => f.cat === 'merchant').length },
                  ].map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs ${
                        selectedCategory === category.id
                          ? 'bg-slate-900 text-white shadow-xs font-black'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <span>{category.icon}</span>
                      <span>{category.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        selectedCategory === category.id ? 'bg-[#D1A61B] text-black font-black' : 'bg-white text-slate-500'
                      }`}>
                        {category.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Expand / Collapse All */}
                <button
                  type="button"
                  onClick={handleToggleExpandAll}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 underline underline-offset-2 cursor-pointer shrink-0"
                >
                  {allExpanded ? 'Collapse All' : 'Expand All'}
                </button>
              </div>

            </div>

            {/* Questions List */}
            {filteredFaqs.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-3 shadow-sm">
                <span className="text-4xl">🔍</span>
                <h3 className="text-base font-extrabold text-slate-900">No matching questions found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  We couldn't find an answer matching "{searchQuery}". Try adjusting your keywords or browse all entries.
                </p>
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSelectedCategory('all') }}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-[#D1A61B] hover:text-black transition cursor-pointer shadow-xs"
                >
                  Reset Search Filters
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFaqs.map((f) => {
                  const isOpen = allExpanded || activeFaq === f.id
                  const feedback = helpfulFeedback[f.id]
                  const isCopied = copiedId === f.id

                  return (
                    <div 
                      key={f.id} 
                      id={`faq-${f.id}`}
                      className={`border rounded-2xl overflow-hidden bg-white shadow-2xs transition duration-200 ${
                        isOpen ? 'border-[#D1A61B] ring-2 ring-[#D1A61B]/20 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (allExpanded) {
                            setAllExpanded(false)
                            setActiveFaq(f.id)
                          } else {
                            setActiveFaq(isOpen ? null : f.id)
                          }
                        }}
                        className="w-full p-5 text-left font-bold text-xs sm:text-sm text-slate-900 flex items-center justify-between hover:bg-slate-50/80 transition cursor-pointer gap-3"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <span className={`w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5 ${
                            isOpen ? 'bg-[#D1A61B] text-black shadow-xs' : 'bg-slate-100 text-slate-600'
                          }`}>
                            Q
                          </span>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/80">
                                {f.badge}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                #FAQ-{String(f.id).padStart(2, '0')}
                              </span>
                            </div>
                            <span className="text-slate-900 font-extrabold text-xs sm:text-sm leading-snug">
                              {f.q}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Copy link button */}
                          <button
                            type="button"
                            title="Copy link to this answer"
                            onClick={(e) => handleCopyLink(f.id, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition text-[11px]"
                          >
                            {isCopied ? '✓ Copied' : '🔗'}
                          </button>

                          <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold shrink-0 transition-transform ${
                            isOpen ? 'bg-slate-900 text-white rotate-180' : 'bg-slate-100 text-slate-500'
                          }`}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                            </svg>
                          </span>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-5 text-xs sm:text-sm text-slate-700 border-t border-slate-100 bg-gradient-to-b from-slate-50/60 to-white pt-4 leading-relaxed animate-fadeIn space-y-3">
                          <p className="leading-relaxed text-slate-600">
                            {f.a}
                          </p>

                          {/* Key Takeaway Callout */}
                          {f.keyTakeaway && (
                            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 font-medium text-xs flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="text-sm shrink-0">💡</span>
                                <span><strong>Key Takeaway:</strong> {f.keyTakeaway}</span>
                              </div>
                              {f.actionLink && (
                                <button
                                  type="button"
                                  onClick={() => navigate(f.actionLink.path)}
                                  className="text-[11px] font-bold text-amber-900 hover:text-black underline underline-offset-2 shrink-0"
                                >
                                  {f.actionLink.label} &rarr;
                                </button>
                              )}
                            </div>
                          )}

                          {/* Helpful Feedback Micro-Action */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                              <span>Verified by CryptoSpill Arbiter Syndicate</span>
                            </span>
                            <div className="flex items-center gap-2">
                              {feedback ? (
                                <span className="text-emerald-700 font-bold">Thank you for your feedback! ✓</span>
                              ) : (
                                <>
                                  <span className="hidden sm:inline">Helpful?</span>
                                  <button
                                    type="button"
                                    onClick={() => handleFeedback(f.id, 'yes')}
                                    className="px-2 py-0.5 rounded-md hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                                  >
                                    👍 Yes
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleFeedback(f.id, 'no')}
                                    className="px-2 py-0.5 rounded-md hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                                  >
                                    👎 No
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Direct Order Lookup Card */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                <span>📦</span>
                <span>Already placed an order?</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter your official Order Number (e.g. <strong>CS-10016</strong>) to inspect live air cargo dispatch, flight corridor telemetry, and 2-of-3 multi-sig status:
              </p>
              <form onSubmit={handleQuickTrack} className="flex gap-2">
                <input
                  type="text"
                  value={quickOrderId}
                  onChange={(e) => setQuickOrderId(e.target.value)}
                  placeholder="Enter Order Number (e.g. CS-10016)..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono outline-none focus:border-[#D1A61B]"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-[#D1A61B] hover:text-black text-white font-bold text-xs transition cursor-pointer shrink-0"
                >
                  Track Now
                </button>
              </form>
            </div>

            {/* Live Support Escalation Card (Dark Luxury) */}
            <div className="p-6 sm:p-7 rounded-3xl bg-slate-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 border border-slate-800 shadow-md">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D1A61B] block mb-1">
                  24/7 Human Dispatch &bull; Arbitration Support
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-white">
                  Have an urgent claim or question?
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md leading-relaxed">
                  Our live smart contract escrow desk, logistics flight dispatchers, and Apple GSX warranty specialists are on standby around the clock.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <a
                  href="https://t.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-[#D1A61B] hover:bg-yellow-300 text-black font-extrabold text-xs transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>💬 Telegram Live Desk</span>
                </a>
                <button
                  type="button"
                  onClick={() => navigate('/help/track-order')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition border border-slate-700 cursor-pointer"
                >
                  Order Tracking
                </button>
              </div>
            </div>

          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4">
            <InfoSidebar currentSlug="faq" />
          </div>

        </div>

      </div>
    </div>
  )
}
