import { cn } from "@/lib/utils"

interface BubbleProps {
  role: "user" | "ai"
  text: string
  streaming?: boolean
}

export function TextBubble({ role, text, streaming }: BubbleProps) {
  const isAI = role === "ai"

  return (
    <div className={cn(
      "flex flex-col w-full animate-in fade-in slide-in-from-bottom-4 duration-500",
      isAI ? "items-start" : "items-end"
    )}>
      <div className={cn(
        "flex gap-4 items-start max-w-[85%] transition-all duration-300",
        isAI ? "flex-row" : "flex-row-reverse"
      )}>
        {/* The Orb for AI prefix */}
        {isAI && (
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full shrink-0 relative mt-1" style={{
            background: 'linear-gradient(135deg, rgba(230,230,255,1) 0%, rgba(160,120,255,1) 40%, rgba(200,180,100,1) 80%, rgba(100,50,200,1) 100%)',
            boxShadow: '0 0 15px rgba(160,120,255,0.3), inset -3px -3px 6px rgba(0,0,0,0.4)'
          }}>
            <div className="absolute top-1/4 left-1/4 w-0.5 h-0.5 md:w-1 md:h-1 bg-white rounded-full blur-[0.2px] opacity-80" />
          </div>
        )}

        <div className={cn(
          "px-[22px] py-[16px] leading-tight transition-all duration-300",
          isAI 
            ? "bg-transparent text-white/95 p-0 text-xl md:text-2xl font-medium" 
            : "bg-[#222222] text-white rounded-[24px_24px_4px_24px] text-xl md:text-2xl font-medium shadow-sm"
        )}>
          <span className="whitespace-pre-wrap">{text}</span>
          {streaming && (
            <span className="inline-block w-[3px] h-[1em] bg-[#7C3AFF] ml-2 animate-pulse align-middle" />
          )}
        </div>
      </div>
    </div>
  )
}
