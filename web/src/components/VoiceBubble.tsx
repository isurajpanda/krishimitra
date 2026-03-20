import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { CheckCheck } from "lucide-react"

interface VoiceBubbleProps {
  role: "user" | "ai"
  time: string
  durationSec?: number
}

// Generate organic bars once per bubble
function generateBars(count: number) {
  return Array.from({ length: count }).map((_, i) => {
    const curve = Math.sin((i / count) * Math.PI * 1.5) * 6
    const noise = Math.random() * 8
    return 6 + curve + noise
  })
}

export function VoiceBubble({ role, time, durationSec = 12 }: VoiceBubbleProps) {
  const isAI = role === "ai"
  const totalBars = isAI ? 34 : 28
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [playheadIndex, setPlayheadIndex] = useState(0)
  
  // Memoize bars so they don't randomly shift shape on state update
  const [bars] = useState(() => generateBars(totalBars))
  
  const waveformRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<number | null>(null)
  const intervalMs = (durationSec * 1000) / totalBars

  const currentSec = Math.floor((playheadIndex / totalBars) * durationSec)
  const timeFormatted = `0:${currentSec.toString().padStart(2, "0")}`

  const resetPlayback = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setIsPlaying(false)
  }

  const togglePlay = () => {
    if (isPlaying) {
      resetPlayback()
    } else {
      if (playheadIndex >= totalBars) setPlayheadIndex(0)
      setIsPlaying(true)
    }
  }

  // Handle Play/Pause Interval
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setPlayheadIndex((prev) => {
          if (prev + 1 >= totalBars) {
            resetPlayback()
            return totalBars
          }
          return prev + 1
        })
      }, intervalMs)
    } else {
      resetPlayback()
    }

    return () => resetPlayback()
  }, [isPlaying, totalBars, intervalMs])

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformRef.current) return
    const rect = waveformRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    setPlayheadIndex(Math.floor(pct * totalBars))
  }

  return (
    <div className={cn(
      "flex flex-col max-w-[78%] animate-in fade-in slide-in-from-bottom-3 duration-300",
      isAI ? "self-start" : "self-end items-end"
    )}>
      <div className={cn(
        "w-[270px] flex items-center p-3 gap-3.5 backdrop-blur-md relative rounded-[18px]",
        isAI 
          ? "bg-primary/10 border border-primary/30 rounded-tl-[4px] shadow-[0_8px_30px_rgba(0,0,0,0.3),_inset_0_0_20px_rgba(0,255,65,0.05)]"
          : "bg-tertiary/10 border border-tertiary/30 rounded-tr-[4px] shadow-[0_8px_30px_rgba(0,0,0,0.3),_inset_0_0_20px_rgba(128,255,180,0.05)]"
      )}>
        <button 
          onClick={togglePlay}
          className={cn(
            "shrink-0 w-[38px] h-[38px] rounded-full flex items-center justify-center border-none transition-all duration-300 active:scale-95 hover:scale-105",
            isAI 
              ? "bg-primary shadow-[0_4px_15px_rgba(0,255,65,0.4)] hover:shadow-[0_0_20px_rgba(0,255,65,0.8)]"
              : "bg-tertiary shadow-[0_4px_15px_rgba(128,255,180,0.3)] hover:shadow-[0_0_20px_rgba(128,255,180,0.8)]"
          )}
        >
          {isPlaying ? (
            <svg className="w-3.5 h-3.5 fill-black" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          ) : (
            <svg className="w-3.5 h-3.5 fill-black translate-x-[1px]" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>

        <div 
          ref={waveformRef}
          onClick={handleScrub}
          className="flex-1 flex items-center justify-between h-[32px] cursor-pointer relative"
        >
          <div className="flex items-center gap-[2px] w-full h-full">
            {bars.map((baseH, i) => {
              const played = i < playheadIndex
              return (
                <div
                  key={i}
                  className={cn(
                    "w-[3px] rounded-[2px] transition-colors duration-100 ease-linear origin-center",
                    played 
                      ? isAI ? "bg-primary shadow-[0_0_5px_rgba(0,255,65,0.5)]" : "bg-tertiary shadow-[0_0_5px_rgba(128,255,180,0.5)]"
                      : "bg-on-surface/20",
                    isPlaying ? "animate-[barBounce_0.4s_infinite_alternate_ease-in-out]" : ""
                  )}
                  style={{
                    height: `${baseH}px`,
                    animationDelay: `${i * 0.04}s`,
                    // Use a CSS variable for the base height so keyframes can scale it
                    "--base-h": `${baseH}px`
                  } as React.CSSProperties}
                />
              )
            })}
          </div>
        </div>

        <div className="text-[11.5px] font-medium text-on-surface w-[30px] text-right tabular-nums">
          {timeFormatted}
        </div>
      </div>

      <div className={cn(
        "text-[11px] text-on-surface-variant mt-1.5 flex items-center gap-1 px-1",
        isAI ? "justify-start" : "justify-end"
      )}>
        <span>{time}</span>
        {!isAI && <CheckCheck className="w-3.5 h-3.5 text-primary" />}
      </div>
    </div>
  )
}
