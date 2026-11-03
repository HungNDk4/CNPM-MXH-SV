import React from 'react'
import { Link } from 'react-router-dom'

/**
 * OwlMate Mascot Icon (Campus Pop Academic Aesthetic)
 * High-fidelity vector representation of the OwlMate mascot:
 * Friendly green owl with round glasses reading a golden open book.
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
        viewBox="0 0 280 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs transition-transform duration-300 group-hover:scale-105"
        role="img"
        aria-label="OwlMate Mascot"
      >
        <defs>
          <linearGradient id="omGreen" x1="44" y1="28" x2="228" y2="234" gradientUnits="userSpaceOnUse">
            <stop stopColor="#45C878" />
            <stop offset="1" stopColor="#21A65B" />
          </linearGradient>
          <linearGradient id="omGold" x1="72" y1="174" x2="218" y2="270" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFD45C" />
            <stop offset="1" stopColor="#F5A623" />
          </linearGradient>
        </defs>

        <g transform="translate(12, 10)">
          {/* ears and head/body silhouette */}
          <path
            d="M39 78C25 60 19 38 20 18L65 43C85 27 108 18 132 18C156 18 179 27 199 43L244 18C245 38 239 60 225 78C239 99 246 122 245 147C244 176 230 193 214 205L209 245C185 253 158 261 132 279C106 261 79 253 55 245L50 205C34 193 20 176 19 147C18 122 25 99 39 78Z"
            fill="url(#omGreen)"
            stroke="#123D35"
            strokeWidth="8"
            strokeLinejoin="round"
          />
          {/* ear insets */}
          <path d="M35 35L62 51L48 67C42 58 38 47 35 35Z" fill="#B7F2C8" />
          <path d="M229 35L202 51L216 67C222 58 226 47 229 35Z" fill="#B7F2C8" />

          {/* round glasses */}
          <path
            d="M42 98C42 83 53 74 69 74H94C111 74 121 85 121 101V123C121 143 108 155 89 155H73C54 155 42 142 42 123V98Z"
            fill="#FFF2D7"
            stroke="#123D35"
            strokeWidth="8"
          />
          <path
            d="M143 101C143 85 153 74 170 74H195C211 74 222 83 222 98V123C222 142 210 155 191 155H175C156 155 143 143 143 123V101Z"
            fill="#FFF2D7"
            stroke="#123D35"
            strokeWidth="8"
          />
          <path d="M121 104C128 99 136 99 143 104" stroke="#123D35" strokeWidth="8" strokeLinecap="round" />
          <circle cx="82" cy="113" r="12" fill="#123D35" />
          <circle cx="182" cy="113" r="12" fill="#123D35" />
          <circle cx="86" cy="109" r="3.5" fill="#FFFFFF" />
          <circle cx="186" cy="109" r="3.5" fill="#FFFFFF" />

          {/* beak */}
          <path d="M119 139L145 139L132 158L119 139Z" fill="#F5A623" stroke="#123D35" strokeWidth="4" strokeLinejoin="round" />

          {/* cheek blush */}
          <ellipse cx="35" cy="143" rx="8" ry="5" fill="#F7A4BC" />
          <ellipse cx="229" cy="143" rx="8" ry="5" fill="#F7A4BC" />

          {/* open golden book */}
          <path
            d="M32 180C64 172 95 181 132 203C169 181 200 172 232 180L226 246C190 250 158 260 132 279C106 260 74 250 38 246L32 180Z"
            fill="#FFF9E9"
            stroke="#123D35"
            strokeWidth="8"
            strokeLinejoin="round"
          />
          <path
            d="M32 180C64 172 95 181 132 203V279C106 260 74 250 38 246L32 180Z"
            fill="url(#omGold)"
          />
          <path
            d="M132 203C169 181 200 172 232 180L226 246C190 250 158 260 132 279V203Z"
            fill="#F9B52E"
          />
          <path d="M132 203V279" stroke="#123D35" strokeWidth="7" strokeLinecap="round" />
          <path
            d="M51 197C72 194 91 200 108 210M51 215C72 212 91 218 108 228M213 197C192 194 173 200 156 210M213 215C192 212 173 218 156 228"
            stroke="#FFF8E7"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* learning sparks */}
          <path d="M249 83V101M240 92H258" stroke="#F5B82E" strokeWidth="5" strokeLinecap="round" />
          <circle cx="16" cy="94" r="5" fill="#8B5CF6" />
          <circle cx="252" cy="119" r="4" fill="#38BDF8" />
        </g>
      </svg>
    </div>
  )
}

/**
 * Full OwlMate Brand Logo Component (Mascot Icon + Wordmark + Slogan)
 */
export default function BrandLogo({
  size = 'md',
  showText = true,
  withText = true,
  to,
  className = '',
  textColor = '',
  textClassName = '',
}) {
  const shouldShowText = showText && withText

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <BrandIcon size={size} />
      {shouldShowText && (
        <div className={`flex flex-col leading-none text-left ${textClassName}`}>
          <div className="flex items-center gap-1">
            <span
              className={`font-black tracking-tight text-[#123D35] dark:text-white ${
                size === 'lg' || (typeof size === 'number' && size >= 44)
                  ? 'text-lg sm:text-xl'
                  : size === 'sm' || (typeof size === 'number' && size <= 32)
                  ? 'text-sm'
                  : 'text-base'
              } ${textColor}`}
            >
              Owl
            </span>
            <span
              className={`font-black tracking-tight text-[#239B57] dark:text-[#4ade80] ${
                size === 'lg' || (typeof size === 'number' && size >= 44)
                  ? 'text-lg sm:text-xl'
                  : size === 'sm' || (typeof size === 'number' && size <= 32)
                  ? 'text-sm'
                  : 'text-base'
              }`}
            >
              Mate
            </span>
          </div>
          <span className="text-[9.5px] sm:text-[10px] font-bold tracking-wider text-[#64766D] dark:text-[#94A3B8] uppercase mt-0.5 whitespace-nowrap">
            LEARN TOGETHER. GROW SMARTER.
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
