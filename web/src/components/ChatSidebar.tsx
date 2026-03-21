import { cn } from "@/lib/utils"
import { Plus, MessageSquare, Trash2, X } from "lucide-react"
import type { Conversation } from "@/hooks/useChat"

interface ChatSidebarProps {
  isOpen: boolean
  onClose: () => void
  conversations: Conversation[]
  activeConversationId: string | null
  onSelectConversation: (id: string) => void
  onNewChat: () => void
  onDeleteConversation: (id: string) => void
}

export function ChatSidebar({
  isOpen,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation
}: ChatSidebarProps) {
  
  return (
    <>
      {/* Mobile Dark Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[75] md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <div className={cn(
        "fixed top-[72px] bottom-[100px] left-0 z-[80] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col",
        "bg-surface-container/95 backdrop-blur-xl border-r border-outline/30 shadow-[10px_0_30px_rgba(0,0,0,0.3)]",
        "w-[240px] md:w-[260px]", // Thin sidebar
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        
        {/* Header Spacer for TopAppBar */}
        <div className="flex items-center justify-between p-4 border-b border-outline/20">
          <span className="font-semibold text-on-surface tracking-wide">Chats</span>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-on-surface/10 text-on-surface/70 transition-colors md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat()
              if (window.innerWidth < 768) onClose()
            }}
            className="w-full h-11 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl flex items-center justify-center gap-2 font-medium transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin flex flex-col gap-1">
          {conversations.length === 0 ? (
            <div className="text-center text-sm text-on-surface/40 pt-8 px-4">
              No recent conversations
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                className={cn(
                  "group flex items-center justify-between mx-1 rounded-lg transition-all",
                  activeConversationId === conv.id 
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-on-surface/5 text-on-surface/80"
                )}
              >
                <button
                  onClick={() => {
                    onSelectConversation(conv.id)
                    if (window.innerWidth < 768) onClose()
                  }}
                  className="flex-1 flex items-center gap-3 p-3 text-left overflow-hidden relative"
                >
                  <MessageSquare className={cn(
                    "w-4 h-4 shrink-0", 
                    activeConversationId === conv.id ? "text-primary" : "text-on-surface/50"
                  )} />
                  <div className="flex-col overflow-hidden min-w-0">
                    <div className="truncate text-[13px] font-medium leading-tight">
                      {conv.title}
                    </div>
                  </div>
                  {/* Subtle fade on right side of text */}
                  {activeConversationId !== conv.id && (
                     <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-surface-container/95 to-transparent pointer-events-none group-hover:from-transparent transition-all" />
                  )}
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteConversation(conv.id)
                  }}
                  className="p-2.5 opacity-0 group-hover:opacity-100 text-error hover:bg-error/10 transition-all rounded-md shrink-0 mr-1"
                  aria-label="Delete chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Persistent mini dots/knob for collapsed state (mobile/desktop trigger) */}
      {!isOpen && (
        <button 
          onClick={() => {}} // Controlled from TopBar in HomeScreen now, but leaving trigger area
          className="fixed left-0 top-[150px] w-6 h-16 bg-surface-container rounded-r-xl border border-l-0 border-outline/30 flex flex-col items-center justify-center gap-1 z-[70] shadow-xl md:hover:w-8 transition-all hover:bg-on-surface/10 md:hidden" // Only show dots trigger on mobile if user wants to drag it open natively
        >
          <div className="w-[3px] h-[3px] rounded-full bg-on-surface/40" />
          <div className="w-[3px] h-[3px] rounded-full bg-on-surface/40" />
          <div className="w-[3px] h-[3px] rounded-full bg-on-surface/40" />
        </button>
      )}
    </>
  )
}
