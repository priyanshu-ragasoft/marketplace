import React, { useRef, useState, useEffect, useCallback } from 'react'
import logoImg from '../../assets/logo.png'
import { getPublicWebsiteBanners } from '../../services/storeBannerService'
import { normalizeImageUrl } from '../../utils/imageUrl'

export default function MarketHero({ onExploreClick }) {
  const scrollRef = useRef(null)
  const [banners, setBanners] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [bannerError, setBannerError] = useState('')
  const [canScrollRight, setCanScrollRight] = useState(true)

  // Fetch active banners from GET /api/v1/store/banner/websidelist (no auth)
  const fetchBanners = useCallback(async () => {
    try {
      const data = await getPublicWebsiteBanners()
      if (Array.isArray(data)) {
        setBanners(data)
        setBannerError('')
      } else {
        setBanners([])
      }
    } catch (err) {
      console.warn('Failed to fetch store banners for homepage:', err)
      setBannerError(err.message || 'Failed to load banners')
      setBanners([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBanners()
    // Listen for live update events from Store Admin
    const handleUpdate = () => {
      fetchBanners()
    }
    window.addEventListener('cryptospill_banners_updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener('cryptospill_banners_updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [fetchBanners])

  // Check scroll boundary to disable the next arrow when the last card is fully visible
  const checkScrollState = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 10
      setCanScrollRight(!isAtEnd)
    }
  }, [])

  useEffect(() => {
    checkScrollState()
    const container = scrollRef.current
    if (container) {
      container.addEventListener('scroll', checkScrollState, { passive: true })
      window.addEventListener('resize', checkScrollState)
      return () => {
        container.removeEventListener('scroll', checkScrollState)
        window.removeEventListener('resize', checkScrollState)
      }
    }
  }, [banners, isLoading, checkScrollState])

  // Next arrow scrolls one card right
  const handleScrollRight = () => {
    if (scrollRef.current) {
      const firstCard = scrollRef.current.firstElementChild
      const cardWidth = firstCard ? firstCard.getBoundingClientRect().width + 16 : 330
      scrollRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' })
      setTimeout(checkScrollState, 350)
    }
  }

  // Handle clicking a card
  const handleCardClick = (banner) => {
    if (banner.linkUrl && typeof banner.linkUrl === 'string' && banner.linkUrl.trim()) {
      const targetUrl = banner.linkUrl.trim()
      if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
        window.open(targetUrl, '_blank', 'noopener,noreferrer')
      } else {
        window.location.href = targetUrl
      }
    } else if (onExploreClick) {
      onExploreClick()
    }
  }

  // Active banners list to render from GET /store/banner/websidelist
  const activeBannersList = banners || []

  // While loading, show skeleton cards
  if (isLoading) {
    return (
      <section className="relative w-full bg-[#f8fafc] py-4 sm:py-6 border-b border-slate-200/80 overflow-hidden select-none">
        <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 overflow-x-hidden py-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="shrink-0 w-[84vw] max-w-[340px] sm:w-[320px] md:w-[330px] lg:w-[calc(25%-12px)] h-[210px] sm:h-[225px] rounded-[28px] bg-slate-200 animate-pulse"
              />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (activeBannersList.length === 0) {
    return null
  }

  return (
    <section className="relative w-full bg-[#f8fafc] py-4 sm:py-6 border-b border-slate-200/80 overflow-hidden select-none font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 relative">

        {/* White circular next-arrow on the right */}
        <button
          type="button"
          onClick={handleScrollRight}
          disabled={!canScrollRight}
          className={`absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white text-slate-900 shadow-[0_4px_16px_rgba(0,0,0,0.18)] border border-slate-200/80 items-center justify-center transition-all cursor-pointer flex hover:scale-105 active:scale-95 disabled:opacity-0 disabled:pointer-events-none`}
          aria-label="Next banner"
        >
          <svg className="w-5 h-5 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Horizontal Row of Promo Cards: Desktop shows about 4 cards, equal height */}
        <div
          ref={scrollRef}
          onScroll={checkScrollState}
          className="flex items-stretch gap-3.5 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1 sm:py-2 px-1"
          style={{
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {activeBannersList.map((banner) => {
            const rawBg = banner.backgroundColor && banner.backgroundColor.trim()
              ? banner.backgroundColor.trim()
              : '#0f172a'
            const hasTitle = Boolean(banner.title && banner.title.trim())
            const hasOffer = Boolean(banner.offerText && banner.offerText.trim())
            const hasSubtitle = Boolean(banner.subtitle && banner.subtitle.trim())
            const hasReward = Boolean(banner.rewardText && banner.rewardText.trim())
            const hasBadge = Boolean(banner.badgeText && banner.badgeText.trim())
            const liveText = banner.liveLabel && banner.liveLabel.trim() ? banner.liveLabel.trim() : 'LIVE NOW'
            const hasImage = Boolean(banner.image && banner.image.trim())

            return (
              <div
                key={banner._id || banner.title}
                onClick={() => handleCardClick(banner)}
                className="group relative shrink-0 w-[84vw] max-w-[340px] sm:w-[320px] md:w-[330px] lg:w-[calc(25%-12px)] h-[210px] sm:h-[225px] rounded-[28px] p-4 sm:p-5 text-white shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer flex flex-col justify-between border border-white/10 select-none"
                style={{
                  background: `linear-gradient(135deg, ${rawBg} 0%, #080d19 100%)`,
                  scrollSnapAlign: 'start'
                }}
              >
                {/* 1. Subtle ambient dots pattern overlay matching reference */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-80"
                  style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.18) 1.2px, transparent 1.2px)',
                    backgroundSize: '16px 16px'
                  }}
                />

                {/* 2. Soft vertical metallic reflection / sheen on the right side behind the product */}
                <div className="absolute right-0 top-0 bottom-0 w-[55%] bg-gradient-to-r from-transparent via-white/[0.08] to-white/[0.18] pointer-events-none" />

                {/* 3. Top-Left: small gold coin icon, then title in crisp bold white */}
                {hasTitle && (
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={logoImg}
                        alt="CryptoSpill"
                        className="w-5 h-5 sm:w-5.5 sm:h-5.5 object-contain drop-shadow"
                      />
                      <span className="font-bold text-sm sm:text-base tracking-wide text-white truncate max-w-[180px] sm:max-w-[200px]">
                        {banner.title}
                      </span>
                    </div>
                  </div>
                )}

                {/* 4. Middle: Large bold white offerText + one-line truncated white subtitle */}
                <div className={`relative z-10 my-auto ${hasImage ? 'pr-24 sm:pr-28' : 'pr-4'}`}>
                  {hasOffer && (
                    <h3 className="text-2xl sm:text-3xl lg:text-[32px] font-black text-white tracking-tight leading-none drop-shadow-sm">
                      {banner.offerText}
                    </h3>
                  )}
                  {hasSubtitle && (
                    <p className="text-xs sm:text-[13px] text-slate-200/90 font-medium mt-1.5 drop-shadow-xs truncate max-w-full">
                      {banner.subtitle}
                    </p>
                  )}
                </div>

                {/* 5. Bottom-left chip: CS yellow squircle + rewardText */}
                <div className="relative z-10 flex items-center">
                  {hasReward && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/15 text-white text-xs font-bold shadow-sm">
                      <span className="px-1.5 py-0.5 rounded-[4px] bg-yellow-400 text-black font-black text-[10px] leading-none shrink-0">
                        CS
                      </span>
                      <span className="truncate max-w-[130px] sm:max-w-[150px]">{banner.rewardText}</span>
                    </div>
                  )}
                </div>

                {/* 6. Product image on the right: seamless blend with soft gradient mask */}
                {hasImage && (
                  <div
                    className="absolute right-0 top-0 bottom-0 w-[50%] sm:w-[54%] z-10 flex items-end justify-end pointer-events-none overflow-hidden rounded-r-[28px]"
                    style={{
                      maskImage: 'linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.25) 15%, black 50%)',
                      WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.25) 15%, black 50%)'
                    }}
                  >
                    <img
                      src={normalizeImageUrl(banner.image)}
                      alt={banner.subtitle || banner.title || 'Product'}
                      className={`w-full h-full drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)] transform transition-transform duration-500 group-hover:scale-105 ${
                        (banner.image && (banner.image.includes('apple-') || banner.image.includes('cutout')))
                          ? 'object-contain object-bottom-right'
                          : 'object-cover object-center'
                      }`}
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  </div>
                )}

                {/* 7. Bottom-right glowing yellow badge: exactly matching Image 2 */}
                {(hasBadge || liveText) && (
                  <div className="absolute right-3 bottom-3 z-20 pointer-events-none">
                    <div className="px-3.5 py-2 rounded-2xl bg-gradient-to-b from-[#FFD200] via-[#FFBA00] to-[#FFA000] text-slate-950 shadow-[0_8px_20px_rgba(245,158,11,0.45)] border border-yellow-200/60 flex flex-col items-center justify-center text-center leading-tight">
                      {hasBadge && (
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-950 block">
                          {banner.badgeText}
                        </span>
                      )}
                      <span className="text-[9px] sm:text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-950 text-[#FFD200] mt-1 tracking-wide shadow-inner block">
                        {liveText}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
