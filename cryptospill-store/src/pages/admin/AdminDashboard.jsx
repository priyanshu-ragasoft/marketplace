import React, { useState, useEffect } from 'react'
import BrandLogo from '../../components/common/BrandLogo'
import { useRouter } from '../../router/RouterContext'
import { PRODUCTS, CATEGORIES, PRESET_IMAGES, DEFAULT_BANNERS, MARKETPLACE_OFFERS, getStoredProducts, saveStoredProducts, getStoredBanners, saveStoredBanners, getStoredAnnouncements, saveStoredAnnouncements, getStoredCategories, saveStoredCategories } from '../../components/marketplace/marketplaceData'

export default function AdminDashboard({ adminUser, onAdminLogout }) {
  const { navigate } = useRouter()
  // Active Tab: 'products' | 'banners' | 'announcements'
  const [activeTab, setActiveTab] = useState('products')
  const [toastMessage, setToastMessage] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Category Management State
  const [categoryList, setCategoryList] = useState(() => getStoredCategories())
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  const handleAddCategorySubmit = (e) => {
    e?.preventDefault()
    if (!newCategoryName.trim()) return

    const trimmedName = newCategoryName.trim()
    const slug = trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || `cat-${Date.now()}`

    if (categoryList.some((c) => c.id === slug || c.name.toLowerCase() === trimmedName.toLowerCase())) {
      showToast(`Category "${trimmedName}" already exists!`)
      return
    }

    const created = { id: slug, name: trimmedName }
    const updated = [...categoryList, created]
    setCategoryList(updated)
    saveStoredCategories(updated)
    setNewCategoryName('')
    showToast(`Category "${trimmedName}" created and live on storefront!`)
  }

  const handleDeleteCategory = (categoryId) => {
    if (categoryId === 'all') {
      showToast('Cannot delete default "All Products" category.')
      return
    }
    if (!window.confirm('Delete this category?')) return
    const updated = categoryList.filter((c) => c.id !== categoryId)
    setCategoryList(updated)
    saveStoredCategories(updated)
    showToast('Category removed.')
  }

  // Auto-open Add Product modal if navigated with ?action=add-product
  useEffect(() => {
    const hash = window.location.hash || ''
    const search = window.location.search || ''
    if (hash.includes('add-product') || search.includes('add-product')) {
      setActiveTab('products')
      setIsAddProductOpen(true)
    }
  }, [])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  // ==========================================
  // 1. PRODUCTS STATE & HANDLERS
  // ==========================================
  const [productList, setProductList] = useState(() => getStoredProducts())
  const [searchProductQuery, setSearchProductQuery] = useState('')
  const [productCategoryFilter, setProductCategoryFilter] = useState('all')
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)

  const [newProduct, setNewProduct] = useState({
    title: '',
    category: 'digital',
    priceUSD: '',
    description: '',
    merchant: 'CryptoSpill Official Store',
    badge: 'NEW ARRIVAL',
    image: PRESET_IMAGES[0]?.src || '',
    customImageUrl: ''
  })

  const handleToggleStock = (id) => {
    const updated = productList.map((p) => {
      if (p.id === id) {
        const nextState = !p.inStock
        showToast(`Product "${p.title.slice(0, 24)}..." marked as ${nextState ? 'In Stock' : 'Out of Stock'}`)
        return { ...p, inStock: nextState }
      }
      return p
    })
    setProductList(updated)
    saveStoredProducts(updated)
  }

  const handleDeleteProduct = (id) => {
    if (!window.confirm('Are you sure you want to delete this product from the store catalog?')) return
    const updated = productList.filter((p) => p.id !== id)
    setProductList(updated)
    saveStoredProducts(updated)
    showToast('Product successfully removed from catalog.')
  }

  const handleAddProductSubmit = (e) => {
    e.preventDefault()
    const finalImage = newProduct.customImageUrl.trim() || newProduct.image || PRESET_IMAGES[0]?.src

    const numericPrice = parseFloat(newProduct.priceUSD) || 0
    const ethPrice = (numericPrice / 3480).toFixed(3) + ' ETH'

    const created = {
      id: Date.now(),
      title: newProduct.title.trim(),
      category: newProduct.category,
      priceUSD: numericPrice,
      priceCrypto: ethPrice,
      rating: 5.0,
      reviews: 1,
      badge: newProduct.badge || 'NEW ARRIVAL',
      badgeColor: 'bg-yellow-400 text-slate-950',
      image: finalImage,
      merchant: newProduct.merchant.trim() || 'CryptoSpill Official Store',
      inStock: true,
      description: newProduct.description.trim() || 'Official CryptoSpill escrow-protected item.',
      specs: ['Escrow Protected Smart Contract', 'Worldwide Insured Delivery', '24/7 Priority Support']
    }

    const updated = [created, ...productList]
    setProductList(updated)
    saveStoredProducts(updated)
    setIsAddProductOpen(false)
    setNewProduct({
      title: '',
      category: 'digital',
      priceUSD: '',
      description: '',
      merchant: 'CryptoSpill Official Store',
      badge: 'NEW ARRIVAL',
      image: PRESET_IMAGES[0]?.src || '',
      customImageUrl: ''
    })
    showToast(`Product "${created.title}" added to store!`)
  }

  const filteredProducts = productList.filter((p) => {
    const matchesCategory = productCategoryFilter === 'all' || p.category === productCategoryFilter
    const matchesSearch =
      !searchProductQuery.trim() ||
      p.title.toLowerCase().includes(searchProductQuery.toLowerCase()) ||
      p.merchant.toLowerCase().includes(searchProductQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // ==========================================
  // 2. HERO BANNERS STATE & HANDLERS
  // ==========================================
  const [bannerList, setBannerList] = useState(() => getStoredBanners())
  const [isAddBannerOpen, setIsAddBannerOpen] = useState(false)

  const GRADIENT_PRESETS = [
    { label: 'Dark Midnight', value: 'from-[#0f172a] via-[#1e293b] to-[#020617]' },
    { label: 'Volcano Orange', value: 'from-[#ff6f00] via-[#e65100] to-[#bf360c]' },
    { label: 'Cyber Purple', value: 'from-[#7b1fa2] via-[#6a1b9a] to-[#4a148c]' },
    { label: 'Emerald Studio', value: 'from-[#00695c] via-[#004d40] to-[#00251a]' },
    { label: 'Obsidian Black', value: 'from-[#141414] via-[#1f1f1f] to-[#000000]' }
  ]

  const [newBanner, setNewBanner] = useState({
    brandName: '',
    offerText: '30-50% Off',
    offerSub: 'On Selected Apple Flagships',
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

  const handleUpdateBannerField = (id, field, value) => {
    const updated = bannerList.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    setBannerList(updated)
    saveStoredBanners(updated)
    showToast('Banner updated successfully.')
  }

  const handleDeleteBanner = (id) => {
    if (!window.confirm('Delete this banner from the store hero carousel?')) return
    const updated = bannerList.filter((b) => b.id !== id)
    setBannerList(updated)
    saveStoredBanners(updated)
    showToast('Banner removed.')
  }

  const handleAddBannerSubmit = (e) => {
    e.preventDefault()
    const finalImage = newBanner.customImageUrl.trim() || newBanner.image || PRESET_IMAGES[0]?.src

    const created = {
      id: Date.now(),
      brandName: newBanner.brandName.trim() || 'CryptoSpill Special Sale',
      offerText: newBanner.offerText.trim() || 'Special Deal',
      offerSub: newBanner.offerSub.trim() || 'Limited Time Offer',
      cashbackText: newBanner.cashbackText.trim() || 'Upto 5% Crypto Cashback',
      cashbackTag: 'CS',
      image: finalImage,
      badgeText: newBanner.badgeText.trim() || 'FEATURED DROP',
      badgeSub: newBanner.badgeSub.trim() || 'LIVE NOW',
      gradient: newBanner.gradient,
      badgeBg: 'bg-yellow-400 text-black',
      ribbonBg: 'bg-slate-950 text-yellow-300'
    }

    const updated = [...bannerList, created]
    setBannerList(updated)
    saveStoredBanners(updated)
    setIsAddBannerOpen(false)
    setNewBanner({
      brandName: '',
      offerText: '30-50% Off',
      offerSub: 'On Selected Apple Flagships',
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
    showToast('New hero banner added to carousel!')
  }

  // ==========================================
  // 3. ANNOUNCEMENT BAR STATE & HANDLERS
  // ==========================================
  const [announcementList, setAnnouncementList] = useState(() => getStoredAnnouncements())
  const [isAddAnnouncementOpen, setIsAddAnnouncementOpen] = useState(false)

  const [newAnnouncement, setNewAnnouncement] = useState({
    tag: 'FLASH SALE',
    title: '',
    code: 'LIMITED TIME'
  })

  const TAG_PRESETS = ['FLASH SALE', 'CASHBACK', '0% ESCROW', 'AIR SHIPPING', 'EXCLUSIVE', 'PRE-ORDER', 'HOT DEAL']

  const handleUpdateAnnouncementField = (index, field, value) => {
    const updated = [...announcementList]
    updated[index] = { ...updated[index], [field]: value }
    setAnnouncementList(updated)
    saveStoredAnnouncements(updated)
    showToast('Announcement updated.')
  }

  const handleDeleteAnnouncement = (index) => {
    const updated = announcementList.filter((_, idx) => idx !== index)
    setAnnouncementList(updated)
    saveStoredAnnouncements(updated)
    showToast('Announcement deleted.')
  }

  const handleAddAnnouncementSubmit = (e) => {
    e.preventDefault()
    if (!newAnnouncement.title.trim()) return

    const created = {
      tag: newAnnouncement.tag.trim().toUpperCase() || 'OFFER',
      title: newAnnouncement.title.trim(),
      code: newAnnouncement.code.trim().toUpperCase() || 'CLAIM NOW'
    }

    const updated = [...announcementList, created]
    setAnnouncementList(updated)
    saveStoredAnnouncements(updated)
    setIsAddAnnouncementOpen(false)
    setNewAnnouncement({ tag: 'FLASH SALE', title: '', code: 'LIMITED TIME' })
    showToast('Announcement published to live ticker!')
  }

  // Navigation Items
  const navItems = [
    {
      id: 'products',
      label: 'Products & Inventory',
      badge: `${productList.length} Items`,
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    {
      id: 'banners',
      label: 'Store Hero Banners',
      badge: `${bannerList.length} Banners`,
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'announcements',
      label: 'Announcement Bar',
      badge: `${announcementList.length} Offers`,
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      )
    }
  ]

  const currentTabInfo = navItems.find((item) => item.id === activeTab) || navItems[0]

  return (
    <div className="h-screen w-full overflow-hidden bg-[#f8fafc] text-slate-800 flex font-['Plus_Jakarta_Sans',sans-serif] selection:bg-yellow-400 selection:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl bg-white border border-yellow-400 text-slate-900 text-xs font-bold shadow-xl flex items-center gap-2.5 backdrop-blur-md animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MOBILE DRAWER OVERLAY */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* DARK THEME SIDEBAR (EXACT MATCH TO SCREENSHOT 1) */}
      <aside
        className={`fixed lg:static top-0 inset-y-0 left-0 w-64 xl:w-72 bg-[#121212] border-r border-[#222222] z-40 flex flex-col justify-between shrink-0 h-screen p-5 text-white transition-transform duration-300 ease-in-out shadow-sm lg:shadow-none ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-6">
          {/* Logo Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
            <BrandLogo isDarkBackground={true} size="small" />
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-3 mb-1">
              NAVIGATION
            </p>
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id)
                  setIsSidebarOpen(false)
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-[#D1A61B] text-black font-black shadow-md shadow-[#d1a61b33]'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                      activeTab === item.id
                        ? 'bg-black text-[#D1A61B]'
                        : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer Section (Screenshot 1) */}
        <div className="pt-4 border-t border-[#222222] flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span>View live site</span>
          </button>

          {/* User Card */}
          <div className="p-3 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full bg-[#D1A61B] text-black font-bold text-xs flex items-center justify-center">
                A
              </div>
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-[#1a1a1a]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white truncate">{adminUser?.email || 'admin@cryptospill.io'}</span>
              <span className="text-[11px] text-neutral-400">Admin</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onAdminLogout}
            className="w-full py-2 px-3 rounded-xl bg-[#1c1c1c] hover:bg-rose-950/30 border border-[#2c2c2c] hover:border-rose-900/40 text-rose-400 text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
            title="Sign Out of Admin Console"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA - FIXED VIEWPORT WITH INDEPENDENT SCROLL */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#f8fafc]">
        {/* Top Header Bar - Fixed Top */}
        <header className="border-b border-slate-200/90 bg-white/95 backdrop-blur-md shrink-0 px-6 py-3.5 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer"
              aria-label="Open Sidebar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>{currentTabInfo.label}</span>
              </h1>
            </div>
          </div>
        </header>

        {/* Main Content Body - Scrollable inside viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto flex flex-col gap-6">

          {/* ==================================================== */}
          {/* TAB 1: PRODUCTS & INVENTORY */}
          {/* ==================================================== */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              {/* Header Action Bar */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs">
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <span>Products & Catalog Management</span>
                    <span className="text-xs bg-yellow-100 text-amber-900 border border-yellow-300 px-2 py-0.5 rounded-full font-mono font-bold">
                      {productList.length} Listed
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Add new products, adjust pricing, and toggle in-stock inventory in real time.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  {/* Category Filter */}
                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs focus:outline-none focus:border-yellow-400 cursor-pointer"
                  >
                    {categoryList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  {/* Manage / Add Category Button */}
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
                    title="Manage & Add Store Categories"
                  >
                    <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span>Categories ({categoryList.length - 1})</span>
                  </button>

                  {/* Search Box */}
                  <input
                    type="text"
                    placeholder="Search product title..."
                    value={searchProductQuery}
                    onChange={(e) => setSearchProductQuery(e.target.value)}
                    className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-yellow-400 w-full sm:w-56"
                  />

                  {/* Add Product Button */}
                  <button
                    type="button"
                    onClick={() => setIsAddProductOpen(true)}
                    className="px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md shadow-yellow-400/20 hover:scale-[1.02] active:scale-95"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                    <span> Add Product</span>
                  </button>
                </div>
              </div>

              {/* Product Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-yellow-400/60 shadow-xs hover:shadow-md flex flex-col justify-between transition group"
                  >
                    <div>
                      {/* Product Image Thumbnail */}
                      <div className="w-full h-40 bg-slate-50 rounded-xl flex items-center justify-center p-3 mb-3 border border-slate-100 relative overflow-hidden group-hover:border-slate-200 transition">
                        <img
                          src={p.image}
                          alt={p.title}
                          className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.src = PRESET_IMAGES[0]?.src
                          }}
                        />
                        {p.badge && (
                          <span className="absolute top-2 left-2 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-yellow-400 text-slate-950 shadow-xs">
                            {p.badge}
                          </span>
                        )}
                      </div>

                      {/* Category & Stock Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-mono uppercase bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                          {p.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.inStock
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                        >
                          {p.inStock ? 'IN STOCK' : 'OUT OF STOCK'}
                        </span>
                      </div>

                      {/* Title & Merchant */}
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-relaxed" title={p.title}>
                        {p.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 truncate">{p.merchant}</p>
                    </div>

                    {/* Bottom Controls */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-black text-slate-950 font-mono">${p.priceUSD.toFixed(2)}</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStock(p.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${p.inStock
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                            : 'bg-yellow-400 hover:bg-yellow-300 text-black font-black shadow-xs'
                            }`}
                          title="Toggle stock availability"
                        >
                          {p.inStock ? 'In Stock' : 'Out Stock'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition cursor-pointer"
                          title="Delete Product"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
                  <p className="text-slate-500 text-sm">No products match your search or filter.</p>
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: STORE HERO BANNERS */}
          {/* ==================================================== */}
          {activeTab === 'banners' && (
            <div className="space-y-6">
              {/* Header Action Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs">
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <span>Store Hero Promotional Banners</span>
                    <span className="text-xs bg-yellow-100 text-amber-900 border border-yellow-300 px-2 py-0.5 rounded-full font-mono font-bold">
                      {bannerList.length} Active
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage the hero carousel cards featured at the top of the CryptoSpill marketplace.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddBannerOpen(true)}
                  className="px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md shadow-yellow-400/20 hover:scale-[1.02] active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Banner</span>
                </button>
              </div>

              {/* Banner List & Live Previews */}
              <div className="space-y-6">
                {bannerList.map((banner, index) => (
                  <div
                    key={banner.id}
                    className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 hover:border-yellow-400/50 shadow-xs hover:shadow-md transition flex flex-col lg:flex-row gap-6 items-start justify-between"
                  >
                    {/* Live Visual Card Simulation */}
                    <div className="w-full lg:w-[420px] shrink-0">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span>Live Carousel Preview</span>
                        <span className="text-amber-600 font-mono font-bold">Card #{index + 1}</span>
                      </p>
                      <div
                        className={`w-full h-[210px] rounded-2xl bg-gradient-to-r ${banner.gradient} p-4 sm:p-5 text-white shadow-lg relative overflow-hidden flex flex-col justify-between border border-black/10`}
                      >
                        <div className="flex items-center justify-between relative z-10">
                          <span className="text-xs font-black tracking-wide uppercase text-yellow-300 drop-shadow-sm">
                            {banner.brandName}
                          </span>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-yellow-400 text-black shadow-sm">
                            {banner.badgeSub || 'LIVE NOW'}
                          </span>
                        </div>

                        {/* Banner Image in background */}
                        <div className="absolute right-2 bottom-2 w-32 h-32 flex items-center justify-center opacity-90 pointer-events-none">
                          <img
                            src={banner.image}
                            alt=""
                            className="max-h-full max-w-full object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)]"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = PRESET_IMAGES[0]?.src
                            }}
                          />
                        </div>

                        <div className="relative z-10 max-w-[65%]">
                          <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/40 text-neutral-200 mb-1">
                            {banner.badgeText}
                          </span>
                          <h3 className="text-xl font-black leading-tight text-white drop-shadow-md">
                            {banner.offerText}
                          </h3>
                          <p className="text-[11px] font-medium text-neutral-300 line-clamp-1 mt-0.5">
                            {banner.offerSub}
                          </p>
                        </div>

                        <div className="relative z-10 pt-2 flex items-center gap-2">
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-yellow-400 text-black">
                            {banner.cashbackTag || 'CS'}
                          </span>
                          <span className="text-[10px] font-bold text-yellow-200 drop-shadow-xs">
                            {banner.cashbackText}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Banner Edit Controls */}
                    <div className="flex-1 w-full space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                            Brand / Title
                          </label>
                          <input
                            type="text"
                            value={banner.brandName}
                            onChange={(e) => handleUpdateBannerField(banner.id, 'brandName', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-yellow-400 font-bold focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-amber-600 uppercase mb-1">
                            Offer Text (Big Headline)
                          </label>
                          <input
                            type="text"
                            value={banner.offerText}
                            onChange={(e) => handleUpdateBannerField(banner.id, 'offerText', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-amber-700 text-xs focus:outline-none focus:border-yellow-400 font-black focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                            Subtitle Text
                          </label>
                          <input
                            type="text"
                            value={banner.offerSub}
                            onChange={(e) => handleUpdateBannerField(banner.id, 'offerSub', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs focus:outline-none focus:border-yellow-400 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                            Cashback Offer
                          </label>
                          <input
                            type="text"
                            value={banner.cashbackText}
                            onChange={(e) => handleUpdateBannerField(banner.id, 'cashbackText', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs focus:outline-none focus:border-yellow-400 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                            Festival Badge
                          </label>
                          <input
                            type="text"
                            value={banner.badgeText}
                            onChange={(e) => handleUpdateBannerField(banner.id, 'badgeText', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs focus:outline-none focus:border-yellow-400 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                            Gradient Color
                          </label>
                          <select
                            value={banner.gradient}
                            onChange={(e) => handleUpdateBannerField(banner.id, 'gradient', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs focus:outline-none focus:border-yellow-400 cursor-pointer focus:bg-white"
                          >
                            {GRADIENT_PRESETS.map((g) => (
                              <option key={g.value} value={g.value}>
                                {g.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleDeleteBanner(banner.id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Remove Banner</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 3: ANNOUNCEMENT BAR */}
          {/* ==================================================== */}
          {activeTab === 'announcements' && (
            <div className="space-y-6">
              {/* Header Action Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs">
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <span>Announcement Marquee & Store Offers</span>
                    <span className="text-xs bg-yellow-100 text-amber-900 border border-yellow-300 px-2 py-0.5 rounded-full font-mono font-bold">
                      {announcementList.length} Active
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Updates the scrolling promotion bar shown at the very top of the store navigation.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddAnnouncementOpen(true)}
                  className="px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md shadow-yellow-400/20 hover:scale-[1.02] active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                  <span> Add Announcement</span>
                </button>
              </div>

              {/* Live Marquee Ticker Preview Box */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Live Marquee Preview (Exact Storefront Appearance)
                </p>
                <div className="relative w-full overflow-hidden bg-slate-100 border border-slate-200 rounded-xl py-2.5 px-3">
                  <div className="flex items-center gap-6 overflow-x-auto no-scrollbar whitespace-nowrap text-xs">
                    {announcementList.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 shrink-0">
                        <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded bg-yellow-400 text-black shadow-2xs">
                          {item.tag}
                        </span>
                        <span className="font-bold text-slate-900">{item.title}</span>
                        <span className="text-[9.5px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                          {item.code}
                        </span>
                        <span className="text-slate-400 ml-2">&bull;</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Announcements Editor List */}
              <div className="space-y-3">
                {announcementList.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-white border border-slate-200/90 hover:border-yellow-400/50 shadow-xs transition flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <span className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={item.tag}
                        onChange={(e) => handleUpdateAnnouncementField(index, 'tag', e.target.value.toUpperCase())}
                        className="w-28 px-2.5 py-1.5 rounded-lg bg-yellow-50 border border-yellow-300 text-amber-900 text-xs font-black uppercase tracking-wider focus:outline-none focus:border-yellow-400"
                        title="Badge Tag"
                      />
                    </div>

                    <div className="flex-1 w-full">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleUpdateAnnouncementField(index, 'title', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:border-yellow-400 focus:bg-white"
                        placeholder="Announcement headline..."
                      />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                      <input
                        type="text"
                        value={item.code}
                        onChange={(e) => handleUpdateAnnouncementField(index, 'code', e.target.value.toUpperCase())}
                        className="w-32 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-mono font-bold uppercase focus:outline-none focus:border-yellow-400 focus:bg-white"
                        placeholder="Coupon / Code"
                      />

                      <button
                        type="button"
                        onClick={() => handleDeleteAnnouncement(index)}
                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition cursor-pointer"
                        title="Delete Announcement"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>

        {/* MODAL: ADD PRODUCT */}
        {isAddProductOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <span>Add New Marketplace Product</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddProductSubmit} className="space-y-4 pt-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. iPhone 18 Foldable Titanium (512GB)"
                    value={newProduct.title}
                    onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-yellow-400 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 uppercase">
                        Category *
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="text-[10px] font-bold text-amber-600 hover:text-amber-800 underline cursor-pointer"
                      >
                        + New
                      </button>
                    </div>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-yellow-400 cursor-pointer focus:bg-white"
                    >
                      {categoryList.filter(c => c.id !== 'all').map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-amber-700 uppercase mb-1">
                      Price (USD) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="1299.00"
                      value={newProduct.priceUSD}
                      onChange={(e) => setNewProduct({ ...newProduct, priceUSD: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-950 text-xs font-mono font-bold focus:outline-none focus:border-yellow-400 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Image Selection */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Select Product Thumbnail
                  </label>
                  <div className="grid grid-cols-5 gap-2 mb-2">
                    {PRESET_IMAGES.slice(0, 5).map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewProduct({ ...newProduct, image: img.src, customImageUrl: '' })}
                        className={`p-1.5 rounded-xl bg-slate-50 border flex items-center justify-center h-14 cursor-pointer transition ${newProduct.image === img.src && !newProduct.customImageUrl
                          ? 'border-yellow-400 ring-2 ring-yellow-400/40 bg-yellow-50/50'
                          : 'border-slate-200 hover:border-slate-300'
                          }`}
                        title={img.label}
                      >
                        <img src={img.src} alt="" className="max-h-full max-w-full object-contain" />
                      </button>
                    ))}
                  </div>

                  <input
                    type="url"
                    placeholder="Or enter custom image URL (optional)..."
                    value={newProduct.customImageUrl}
                    onChange={(e) => setNewProduct({ ...newProduct, customImageUrl: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-yellow-400 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Merchant Storefront
                    </label>
                    <input
                      type="text"
                      value={newProduct.merchant}
                      onChange={(e) => setNewProduct({ ...newProduct, merchant: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-yellow-400 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Badge Text
                    </label>
                    <input
                      type="text"
                      placeholder="NEW ARRIVAL"
                      value={newProduct.badge}
                      onChange={(e) => setNewProduct({ ...newProduct, badge: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-amber-900 font-bold text-xs focus:outline-none focus:border-yellow-400 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Product highlights, warranty details, and specifications..."
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-yellow-400 focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddProductOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 text-xs font-black cursor-pointer shadow-md shadow-yellow-400/20"
                  >
                    Publish Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: MANAGE & ADD STORE CATEGORIES */}
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <span>Manage Store Categories</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Add New Category Form */}
              <form onSubmit={handleAddCategorySubmit} className="pt-4 space-y-3">
                <label className="block text-[11px] font-bold text-slate-700 uppercase">
                  Add New Category
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. MacBook Pro, AirPods, Gaming..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-yellow-400 focus:bg-white font-medium"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs transition shadow-sm cursor-pointer shrink-0"
                  >
                    + Add
                  </button>
                </div>
              </form>

              {/* Current Categories List */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Active Categories ({categoryList.length})
                  </p>
                  <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Live in Storefront
                  </span>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                  {categoryList.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{cat.name}</span>
                        <span className="text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {cat.id}
                        </span>
                      </div>
                      {cat.id !== 'all' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Category"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: ADD HERO BANNER */}
        {isAddBannerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <span>Create New Hero Promotional Banner</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddBannerOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddBannerSubmit} className="space-y-4 pt-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Brand / Festival Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CryptoSpill Apple Mega Days"
                    value={newBanner.brandName}
                    onChange={(e) => setNewBanner({ ...newBanner, brandName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-yellow-400 font-bold focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-700 uppercase mb-1">
                      Offer Text (Big Headline) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 40-50% Off"
                      value={newBanner.offerText}
                      onChange={(e) => setNewBanner({ ...newBanner, offerText: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-amber-700 text-xs font-black focus:outline-none focus:border-yellow-400 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Subtitle *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. On iPhone 18 Pro Series"
                      value={newBanner.offerSub}
                      onChange={(e) => setNewBanner({ ...newBanner, offerSub: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs focus:outline-none focus:border-yellow-400 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Cashback Text
                    </label>
                    <input
                      type="text"
                      placeholder="Upto 8% Crypto Cashback"
                      value={newBanner.cashbackText}
                      onChange={(e) => setNewBanner({ ...newBanner, cashbackText: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs focus:outline-none focus:border-yellow-400 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Theme Gradient
                    </label>
                    <select
                      value={newBanner.gradient}
                      onChange={(e) => setNewBanner({ ...newBanner, gradient: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs focus:outline-none focus:border-yellow-400 cursor-pointer focus:bg-white"
                    >
                      {GRADIENT_PRESETS.map((g) => (
                        <option key={g.value} value={g.value}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Banner Image Selection */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Banner Featured Hardware Asset
                  </label>
                  <div className="grid grid-cols-5 gap-2 mb-2">
                    {PRESET_IMAGES.slice(0, 5).map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewBanner({ ...newBanner, image: img.src, customImageUrl: '' })}
                        className={`p-1.5 rounded-xl bg-slate-50 border flex items-center justify-center h-14 cursor-pointer transition ${newBanner.image === img.src && !newBanner.customImageUrl
                          ? 'border-yellow-400 ring-2 ring-yellow-400/40 bg-yellow-50/50'
                          : 'border-slate-200 hover:border-slate-300'
                          }`}
                        title={img.label}
                      >
                        <img src={img.src} alt="" className="max-h-full max-w-full object-contain" />
                      </button>
                    ))}
                  </div>

                  <input
                    type="url"
                    placeholder="Or enter custom image URL..."
                    value={newBanner.customImageUrl}
                    onChange={(e) => setNewBanner({ ...newBanner, customImageUrl: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-yellow-400 focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddBannerOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 text-xs font-black cursor-pointer shadow-md shadow-yellow-400/20"
                  >
                    Add to Carousel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ADD ANNOUNCEMENT */}
        {isAddAnnouncementOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <span>Add Store Announcement</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddAnnouncementOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddAnnouncementSubmit} className="space-y-4 pt-4">
                <div>
                  <label className="block text-[11px] font-bold text-amber-700 uppercase mb-1">
                    Announcement Tag *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="FLASH SALE"
                    value={newAnnouncement.tag}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, tag: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-yellow-50 border border-yellow-300 text-amber-900 text-xs font-black uppercase focus:outline-none focus:border-yellow-400"
                  />
                  {/* Preset chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {TAG_PRESETS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewAnnouncement({ ...newAnnouncement, tag: t })}
                        className="text-[9.5px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold transition cursor-pointer"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Announcement Headline / Message *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Up to 50% Off on iPhone 18 Pro Max & Pro Series"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-yellow-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Coupon Code / Action Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CODE: SPILL8 or LIMITED TIME"
                    value={newAnnouncement.code}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-mono font-bold uppercase focus:outline-none focus:border-yellow-400 focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddAnnouncementOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 text-xs font-black cursor-pointer shadow-md shadow-yellow-400/20"
                  >
                    Publish to Ticker
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Fixed Bottom Footer */}
        <footer className="border-t border-slate-200 py-3 px-6 text-center text-xs text-slate-500 shrink-0 bg-white z-20">
          <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>CryptoSpill Store Admin Console • Real-Time Catalog & Merchandising</span>

          </div>
        </footer>
      </div>
    </div>
  )
}
