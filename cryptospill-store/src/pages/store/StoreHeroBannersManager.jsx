import React, { useState, useEffect } from 'react'
import logoImg from '../../assets/logo.png'
import {
  getStoredBanners,
  saveStoredBanners,
  DEFAULT_BANNERS,
  PRESET_IMAGES
} from '../../components/marketplace/marketplaceData'
import { normalizeImageUrl } from '../../utils/imageUrl'

export const GRADIENT_PRESETS = [
  { label: 'Dark Midnight', value: 'from-[#0f172a] via-[#1e293b] to-[#020617]', color: '#0f172a' },
  { label: 'Volcano Orange', value: 'from-[#ff6f00] via-[#e65100] to-[#bf360c]', color: '#ff6f00' },
  { label: 'Cyber Purple', value: 'from-[#7b1fa2] via-[#6a1b9a] to-[#4a148c]', color: '#7b1fa2' },
  { label: 'Emerald Studio', value: 'from-[#00695c] via-[#004d40] to-[#00251a]', color: '#00695c' },
  { label: 'Obsidian Black', value: 'from-[#141414] via-[#1f1f1f] to-[#000000]', color: '#141414' },
  { label: 'Royal Sapphire', value: 'from-[#1e3a8a] via-[#172554] to-[#0f172a]', color: '#1e3a8a' },
  { label: 'Ruby Crimson', value: 'from-[#991b1b] via-[#7f1d1d] to-[#450a0a]', color: '#991b1b' },
]

