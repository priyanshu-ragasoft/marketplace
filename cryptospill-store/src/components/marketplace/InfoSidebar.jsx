import React from 'react'
import { useRouter } from '../../router/RouterContext'

export default function InfoSidebar({ currentSlug }) {
  const { navigate } = useRouter()

  const helpLinks = [
    { path: '/help/track-order', slug: 'track-order', label: 'Track Active Order' },
    { path: '/help/escrow-guide', slug: 'escrow-guide', label: 'How Escrow Protects You' },
    { path: '/help/replacement-policy', slug: 'replacement-policy', label: '14-Day Replacement Policy' },
    { path: '/help/shipping-coverage', slug: 'shipping-coverage', label: 'Shipping Coverage' },
    // { path: '/help/warranty', slug: 'warranty', label: 'Warranty Verification' },
    { path: '/help/faq', slug: 'faq', label: 'Frequently Asked Questions' },
  ]

  const merchantLinks = [
    { path: '/merchant/become-merchant', slug: 'become-merchant', label: 'Become a Merchant' },
    { path: '/merchant/standards', slug: 'standards', label: 'Merchant Standards' },
    { path: '/merchant/payouts', slug: 'payouts', label: 'Instant Payouts' },
    { path: '/merchant/escrow-rules', slug: 'escrow-rules', label: 'Escrow Rules & Multi-Sig' },
    { path: '/legal/privacy', slug: 'privacy', label: 'Privacy Policy' },
    { path: '/legal/terms', slug: 'terms', label: 'Terms of Service' },
  ]

  return (
    <div className="space-y-6">
      {/* Help & Escrow Directory */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
          <span>Help &amp; Escrow Directory</span>
          <span className="w-2 h-2 rounded-full bg-yellow-400" />
        </h3>
        <ul className="space-y-1 text-xs">
          {helpLinks.map((link) => {
            const isActive = currentSlug === link.slug
            return (
              <li key={link.slug}>
                <button
                  type="button"
                  onClick={() => navigate(link.path)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl font-bold transition flex items-center justify-between cursor-pointer ${isActive
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

        {/* Merchant & Trust Directory */}
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mt-6 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
          <span>Merchant &amp; Trust</span>
          <span className="w-2 h-2 rounded-full bg-slate-900" />
        </h3>
        <ul className="space-y-1 text-xs">
          {merchantLinks.map((link) => {
            const isActive = currentSlug === link.slug
            return (
              <li key={link.slug}>
                <button
                  type="button"
                  onClick={() => navigate(link.path)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl font-bold transition flex items-center justify-between cursor-pointer ${isActive
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

      {/* Support Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold text-lg">
          💬
        </div>
        <h4 className="text-sm font-bold text-slate-900">Dedicated Shopper Desk</h4>
        <p className="text-xs text-slate-500 leading-relaxed">
          Need order help, serial check, or merchant verification? Our support team is online 24/7.
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
  )
}
