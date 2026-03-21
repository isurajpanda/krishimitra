import { ArrowLeft, Mic, MessageSquare } from "lucide-react"
import { TopAppBar } from "@/components/TopAppBar"
import { useState } from "react"
import { useChat } from "@/hooks/useChat"
import { MessageList } from "./MessageList"
import { InputBar } from "./InputBar"
import { cn } from "@/lib/utils"

interface HomeScreenProps {
  onStartVoice: () => void
  onClose?: () => void
}

export function HomeScreen({ onStartVoice, onClose }: HomeScreenProps) {
  const userName = localStorage.getItem("userName") || "Farmer";
  const [isChatMode, setIsChatMode] = useState(false);
  const { messages, input, setInput, isStreaming, streamText, sendMessage } = useChat();

  return (
    <div className="h-full w-full flex flex-col overflow-hidden relative z-[65]">

      {/* Universal TopAppBar for Chat */}
      <TopAppBar
        className="z-[70]"
        showProfilePic={false}
        title={<></>}
        subtitle={<></>}
        leftAction={
          <button
            onClick={() => isChatMode ? setIsChatMode(false) : onClose?.()}
            className="w-10 h-10 shrink-0 rounded-full bg-surface-container border border-outline/50 flex flex-col items-center justify-center hover:bg-on-surface/10 transition-colors text-on-surface"
          >
            <ArrowLeft className="w-5 h-5 flex-shrink-0" />
          </button>
        }
        actions={
          <div className="flex items-center gap-3">
             <div className="text-right">
               <div className="text-sm font-bold tracking-wide">Namaste, {userName}</div>
               <div className="text-[10px] text-primary tracking-widest uppercase">{isChatMode ? "AI Chat" : "Dashboard"}</div>
             </div>
             <div
               className="bg-surface-container rounded-full w-10 h-10 bg-center bg-cover border border-primary/20 shrink-0 shadow-[0_0_15px_rgba(0,255,65,0.2)]"
               style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB8co6hnZPQzuwm57Rb3mWqL-pCFnYiHakTLmoOyjHBmEswzhIoy6Xh7oK2uuW8F43fhACN8VinpJ_VAQmAQdS9v40XEk3izpHwazq4BunWQjJQgl5yNii2A_ZuhfjxNjJZhC59d3foq88D5IdPb1qHwI9CoUVQxR_A3NXgSXgwTN_y3P_mQl4mnIegRDFvOHdZSrgn8ISDZaq8HrGq486-i1HCg9lQJ94TGAEJANDwzKJ0oybRM-yGoOYAygjx59gBWDtRRLzt7IFy')" }}
             />
          </div>
        }
      />

      {/* ── Spacer to push content below the fixed TopAppBar (≈72 px) ── */}
      <div className="h-[72px] shrink-0" />

      {/* ── Scrollable content area ── fills remaining height above input bar */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className={cn(
          "flex flex-col w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 transition-all duration-700",
          isChatMode ? "pt-4" : "pt-6 md:pt-10"
        )}>

          {/* Hero section — collapses when chatMode is active */}
          <div className={cn(
            "flex transition-all duration-700 ease-in-out relative shrink-0",
            isChatMode
              ? "flex-row-reverse items-center justify-end gap-3 mb-4 scale-90 origin-left"
              : "flex-col md:flex-row items-center justify-between min-h-[200px]"
          )}>
            {/* Text Container */}
            <div className={cn(
              "flex flex-col transition-all duration-700",
              isChatMode ? "items-start" : "items-center md:items-start text-center md:text-left z-20 md:flex-1 md:pr-8"
            )}>
              <h1 className={cn(
                "font-medium tracking-tight leading-tight text-on-surface/90 transition-all duration-700",
                isChatMode ? "text-xl md:text-2xl mb-1" : "text-4xl md:text-5xl lg:text-6xl xl:text-7xl mb-4 md:mb-6"
              )}>
                How can I help you today?
              </h1>
              <div className={cn(
                "text-on-surface/50 leading-relaxed transition-all duration-700 overflow-hidden",
                isChatMode
                  ? "max-h-0 opacity-0"
                  : "max-h-[100px] opacity-100 text-sm md:text-lg lg:text-xl md:mb-8 max-w-[280px] md:max-w-md lg:max-w-lg"
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
                "absolute bg-primary rounded-full blur-[40px] opacity-20 transition-all duration-700",
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
                  background: 'linear-gradient(135deg, rgba(128,255,180,1) 0%, rgba(0,255,65,1) 40%, rgba(0,100,20,1) 80%, rgba(0,20,5,1) 100%)',
                  boxShadow: isChatMode
                    ? '0 0 20px rgba(0,255,65,0.3), inset -5px -5px 10px rgba(0,0,0,0.5)'
                    : '0 0 40px rgba(0,255,65,0.4), inset -15px -15px 30px rgba(0,0,0,0.5), inset 15px 15px 30px rgba(255,255,255,0.8)'
                }}
              >
                <div className="absolute top-1/4 left-1/4 w-1 md:w-2 h-1 md:h-2 bg-white rounded-full blur-[1px] shadow-[0_0_5px_white]" />
              </button>
            </div>
          </div>

          {/* Grid Menu — hidden in chat mode */}
          <div className={cn(
            "grid grid-cols-2 gap-4 md:gap-8 w-full max-w-3xl mx-auto transition-all duration-700",
            isChatMode
              ? "max-h-0 opacity-0 pointer-events-none overflow-hidden mt-0"
              : "max-h-[400px] opacity-100 mt-auto mb-8 md:mb-12 overflow-visible"
          )}>
            <MenuBadge title="Speak with AI" icon={<Mic className="w-6 h-6 text-primary" />} gradient="border-primary/20 bg-primary/10" onClick={onStartVoice} />
            <MenuBadge title="Chat with AI" icon={<MessageSquare className="w-6 h-6 text-tertiary" />} gradient="border-tertiary/20 bg-tertiary/10" onClick={() => setIsChatMode(true)} />
          </div>

          {/* Message list — rendered inline so flex sizing works correctly */}
          {isChatMode && (
            <div className="flex flex-col min-h-0 pb-2">
              <MessageList messages={messages} isStreaming={isStreaming} streamText={streamText} />
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky Input Bar — always pinned to the bottom of the screen ── */}
      <div className="w-full shrink-0 bg-background border-t border-outline/30">
        {!isChatMode ? (
          /* "Ask anything" placeholder — tapping opens chat mode */
          <div
            onClick={() => setIsChatMode(true)}
            className="w-[calc(100%-32px)] sm:w-[calc(100%-48px)] lg:max-w-3xl mx-auto my-8 md:my-12 bg-on-surface/5 border border-outline/30 rounded-3xl h-[72px] md:h-[84px] flex items-center px-8 justify-between backdrop-blur-lg hover:bg-on-surface/10 transition-colors cursor-text group"
          >
            <span className="text-on-surface/40 text-lg ml-2 group-hover:text-on-surface/60 transition-colors">Ask anything…</span>
            <div
              className="w-10 h-10 rounded-2xl shadow-[0_0_15px_rgba(0,255,65,0.5)] transition-transform group-hover:scale-110 shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(128,255,180,1) 0%, rgba(0,255,65,1) 40%, rgba(0,100,20,1) 80%)' }}
            />
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
  )
}

function MenuBadge({ title, icon, gradient, onClick }: { title: string, icon: React.ReactNode, gradient: string, onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-[120px] md:h-[160px] lg:h-[180px] rounded-[32px] bg-gradient-to-br p-6 flex flex-col items-center justify-center gap-3 md:gap-4 border border-outline/30 shadow-xl transition-all duration-300 outline-none",
        gradient,
        "hover:scale-105 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] active:scale-95"
      )}
    >
      <div className="w-10 md:w-14 h-10 md:h-14 rounded-full bg-surface-container flex items-center justify-center backdrop-blur-md border border-outline/30 shadow-[0_0_15px_rgba(0,0,0,0.2)]">
        {icon}
      </div>
      <div className="font-semibold text-base md:text-xl lg:text-2xl text-center leading-tight text-on-surface tracking-tight">
        {title}
      </div>
    </button>
  )
}
