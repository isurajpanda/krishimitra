import { Video, Phone, MoreVertical } from "lucide-react"

export function Header() {
  return (
    <header className="h-[68px] px-5 bg-[#0E0E2C]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10">
          <div className="w-full h-full rounded-full border-[1.5px] border-[#7C3AFF] shadow-[0_0_12px_rgba(124,58,255,0.5)] bg-gradient-to-br from-[#7C3AFF] to-[#00D4C8] flex items-center justify-center text-[18px]">
            <span className="drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] text-white">✦</span>
          </div>
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#00D4C8] shadow-[0_0_6px_#00D4C8] border-2 border-[#07071A]" />
        </div>
        <div className="font-['Syne'] font-bold text-[17px] tracking-[0.02em]">AURA</div>
      </div>
      <div className="flex gap-1">
        {[Video, Phone, MoreVertical].map((Icon, i) => (
          <button key={i} className="w-[38px] h-[38px] rounded-full bg-transparent border-none text-[var(--text-secondary)] flex items-center justify-center transition-all duration-200 hover:text-[var(--text-primary)] hover:bg-white/5 hover:shadow-[0_0_12px_rgba(255,255,255,0.05)] hover:-translate-y-[1px]">
            <Icon className="w-5 h-5" />
          </button>
        ))}
      </div>
    </header>
  )
}
