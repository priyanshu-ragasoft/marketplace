import React from 'react'

export default function ProductDetailModal({ product, onClose, onAddToCart }) {
  if (!product) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" 
      />

      <div className="min-h-screen px-4 text-center flex items-center justify-center">
        <div 
          onClick={(e) => e.stopPropagation()}
          className="relative inline-block w-full max-w-2xl p-6 sm:p-8 my-8 text-left bg-white border border-slate-200 rounded-3xl shadow-2xl transform transition-all text-slate-900 overflow-hidden"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start">
            
            {/* Image Preview */}
            <div className="rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 relative p-4 flex items-center justify-center">
              <img 
                src={product.image} 
                alt={product.title}
                className="w-full h-64 sm:h-80 object-contain" 
              />
              <div className="absolute top-3 left-3">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm bg-yellow-400 text-slate-950 border border-yellow-300">
                  {product.badge}
                </span>
              </div>
            </div>

            {/* Product Details */}
            <div className="flex flex-col justify-between h-full">
              <div>
                {/* Merchant Verified Badge with Yellow / Gold */}
                <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold mb-2">
                  <span>{product.merchant}</span>
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-slate-950 leading-snug mb-3">
                  {product.title}
                </h2>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4 text-xs">
                  <div className="flex text-amber-400">{'★'.repeat(5)}</div>
                  <span className="font-bold text-slate-900">{product.rating}</span>
                  <span className="text-slate-500">({product.reviews} customer reviews)</span>
                </div>

                {/* Description */}
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4">
                  {product.description}
                </p>

                {/* Specifications Checklist */}
                <div className="mb-6 space-y-1.5">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Features &amp; Specs:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                    {product.specs?.map((spec, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_4px_#facc15]" />
                        <span>{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Price and CTA with Yellow Crypto Price */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-baseline justify-between mb-4">
                  <div>
                    <span className="text-2xl sm:text-3xl font-black text-slate-950">
                      ${product.priceUSD.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                    Escrow Ready
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      onAddToCart(product)
                      onClose()
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-yellow-400 hover:text-black text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Add to Cart</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onAddToCart(product)
                      onClose()
                    }}
                    className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-900 font-bold text-xs sm:text-sm transition cursor-pointer"
                  >
                    Instant Buy
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  )
}
