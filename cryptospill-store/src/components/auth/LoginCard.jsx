import React, { useState } from 'react'
import BrandLogo from '../common/BrandLogo'
import WalletLoginForm from './WalletLoginForm'

export default function LoginCard({ onLoginSuccess }) {
  const [authMethod, setAuthMethod] = useState('wallet') // 'wallet' | 'standard'
  const [activeTab, setActiveTab] = useState('shopper') // 'shopper' | 'merchant'
  const [email, setEmail] = useState('shopper@cryptospill.store')
  const [password, setPassword] = useState('storepass123')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [authSuccess, setAuthSuccess] = useState(false)

  const handleSignIn = (e) => {
    e.preventDefault()
    setIsLoading(true)
    setAuthSuccess(false)

    setTimeout(() => {
      setIsLoading(false)
      setAuthSuccess(true)
      if (onLoginSuccess) {
        setTimeout(() => {
          const userPrefix = email ? email.split('@')[0] : 'shopper'
          onLoginSuccess({ 
            email, 
            role: activeTab,
            user_name: userPrefix,
            username: userPrefix,
            display_name: activeTab === 'shopper' ? 'Shopper Pro' : 'Merchant Store',
            name: activeTab === 'shopper' ? 'Shopper Pro' : 'Merchant Store'
          })
        }, 500)
      }
    }, 700)
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === 'shopper') {
      setEmail('shopper@cryptospill.store')
    } else {
      setEmail('merchant@cryptospill.store')
    }
  }

  return (
    <section className="relative z-10 w-full lg:w-[44%] flex items-center justify-center lg:justify-end py-4 lg:py-0">
      <div className="w-full max-w-[440px] bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-200 transition-all text-slate-900">
        
        {/* Card Header with Brand Logo */}
        <div className="mb-6">
          <div className="mb-2.5">
            <BrandLogo size="default" isDarkBackground={false} />
          </div>
          <p className="text-slate-500 text-xs sm:text-[13.5px] font-normal leading-normal">
            Sign in to access your marketplace store, orders, and digital assets.
          </p>
        </div>

        {/* Auth Method Switcher: Wallet Login vs Standard Login */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mb-6 text-xs font-bold border border-slate-200">
          <button
            type="button"
            onClick={() => setAuthMethod('wallet')}
            className={`py-2.5 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              authMethod === 'wallet'
                ? 'bg-[#D1A61B] text-black font-black shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
            </svg>
            <span>Wallet Login</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthMethod('standard')}
            className={`py-2.5 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              authMethod === 'standard'
                ? 'bg-slate-900 text-white font-black shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Standard Login</span>
          </button>
        </div>

        {/* WALLET LOGIN FORM */}
        {authMethod === 'wallet' ? (
          <div>
            <WalletLoginForm onLoginSuccess={onLoginSuccess} />
          </div>
        ) : (
          /* STANDARD LOGIN FORM (Unmodified) */
          <div>
            {/* Store Access Tabs: Shopper vs Merchant Store */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mb-6 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleTabChange('shopper')}
                className={`py-2 px-3 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'shopper'
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Store Shopper
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('merchant')}
                className={`py-2 px-3 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'merchant'
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Merchant Store
              </button>
            </div>

            {/* Authentication Success Alert */}
            {authSuccess && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2.5 animate-fadeIn">
                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                <span className="font-semibold">
                  Welcome back! Redirecting to {activeTab === 'shopper' ? 'Marketplace Store' : 'Merchant Storefront'}...
                </span>
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleSignIn} className="space-y-4">
              
              {/* Email Input Field */}
              <div>
                <label 
                  htmlFor="card-email" 
                  className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="card-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="shopper@cryptospill.store"
                    className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-sm font-normal px-4 py-3 rounded-xl border border-slate-200 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/20 outline-none transition-all duration-150"
                  />
                </div>
              </div>

              {/* Password Input Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label 
                    htmlFor="card-password" 
                    className="block text-xs sm:text-sm font-semibold text-slate-800"
                  >
                    Password
                  </label>
                  <a 
                    href="#forgot" 
                    onClick={(e) => {
                      e.preventDefault()
                      alert('Password recovery link dispatched to your registered store email.')
                    }}
                    className="text-xs font-semibold text-yellow-600 hover:text-yellow-700 transition"
                  >
                    Forgot password?
                  </a>
                </div>

                <div className="relative">
                  <input
                    id="card-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-900 text-sm font-normal px-4 py-3 pr-11 rounded-xl border border-slate-200 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/20 outline-none transition-all duration-150 tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 focus:outline-none p-1 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center pt-0.5">
                <input
                  id="card-remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-yellow-500 accent-yellow-400 rounded border-slate-300 focus:ring-yellow-400 cursor-pointer"
                />
                <label 
                  htmlFor="card-remember" 
                  className="ml-2 text-xs font-medium text-slate-600 cursor-pointer select-none"
                >
                  Remember this device
                </label>
              </div>

              {/* Clean Midnight Slate Primary Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-sm sm:text-[15px] rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-75 flex items-center justify-center gap-2 cursor-pointer group"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Connecting to Community Store...</span>
                    </>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      Sign in to Store
                      <svg className="w-4 h-4 text-white transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </span>
                  )}
                </button>
              </div>

              {/* Web3 Connect Wallet Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setAuthMethod('wallet')}
                  className="w-full h-11 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <svg className="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                  </svg>
                  <span>Switch to Wallet Login</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Demo Credentials Footer */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Escrow Protected Checkout
          </span>
          <button
            type="button"
            onClick={() => {
              setEmail(activeTab === 'shopper' ? 'shopper@cryptospill.store' : 'merchant@cryptospill.store')
              setPassword('storepass123')
            }}
            className="text-yellow-600 hover:text-yellow-700 font-semibold cursor-pointer transition"
          >
            Reset Demo
          </button>
        </div>

      </div>
    </section>
  )
}
