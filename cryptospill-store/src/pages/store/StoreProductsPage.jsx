import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from '../../router/RouterContext'
import {
  getStoreProductList,
  createStoreProduct,
  updateStoreProduct,
  deleteStoreProduct
} from '../../services/storeProductService'
import {
  getStoreCategoryList,
  createStoreCategory,
  updateStoreCategory,
  deleteStoreCategory
} from '../../services/storeCategoryService'
import { uploadBannerImage } from '../../services/storeBannerService'
import { normalizeImageUrl } from '../../utils/imageUrl'

import appleWatchImg from '../../assets/apple-watch.jpg'
import appleIpadImg from '../../assets/apple-ipad.jpg'
import appleIPhone17ProImg from '../../assets/apple-iphone-17-pro.jpg'
import appleIPhone18ProImg from '../../assets/apple-iphone-18-pro.jpg'
import appleIPhone18ProMaxImg from '../../assets/apple-iphone-18-pro-max.jpg'
import appleIPhoneDuoImg from '../../assets/apple-iphone-duo.jpg'
import appleGiftCardImg from '../../assets/apple-gift-card.jpg'
import appleCarePlusImg from '../../assets/apple-care-plus.jpg'
import appleOnePassImg from '../../assets/apple-one-pass.jpg'
import finalCutProImg from '../../assets/final-cut-pro.jpg'

const PRESET_PRODUCT_IMAGES = [
  { label: 'iPhone 18 Pro', src: appleIPhone18ProImg },
  { label: 'iPhone 18 Pro Max', src: appleIPhone18ProMaxImg },
  { label: 'iPhone 17 Pro', src: appleIPhone17ProImg },
  { label: 'iPhone Duo Foldable', src: appleIPhoneDuoImg },
  { label: 'Apple Watch Ultra', src: appleWatchImg },
  { label: 'iPad Pro OLED M4', src: appleIpadImg },
  { label: 'Apple Gift Card', src: appleGiftCardImg },
  { label: 'AppleCare+ 2-Yr', src: appleCarePlusImg },
  { label: 'Apple One Pass', src: appleOnePassImg },
  { label: 'Final Cut Pro', src: finalCutProImg },
]

const BADGE_PRESETS = [
  'BEST SELLER',
  'NEW ARRIVAL',
  'FLAGSHIP',
  'REVOLUTIONARY',
  'LIMITED EDITION',
  'HOT DEAL',
  'TRENDING'
]

