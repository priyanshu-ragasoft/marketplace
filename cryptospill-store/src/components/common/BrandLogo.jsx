import React from 'react'
import logoImg from '../../assets/logo.png'
import { Link } from '../../router/RouterContext'

export default function BrandLogo({ size = 'default', isDarkBackground = false }) {
  const isLarge = size === 'large'
  const isSmall = size === 'small'

  const imgSize = isLarge
    ? 'w-10 h-10 sm:w-11 sm:h-11'
    : isSmall
      ? 'w-7 h-7 sm:w-8 sm:h-8'
      : 'w-8 h-8 sm:w-10 sm:h-10'

  const textSize = isLarge
    ? 'text-xl sm:text-2xl'
    : isSmall
      ? 'text-sm sm:text-base'
      : 'text-[17px] sm:text-[20px]'

  const storeTextSize = isLarge
    ? 'text-[18px] sm:text-[22px]'
    : isSmall
      ? 'text-[10px] sm:text-[12px]'
      : 'text-[12px] sm:text-[14px]'

  return (
    <Link to="/" className="inline-flex items-center gap-2 sm:gap-2.5 select-none group cursor-pointer no-underline">
      <div className="relative flex items-center justify-center shrink-0">
        <img
          src={logoImg}
          alt="CryptoSpill Logo"
          className={`${imgSize} object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-105`}
        />
      </div>

      <div className="flex flex-col justify-center select-none leading-none font-sans">
        <span className={`font-sans font-extrabold leading-tight tracking-tight ${textSize} ${isDarkBackground ? 'text-white' : 'text-black'}`}>
          Community
        </span>
        <span
          className={`font-sans font-extrabold leading-none uppercase mt-1 ${storeTextSize} text-[#D1A61B] w-fit`}
        >
          STORE
        </span>
      </div>
    </Link>
  )
}
