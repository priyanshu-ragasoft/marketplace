import React, { useState, useEffect, useCallback } from 'react'
import logoImg from '../../assets/logo.png'
import StoreEditProfileModal from './StoreEditProfileModal'
import StoreProfileCard from './StoreProfileCard'
import StoreChangePasswordCard from './StoreChangePasswordCard'
import StoreAnnouncementsPage from './StoreAnnouncementsPage'
import StoreBannersPage from './StoreBannersPage'
import StoreProductsPage from './StoreProductsPage'
import StoreBlogsPage from './StoreBlogsPage'
import { useRouter } from '../../router/RouterContext'
import {
  getStoreDetails,
  refreshStoreToken,
  logoutStore,
  getStoreApiBaseUrl,
  setStoreApiBaseUrl,
  changeStorePassword
} from '../../services/storeAuthService'
import {
  getStoreProfile,
  getStoreAccessToken,
  getStoreRefreshToken
} from '../../services/storeStorage'

export default function StoreDashboard({ onLogout }) {
  const { currentPath, navigate } = useRouter()
  // Navigation tabs: 'dashboard' | 'products' | 'banners' | 'announcements' | 'blogs' | 'profile' | 'password' | 'session'
  const [activeTab, setActiveTab] = useState(() => {
    if (currentPath === '/store/products' || currentPath.startsWith('/store/products')) {
      return 'products'
    }
    if (currentPath === '/store/announcements' || currentPath.startsWith('/store/announcements')) {
      return 'announcements'
    }
    if (currentPath === '/store/banners' || currentPath.startsWith('/store/banners')) {
      return 'banners'
    }
    if (currentPath === '/store/blogs' || currentPath.startsWith('/store/blogs')) {
      return 'blogs'
    }
    return 'dashboard'
  })

  // Sync tab with URL
  useEffect(() => {
    if (currentPath === '/store/products' || currentPath.startsWith('/store/products')) {
      setActiveTab('products')
    } else if (currentPath === '/store/announcements' || currentPath.startsWith('/store/announcements')) {
      setActiveTab('announcements')
    } else if (currentPath === '/store/banners' || currentPath.startsWith('/store/banners')) {
      setActiveTab('banners')
    } else if (currentPath === '/store/blogs' || currentPath.startsWith('/store/blogs')) {
      setActiveTab('blogs')
    }
  }, [currentPath])

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setIsMobileMenuOpen(false)
    if (tabId === 'products') {
      navigate('/store/products')
    } else if (tabId === 'announcements') {
      navigate('/store/announcements')
    } else if (tabId === 'banners') {
      navigate('/store/banners')
    } else if (tabId === 'blogs') {
      navigate('/store/blogs')
    } else if (
      currentPath.startsWith('/store/products') ||
      currentPath.startsWith('/store/announcements') ||
      currentPath.startsWith('/store/banners') ||
      currentPath.startsWith('/store/blogs')
    ) {
      navigate('/admin')
    }
  }
  const [profile, setProfile] = useState(() => getStoreProfile())
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [isRefreshingToken, setIsRefreshingToken] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [lastSyncTime, setLastSyncTime] = useState(() => new Date().toLocaleTimeString())
  const [endpointLatency, setEndpointLatency] = useState({
    details: '200 OK',
    profile: 'Ready',
    password: 'Ready',
    refresh: '200 OK',
    logout: 'Ready'
  })

  // Show Toast helper
  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3500)
  }

  // Fetch real profile from GET /store/auth/details
  const fetchProfile = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoadingProfile(true)
    const startTime = performance.now()
    try {
      const data = await getStoreDetails()
      const duration = Math.round(performance.now() - startTime)
      if (data) {
        setProfile(data)
        setLastSyncTime(new Date().toLocaleTimeString())
        setEndpointLatency(prev => ({ ...prev, details: `200 OK (${duration}ms)` }))
      }
    } catch (err) {
      console.warn('Could not fetch store details:', err.message)
      setEndpointLatency(prev => ({ ...prev, details: `Error: ${err.message?.slice(0, 20)}` }))
    } finally {
      if (showLoading) setIsLoadingProfile(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile(true)
  }, [fetchProfile])

  // Handle Token Refresh via POST /store/auth/refresh_token
  const handleManualRefreshToken = async () => {
    setIsRefreshingToken(true)
    const startTime = performance.now()
    try {
      await refreshStoreToken()
      const duration = Math.round(performance.now() - startTime)
      setEndpointLatency(prev => ({ ...prev, refresh: `200 OK (${duration}ms)` }))
      showToast('Store session refreshed via POST /store/auth/refresh_token')
      await fetchProfile(false)
    } catch (err) {
      showToast(err.message || 'Failed to refresh store token.')
      setEndpointLatency(prev => ({ ...prev, refresh: 'Failed' }))
      if (err.status === 403 && onLogout) {
        onLogout()
      }
    } finally {
      setIsRefreshingToken(false)
    }
  }

  // Handle Logout via POST /store/auth/logout
  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logoutStore()
    } finally {
      setIsLoggingOut(false)
      if (onLogout) {
        onLogout()
      }
    }
  }

  const accessToken = getStoreAccessToken()
  const refreshToken = getStoreRefreshToken()
  const activeBaseUrl = getStoreApiBaseUrl()

  // Real Dynamic Profile Data from Backend
  const firstName = profile?.first_name || ''
  const lastName = profile?.last_name || ''
  const fullName = profile?.full_name || `${firstName} ${lastName}`.trim() || 'Store Administrator'
  const userEmail = profile?.email || 'Authenticated Store Admin'
  const countryCode = profile?.country_code || ''
  const phoneNumber = profile?.phone_number || ''
  const greetMsg = profile?.greet_msg || ''
  const profilePic = profile?.profile_pic || ''

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    {
      id: 'products',
      label: 'Products',
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    {
      id: 'banners',
      label: 'Banners',
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'announcements',
      label: 'Announcements',
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      )
    },
    {
      id: 'blogs',
      label: 'Blog & Guides',
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      )
    },
    {
      id: 'profile',
      label: 'Store Profile',
      icon: (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
  ]

  // Real store endpoints list (strictly dynamic, NO static/dummy RSS data)
  const storeEndpoints = [
    {
      id: 'details',
      name: 'GET /store/auth/details',
      desc: `Merchant Profile Details — Last synced: ${lastSyncTime}`,
      statusText: endpointLatency.details,
      badge: 'Live',
      badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200/60',
      actionLabel: 'Sync Now',
      action: () => fetchProfile(true)
    },
    {
      id: 'profile',
      name: 'PUT /store/auth/profile',
      desc: 'Multipart/form-data profile updates & avatar upload',
      statusText: endpointLatency.profile,
      badge: 'Live',
      badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200/60',
      actionLabel: 'Edit Profile',
      action: () => setIsEditModalOpen(true)
    },
    {
      id: 'password',
      name: 'POST /store/auth/change_password',
      desc: 'Bearer authenticated credential update with password validation',
      statusText: endpointLatency.password,
      badge: 'Protected',
      badgeColor: 'text-amber-800 bg-amber-50 border-amber-200/60',
      actionLabel: 'Change Password',
      action: () => setActiveTab('password')
    },
    {
      id: 'refresh',
      name: 'POST /store/auth/refresh_token',
      desc: `Renew JWT session tokens without Bearer header — Status: ${endpointLatency.refresh}`,
      statusText: endpointLatency.refresh,
      badge: 'Live',
      badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200/60',
      actionLabel: 'Refresh Token',
      action: handleManualRefreshToken
    },
    {
      id: 'logout',
      name: 'POST /store/auth/logout',
      desc: 'Bearer authenticated session teardown & storage purge',
      statusText: endpointLatency.logout,
      badge: 'Active',
      badgeColor: 'text-slate-700 bg-slate-100 border-slate-200/60',
      actionLabel: 'Sign Out',
      action: handleLogout
    }
  ]

  return (
    <div className="h-screen h-[100dvh] w-full overflow-hidden bg-[#fafafa] flex flex-col lg:flex-row font-['Plus_Jakarta_Sans',sans-serif] text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl bg-white border border-[#D1A61B] text-slate-900 text-xs font-bold shadow-xl flex items-center gap-2.5 backdrop-blur-md animate-fadeIn">
          <span className="w-2 h-2 rounded-full bg-[#D1A61B] animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MOBILE TOP HEADER BAR (Visible only on screens < lg) */}
      <header className="lg:hidden bg-[#121212] border-b border-[#222222] px-4 py-3 flex items-center justify-between text-white shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-1 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-white transition cursor-pointer"
            aria-label="Open navigation menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="CryptoSpill" className="w-7 h-7 object-contain drop-shadow" />
            <div className="flex flex-col">
              <span className="font-sans text-sm font-extrabold leading-tight text-white">
                Crypto<span style={{ color: '#D1A61B' }}>Spill</span>
              </span>
              <span className="text-[9px] font-extrabold tracking-widest text-[#D1A61B] uppercase">
                STORE CONSOLE
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('profile')
            }}
            className="w-8 h-8 rounded-full bg-[#D1A61B] text-black font-extrabold text-xs flex items-center justify-center overflow-hidden cursor-pointer shadow-sm"
            title="View Profile"
          >
            {profilePic ? (
              <img src={profilePic} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              <span>{firstName?.[0]?.toUpperCase() || 'S'}</span>
            )}
          </button>
        </div>
      </header>

      {/* MOBILE BACKDROP OVERLAY */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR (Responsive drawer on mobile, static sidebar on lg+) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#121212] border-r border-[#222222] flex flex-col justify-between h-full p-5 text-white select-none transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } shrink-0`}
      >
        <div className="flex flex-col gap-6">
          {/* Top Logo Header */}
          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="CryptoSpill" className="w-9 h-9 object-contain drop-shadow" />
              <div className="flex flex-col">
                <span className="font-sans text-base font-extrabold leading-tight text-white tracking-tight">
                  Crypto<span style={{ color: '#D1A61B' }}>Spill</span>
                </span>
                <span className="text-[10px] font-extrabold tracking-widest text-[#D1A61B] uppercase mt-0.5">
                  STORE CONSOLE
                </span>
              </div>
            </div>

            {/* Close Button on mobile */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition cursor-pointer"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Section */}
          <nav className="flex flex-col gap-1.5 mt-2">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-3 mb-1">
              NAVIGATION
            </p>

            {navItems.map((item) => {
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
                    isActive
                      ? 'bg-[#D1A61B] text-black shadow-md shadow-[#d1a61b33]'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                  }`}
                >
                  <span className={isActive ? 'text-black' : 'text-neutral-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Bottom Sidebar: Dynamic Real Merchant User Pill & Sign Out */}
        <div className="pt-4 border-t border-[#222222] flex flex-col gap-3">
          {/* Active Gateway Indicator */}
          <div className="px-3 py-1.5 rounded-xl bg-[#181818] border border-[#262626] flex items-center justify-between text-[10px]">
            <span className="text-slate-400 font-medium">API Gateway</span>
            <span className="text-emerald-400 font-mono font-bold truncate max-w-[140px]" title={activeBaseUrl}>
              {activeBaseUrl.replace('/api/v1', '').replace('http://', '').replace('https://', '')}
            </span>
          </div>

          {/* Dynamic User Card with real backend data */}
          <div className="p-3 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full bg-[#D1A61B] text-black font-extrabold text-sm flex items-center justify-center shadow-inner overflow-hidden">
                {profilePic ? (
                  <img src={profilePic} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  <span>{firstName?.[0]?.toUpperCase() || 'S'}</span>
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#1a1a1a]" title="Online Session" />
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white truncate" title={userEmail}>{userEmail}</span>
              <span className="text-[11px] text-[#D1A61B] font-semibold">Store Admin</span>
            </div>
          </div>

          {/* Real Sign Out Button */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full py-2.5 px-3 rounded-xl bg-[#1c1c1c] hover:bg-rose-950/30 border border-[#2c2c2c] hover:border-rose-900/40 text-rose-400 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>{isLoggingOut ? 'Signing out...' : 'Sign out'}</span>
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT CANVAS - LIGHT THEME (#fafafa) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto bg-[#fafafa]">
        <main className="p-4 sm:p-6 lg:p-10 max-w-[1440px] w-full mx-auto flex flex-col gap-6">

          {/* Top Page Headline & Subheading (Matching Screenshot Header) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                {activeTab === 'dashboard'
                  ? 'Dashboard'
                  : activeTab === 'products'
                    ? 'Product Inventory'
                    : activeTab === 'banners'
                      ? 'Banners'
                      : activeTab === 'announcements'
                        ? 'Store Announcements'
                        : activeTab === 'blogs'
                          ? 'Store Blog & Guides'
                          : activeTab === 'profile'
                            ? 'Store Profile'
                            : activeTab === 'password'
                              ? 'Change Password'
                              : 'Session & Security'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
                {activeTab === 'products'
                  ? 'Manage Apple hardware items, digital cards, stock status, and storefront pricing.'
                  : activeTab === 'banners'
                    ? 'Manage homepage promo cards, pricing offers, and image assets.'
                    : activeTab === 'announcements'
                      ? 'Manage live promotion marquee & announcement offers on customer storefront.'
                      : activeTab === 'blogs'
                        ? 'Publish educational guides, escrow reports, and updates directly to the storefront blog.'
                        : 'Overview of store administrator, real-time endpoints, and security sync.'}
              </p>
            </div>
          </div>

          {/* MAIN CARD: MATCHING THE EXACT SCREENSHOT CONTAINER STRUCTURE */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Quick Products Catalog Card */}
              <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-400/30 rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm bg-white">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20 font-black">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900">Marketplace Products Catalog</h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-extrabold uppercase">
                        Storefront Live
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 max-w-xl">
                      Add, edit, and organize verified Apple hardware, prices in USD/ETH, stock quantities, and floating badges.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleTabChange('products')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm shrink-0 active:scale-[0.98]"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Manage Products</span>
                </button>
              </div>

              {/* Quick Hero Banners Carousel Card */}
              <div className="bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent border border-yellow-400/40 rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm bg-white">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-yellow-400/20 font-black">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900">Homepage Banners</h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-extrabold uppercase">
                        Live On Storefront
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 max-w-xl">
                      Manage promo cards (title, offerText, subtitle, rewardText, badgeText, image, and colors) featured on the homepage carousel.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleTabChange('banners')}
                  className="px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm shadow-yellow-400/20 shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Manage Banners</span>
                </button>
              </div>

              {/* Quick Announcement Ticker Card */}
              <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent border border-yellow-400/30 rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm bg-white">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-yellow-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-yellow-400/20 font-black">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900">Storefront Announcement Marquee</h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-extrabold uppercase">
                        Live On Store
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 max-w-xl">
                      Update the promo ticker running at the top of the store navigation with custom discounts, escrow tags, and limited-time offer codes.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleTabChange('announcements')}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm shrink-0"
                >
                  <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Manage Announcements</span>
                </button>
              </div>

              {/* Quick Blogs & Guides Card */}
              <div className="bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent border border-yellow-400/40 rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm bg-white">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20 font-black">
                    <svg className="w-6 h-6 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900">Marketplace Blog &amp; Guides</h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-extrabold uppercase">
                        Storefront Live
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 max-w-xl">
                      Publish and update educational articles, escrow explanations, buyer serial checks, and news that appear on the storefront blog page and footer.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleTabChange('blogs')}
                  className="px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm shrink-0 active:scale-[0.98]"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Manage Blogs</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB: PRODUCTS MANAGEMENT */}
          {activeTab === 'products' && (
            <StoreProductsPage onShowToast={showToast} />
          )}

          {/* TAB: BANNERS MANAGEMENT */}
          {activeTab === 'banners' && (
            <StoreBannersPage onShowToast={showToast} />
          )}

          {/* TAB 2: ANNOUNCEMENTS MANAGEMENT */}
          {activeTab === 'announcements' && (
            <StoreAnnouncementsPage onShowToast={showToast} />
          )}

          {/* TAB: BLOGS MANAGEMENT */}
          {activeTab === 'blogs' && (
            <StoreBlogsPage onShowToast={showToast} />
          )}

          {/* TAB 3: DETAILED PROFILE VIEW */}
          {activeTab === 'profile' && (
            <StoreProfileCard
              profile={profile}
              onRefreshProfile={() => fetchProfile(true)}
            />
          )}

          {/* TAB 4: CHANGE PASSWORD VIEW */}
          {activeTab === 'password' && (
            <StoreChangePasswordCard />
          )}

          {/* TAB 4: SESSION & SECURITY DIAGNOSTICS */}
          {activeTab === 'session' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">Session & Token Diagnostics</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Active authentication tokens stored strictly in isolated store storage.
                </p>
              </div>

              <div className="space-y-4">
                {/* Access Token Card */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">Access Token (Bearer Header)</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (accessToken) {
                          navigator.clipboard.writeText(accessToken)
                          showToast('Access token copied to clipboard')
                        }
                      }}
                      className="text-xs font-bold text-[#D1A61B] hover:underline cursor-pointer"
                    >
                      Copy Token
                    </button>
                  </div>
                  <p className="text-xs font-mono text-slate-600 break-all select-all bg-white p-3 rounded-lg border border-slate-200">
                    {accessToken ? `${accessToken.slice(0, 60)}...${accessToken.slice(-30)}` : 'None'}
                  </p>
                </div>

                {/* Refresh Token Card */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">Refresh Token (Body payload only)</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (refreshToken) {
                          navigator.clipboard.writeText(refreshToken)
                          showToast('Refresh token copied to clipboard')
                        }
                      }}
                      className="text-xs font-bold text-[#D1A61B] hover:underline cursor-pointer"
                    >
                      Copy Token
                    </button>
                  </div>
                  <p className="text-xs font-mono text-slate-600 break-all select-all bg-white p-3 rounded-lg border border-slate-200">
                    {refreshToken ? `${refreshToken.slice(0, 60)}...${refreshToken.slice(-30)}` : 'None'}
                  </p>
                </div>
              </div>

              {/* Gateway Switcher / Reset */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-slate-900">Current API Gateway URL</div>
                  <div className="text-xs font-mono text-slate-500">{activeBaseUrl}</div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStoreApiBaseUrl(null)
                      showToast('Gateway reset to .env default (Cloud API)')
                      window.location.reload()
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                      activeBaseUrl.includes('cryptospill.io') || activeBaseUrl.startsWith('/')
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Cloud API (.env)
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Edit Profile Modal (Multipart Upload PUT /store/auth/profile) */}
      <StoreEditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentProfile={profile}
        onProfileUpdated={(updated) => {
          if (updated) setProfile(updated)
          else fetchProfile(false)
          showToast('Store profile updated successfully!')
        }}
      />
    </div>
  )
}
