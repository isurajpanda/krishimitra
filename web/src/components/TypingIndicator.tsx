export function TypingIndicator() {
  return (
    <div className="flex items-center gap-4 self-start animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Small Orb prefix for typing consistency */}
      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full shrink-0 relative" style={{
        background: 'linear-gradient(135deg, rgba(230,230,255,1) 0%, rgba(160,120,255,1) 40%, rgba(200,180,100,1) 80%, rgba(100,50,200,1) 100%)',
        boxShadow: '0 0 10px rgba(160,120,255,0.2)'
      }}>
        <div className="absolute top-1/4 left-1/4 w-0.5 h-0.5 bg-white rounded-full blur-[0.2px] opacity-70" />
      </div>

      <div className="flex gap-1.5 px-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  )
}
