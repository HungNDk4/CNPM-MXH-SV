import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * OwlMascotArt — Specialized Vector Mascot for Academic Empty States
 * Features the friendly OwlMate mascot with academic accessories tailored to each empty context:
 * - 'feed': Mascot reading on a study desk with open book and warm tea
 * - 'search': Mascot with magnifying glass inspecting an ancient campus parchment
 * - 'notifications': Mascot resting peacefully with a golden bell
 * - 'documents': Mascot organizing study binders, folders, and pencil
 * - 'profile': Mascot with scholar graduation cap and campus diploma
 * - 'bookmarks': Mascot with golden ribbon bookmarked library books
 */
export function OwlMascotArt({ variant = 'feed', className = 'w-36 h-36 sm:w-44 sm:h-44' }) {
  return (
    <div className={cn('relative flex items-center justify-center shrink-0 mx-auto select-none my-1', className)}>
      <svg
        viewBox="0 0 240 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md transition-transform duration-300 hover:scale-105"
        role="img"
        aria-label={`OwlMate ${variant} mascot`}
      >
        <defs>
          <linearGradient id="owlGreenGrad" x1="40" y1="30" x2="200" y2="200" gradientUnits="userSpaceOnUse">
            <stop stopColor="#34D399" />
            <stop offset="0.6" stopColor="#16A34A" />
            <stop offset="1" stopColor="#15803D" />
          </linearGradient>
          <linearGradient id="owlGoldGrad" x1="60" y1="140" x2="180" y2="220" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FDE68A" />
            <stop offset="0.5" stopColor="#F59E0B" />
            <stop offset="1" stopColor="#D97706" />
          </linearGradient>
          <linearGradient id="owlHaloGrad" x1="0" y1="0" x2="240" y2="240" gradientUnits="userSpaceOnUse">
            <stop stopColor="#DCFCE7" stopOpacity="0.8" />
            <stop offset="1" stopColor="#FEF3C7" stopOpacity="0.4" />
          </linearGradient>
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Backdrop Ambient Halo */}
        <circle cx="120" cy="120" r="96" fill="url(#owlHaloGrad)" className="dark:opacity-20" />

        {/* Ground / Desk Shadow */}
        <ellipse cx="120" cy="204" rx="72" ry="12" fill="#123D35" fillOpacity="0.12" />

        {/* Mascot Main Body & Ears */}
        <g transform="translate(0, 4)">
          <path
            d="M52 74C38 58 32 38 34 20L72 42C88 28 106 20 120 20C134 20 152 28 168 42L206 20C208 38 202 58 188 74C200 92 206 112 205 134C204 160 192 176 178 186L174 202C154 208 136 214 120 224C104 214 86 208 66 202L62 186C48 176 36 160 35 134C34 112 40 92 52 74Z"
            fill="url(#owlGreenGrad)"
            stroke="#123D35"
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* Ear insets */}
          <path d="M47 34L68 48L57 61C52 53 49 43 47 34Z" fill="#A7F3D0" />
          <path d="M193 34L172 48L183 61C188 53 191 43 193 34Z" fill="#A7F3D0" />

          {/* Round Academic Glasses */}
          <path
            d="M56 90C56 77 65 69 79 69H96C110 69 119 78 119 92V110C119 126 108 136 92 136H78C62 136 56 125 56 110V90Z"
            fill="#FFFDF7"
            stroke="#123D35"
            strokeWidth="5"
          />
          <path
            d="M121 92C121 78 130 69 144 69H161C175 69 184 77 184 90V110C184 125 178 136 162 136H148C132 136 121 126 121 110V92Z"
            fill="#FFFDF7"
            stroke="#123D35"
            strokeWidth="5"
          />
          <path d="M119 95C120 94 120 94 121 95" stroke="#123D35" strokeWidth="6" strokeLinecap="round" />

          {/* Eyes (Pupils with friendly catchlights) */}
          {variant === 'notifications' ? (
            // Peaceful sleeping/resting eyes for notifications
            <>
              <path d="M72 104C77 112 91 112 96 104" stroke="#123D35" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M144 104C149 112 163 112 168 104" stroke="#123D35" strokeWidth="4.5" strokeLinecap="round" />
            </>
          ) : (
            // Inquisitive curious eyes
            <>
              <circle cx="86" cy="102" r="10" fill="#123D35" />
              <circle cx="154" cy="102" r="10" fill="#123D35" />
              <circle cx="89" cy="99" r="3" fill="#FFFFFF" />
              <circle cx="157" cy="99" r="3" fill="#FFFFFF" />
            </>
          )}

          {/* Orange Beak */}
          <path d="M110 120H130L120 135L110 120Z" fill="#F59E0B" stroke="#123D35" strokeWidth="3.5" strokeLinejoin="round" />

          {/* Rosy Cheeks */}
          <ellipse cx="49" cy="122" rx="7" ry="4.5" fill="#FDA4AF" />
          <ellipse cx="191" cy="122" rx="7" ry="4.5" fill="#FDA4AF" />

          {/* Belly Feather Texture */}
          <path d="M106 150C114 154 126 154 134 150" stroke="#065F46" strokeWidth="3" strokeLinecap="round" />
          <path d="M100 162C112 167 128 167 140 162" stroke="#065F46" strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* ── Variant-specific Academic Accessories ── */}
        {variant === 'feed' && (
          // Open golden book in front with study coffee
          <g transform="translate(18, 142)">
            <path
              d="M32 20C58 12 82 20 102 36C122 20 146 12 172 20L168 62C140 56 120 64 102 78C84 64 64 56 36 62L32 20Z"
              fill="#FFFBEB"
              stroke="#123D35"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            <path d="M32 20C58 12 82 20 102 36V78C84 64 64 56 36 62L32 20Z" fill="url(#owlGoldGrad)" />
            <path d="M102 36C122 20 146 12 172 20L168 62C140 56 120 64 102 78V36Z" fill="#FBBF24" />
            <path d="M102 36V78" stroke="#123D35" strokeWidth="5" strokeLinecap="round" />
            {/* Steaming coffee cup badge */}
            <circle cx="188" cy="18" r="14" fill="#10B981" stroke="#123D35" strokeWidth="3" />
            <path d="M184 16H192V22C192 24.2 190.2 26 188 26C185.8 26 184 24.2 184 22V16Z" fill="#FFFFFF" />
            <path d="M192 18H194.5C195.3 18 196 18.7 196 19.5C196 20.3 195.3 21 194.5 21H192" stroke="#FFFFFF" strokeWidth="1.5" />
          </g>
        )}

        {variant === 'search' && (
          // Magnifying glass inspecting parchment
          <g transform="translate(140, 116)">
            {/* Parchment roll */}
            <rect x="-80" y="32" width="70" height="42" rx="4" fill="#FEF3C7" stroke="#123D35" strokeWidth="4" />
            <line x1="-70" y1="44" x2="-30" y2="44" stroke="#D97706" strokeWidth="3" strokeLinecap="round" />
            <line x1="-70" y1="54" x2="-40" y2="54" stroke="#D97706" strokeWidth="3" strokeLinecap="round" />
            <line x1="-70" y1="64" x2="-50" y2="64" stroke="#D97706" strokeWidth="3" strokeLinecap="round" />
            {/* Magnifying glass */}
            <circle cx="16" cy="18" r="24" fill="#E0F2FE" fillOpacity="0.8" stroke="#123D35" strokeWidth="5" />
            <circle cx="16" cy="18" r="18" stroke="#38BDF8" strokeWidth="3" strokeDasharray="4 2" />
            <path d="M33 35L54 56" stroke="#123D35" strokeWidth="7" strokeLinecap="round" />
            <path d="M10 12L14 16" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}

        {variant === 'notifications' && (
          // Golden chime bell resting with sparkles
          <g transform="translate(100, 150)">
            <path
              d="M20 12C20 6.5 24.5 2 30 2C35.5 2 40 6.5 40 12V26L46 32V35H14V32L20 26V12Z"
              fill="url(#owlGoldGrad)"
              stroke="#123D35"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <circle cx="30" cy="38" r="4" fill="#D97706" stroke="#123D35" strokeWidth="3" />
            <path d="M28 2V-2C28 -3.1 28.9 -4 30 -4C31.1 -4 32 -3.1 32 -2V2" stroke="#123D35" strokeWidth="3" strokeLinecap="round" />
            {/* Zzz calm particles */}
            <text x="56" y="8" fill="#10B981" fontSize="16" fontWeight="bold" fontFamily="monospace">Z</text>
            <text x="68" y="-4" fill="#34D399" fontSize="12" fontWeight="bold" fontFamily="monospace">z</text>
          </g>
        )}

        {variant === 'documents' && (
          // Stack of academic PDF binders and files
          <g transform="translate(68, 148)">
            {/* Folder 1 */}
            <rect x="0" y="16" width="104" height="42" rx="6" fill="#10B981" stroke="#123D35" strokeWidth="4" />
            {/* PDF tag */}
            <rect x="14" y="24" width="28" height="16" rx="3" fill="#DC2626" />
            <text x="18" y="36" fill="#FFFFFF" fontSize="9" fontWeight="900" fontFamily="sans-serif">PDF</text>
            <line x1="48" y1="28" x2="88" y2="28" stroke="#ECFDF5" strokeWidth="3" strokeLinecap="round" />
            <line x1="48" y1="36" x2="76" y2="36" stroke="#ECFDF5" strokeWidth="3" strokeLinecap="round" />
            {/* Bookmark ribbon */}
            <path d="M84 16V30L90 26L96 30V16H84Z" fill="#F59E0B" />
          </g>
        )}

        {variant === 'profile' && (
          // Graduation Cap on Mascot's head & diploma
          <g transform="translate(64, 4)">
            <path d="M56 12L108 30L56 48L4 30L56 12Z" fill="#123D35" stroke="#064E3B" strokeWidth="3" strokeLinejoin="round" />
            <path d="M26 38V56C26 64 40 70 56 70C72 70 86 64 86 56V38" fill="#166534" stroke="#123D35" strokeWidth="3" />
            <circle cx="56" cy="30" r="4" fill="#F59E0B" />
            <path d="M56 30L86 42V60" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="86" cy="62" r="3" fill="#D97706" />
          </g>
        )}

        {variant === 'bookmarks' && (
          // Open golden books with bookmark ribbons
          <g transform="translate(86, 148)">
            <rect x="0" y="8" width="68" height="48" rx="5" fill="#FEF3C7" stroke="#123D35" strokeWidth="4" />
            <path d="M24 8V34L34 26L44 34V8H24Z" fill="#D97706" stroke="#123D35" strokeWidth="3" />
            <circle cx="34" cy="20" r="3" fill="#FFFFFF" />
          </g>
        )}
      </svg>
    </div>
  )
}

