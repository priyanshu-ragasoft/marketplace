import { jsPDF } from 'jspdf'
import { PRODUCTS } from '../components/marketplace/marketplaceData'
import logoImg from '../assets/logo.png'

function money(value) {
  const amount = Number(value)
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : '—'
}

function when(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

function loadImage(src, timeoutMs = 2500) {
  if (!src) return Promise.resolve(null)
  return new Promise((resolve) => {
    const img = new Image()
    const timer = setTimeout(() => {
      if (img.complete && img.naturalWidth > 0) {
        resolve(img)
      } else {
        resolve(null)
      }
    }, timeoutMs)

    // Only set crossOrigin on remote external URLs
    if (typeof src === 'string' && src.startsWith('http')) {
      img.crossOrigin = 'anonymous'
    }

    img.onload = () => {
      clearTimeout(timer)
      resolve(img)
    }
    img.onerror = () => {
      clearTimeout(timer)
      resolve(null)
    }
    img.src = src

    // In case already cached by browser
    if (img.complete && img.naturalWidth > 0) {
      clearTimeout(timer)
      resolve(img)
    }
  })
}

function createWatermarkDataUrl(img, opacity = 0.12) {
  if (!img) return null
  try {
    const canvas = document.createElement('canvas')
    const w = img.naturalWidth || img.width || 400
    const h = img.naturalHeight || img.height || 400
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.clearRect(0, 0, w, h)
    ctx.globalAlpha = opacity
    try {
      ctx.filter = 'grayscale(100%) contrast(110%)'
    } catch { }
    ctx.drawImage(img, 0, 0, w, h)
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

function findItemImage(item) {
  if (item?.image) return item.image
  const id = String(item?.productId || item?._id || item?.id || '')
  const title = String(item?.title || '').trim().toLowerCase()
  const found = PRODUCTS.find((p) => {
    const pId = String(p.id)
    const pTitle = String(p.title || '').trim().toLowerCase()
    return (id && pId === id) || (title && pTitle === title) || (title && pTitle.includes(title)) || (pTitle && title.includes(pTitle))
  })
  return found?.image || ''
}

export async function downloadOrderReceipt(order, payment) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Full page sleek luxury backdrop (#f1f5f9)
  doc.setFillColor(241, 245, 249)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  // Slip width matches website order slip design (centered on A4)
  const slipWidth = 430
  const slipX = (pageWidth - slipWidth) / 2
  const slipY = 28

  // Pre-load logo and item images in parallel with safety
  const logoEl = await loadImage(logoImg)
  const watermarkDataUrl = createWatermarkDataUrl(logoEl, 0.12)
  const items = Array.isArray(order?.items) ? order.items : []
  const itemImagePromises = items.map((it) => loadImage(findItemImage(it)))
  const itemImages = await Promise.all(itemImagePromises)

  // ----------------------------------------------------
  // PREPARE AND MEASURE CONTENT
  // ----------------------------------------------------
  const placedAt = when(order?.confirmedAt || order?.createdAt)
  const custName = [order?.firstName, order?.lastName].filter(Boolean).join(' ') || 'Customer'
  const phone = [order?.countryCode, order?.phone].filter(Boolean).join(' ')
  const email = order?.email || ''
  const address = order?.address || ''
  const regionPlace = [order?.state, order?.country, order?.pin].filter(Boolean).join(', ')

  // Break address into lines that fit the slip width
  const addressLines = address ? doc.splitTextToSize(address, slipWidth - 60).slice(0, 3) : []

  // Dynamic Height calculation
  let dynHeight = 22 // top padding
  dynHeight += 20 // CryptoSpill branding bar
  dynHeight += 12 // gap
  dynHeight += 44 // double-ring checkmark badge (diameter 40)
  dynHeight += 14 // gap
  dynHeight += 22 // "Order placed" header
  dynHeight += 5 // gap
  dynHeight += 14 // subtitle
  dynHeight += 18 // gap
  dynHeight += 13 // "Order Number:" label
  dynHeight += 5 // gap
  dynHeight += 30 // Big Order number
  if (placedAt) {
    dynHeight += 6 // gap
    dynHeight += 13 // "Confirmed ..."
  }
  dynHeight += 16 // gap to rule
  dynHeight += 1 // rule 1
  dynHeight += 16 // gap to ITEMS
  dynHeight += 13 // "ITEMS" header
  dynHeight += 8 // gap to first item
  dynHeight += items.length ? (items.length * 48) : 26 // item rows
  dynHeight += 10 // gap to rule
  dynHeight += 1 // rule 2
  dynHeight += 16 // gap to DELIVERY ADDRESS
  dynHeight += 13 // "DELIVERY ADDRESS" header
  dynHeight += 8 // gap
  dynHeight += 14 // Customer Name
  if (phone) dynHeight += 13
  if (email) dynHeight += 13
  dynHeight += (addressLines.length * 13)
  if (regionPlace) dynHeight += 13
  dynHeight += 16 // gap to rule
  dynHeight += 1 // rule 3
  dynHeight += 16 // gap to PAYMENT
  dynHeight += 13 // "PAYMENT" header
  dynHeight += 8 // gap
  dynHeight += 14 // "Paid" status
  dynHeight += 14 // Amount line
  if (Number(order?.ao1Amount) > 0) dynHeight += 13 // AO1 line
  dynHeight += 13 // Escrow note
  dynHeight += 18 // gap to rule
  dynHeight += 1 // rule 4
  dynHeight += 18 // gap to "Thank you!"
  dynHeight += 28 // "Thank you!" script
  dynHeight += 32 // generous bottom card padding

  const slipHeight = dynHeight

  // ----------------------------------------------------
  // 1. PAPER SLIP CARD (ELEGANT DROP SHADOW & CONTAINER)
  // ----------------------------------------------------
  // Soft drop shadow
  doc.setFillColor(218, 226, 236)
  doc.roundedRect(slipX + 2, slipY + 4, slipWidth, slipHeight, 14, 14, 'F')

  // White paper receipt
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(1)
  doc.roundedRect(slipX, slipY, slipWidth, slipHeight, 12, 12, 'FD')

  // Top luxury gold accent ribbon (#D1A61B)
  doc.setFillColor(209, 166, 27)
  doc.roundedRect(slipX, slipY, slipWidth, 4, 2, 2, 'F')

  // ----------------------------------------------------
  // 2. CRYPTOSPILL LOGO WATERMARK (Centered, Perfectly Straight)
  // ----------------------------------------------------
  // Rendered with 12% baked transparency directly onto the white paper
  const wmSize = 260
  const wmX = slipX + (slipWidth - wmSize) / 2
  const wmY = slipY + (slipHeight - wmSize) / 2

  if (watermarkDataUrl) {
    try {
      doc.addImage(watermarkDataUrl, 'PNG', wmX, wmY, wmSize, wmSize, undefined, 'FAST')
    } catch {
      // Fallback to logo directly
      if (logoEl) {
        try {
          doc.addImage(logoEl, 'PNG', wmX, wmY, wmSize, wmSize, undefined, 'FAST')
        } catch { }
      }
    }
  } else if (logoEl) {
    try {
      doc.addImage(logoEl, 'PNG', wmX, wmY, wmSize, wmSize, undefined, 'FAST')
    } catch { }
  }

  const centerX = pageWidth / 2
  const contentLeft = slipX + 26
  const contentRight = slipX + slipWidth - 26

  // Helper for dashed separator lines with realistic side ticket notches
  const drawNotchedRule = (yPos) => {
    // Dashed line
    doc.setDrawColor(203, 213, 225) // slate-300
    doc.setLineWidth(0.8)
    doc.setLineDashPattern([3, 3], 0)
    doc.line(slipX + 16, yPos, slipX + slipWidth - 16, yPos)
    doc.setLineDashPattern([], 0)

    // Side ticket notches (punch-holes matching page background)
    doc.setFillColor(241, 245, 249)
    doc.circle(slipX, yPos, 6, 'F')
    doc.circle(slipX + slipWidth, yPos, 6, 'F')

    // Subtle inner shadow on ticket notches
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.7)
    doc.circle(slipX, yPos, 6, 'S')
    doc.circle(slipX + slipWidth, yPos, 6, 'S')
  }

  let y = slipY + 16

  // ----------------------------------------------------
  // 3. TOP BRANDING BAR (CryptoSpill STORE · ESCROW SECURED)
  // ----------------------------------------------------
  if (logoEl) {
    try {
      doc.addImage(logoEl, 'PNG', contentLeft, y + 1, 14, 14, undefined, 'FAST')
    } catch { }
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(15, 23, 42)
  doc.text('CRYPTOSPILL STORE', logoEl ? contentLeft + 18 : contentLeft, y + 11)

  // Escrow Verified Pill Badge on right
  const badgeW = 96
  const badgeH = 14
  const badgeX = contentRight - badgeW
  doc.setFillColor(236, 253, 245) // emerald-50
  doc.setDrawColor(167, 243, 208) // emerald-200
  doc.setLineWidth(0.7)
  doc.roundedRect(badgeX, y + 1, badgeW, badgeH, 7, 7, 'FD')

  // Emerald dot
  doc.setFillColor(16, 185, 129)
  doc.circle(badgeX + 8, y + 8, 2.5, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(5, 150, 105) // emerald-600
  doc.text('ESCROW VERIFIED', badgeX + 15, y + 10.5)

  y += 24

  // ----------------------------------------------------
  // 4. LUXURY DOUBLE-RING SUCCESS BADGE
  // ----------------------------------------------------
  const badgeCenterY = y + 20
  // Outer soft emerald halo
  doc.setFillColor(220, 252, 231) // emerald-100
  doc.circle(centerX, badgeCenterY, 20, 'F')

  // Inner vibrant emerald circle
  doc.setFillColor(22, 163, 74) // emerald-600
  doc.circle(centerX, badgeCenterY, 15, 'F')

  // Crisp white tick mark lines
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(2.4)
  doc.line(centerX - 6, badgeCenterY, centerX - 1.5, badgeCenterY + 4.5)
  doc.line(centerX - 1.5, badgeCenterY + 4.5, centerX + 7, badgeCenterY - 4.5)

  y = badgeCenterY + 24

  // ----------------------------------------------------
  // 5. "Order placed" HEADER & SUBTITLE
  // ----------------------------------------------------
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(2, 6, 23) // Slate-950
  doc.text('Order placed', centerX, y, { align: 'center', baseline: 'top' })

  y += 22
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(100, 116, 139) // Slate-500
  doc.text('Your order has been confirmed. The store will pack it and ship it to you.', centerX, y, { align: 'center', baseline: 'top' })

  y += 18

  // ----------------------------------------------------
  // 6. ORDER NUMBER & CONFIRMATION DATE (Transparent on Slip)
  // ----------------------------------------------------
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(100, 116, 139)
  doc.text('Order Number:', centerX, y, { align: 'center', baseline: 'top' })

  y += 15
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  doc.setTextColor(15, 23, 42) // Slate-900
  doc.text(String(order?.orderNumber || 'Order confirmed'), centerX, y, { align: 'center', baseline: 'top' })

  if (placedAt) {
    y += 30
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(`Confirmed ${placedAt}`, centerX, y, { align: 'center', baseline: 'top' })
    y += 14
  } else {
    y += 32
  }

  y += 6
  drawNotchedRule(y)
  y += 16

  // ----------------------------------------------------
  // 7. ITEMS SECTION (WITH THUMBNAILS & DETAILS)
  // ----------------------------------------------------
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184) // Slate-400
  doc.text('ITEMS', contentLeft, y, { baseline: 'top' })

  const itemsBadgeText = `${items.length || 1} ${items.length === 1 ? 'ITEM' : 'ITEMS'}`
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(100, 116, 139)
  doc.text(itemsBadgeText, contentRight, y, { align: 'right', baseline: 'top' })

  y += 16

  items.forEach((item, index) => {
    const itemImg = itemImages[index]
    const rowHeight = 48
    const qty = Number(item.quantity) || 1
    const price = (Number(item.priceUSD) || 0) * qty

    // Product Thumbnail Box
    const imgSize = 34
    const imgX = contentLeft
    const imgY = y

    if (itemImg) {
      try {
        doc.setDrawColor(226, 232, 240)
        doc.setFillColor(248, 250, 252)
        doc.roundedRect(imgX, imgY, imgSize, imgSize, 6, 6, 'FD')
        doc.addImage(itemImg, 'JPEG', imgX + 2, imgY + 2, imgSize - 4, imgSize - 4)
      } catch {
        doc.setFillColor(241, 245, 249)
        doc.roundedRect(imgX, imgY, imgSize, imgSize, 6, 6, 'F')
      }
    } else {
      doc.setFillColor(241, 245, 249)
      doc.roundedRect(imgX, imgY, imgSize, imgSize, 6, 6, 'F')
    }

    // Product Title
    const titleX = imgX + imgSize + 10
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(15, 23, 42)
    const title = String(item.title || 'Apple Device')
    const splitTitle = doc.splitTextToSize(title, 220)
    const displayTitle = splitTitle[0] + (splitTitle.length > 1 ? '...' : '')
    doc.text(displayTitle, titleX, y + 6, { baseline: 'top' })

    // Qty Pill Badge
    const qtyBadgeW = 38
    const qtyBadgeH = 13
    doc.setFillColor(241, 245, 249)
    doc.roundedRect(titleX, y + 20, qtyBadgeW, qtyBadgeH, 3, 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(71, 85, 105)
    doc.text(`Qty: ${qty}`, titleX + (qtyBadgeW / 2), y + 29.5, { align: 'center' })

    // Total Price on Right
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(15, 23, 42)
    doc.text(money(price), contentRight, y + 10, { align: 'right', baseline: 'top' })

    y += rowHeight
  })

  if (!items.length) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(100, 116, 139)
    doc.text('Your items are saved on this order.', contentLeft, y, { baseline: 'top' })
    y += 24
  }

  y += 4
  drawNotchedRule(y)
  y += 16

  // ----------------------------------------------------
  // 8. DELIVERY ADDRESS (Transparent on Paper, No Solid Boxes)
  // ----------------------------------------------------
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184) // Slate-400
  doc.text('DELIVERY ADDRESS', contentLeft, y, { baseline: 'top' })

  y += 14
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(15, 23, 42)
  doc.text(custName, contentLeft, y, { baseline: 'top' })

  if (phone) {
    y += 14
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(71, 85, 105)
    doc.text(phone, contentLeft, y, { baseline: 'top' })
  }

  if (email) {
    y += 14
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(71, 85, 105)
    doc.text(email, contentLeft, y, { baseline: 'top' })
  }

  if (addressLines.length) {
    addressLines.forEach((line) => {
      y += 14
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(51, 65, 85)
      doc.text(line, contentLeft, y, { baseline: 'top' })
    })
  }

  if (regionPlace) {
    y += 14
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(30, 41, 59)
    doc.text(regionPlace, contentLeft, y, { baseline: 'top' })
  }

  y += 16
  drawNotchedRule(y)
  y += 16

  // ----------------------------------------------------
  // 9. PAYMENT (Transparent on Paper, No Solid Boxes)
  // ----------------------------------------------------
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184) // Slate-400
  doc.text('PAYMENT', contentLeft, y, { baseline: 'top' })

  y += 14
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(4, 120, 87) // Emerald-700
  doc.text('Paid (Escrow Secured)', contentLeft, y, { baseline: 'top' })

  y += 14
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(15, 23, 42)
  const paidUsd = money(order?.payableUsd ?? payment?.amountUSD ?? order?.paymentAmount ?? payment?.amount ?? order?.cartUsd)
  const paidCurrency = order?.paymentCurrency || payment?.currency
    ? `${Number(order?.paymentAmount || payment?.amount || 0).toLocaleString()} ${order?.paymentCurrency || payment?.currency}`
    : `${Number(order?.paymentAmount || payment?.amount || 0).toLocaleString()} USDT`
  doc.text(`${paidUsd} · ${paidCurrency}`, contentLeft, y, { baseline: 'top' })

  if (Number(order?.ao1Amount) > 0) {
    y += 14
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(180, 83, 9) // Amber-700
    doc.text(`Reward Cashback: +${Number(order.ao1Amount).toLocaleString()} AO1 Tokens returned`, contentLeft, y, { baseline: 'top' })
  }

  y += 14
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text('Payment is held in escrow until the order is delivered.', contentLeft, y, { baseline: 'top' })

  y += 16
  drawNotchedRule(y)
  y += 20

  // ----------------------------------------------------
  // 10. "Thank you!" SCRIPT
  // ----------------------------------------------------
  doc.setFont('times', 'italic')
  doc.setFontSize(28)
  doc.setTextColor(225, 29, 72) // #e11d48
  doc.text('Thank you!', centerX, y, { align: 'center', baseline: 'top' })

  // Download PDF
  const filename = `${order?.orderNumber || 'order'}-receipt.pdf`
  doc.save(filename)
}
