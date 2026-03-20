import { Send } from "lucide-react"
import { cn } from "@/lib/utils"

interface InputBarProps {
  input: string
  setInput: (value: string) => void
  isStreaming: boolean
  onSend: () => void
}

export function InputBar({ input, setInput, isStreaming, onSend }: InputBarProps) {
  const hasText = input.trim().length > 0
  const canSend = hasText && !isStreaming

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (canSend) onSend()
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 md:py-12 pb-safe flex items-center gap-4">
      <div className="flex-1 relative h-[72px] md:h-[84px]">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          autoComplete="off"
          className="w-full h-full bg-on-surface/5 border border-outline/30 rounded-3xl px-8 text-on-surface placeholder-on-surface/30 text-lg outline-none transition-all duration-200 focus:bg-on-surface/10 focus:border-primary/40"
        />
      </div>

      <button
        onClick={onSend}
        disabled={!canSend}
        className={cn(
          "w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-3xl flex items-center justify-center transition-all duration-300 shadow-xl",
          canSend 
            ? "bg-primary text-on-primary hover:scale-110 active:scale-95 shadow-[0_0_30px_rgba(0,255,65,0.4)]" 
            : "bg-on-surface/5 border border-outline/30 text-on-surface/30 opacity-50 cursor-not-allowed"
        )}
      >
        <Send className="w-7 h-7 md:w-8 md:h-8 -ml-0.5" />
      </button>
    </div>
  )
}
