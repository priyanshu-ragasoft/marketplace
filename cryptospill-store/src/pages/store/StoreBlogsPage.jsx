import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  listStoreBlogs,
  createStoreBlog,
  updateStoreBlog,
  deleteStoreBlog,
  getStoreBlogDetails,
  getBlogHeroBannerConfig,
  saveBlogHeroBannerConfig,
  DEFAULT_BLOG_HERO_BANNER
} from '../../services/storeBlogService'
import { uploadBannerImage } from '../../services/storeBannerService'
import { normalizeImageUrl } from '../../utils/imageUrl'

const BANNER_IMAGE_PRESETS = [
  { label: 'None (Gradient)', url: '' },
  { label: 'Dark Mesh Grid', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80' },
  { label: 'Crypto Blockchain', url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1600&auto=format&fit=crop&q=80' },
  { label: 'Apple Workspace', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1600&auto=format&fit=crop&q=80' },
  { label: 'Cyber Network', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1600&auto=format&fit=crop&q=80' }
]

const COVER_PRESETS = [
  { label: 'Escrow Vault', url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&auto=format&fit=crop&q=80' },
  { label: 'Apple Hardware', url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80' },
  { label: 'Crypto Coins', url: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=800&auto=format&fit=crop&q=80' },
  { label: 'Merchant Office', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80' },
  { label: 'MacBook Workspace', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80' }
]

const CATEGORY_OPTIONS = [
  'Security & Escrow',
  'Apple Hardware',
  'Crypto & Web3',
  'Merchant Guides',
  'Platform News',
  'General'
]

export default function StoreBlogsPage({ onShowToast }) {
  const [rows, setRows] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [searchKey, setSearchKey] = useState('')
  const [activeFilter, setActiveFilter] = useState('all') // 'all' | 'active' | 'inactive'
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isLoadingList, setIsLoadingList] = useState(false)
  const [listError, setListError] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' | 'edit'
  const [editingId, setEditingId] = useState(null)

  // Form Fields
  const [formTitle, setFormTitle] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formCategory, setFormCategory] = useState('Security & Escrow')
  const [formAuthorName, setFormAuthorName] = useState('CryptoSpill Editorial')
  const [formAuthorRole, setFormAuthorRole] = useState('Staff Writer')
  const [formAuthorAvatar, setFormAuthorAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80')
  const [formReadTime, setFormReadTime] = useState('4 min read')
  const [formCoverImage, setFormCoverImage] = useState(COVER_PRESETS[0].url)
  const [formSummary, setFormSummary] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formTags, setFormTags] = useState('Escrow, Apple, Security')
  const [formIsActive, setFormIsActive] = useState(true)

  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingCoverImage, setIsUploadingCoverImage] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  // ----------------------------------------------------
  // HERO BANNER CUSTOMIZER MODAL STATE
  // ----------------------------------------------------
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false)
  const [bannerBadge, setBannerBadge] = useState('')
  const [bannerTitle, setBannerTitle] = useState('')
  const [bannerSubtitle, setBannerSubtitle] = useState('')
  const [bannerImage, setBannerImage] = useState('')
  const [bannerOpacity, setBannerOpacity] = useState(75)
  const [bannerPlaceholder, setBannerPlaceholder] = useState('')
  const [isSavingBanner, setIsSavingBanner] = useState(false)
  const [isUploadingBannerImage, setIsUploadingBannerImage] = useState(false)

  // Open Banner Modal
  const handleOpenBannerModal = () => {
    const config = getBlogHeroBannerConfig()
    setBannerBadge(config.badgeText || '')
    setBannerTitle(config.title || '')
    setBannerSubtitle(config.subtitle || '')
    setBannerImage(config.backgroundImage || '')
    setBannerOpacity(config.overlayOpacity ?? 75)
    setBannerPlaceholder(config.searchPlaceholder || '')
    setIsBannerModalOpen(true)
  }

  // Save Banner Modal
  const handleSaveBanner = (e) => {
    e.preventDefault()
    setIsSavingBanner(true)
    try {
      saveBlogHeroBannerConfig({
        badgeText: bannerBadge.trim(),
        title: bannerTitle.trim() || DEFAULT_BLOG_HERO_BANNER.title,
        subtitle: bannerSubtitle.trim() || DEFAULT_BLOG_HERO_BANNER.subtitle,
        backgroundImage: bannerImage.trim(),
        overlayOpacity: Number(bannerOpacity) || 75,
        searchPlaceholder: bannerPlaceholder.trim() || DEFAULT_BLOG_HERO_BANNER.searchPlaceholder
      })
      notify('Hero banner & text updated! Live on storefront.')
      setIsBannerModalOpen(false)
    } catch (err) {
      notify(`Failed to save banner: ${err.message}`)
    } finally {
      setIsSavingBanner(false)
    }
  }

  // Reset Banner to Default
  const handleResetBannerDefault = () => {
    setBannerBadge(DEFAULT_BLOG_HERO_BANNER.badgeText)
    setBannerTitle(DEFAULT_BLOG_HERO_BANNER.title)
    setBannerSubtitle(DEFAULT_BLOG_HERO_BANNER.subtitle)
    setBannerImage('')
    setBannerOpacity(75)
    setBannerPlaceholder(DEFAULT_BLOG_HERO_BANNER.searchPlaceholder)
  }

  const notify = useCallback((msg) => {
    if (onShowToast) onShowToast(msg)
  }, [onShowToast])

  // ----------------------------------------------------
  // LOCAL IMAGE FILE UPLOAD HANDLERS
  // ----------------------------------------------------
  const handleCoverImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingCoverImage(true)

    let localDataUrl = null
    try {
      localDataUrl = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(file)
      })
    } catch {
      // ignore
    }

    try {
      const uploadedUrl = await uploadBannerImage(file)
      if (uploadedUrl) {
        setFormCoverImage(normalizeImageUrl(uploadedUrl))
        notify('Cover image uploaded and synced successfully!')
      } else if (localDataUrl) {
        setFormCoverImage(localDataUrl)
        notify('Cover image loaded from file.')
      }
    } catch (err) {
      console.warn('Backend image upload error, using local file:', err)
      if (localDataUrl) {
        setFormCoverImage(localDataUrl)
        notify('Cover image loaded from file.')
      } else {
        notify(`Upload failed: ${err.message}`)
      }
    } finally {
      setIsUploadingCoverImage(false)
      e.target.value = ''
    }
  }

  const handleBannerImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingBannerImage(true)

    let localDataUrl = null
    try {
      localDataUrl = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(file)
      })
    } catch {
      // ignore
    }

    try {
      const uploadedUrl = await uploadBannerImage(file)
      if (uploadedUrl) {
        setBannerImage(normalizeImageUrl(uploadedUrl))
        notify('Hero banner image uploaded and synced successfully!')
      } else if (localDataUrl) {
        setBannerImage(localDataUrl)
        notify('Hero banner image loaded from file.')
      }
    } catch (err) {
      console.warn('Backend image upload error, using local file:', err)
      if (localDataUrl) {
        setBannerImage(localDataUrl)
        notify('Hero banner image loaded from file.')
      } else {
        notify(`Upload failed: ${err.message}`)
      }
    } finally {
      setIsUploadingBannerImage(false)
      e.target.value = ''
    }
  }

  // Fetch blogs list
  const fetchList = useCallback(async () => {
    setIsLoadingList(true)
    setListError('')
    try {
      let isActiveParam = ''
      if (activeFilter === 'active') isActiveParam = 'true'
      if (activeFilter === 'inactive') isActiveParam = 'false'

      const res = await listStoreBlogs({
        page,
        limit,
        search_key: searchKey,
        category: selectedCategory,
        isActive: isActiveParam
      })
      setRows(res.rows || [])
      setTotalCount(res.totalCount || 0)
    } catch (err) {
      setListError(err.message || 'Failed to load blogs')
    } finally {
      setIsLoadingList(false)
    }
  }, [page, limit, searchKey, activeFilter, selectedCategory])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  // Search debounce
  const searchTimeoutRef = useRef(null)
  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearchKey(val)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      setPage(1)
      fetchList()
    }, 350)
  }

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setModalMode('create')
    setEditingId(null)
    setFormTitle('')
    setFormSlug('')
    setFormCategory('Security & Escrow')
    setFormAuthorName('CryptoSpill Editorial')
    setFormAuthorRole('Staff Writer')
    setFormAuthorAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80')
    setFormReadTime('4 min read')
    setFormCoverImage(COVER_PRESETS[0].url)
    setFormSummary('')
    setFormContent('')
    setFormTags('Apple, Escrow, Web3')
    setFormIsActive(true)
    setFormErrors({})
    setIsModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEditModal = async (blog) => {
    setModalMode('edit')
    setEditingId(blog._id)
    setIsModalOpen(true)
    setFormTitle(blog.title || '')
    setFormSlug(blog.slug || '')
    setFormCategory(blog.category || 'General')
    setFormAuthorName(blog.author?.name || 'CryptoSpill Editorial')
    setFormAuthorRole(blog.author?.role || 'Staff Writer')
    setFormAuthorAvatar(blog.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80')
    setFormReadTime(blog.readTime || '4 min read')
    setFormCoverImage(normalizeImageUrl(blog.coverImage || COVER_PRESETS[0].url))
    setFormSummary(blog.summary || '')
    setFormContent(blog.content || '')
    setFormTags(Array.isArray(blog.tags) ? blog.tags.join(', ') : (blog.tags || ''))
    setFormIsActive(blog.isActive !== false)
    setFormErrors({})

    try {
      const details = await getStoreBlogDetails(blog._id)
      if (details) {
        if (details.title) setFormTitle(details.title)
        if (details.slug) setFormSlug(details.slug)
        if (details.category) setFormCategory(details.category)
        if (details.author?.name) setFormAuthorName(details.author.name)
        if (details.author?.role) setFormAuthorRole(details.author.role)
        if (details.author?.avatar) setFormAuthorAvatar(details.author.avatar)
        if (details.readTime) setFormReadTime(details.readTime)
        if (details.coverImage) setFormCoverImage(normalizeImageUrl(details.coverImage))
        if (details.summary) setFormSummary(details.summary)
        if (details.content) setFormContent(details.content)
        if (details.tags) setFormTags(Array.isArray(details.tags) ? details.tags.join(', ') : details.tags)
        if (details.isActive !== undefined) setFormIsActive(details.isActive)
      }
    } catch {
      // Row prefill remains
    }
  }

  // Auto-slugify when typing title in create mode
  const handleTitleChange = (val) => {
    setFormTitle(val)
    if (modalMode === 'create' && !formSlug) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
      setFormSlug(generated)
    }
  }

  // Validation & Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault()
    const errors = {}

    if (!formTitle.trim()) {
      errors.title = 'Title is required'
    }
    if (!formSummary.trim()) {
      errors.summary = 'Summary is required'
    }
    if (!formContent.trim()) {
      errors.content = 'Article content is required'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        title: formTitle,
        slug: formSlug || formTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category: formCategory,
        authorName: formAuthorName,
        authorRole: formAuthorRole,
        authorAvatar: formAuthorAvatar,
        readTime: formReadTime,
        coverImage: normalizeImageUrl(formCoverImage),
        summary: formSummary,
        content: formContent,
        tags: formTags.split(',').map((t) => t.trim()).filter(Boolean),
        isActive: formIsActive
      }

      if (modalMode === 'create') {
        await createStoreBlog(payload)
        notify('New blog article published successfully!')
      } else {
        await updateStoreBlog(editingId, payload)
        notify('Blog article updated successfully!')
      }

      setIsModalOpen(false)
      fetchList()
    } catch (err) {
      notify(`Error: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle quick status
  const handleToggleStatus = async (blog) => {
    try {
      await updateStoreBlog(blog._id, { isActive: !blog.isActive })
      notify(`Blog ${blog.isActive ? 'hidden from storefront' : 'activated on storefront'}!`)
      fetchList()
    } catch (err) {
      notify(`Error updating status: ${err.message}`)
    }
  }

  // Delete blog
  const handleDeleteBlog = async (id) => {
    try {
      await deleteStoreBlog(id)
      notify('Blog article deleted.')
      setDeleteConfirmId(null)
      fetchList()
    } catch (err) {
      notify(`Failed to delete: ${err.message}`)
    }
  }

  // Metrics
  const activeCount = rows.filter((r) => r.isActive).length
  const totalViews = rows.reduce((acc, r) => acc + (r.views || 0), 0)

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-yellow-400/20 font-black">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">Storefront Blog Articles &amp; Guides</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-extrabold uppercase">
                Active System
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Publish educational guides, escrow transparency reports, and tech drop announcements directly to the public footer and blog page.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleOpenBannerModal}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
          >
            <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Edit Hero Banner &amp; Text</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm shadow-yellow-400/20 active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add New Article</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Articles</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalCount}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Live / Published</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Drafts / Hidden</p>
          <p className="text-2xl font-black text-slate-400 mt-1">{totalCount - activeCount}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Reads</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{totalViews}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchKey}
            onChange={handleSearchChange}
            placeholder="Search article titles or tags..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-yellow-400 focus:bg-white transition"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-yellow-400"
          >
            <option value="all">All Categories</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Status Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            {['all', 'active', 'inactive'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setActiveFilter(mode)}
                className={`px-3 py-1 text-xs font-bold rounded-lg capitalize transition cursor-pointer ${activeFilter === mode
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                {mode === 'active' ? 'Published' : mode === 'inactive' ? 'Draft' : 'All'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Blogs Table / List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {isLoadingList ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-500">Loading articles...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-bold text-slate-600 mb-1">No articles found</p>
            <p className="text-xs text-slate-400 mb-4">Click below to create your first store guide or article.</p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-yellow-400 hover:text-black transition cursor-pointer"
            >
              + Create Article
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Article</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Views</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((blog) => (
                  <tr key={blog._id} className="hover:bg-slate-50/70 transition">
                    {/* Article Thumbnail + Title */}
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="flex items-center gap-3">
                        <img
                          src={normalizeImageUrl(blog.coverImage || COVER_PRESETS[0].url)}
                          alt={blog.title}
                          className="w-12 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate" title={blog.title}>
                            {blog.title}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono truncate">
                            /{blog.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 font-semibold text-[11px]">
                        {blog.category || 'General'}
                      </span>
                    </td>

                    {/* Author */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {blog.author?.avatar && (
                          <img
                            src={blog.author.avatar}
                            alt={blog.author?.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <p className="font-semibold text-slate-800">{blog.author?.name || 'Staff'}</p>
                          <p className="text-[10px] text-slate-400">{blog.readTime || '4 min'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(blog)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer transition ${blog.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                          }`}
                        title="Click to toggle status"
                      >
                        {blog.isActive ? '● Live' : '○ Draft'}
                      </button>
                    </td>

                    {/* Views */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-600">
                      {blog.views || 0}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(blog)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/60 font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Edit</span>
                        </button>

                        {/* Delete Button */}
                        {deleteConfirmId === blog._id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteBlog(blog._id)}
                              className="px-2 py-1 rounded-lg bg-rose-600 text-white font-bold text-[10px] hover:bg-rose-700 transition cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 font-bold text-[10px] hover:bg-slate-300 transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(blog._id)}
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition cursor-pointer"
                            title="Delete Article"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {modalMode === 'create' ? 'Create New Blog Article' : 'Update Blog Article'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fill in the details below to publish or update content on the marketplace.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
              {/* Title & Slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Article Title *
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. How Escrow Protects Your Purchase"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-yellow-400 focus:bg-white"
                  />
                  {formErrors.title && (
                    <p className="text-[11px] text-rose-600 mt-1">{formErrors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="e.g. how-escrow-protects-purchase"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-yellow-400 focus:bg-white font-mono"
                  />
                </div>
              </div>

              {/* Category & Read Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-yellow-400"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Read Time
                  </label>
                  <input
                    type="text"
                    value={formReadTime}
                    onChange={(e) => setFormReadTime(e.target.value)}
                    placeholder="e.g. 5 min read"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-yellow-400 focus:bg-white"
                  />
                </div>
              </div>

              {/* Cover Image & Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cover Image (URL or Upload File)
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={formCoverImage}
                    onChange={(e) => setFormCoverImage(e.target.value)}
                    placeholder="Paste image link or click Upload File..."
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-yellow-400 focus:bg-white"
                  />

                  <label className="px-3.5 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white shadow-2xs transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0">
                    {isUploadingCoverImage ? (
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
                      disabled={isUploadingCoverImage}
                      onChange={handleCoverImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Image presets */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-[11px] text-slate-400">Quick Presets:</span>
                  {COVER_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setFormCoverImage(preset.url)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition cursor-pointer ${formCoverImage === preset.url
                        ? 'bg-amber-400 text-black border-amber-400'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Author Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Author Name
                  </label>
                  <input
                    type="text"
                    value={formAuthorName}
                    onChange={(e) => setFormAuthorName(e.target.value)}
                    placeholder="e.g. CryptoSpill Editorial"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Author Role
                  </label>
                  <input
                    type="text"
                    value={formAuthorRole}
                    onChange={(e) => setFormAuthorRole(e.target.value)}
                    placeholder="e.g. Security Lead"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-yellow-400"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="Escrow, Apple, Hardware, Security"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-yellow-400"
                />
              </div>

              {/* Excerpt / Summary */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Short Summary / Excerpt *
                </label>
                <textarea
                  rows={2}
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  placeholder="Brief 1-2 sentence overview of the article shown in the card preview..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-yellow-400"
                />
                {formErrors.summary && (
                  <p className="text-[11px] text-rose-600 mt-1">{formErrors.summary}</p>
                )}
              </div>

              {/* Full Content / Markdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Article Body (Supports Headings with ### and Paragraphs) *
                </label>
                <textarea
                  rows={7}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Type full article paragraphs. Use ### for subheadings..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-yellow-400 font-sans"
                />
                {formErrors.content && (
                  <p className="text-[11px] text-rose-600 mt-1">{formErrors.content}</p>
                )}
              </div>

              {/* Published Toggle */}
              <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <input
                  type="checkbox"
                  id="formIsActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-yellow-400 cursor-pointer"
                />
                <label htmlFor="formIsActive" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Publish on Storefront (Active Immediately)
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingCoverImage}
                  className="px-6 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'Saving...'
                    : modalMode === 'create'
                      ? 'Create & Publish'
                      : 'Save & Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HERO BANNER CUSTOMIZER MODAL */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-400/20 text-slate-950 flex items-center justify-center font-black">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Blog Page Hero Banner Customizer
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update the header text, badge tag, search placeholder, and background image displayed at the top of /blog.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBannerModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* LIVE PREVIEW BOX */}
            <div className="p-6 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Storefront Preview
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  Matches /blog top header
                </span>
              </div>

              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#121212] via-[#1a1a1a] to-[#222222] text-white p-7 sm:p-9 text-center border border-neutral-800 shadow-md">
                {/* Background image in preview */}
                {bannerImage && (
                  <div className="absolute inset-0 z-0">
                    <img
                      src={bannerImage}
                      alt="Banner Preview"
                      className="w-full h-full object-cover object-center"
                    />
                    <div
                      className="absolute inset-0 bg-neutral-950"
                      style={{ opacity: Number(bannerOpacity) / 100 }}
                    />
                  </div>
                )}

                <div className="relative z-10 space-y-3 max-w-2xl mx-auto">
                  {bannerBadge && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-400 text-[10px] font-black uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                      {bannerBadge}
                    </div>
                  )}

                  <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                    {bannerTitle || 'Marketplace Insights, Escrow Guides & Tech Drops'}
                  </h2>

                  <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-xl mx-auto">
                    {bannerSubtitle || 'Read verified guides on smart contract escrow security, Apple serial check protocols, and decentralized Web3 payments.'}
                  </p>

                  <div className="max-w-md mx-auto pt-2">
                    <div className="relative">
                      <input
                        type="text"
                        disabled
                        placeholder={bannerPlaceholder || 'Search articles by title, summary, or tags...'}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-900/90 border border-neutral-700 text-neutral-400 placeholder-neutral-500 text-xs shadow-inner cursor-not-allowed"
                      />
                      <svg className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Banner Editor Form */}
            <form onSubmit={handleSaveBanner} className="p-6 space-y-5">
              {/* Badge Text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Badge Pill Text (Top Tag)
                </label>
                <input
                  type="text"
                  value={bannerBadge}
                  onChange={(e) => setBannerBadge(e.target.value)}
                  placeholder="e.g. CRYPTOSPILL EDITORIAL & HARDWARE GUIDES"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-yellow-400 focus:bg-white"
                />
              </div>

              {/* Banner Headline / Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Banner Headline / Title *
                </label>
                <input
                  type="text"
                  required
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  placeholder="e.g. Marketplace Insights, Escrow Guides & Tech Drops"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-yellow-400 focus:bg-white"
                />
              </div>

              {/* Banner Subtitle / Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Banner Subtitle / Description *
                </label>
                <textarea
                  rows={2}
                  required
                  value={bannerSubtitle}
                  onChange={(e) => setBannerSubtitle(e.target.value)}
                  placeholder="e.g. Read verified guides on smart contract escrow security, Apple serial check protocols, and decentralized Web3 payments."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-yellow-400 focus:bg-white leading-relaxed"
                />
              </div>

              {/* Background Image URL & Presets */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Background Image (URL or Upload File)
                  </label>
                  {bannerImage && (
                    <button
                      type="button"
                      onClick={() => setBannerImage('')}
                      className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Clear Image
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={bannerImage}
                    onChange={(e) => setBannerImage(e.target.value)}
                    placeholder="Paste background image link or click Upload File..."
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-yellow-400 focus:bg-white font-mono"
                  />

                  <label className="px-3.5 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white shadow-2xs transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0">
                    {isUploadingBannerImage ? (
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
                      disabled={isUploadingBannerImage}
                      onChange={handleBannerImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Presets */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-[11px] font-bold text-slate-400">Image Presets:</span>
                  {BANNER_IMAGE_PRESETS.map((preset) => {
                    const isSelected = bannerImage === preset.url
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setBannerImage(preset.url)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                          isSelected
                            ? 'bg-yellow-400 text-black border-yellow-400 shadow-2xs'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Dark Overlay Opacity Slider */}
              {bannerImage && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-800">
                      Dark Overlay Opacity
                    </label>
                    <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      {bannerOpacity}% Dark
                    </span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="95"
                    step="5"
                    value={bannerOpacity}
                    onChange={(e) => setBannerOpacity(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Higher opacity makes background darker so the white text stays 100% sharp and readable.
                  </p>
                </div>
              )}

              {/* Search Placeholder */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Search Input Placeholder Text
                </label>
                <input
                  type="text"
                  value={bannerPlaceholder}
                  onChange={(e) => setBannerPlaceholder(e.target.value)}
                  placeholder="Search articles by title, summary, or tags..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-yellow-400 focus:bg-white"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleResetBannerDefault}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Reset Defaults
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBannerModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingBanner || isUploadingBannerImage}
                    className="px-6 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isSavingBanner ? 'Saving...' : 'Save & Publish Banner'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
