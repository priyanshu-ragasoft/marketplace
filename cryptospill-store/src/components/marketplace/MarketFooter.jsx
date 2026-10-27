import React, { useState } from 'react'
import BrandLogo from '../common/BrandLogo'
import { Link, useRouter } from '../../router/RouterContext'

import trustDelivery3D from '../../assets/trust-delivery-3d.png'
import trustAuthenticity3D from '../../assets/trust-authenticity-3d.png'
import trustEscrow3D from '../../assets/trust-escrow-3d.png'
import trustTicket3D from '../../assets/trust-ticket-3d.png'

export default function MarketFooter() {
  const { navigate } = useRouter()
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (newsletterEmail.trim()) {
      setIsSubscribed(true)
      setTimeout(() => {
        setNewsletterEmail('')
        setIsSubscribed(false)
      }, 4000)
    }
  }

  return (
    <footer className="bg-white border-t border-slate-200 text-slate-600 text-xs font-sans selection:bg-yellow-400 selection:text-black">

      {/* 1. Unified Human Trust Bar (Seamless, Integrated & Cleanly Divided) */}
      <div className="border-b border-slate-200/90 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-slate-200/80">

            {/* Delivery */}
            <div className="flex items-center sm:items-start gap-4 lg:pr-6 group cursor-default">
              <div className="w-16 h-16 sm:w-18 sm:h-18 lg:w-18 lg:h-18 shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <img
                  src={trustDelivery3D}
                  alt="Insured Priority Air Delivery"
                  className="w-full h-full object-contain filter drop-shadow-[0_6px_14px_rgba(209,166,27,0.28)]"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60">
                    AIR FREIGHT
                  </span>
                </div>
                <h4 className="text-[13px] font-extrabold text-slate-900 group-hover:text-black transition-colors leading-snug">
                  Insured Express Priority Delivery
                </h4>
                <p className="text-[11.5px] text-slate-500 mt-1 leading-snug">
                  Direct FedEx &amp; DHL air cargo with live telemetry. 100% DDP customs prepaid worldwide.
                </p>
              </div>
            </div>

            {/* Genuine Guarantee */}
            <div className="flex items-center sm:items-start gap-4 lg:px-6 group cursor-default">
              <div className="w-16 h-16 sm:w-18 sm:h-18 lg:w-18 lg:h-18 shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <img
                  src={trustAuthenticity3D}
                  alt="100% Genuine & Sealed"
                  className="w-full h-full object-contain filter drop-shadow-[0_6px_14px_rgba(209,166,27,0.28)]"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60">
                    APPLE GSX
                  </span>
                </div>
                <h4 className="text-[13px] font-extrabold text-slate-900 group-hover:text-black transition-colors leading-snug">
                  100% Factory-Sealed Authentic
                </h4>
                <p className="text-[11.5px] text-slate-500 mt-1 leading-snug">
                  Original verifiable serial numbers with official 1-Year Apple warranty valid worldwide.
                </p>
              </div>
            </div>

            {/* Escrow Pay */}
            <div className="flex items-center sm:items-start gap-4 lg:px-6 group cursor-default">
              <div className="w-16 h-16 sm:w-18 sm:h-18 lg:w-18 lg:h-18 shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <img
                  src={trustEscrow3D}
                  alt="0% Safe Escrow Protection"
                  className="w-full h-full object-contain filter drop-shadow-[0_6px_14px_rgba(209,166,27,0.28)]"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200/60">
                    2-OF-3 VAULT
                  </span>
                </div>
                <h4 className="text-[13px] font-extrabold text-slate-900 group-hover:text-black transition-colors leading-snug">
                  Zero-Risk Multi-Sig Escrow
                </h4>
                <p className="text-[11.5px] text-slate-500 mt-1 leading-snug">
                  Crypto stays locked in smart contract vault until you physically unbox, inspect &amp; approve.
                </p>
              </div>
            </div>

            {/* Support / Ticket Raise */}
            <div
              onClick={() => navigate('/help/replacement-policy')}
              className="flex items-center sm:items-start gap-4 lg:pl-6 group cursor-pointer"
            >
              <div className="w-16 h-16 sm:w-18 sm:h-18 lg:w-18 lg:h-18 shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <img
                  src={trustTicket3D}
                  alt="Raise Support Ticket 24/7"
                  className="w-full h-full object-contain filter drop-shadow-[0_6px_14px_rgba(209,166,27,0.28)]"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200/60">
                    RAISE TICKET
                  </span>
                </div>
                <h4 className="text-[13px] font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors leading-snug">
                  Raise a Support Ticket
                </h4>
                <p className="text-[11.5px] text-slate-500 mt-1 leading-snug">
                  Submit an instant ticket for order disputes, hardware claims, transit issues &amp; escrow arbitration.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 2. Newsletter & VIP Drop Updates (Human Touchpoint) */}
      <div className="border-b border-slate-200/80 bg-slate-50/60 py-6">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Subscribe for Exclusive Apple Drops &amp; Flash Discounts
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Get notified when limited iPhone stock drops or zero-escrow promo codes go live.
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="flex items-center gap-2 w-full md:w-auto max-w-md">


            </form>
          </div>
        </div>
      </div>

      {/* 3. Comprehensive Human Store Directory */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-8 lg:gap-10">

          {/* Brand Column (Col 1-4) */}
          <div className="sm:col-span-2 md:col-span-4 space-y-4">
            <BrandLogo size="default" isDarkBackground={false} />
            <p className="text-slate-500 text-xs leading-relaxed max-w-sm">
              CryptoSpill is a certified decentralized marketplace for original Apple devices and official digital keys. Shop with 0% escrow fee and multi-coin instant blockchain confirmation.
            </p>

            {/* Direct Contact Reassurance */}
            <div className="text-xs text-slate-600 space-y-1.5 pt-1">
              <p>
                <span className="font-bold text-slate-900">Community Store Support:</span>{' '}
                <a href="mailto:support@cryptospill.store" className="hover:text-amber-600 transition">support@cryptospill.store</a>
              </p>
            </div>

            {/* Social Channels with Official CryptoSpill URLs */}
            <div className="pt-2">
              <p className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-2">Follow Our Channels</p>
              <div className="flex items-center gap-2">
                <a
                  href="https://www.facebook.com/CryptoSpill/"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Facebook"
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-yellow-400 hover:text-black text-slate-700 flex items-center justify-center border border-slate-200 transition shadow-2xs cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>

                <a
                  href="https://www.instagram.com/cryptospillofficial/"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Instagram"
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-yellow-400 hover:text-black text-slate-700 flex items-center justify-center border border-slate-200 transition shadow-2xs cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>

                <a
                  href="https://x.com/CryptoSpillX"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="X"
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-yellow-400 hover:text-black text-slate-700 flex items-center justify-center border border-slate-200 transition shadow-2xs cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>

                <a
                  href="https://www.youtube.com/@CryptoSpillOfficial"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="YouTube"
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-yellow-400 hover:text-black text-slate-700 flex items-center justify-center border border-slate-200 transition shadow-2xs cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>

                <a
                  href="https://www.tiktok.com/@cryptospill"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="TikTok"
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-yellow-400 hover:text-black text-slate-700 flex items-center justify-center border border-slate-200 transition shadow-2xs cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Hardware Catalog */}
          <div className="md:col-span-2">
            <h4 className="text-slate-900 font-bold mb-3.5 uppercase tracking-wider text-[11px]">Hardware</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/product/5" className="text-slate-600 hover:text-amber-600 transition block">iPhone 18 Pro Max</Link></li>
              <li><Link to="/product/6" className="text-slate-600 hover:text-amber-600 transition block">iPhone Duo Foldable</Link></li>
              <li><Link to="/product/3" className="text-slate-600 hover:text-amber-600 transition block">iPhone 17 Pro Titanium</Link></li>
              <li><Link to="/product/2" className="text-slate-600 hover:text-amber-600 transition block">iPad Pro Tandem OLED</Link></li>
              <li><Link to="/product/1" className="text-slate-600 hover:text-amber-600 transition block">Apple Watch Ultra</Link></li>
              <li><Link to="/" className="text-slate-900 font-semibold hover:text-amber-600 transition flex items-center gap-1">View Full Catalog &rarr;</Link></li>
            </ul>
          </div>

          {/* Column 3: Digital Products */}
          <div className="md:col-span-2">
            <h4 className="text-slate-900 font-bold mb-3.5 uppercase tracking-wider text-[11px]">Digital &amp; Services</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/product/7" className="text-slate-600 hover:text-amber-600 transition block">Apple Gift Cards ($500)</Link></li>
              <li><Link to="/product/11" className="text-slate-600 hover:text-amber-600 transition block">Apple Gift Cards ($1,000)</Link></li>
              <li><Link to="/product/9" className="text-slate-600 hover:text-amber-600 transition block">AppleCare+ 2-Yr Certificate</Link></li>
              <li><Link to="/product/8" className="text-slate-600 hover:text-amber-600 transition block">Apple One Premier Pass</Link></li>
              <li><Link to="/product/10" className="text-slate-600 hover:text-amber-600 transition block">Final Cut &amp; Logic Pro Suite</Link></li>
              <li><Link to="/product/12" className="text-slate-600 hover:text-amber-600 transition block">Apple Developer 1-Yr Key</Link></li>
            </ul>
          </div>

          {/* Column 4: Customer Care & Escrow */}
          <div className="md:col-span-2">
            <h4 className="text-slate-900 font-bold mb-3.5 uppercase tracking-wider text-[11px]">Help &amp; Escrow</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/blog" className="text-amber-600 font-bold hover:text-amber-700 transition flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Blog &amp; Tech Guides
                </Link>
              </li>
              <li><Link to="/help/track-order" className="text-slate-600 hover:text-amber-600 transition block">Track Active Order</Link></li>
              <li><Link to="/help/escrow-guide" className="text-slate-600 hover:text-amber-600 transition block">How Escrow Protects You</Link></li>
              <li><Link to="/help/replacement-policy" className="text-slate-600 hover:text-amber-600 transition block">14-Day Replacement Policy</Link></li>
              <li><Link to="/help/shipping-coverage" className="text-slate-600 hover:text-amber-600 transition block">Shipping Coverage</Link></li>
              <li><Link to="/help/warranty" className="text-slate-600 hover:text-amber-600 transition block">Warranty Verification</Link></li>
              <li><Link to="/help/faq" className="text-slate-600 hover:text-amber-600 transition block">Frequently Asked Questions</Link></li>
            </ul>
          </div>

          {/* Column 5: Merchants & Policies */}
          <div className="md:col-span-2">
            <h4 className="text-slate-900 font-bold mb-3.5 uppercase tracking-wider text-[11px]">Merchant &amp; Trust</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/merchant/become-merchant" className="text-slate-600 hover:text-amber-600 transition block">Become a Merchant</Link></li>
              <li><Link to="/merchant/standards" className="text-slate-600 hover:text-amber-600 transition block">Merchant Standards</Link></li>
              <li><Link to="/merchant/payouts" className="text-slate-600 hover:text-amber-600 transition block">Instant Payouts</Link></li>
              <li><Link to="/merchant/escrow-rules" className="text-slate-600 hover:text-amber-600 transition block">Escrow Rules &amp; Multi-Sig</Link></li>
              <li><Link to="/legal/privacy" className="text-slate-600 hover:text-amber-600 transition block">Privacy Policy</Link></li>
              <li><Link to="/legal/terms" className="text-slate-600 hover:text-amber-600 transition block">Terms of Service</Link></li>
            </ul>
          </div>

        </div>
      </div>



      {/* 5. Legal Disclaimers & Copyright */}
      <div className="border-t border-slate-200 py-6 px-4 sm:px-6 lg:px-8 text-slate-400 text-[11px]">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          <p>
            &copy; {new Date().getFullYear()} CryptoSpill Marketplace Store, Inc. All rights reserved. Apple, iPhone, iPad, Apple Watch, and AppleCare are registered trademarks of Apple Inc.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-500 font-medium">
            <Link to="/blog" className="text-slate-900  hover:text-amber-600 transition">Blog &amp; Guides</Link>
            <span>&bull;</span>
            <Link to="/legal/privacy" className="hover:text-slate-900 transition">Privacy</Link>
            <span>&bull;</span>
            <Link to="/legal/terms" className="hover:text-slate-900 transition">Terms of Sale</Link>
            <span>&bull;</span>
            <Link to="/merchant/escrow-rules" className="hover:text-slate-900 transition">Escrow Rules</Link>
            <span>&bull;</span>
            <Link to="/help/escrow-guide" className="hover:text-slate-900 transition">Security Protocol</Link>
            <span>&bull;</span>
            <Link to="/legal/privacy" className="hover:text-slate-900 transition">Cookie Settings</Link>
          </div>
        </div>
      </div>

    </footer>
  )
}
