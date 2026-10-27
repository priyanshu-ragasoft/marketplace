import React, { useState, useEffect, useCallback, useRef } from 'react'
import logoImg from '../../assets/logo.png'
import {
  listStoreBanners,
  getStoreBannerDetails,
  createStoreBanner,
  updateStoreBanner,
  deleteStoreBanner,
  uploadBannerImage
} from '../../services/storeBannerService'
import { PRESET_IMAGES } from '../../components/marketplace/marketplaceData'
import { normalizeImageUrl } from '../../utils/imageUrl'

// Curated preset background colors
const PRESET_BG_COLORS = [
  { label: 'Dark Charcoal', value: '#1c1c1c' },
  { label: 'Volcano Orange', value: '#ff6f00' },
  { label: 'Cyber Purple', value: '#7b1fa2' },
  { label: 'Emerald Studio', value: '#00695c' },
  { label: 'Sapphire Blue', value: '#1e3a8a' },
  { label: 'Ruby Crimson', value: '#991b1b' },
  { label: 'Pitch Black', value: '#09090b' },
  { label: 'Slate Navy', value: '#0f172a' }
]

export default function StoreBannersPage({ onShowToast }) {
  // ----------------------------------------------------
  // LIST & FILTER STATE
  // ----------------------------------------------------
  const [rows, setRows] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [searchKey, setSearchKey] = useState('')
  // activeFilter: 'all' | 'active' | 'inactive'
  const [activeFilter, setActiveFilter] = useState('all')
  const [sortColumn] = useState('sortOrder')
  const [sortDirection] = useState('desc')
  const [isLoadingList, setIsLoadingList] = useState(false)
  const [listError, setListError] = useState('')
  const [listSuccess, setListSuccess] = useState('')

  // ----------------------------------------------------
  // MODAL STATE (CREATE & EDIT IN ONE DIALOG)
  // ----------------------------------------------------
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' | 'edit'
  const [editingId, setEditingId] = useState(null)
  const [initialEditValues, setInitialEditValues] = useState(null)

  // Form Fields
  const [formTitle, setFormTitle] = useState('')
  const [formOfferText, setFormOfferText] = useState('')
  const [formSubtitle, setFormSubtitle] = useState('')
  const [formRewardText, setFormRewardText] = useState('')
  const [formBadgeText, setFormBadgeText] = useState('')
  const [formLiveLabel, setFormLiveLabel] = useState('LIVE NOW')
  const [formImage, setFormImage] = useState('')
  const [formImageFit, setFormImageFit] = useState('cover')
  const [formBackgroundColor, setFormBackgroundColor] = useState('#1c1c1c')
  const [formLinkUrl, setFormLinkUrl] = useState('')
  const [formSortOrder, setFormSortOrder] = useState(0)
  const [formIsActive, setFormIsActive] = useState(true)

  // Upload & Validation States
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  const notify = useCallback((msg) => {
    if (onShowToast) onShowToast(msg)
  }, [onShowToast])

  // ----------------------------------------------------
  // FETCH LIST FROM API
  // ----------------------------------------------------
  const fetchList = useCallback(async (targetPage = page, search = searchKey, filter = activeFilter) => {
    setIsLoadingList(true)
    setListError('')
    try {
      let isActiveParam = ''
      if (filter === 'active') isActiveParam = 'true'
      if (filter === 'inactive') isActiveParam = 'false'

      const res = await listStoreBanners({
        page: targetPage,
        limit,
        search_key: search,
        sort_column: sortColumn,
        sort_direction: sortDirection,
        isActive: isActiveParam
      })

      setRows(res.rows || [])
      setTotalCount(res.totalCount || 0)
    } catch (err) {
      console.error('Failed to load banners:', err)
      setListError(err.message || 'Failed to load banners list.')
    } finally {
      setIsLoadingList(false)
    }
  }, [page, limit, searchKey, activeFilter, sortColumn, sortDirection])

  // Initial fetch & page/filter changes
  useEffect(() => {
    fetchList(page, searchKey, activeFilter)
  }, [page, activeFilter])

  // Debounced search
  const searchTimeoutRef = useRef(null)
  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearchKey(val)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      setPage(1)
      fetchList(1, val, activeFilter)
    }, 350)
  }

  // ----------------------------------------------------
  // OPEN MODAL FOR CREATE
  // ----------------------------------------------------
  const handleOpenCreateModal = () => {
    setModalMode('create')
    setEditingId(null)
    setInitialEditValues(null)
    setFormTitle('CryptoSpill Apple Fest')
    setFormOfferText('30–50% Off')
    setFormSubtitle('On iPhone 18 Pro Max & Pro Series')
    setFormRewardText('Upto 8% Crypto Cashback')
    setFormBadgeText('THE BIG SPILL DAYS')
    setFormLiveLabel('LIVE NOW')
    setFormImage(PRESET_IMAGES?.[0]?.src || '')
    setFormImageFit('contain')
    setFormBackgroundColor('#0f172a')
    setFormLinkUrl('')
    setFormSortOrder(0)
    setFormIsActive(true)
    setFormError('')
    setIsModalOpen(true)
  }

  // ----------------------------------------------------
  // OPEN MODAL FOR EDIT (LOAD GET /store/banner/details/:banner_id)
  // ----------------------------------------------------
  const handleOpenEditModal = async (bannerId) => {
    setModalMode('edit')
    setEditingId(bannerId)
    setFormError('')
    setIsLoadingDetails(true)
    setIsModalOpen(true)

    try {
      const res = await getStoreBannerDetails(bannerId)
      const data = res.data || {}

      const title = data.title || ''
      const offerText = data.offerText || ''
      const subtitle = data.subtitle || ''
      const rewardText = data.rewardText || ''
      const badgeText = data.badgeText || ''
      const liveLabel = data.liveLabel || 'LIVE NOW'
      const image = normalizeImageUrl(data.image || '')
      const backgroundColor = data.backgroundColor || '#1c1c1c'
      const linkUrl = data.linkUrl || ''
      const sortOrder = data.sortOrder !== undefined ? Number(data.sortOrder) : 0
      const isActive = data.isActive !== undefined ? Boolean(data.isActive) : true

      setFormTitle(title)
      setFormOfferText(offerText)
      setFormSubtitle(subtitle)
      setFormRewardText(rewardText)
      setFormBadgeText(badgeText)
      setFormLiveLabel(liveLabel)
      setFormImage(image)
      setFormImageFit(image && (image.includes('apple-') || image.includes('cutout')) ? 'contain' : 'cover')
      setFormBackgroundColor(backgroundColor)
      setFormLinkUrl(linkUrl)
      setFormSortOrder(sortOrder)
      setFormIsActive(isActive)

      // Store initial values to track and send only changed fields on update
      setInitialEditValues({
        title,
        offerText,
        subtitle,
        rewardText,
        badgeText,
        liveLabel,
        image,
        backgroundColor,
        linkUrl,
        sortOrder,
        isActive
      })
    } catch (err) {
      console.error('Failed to load banner details:', err)
      setFormError(err.message || 'Could not load banner details.')
    } finally {
      setIsLoadingDetails(false)
    }
  }

  // ----------------------------------------------------
  // IMAGE FILE UPLOAD HANDLER: POST /api/v1/upload/image (with local DataURL fallback)
  // ----------------------------------------------------
  const handleImageFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingImage(true)
    setFormError('')

    // Read local file as Data URL immediately as guaranteed fallback
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
        setFormImage(normalizeImageUrl(uploadedUrl))
        setFormImageFit('cover')
        notify('Image uploaded successfully!')
      } else if (localDataUrl) {
        setFormImage(localDataUrl)
        setFormImageFit('cover')
        notify('Image loaded from file.')
      }
    } catch (err) {
      console.warn('Backend image upload endpoint error, using local file:', err)
      if (localDataUrl) {
        setFormImage(localDataUrl)
        setFormImageFit('cover')
        notify('Image loaded from file.')
      } else {
        setFormError(`Image upload failed: ${err.message}`)
      }
    } finally {
      setIsUploadingImage(false)
      // reset input value so re-uploading same file triggers change
      e.target.value = ''
    }
  }

  // ----------------------------------------------------
  // TOGGLE ISACTIVE DIRECTLY FROM TABLE
  // ----------------------------------------------------
  const handleToggleRowActive = async (row) => {
    try {
      const nextActive = !row.isActive
      await updateStoreBanner(row._id, { isActive: nextActive })
      setRows((prev) =>
        prev.map((item) => (item._id === row._id ? { ...item, isActive: nextActive } : item))
      )
      notify(`Banner marked as ${nextActive ? 'Active' : 'Inactive'}`)
      window.dispatchEvent(new CustomEvent('cryptospill_banners_updated'))
    } catch (err) {
      notify(`Failed to toggle status: ${err.message}`)
    }
  }

  // ----------------------------------------------------
  // MODAL SUBMISSION (CREATE OR EDIT)
  // ----------------------------------------------------
  const handleModalSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    const trimmedTitle = formTitle.trim()
    if (!trimmedTitle) {
      setFormError('Title is required. Please enter a banner title.')
      return
    }

    setIsSubmitting(true)

    const cleanImage = normalizeImageUrl(formImage.trim())

    try {
      if (modalMode === 'create') {
        // POST /store/banner/create
        const payload = {
          title: trimmedTitle,
          offerText: formOfferText.trim(),
          subtitle: formSubtitle.trim(),
          rewardText: formRewardText.trim(),
          badgeText: formBadgeText.trim(),
          liveLabel: formLiveLabel.trim() || 'LIVE NOW',
          image: cleanImage,
          backgroundColor: formBackgroundColor.trim() || '#1c1c1c',
          linkUrl: formLinkUrl.trim(),
          sortOrder: Number(formSortOrder) || 0,
          isActive: formIsActive
        }

        const res = await createStoreBanner(payload)
        const successMsg = res.message || 'Banner created successfully'
        setIsModalOpen(false)
        setListSuccess(successMsg)
        notify(successMsg)
        window.dispatchEvent(new CustomEvent('cryptospill_banners_updated'))
        setTimeout(() => setListSuccess(''), 4000)
        fetchList(1, searchKey, activeFilter)
      } else {
        // PUT /store/banner/update/:banner_id
        // Send only changed fields
        const changedFields = {}
        const prev = initialEditValues || {}

        if (trimmedTitle !== prev.title) changedFields.title = trimmedTitle
        if (formOfferText.trim() !== prev.offerText) changedFields.offerText = formOfferText.trim()
        if (formSubtitle.trim() !== prev.subtitle) changedFields.subtitle = formSubtitle.trim()
        if (formRewardText.trim() !== prev.rewardText) changedFields.rewardText = formRewardText.trim()
        if (formBadgeText.trim() !== prev.badgeText) changedFields.badgeText = formBadgeText.trim()
        if ((formLiveLabel.trim() || 'LIVE NOW') !== prev.liveLabel) changedFields.liveLabel = formLiveLabel.trim() || 'LIVE NOW'
        if (cleanImage !== prev.image) changedFields.image = cleanImage
        if (formBackgroundColor.trim() !== prev.backgroundColor) changedFields.backgroundColor = formBackgroundColor.trim()
        if (formLinkUrl.trim() !== prev.linkUrl) changedFields.linkUrl = formLinkUrl.trim()
        if (Number(formSortOrder) !== Number(prev.sortOrder)) changedFields.sortOrder = Number(formSortOrder) || 0
        if (formIsActive !== prev.isActive) changedFields.isActive = formIsActive

        if (Object.keys(changedFields).length === 0) {
          setIsModalOpen(false)
          notify('No fields were changed.')
          return
        }

        const res = await updateStoreBanner(editingId, changedFields)
        const successMsg = res.message || 'Banner updated successfully'
        setIsModalOpen(false)
        setListSuccess(successMsg)
        notify(successMsg)
        window.dispatchEvent(new CustomEvent('cryptospill_banners_updated'))
        setTimeout(() => setListSuccess(''), 4000)
        fetchList(page, searchKey, activeFilter)
      }
    } catch (err) {
      console.error('Save banner error:', err)
      setFormError(err.message || 'An error occurred while saving the banner.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ----------------------------------------------------
  // DELETE BANNER: DELETE /store/banner/delete/:banner_id
  // ----------------------------------------------------
  const handleDelete = async (row) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this banner?\n\n"${row.title || 'Untitled Banner'}"`
    )
    if (!confirmDelete) return

    try {
      const res = await deleteStoreBanner(row._id)
      const successMsg = res.message || 'Banner deleted successfully'
      // Remove row from table
      setRows((prev) => prev.filter((item) => item._id !== row._id))
      setTotalCount((prev) => Math.max(0, prev - 1))
      setListSuccess(successMsg)
      notify(successMsg)
      window.dispatchEvent(new CustomEvent('cryptospill_banners_updated'))
      setTimeout(() => setListSuccess(''), 4000)
    } catch (err) {
      const errorMsg = err.message || 'Failed to delete banner.'
      setListError(errorMsg)
      notify(errorMsg)
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn font-['Plus_Jakarta_Sans',sans-serif] text-slate-800">
      {/* Top Banner Alert / Success */}
      {listSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{listSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setListSuccess('')}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner Error */}
      {listError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{listError}</span>
          </div>
          <button
            type="button"
            onClick={() => setListError('')}
            className="text-rose-700 hover:text-rose-950 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* HEADER & CONTROLS ABOVE THE TABLE */}
      <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Banners
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-yellow-100 border border-yellow-300 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider">
                {totalCount} Total
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Manage homepage promotional cards with custom offers, product showcase images, and colors.
            </p>
          </div>

          {/* Add Banner Button */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-sm shadow-yellow-400/25 active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Banner</span>
            </button>

            <button
              type="button"
              onClick={() => fetchList(page, searchKey, activeFilter)}
              disabled={isLoadingList}
              title="Refresh banner list"
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition cursor-pointer"
            >
              <svg className={`w-4 h-4 ${isLoadingList ? 'animate-spin text-yellow-600' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search Box & Active Filter (Above the table) */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box bound to search_key (searches title, offer, subtitle, and badge) */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchKey}
              onChange={handleSearchChange}
              placeholder="Search by title, offer, subtitle, or badge..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-yellow-400 focus:bg-white transition-colors"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchKey && (
              <button
                type="button"
                onClick={() => {
                  setSearchKey('')
                  fetchList(1, '', activeFilter)
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Active filter: All / Active / Inactive */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start md:self-auto">
            <button
              type="button"
              onClick={() => {
                setActiveFilter('all')
                setPage(1)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveFilter('active')
                setPage(1)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'active'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Active</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveFilter('inactive')
                setPage(1)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'inactive'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Inactive</span>
            </button>
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      {/* Columns: image thumbnail, title, offerText, backgroundColor, sortOrder, isActive toggle, actions */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6 w-16">Image</th>
                <th className="py-3.5 px-4">Title</th>
                <th className="py-3.5 px-4">Offer Text</th>
                <th className="py-3.5 px-4">Color</th>
                <th className="py-3.5 px-4">Sort Order</th>
                <th className="py-3.5 px-4">Active</th>
                <th className="py-3.5 px-4 sm:px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {isLoadingList && rows.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <svg className="w-6 h-6 animate-spin text-yellow-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-xs font-semibold">Loading banners from API...</span>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto text-slate-400">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-bold text-slate-700">No banners found</p>
                      <p className="text-xs text-slate-400">
                        {searchKey || activeFilter !== 'all'
                          ? 'Try adjusting your search terms or filter.'
                          : 'Create your first promotional card to feature on the homepage carousel.'}
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="mt-1 px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold text-xs uppercase tracking-wider cursor-pointer"
                      >
                        Add Banner
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row._id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Column 1: Image Thumbnail */}
                    <td className="py-3 px-4 sm:px-6">
                      <div
                        className="w-12 h-10 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200 shrink-0"
                        style={{ backgroundColor: row.backgroundColor || '#1c1c1c' }}
                      >
                        {row.image ? (
                          <img
                            src={normalizeImageUrl(row.image)}
                            alt=""
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none'
                            }}
                          />
                        ) : (
                          <img src={logoImg} alt="" className="w-4 h-4 opacity-50" />
                        )}
                      </div>
                    </td>

                    {/* Column 2: Title */}
                    <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs">
                      <div className="truncate font-semibold">{row.title}</div>
                      {row.subtitle && (
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">{row.subtitle}</div>
                      )}
                    </td>

                    {/* Column 3: Offer Text */}
                    <td className="py-3.5 px-4 font-extrabold text-amber-700">
                      {row.offerText || <span className="text-slate-400 text-xs font-normal">—</span>}
                    </td>

                    {/* Column 4: Background Color */}
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 border border-slate-200">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0 shadow-2xs"
                          style={{ backgroundColor: row.backgroundColor || '#1c1c1c' }}
                        />
                        <span className="font-mono text-xs text-slate-700">
                          {row.backgroundColor || '#1c1c1c'}
                        </span>
                      </div>
                    </td>

                    {/* Column 5: Sort Order */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs">
                        {row.sortOrder ?? 0}
                      </span>
                    </td>

                    {/* Column 6: IsActive Toggle */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleRowActive(row)}
                        title="Click to toggle banner active status"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                          row.isActive
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            row.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        <span>{row.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>

                    {/* Column 7: Actions */}
                    <td className="py-3.5 px-4 sm:px-6 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(row._id)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(row)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {totalCount > limit && (
          <div className="py-3 px-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {rows.length} of {totalCount} banners
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || isLoadingList}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg border border-slate-200 font-bold disabled:opacity-40 cursor-pointer bg-white hover:bg-slate-100"
              >
                Previous
              </button>
              <span className="font-bold text-slate-700">Page {page}</span>
              <button
                type="button"
                disabled={rows.length < limit || isLoadingList}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded-lg border border-slate-200 font-bold disabled:opacity-40 cursor-pointer bg-white hover:bg-slate-100"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* 2-COLUMN VIEWPORT-FITTING MODAL (CREATE & EDIT) */}
      {/* ==================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-fadeIn">
          <div
            className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-black text-slate-900">
                    {modalMode === 'create' ? 'Add New Homepage Banner' : 'Edit Promo Banner'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-yellow-100 border border-yellow-300 text-amber-900 text-[10px] font-extrabold uppercase">
                    {modalMode === 'create' ? 'Draft' : 'Editing'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live preview card updates dynamically as you configure promotional content.
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

            {/* Error Banner */}
            {formError && (
              <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5">
                <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{formError}</span>
              </div>
            )}

            {/* Details Loading */}
            {isLoadingDetails ? (
              <div className="py-16 text-center text-slate-400">
                <div className="flex flex-col items-center justify-center gap-2">
                  <svg className="w-7 h-7 animate-spin text-yellow-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-xs font-semibold">Loading banner details...</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleModalSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Scrollable Modal Content */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 min-h-0">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* LEFT COLUMN: LIVE PREVIEW & PRESETS (lg:col-span-5) */}
                    <div className="lg:col-span-5 flex flex-col gap-4 lg:sticky lg:top-0">
                      <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                              Live Card Preview
                            </span>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-400">
                            Homepage Display
                          </span>
                        </div>

                        {/* LIVE CARD PREVIEW CONTAINER */}
                        <div
                          className="relative w-full h-[200px] sm:h-[210px] rounded-[24px] p-4 sm:p-4.5 text-white shadow-xl overflow-hidden flex flex-col justify-between select-none border border-white/10 transition-colors"
                          style={{
                            background: `linear-gradient(135deg, ${formBackgroundColor || '#0f172a'} 0%, #080d19 100%)`
                          }}
                        >
                          {/* 1. Ambient dots matrix pattern */}
                          <div
                            className="absolute inset-0 pointer-events-none opacity-80"
                            style={{
                              backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.18) 1.2px, transparent 1.2px)',
                              backgroundSize: '16px 16px'
                            }}
                          />

                          {/* 2. Soft vertical metallic reflection on the right */}
                          <div className="absolute right-0 top-0 bottom-0 w-[55%] bg-gradient-to-r from-transparent via-white/[0.08] to-white/[0.18] pointer-events-none" />

                          {/* 3. Top-Left: Gold coin icon + title in crisp bold white */}
                          <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img src={logoImg} alt="CryptoSpill" className="w-5 h-5 object-contain drop-shadow" />
                              <span className="font-bold text-xs sm:text-sm tracking-wide text-white truncate max-w-[170px]">
                                {formTitle || 'CryptoSpill Apple Fest'}
                              </span>
                            </div>
                          </div>

                          {/* 4. Middle: Large bold white offerText + one-line truncated subtitle */}
                          <div className={`relative z-10 my-auto ${formImage ? 'pr-20' : 'pr-3'}`}>
                            <h3 className="text-2xl sm:text-[28px] font-black text-white tracking-tight leading-none drop-shadow-sm">
                              {formOfferText || '30–50% Off'}
                            </h3>
                            <p className="text-[11px] sm:text-xs text-slate-200/90 font-medium mt-1 drop-shadow-xs truncate max-w-full">
                              {formSubtitle || 'On iPhone 18 Pro Max & Pro...'}
                            </p>
                          </div>

                          {/* 5. Product image on the right: seamless blend with soft gradient mask */}
                          {formImage && (
                            <div
                              className="absolute right-0 top-0 bottom-0 w-[52%] z-10 flex items-end justify-end pointer-events-none overflow-hidden rounded-r-[24px]"
                              style={{
                                maskImage: 'linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.25) 15%, black 50%)',
                                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.25) 15%, black 50%)'
                              }}
                            >
                              <img
                                src={normalizeImageUrl(formImage)}
                                alt=""
                                className={`w-full h-full drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)] transition-all duration-300 ${
                                  formImageFit === 'contain'
                                    ? 'object-contain object-bottom-right'
                                    : 'object-cover object-center'
                                }`}
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                }}
                              />
                            </div>
                          )}

                          {/* 6. Bottom Row: Left CS Cashback Chip + Right Campaign Badge (Side-by-side, Zero Overlap) */}
                          <div className="relative z-20 flex items-end justify-between gap-2 mt-auto pt-2">
                            {(formRewardText || 'Upto 8% Crypto Cashback') ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/15 text-white text-[11px] font-bold shadow-sm min-w-0 max-w-[56%] shrink">
                                <span className="px-1.5 py-0.5 rounded-[4px] bg-yellow-400 text-black font-black text-[9px] leading-none shrink-0">
                                  CS
                                </span>
                                <span className="truncate">
                                  {formRewardText || 'Upto 8% Crypto Cashback'}
                                </span>
                              </div>
                            ) : (
                              <div />
                            )}

                            {(formBadgeText || formLiveLabel) && (
                              <div className="shrink-0 pointer-events-none">
                                <div className="px-2.5 py-1.5 rounded-xl bg-gradient-to-b from-[#FFD200] via-[#FFBA00] to-[#FFA000] text-slate-950 shadow-[0_6px_16px_rgba(245,158,11,0.45)] border border-yellow-200/60 flex flex-col items-center justify-center text-center leading-tight">
                                  <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-slate-950 block whitespace-nowrap">
                                    {formBadgeText || 'THE BIG SPILL DAYS'}
                                  </span>
                                  <span className="text-[8px] sm:text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-950 text-[#FFD200] mt-0.5 tracking-wide shadow-inner block whitespace-nowrap">
                                    {formLiveLabel || 'LIVE NOW'}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 1-Click Reference Button */}
                        <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (PRESET_IMAGES?.[0]) {
                                setFormImage(PRESET_IMAGES[0].src)
                              }
                              setFormImageFit('contain')
                              setFormTitle('CryptoSpill Apple Fest')
                              setFormOfferText('30–50% Off')
                              setFormSubtitle('On iPhone 18 Pro Max & Pro Series')
                              setFormRewardText('Upto 8% Crypto Cashback')
                              setFormBadgeText('THE BIG SPILL DAYS')
                              setFormLiveLabel('LIVE NOW')
                              setFormBackgroundColor('#0f172a')
                              notify('Loaded Reference Image 2 banner settings!')
                            }}
                            className="w-full py-2 px-3 rounded-xl text-xs font-black text-amber-950 bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-400 hover:from-yellow-400 hover:to-amber-500 shadow-sm border border-yellow-400/80 transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
                          >
                            <span>★</span>
                            <span>Set Reference iPhone 18 Card</span>
                          </button>
                          <p className="text-[10px] text-slate-400 text-center">
                            Automatically loads the exact theme, text, badges, and cutout from reference.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: FORM INPUTS (lg:col-span-7) */}
                    <div className="lg:col-span-7 flex flex-col gap-4">

                      {/* SECTION 1: TITLE & THEME COLOR */}
                      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/70 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-lg bg-yellow-400 text-slate-950 flex items-center justify-center text-[10px] font-black">1</span>
                          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Title & Color Theme</h4>
                        </div>

                        {/* Title (Required) */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Title <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            placeholder="e.g. CryptoSpill Apple Fest"
                            required
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all"
                          />
                        </div>

                        {/* Background Color Picker & Swatches */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Background Gradient Color
                          </label>
                          <div className="flex flex-wrap items-center gap-2.5">
                            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
                              <input
                                type="color"
                                value={formBackgroundColor.startsWith('#') ? formBackgroundColor : '#0f172a'}
                                onChange={(e) => setFormBackgroundColor(e.target.value)}
                                className="w-6 h-6 rounded border-none cursor-pointer bg-transparent"
                              />
                              <input
                                type="text"
                                value={formBackgroundColor}
                                onChange={(e) => setFormBackgroundColor(e.target.value)}
                                placeholder="#0f172a"
                                className="w-20 text-xs font-mono font-bold text-slate-800 bg-transparent border-none focus:outline-none"
                              />
                            </div>

                            {/* Swatch Presets */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {PRESET_BG_COLORS.map((preset) => (
                                <button
                                  key={preset.value}
                                  type="button"
                                  onClick={() => setFormBackgroundColor(preset.value)}
                                  title={preset.label}
                                  className={`w-6 h-6 rounded-full border-2 transition cursor-pointer ${
                                    formBackgroundColor.toLowerCase() === preset.value.toLowerCase()
                                      ? 'border-yellow-400 scale-110 shadow-sm ring-2 ring-yellow-400/40'
                                      : 'border-slate-200 hover:scale-105'
                                  }`}
                                  style={{ backgroundColor: preset.value }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* SECTION 2: PROMOTIONAL HEADLINES & BADGES */}
                      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/70 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-lg bg-yellow-400 text-slate-950 flex items-center justify-center text-[10px] font-black">2</span>
                          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Promotional Copy & Badges</h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Offer Text */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Offer Headline (Large Bold)
                            </label>
                            <input
                              type="text"
                              value={formOfferText}
                              onChange={(e) => setFormOfferText(e.target.value)}
                              placeholder="e.g. 30–50% Off"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-bold focus:outline-none focus:border-yellow-400 transition"
                            />
                          </div>

                          {/* Subtitle */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Subtitle Description
                            </label>
                            <input
                              type="text"
                              value={formSubtitle}
                              onChange={(e) => setFormSubtitle(e.target.value)}
                              placeholder="e.g. On iPhone 18 Pro Max & Pro"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-yellow-400 transition"
                            />
                          </div>

                          {/* Reward Text */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Reward Chip (Bottom Left)
                            </label>
                            <input
                              type="text"
                              value={formRewardText}
                              onChange={(e) => setFormRewardText(e.target.value)}
                              placeholder="e.g. Upto 8% Crypto Cashback"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-yellow-400 transition"
                            />
                          </div>

                          {/* Badge Text */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Badge Pill (Bottom Right)
                            </label>
                            <input
                              type="text"
                              value={formBadgeText}
                              onChange={(e) => setFormBadgeText(e.target.value)}
                              placeholder="e.g. THE BIG SPILL DAYS"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-yellow-400 transition"
                            />
                          </div>

                          {/* Live Label */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Live Label Pill
                            </label>
                            <input
                              type="text"
                              value={formLiveLabel}
                              onChange={(e) => setFormLiveLabel(e.target.value)}
                              placeholder="LIVE NOW"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-yellow-400 transition"
                            />
                          </div>

                          {/* Sort Order */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Display Sort Order
                            </label>
                            <input
                              type="number"
                              value={formSortOrder}
                              onChange={(e) => setFormSortOrder(e.target.value)}
                              placeholder="0"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-yellow-400 transition"
                            />
                          </div>
                        </div>
                      </div>

                      {/* SECTION 3: PRODUCT SHOWCASE IMAGE */}
                      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/70 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-lg bg-yellow-400 text-slate-950 flex items-center justify-center text-[10px] font-black">3</span>
                            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Product Showcase Image</h4>
                          </div>

                          {/* Image Fit Switch */}
                          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => setFormImageFit('contain')}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                formImageFit === 'contain'
                                  ? 'bg-slate-950 text-yellow-400 shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Cutout Mode
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormImageFit('cover')}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                formImageFit === 'cover'
                                  ? 'bg-slate-950 text-yellow-400 shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Cover & Blend
                            </button>
                          </div>
                        </div>

                        {/* Input URL or File Upload */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <input
                            type="url"
                            value={formImage}
                            onChange={(e) => setFormImage(e.target.value)}
                            placeholder="https://...product-cutout.png or upload file"
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

                        {/* Presets List */}
                        {PRESET_IMAGES && PRESET_IMAGES.length > 0 && (
                          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                              Device Presets:
                            </span>
                            {PRESET_IMAGES.map((preset, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setFormImage(preset.src)
                                  setFormImageFit('contain')
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 border transition cursor-pointer shrink-0 ${
                                  formImage === preset.src
                                    ? 'bg-yellow-400 text-slate-950 border-yellow-500 shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                <img src={preset.src} alt="" className="w-3.5 h-3.5 object-contain rounded" />
                                <span>{preset.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* SECTION 4: LINK & PUBLISH STATUS */}
                      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/70 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-lg bg-yellow-400 text-slate-950 flex items-center justify-center text-[10px] font-black">4</span>
                          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Destination & Visibility</h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Link URL (Optional)
                            </label>
                            <input
                              type="url"
                              value={formLinkUrl}
                              onChange={(e) => setFormLinkUrl(e.target.value)}
                              placeholder="https://..."
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-yellow-400 transition"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Publish Status
                            </label>
                            <label className="flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition">
                              <span className="text-xs font-bold text-slate-800">
                                {formIsActive ? '🟢 Live on Storefront' : '⚪ Hidden (Draft)'}
                              </span>
                              <input
                                type="checkbox"
                                checked={formIsActive}
                                onChange={(e) => setFormIsActive(e.target.checked)}
                                className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400"
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* STICKY FOOTER ACTIONS */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                  <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-yellow-400" />
                    <span>Card updates customer homepage banner carousel in real time.</span>
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
                        <span>{modalMode === 'create' ? 'Create Banner' : 'Save Changes'}</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
