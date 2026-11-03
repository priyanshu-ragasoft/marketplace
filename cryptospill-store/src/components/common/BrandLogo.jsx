import React from 'react'
import logoBanner from '../../assets/logo-banner.png'
import logoCoin from '../../assets/logo.png'
import { Link } from '../../router/RouterContext'

export default function BrandLogo({
  size = 'default',
  isDarkBackground = false,
  className = '',
  variant = 'custom', // 'custom' | 'banner' | 'icon'
  withBorder = false,
  showDivider = true,
  title = 'Community',
  subtitle = 'STORE',
}) {
  const isLarge = size === 'large'
  const isSmall = size === 'small'

  // Proportional sizes
  const iconSize = isLarge
    ? 'w-10 h-10 sm:w-11 sm:h-11'
    : isSmall
      ? 'w-7 h-7 sm:w-8 sm:h-8'
      : 'w-8 h-8 sm:w-9 sm:h-9'

  const dividerHeight = isLarge
    ? 'h-7 sm:h-8'
    : isSmall
      ? 'h-4 sm:h-5'
      : 'h-5 sm:h-6'

  const textSize = isLarge
    ? 'text-lg sm:text-xl'
    : isSmall
      ? 'text-xs sm:text-sm'
      : 'text-[15px] sm:text-[17px]'

  const storeTextSize = isLarge
    ? 'text-[13px] sm:text-[15px]'
    : isSmall
      ? 'text-[9px] sm:text-[10px]'
      : 'text-[10.5px] sm:text-[12px]'

  const bannerHeight = isLarge
    ? 'h-12 sm:h-14'
    : isSmall
      ? 'h-7 sm:h-8'
      : 'h-9 sm:h-10 md:h-11'

  return (
    <Link
      to="/"
      className={`inline-flex items-center shrink-0 select-none group cursor-pointer no-underline transition-all duration-200 ${withBorder
          ? isDarkBackground
            ? 'px-2 py-1 sm:px-2.5 sm:py-1 border-2 border-[#D1A61B] rounded-none bg-neutral-900/90 shadow-2xs hover:bg-neutral-850'
            : 'px-2 py-1 sm:px-2.5 sm:py-1 border-2 border-[#D1A61B] rounded-none bg-[#FAF7F2] shadow-2xs hover:bg-[#F5F0E6]'
          : ''
        } ${className}`}
      title="CryptoSpill Community Store"
    >
      {variant === 'icon' ? (
        <div className="relative flex items-center justify-center shrink-0">
          <img
            src={logoCoin}
            alt="CryptoSpill Logo"
            className={`${iconSize} object-contain object-center drop-shadow-2xs transition-transform duration-200 group-hover:scale-105`}
            draggable="false"
          />
        </div>
      ) : variant === 'banner' ? (
        <div className="relative flex items-center justify-center shrink-0">
          <img
            src={logoBanner}
            alt="CryptoSpill Community Store"
            className={`${bannerHeight} w-auto max-w-full object-contain rounded-none transition-transform duration-200 group-hover:scale-[1.01] ${isDarkBackground
                ? 'ring-1 ring-yellow-400/30 shadow-md shadow-black/50'
                : 'shadow-2xs'
              }`}
            draggable="false"
          />
        </div>
      ) : (
        /* Default: Custom Badge with tight spacing and sharp border */
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Coin Logo */}
          <div className="relative flex items-center justify-center shrink-0">
            <img
              src={logoCoin}
              alt="CryptoSpill Logo"
              className={`${iconSize} object-contain object-center drop-shadow-2xs transition-transform duration-200 group-hover:scale-105`}
              draggable="false"
            />
          </div>

          {/* Divider */}
          {showDivider && (
            <span
              className={`${dividerHeight} w-[1.5px] bg-[#D1A61B] mx-0.5 self-center shrink-0 opacity-90`}
              aria-hidden="true"
            />
          )}

          {/* Community STORE Text */}
          <div className="flex flex-col justify-center select-none leading-none font-sans">
            <span
              className={`font-sans font-extrabold leading-tight tracking-tight ${textSize} ${isDarkBackground ? 'text-white' : 'text-neutral-900'
                }`}
            >
              {title}
            </span>
            <span
              className={`font-sans font-extrabold leading-none uppercase mt-0.5 ${storeTextSize} text-[#D1A61B] tracking-wider w-fit`}
            >
              {subtitle}
            </span>
          </div>
        </div>
      )}
    </Link>
  )
}