export default function StoreHeroBannersManager({ onShowToast }) {
  const [banners, setBanners] = useState(() => getStoredBanners())
  const [editingId, setEditingId] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // New Banner Form State
  const [newBanner, setNewBanner] = useState({
    brandName: 'CryptoSpill Special Fest',
    offerText: '30-50% Off',
    offerSub: 'On Flagship Devices & Hardware',
    cashbackText: 'Upto 8% Crypto Cashback',
    cashbackTag: 'CS',
    image: PRESET_IMAGES[0]?.src || '',
    customImageUrl: '',
    badgeText: 'THE BIG SPILL DAYS',
    badgeSub: 'LIVE NOW',
    gradient: GRADIENT_PRESETS[0].value,
    badgeBg: 'bg-yellow-400 text-black',
    ribbonBg: 'bg-slate-950 text-yellow-300'
  })

  // Sync state if storage changes externally
  useEffect(() => {
    const handleSync = () => {
      setBanners(getStoredBanners())
    }
    window.addEventListener('cryptospill_banners_updated', handleSync)
    window.addEventListener('storage', handleSync)
    return () => {
      window.removeEventListener('cryptospill_banners_updated', handleSync)
      window.removeEventListener('storage', handleSync)
    }
  }, [])

  const notify = (msg) => {
    if (onShowToast) onShowToast(msg)
  }

  // Handle inline change for a specific banner field
  const handleFieldChange = (id, field, value) => {
    const updated = banners.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    setBanners(updated)
    setHasUnsavedChanges(true)
  }

  // Save changes to storage and trigger live broadcast
  const handleSaveAll = () => {
    saveStoredBanners(banners)
    setHasUnsavedChanges(false)
    notify('Hero banners saved & live on storefront carousel!')
  }

  // Delete banner
  const handleDelete = (id) => {
    if (banners.length <= 1) {
      notify('At least one hero banner is recommended for the store carousel.')
    }
    if (!window.confirm('Are you sure you want to remove this banner from the hero carousel?')) return

    const updated = banners.filter((b) => b.id !== id)
    setBanners(updated)
    saveStoredBanners(updated)
    notify('Banner removed from live carousel.')
  }

  // Move banner order (reorder in carousel)
  const handleMoveOrder = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= banners.length) return

    const updated = [...banners]
    const temp = updated[index]
    updated[index] = updated[targetIndex]
    updated[targetIndex] = temp

    setBanners(updated)
    saveStoredBanners(updated)
    notify('Banner order updated.')
  }

  // Handle image upload from file
  const handleFileUpload = (e, isNewModal = false, bannerId = null) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      if (isNewModal) {
        setNewBanner((prev) => ({ ...prev, image: dataUrl, customImageUrl: '' }))
      } else if (bannerId) {
        handleFieldChange(bannerId, 'image', dataUrl)
      }
    }
    reader.readAsDataURL(file)
  }

  // Add new banner submit
  const handleAddSubmit = (e) => {
    e.preventDefault()
    const finalImage = newBanner.customImageUrl.trim() || newBanner.image || PRESET_IMAGES[0]?.src

    const created = {
      id: Date.now(),
      brandName: newBanner.brandName.trim() || 'CryptoSpill Special Sale',
      offerText: newBanner.offerText.trim() || 'Special Deal',
      offerSub: newBanner.offerSub.trim() || 'Limited Time Offer',
      cashbackText: newBanner.cashbackText.trim() || 'Upto 5% Crypto Cashback',
      cashbackTag: (newBanner.cashbackTag || 'CS').toUpperCase(),
      image: finalImage,
      badgeText: newBanner.badgeText.trim() || 'THE BIG SPILL DAYS',
      badgeSub: (newBanner.badgeSub || 'LIVE NOW').toUpperCase(),
      gradient: newBanner.gradient,
      badgeBg: 'bg-yellow-400 text-black',
      ribbonBg: 'bg-slate-950 text-yellow-300'
    }

    const updated = [...banners, created]
    setBanners(updated)
    saveStoredBanners(updated)
    setIsAddModalOpen(false)
    notify('New promo banner added to storefront carousel!')

    // Reset modal form
    setNewBanner({
      brandName: 'CryptoSpill Special Fest',
      offerText: '30-50% Off',
      offerSub: 'On Flagship Devices & Hardware',
      cashbackText: 'Upto 8% Crypto Cashback',
      cashbackTag: 'CS',
      image: PRESET_IMAGES[0]?.src || '',
      customImageUrl: '',
      badgeText: 'THE BIG SPILL DAYS',
      badgeSub: 'LIVE NOW',
      gradient: GRADIENT_PRESETS[0].value,
      badgeBg: 'bg-yellow-400 text-black',
      ribbonBg: 'bg-slate-950 text-yellow-300'
    })
  }

  // Reset to default presets
  const handleResetDefaults = () => {
    if (window.confirm('Reset hero banners to default CryptoSpill festival cards?')) {
      setBanners(DEFAULT_BANNERS)
      saveStoredBanners(DEFAULT_BANNERS)
      setHasUnsavedChanges(false)
      notify('Reset banners to default festival presets.')
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn font-['Plus_Jakarta_Sans',sans-serif] text-slate-800">
      {/* Top Action & Control Header */}
      <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Hero Promo Banners Carousel
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-yellow-100 border border-yellow-300 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider">
              {banners.length} Cards Active
            </span>
            {hasUnsavedChanges && (
              <span className="px-2 py-0.5 rounded-full bg-rose-100 border border-rose-300 text-rose-800 text-[10px] font-bold animate-pulse">
                Unsaved changes
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Update and reorder the high-impact promotional carousel banners featured on the storefront homepage. Changes sync live instantly.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {hasUnsavedChanges && (
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-sm shadow-emerald-600/25 active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Save Changes</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-sm shadow-yellow-400/25 active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Banner</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            title="Reset to default CryptoSpill festival banners"
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Banner Cards Management List */}
      <div className="space-y-6">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 hover:border-yellow-400/60 shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row gap-6 items-start justify-between"
          >
            {/* 1. LIVE CAROUSEL PREVIEW CARD (Exact visual replica of homepage card) */}
            <div className="w-full lg:w-[410px] shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  Live Card Preview
                </span>
                <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                  Card #{index + 1}
                </span>
              </div>

              {/* Exact Card Rendering Container Matching Reference Image 2 */}
              <div
                className={`group relative w-full h-[215px] sm:h-[230px] rounded-[28px] bg-gradient-to-r ${banner.gradient} p-4 sm:p-5 text-white shadow-xl overflow-hidden border border-white/10 flex flex-col justify-between select-none`}
              >
                {/* 1. Ambient dots pattern */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-80"
                  style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.18) 1.2px, transparent 1.2px)',
                    backgroundSize: '16px 16px'
                  }}
                />

                {/* 2. Soft vertical metallic reflection on the right */}
                <div className="absolute right-0 top-0 bottom-0 w-[55%] bg-gradient-to-r from-transparent via-white/[0.08] to-white/[0.18] pointer-events-none" />

                {/* 3. Top Row: Brand & Logo */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img src={logoImg} alt="CryptoSpill" className="w-5 h-5 sm:w-5.5 sm:h-5.5 object-contain drop-shadow" />
                    <span className="font-bold text-sm sm:text-base tracking-wide text-white truncate max-w-[200px]">
                      {banner.brandName}
                    </span>
                  </div>
                </div>

                {/* 4. Middle Row: Offer Headline */}
                <div className="relative z-10 my-auto pr-24 sm:pr-28">
                  <h3 className="text-2xl sm:text-3xl lg:text-[32px] font-black text-white tracking-tight leading-none drop-shadow-sm">
                    {banner.offerText}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-slate-200/90 font-medium mt-1.5 drop-shadow-xs truncate max-w-full">
                    {banner.offerSub}
                  </p>
                </div>

                {/* 5. Bottom Row: Cashback Pill */}
                <div className="relative z-10 flex items-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/15 text-white text-xs font-bold shadow-sm">
                    <span className="px-1.5 py-0.5 rounded-[4px] bg-yellow-400 text-black font-black text-[10px] leading-none shrink-0">
                      {banner.cashbackTag || 'CS'}
                    </span>
                    <span className="truncate max-w-[130px] sm:max-w-[150px]">{banner.cashbackText}</span>
                  </div>
                </div>

                {/* 6. Right Side: Product Showcase Image with seamless gradient mask */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-[50%] sm:w-[54%] z-10 flex items-end justify-end pointer-events-none overflow-hidden rounded-r-[28px]"
                  style={{
                    maskImage: 'linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.25) 15%, black 50%)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.25) 15%, black 50%)'
                  }}
                >
                  <img
                    src={normalizeImageUrl(banner.image)}
                    alt={banner.offerSub}
                    className={`w-full h-full drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)] ${
                      (banner.image && (banner.image.includes('apple-') || banner.image.includes('cutout')))
                        ? 'object-contain object-bottom-right'
                        : 'object-cover object-center'
                    }`}
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = PRESET_IMAGES[0]?.src
                    }}
                  />
                </div>

                {/* 7. Bottom-right Glowing Yellow Badge */}
                <div className="absolute right-3 bottom-3 z-20 pointer-events-none">
                  <div className="px-3.5 py-2 rounded-2xl bg-gradient-to-b from-[#FFD200] via-[#FFBA00] to-[#FFA000] text-slate-950 shadow-[0_8px_20px_rgba(245,158,11,0.45)] border border-yellow-200/60 flex flex-col items-center justify-center text-center leading-tight">
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-950 block">
                      {banner.badgeText}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-950 text-[#FFD200] mt-1 tracking-wide shadow-inner block">
                      {banner.badgeSub || 'LIVE NOW'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Controls & Quick Actions */}
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMoveOrder(index, 'up')}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold bg-slate-50 hover:bg-slate-100 disabled:opacity-30 cursor-pointer flex items-center gap-1 text-slate-700"
                    title="Move banner earlier in carousel"
                  >
                    <span>▲</span>
                    <span>Move Up</span>
                  </button>
                  <button
                    type="button"
                    disabled={index === banners.length - 1}
                    onClick={() => handleMoveOrder(index, 'down')}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold bg-slate-50 hover:bg-slate-100 disabled:opacity-30 cursor-pointer flex items-center gap-1 text-slate-700"
                    title="Move banner later in carousel"
                  >
                    <span>▼</span>
                    <span>Move Down</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(banner.id)}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete</span>
                </button>
              </div>
            </div>

            {/* 2. BANNER EDIT CONTROLS */}
            <div className="flex-1 w-full space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Brand / Event Title */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Brand Header Title
                  </label>
                  <input
                    type="text"
                    value={banner.brandName}
                    onChange={(e) => handleFieldChange(banner.id, 'brandName', e.target.value)}
                    placeholder="CryptoSpill Apple Fest"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-bold focus:outline-none focus:border-yellow-400 focus:bg-white transition-colors"
                  />
                </div>

                {/* Offer Headline (Big Text) */}
                <div>
                  <label className="block text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-1">
                    Offer Headline (Big Text)
                  </label>
                  <input
                    type="text"
                    value={banner.offerText}
                    onChange={(e) => handleFieldChange(banner.id, 'offerText', e.target.value)}
                    placeholder="30-50% Off / Upto 45% Off"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-amber-800 font-black focus:outline-none focus:border-yellow-400 focus:bg-white transition-colors"
                  />
                </div>

                {/* Subtitle Text */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Subtitle / Devices
                  </label>
                  <input
                    type="text"
                    value={banner.offerSub}
                    onChange={(e) => handleFieldChange(banner.id, 'offerSub', e.target.value)}
                    placeholder="On iPhone 18 Pro Max & Pro Series"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-yellow-400 focus:bg-white transition-colors"
                  />
                </div>

                {/* Cashback Offer Pill Text */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Cashback / Benefit Text
                  </label>
                  <input
                    type="text"
                    value={banner.cashbackText}
                    onChange={(e) => handleFieldChange(banner.id, 'cashbackText', e.target.value)}
                    placeholder="Upto 8% Crypto Cashback"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-yellow-400 focus:bg-white transition-colors"
                  />
                </div>

                {/* Bottom Overlay Badge Title */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Festival Badge Text
                  </label>
                  <input
                    type="text"
                    value={banner.badgeText}
                    onChange={(e) => handleFieldChange(banner.id, 'badgeText', e.target.value)}
                    placeholder="THE BIG SPILL DAYS"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-yellow-400 focus:bg-white transition-colors"
                  />
                </div>

                {/* Bottom Overlay Badge Subtitle */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Badge Status Tag
                  </label>
                  <input
                    type="text"
                    value={banner.badgeSub || 'LIVE NOW'}
                    onChange={(e) => handleFieldChange(banner.id, 'badgeSub', e.target.value)}
                    placeholder="LIVE NOW / LIMITED DROP"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-yellow-400 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Gradient Theme Presets */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Gradient Background Theme
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {GRADIENT_PRESETS.map((grad) => {
                    const isSelected = banner.gradient === grad.value
                    return (
                      <button
                        key={grad.label}
                        type="button"
                        onClick={() => handleFieldChange(banner.id, 'gradient', grad.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${isSelected
                            ? 'border-yellow-400 ring-2 ring-yellow-400/30 text-slate-950 bg-yellow-50'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                          }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: grad.color }} />
                        <span>{grad.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Image Picker from Presets or File Upload */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Card Product Image
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {PRESET_IMAGES.slice(0, 6).map((imgObj) => {
                    const isSelected = banner.image === imgObj.src
                    return (
                      <button
                        key={imgObj.label}
                        type="button"
                        onClick={() => handleFieldChange(banner.id, 'image', imgObj.src)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-2 cursor-pointer border ${isSelected
                            ? 'border-yellow-400 bg-yellow-50 font-bold text-slate-900 ring-1 ring-yellow-400'
                            : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                          }`}
                      >
                        <img src={imgObj.src} alt={imgObj.label} className="w-5 h-5 object-contain" />
                        <span>{imgObj.label}</span>
                      </button>
                    )
                  })}

                  {/* Upload Image Button */}
                  <label className="px-3 py-1.5 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-50 transition cursor-pointer flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, false, banner.id)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ==================================================== */}
      {/* ADD NEW BANNER MODAL */}
      {/* ==================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-fadeIn"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Add New Promo Carousel Banner</h3>
                <p className="text-xs text-slate-500">
                  Configure card typography, colors, and showcase image for the storefront hero section.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-5">
              {/* Live Preview Inside Modal */}
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Live Card Preview
                </p>
                <div
                  className={`w-full h-[215px] sm:h-[230px] rounded-[28px] bg-gradient-to-r ${newBanner.gradient} p-4 sm:p-5 text-white shadow-xl relative overflow-hidden flex flex-col justify-between border border-white/10 select-none`}
                >
                  {/* Ambient dots pattern */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-80"
                    style={{
                      backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.18) 1.2px, transparent 1.2px)',
                      backgroundSize: '16px 16px'
                    }}
                  />

                  {/* Soft vertical metallic reflection on the right */}
                  <div className="absolute right-0 top-0 bottom-0 w-[55%] bg-gradient-to-r from-transparent via-white/[0.08] to-white/[0.18] pointer-events-none" />

                  <div className="flex items-center gap-2.5 relative z-10">
                    <img src={logoImg} alt="CryptoSpill" className="w-5 h-5 sm:w-5.5 sm:h-5.5 object-contain drop-shadow" />
                    <span className="font-bold text-sm sm:text-base tracking-wide text-white truncate max-w-[200px]">
                      {newBanner.brandName || 'CryptoSpill Apple Fest'}
                    </span>
                  </div>

                  <div className="relative z-10 my-auto pr-24 sm:pr-28">
                    <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none drop-shadow-sm">
                      {newBanner.offerText || '30–50% Off'}
                    </h3>
                    <p className="text-xs sm:text-[13px] text-slate-200/90 font-medium mt-1.5 drop-shadow-xs truncate max-w-full">
                      {newBanner.offerSub || 'On iPhone 18 Pro Max & Pro...'}
                    </p>
                  </div>

                  <div className="relative z-10 flex items-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/15 text-white text-xs font-bold shadow-sm">
                      <span className="px-1.5 py-0.5 rounded-[4px] bg-yellow-400 text-black font-black text-[10px] leading-none shrink-0">
                        {newBanner.cashbackTag || 'CS'}
                      </span>
                      <span className="truncate max-w-[130px] sm:max-w-[150px]">{newBanner.cashbackText || 'Upto 8% Crypto Cashback'}</span>
                    </div>
                  </div>

                  <div
                    className="absolute right-0 top-0 bottom-0 w-[50%] sm:w-[54%] z-10 flex items-end justify-end pointer-events-none overflow-hidden rounded-r-[28px]"
                    style={{
                      maskImage: 'linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.25) 15%, black 50%)',
                      WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.25) 15%, black 50%)'
                    }}
                  >
                    <img
                      src={normalizeImageUrl(newBanner.customImageUrl.trim() || newBanner.image || PRESET_IMAGES[0]?.src)}
                      alt=""
                      className="h-full w-full object-cover object-center drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)]"
                    />
                  </div>

                  <div className="absolute right-3 bottom-3 z-20 pointer-events-none">
                    <div className="px-3.5 py-2 rounded-2xl bg-gradient-to-b from-[#FFD200] via-[#FFBA00] to-[#FFA000] text-slate-950 shadow-[0_8px_20px_rgba(245,158,11,0.45)] border border-yellow-200/60 flex flex-col items-center justify-center text-center leading-tight">
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-950 block">
                        {newBanner.badgeText || 'THE BIG SPILL DAYS'}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-950 text-[#FFD200] mt-1 tracking-wide shadow-inner block">
                        {newBanner.badgeSub || 'LIVE NOW'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Brand Header Title
                  </label>
                  <input
                    type="text"
                    value={newBanner.brandName}
                    onChange={(e) => setNewBanner({ ...newBanner, brandName: e.target.value })}
                    required
                    placeholder="CryptoSpill Apple Fest"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-yellow-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-700 uppercase mb-1">
                    Offer Headline (Big Text)
                  </label>
                  <input
                    type="text"
                    value={newBanner.offerText}
                    onChange={(e) => setNewBanner({ ...newBanner, offerText: e.target.value })}
                    required
                    placeholder="30-50% Off"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-black text-amber-800 focus:outline-none focus:border-yellow-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Subtitle / Devices
                  </label>
                  <input
                    type="text"
                    value={newBanner.offerSub}
                    onChange={(e) => setNewBanner({ ...newBanner, offerSub: e.target.value })}
                    required
                    placeholder="On iPhone 18 Pro Max & Pro Series"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-yellow-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Cashback Benefit Text
                  </label>
                  <input
                    type="text"
                    value={newBanner.cashbackText}
                    onChange={(e) => setNewBanner({ ...newBanner, cashbackText: e.target.value })}
                    placeholder="Upto 8% Crypto Cashback"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-yellow-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Festival Badge Text
                  </label>
                  <input
                    type="text"
                    value={newBanner.badgeText}
                    onChange={(e) => setNewBanner({ ...newBanner, badgeText: e.target.value })}
                    placeholder="THE BIG SPILL DAYS"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-yellow-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Badge Status Tag
                  </label>
                  <input
                    type="text"
                    value={newBanner.badgeSub}
                    onChange={(e) => setNewBanner({ ...newBanner, badgeSub: e.target.value })}
                    placeholder="LIVE NOW"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-yellow-400 focus:bg-white"
                  />
                </div>
              </div>

              {/* Gradient Preset Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Gradient Theme
                </label>
                <div className="flex flex-wrap gap-2">
                  {GRADIENT_PRESETS.map((grad) => (
                    <button
                      key={grad.label}
                      type="button"
                      onClick={() => setNewBanner({ ...newBanner, gradient: grad.value })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${newBanner.gradient === grad.value
                          ? 'border-yellow-400 ring-2 ring-yellow-400/30 text-slate-950 bg-yellow-50'
                          : 'border-slate-200 text-slate-700 bg-white'
                        }`}
                    >
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: grad.color }} />
                      <span>{grad.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preset Image Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Select Product Image
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_IMAGES.map((imgObj) => (
                    <button
                      key={imgObj.label}
                      type="button"
                      onClick={() => setNewBanner({ ...newBanner, image: imgObj.src, customImageUrl: '' })}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-2 cursor-pointer border ${newBanner.image === imgObj.src && !newBanner.customImageUrl
                          ? 'border-yellow-400 bg-yellow-50 font-bold text-slate-900 ring-1 ring-yellow-400'
                          : 'border-slate-200 text-slate-600 bg-white'
                        }`}
                    >
                      <img src={imgObj.src} alt={imgObj.label} className="w-5 h-5 object-contain" />
                      <span>{imgObj.label}</span>
                    </button>
                  ))}

                  <label className="px-3 py-1.5 rounded-xl border border-dashed border-slate-300 text-xs font-bold text-slate-600 bg-slate-50 transition cursor-pointer flex items-center gap-1.5">
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, true)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-extrabold text-xs uppercase cursor-pointer shadow-sm shadow-yellow-400/25"
                >
                  Add Banner To Carousel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
