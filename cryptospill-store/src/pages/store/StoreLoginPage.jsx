import React, { useState } from 'react'
import { useRouter } from '../../router/RouterContext'
import BrandLogo from '../../components/common/BrandLogo'
import BackgroundSplit from '../../components/auth/BackgroundSplit'
import { loginStore, getStoreApiBaseUrl, setStoreApiBaseUrl } from '../../services/storeAuthService'

export default function StoreLoginPage({ onLoginSuccess }) {
  const { navigate } = useRouter()
  const [email, setEmail] = useState('marketplace@cryptospill.io')
  const [password, setPassword] = useState('123456')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [gatewayUrl, setGatewayUrl] = useState(() => getStoreApiBaseUrl())

  const handleSwitchGateway = (newUrl) => {
    setStoreApiBaseUrl(newUrl)
    setGatewayUrl(newUrl)
    setErrorMessage('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setErrorMessage('Please enter your store email address.')
      return
    }
    if (!password) {
      setErrorMessage('Please enter your store administrator password.')
      return
    }

    setIsLoading(true)

    try {
      const response = await loginStore({
        email: trimmedEmail,
        password
      })

      setSuccessMessage(response.message || 'Administrator Login Success')

      // Allow user to see the success transition
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess(response.profile)
        }
      }, 400)
    } catch (err) {
      // Show exact data.message or message from API:
      // e.g. "Mentioned email is not registered with us"
      // "Password Seems to be Incorrect"
      // 417 validation error
      setErrorMessage(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen w-full relative overflow-x-hidden font-['Plus_Jakarta_Sans',sans-serif] select-none flex flex-col justify-between bg-black text-white">
      {/* 2-Column Background Split Layout - Signature Black & Gold */}
      <BackgroundSplit isDark={true} />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-[1440px] mx-auto min-h-screen flex flex-col lg:flex-row items-center justify-between px-6 sm:px-12 lg:px-16 xl:px-24 py-12">

        {/* LEFT COLUMN: HERO INFORMATION */}
        <section className="relative z-10 w-full lg:w-[52%] flex flex-col justify-between self-stretch lg:pr-8 py-4 lg:py-6 text-left">
          {/* Top Logo */}
          <div className="pt-2 flex items-center justify-between">
            <BrandLogo size="default" isDarkBackground={true} />
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-yellow-400 transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-neutral-900 border border-transparent hover:border-neutral-800"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Store</span>
            </button>
          </div>

          {/* Center Hero Copy */}
          <div className="my-auto py-10 lg:py-14 max-w-xl">
            {/* Eyebrow Badge */}
            <div className="mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-[11px] font-bold tracking-[0.2em] uppercase shadow-sm backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                <span>Merchant desk</span>
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[46px] font-black text-white leading-[1.14] tracking-tight mb-5">
              The merchant desk for the CryptoSpill marketplace.
            </h1>

            {/* Subtitle / Paragraph */}
            <p className="text-neutral-400 text-sm sm:text-base leading-relaxed font-normal mb-8 max-w-lg">
              Sign in to run the catalog, orders, banners, and the storefront buyers see.
            </p>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-lg">
              <div className="p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 backdrop-blur-sm flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 flex items-center justify-center shrink-0">
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Verified Security</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">Merchant sign-in only</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 backdrop-blur-sm flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 flex items-center justify-center shrink-0">
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Live Storefront Sync</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">Real-time profile updates</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security Note */}
          <div className="pt-4 text-xs text-neutral-500 flex items-center gap-2">
            <svg className="w-4 h-4 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Authorized store representatives only. Account creation is restricted.</span>
          </div>
        </section>

        {/* RIGHT COLUMN: STORE LOGIN CARD */}
        <section className="relative z-10 w-full lg:w-[44%] flex items-center justify-center lg:justify-end py-6 lg:py-0">
          <div className="w-full max-w-[450px] bg-[#0c0c0c] rounded-3xl p-8 sm:p-10 shadow-2xl border border-neutral-800 transition-all text-white relative overflow-hidden">
            {/* Top gold accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500" />

            {/* Card Header */}
            <div className="mb-6">
              <div className="mb-2.5">
                <BrandLogo size="default" isDarkBackground={true} />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight mt-3">Merchant sign in</h2>
              <p className="text-neutral-400 text-xs sm:text-[13px] font-normal leading-normal mt-1">
                Use your CryptoSpill merchant email and password.
              </p>
            </div>



            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs sm:text-sm flex items-start gap-2.5 animate-fadeIn">
                <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1 font-medium">{errorMessage}</div>
              </div>
            )}

            {/* Success Message Alert */}
            {successMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs sm:text-sm flex items-start gap-2.5 animate-fadeIn">
                <svg className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <div className="flex-1 font-medium">{successMessage}</div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  Store Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="store@email.com"
                    autoComplete="email"
                    required
                    className="w-full px-4 py-3 bg-neutral-900/90 border border-neutral-700/80 rounded-xl text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-neutral-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  Store Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    required
                    className="w-full px-4 py-3 bg-neutral-900/90 border border-neutral-700/80 rounded-xl text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-extrabold text-sm uppercase tracking-wider transition-all duration-200 transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Authenticating Store...</span>
                  </>
                ) : (
                  <span>Sign In To Store</span>
                )}
              </button>
            </form>

            {/* Note on account creation */}
            <div className="mt-6 pt-5 border-t border-neutral-800 text-center">
              <p className="text-xs text-neutral-500">
                Need a store account? Contact CryptoSpill merchant onboarding support.
              </p>
            </div>
          </div>
        </section>

      </div>
    </main>
  )
}
