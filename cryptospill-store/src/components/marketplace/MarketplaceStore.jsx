import React, { useState, useMemo, useEffect } from 'react'
import MarketNavbar from './MarketNavbar'
import CartDrawer from './CartDrawer'
import MarketFooter from './MarketFooter'

// Dedicated Standalone Page Components
import HomePage from '../../pages/HomePage'
import ProductDetailPage from '../../pages/ProductDetailPage'
import TrackOrderPage from '../../pages/TrackOrderPage'
import EscrowGuidePage from '../../pages/EscrowGuidePage'
import ReplacementPolicyPage from '../../pages/ReplacementPolicyPage'
import ShippingCoveragePage from '../../pages/ShippingCoveragePage'
import WarrantyPage from '../../pages/WarrantyPage'
import FaqPage from '../../pages/FaqPage'
import BecomeMerchantPage from '../../pages/BecomeMerchantPage'
import MerchantStandardsPage from '../../pages/MerchantStandardsPage'
import InstantPayoutsPage from '../../pages/InstantPayoutsPage'
import EscrowRulesPage from '../../pages/EscrowRulesPage'
import PrivacyPolicyPage from '../../pages/PrivacyPolicyPage'
import TermsPage from '../../pages/TermsPage'
import MyOrdersPage from '../../pages/MyOrdersPage'
import EscrowStatusPage from '../../pages/EscrowStatusPage'
import BlogPage from '../../pages/BlogPage'

import LoginModal from '../auth/LoginModal'
import { useRouter } from '../../router/RouterContext'

export default function MarketplaceStore({ 
  isLoggedIn, 
  currentUser, 
  onLoginSuccess,
  onOpenLogin, 
  onLogout 
}) {
  const { currentPath, navigate } = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [loginPromptMessage, setLoginPromptMessage] = useState('')
  const [pendingProductToAdd, setPendingProductToAdd] = useState(null)

  // Initial cart starts empty (0 items)
  const [cartItems, setCartItems] = useState([])

  // Automatically clear cart when user logs out
  useEffect(() => {
    if (!isLoggedIn) {
      setCartItems([])
      setIsCartOpen(false)
    }
  }, [isLoggedIn])

  // Cart Item Adder Helper
  const addItemToCart = (product) => {
    const prodId = product._id || product.id
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === prodId)
      if (existing) {
        return prev.map((item) =>
          item.id === prodId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [
        ...prev,
        {
          id: prodId,
          title: product.title,
          priceUSD: product.priceUSD,
          quantity: 1,
          image: product.image
        }
      ]
    })
  }

  // Cart Handlers with Login Protection
  const handleAddToCart = (product) => {
    if (!isLoggedIn) {
      setLoginPromptMessage('Please sign in to add items to your cart & proceed to checkout.')
      setPendingProductToAdd(product)
      setIsLoginModalOpen(true)
      return false
    }

    addItemToCart(product)
    return true
  }

  const handleUpdateQuantity = (id, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(id)
      return
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: newQty } : item))
    )
  }

  const handleRemoveItem = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleClearCart = () => {
    setCartItems([])
  }

  const totalCartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0)

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-yellow-400 selection:text-black font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Marketplace Navigation Bar */}
      <MarketNavbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        cartCount={isLoggedIn ? totalCartCount : 0}
        setIsCartOpen={(open) => {
          if (open && !isLoggedIn) {
            setLoginPromptMessage('Please sign in to access your cart and 0% escrow checkout.')
            setIsLoginModalOpen(true)
            return
          }
          setIsCartOpen(open)
        }}
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        onOpenLogin={() => {
          setLoginPromptMessage('')
          setIsLoginModalOpen(true)
        }}
        onLogout={() => {
          setCartItems([])
          setIsCartOpen(false)
          if (onLogout) onLogout()
        }}
      />

      {/* Main Routed Page Content */}
      <main className="flex-1">
        {currentPath.startsWith('/product/') ? (
          <ProductDetailPage
            productId={currentPath.split('/product/')[1]}
            initialProduct={selectedProduct}
            onAddToCart={handleAddToCart}
            onBuyNow={(prod) => {
              if (handleAddToCart(prod)) {
                setIsCartOpen(true)
              }
            }}
          />
        ) : currentPath === '/help/track-order' ? (
          <TrackOrderPage />
        ) : currentPath === '/help/escrow-guide' ? (
          <EscrowGuidePage />
        ) : currentPath === '/help/replacement-policy' ? (
          <ReplacementPolicyPage />
        ) : currentPath === '/help/shipping-coverage' ? (
          <ShippingCoveragePage />
        ) : currentPath === '/help/warranty' ? (
          <WarrantyPage />
        ) : currentPath === '/help/faq' ? (
          <FaqPage />
        ) : currentPath === '/merchant/become-merchant' ? (
          <BecomeMerchantPage />
        ) : currentPath === '/merchant/standards' ? (
          <MerchantStandardsPage />
        ) : currentPath === '/merchant/payouts' ? (
          <InstantPayoutsPage />
        ) : currentPath === '/merchant/escrow-rules' ? (
          <EscrowRulesPage />
        ) : currentPath === '/legal/privacy' ? (
          <PrivacyPolicyPage />
        ) : currentPath === '/legal/terms' ? (
          <TermsPage />
        ) : currentPath === '/account/orders' || currentPath === '/orders' ? (
          <MyOrdersPage />
        ) : currentPath === '/account/escrow' || currentPath === '/escrow' ? (
          <EscrowStatusPage />
        ) : currentPath === '/blog' || currentPath.startsWith('/blog/') ? (
          <BlogPage />
        ) : (
          <HomePage
            searchQuery={searchQuery}
            onAddToCart={handleAddToCart}
            onProductSelect={(prod) => {
              setSelectedProduct(prod)
              navigate(`/product/${prod._id || prod.id}`)
            }}
          />
        )}
      </main>

      {/* Cart Drawer Component */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />

      {/* CouponDunia-Style 2-Column Login Popup Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        promptMessage={loginPromptMessage}
        onClose={() => {
          setIsLoginModalOpen(false)
          setLoginPromptMessage('')
        }}
        onLoginSuccess={(user) => {
          if (onLoginSuccess) onLoginSuccess(user)
          setIsLoginModalOpen(false)
          setLoginPromptMessage('')
          if (pendingProductToAdd) {
            addItemToCart(pendingProductToAdd)
            setPendingProductToAdd(null)
            setIsCartOpen(true)
          }
        }}
      />

      {/* Comprehensive Human Store Directory Footer */}
      <MarketFooter />
    </div>
  )
}
