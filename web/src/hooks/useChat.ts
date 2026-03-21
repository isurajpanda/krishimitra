import { useState, useRef, useCallback } from "react"
import { API_BASE_URL } from "@/config"

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
  const [historyLoaded, setHistoryLoaded] = useState(false)

  // Context history for the API (only user and final assistant messages)
  const conversationHistory = useRef<{role: string, content: string}[]>([])

  const _getProfileContext = () => {
     const name = localStorage.getItem("userName");
     const loc = localStorage.getItem("userLocation");
     const crops = localStorage.getItem("userCrops");
     const type = localStorage.getItem("userFarmType");
     if (!name && !loc && !crops && !type) return null;
     return `Farmer Name: ${name || 'Unknown'}. Location: ${loc || 'Unknown'}. Farm Type: ${type || 'Unknown'}. Crops: ${crops || 'Unknown'}.`;
  };

  const fetchHistory = useCallback(async () => {
    const userId = localStorage.getItem("userId")
    if (!userId || historyLoaded) return

    try {
      const res = await fetch(`${API_BASE_URL}/auth/chat-history/${userId}`)
      if (res.ok) {
        const history: {role: "user"|"ai", content: string, timestamp: string}[] = await res.json()
        const formattedMessages: Message[] = history.map((m, i) => ({
           id: `hist-${i}`,
           role: m.role,
           type: "text",
           content: m.content,
           time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }))
        setMessages(formattedMessages)
        conversationHistory.current = history.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }))
        setHistoryLoaded(true)
      }
    } catch (err) {
      console.error("Failed to fetch chat history:", err)
    }
  }, [historyLoaded])

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
      const res = await fetch(`${API_BASE_URL}/ai-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: conversationHistory.current,
          userId: localStorage.getItem("userId"), // Send userId for storage
          profileContext: _getProfileContext()
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
    sendVoiceDemo,
    fetchHistory
  }
}
