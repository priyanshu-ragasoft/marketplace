import React, { useState, useEffect } from 'react'
import WalletLoginForm from './WalletLoginForm'

export default function LoginModal({ isOpen, onClose, onLoginSuccess, promptMessage = '' }) {
  const [activeAuthTab, setActiveAuthTab] = useState('wallet') // 'wallet' | 'username'
  const [username, setUsername] = useState('shopper_pro')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!username.trim()) return
    setErrorMessage('')
    setIsLoading(true)

    setTimeout(() => {
      setIsLoading(false)
      const cleanUser = username.trim()
      if (onLoginSuccess) {
        onLoginSuccess({
          username: cleanUser,
          user_name: cleanUser,
          name: cleanUser,
          display_name: cleanUser,
          email: `${cleanUser.toLowerCase().replace(/\s+/g, '_')}@cryptospill.store`,
          role: 'shopper'
        })
      }
      onClose()
    }, 500)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Dimmed Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* Centering wrapper that allows full scrolling if modal exceeds viewport */}
      <div className="min-h-full flex items-center justify-center p-3 sm:p-6 text-center">
        {/* Modal Dialog Card - CouponDunia 2-Column Layout */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[820px] max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 z-10 animate-scaleIn text-slate-800 my-auto text-left"
        >
          {/* Top Header - Fixed/Sticky so title & 'X' close are always visible */}
          <div className="shrink-0 px-5 sm:px-10 pt-5 sm:pt-7 pb-4 sm:pb-5 border-b border-slate-100 flex items-start justify-between bg-white">
            <div>
            
              <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 mt-0.5 leading-tight">
                Login with CryptoSpill Community Store
              </h2>
            </div>

            {/* Close 'X' Button */}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 transition p-1 cursor-pointer text-2xl sm:text-3xl font-light leading-none -mr-1"
              title="Close"
            >
              &times;
            </button>
          </div>

          {/* Prompt Alert Banner */}
          {promptMessage && (
            <div className="shrink-0 bg-amber-50 border-b border-amber-200 px-5 sm:px-10 py-2.5 flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-900">
              <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{promptMessage}</span>
            </div>
          )}

          {/* Modal Body: Scrollable on mobile so everything fits beautifully */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-8 md:p-10">
            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 md:gap-10 items-stretch">

              {/* Vertical 'Or' Divider for Desktop ONLY */}
              <div className="hidden md:flex absolute left-1/2 top-4 bottom-4 -translate-x-1/2 flex-col items-center justify-center pointer-events-none">
                <div className="w-[1px] h-full bg-slate-200" />
                <div className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                  <span className="text-xs font-bold text-slate-400">Or</span>
                </div>
              </div>

              {/* LEFT COLUMN: Text, Notice Box, Info */}
              <div className="flex flex-col justify-between pr-0 md:pr-4 space-y-4">
                <div className="space-y-3 sm:space-y-4">
                  {/* Yellow Alert Box */}
                  <div className="p-3.5 sm:p-5 rounded-2xl bg-[#fef9c3] border border-[#fde047] text-slate-800 flex items-start gap-2.5 sm:gap-3 text-xs sm:text-sm leading-relaxed">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p>
                      CryptoSpill Community Store is the member shop. Sign in with your username and the wallet on your account to place orders and follow them.
                    </p>
                  </div>
                  <div className="hidden sm:block space-y-3 pt-1 text-xs sm:text-sm text-slate-700 font-medium">
                    <div className="flex items-center gap-2.5">
                      <span className="text-emerald-500 font-black text-sm sm:text-base">✔</span>
                      <span>Orders, address, and receipt stay on your account</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-amber-500 font-black text-sm sm:text-base">✔</span>
                      <span>Wallet reward points can be used at checkout</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-blue-500 font-black text-sm sm:text-base">✔</span>
                      <span>Follow each order from placed to delivered</span>
                    </div>
                  </div>

                  {/* Mobile Compact Pills - Single Line */}
                  <div className="flex sm:hidden items-center justify-between gap-1.5 pt-0.5 text-[10px] font-bold">
                    <span className="flex-1 text-center py-1 px-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 whitespace-nowrap">
                      ✔ Your orders
                    </span>
                    <span className="flex-1 text-center py-1 px-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/80 whitespace-nowrap">
                      ✔ Rewards
                    </span>
                    <span className="flex-1 text-center py-1 px-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/80 whitespace-nowrap">
                      ✔ Tracking
                    </span>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Username Address & Wallet Address Form */}
              <div className="pl-0 md:pl-4 flex flex-col justify-between">
                <WalletLoginForm
                  onLoginSuccess={(user) => {
                    if (onLoginSuccess) onLoginSuccess(user)
                    onClose()
                  }}
                />
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
