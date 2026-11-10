import React, { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { postAPI } from '@/services/api'
import toast from 'react-hot-toast'
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  BookOpen,
  Coffee,
  Brain,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

const FOCUS_SECONDS = 25 * 60
const BREAK_SECONDS = 5 * 60

/**
 * Mini Pomodoro Widget — "Góc Tập Trung"
 * Uses client timestamp math so backgrounding the tab does not desynchronize time.
 */
function FocusPomodoroWidget() {
  const [mode, setMode] = useState('focus') // 'focus' | 'break'
  const [isRunning, setIsRunning] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(FOCUS_SECONDS)

  // Store target end timestamp for drift-proof time calculation
  const targetEndTimeRef = useRef(null)

  // Switch mode
  const handleModeSwitch = (newMode) => {
    setIsRunning(false)
    setMode(newMode)
    const total = newMode === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS
    setRemainingSeconds(total)
    targetEndTimeRef.current = null
  }

  // Play / Pause toggle
  const toggleTimer = () => {
    if (isRunning) {
      // Pause: cancel target end time
      setIsRunning(false)
      targetEndTimeRef.current = null
    } else {
      // Start: set target end timestamp based on current remaining seconds
      if (remainingSeconds <= 0) {
        const total = mode === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS
        setRemainingSeconds(total)
        targetEndTimeRef.current = Date.now() + total * 1000
      } else {
        targetEndTimeRef.current = Date.now() + remainingSeconds * 1000
      }
      setIsRunning(true)
    }
  }

  // Reset timer
  const resetTimer = () => {
    setIsRunning(false)
    targetEndTimeRef.current = null
    const total = mode === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS
    setRemainingSeconds(total)
  }

  // Timer tick effect with timestamp difference
  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      if (!targetEndTimeRef.current) return
      const now = Date.now()
      const diffMs = targetEndTimeRef.current - now
      const secondsLeft = Math.max(0, Math.ceil(diffMs / 1000))

      setRemainingSeconds(secondsLeft)

      if (secondsLeft <= 0) {
        setIsRunning(false)
        targetEndTimeRef.current = null
        clearInterval(interval)

        // Session finished notification
        if (mode === 'focus') {
          toast.success('🎉 Hoàn thành phiên tập trung 25 phút! Hãy giải lao 5 phút nhé.', {
            duration: 6000,
            icon: '☕',
          })
          handleModeSwitch('break')
        } else {
          toast.success('✨ Đã hết giờ nghỉ! Sẵn sàng cho phiên học mới chưa?', {
            duration: 6000,
            icon: '📚',
          })
          handleModeSwitch('focus')
        }
      }
    }, 500)

    return () => clearInterval(interval)
  }, [isRunning, mode])

  const totalTime = mode === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS
  const progressPercent = Math.min(100, Math.max(0, ((totalTime - remainingSeconds) / totalTime) * 100))

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return (
    <div className="rounded-2xl p-5 bg-white dark:bg-[#242526] border border-[#E2E7DE] dark:border-[#3E4042] shadow-xs transition-colors duration-200">
      {/* Widget Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#16A34A] dark:text-[#4ADE80] flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/60">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#06110a] dark:text-white leading-tight">
              Góc Tập Trung
            </h3>
            <p className="text-[11px] text-[#56614f] dark:text-[#B0B3B8]">
              {mode === 'focus' ? 'Pomodoro 25m' : 'Giải lao 5m'}
            </p>
          </div>
        </div>

        {/* Mode Selector Pill */}
        <div className="flex items-center p-0.5 rounded-xl bg-[#F2F4EF] dark:bg-[#18191A] border border-[#E2E7DE] dark:border-[#3E4042] text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => handleModeSwitch('focus')}
            className={`px-2.5 py-1 rounded-lg transition-all duration-150 cursor-pointer ${
              mode === 'focus'
                ? 'bg-white dark:bg-[#242526] text-[#16A34A] dark:text-[#4ADE80] shadow-2xs font-bold'
                : 'text-[#56614f] dark:text-[#B0B3B8] hover:text-[#06110a] dark:hover:text-white'
            }`}
          >
            Học tập
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch('break')}
            className={`px-2.5 py-1 rounded-lg transition-all duration-150 cursor-pointer ${
              mode === 'break'
                ? 'bg-white dark:bg-[#242526] text-[#F59E0B] dark:text-[#FBBF24] shadow-2xs font-bold'
                : 'text-[#56614f] dark:text-[#B0B3B8] hover:text-[#06110a] dark:hover:text-white'
            }`}
          >
            Nghỉ ngơi
          </button>
        </div>
      </div>

      {/* Timer Circular Progress & Digits */}
      <div className="flex flex-col items-center justify-center my-2">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              className="text-[#E2E7DE] dark:text-[#3E4042]"
              strokeWidth="7"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              className={mode === 'focus' ? 'text-[#16A34A] dark:text-[#4ADE80]' : 'text-[#F59E0B] dark:text-[#FBBF24]'}
              strokeWidth="7"
              strokeDasharray={264}
              strokeDashoffset={264 - (264 * progressPercent) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
            />
          </svg>

          {/* Time text centered */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="font-mono text-2xl font-black text-[#06110a] dark:text-white tracking-tight">
              {formattedTime}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#56614f] dark:text-[#B0B3B8]">
              {isRunning ? 'Đang chạy' : remainingSeconds === totalTime ? 'Sẵn sàng' : 'Tạm dừng'}
            </span>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-2 mt-3">
        <button
          type="button"
          onClick={toggleTimer}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer shadow-xs active:scale-95 ${
            isRunning
              ? 'bg-amber-600 hover:bg-amber-700 text-white'
              : 'bg-[#16A34A] hover:bg-[#15803D] text-white'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              <span>Tạm dừng</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{remainingSeconds < totalTime ? 'Tiếp tục' : 'Bắt đầu'}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={resetTimer}
          className="p-2 rounded-xl border border-[#E2E7DE] dark:border-[#3E4042] text-[#56614f] dark:text-[#B0B3B8] hover:bg-[#F2F4EF] dark:hover:bg-[#18191A] hover:text-[#06110a] dark:hover:text-white transition-all duration-150 cursor-pointer active:scale-90"
          title="Đặt lại đồng hồ"
          aria-label="Đặt lại đồng hồ"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

/**
 * Trending Subjects & Topics Widget
 * Uses real API getTrendingTopics with loading shimmer, empty state, and error handling.
 */
function TrendingTopicsWidget({ onSelectTopic }) {
  const { data: topics = [], isLoading, isError } = useQuery({
    queryKey: ['trending-topics'],
    queryFn: async () => {
      try {
        const res = await postAPI.getTrendingTopics()
        return Array.isArray(res.data?.data) ? res.data.data : []
      } catch (err) {
        return []
      }
    },
    staleTime: 60000,
  })

  return (
    <div className="rounded-2xl p-5 bg-white dark:bg-[#242526] border border-[#E2E7DE] dark:border-[#3E4042] shadow-xs transition-colors duration-200">
      {/* Widget Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-[#D97706] dark:text-[#FBBF24] flex items-center justify-center border border-amber-200/60 dark:border-amber-800/60">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#06110a] dark:text-white leading-tight">
              Môn học thịnh hành
            </h3>
            <p className="text-[11px] text-[#56614f] dark:text-[#B0B3B8]">
              Chủ đề sinh viên trao đổi nhiều
            </p>
          </div>
        </div>
        <span className="text-[10.5px] font-bold text-[#16A34A] dark:text-[#4ADE80] bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">
          Campus
        </span>
      </div>

      {/* Widget Body */}
      {isLoading ? (
        <div className="space-y-2 py-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2.5 animate-pulse">
              <div className="w-7 h-7 rounded-lg bg-[#E2E7DE] dark:bg-[#3E4042]" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-[#E2E7DE] dark:bg-[#3E4042] rounded-md w-3/4" />
                <div className="h-2 bg-[#E2E7DE] dark:bg-[#3E4042] rounded-md w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : isError || topics.length === 0 ? (
        <div className="text-center py-4 px-2 space-y-1">
          <BookOpen className="w-6 h-6 text-[#A8B5A6] mx-auto opacity-70" />
          <p className="text-xs font-semibold text-[#56614f] dark:text-[#B0B3B8]">
            Chưa có chủ đề nổi bật nào
          </p>
          <p className="text-[11px] text-[#8C9888] dark:text-[#888A8E]">
            Đăng bài viết mới để khởi xướng thảo luận môn học!
          </p>
        </div>
      ) : (
        <div className="space-y-1.5 pt-1">
          {topics.slice(0, 5).map((item) => (
            <button
              key={item.topic || item.name}
              type="button"
              onClick={() => onSelectTopic && onSelectTopic(item)}
              className="w-full text-left flex items-center justify-between p-2 rounded-xl hover:bg-[#F2F4EF] dark:hover:bg-[#18191A] transition-colors duration-150 group cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-[#16A34A] dark:text-[#4ADE80] font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200/40 dark:border-emerald-800/40">
                  #
                </span>
                <span className="text-xs font-bold text-[#06110a] dark:text-[#E4E6EB] group-hover:text-[#16A34A] dark:group-hover:text-[#4ADE80] transition-colors truncate">
                  {item.topic || item.name}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-[#56614f] dark:text-[#B0B3B8] shrink-0 pl-2">
                {item.count || 0} bài
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Academic Integrity Code of Conduct Widget
 * Compact, inspiring card reminding students of community guidelines.
 */
function AcademicCodeWidget() {
  return (
    <div className="rounded-2xl p-4 bg-gradient-to-br from-[#F0FDF4] to-[#FEF3C7]/40 dark:from-[#18231c] dark:to-[#222119] border border-[#DCFCE7] dark:border-[#3E4042] shadow-xs transition-colors duration-200">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <h4 className="font-bold text-xs sm:text-sm text-[#06110a] dark:text-white">
          Quy tắc học thuật văn minh
        </h4>
      </div>

      <ul className="space-y-1.5 text-[11px] text-[#56614f] dark:text-[#B0B3B8] leading-relaxed">
        <li className="flex items-start gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
          <span>Liêm chính học thuật: Không sao chép, tôn trọng tác quyền.</span>
        </li>
        <li className="flex items-start gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
          <span>Thảo luận xây dựng: Tôn trọng ý kiến, trao đổi văn minh.</span>
        </li>
        <li className="flex items-start gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
          <span>Ghi nguồn rõ ràng: Trích dẫn tài liệu tham khảo khi chia sẻ.</span>
        </li>
      </ul>
    </div>
  )
}

/**
 * RightAcademicSidebar Component
 * Rendered strictly on desktop (lg: 1024px+) to keep mobile/tablet 1-column reading pristine.
 */
export default function RightAcademicSidebar({ onSelectTopic, className = '' }) {
  return (
    <aside
      aria-label="Cột bên học thuật"
      className={`hidden lg:flex flex-col gap-4 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-8 ${className}`}
    >
      {/* Widget 1: Góc Tập Trung (Mini Pomodoro) */}
      <FocusPomodoroWidget />

      {/* Widget 2: Môn học thịnh hành */}
      <TrendingTopicsWidget onSelectTopic={onSelectTopic} />

      {/* Widget 3: Quy tắc học thuật văn minh */}
      <AcademicCodeWidget />
    </aside>
  )
}

