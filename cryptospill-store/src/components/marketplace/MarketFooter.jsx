import React, { useState } from 'react'
import BrandLogo from '../common/BrandLogo'
import { Link, useRouter } from '../../router/RouterContext'

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
            <div className="flex items-start gap-4 lg:pr-8 group cursor-default">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-300/40 text-amber-700 flex items-center justify-center shrink-0 transition-all duration-300 group-hover:bg-yellow-400 group-hover:text-black group-hover:border-yellow-400 group-hover:scale-105 shadow-2xs">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                  <path d="M15 18H9" />
                  <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
                  <circle cx="17" cy="18" r="2" />
                  <circle cx="7" cy="18" r="2" />
                </svg>
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-slate-900 group-hover:text-black transition-colors">Free Insured Express Delivery</h4>
                <p className="text-[11.5px] text-slate-500 mt-1 leading-snug">Air shipping via FedEx &amp; DHL on orders over $500. Tracked in real-time.</p>
              </div>
            </div>

            {/* Genuine Guarantee */}
            <div className="flex items-start gap-4 lg:px-8 group cursor-default">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-300/40 text-amber-700 flex items-center justify-center shrink-0 transition-all duration-300 group-hover:bg-yellow-400 group-hover:text-black group-hover:border-yellow-400 group-hover:scale-105 shadow-2xs">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-slate-900 group-hover:text-black transition-colors">100% Genuine Apple Sealed</h4>
                <p className="text-[11.5px] text-slate-500 mt-1 leading-snug">Original serial numbers with 1-Year Apple warranty valid worldwide.</p>
              </div>
            </div>

            {/* Escrow Pay */}
            <div className="flex items-start gap-4 lg:px-8 group cursor-default">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-300/40 text-amber-700 flex items-center justify-center shrink-0 transition-all duration-300 group-hover:bg-yellow-400 group-hover:text-black group-hover:border-yellow-400 group-hover:scale-105 shadow-2xs">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2.5" ry="2.5" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  <circle cx="12" cy="16" r="1.5" />
                  <path d="M12 17.5v2" />
                </svg>
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-slate-900 group-hover:text-black transition-colors">0% Safe Escrow Protection</h4>
                <p className="text-[11.5px] text-slate-500 mt-1 leading-snug">Smart contract vault locks funds until you verify and accept delivery.</p>
              </div>
            </div>

            {/* Support */}
            <div className="flex items-start gap-4 lg:pl-8 group cursor-default">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-300/40 text-amber-700 flex items-center justify-center shrink-0 transition-all duration-300 group-hover:bg-yellow-400 group-hover:text-black group-hover:border-yellow-400 group-hover:scale-105 shadow-2xs">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5a9 9 0 0 1 18 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
                  <path d="M21 16v1.5a3.5 3.5 0 0 1-3.5 3.5H14" />
                </svg>
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-slate-900 group-hover:text-black transition-colors">24x7 Dedicated Shopper Desk</h4>
                <p className="text-[11.5px] text-slate-500 mt-1 leading-snug">Personal human support for order status, serial checks &amp; checkout help.</p>
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
              <div className="relative flex-1">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 shadow-2xs"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-yellow-400 hover:text-black text-white font-bold text-xs transition-all shadow-xs cursor-pointer shrink-0"
              >
                {isSubscribed ? 'Subscribed!' : 'Join Drops'}
              </button>
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
                <span className="font-bold text-slate-900">Shopper Support:</span>{' '}
                <a href="mailto:support@cryptospill.store" className="hover:text-amber-600 transition">support@cryptospill.store</a>
              </p>
              <p>
                <span className="font-bold text-slate-900">Escrow Desk:</span>{' '}
                <span className="text-slate-500">escrow@cryptospill.store</span>
              </p>
              <p>
                <span className="font-bold text-slate-900">Hours:</span>{' '}
                <span className="text-slate-500">Mon &ndash; Sat, 9:00 AM &ndash; 8:00 PM EST</span>
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
