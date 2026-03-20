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
    <div className="h-[90px] px-6 lg:px-10 flex items-center gap-3 shrink-0">
      <div className="flex-1 relative h-[52px]">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          autoComplete="off"
          className="w-full h-full bg-white/5 border border-white/10 rounded-full px-6 text-white placeholder-white/30 text-[15px] outline-none transition-all duration-200 focus:bg-white/10 focus:border-[#7C3AFF]/40"
        />
      </div>

      <button
        onClick={onSend}
        disabled={!canSend}
        className={cn(
          "w-12 h-12 shrink-0 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg",
          canSend 
            ? "bg-gradient-to-br from-[#7C3AFF] to-[#00D4C8] text-white hover:scale-105 active:scale-95" 
            : "bg-white/5 border border-white/10 text-white/30 opacity-50 cursor-not-allowed"
        )}
      >
        <Send className="w-5 h-5 -ml-0.5" />
      </button>
    </div>
  )
}
