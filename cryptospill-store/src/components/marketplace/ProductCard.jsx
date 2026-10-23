import React, { useState } from 'react'
import { useRouter } from '../../router/RouterContext'

export default function ProductCard({ product, onAddToCart, onQuickView }) {
  const { navigate } = useRouter()
  const [justAdded, setJustAdded] = useState(false)

  const pId = product._id || product.id

  const handleCardClick = () => {
    navigate(`/product/${pId}`)
  }

  const handleAdd = (e) => {
    e.stopPropagation()
    if (product.inStock === false) return
    const success = onAddToCart(product)
    if (success !== false) {
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 1200)
    }
  }

  const ratingCount = Math.min(5, Math.max(1, Math.round(Number(product.rating || 5))))

  return (
    <div 
      onClick={handleCardClick}
      className={`bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xl rounded-2xl overflow-hidden transition-all duration-300 group flex flex-col justify-between cursor-pointer shadow-xs ${
        product.inStock === false ? 'opacity-90' : ''
      }`}
    >
      {/* Top Image Container */}
      <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-slate-50 flex items-center justify-center p-3">
        <img
          src={product.image}
          alt={product.title}
          onError={(e) => {
            e.target.style.opacity = '0.5'
          }}
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
        />

        {/* Floating Top Badge - Yellow Accent when badge is not empty */}
        {product.badge && product.badge.trim() !== '' && (
          <div className="absolute top-3 left-3">
            <span 
              className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-2xs border border-yellow-300 font-sans"
              style={{ backgroundColor: '#facc15', color: '#000000' }}
            >
              {product.badge}
            </span>
          </div>
        )}

        {/* Out of Stock Label on Image */}
        {product.inStock === false && (
          <div className="absolute top-3 right-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
              Out of Stock
            </span>
          </div>
        )}

        {/* View Details Button on Hover */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleCardClick()
            }}
            className="text-[11px] font-extrabold bg-slate-900 text-white hover:bg-yellow-400 hover:text-black px-3 py-1.5 rounded-lg transition shadow-md border border-slate-800 cursor-pointer"
          >
            View Details
          </button>
        </div>
      </div>

      {/* Card Content Area */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Merchant Info in gray, with Yellow Check when isVerified is true */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5 sm:mb-2">
            <span className="truncate max-w-[200px]">{product.merchant || 'Apple Authorized Store'}</span>
            {product.isVerified !== false && (
              <svg className="w-3.5 h-3.5 shrink-0" style={{ color: '#eab308' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>

          {/* Product Title in bold, two lines max */}
          <h3 className="text-sm sm:text-base font-bold text-slate-950 group-hover:text-yellow-600 transition-colors line-clamp-2 leading-snug mb-2">
            {product.title}
          </h3>

          {/* Yellow stars from rating, then number, then reviews in parentheses */}
          <div className="flex items-center gap-1.5 mb-4">
            <div className="flex text-amber-400 text-xs">
              {'★'.repeat(ratingCount)}
            </div>
            <span className="text-xs font-bold text-slate-900">{product.rating ?? '5.0'}</span>
            <span className="text-xs text-slate-400">({product.reviews ?? 0})</span>
          </div>
        </div>

        {/* Pricing and Action Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-black text-slate-950 leading-none">
              ${Number(product.priceUSD || 0).toFixed(2)}
            </p>
          </div>

          {/* If inStock is false, show out-of-stock state and do not offer add-to-escrow */}
          {product.inStock === false ? (
            <span className="px-3 py-2 rounded-xl font-bold text-[11px] bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed select-none">
              Out of Stock
            </span>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                justAdded 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-slate-900 hover:bg-yellow-400 hover:text-black text-white hover:shadow-sm'
              }`}
            >
              {justAdded ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Added</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
