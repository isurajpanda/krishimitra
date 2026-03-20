import { useState, useRef, useCallback } from "react"

export interface Message {
  id: string
  role: "user" | "ai"
  type: "text" | "voice"
  content: string
  time: string
}

function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamText, setStreamText] = useState("")

  // Context history for the API (only user and final assistant messages)
  const conversationHistory = useRef<{role: string, content: string}[]>([])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return

    // 1. Add User Message to UI & Context
    const userMsg: Message = { id: Date.now().toString(), role: "user", type: "text", content: text, time: now() }
    setMessages(prev => [...prev, userMsg])
    
    // Add user message to history
    conversationHistory.current.push({ role: "user", content: text })
    
    setInput("")
    setIsStreaming(true)
    setStreamText("") 

    try {
      const res = await fetch("http://localhost:3001/api/v0/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: conversationHistory.current,
          userId: localStorage.getItem("userId"), // Send userId for storage
        })
      })

      if (!res.ok) throw new Error(`API Error: ${res.status}`)

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunkText = decoder.decode(value, { stream: true })
          // Handle potential multiple SSE data lines in one chunk
          const lines = chunkText.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim()
              if (data === "[DONE]") break

              try {
                const json = JSON.parse(data)
                const token = json.choices?.[0]?.delta?.content || ""
                fullText += token
                setStreamText(fullText)
              } catch (e) {
                // Ignore parsing errors for incomplete JSON chunks
              }
            }
          }
        }
      }

      // 3. Finalize AI Message
      conversationHistory.current.push({ role: "assistant", content: fullText })
      const aiMsg: Message = { id: Date.now().toString(), role: "ai", type: "text", content: fullText, time: now() }
      setMessages(prev => [...prev, aiMsg])

    } catch (err) {
      console.error(err)
      const errorMsg: Message = { id: Date.now().toString(), role: "ai", type: "text", content: "Signal lost. Connections to AI assistant interrupted.", time: now() }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsStreaming(false)
      setStreamText("")
    }
  }, [isStreaming]) // include isStreaming to avoid double-sends

  const sendVoiceDemo = useCallback(() => {
    if (isStreaming) return
    const userVoiceMsg: Message = { id: Date.now().toString(), role: "user", type: "voice", content: "", time: now() }
    setMessages(prev => [...prev, userVoiceMsg])
  }, [isStreaming])

  return {
    messages,
    input,
    setInput,
    isStreaming,
    streamText,
    sendMessage,
    sendVoiceDemo
  }
}
