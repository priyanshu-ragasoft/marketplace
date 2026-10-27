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
import OrderSlipPage from '../../pages/OrderSlipPage'
import OrderConfirmedPage from '../../pages/OrderConfirmedPage'
import EscrowStatusPage from '../../pages/EscrowStatusPage'
import BlogPage from '../../pages/BlogPage'

import LoginModal from '../auth/LoginModal'
import { useRouter } from '../../router/RouterContext'
import { addStoreCartItem, clearStoreCart, fetchStoreCart, removeStoreCartItem, updateStoreCartItem } from '../../services/storeCartService'
import { restoreWalletConnect } from '../../utils/walletConnectService'

export default function MarketplaceStore({ 
  isLoggedIn, 
  currentUser, 
  onLoginSuccess,
  onOpenLogin, 
  onLogout,
  onRewardPointsUpdated
}) {
  const { currentPath, navigate } = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [loginPromptMessage, setLoginPromptMessage] = useState('')
  const [pendingProductToAdd, setPendingProductToAdd] = useState(null)
  const [cartItems, setCartItems] = useState([])

  useEffect(() => {
    if (!isLoggedIn) {
      setCartItems([])
      setIsCartOpen(false)
      return undefined
    }
    let cancelled = false
    fetchStoreCart()
      .then((items) => {
        if (!cancelled) setCartItems(items)
      })
      .catch(() => {
        if (!cancelled) setCartItems([])
      })
    const refresh = () => {
      fetchStoreCart().then((items) => {
        if (!cancelled) setCartItems(items)
      }).catch(() => {})
    }
    window.addEventListener('store-cart-changed', refresh)
    if (currentUser?.connected_wallet === 'WalletConnect') restoreWalletConnect().catch(() => {})
    return () => {
      cancelled = true
      window.removeEventListener('store-cart-changed', refresh)
    }
  }, [isLoggedIn])

  const addItemToCart = async (product) => {
    const items = await addStoreCartItem(product)
    setCartItems(items)
  }

  // Cart Handlers with Login Protection
  const handleAddToCart = (product) => {
    if (!isLoggedIn) {
      setLoginPromptMessage('Please sign in to add items to your cart & proceed to checkout.')
      setPendingProductToAdd(product)
      setIsLoginModalOpen(true)
      return false
    }

    addItemToCart(product).catch(() => {})
    return true
  }

  const handleUpdateQuantity = (id, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(id)
      return
    }
    updateStoreCartItem(id, newQty).then(setCartItems).catch(() => {})
  }

  const handleRemoveItem = (id) => {
    removeStoreCartItem(id).then(setCartItems).catch(() => {})
  }

  const handleClearCart = () => {
    clearStoreCart().then(setCartItems).catch(() => {})
  }

  const totalCartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0)
  const checkoutSlip = currentPath.startsWith('/order/') && !currentPath.endsWith('/confirmed')

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-yellow-400 selection:text-black font-['Plus_Jakarta_Sans',sans-serif]">
      {!checkoutSlip && (
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
      )}

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
        ) : currentPath.startsWith('/order/') && currentPath.endsWith('/confirmed') ? (
          <OrderConfirmedPage
            orderId={decodeURIComponent(currentPath.slice('/order/'.length).replace(/\/confirmed$/, ''))}
          />
        ) : currentPath.startsWith('/order/') ? (
          <OrderSlipPage
            orderId={decodeURIComponent(currentPath.slice('/order/'.length).split('/')[0])}
            onRewardPointsUpdated={onRewardPointsUpdated}
            onCartCleared={handleClearCart}
          />
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
        onRewardPointsUpdated={onRewardPointsUpdated}
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

      {!currentPath.startsWith('/order/') && <MarketFooter />}
    </div>
  )
}
