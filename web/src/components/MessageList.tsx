import { useEffect, useRef } from "react"
import { TextBubble } from "./TextBubble"
import { VoiceBubble } from "./VoiceBubble"
import { TypingIndicator } from "./TypingIndicator"
import type { Message } from "@/hooks/useChat"

interface MessageListProps {
  messages: Message[]
  isStreaming: boolean
  streamText: string
}

export function MessageList({ messages, isStreaming, streamText }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamText])

  return (
    <div 
      ref={scrollRef} 
      className="flex-1 overflow-y-auto px-4 py-8 flex flex-col gap-8 scroll-smooth scrollbar-hide bg-transparent"
    >
      {messages.map((msg) => (
        msg.type === "voice" ? (
          <VoiceBubble key={msg.id} role={msg.role} time={msg.time} durationSec={8} />
        ) : (
          <TextBubble key={msg.id} role={msg.role} text={msg.content} />
        )
      ))}

      {isStreaming && (
        streamText ? (
          <TextBubble role="ai" text={streamText} streaming />
        ) : (
          <TypingIndicator />
        )
      )}
    </div>
  )
}
