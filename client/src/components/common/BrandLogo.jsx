import React from 'react'
import { Link } from 'react-router-dom'

/**
 * Custom Brandmark SVG Icon for Mini Study Network (Campus Pop Aesthetic)
 * Combines: Open Book + Sparkle of Wisdom + Student Network Node
 */
export function BrandIcon({ size = 'md', className = '' }) {
  let dimension = 'w-10 h-10'
  if (typeof size === 'number') {
    dimension = `w-[${size}px] h-[${size}px]`
  } else {
    const sizeMap = {
      xs: 'w-6 h-6',
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
      xl: 'w-16 h-16',
    }
    dimension = sizeMap[size] || sizeMap.md
  }

  const px = typeof size === 'number' ? size : 40

  return (
    <div
      style={typeof size === 'number' ? { width: px, height: px } : undefined}
      className={`relative flex items-center justify-center shrink-0 ${typeof size === 'number' ? '' : dimension} ${className}`}
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs transition-transform duration-300 group-hover:scale-105"
      >
        {/* Rounded Diamond Badge Background */}
        <rect
          x="3"
          y="3"
          width="42"
          height="42"
          rx="12"
          className="fill-[#16a34a] dark:fill-[#22c55e]"
        />
        {/* Soft Depth Inset */}
        <rect
          x="4.5"
          y="4.5"
          width="39"
          height="39"
          rx="10.5"
          stroke="white"
          strokeOpacity="0.25"
          strokeWidth="1.5"
        />

        {/* Open Book Wings (Academic Foundation) */}
        {/* Left Page */}
        <path
          d="M12 28.5C14.5 27 18 27 22.5 28.5V17C18 15.5 14.5 15.5 12 17V28.5Z"
          fill="white"
          fillOpacity="0.95"
        />
        {/* Right Page */}
        <path
          d="M36 28.5C33.5 27 30 27 25.5 28.5V17C30 15.5 33.5 15.5 36 17V28.5Z"
          fill="white"
          fillOpacity="0.95"
        />
        {/* Book Spine Center Line */}
        <path
          d="M24 17.5V29"
          stroke="#06110a"
          strokeOpacity="0.15"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Sparkle of Wisdom / Inspiration (Campus Pop Energy) */}
        <path
          d="M24 8L25.3 12.2C25.5 12.8 26 13.3 26.6 13.5L30.8 14.8L26.6 16.1C26 16.3 25.5 16.8 25.3 17.4L24 21.6L22.7 17.4C22.5 16.8 22 16.3 21.4 16.1L17.2 14.8L21.4 13.5C22 13.3 22.5 12.8 22.7 12.2L24 8Z"
          fill="#FBBF24"
        />

        {/* Connected Student Network Node (Bottom Accent) */}
        <circle cx="24" cy="35" r="2.5" fill="white" />
        <circle cx="17" cy="35" r="1.5" fill="white" fillOpacity="0.75" />
        <circle cx="31" cy="35" r="1.5" fill="white" fillOpacity="0.75" />
        <path
          d="M18.5 35H21.5M26.5 35H29.5"
          stroke="white"
          strokeOpacity="0.6"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

/**
 * Full Brand Logo Component (Icon + Dynamic Text)
 */
export default function BrandLogo({
  size = 'md',
  showText = true,
  withText = true,
  to,
  className = '',
  textColor = '',
}) {
  const shouldShowText = showText && withText

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <BrandIcon size={size} />
      {shouldShowText && (
        <div className="flex flex-col leading-none text-left">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight text-[#06110a] dark:text-white ${
                size === 'lg' || (typeof size === 'number' && size >= 44)
                  ? 'text-lg sm:text-xl'
                  : size === 'sm' || (typeof size === 'number' && size <= 32)
                  ? 'text-sm'
                  : 'text-base'
              } ${textColor}`}
            >
              Mini Study
            </span>
            <span className="rounded-[5px] bg-[#16a34a] dark:bg-[#22c55e] px-1 py-0.5 text-[9px] font-black uppercase tracking-wider text-white dark:text-[#06110a]">
              NET
            </span>
          </div>
          <span className="text-[10px] font-semibold text-[#56614f] dark:text-[#B0B3B8] tracking-wide mt-0.5">
            Mạng học tập sinh viên
          </span>
        </div>
      )}
    </div>
  )

  if (to) {
    return (
      <Link to={to} className="transition-opacity hover:opacity-90 inline-block">
        {content}
      </Link>
    )
  }

  return content
}
