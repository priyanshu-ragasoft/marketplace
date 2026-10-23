import React, { useState, useEffect, useRef } from 'react'
import BrandLogo from '../common/BrandLogo'
import { useRouter } from '../../router/RouterContext'
import { getPublicActiveAnnouncements } from '../../services/storeAnnouncementService'

export default function MarketNavbar({
  searchQuery,
  setSearchQuery,
  cartCount,
  setIsCartOpen,
  isLoggedIn,
  currentUser,
  onOpenLogin,
  onLogout
}) {
  const { navigate } = useRouter()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileMenuRef = useRef(null)
  const [activeAnnouncements, setActiveAnnouncements] = useState([])

  // Fetch active announcements from public endpoint GET /store/announcement/websidelist
  useEffect(() => {
    let isMounted = true
    const loadAnnouncements = () => {
      getPublicActiveAnnouncements()
        .then((data) => {
          if (isMounted) {
            const list = Array.isArray(data) ? data : []
            setActiveAnnouncements(list)
          }
        })
        .catch((err) => {
          console.warn('Could not fetch active announcements:', err)
          if (isMounted) setActiveAnnouncements([])
        })
    }

    loadAnnouncements()
    window.addEventListener('cryptospill_announcements_updated', loadAnnouncements)
    return () => {
      isMounted = false
      window.removeEventListener('cryptospill_announcements_updated', loadAnnouncements)
    }
  }, [])

  // Auto-close profile dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!isProfileOpen) return

    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isProfileOpen])

  // Derive user and wallet data from currentUser (returned from API)
  const userWalletAddress = currentUser?.wallet_address || ''
  const shortWallet = userWalletAddress && userWalletAddress.startsWith('0x') && userWalletAddress.length > 10
    ? `${userWalletAddress.slice(0, 6)}...${userWalletAddress.slice(-4)}`
    : (userWalletAddress || '')

  const rawName = (currentUser?.display_name || currentUser?.name || currentUser?.user_name || currentUser?.username || 'Shopper').trim()
  const userDisplayName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : 'Shopper'
  const userUsername = currentUser?.user_name || currentUser?.username || (currentUser?.email ? currentUser.email.split('@')[0] : 'shopper')

  // Dynamic Avatar initials from name
  const avatarInitials = (() => {
    const name = (userDisplayName || '').trim()
    const parts = name.split(/\s+/)
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase() || 'CS'
  })()

  // Reward Points from API (reward_points in response, e.g. 3001)
  const rawRewards = currentUser?.reward_points !== undefined
    ? currentUser.reward_points
    : 0
  const formattedRewards = Number(rawRewards).toLocaleString()

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      {/* Public Homepage Banner: GET /announcements/active. If data is an empty array, hide the banner. */}
      {activeAnnouncements && activeAnnouncements.length > 0 && (
        <div className="relative bg-slate-50 border-b border-slate-200/80 py-1.5 overflow-hidden select-none flex items-center">
          {/* Fixed Left Announcement Badge */}
          <div className="absolute left-0 top-0 bottom-0 z-20 px-2.5 sm:px-3.5 bg-slate-50 border-r border-slate-200 flex items-center gap-1.5 text-slate-900 font-black text-[10px] sm:text-[11px] shadow-xs shrink-0">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-yellow-400 shadow-[0_0_6px_#facc15] animate-ping shrink-0" style={{ backgroundColor: '#facc15' }} />
            <span>ANNOUNCEMENTS</span>
          </div>

          {/* Soft edge fade overlays */}
          <div className="absolute left-[98px] sm:left-[130px] top-0 bottom-0 w-6 sm:w-8 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />

          {/* Running Animated Track with Active Announcements */}
          <div className="ticker-track flex items-center gap-6 sm:gap-8 pl-32 sm:pl-40 text-[10.5px] sm:text-[11.5px] font-medium text-slate-700">
            {[...activeAnnouncements, ...activeAnnouncements].map((item, idx) => (
              <div key={`${item._id || item.message}-${idx}`} className="flex items-center gap-2 whitespace-nowrap">
                {/* If linkUrl is not empty, render message as link; if empty, render plain text */}
                {item.linkUrl && item.linkUrl.trim() ? (
                  <a
                    href={item.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-slate-900 hover:text-amber-800 hover:underline inline-flex items-center gap-1 transition-colors"
                  >
                    <span>{item.message}</span>
                    <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : (
                  <span className="font-bold text-slate-900">{item.message}</span>
                )}
                <span className="text-slate-300 ml-3 sm:ml-4">&bull;</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4">

        {/* Brand Logo with Yellow SPILL text */}
        <div className="shrink-0 flex items-center">
          <BrandLogo size="default" isDarkBackground={false} />
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-xl mx-2 sm:mx-6 hidden md:block">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Apple Hardware, Gift Cards, AppleCare+, Software..."
              className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-sm text-slate-900 placeholder-slate-400 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/20 outline-none transition-all"
            />
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold bg-slate-200 rounded-full w-4 h-4 flex items-center justify-center cursor-pointer"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">

          {/* REWARDS Pill (Modern sleek counter) */}
          {isLoggedIn && (
            <div 
              className="hidden sm:flex items-center gap-2.5 px-3 h-10 rounded-xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 hover:border-slate-300/80 transition-all select-none cursor-default shadow-xs"
              title={`${formattedRewards} Spill Reward Points`}
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center shadow-xs shrink-0 font-black">
                <svg className="w-3.5 h-3.5 text-slate-950" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="text-left flex flex-col justify-center leading-none">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold mb-1">
                  REWARDS
                </span>
                <div className="text-xs font-black text-slate-900 leading-none flex items-center gap-1">
                  <span>{formattedRewards}</span>
                  <span className="text-[9.5px] font-black text-amber-500">PTS</span>
                </div>
              </div>
            </div>
          )}


          {/* Cart Button with Vibrant Yellow Badge */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="relative h-10 w-10 bg-slate-50 hover:bg-slate-100/90 active:scale-95 text-slate-700 hover:text-slate-950 border border-slate-200/90 hover:border-slate-300/80 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-xs group"
            title="Open Shopping Cart"
          >
            <svg className="w-5 h-5 group-hover:scale-105 transition-transform text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {cartCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-950 text-[10px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-xs border-2 border-white animate-scaleIn"
              >
                {cartCount}
              </span>
            )}
          </button>

          {/* LOGIN / USER PROFILE */}
          {!isLoggedIn ? (
            <div className="flex items-center">
              <button
                type="button"
                onClick={onOpenLogin}
                className="h-10 px-3 sm:px-5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-xs sm:text-sm transition-all shadow-sm hover:shadow flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Login</span>
              </button>
            </div>
          ) : (
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`h-10 flex items-center gap-2 pl-2 pr-2.5 sm:px-3 rounded-xl transition-all cursor-pointer text-left shrink-0 shadow-xs active:scale-95 group ${
                  isProfileOpen 
                    ? 'bg-white border-amber-400 ring-2 ring-amber-400/20' 
                    : 'bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 hover:border-slate-300/80'
                }`}
              >
                {/* Yellow Profile Avatar with dynamic user initials from API */}
                <div
                  className="w-6.5 h-6.5 rounded-lg font-black text-xs flex items-center justify-center shadow-xs uppercase shrink-0 bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950"
                >
                  {avatarInitials}
                </div>
                <div className="hidden sm:flex items-center gap-1.5 leading-none">
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                    {userDisplayName}
                  </span>
                  {currentUser?.is_premium && (
                    <span
                      className="px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase leading-none shadow-xs shrink-0 tracking-wider bg-amber-400 text-slate-950"
                    >
                      PRO
                    </span>
                  )}
                </div>
                <svg className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-transform duration-200 shrink-0 ${isProfileOpen ? 'rotate-180 text-slate-700' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile Dropdown with Polished Luxury Card Layout */}
              {isProfileOpen && (
                <>
                  {/* Invisible Backdrop to close dropdown on clicking outside */}
                  <div 
                    className="fixed inset-0 z-40 bg-transparent cursor-default" 
                    aria-hidden="true" 
                    onClick={() => setIsProfileOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50 text-xs animate-fadeIn">
                  {/* Top Header Card */}
                  <div className="p-4 bg-gradient-to-b from-slate-50/90 to-white border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center uppercase shrink-0 shadow-xs bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950"
                        >
                          {avatarInitials}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-extrabold text-slate-900 text-sm leading-tight">{userDisplayName}</p>
                            {currentUser?.is_premium && (
                              <span
                                className="px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase leading-none tracking-wider bg-amber-400 text-slate-950"
                              >
                                PRO
                              </span>
                            )}
                          </div>
                          <p className="text-slate-400 text-xs font-mono font-medium leading-tight mt-0.5">@{userUsername}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Connected Wallet Box */}
                  <div className="p-3 mx-3 my-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <span>Connected Wallet</span>
                      <span className="flex items-center gap-1 text-emerald-600 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </span>
                    </div>

                    {userWalletAddress ? (
                      <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                        <span className="font-mono text-xs font-bold text-slate-800" title={userWalletAddress}>
                          {shortWallet}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (userWalletAddress) {
                              navigator.clipboard?.writeText(userWalletAddress)
                              alert('Wallet address copied to clipboard!')
                            }
                          }}
                          className="text-slate-400 hover:text-slate-800 transition p-1 cursor-pointer rounded hover:bg-slate-100"
                          title="Copy full address"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-400 font-medium text-[11px]">
                        Standard account login
                      </div>
                    )}

                    {/* Metadata Pills (Invite Code & Rewards) */}
                    {(currentUser?.Invite_Code || rawRewards) && (
                      <div className={`grid ${currentUser?.Invite_Code ? 'grid-cols-2' : 'grid-cols-1'} gap-1.5 pt-0.5`}>
                        {currentUser?.Invite_Code && (
                          <div className="bg-white px-2 py-1 rounded border border-slate-200/70 text-left">
                            <span className="block text-[8.5px] uppercase font-bold text-slate-400 leading-tight">Invite Code</span>
                            <span className="block font-mono text-[10px] font-bold text-slate-700 truncate leading-tight mt-0.5">{currentUser.Invite_Code}</span>
                          </div>
                        )}
                        <div className="bg-white px-2 py-1 rounded border border-slate-200/70 text-left">
                          <span className="block text-[8.5px] uppercase font-bold text-slate-400 leading-tight">Rewards</span>
                          <span className="block font-mono text-[10px] font-bold text-amber-600 truncate leading-tight mt-0.5">{formattedRewards} PTS</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Navigation Links with Icons */}
                  <div className="px-2 py-1 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false)
                        navigate('/account/orders')
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition font-medium group text-left cursor-pointer"
                    >
                      <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-800 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <span>My Orders &amp; Vault</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false)
                        navigate('/account/escrow')
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition font-medium group text-left cursor-pointer"
                    >
                      <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-800 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>Escrow Multi-Sig Status</span>
                    </button>
                  
                  </div>

                  {/* Log Out Bar */}
                  <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false)
                        onLogout()
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold transition cursor-pointer"
                    >
                      <span>Log Out</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            )}
            </div>
          )}

        </div>

      </div>

      {/* Mobile Search Input */}
      <div className="p-3 md:hidden border-t border-slate-200 bg-white">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Apple products..."
            className="w-full bg-slate-100 text-xs text-slate-900 placeholder-slate-400 pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:border-yellow-400 outline-none"
          />
          <svg className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
    </header>
  )
}
