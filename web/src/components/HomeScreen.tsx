import { Bell, ArrowLeft, Mic, MessageSquare } from "lucide-react"
import { useState } from "react"
import { useChat } from "@/hooks/useChat"
import { MessageList } from "./MessageList"
import { InputBar } from "./InputBar"
import { cn } from "@/lib/utils"

interface HomeScreenProps {
  onStartVoice: () => void
  onClose?: () => void
}

export function HomeScreen({ onStartVoice }: HomeScreenProps) {
  const [isChatMode, setIsChatMode] = useState(false);
  const { messages, input, setInput, isStreaming, streamText, sendMessage } = useChat();

  return (
    <div className="flex flex-col h-full w-full relative z-10 p-0 md:p-6 lg:p-10 max-w-[1400px] mx-auto overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center w-full px-6 py-8 md:px-0 md:py-0 mb-4 md:mb-12">
        <div className="flex items-center gap-3">
          {isChatMode ? (
            <button 
              onClick={() => setIsChatMode(false)}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors mr-2"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          ) : (
            <div className="w-10 md:w-12 h-10 md:h-12 rounded-full border border-white/20 overflow-hidden bg-white/10 flex items-center justify-center text-white/70">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-person-circle w-7 h-7" viewBox="0 0 16 16">
                <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
                <path fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"/>
              </svg>
            </div>
          )}
          <div className="text-lg md:text-xl font-medium tracking-wide">
            {isChatMode ? "KrishiMitra Chat" : "User"}
          </div>
        </div>
        <button className="w-10 md:w-12 h-10 md:h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md hover:bg-white/10 transition-colors">
          <Bell className="w-5 md:w-5 h-5 md:h-5 text-white/80" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-700 ease-in-out overflow-hidden relative",
        isChatMode ? "pt-0" : "pt-4 md:pt-10"
      )}>
        
        <div className={cn(
          "flex transition-all duration-700 ease-in-out px-6 relative shrink-0",
          isChatMode 
            ? "flex-row-reverse items-center justify-end gap-3 mb-4 scale-90 origin-left" 
            : "flex-col md:flex-row items-center justify-between flex-1 min-h-[200px]"
        )}>
          {/* Text Container */}
          <div className={cn(
            "flex flex-col transition-all duration-700",
            isChatMode ? "items-start" : "items-center md:items-start text-center md:text-left z-20 md:flex-1 md:pr-8"
          )}>
             <h1 className={cn(
               "font-medium tracking-tight leading-tight text-white/90 transition-all duration-700",
               isChatMode ? "text-xl md:text-2xl mb-1" : "text-4xl md:text-5xl lg:text-6xl xl:text-7xl mb-4 md:mb-6"
             )}>
               How can I help you today?
             </h1>
             <div className={cn(
               "text-white/50 leading-relaxed transition-all duration-700 overflow-hidden",
               isChatMode ? "max-h-0 opacity-0" : "max-h-[100px] opacity-100 text-sm md:text-lg lg:text-xl md:mb-8 max-w-[280px] md:max-w-md lg:max-w-lg"
             )}>
               Your AI companion for smarter farming. Get expert advice on crops, soil, and sustainable agricultural practices.
             </div>
          </div>

          {/* Main Orb Container */}
          <div className={cn(
            "flex flex-col items-center justify-center relative transition-all duration-700",
            isChatMode ? "w-16 h-16 md:w-20 md:h-20" : "my-8 md:my-0 md:flex-1 md:items-end w-full"
          )}>
            {/* Glow behind orb */}
            <div className={cn(
              "absolute bg-[#C08DFF] rounded-full blur-[40px] opacity-40 transition-all duration-700",
              isChatMode ? "w-12 h-12 blur-[20px]" : "w-[180px] md:w-[250px] lg:w-[320px] h-[50px] md:h-[80px]"
            )} />
            
            {/* The Orb */}
            <button 
              onClick={onStartVoice}
              className={cn(
                "relative rounded-full z-10 hover:scale-105 active:scale-95 transition-all duration-700 outline-none focus:ring-4 focus:ring-purple-500/50",
                isChatMode ? "w-14 h-14 md:w-16 md:h-16" : "w-[110px] h-[110px] md:w-[180px] lg:w-[240px] md:h-[180px] lg:h-[240px]"
              )}
              style={{
                background: 'linear-gradient(135deg, rgba(230,230,255,1) 0%, rgba(160,120,255,1) 40%, rgba(200,180,100,1) 80%, rgba(100,50,200,1) 100%)',
                boxShadow: isChatMode 
                  ? '0 0 20px rgba(160,120,255,0.3), inset -5px -5px 10px rgba(0,0,0,0.5)' 
                  : '0 0 40px rgba(160,120,255,0.4), inset -15px -15px 30px rgba(0,0,0,0.5), inset 15px 15px 30px rgba(255,255,255,0.8)'
              }}
            >
              <div className="absolute top-1/4 left-1/4 w-1 md:w-2 h-1 md:h-2 bg-white rounded-full blur-[1px] shadow-[0_0_5px_white]" />
            </button>
          </div>
        </div>

        {/* Grid Menu */}
        <div className={cn(
          "grid grid-cols-2 gap-4 md:gap-8 w-full max-w-3xl mx-auto px-6 transition-all duration-700",
          isChatMode 
            ? "max-h-0 opacity-0 pointer-events-none mt-0 overflow-hidden" 
            : "max-h-[400px] opacity-100 mt-auto mb-8 md:mb-12 overflow-visible"
        )}>
          <MenuBadge title="Speak with AI" icon={<Mic className="w-6 h-6 text-white" />} gradient="from-[#a75ff7] to-[#732ae6]" onClick={onStartVoice} />
          <MenuBadge title="Chat with AI" icon={<MessageSquare className="w-6 h-6 text-white" />} gradient="from-[#5581f1] to-[#1250d4]" onClick={() => setIsChatMode(true)} />
        </div>

        {/* Message List Area */}
        <div className={cn(
          "flex-1 flex flex-col min-h-0 transition-all duration-700 ease-in-out px-4",
          isChatMode ? "opacity-100 translate-y-0 pb-2" : "opacity-0 translate-y-full pointer-events-none absolute inset-0 pt-[200px]"
        )}>
          <div className="flex-1 overflow-hidden flex flex-col">
            <MessageList messages={messages} isStreaming={isStreaming} streamText={streamText} />
          </div>
        </div>

        {/* Input Bar Area */}
        <div className="w-full relative shrink-0">
          {!isChatMode ? (
            <div 
              onClick={() => setIsChatMode(true)}
              className="w-[calc(100%-48px)] lg:max-w-3xl mx-auto mb-8 bg-white/5 border border-white/10 rounded-full h-14 md:h-16 flex items-center px-5 md:px-6 justify-between backdrop-blur-lg hover:bg-white/10 transition-colors cursor-text group"
            >
              <span className="text-white/40 text-sm md:text-base ml-2 group-hover:text-white/60 transition-colors">Ask anything</span>
              <div className="w-6 md:w-8 h-6 md:h-8 rounded-full shadow-[0_0_10px_rgba(200,180,100,0.5)] transition-transform group-hover:scale-110" style={{
                  background: 'linear-gradient(135deg, rgba(230,230,255,1) 0%, rgba(160,120,255,1) 40%, rgba(200,180,100,1) 80%)',
                }} />
            </div>
          ) : (
            <InputBar 
              input={input} 
              setInput={setInput} 
              isStreaming={isStreaming} 
              onSend={() => sendMessage(input)} 
            />
          )}
        </div>
      </div>
    </div>
  )
}

function MenuBadge({ title, icon, gradient, onClick }: { title: string, icon: React.ReactNode, gradient: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "h-[120px] md:h-[160px] lg:h-[180px] rounded-[32px] bg-gradient-to-br p-6 flex flex-col items-center justify-center gap-3 md:gap-4 border border-white/20 shadow-xl transition-all duration-300 outline-none",
        gradient,
        "hover:scale-105 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] active:scale-95"
      )}
    >
      <div className="w-10 md:w-14 h-10 md:h-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md shadow-inner">
        {icon}
      </div>
      <div className="font-semibold text-base md:text-xl lg:text-2xl text-center leading-tight text-white tracking-tight">
        {title}
      </div>
    </button>
  )
}
