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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamText, isStreaming])

  return (
    <div 
      className="flex-1 overflow-y-auto px-4 py-8 flex flex-col gap-8 scrollbar-hide bg-transparent"
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
      
      <div ref={messagesEndRef} className="h-4 w-full shrink-0" />
    </div>
  )
}
