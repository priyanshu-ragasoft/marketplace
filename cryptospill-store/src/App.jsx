import React, { useState, useEffect } from 'react'
import { RouterProvider, useRouter } from './router/RouterContext'
import MarketplaceStore from './components/marketplace/MarketplaceStore'
import LoginPage from './pages/LoginPage'
import StoreLoginPage from './pages/store/StoreLoginPage'
import StoreDashboard from './pages/store/StoreDashboard'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import { hasStoreAuth, getStoreProfile, clearStoreAuth } from './services/storeStorage'
import { exchangeMarketplaceToken } from './services/marketplaceHandoff'

function MainContent() {
  const { currentPath, navigate } = useRouter()

  // ----------------------------------------------------
  // 1. CUSTOMER STOREFRONT AUTHENTICATION STATE
  // ----------------------------------------------------
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return Boolean(localStorage.getItem('access_token'))
  })
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('currentUser')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  // ----------------------------------------------------
  // 2. STORE ADMINISTRATOR AUTHENTICATION STATE
  // ----------------------------------------------------
  const [isStoreAuthenticated, setIsStoreAuthenticated] = useState(() => hasStoreAuth())
  const [storeProfile, setStoreProfile] = useState(() => getStoreProfile())

  // Platform admin session state (sessionStorage)
  const [handoffMessage, setHandoffMessage] = useState('')

  const [adminUser, setAdminUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem('cryptospill_admin_session')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  // Listen for store session events (expiration / logout)
  useEffect(() => {
    const handleStoreSessionExpired = () => {
      setIsStoreAuthenticated(false)
      setStoreProfile(null)
      navigate('/admin')
    }

    const handleStoreLoggedOut = () => {
      setIsStoreAuthenticated(false)
      setStoreProfile(null)
      navigate('/admin')
    }

    window.addEventListener('cryptospill_store_session_expired', handleStoreSessionExpired)
    window.addEventListener('cryptospill_store_logged_out', handleStoreLoggedOut)

    return () => {
      window.removeEventListener('cryptospill_store_session_expired', handleStoreSessionExpired)
      window.removeEventListener('cryptospill_store_logged_out', handleStoreLoggedOut)
    }
  }, [navigate])

  // Main app opens https://marketplace.cryptospill.io/?token=...
  // Log in only when that token's user exists and the connected wallet matches.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = (params.get('token') || params.get('access_token') || '').trim()
    if (!token) return

    params.delete('token')
    params.delete('access_token')
    const next = params.toString()
    const cleanUrl = `${window.location.pathname}${next ? `?${next}` : ''}${window.location.hash}`
    window.history.replaceState({}, '', cleanUrl)

    if (localStorage.getItem('access_token')) return

    let cancelled = false
    setHandoffMessage('Checking your account and wallet…')

    exchangeMarketplaceToken(token)
      .then((user) => {
        if (cancelled) return
        setHandoffMessage('')
        handleCustomerLoginSuccess(user)
      })
      .catch((err) => {
        if (cancelled) return
        setHandoffMessage(err?.message || 'Could not sign you in from this link.')
      })

    return () => {
      cancelled = true
    }
    // Run once on landing. handleCustomerLoginSuccess is stable enough for this entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Customer handlers
  const handleOpenLogin = () => {
    navigate('/login')
  }

  const handleCustomerLoginSuccess = (user) => {
    setIsLoggedIn(true)
    setCurrentUser(user)
    if (user?.access_token) {
      localStorage.setItem('access_token', user.access_token)
    }
    if (user?.refresh_token) {
      localStorage.setItem('refresh_token', user.refresh_token)
    }
    localStorage.setItem('currentUser', JSON.stringify(user))
    navigate('/')
  }

  const handleRewardPointsUpdated = (pointsAvailable) => {
    setCurrentUser((prev) => {
      if (!prev) return prev
      const next = { ...prev, reward_points: pointsAvailable }
      localStorage.setItem('currentUser', JSON.stringify(next))
      return next
    })
  }

  const handleCustomerLogout = () => {
    setIsLoggedIn(false)
    setCurrentUser(null)
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('currentUser')
    localStorage.removeItem('cryptospill_market_cart')
    sessionStorage.removeItem('cryptospill_market_cart')
    navigate('/')
  }

  // Store admin handlers
  const handleStoreLoginSuccess = (profile) => {
    setIsStoreAuthenticated(true)
    setStoreProfile(profile)
    navigate('/admin')
  }

  const handleStoreLogout = () => {
    clearStoreAuth()
    setIsStoreAuthenticated(false)
    setStoreProfile(null)
    navigate('/admin')
  }

  const handleAdminLoginSuccess = (session) => {
    setAdminUser(session)
    sessionStorage.setItem('cryptospill_admin_session', JSON.stringify(session))
    navigate('/admin/catalog')
  }

  const handleAdminLogout = () => {
    setAdminUser(null)
    sessionStorage.removeItem('cryptospill_admin_session')
    navigate('/admin')
  }

  // ====================================================
  // ROUTE HANDLING
  // ====================================================

  // A. Optional Platform Catalog Admin Route: /admin/catalog
  if (currentPath === '/admin/catalog' || currentPath.startsWith('/admin/catalog/')) {
    if (!adminUser) {
      return <AdminLoginPage onAdminLoginSuccess={handleAdminLoginSuccess} />
    }
    return <AdminDashboard adminUser={adminUser} onAdminLogout={handleAdminLogout} />
  }

  // B. STORE CONSOLE / ADMIN ROUTES: /admin, /admin/*, /store, /store/*
  const isStoreAdminRoute =
    currentPath === '/admin' ||
    currentPath.startsWith('/admin/') ||
    currentPath === '/store' ||
    currentPath.startsWith('/store/')

  if (isStoreAdminRoute) {
    if (isStoreAuthenticated) {
      return (
        <StoreDashboard
          profile={storeProfile}
          onLogout={handleStoreLogout}
        />
      )
    }
    return <StoreLoginPage onLoginSuccess={handleStoreLoginSuccess} />
  }

  const handoffBanner = handoffMessage ? (
    <div className="fixed inset-x-0 top-0 z-[80] px-4 py-3 text-center text-sm font-medium text-white bg-slate-900/95">
      {handoffMessage}
    </div>
  ) : null

  // C. DEDICATED CUSTOMER LOGIN ROUTE: /login
  if (currentPath === '/login') {
    return (
      <>
        {handoffBanner}
        <LoginPage onLoginSuccess={handleCustomerLoginSuccess} />
      </>
    )
  }

  // D. MAIN STOREFRONT MARKETPLACE: Root (/), Products (/product/:id), Help (/help/*), Legal (/legal/*)
  return (
    <>
      {handoffBanner}
      <MarketplaceStore
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        onLoginSuccess={handleCustomerLoginSuccess}
        onOpenLogin={handleOpenLogin}
        onLogout={handleCustomerLogout}
        onRewardPointsUpdated={handleRewardPointsUpdated}
      />
    </>
  )
}

export default function App() {
  return (
    <RouterProvider>
      <MainContent />
    </RouterProvider>
  )
}
