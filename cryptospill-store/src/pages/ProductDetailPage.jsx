import React, { useState, useEffect } from 'react'
import { useRouter, Link } from '../router/RouterContext'
import { getPublicWebsiteProducts } from '../services/storeProductService'

export default function ProductDetailPage({ productId, initialProduct, onAddToCart, onBuyNow }) {
  const { navigate } = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('specs') // 'specs' | 'escrow' | 'shipping' | 'reviews'
  const [addedToast, setAddedToast] = useState(false)

  const [product, setProduct] = useState(() => {
    if (initialProduct && String(initialProduct._id || initialProduct.id) === String(productId)) {
      return initialProduct
    }
    return null
  })
  const [relatedProducts, setRelatedProducts] = useState([])
  const [isLoading, setIsLoading] = useState(!product)
  const [errorMessage, setErrorMessage] = useState('')

  // Load product and related products using public website endpoint
  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      // If we already have the product from initialProduct and its ID matches, just fetch related
      setIsLoading(!product)
      setErrorMessage('')

      try {
        const res = await getPublicWebsiteProducts({
          page: 1,
          limit: 100,
          search_key: '',
          category: 'all'
        })

        if (!isMounted) return

        if (res.success && res.data && Array.isArray(res.data.result)) {
          const list = res.data.result
          const current = list.find((p) => String(p._id || p.id) === String(productId))

          if (current) {
            setProduct(current)
            const related = list
              .filter((p) => String(p._id || p.id) !== String(current._id || current.id))
              .slice(0, 4)
            setRelatedProducts(related)
          } else if (!product) {
            setErrorMessage('Product not found in current marketplace catalog.')
          }
        } else {
          if (!product) {
            setErrorMessage(res.message || 'Unable to load product details.')
          }
        }
      } catch (err) {
        if (!isMounted) return
        if (!product) {
          setErrorMessage(err.message || 'Failed to connect to marketplace service.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [productId])

  const handleAdd = () => {
    if (!product || product.inStock === false) return
    for (let i = 0; i < quantity; i++) {
      onAddToCart(product)
    }
    setAddedToast(true)
    setTimeout(() => setAddedToast(false), 2000)
  }

  const handleInstantBuy = () => {
    if (!product || product.inStock === false) return
    handleAdd()
    if (onBuyNow) {
      onBuyNow(product)
    }
  }

  if (isLoading) {
    return (
      <div className="w-full bg-[#f8fafc] text-slate-900 min-h-screen py-16 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-bold text-sm">Loading product details...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="w-full bg-[#f8fafc] text-slate-900 min-h-screen py-16 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white border border-slate-200 rounded-3xl shadow-sm">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center text-2xl font-bold mb-4">
            ⚠️
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Item Unavailable</h2>
          <p className="text-xs sm:text-sm text-slate-500 mb-6">
            {errorMessage || 'The requested product could not be found or has been removed from the catalog.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-2xl bg-[#0f172a] text-white font-extrabold text-xs uppercase tracking-wider hover:bg-yellow-400 hover:text-black transition shadow-md"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    )
  }

  const categoryName = product.categoryInfo?.name || (typeof product.category === 'string' ? product.category.replace(/-/g, ' ') : 'Hardware')
  const ratingStars = Math.min(5, Math.max(1, Math.round(Number(product.rating || 5))))
  const specsList = Array.isArray(product.specs) ? product.specs : []

  return (
    <div className="w-full bg-[#f8fafc] text-slate-900 min-h-screen py-6 sm:py-10">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation & Back Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200/80 text-xs">
          <nav className="flex items-center gap-2 text-slate-500 font-medium">
            <Link to="/" className="hover:text-amber-600 transition flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Home</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="capitalize text-slate-600">{categoryName}</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-bold truncate max-w-[200px] sm:max-w-none">{product.title}</span>
          </nav>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-yellow-400 text-slate-700 hover:text-black font-bold text-xs flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Catalog</span>
          </button>
        </div>

        {/* Added to cart toast */}
        {addedToast && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500 text-white flex items-center justify-between shadow-lg animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">✓</span>
              <p className="text-xs sm:text-sm font-bold">
                Added {quantity} &times; &ldquo;{product.title}&rdquo; to your decentralized escrow cart!
              </p>
            </div>
            <Link to="/" className="text-xs underline font-bold hover:text-white/80">
              Continue Shopping
            </Link>
          </div>
        )}

        {/* Main Product Showcase Grid (2-Column) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Left Column: Image Showcase (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="relative aspect-square w-full rounded-2xl bg-slate-50 border border-slate-200/80 p-8 flex items-center justify-center overflow-hidden group">
              <img
                src={product.image}
                alt={product.title}
                onError={(e) => {
                  e.target.style.opacity = '0.5'
                }}
                className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
              />
              
              {/* Product Badge - Yellow accent when badge is not empty */}
              {product.badge && product.badge.trim() !== '' && (
                <div className="absolute top-4 left-4">
                  <span 
                    className="text-[10.5px] font-black uppercase tracking-wider px-3 py-1 rounded-md shadow-xs border border-yellow-300 font-sans"
                    style={{ backgroundColor: '#facc15', color: '#000000' }}
                  >
                    {product.badge}
                  </span>
                </div>
              )}

              {/* Escrow Sealed Pill */}
              <div className="absolute bottom-4 right-4 bg-slate-900/90 text-white px-3 py-1 rounded-full text-[10.5px] font-bold backdrop-blur-md flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Smart Contract Vault</span>
              </div>
            </div>

            {/* Quick Guarantees Grid */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <p className="text-[11px] font-bold text-slate-900">100% Genuine</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Sealed Serial</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <p className="text-[11px] font-bold text-slate-900">0% Escrow Fee</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Vault Protected</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <p className="text-[11px] font-bold text-slate-900">FedEx / DHL Air</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Insured Flight</p>
              </div>
            </div>
          </div>

          {/* Right Column: Title, Pricing, Actions & Buy (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              {/* Merchant & Stock Tag */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                  <span className="font-bold text-slate-900">{product.merchant || 'Apple Authorized Store'}</span>
                  {product.isVerified !== false && (
                    <svg className="w-3.5 h-3.5" style={{ color: '#eab308' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className="text-emerald-700 font-bold">&bull; Authorized Escrow</span>
                </div>

                {product.inStock === false ? (
                  <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Out of Stock
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    In Stock &bull; Ready for Air Dispatch
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-tight mb-3">
                {product.title}
              </h1>

              {/* Rating & Details */}
              <div className="flex flex-wrap items-center gap-4 mb-5 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="flex text-amber-400 text-sm">{'★'.repeat(ratingStars)}</div>
                  <span className="font-bold text-slate-900">{product.rating ?? '5.0'}</span>
                  <span className="text-slate-400">({product.reviews ?? 0} verified buyer reviews)</span>
                </div>
                <span className="text-slate-300">&bull;</span>
                <span className="text-slate-600 font-mono text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  Item #{String(product._id || product.id).slice(-6)}
                </span>
              </div>

              {/* Price Banner */}
              <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block mb-0.5">
                    Decentralized Escrow Price
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl sm:text-4xl font-black text-slate-950">
                      ${Number(product.priceUSD || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right text-[11px] text-slate-500">
                  <p className="font-bold text-slate-800">Crypto Price Guarantee</p>
                  <p>Locked for 30 minutes at checkout</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6">
                {product.description}
              </p>

              {/* Quantity & CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-slate-100 mb-6">
                {product.inStock === false ? (
                  <div className="w-full py-4 px-6 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 font-extrabold text-xs sm:text-sm text-center">
                    This item is currently out of stock. Instant decentralized escrow checkout is disabled.
                  </div>
                ) : (
                  <>
                    {/* Quantity Counter */}
                    <div className="flex items-center border border-slate-200 rounded-2xl bg-slate-50 px-3 py-2 w-full sm:w-auto justify-between sm:justify-start gap-4">
                      <span className="text-xs font-bold text-slate-500">Qty:</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold text-sm cursor-pointer"
                        >
                          &minus;
                        </button>
                        <span className="font-extrabold text-sm text-slate-900 w-4 text-center">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity(quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold text-sm cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      type="button"
                      onClick={handleAdd}
                      className="flex-1 py-3.5 px-6 rounded-2xl bg-white border-2 border-slate-900 hover:bg-yellow-400 hover:border-yellow-400 hover:text-black text-slate-900 font-extrabold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <span>Add to Cart</span>
                    </button>

                    {/* Instant Escrow Buy */}
                    <button
                      type="button"
                      onClick={handleInstantBuy}
                      className="flex-1 py-3.5 px-6 rounded-2xl bg-slate-950 hover:bg-yellow-400 hover:text-black text-white font-extrabold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <svg className="w-4 h-4 text-yellow-400 group-hover:text-black" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
                      </svg>
                      <span>Buy with 0% Escrow</span>
                    </button>
                  </>
                )}
              </div>

              {/* Escrow Safety Strip */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 text-xs text-slate-600">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0 font-bold">
                  🛡️
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">CryptoSpill Smart Contract Escrow Guarantee</h4>
                  <p className="text-[11.5px] text-slate-500 mt-0.5 leading-relaxed">
                    Your cryptocurrency funds are locked safely in an on-chain escrow contract. The merchant receives payout only AFTER you inspect the delivered item and verify its serial number.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Detailed Tabs Section */}
        <div className="mt-10 bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm">
          {/* Tab Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4 mb-6">
            {[
              { id: 'specs', label: 'Technical Specifications' },
              { id: 'escrow', label: 'Escrow Protection Workflow' },
              { id: 'shipping', label: 'Shipping & Delivery Policy' },
              { id: 'reviews', label: `Buyer Reviews (${product.reviews || 0})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'specs' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">Key Features &amp; Specifications</h3>
                {specsList.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {specsList.map((spec, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                        <span className="text-amber-500 font-bold text-sm">✓</span>
                        <span className="font-semibold text-slate-800">{spec}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No detailed specifications provided for this product.</p>
                )}
              </div>
            )}

            {activeTab === 'escrow' && (
              <div className="space-y-4 text-xs">
                <h3 className="text-base font-bold text-slate-900">How 0% Escrow Protects Your Purchase</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
                    <p className="font-bold text-slate-900 mb-1">1. Deposit Locked</p>
                    <p className="text-slate-600 text-[11.5px] leading-relaxed">
                      Your crypto payment is locked in an audited smart contract escrow vault. Neither party can seize funds unilaterally.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
                    <p className="font-bold text-slate-900 mb-1">2. Air Dispatch &amp; Tracking</p>
                    <p className="text-slate-600 text-[11.5px] leading-relaxed">
                      Merchant dispatches sealed stock via FedEx / DHL Priority Air with active serial verification.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
                    <p className="font-bold text-slate-900 mb-1">3. You Confirm Release</p>
                    <p className="text-slate-600 text-[11.5px] leading-relaxed">
                      You receive package, inspect original serial, and click &ldquo;Release Escrow&rdquo; to pay merchant.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-4 text-xs">
                <h3 className="text-base font-bold text-slate-900">Express Air Transit &amp; Insurance</h3>
                <p className="text-slate-600 leading-relaxed max-w-2xl">
                  All hardware shipments are fully insured for 100% replacement value. Dispatched from authorized warehouses in San Francisco, Frankfurt, and Singapore.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between">
                    <span className="font-bold text-slate-800">North America &amp; Europe</span>
                    <span className="text-amber-700 font-bold">24 &ndash; 48 Hours</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between">
                    <span className="font-bold text-slate-800">Asia &amp; Middle East</span>
                    <span className="text-amber-700 font-bold">48 &ndash; 72 Hours</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4 text-xs">
                <h3 className="text-base font-bold text-slate-900">Verified Customer Reviews</h3>
                <div className="space-y-3 max-w-2xl">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">Alex V. (Wallet: 0x82...f9a)</span>
                      <span className="text-amber-500">★★★★★</span>
                    </div>
                    <p className="text-slate-600 text-[11.5px] leading-relaxed">
                      &ldquo;Purchased with ETH via escrow. Tracking arrived within 3 hours and device was delivered sealed in 2 days. Official serial validated instantly on official coverage.&rdquo;
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">Elena M. (Wallet: 0x4a...1bc)</span>
                      <span className="text-amber-500">★★★★★</span>
                    </div>
                    <p className="text-slate-600 text-[11.5px] leading-relaxed">
                      &ldquo;Best decentralized store experience. Zero percent escrow fee was real, and customer desk answered my Telegram within minutes.&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products Carousel / Grid */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                More Items in Catalog
              </h2>
              <Link to="/" className="text-xs font-bold text-slate-900 hover:text-amber-600 transition">
                View All Products &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rel) => {
                const relId = rel._id || rel.id
                return (
                  <div
                    key={relId}
                    onClick={() => navigate(`/product/${relId}`)}
                    className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xl rounded-2xl p-4 transition-all group cursor-pointer flex flex-col justify-between"
                  >
                    <div className="aspect-square bg-slate-50 rounded-xl p-4 flex items-center justify-center overflow-hidden mb-3">
                      <img
                        src={rel.image}
                        alt={rel.title}
                        onError={(e) => {
                          e.target.style.opacity = '0.5'
                        }}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        {rel.categoryInfo?.name || (typeof rel.category === 'string' ? rel.category : '')}
                      </p>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-amber-600 line-clamp-1 mt-0.5">
                        {rel.title}
                      </h4>
                      <div className="flex items-baseline justify-between mt-3 pt-2 border-t border-slate-100">
                        <span className="text-sm font-black text-slate-900">${Number(rel.priceUSD || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