/**
 * Standard Academic EmptyState Component
 * Features the Owl Mascot System with customized variants for campus sections.
 * Supports actionLabel/actionLink or actionText/actionHref for 100% backward compatibility.
 */
export default function EmptyState({
  variant = 'feed', // 'feed' | 'search' | 'notifications' | 'documents' | 'profile' | 'bookmarks' | 'default'
  icon: Icon = Sparkles,
  title = 'Chưa có dữ liệu',
  description = 'Hiện tại chưa có nội dung nào trong danh mục này.',
  actionLabel,
  actionLink,
  actionText,
  actionHref,
  onAction,
  className = '',
}) {
  const finalActionLabel = actionLabel || actionText
  const finalActionLink = actionLink || actionHref

  return (
    <div
      className={cn(
        'card text-center py-10 sm:py-14 px-6 sm:px-8 space-y-4 max-w-lg mx-auto bg-white dark:bg-[#242526] border border-[#E2E7DE] dark:border-[#3E4042] rounded-2xl shadow-xs transition-colors duration-200',
        className
      )}
    >
      {/* Official OwlMate Mascot Illustration */}
      <OwlMascotArt variant={variant} />

      <div className="space-y-1.5 pt-1">
        <h3 className="text-base sm:text-lg font-bold text-[#06110a] dark:text-[#E4E6EB] tracking-tight">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-[#56614f] dark:text-[#B0B3B8] max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      {finalActionLabel && (
        <div className="pt-2">
          {finalActionLink ? (
            <Link
              to={finalActionLink}
              className="btn-primary text-xs sm:text-sm inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-[#16A34A] hover:bg-[#15803D] text-white shadow-xs transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <span>{finalActionLabel}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="btn-primary text-xs sm:text-sm inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-[#16A34A] hover:bg-[#15803D] text-white shadow-xs transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <span>{finalActionLabel}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
