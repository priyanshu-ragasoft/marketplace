import React, { useState, useEffect, useCallback, useRef } from 'react'
import ProductCard from './ProductCard'
import { getPublicWebsiteCategories } from '../../services/storeCategoryService'
import { getPublicWebsiteProducts } from '../../services/storeProductService'

const PRICE_MAX = 25000

function formatUsd(value) {
  return `$${Number(value).toLocaleString('en-US')}`
}

function PriceSlider({ min, max, onMin, onMax }) {
  const left = (min / PRICE_MAX) * 100
  const width = ((max - min) / PRICE_MAX) * 100
  const thumb = 'pointer-events-none absolute inset-x-0 top-0 h-7 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-slate-950 [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-[18px] [&::-moz-range-thumb]:w-[18px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-slate-950'
  return (
    <div>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">From</p>
          <p className="mt-1 text-lg font-medium tracking-tight text-slate-950">{formatUsd(min)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">To</p>
          <p className="mt-1 text-lg font-medium tracking-tight text-slate-950">{formatUsd(max)}</p>
        </div>
      </div>
      <div className="relative h-7">
        <div className="absolute left-1 right-1 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-slate-200" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-yellow-400"
          style={{ left: `calc(${left}% + 2px)`, width: `calc(${width}% - 4px)` }}
        />
        <input
          type="range"
          min={0}
          max={PRICE_MAX}
          step={50}
          value={min}
          onChange={(e) => onMin(Math.min(Number(e.target.value), max - 50))}
          className={thumb}
          aria-label="Minimum price"
        />
        <input
          type="range"
          min={0}
          max={PRICE_MAX}
          step={50}
          value={max}
          onChange={(e) => onMax(Math.max(Number(e.target.value), min + 50))}
          className={thumb}
          aria-label="Maximum price"
        />
      </div>
    </div>
  )
}

export default function ProductGrid({
  searchQuery = '',
  onAddToCart,
  onProductSelect
}) {
  // 1. Categories State from GET /store/category/websidelist
  const [categories, setCategories] = useState([])
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('all')
  const [selectedSubcategorySlug, setSelectedSubcategorySlug] = useState('all')

  // 2. Products State from GET /store/product/websidelist
  const [products, setProducts] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 12

  // Sort State: featured (default) | trending | newest | price-asc | price-desc | rating
  const [sortBy, setSortBy] = useState('featured')
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX)
  const [inStockOnly, setInStockOnly] = useState(false)
  const [verifiedOnly, setVerifiedOnly] = useState(false)

  // Statuses
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  // Fetch Categories on mount
  useEffect(() => {
    let isMounted = true
    getPublicWebsiteCategories()
      .then((res) => {
        if (isMounted) {
          if (res.success && Array.isArray(res.data)) {
            setCategories(res.data)
          } else {
            setCategories([])
          }
        }
      })
      .catch((err) => {
        console.warn('Failed to load categories:', err)
        if (isMounted) setCategories([])
      })
    return () => {
      isMounted = false
    }
  }, [])

  // Fetch Products from GET /store/product/websidelist
  const fetchProducts = useCallback(async (targetPage = 1) => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const res = await getPublicWebsiteProducts({
        page: targetPage,
        limit,
        search_key: searchQuery,
        category: selectedCategorySlug === 'all' ? 'all' : selectedCategorySlug,
        subcategory: selectedCategorySlug === 'all' || selectedSubcategorySlug === 'all' ? '' : selectedSubcategorySlug,
        sort: sortBy,
        min_price: minPrice > 0 ? minPrice : '',
        max_price: maxPrice < PRICE_MAX ? maxPrice : '',
        stock: inStockOnly ? 'inStock' : 'all',
        verified: verifiedOnly,
      })

      if (res.success && res.data) {
        setProducts(res.data.result || [])
        setTotalCount(res.data.totalCount || 0)
        setPage(targetPage)
      } else {
        setErrorMessage(res.message || 'Unable to load products from store catalog.')
        setProducts([])
        setTotalCount(0)
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to connect to marketplace products service.')
      setProducts([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [selectedCategorySlug, selectedSubcategorySlug, sortBy, searchQuery, minPrice, maxPrice, inStockOnly, verifiedOnly])

  // Refetch page 1 when category pill, sort, or search changes
  useEffect(() => {
    fetchProducts(1)
  }, [fetchProducts])

  // Category change handler
  const handleCategoryChange = (slug) => {
    setSelectedCategorySlug(slug)
    setSelectedSubcategorySlug('all')
    setPage(1)
  }

  const parentCategories = categories.filter((cat) => !cat.parent_id)
  const activeCategory = parentCategories.find((cat) => cat.slug === selectedCategorySlug)
  const subcategories = Array.isArray(activeCategory?.subcategories) ? activeCategory.subcategories : []
  const activeSubcategory = subcategories.find((sub) => sub.slug === selectedSubcategorySlug)
    || subcategories.flatMap((sub) => sub.subcategories || []).find((line) => line.slug === selectedSubcategorySlug)
  const catalogTitle = activeSubcategory?.name || activeCategory?.name || 'All verified items'

  // Sort change handler
  const handleSortChange = (newSort) => {
    setSortBy(newSort)
    setPage(1)
  }

  // Pagination calculation
  const totalPages = Math.ceil(totalCount / limit) || 1

  return (
    <div id="products-catalog" className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12">
      
      {/* ==================================================== */}
      {/* 1. CATEGORY PILLS BAR */}
      {/* First pill is always "All Products". Fully rounded pills. */}
      {/* Active: dark navy bg, white text. Inactive: white bg, light border, dark text. */}
      {/* ==================================================== */}
      <div
        className="flex items-center gap-2 overflow-x-auto pb-3 -mx-3 px-3 sm:mx-0 sm:px-0 no-scrollbar scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Fixed First Pill: All Products */}
        <button
          type="button"
          onClick={() => handleCategoryChange('all')}
          className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
            selectedCategorySlug === 'all'
              ? 'bg-[#0f172a] text-white shadow-sm'
              : 'bg-white text-slate-800 hover:text-slate-950 hover:bg-slate-50 border border-slate-200 shadow-2xs'
          }`}
        >
          All Products
        </button>

        {/* Categories from GET /store/category/websidelist */}
        {parentCategories.map((cat) => {
          const isActive = selectedCategorySlug === cat.slug
          return (
            <button
              key={cat._id || cat.slug}
              type="button"
              onClick={() => handleCategoryChange(cat.slug)}
              className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-[#0f172a] text-white shadow-sm'
                  : 'bg-white text-slate-800 hover:text-slate-950 hover:bg-slate-50 border border-slate-200 shadow-2xs'
              }`}
            >
              {cat.name}
            </button>
          )
        })}
      </div>

      <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-200 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10">
        <aside className="mb-6 lg:mb-0 lg:sticky lg:top-24 self-start">
          <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-5">
            <div className="flex items-baseline justify-between">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">Filter</p>
              <button
                type="button"
                onClick={() => {
                  setMinPrice(0)
                  setMaxPrice(PRICE_MAX)
                  setInStockOnly(false)
                  setVerifiedOnly(false)
                  setSelectedSubcategorySlug('all')
                }}
                className="text-[11px] tracking-wide text-slate-400 underline underline-offset-4 hover:text-slate-950 cursor-pointer"
              >
                Reset
              </button>
            </div>
            <div className="mt-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-950">Price</p>
              <div className="mt-4">
                <PriceSlider min={minPrice} max={maxPrice} onMin={setMinPrice} onMax={setMaxPrice} />
              </div>
            </div>
            <div className="mt-6 divide-y divide-slate-100 border-y border-slate-100">
              <button
                type="button"
                onClick={() => setInStockOnly((value) => !value)}
                className="flex w-full items-center justify-between py-3 text-sm cursor-pointer"
              >
                <span className={inStockOnly ? 'text-slate-950' : 'text-slate-600'}>In stock</span>
                <span className={`h-4 w-4 rounded-full border ${inStockOnly ? 'border-yellow-400 bg-yellow-400' : 'border-slate-300'}`} />
              </button>
              <button
                type="button"
                onClick={() => setVerifiedOnly((value) => !value)}
                className="flex w-full items-center justify-between py-3 text-sm cursor-pointer"
              >
                <span className={verifiedOnly ? 'text-slate-950' : 'text-slate-600'}>Verified</span>
                <span className={`h-4 w-4 rounded-full border ${verifiedOnly ? 'border-slate-950 bg-slate-950' : 'border-slate-300'}`} />
              </button>
            </div>
      {subcategories.length > 0 && (
            <div className="mt-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-950">
                {activeCategory?.name}
              </p>
              <div className="mt-3 flex lg:flex-col overflow-x-auto lg:overflow-visible no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedSubcategorySlug('all')}
                className={`border-l-2 px-3 py-2.5 text-left text-sm whitespace-nowrap cursor-pointer shrink-0 ${
                  selectedSubcategorySlug === 'all'
                    ? 'border-yellow-400 text-slate-950 font-medium'
                    : 'border-transparent text-slate-500 hover:text-slate-950'
                }`}
              >
                All
              </button>
              {subcategories.map((sub) => {
                const lines = Array.isArray(sub.subcategories) ? sub.subcategories : []
                const lineActive = lines.some((line) => line.slug === selectedSubcategorySlug)
                const isActive = selectedSubcategorySlug === sub.slug || lineActive
                const label = sub.name || 'Brand'
                return (
                  <div key={sub._id || sub.slug} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedSubcategorySlug(sub.slug)}
                      className={`w-full border-l-2 px-3 py-2.5 text-left text-[15px] tracking-tight whitespace-nowrap cursor-pointer ${
                        isActive ? 'border-yellow-400 text-slate-950' : 'border-transparent text-slate-500 hover:text-slate-950'
                      }`}
                    >
                      {label}
                    </button>
                    {isActive && lines.length > 0 && (
                      <div className="mb-1">
                        {lines.map((line) => (
                          <button
                            key={line._id || line.slug}
                            type="button"
                            onClick={() => setSelectedSubcategorySlug(line.slug)}
                            className={`block w-full pl-6 pr-3 py-1.5 text-left text-xs cursor-pointer ${
                              selectedSubcategorySlug === line.slug ? 'text-slate-950 font-medium' : 'text-slate-400 hover:text-slate-800'
                            }`}
                          >
                            {line.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              </div>
            </div>
      )}
          </div>
        </aside>

      <div>
      {/* ==================================================== */}
      {/* 2. PAGE HEADING, SUBTITLE & SORT CONTROL */}
      {/* ==================================================== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            {catalogTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {totalCount} {totalCount === 1 ? 'item' : 'items'}
            {activeCategory ? ` in ${activeSubcategory ? `${activeCategory.name} / ${activeSubcategory.name}` : activeCategory.name}` : ''}
          </p>
        </div>

        {/* Sort Control on Right */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <label htmlFor="sort-select" className="text-xs text-slate-500 font-semibold shrink-0">
            Sort by:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="bg-white text-xs sm:text-sm text-slate-800 font-bold border border-slate-200 rounded-xl px-3.5 py-2 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 cursor-pointer shadow-2xs"
          >
            <option value="featured">Featured & Trending</option>
            <option value="trending">Trending Now</option>
            <option value="newest">Newest Arrivals</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Top Customer Rated</option>
          </select>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 3. ERROR, LOADING, EMPTY & GRID STATES */}
      {/* ==================================================== */}
      {errorMessage ? (
        <div className="py-16 text-center bg-white border border-rose-200 rounded-3xl p-8 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center text-xl font-bold mb-3">
            ⚠️
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">Unable to Load Products</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">{errorMessage}</p>
          <button
            type="button"
            onClick={() => fetchProducts(page)}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition"
          >
            Try Again
          </button>
        </div>
      ) : isLoading ? (
        /* Loading Skeleton */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-2xl h-80 animate-pulse p-4 flex flex-col justify-between"
            >
              <div className="w-full h-44 bg-slate-100 rounded-xl mb-3" />
              <div className="space-y-2">
                <div className="h-3 bg-slate-100 rounded w-1/3" />
                <div className="h-4 bg-slate-200 rounded w-4/5" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <div className="h-5 bg-slate-200 rounded w-16" />
                <div className="h-8 bg-slate-200 rounded-xl w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        /* Empty State */
        <div className="py-20 text-center bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-500 mx-auto flex items-center justify-center mb-4 text-2xl">
            📦
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No items found</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6">
            There are no products available in this category matching your selection.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategorySlug('all')
              setSortBy('featured')
            }}
            className="px-5 py-2.5 rounded-xl bg-[#0f172a] text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition"
          >
            Reset Category
          </button>
        </div>
      ) : (
        <>
          {/* Products Grid: 4 columns desktop, 2 tablet, 1 mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard
                key={product._id || product.id}
                product={product}
                onAddToCart={onAddToCart}
                onQuickView={() => {
                  if (typeof onProductSelect === 'function') {
                    onProductSelect(product)
                  }
                }}
              />
            ))}
          </div>

          {/* ==================================================== */}
          {/* 4. PAGINATION */}
          {/* ==================================================== */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={() => fetchProducts(page - 1)}
                disabled={page <= 1 || isLoading}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                  <button
                    key={pNum}
                    type="button"
                    onClick={() => fetchProducts(pNum)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition cursor-pointer ${
                      pNum === page
                        ? 'bg-[#0f172a] text-white shadow-2xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {pNum}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => fetchProducts(page + 1)}
                disabled={page >= totalPages || isLoading}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
      </div>
      </div>

    </div>
  )
}