export default function StoreProductsPage({ onShowToast }) {
  const { navigate } = useRouter()

  // 1. DATA STATE
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [stats, setStats] = useState({ total: 0, inStockCount: 0, outOfStockCount: 0, catCount: 0 })
  const [totalCount, setTotalCount] = useState(0)

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all') // category _id or 'all'
  const [stockFilter, setStockFilter] = useState('all') // 'all' | 'inStock' | 'outOfStock'
  const [sortBy, setSortBy] = useState('newest') // 'newest' | 'price-asc' | 'price-desc' | 'rating'
  const [viewMode, setViewMode] = useState('table') // 'table' | 'grid'

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' | 'edit'
  const [editingProductId, setEditingProductId] = useState(null)
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // Category Management State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false)
  const [inlineCategoryName, setInlineCategoryName] = useState('')
  const [showInlineCategoryInput, setShowInlineCategoryInput] = useState(false)
  const [isCreatingInlineCategory, setIsCreatingInlineCategory] = useState(false)
  const [isSeedingCategories, setIsSeedingCategories] = useState(false)

  // Form Fields
  const [formTitle, setFormTitle] = useState('')
  const [formCategoryId, setFormCategoryId] = useState('') // category _id
  const [formPriceUSD, setFormPriceUSD] = useState('')
  const [formImage, setFormImage] = useState('')
  const [formMerchant, setFormMerchant] = useState('Apple Authorized Escrow Store')
  const [formBadge, setFormBadge] = useState('NEW ARRIVAL')
  const [formRating, setFormRating] = useState('5.0')
  const [formReviews, setFormReviews] = useState('120')
  const [formInStock, setFormInStock] = useState(true)
  const [formDescription, setFormDescription] = useState('')
  const [formSpecsText, setFormSpecsText] = useState('')

  // Toast notification helper
  const notify = (msg) => {
    if (typeof onShowToast === 'function') {
      onShowToast(msg)
    }
  }

  // Auto-sync formCategoryId whenever categories are loaded/updated
  useEffect(() => {
    if (categories.length > 0 && !formCategoryId) {
      setFormCategoryId(categories[0]._id)
    }
  }, [categories, formCategoryId])

  // Debounce search query by 300ms
  const searchTimeoutRef = useRef(null)
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim())
    }, 300)
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [searchQuery])

  // Fetch Categories from GET /store/category/list
  const fetchCategories = useCallback(async () => {
    try {
      const res = await getStoreCategoryList({
        page: 1,
        limit: 100,
        sort_column: 'sortOrder',
        sort_direction: 'asc'
      })
      if (res.success && res.data) {
        const rows = res.data.result || []
        setCategories(rows)
        if (rows.length > 0) {
          setFormCategoryId((prev) => prev || rows[0]._id)
        }
      }
    } catch (err) {
      console.warn('Failed to load categories:', err)
    }
  }, [])

  // Fetch Products from GET /store/product/list
  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')
    try {
      const res = await getStoreProductList({
        search_key: debouncedSearch,
        category: selectedCategory === 'all' ? '' : selectedCategory,
        stock: stockFilter,
        sort: sortBy,
        page: 1,
        limit: 100
      })

      if (res.success && res.data) {
        const rows = res.data.result || []
        setProducts(rows)
        if (res.data.stats) {
          setStats(res.data.stats)
        }
        setTotalCount(res.data.totalCount || rows.length)
      } else {
        setLoadError(res.message || 'Failed to retrieve products from store API.')
        setProducts([])
      }
    } catch (err) {
      setLoadError(err.message || 'Error connecting to store products API.')
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, selectedCategory, stockFilter, sortBy])

  // Load categories and products on mount and whenever filters change
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setModalMode('create')
    setEditingProductId(null)
    setFormTitle('')
    setFormCategoryId(categories[0]?._id || '')
    setFormPriceUSD('1299.00')
    setFormImage(appleIPhone18ProImg)
    setFormMerchant('Apple Authorized Escrow Store')
    setFormBadge('NEW ARRIVAL')
    setFormRating('5.0')
    setFormReviews('180')
    setFormInStock(true)
    setFormDescription(
      'Next-generation Apple flagship hardware with zero-bezel aerospace titanium enclosure, pro camera array, and A20 silicon.'
    )
    setFormSpecsText(
      'Aerospace Titanium Enclosure\nA20 Neural Fusion Silicon\nSuper Retina XDR OLED\nNext-Gen Apple Intelligence'
    )
    setFormError('')
    setShowInlineCategoryInput(false)
    setInlineCategoryName('')
    setIsModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEditModal = (product) => {
    setModalMode('edit')
    const pId = product._id || product.id
    setEditingProductId(pId)
    setFormTitle(product.title || '')
    // In edit modal, set the category select to category_id, not the slug
    setFormCategoryId(product.category_id || product.categoryInfo?._id || product.category || categories[0]?._id || '')
    setFormPriceUSD(product.priceUSD != null ? String(product.priceUSD) : '')
    setFormImage(normalizeImageUrl(product.image || ''))
    setFormMerchant(product.merchant || 'Apple Authorized Escrow Store')
    setFormBadge(product.badge || 'BEST SELLER')
    setFormRating(product.rating != null ? String(product.rating) : '5.0')
    setFormReviews(product.reviews != null ? String(product.reviews) : '100')
    setFormInStock(product.inStock !== false)
    setFormDescription(product.description || '')
    setFormSpecsText(Array.isArray(product.specs) ? product.specs.join('\n') : '')
    setFormError('')
    setShowInlineCategoryInput(false)
    setInlineCategoryName('')
    setIsModalOpen(true)
  }

  // Stock Toggle: PUT /store/product/update/:product_id with { inStock: true/false }, then refetch.
  const handleToggleStock = async (product) => {
    const pId = product._id || product.id
    try {
      const res = await updateStoreProduct(pId, { inStock: !product.inStock })
      notify(res.message || 'Inventory status updated successfully!')
      fetchProducts()
    } catch (err) {
      notify(err.message || 'Failed to update stock status')
    }
  }

  // Delete Product: DELETE /store/product/delete/:product_id, then refetch.
  const handleDeleteProduct = async (product) => {
    const pId = product._id || product.id
    if (!window.confirm(`Are you sure you want to delete "${product.title || 'this product'}"?`)) {
      return
    }
    try {
      const res = await deleteStoreProduct(pId)
      notify(res.message || `Deleted "${product.title || 'Product'}" successfully!`)
      fetchProducts()
    } catch (err) {
      notify(err.message || 'Failed to delete product')
    }
  }

  // Image Upload using existing banner upload API
  const handleImageFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setFormError('Please select a valid image file (PNG, JPG, WebP, etc.).')
      return
    }

    setIsUploadingImage(true)
    setFormError('')

    try {
      const res = await uploadBannerImage(file)
      if (res && (res.fileUrl || res.url || res.path || res.image || res.data)) {
        const uploadedUrl =
          res.fileUrl ||
          res.url ||
          res.path ||
          res.image ||
          res.data?.fileUrl ||
          res.data?.url ||
          res.data?.path ||
          res.data?.image
        setFormImage(normalizeImageUrl(uploadedUrl))
        notify('Image uploaded and synced successfully!')
      } else {
        const reader = new FileReader()
        reader.onload = (event) => {
          setFormImage(event.target.result)
          notify('Loaded image preview!')
        }
        reader.readAsDataURL(file)
      }
    } catch {
      const reader = new FileReader()
      reader.onload = (event) => {
        setFormImage(event.target.result)
        notify('Loaded image preview!')
      }
      reader.readAsDataURL(file)
    } finally {
      setIsUploadingImage(false)
    }
  }

  // Submit Add or Edit Product
  const handleModalSubmit = async (e) => {
    e.preventDefault()

    if (!formTitle.trim()) {
      setFormError('Product title is required.')
      return
    }

    if (!formCategoryId) {
      setFormError('Storefront category is required. Please select or add a category below.')
      return
    }

    const priceNum = parseFloat(formPriceUSD)
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('priceUSD must be a number greater than 0.')
      return
    }

    setIsSubmitting(true)
    setFormError('')

    try {
      const specsArray = formSpecsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)

      const payload = {
        title: formTitle.trim(),
        category: formCategoryId, // category _id
        priceUSD: priceNum,
        priceCrypto: '',
        image: normalizeImageUrl(formImage) || appleIPhone18ProImg,
        merchant: formMerchant.trim() || 'Apple Authorized Escrow Store',
        badge: formBadge.trim().toUpperCase(),
        rating: parseFloat(formRating) || 5.0,
        reviews: parseInt(formReviews, 10) || 50,
        inStock: formInStock,
        description: formDescription.trim(),
        specs: specsArray,
        isActive: true,
        isFeatured: false,
        sortOrder: 0
      }

      if (modalMode === 'create') {
        const res = await createStoreProduct(payload)
        notify(res.message || 'Product created successfully!')
      } else {
        const res = await updateStoreProduct(editingProductId, payload)
        notify(res.message || 'Product updated successfully!')
      }

      setIsModalOpen(false)
      fetchProducts()
    } catch (err) {
      setFormError(err.message || 'Failed to save product.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Quick Seed Default Categories
  const handleSeedDefaultCategories = async () => {
    setIsSeedingCategories(true)
    setFormError('')
    try {
      const defaults = ['Apple iPhone', 'Apple Watch', 'iPad Pro', 'Apple Accessories']
      let lastCreatedId = ''
      for (const name of defaults) {
        try {
          const res = await createStoreCategory({ name, sortOrder: 0, isActive: true })
          if (res?.data?._id) lastCreatedId = res.data._id
        } catch {
          // continue
        }
      }
      notify('Default categories created successfully!')
      const catRes = await getStoreCategoryList({ page: 1, limit: 100 })
      if (catRes.success && catRes.data?.result) {
        const rows = catRes.data.result || []
        setCategories(rows)
        if (rows.length > 0) {
          setFormCategoryId(lastCreatedId || rows[0]._id)
        }
      }
    } catch (err) {
      setFormError(err.message || 'Failed to seed categories.')
    } finally {
      setIsSeedingCategories(false)
    }
  }

  // Quick Inline Category Creation
  const handleCreateInlineCategory = async (e) => {
    if (e) e.preventDefault()
    if (!inlineCategoryName.trim()) return

    setIsCreatingInlineCategory(true)
    setFormError('')
    try {
      const res = await createStoreCategory({ name: inlineCategoryName.trim(), sortOrder: 0, isActive: true })
      notify(res.message || `Category "${inlineCategoryName.trim()}" created!`)
      setInlineCategoryName('')
      setShowInlineCategoryInput(false)
      const catRes = await getStoreCategoryList({ page: 1, limit: 100 })
      if (catRes.success && catRes.data?.result) {
        const rows = catRes.data.result || []
        setCategories(rows)
        const createdId = res.data?._id || rows[rows.length - 1]?._id
        if (createdId) {
          setFormCategoryId(createdId)
        }
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create category.')
    } finally {
      setIsCreatingInlineCategory(false)
    }
  }

  // Category Actions: Create / Delete
  const handleCreateCategory = async (e) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return

    setIsCategorySubmitting(true)
    try {
      const res = await createStoreCategory({ name: newCategoryName.trim() })
      notify(res.message || `Category "${newCategoryName.trim()}" created!`)
      setNewCategoryName('')
      fetchCategories()
    } catch (err) {
      notify(err.message || 'Failed to create category')
    } finally {
      setIsCategorySubmitting(false)
    }
  }

  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return
    try {
      const res = await deleteStoreCategory(cat._id)
      notify(res.message || `Category "${cat.name}" deleted!`)
      fetchCategories()
    } catch (err) {
      // This fails with "Category is used by products" when products still use it. Show that message.
      notify(err.message || 'Category is used by products')
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* ==================================================== */}
      {/* 1. TOP HEADER & METRICS BAR */}
      {/* ==================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Product Inventory & Catalog
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-black uppercase">
              {stats.inStockCount} Live
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage live Apple hardware, prices in USD & crypto, inventory stock, and categories via store APIs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <span>📁</span>
            <span>Manage Categories</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 via-amber-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-yellow-400/25 active:scale-[0.98]"
          >
            <svg className="w-4 h-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS (bound directly to API data.stats) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Products
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.total ?? totalCount}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Catalog items</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
            In Stock
          </span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats.inStockCount ?? 0}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Instant escrow checkout</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
            Out of Stock
          </span>
          <p className="text-2xl font-black text-rose-600 mt-1">{stats.outOfStockCount ?? 0}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Requires restock</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
            Categories
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.catCount ?? categories.length}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Active collections</span>
        </div>
      </div>

      {/* Load Error Banner */}
      {loadError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-rose-600 font-bold">⚠️</span>
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={fetchProducts}
            className="px-3 py-1 rounded-lg bg-rose-200 hover:bg-rose-300 text-rose-900 font-bold text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. SEARCH & FILTER CONTROLS BAR */}
      {/* ==================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input (Debounced 300ms) */}
        <div className="relative flex-1">
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by title, merchant, badge, specs..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-yellow-400 focus:bg-white transition-all"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown (options come from GET /store/category/list, value is _id, label is name) */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-yellow-400 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock Filter (all, inStock, outOfStock) */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-yellow-400 cursor-pointer"
          >
            <option value="all">All Stock</option>
            <option value="inStock">In Stock Only</option>
            <option value="outOfStock">Out of Stock</option>
          </select>

          {/* Sort By (newest, price-asc, price-desc, rating) */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-yellow-400 cursor-pointer"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>

          {/* View Toggle (Table vs Grid) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table view"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid view"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 4. PRODUCTS LIST (TABLE VIEW OR GRID VIEW) */}
      {/* ==================================================== */}
      {isLoading ? (
        <div className="py-20 text-center bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <div className="flex flex-col items-center justify-center gap-3">
            <svg className="w-8 h-8 animate-spin text-yellow-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs font-bold text-slate-500">Loading products from store API...</span>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 mx-auto flex items-center justify-center font-bold text-xl mb-3">
            📦
          </div>
          <h3 className="text-base font-black text-slate-900">No Products in Catalog</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'all' || stockFilter !== 'all'
              ? 'No items matched your current filter criteria. Try adjusting keywords.'
              : 'Your store catalog is currently empty. Click "Add New Product" to create your first item.'}
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="mt-4 px-4 py-2 rounded-xl bg-yellow-400 text-slate-950 font-bold text-xs uppercase tracking-wider cursor-pointer hover:bg-yellow-500 transition"
          >
            Create Product
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Item</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Rating & Badge</th>
                  <th className="py-3.5 px-4">Stock Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((prod) => {
                  const pId = prod._id || prod.id
                  const categoryName = prod.categoryInfo?.name || categories.find((c) => c._id === prod.category_id || c._id === prod.category)?.name || prod.category || 'General'
                  return (
                    <tr key={pId} className="hover:bg-slate-50/60 transition group">
                      {/* Item */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                            <img
                              src={normalizeImageUrl(prod.image)}
                              alt={prod.title}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.style.opacity = '0.5'
                              }}
                            />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-amber-600 transition block line-clamp-1 max-w-[240px]">
                              {prod.title}
                            </span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <span className="text-amber-500">✓</span> {prod.merchant || 'Verified Store'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold capitalize">
                          {categoryName}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-black text-slate-900 text-sm">
                          ${Number(prod.priceUSD || 0).toFixed(2)}
                        </div>
                      </td>

                      {/* Rating & Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-amber-400">★</span>
                          <span className="font-bold text-slate-900">{prod.rating || '5.0'}</span>
                          <span className="text-slate-400 text-[10px]">({prod.reviews || 0})</span>
                        </div>
                        {prod.badge && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-yellow-400 text-black">
                            {prod.badge}
                          </span>
                        )}
                      </td>

                      {/* Stock Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStock(prod)}
                          title="Click to toggle stock status"
                          className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                            prod.inStock
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              prod.inStock ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          <span>{prod.inStock ? 'In Stock' : 'Out of Stock'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Storefront View */}
                          <button
                            type="button"
                            onClick={() => navigate(`/product/${pId}`)}
                            title="Preview on customer storefront"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(prod)}
                            title="Edit product details"
                            className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                          >
                            Edit
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod)}
                            title="Delete from catalog"
                            className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((prod) => {
            const pId = prod._id || prod.id
            return (
              <div
                key={pId}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="relative h-44 bg-slate-50 p-3 flex items-center justify-center">
                  <img
                    src={normalizeImageUrl(prod.image)}
                    alt={prod.title}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.style.opacity = '0.5'
                    }}
                  />
                  {prod.badge && (
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-yellow-400 text-black shadow-2xs">
                      {prod.badge}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleToggleStock(prod)}
                    className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase cursor-pointer ${
                      prod.inStock ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {prod.inStock ? 'In Stock' : 'Out'}
                  </button>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block truncate">
                      {prod.merchant || 'Verified Store'}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 mt-0.5 line-clamp-2">
                      {prod.title}
                    </h4>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-black text-slate-950 block">
                        ${Number(prod.priceUSD || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(prod)}
                        className="px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(prod)}
                        className="px-2 py-1 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ==================================================== */}
      {/* 5. 2-COLUMN ADD/EDIT PRODUCT MODAL */}
      {/* ==================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-fadeIn">
          <div
            className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-black text-slate-900">
                    {modalMode === 'create' ? 'Add New Marketplace Product' : 'Edit Product Details'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-yellow-100 border border-yellow-300 text-amber-900 text-[10px] font-extrabold uppercase">
                    {modalMode === 'create' ? 'New Item' : `Editing`}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Item will be published to the customer marketplace and escrow catalog immediately.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer transition"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <span className="text-rose-500 font-black">!</span>
                <span>{formError}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleModalSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 min-h-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* LEFT COLUMN: LIVE PRODUCT CARD PREVIEW (lg:col-span-5) */}
                  <div className="lg:col-span-5 flex flex-col gap-4 lg:sticky lg:top-0">
                    <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                            Storefront Card Preview
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400">
                          Customer View
                        </span>
                      </div>

                      {/* Card Preview */}
                      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between max-w-[280px] mx-auto select-none">
                        <div className="relative h-44 w-full bg-slate-50 flex items-center justify-center p-3">
                          <img
                            src={formImage || appleIPhone18ProImg}
                            alt="Preview"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.style.opacity = '0.5'
                            }}
                          />
                          {formBadge && (
                            <div className="absolute top-2.5 left-2.5">
                              <span
                                className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-2xs border border-yellow-300"
                                style={{ backgroundColor: '#facc15', color: '#000000' }}
                              >
                                {formBadge}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
                              <span className="truncate max-w-[180px]">{formMerchant || 'Apple Merchant'}</span>
                              <svg className="w-3.5 h-3.5 shrink-0 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>

                            <h4 className="text-sm font-bold text-slate-950 line-clamp-2 leading-snug mb-2">
                              {formTitle || 'iPhone 18 Pro Deep Titanium Blue (512GB)'}
                            </h4>

                            <div className="flex items-center gap-1.5 mb-3">
                              <div className="flex text-amber-400 text-xs">★★★★★</div>
                              <span className="text-xs font-bold text-slate-900">{formRating || '5.0'}</span>
                              <span className="text-xs text-slate-400">({formReviews || '120'})</span>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                            <div>
                              <p className="text-base font-black text-slate-950 leading-none">
                                ${formPriceUSD ? parseFloat(formPriceUSD).toFixed(2) : '1,299.00'}
                              </p>
                            </div>
                            <span className="px-3 py-1.5 rounded-lg bg-yellow-400 text-slate-950 font-bold text-[10px] uppercase shadow-2xs">
                              Add to Escrow
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Presets */}
                      <div className="mt-4 pt-3 border-t border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                          Quick Device Images:
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {PRESET_PRODUCT_IMAGES.slice(0, 4).map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setFormImage(preset.src)
                                if (modalMode === 'create' && !formTitle) {
                                  setFormTitle(preset.label)
                                }
                              }}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-yellow-50 hover:border-yellow-400 transition cursor-pointer text-left flex items-center gap-1.5"
                            >
                              <img src={preset.src} alt="" className="w-3.5 h-3.5 object-contain" />
                              <span className="truncate">{preset.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: FORM INPUTS (lg:col-span-7) */}
                  <div className="lg:col-span-7 flex flex-col gap-4">
                    
                    {/* SECTION 1: BASIC INFORMATION */}
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/70 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-lg bg-yellow-400 text-slate-950 flex items-center justify-center text-[10px] font-black">1</span>
                        <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Product Identification</h4>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Product Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formTitle}
                          onChange={(e) => setFormTitle(e.target.value)}
                          placeholder="e.g. iPhone 18 Pro Deep Titanium Blue (512GB)"
                          required
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                              Storefront Category <span className="text-rose-500">*</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowInlineCategoryInput(!showInlineCategoryInput)}
                              className="text-[10.5px] font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                            >
                              {showInlineCategoryInput ? 'Cancel' : '+ New Category'}
                            </button>
                          </div>

                          {showInlineCategoryInput && (
                            <div className="mb-2 p-2.5 bg-yellow-50 border border-yellow-300 rounded-xl flex items-center gap-2 animate-fadeIn">
                              <input
                                type="text"
                                placeholder="Category name (e.g. iPhone, Watch)"
                                value={inlineCategoryName}
                                onChange={(e) => setInlineCategoryName(e.target.value)}
                                className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 font-bold focus:outline-none focus:border-yellow-400"
                              />
                              <button
                                type="button"
                                onClick={handleCreateInlineCategory}
                                disabled={isCreatingInlineCategory || !inlineCategoryName.trim()}
                                className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-extrabold text-[11px] hover:bg-yellow-400 hover:text-black transition cursor-pointer disabled:opacity-50 shrink-0"
                              >
                                {isCreatingInlineCategory ? 'Adding...' : 'Add'}
                              </button>
                            </div>
                          )}

                          {categories.length === 0 ? (
                            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
                              <p className="text-[11px] font-bold text-amber-900">
                                ⚠️ No categories in catalog yet.
                              </p>
                              <button
                                type="button"
                                onClick={handleSeedDefaultCategories}
                                disabled={isSeedingCategories}
                                className="w-full py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <span>📁</span>
                                <span>{isSeedingCategories ? 'Creating...' : 'Create Default Categories'}</span>
                              </button>
                            </div>
                          ) : (
                            <select
                              value={formCategoryId}
                              onChange={(e) => setFormCategoryId(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-yellow-400 cursor-pointer shadow-2xs"
                            >
                              {categories.map((c) => (
                                <option key={c._id} value={c._id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Merchant Escrow Name
                          </label>
                          <input
                            type="text"
                            value={formMerchant}
                            onChange={(e) => setFormMerchant(e.target.value)}
                            placeholder="Apple Authorized Escrow Store"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-yellow-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: PRICING & INVENTORY */}
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/70 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-lg bg-yellow-400 text-slate-950 flex items-center justify-center text-[10px] font-black">2</span>
                        <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Pricing & Escrow Rates</h4>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          USD Price ($) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formPriceUSD}
                          onChange={(e) => setFormPriceUSD(e.target.value)}
                          placeholder="1299.00"
                          required
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-black text-slate-900 focus:outline-none focus:border-yellow-400"
                        />
                      </div>

                      <label className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition">
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">Inventory Status</span>
                          <span className="text-[11px] text-slate-500">
                            {formInStock ? '🟢 In Stock (Live on storefront)' : '🔴 Out of Stock (Disabled)'}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={formInStock}
                          onChange={(e) => setFormInStock(e.target.checked)}
                          className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400 cursor-pointer"
                        />
                      </label>
                    </div>

                    {/* SECTION 3: PRODUCT IMAGE & BADGE */}
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/70 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-lg bg-yellow-400 text-slate-950 flex items-center justify-center text-[10px] font-black">3</span>
                        <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Product Showcase Image & Badge</h4>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Showcase Image (URL or Upload File)
                        </label>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <input
                            type="text"
                            value={formImage}
                            onChange={(e) => setFormImage(e.target.value)}
                            placeholder="https://...product.jpg or upload file"
                            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-yellow-400 transition"
                          />

                          <label className="px-3.5 py-2 rounded-xl border border-slate-300 hover:border-slate-400 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white shadow-2xs transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0">
                            {isUploadingImage ? (
                              <>
                                <svg className="w-4 h-4 animate-spin text-slate-700" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>Uploading...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>Upload File</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isUploadingImage}
                              onChange={handleImageFileUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Floating Badge
                          </label>
                          <input
                            type="text"
                            value={formBadge}
                            onChange={(e) => setFormBadge(e.target.value)}
                            placeholder="BEST SELLER"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-yellow-400"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Star Rating (1 - 5)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="1"
                            max="5"
                            value={formRating}
                            onChange={(e) => setFormRating(e.target.value)}
                            placeholder="5.0"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-yellow-400"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Reviews Count
                          </label>
                          <input
                            type="number"
                            value={formReviews}
                            onChange={(e) => setFormReviews(e.target.value)}
                            placeholder="120"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-yellow-400"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Badge Presets:
                        </span>
                        {BADGE_PRESETS.map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => setFormBadge(b)}
                            className={`px-2 py-0.5 rounded text-[10px] font-black transition cursor-pointer ${
                              formBadge.toUpperCase() === b
                                ? 'bg-yellow-400 text-black shadow-2xs'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* SECTION 4: DESCRIPTION & SPECS */}
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/70 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-lg bg-yellow-400 text-slate-950 flex items-center justify-center text-[10px] font-black">4</span>
                        <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Description & Technical Specs</h4>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Product Description
                        </label>
                        <textarea
                          rows={2}
                          value={formDescription}
                          onChange={(e) => setFormDescription(e.target.value)}
                          placeholder="Comprehensive details regarding the hardware device or digital asset..."
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-yellow-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Key Specifications (One per line)
                        </label>
                        <textarea
                          rows={3}
                          value={formSpecsText}
                          onChange={(e) => setFormSpecsText(e.target.value)}
                          placeholder="49mm Aerospace Titanium Case&#10;Dual-Frequency High-Precision GPS&#10;Up to 72 Hours Battery Life"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-mono focus:outline-none focus:border-yellow-400"
                        />
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* STICKY FOOTER ACTIONS */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span>Item automatically displays on customer storefront upon saving.</span>
                </div>

                <div className="flex items-center gap-2.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs uppercase tracking-wider hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || isUploadingImage}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-yellow-400/30 disabled:opacity-50 active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="w-4 h-4 animate-spin text-slate-950" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{modalMode === 'create' ? 'Publish Product' : 'Save Changes'}</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 6. CATEGORY MANAGEMENT MODAL */}
      {/* ==================================================== */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-fadeIn">
          <div
            className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div>
                <h3 className="text-lg font-black text-slate-900">Store Categories</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Organize marketplace collection pills displayed to customers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {/* Add New Category Input */}
              <form onSubmit={handleCreateCategory} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="New category name (e.g. Apple Silicon M4)"
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-yellow-400 focus:bg-white transition"
                />
                <button
                  type="submit"
                  disabled={isCategorySubmitting || !newCategoryName.trim()}
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {isCategorySubmitting ? 'Adding...' : 'Add'}
                </button>
              </form>

              {/* Categories List */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                {categories.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">No categories found.</div>
                ) : (
                  categories.map((cat) => (
                    <div key={cat._id} className="p-3 flex items-center justify-between bg-white hover:bg-slate-50 transition">
                      <div>
                        <span className="font-bold text-slate-900 text-xs sm:text-sm block">{cat.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">slug: {cat.slug}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-bold transition cursor-pointer"
                        title="Delete category"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
