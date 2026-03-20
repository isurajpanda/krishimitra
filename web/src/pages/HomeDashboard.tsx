export function HomeDashboard() {
  return (
    <div className="font-body text-on-surface flex flex-col antialiased max-w-5xl mx-auto w-full">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 p-4">
        <div className="glass-panel rounded-full px-4 py-3 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div 
              className="bg-surface-container rounded-full w-10 h-10 bg-center bg-cover border border-primary/20" 
              style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB8co6hnZPQzuwm57Rb3mWqL-pCFnYiHakTLmoOyjHBmEswzhIoy6Xh7oK2uuW8F43fhACN8VinpJ_VAQmAQdS9v40XEk3izpHwazq4BunWQjJQgl5yNii2A_ZuhfjxNjJZhC59d3foq88D5IdPb1qHwI9CoUVQxR_A3NXgSXgwTN_y3P_mQl4mnIegRDFvOHdZSrgn8ISDZaq8HrGq486-i1HCg9lQJ94TGAEJANDwzKJ0oybRM-yGoOYAygjx59gBWDtRRLzt7IFy')" }}
            >
            </div>
            <div>
              <h1 className="font-headline font-bold text-sm tracking-wide">Namaste, Raju <span className="text-primary">🌿</span></h1>
              <div className="flex items-center gap-1 text-xs text-on-surface-variant font-medium mt-0.5">
                <span className="material-symbols-outlined text-[14px]">location_on</span>
                Nashik, MH
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container text-on-surface border border-outline/50">
              <span className="material-symbols-outlined">dark_mode</span>
            </button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container text-on-surface relative border border-outline/50">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 flex flex-col gap-4">
        {/* Bento Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Tile A: Weather (Full Width) */}
          <div className="col-span-2 md:col-span-4 lg:col-span-2 glass-panel rounded-2xl p-6 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[60px] -mr-20 -mt-20"></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div>
                <h2 className="font-headline text-[80px] leading-none font-bold text-primary glow-text tracking-tighter">28°</h2>
                <p className="font-headline text-xl font-medium text-on-surface mt-2">Partly Cloudy</p>
              </div>
              <span className="material-symbols-outlined text-6xl text-primary drop-shadow-[0_0_15px_rgba(0,255,65,0.4)]">partly_cloudy_day</span>
            </div>
            
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide relative z-10 w-full">
              <div className="bg-surface-container/50 rounded-lg px-3 py-2 flex items-center gap-2 border border-primary/10 shrink-0">
                <span className="material-symbols-outlined text-sm text-primary">humidity_mid</span>
                <span className="font-label text-sm text-on-surface">65% Hum</span>
              </div>
              <div className="bg-surface-container/50 rounded-lg px-3 py-2 flex items-center gap-2 border border-primary/10 shrink-0">
                <span className="material-symbols-outlined text-sm text-primary">air</span>
                <span className="font-label text-sm text-on-surface">12 km/h</span>
              </div>
              <div className="bg-surface-container/50 rounded-lg px-3 py-2 flex items-center gap-2 border border-primary/10 shrink-0">
                <span className="material-symbols-outlined text-sm text-primary">water_drop</span>
                <span className="font-label text-sm text-on-surface">0mm Rain</span>
              </div>
            </div>
            
            <div className="flex justify-between items-end border-t border-primary/10 pt-4 relative z-10">
              <div className="flex justify-between w-full">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-on-surface-variant">Now</span>
                  <span className="material-symbols-outlined text-lg">cloud</span>
                  <span className="font-label text-sm">28°</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-on-surface-variant">12 PM</span>
                  <span className="material-symbols-outlined text-lg">sunny</span>
                  <span className="font-label text-sm">31°</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-on-surface-variant">3 PM</span>
                  <span className="material-symbols-outlined text-lg">sunny</span>
                  <span className="font-label text-sm">32°</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-on-surface-variant text-primary">6 PM</span>
                  <span className="material-symbols-outlined text-lg text-primary">rainy</span>
                  <span className="font-label text-sm text-primary">27°</span>
                </div>
              </div>
            </div>
            
            {/* Advisory Band */}
            <div className="mt-6 bg-primary/10 rounded-xl p-3 flex items-center gap-3 border border-primary/30 glow-box-primary relative z-10 w-full">
              <span className="material-symbols-outlined text-primary">check_circle</span>
              <span className="text-sm font-bold text-primary tracking-wide">Good day to irrigate</span>
            </div>
          </div>

          {/* Tile B: My Field (Left) */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1 glass-panel rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center border border-primary/10">
                <span className="material-symbols-outlined text-primary">grass</span>
              </div>
              <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Wheat</span>
            </div>
            
            <div className="relative w-24 h-24 mx-auto mb-4">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle className="text-white/5" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
                <circle 
                  className="text-primary drop-shadow-[0_0_8px_rgba(0,255,65,0.6)]" 
                  cx="50" cy="50" fill="transparent" r="40" 
                  stroke="currentColor" strokeDasharray="251" strokeDashoffset="150" strokeLinecap="round" strokeWidth="8">
                </circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-label text-xl font-bold text-on-surface glow-text">38%</span>
              </div>
            </div>
            
            <div className="text-center">
              <p className="font-label text-sm text-on-surface-variant mb-1">Day 34 of 90</p>
              <div className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/20">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                On Track
              </div>
            </div>
          </div>

          {/* Tile C: Market Price (Right) */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1 glass-panel rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center border border-primary/10">
                <span className="material-symbols-outlined text-primary">agriculture</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse mt-1"></div>
            </div>
            
            <div>
              <h3 className="font-headline text-sm font-medium text-on-surface-variant mb-1">Wheat (Lokwan)</h3>
              <p className="font-label text-2xl font-bold text-on-surface mb-2 tracking-tight">₹2,450</p>
              <p className="text-xs text-on-surface-variant mb-4">per quintal</p>
            </div>
            
            <div className="flex items-center gap-1 text-primary bg-primary/10 self-start px-2 py-1 rounded-md text-xs font-bold border border-primary/20">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              +2.4%
            </div>
          </div>

          {/* Tile D: Pest Alert (Full Width) */}
          <div className="col-span-2 md:col-span-4 glass-panel rounded-2xl p-5 border-l-4 border-l-error relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-error/10 to-transparent pointer-events-none"></div>
            <div className="flex items-center justify-between relative z-10 w-full">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-error/20 flex items-center justify-center border border-error/30 shrink-0 text-error">
                  <span className="material-symbols-outlined">bug_report</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-headline font-bold text-error glow-text-error">Pest Alert</h3>
                    <span className="bg-error/20 text-error text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase">High</span>
                  </div>
                  <p className="text-sm text-on-surface-variant font-medium">Fall Armyworm detected in region.</p>
                </div>
              </div>
              <button className="bg-surface-container/50 border border-error/30 text-error rounded-full w-10 h-10 flex items-center justify-center hover:bg-error/10 transition-colors shrink-0">
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>

        </div>

        {/* Market Snapshot Strip */}
        <div className="mt-2 text-left">
          <h3 className="font-headline font-bold text-on-surface mb-3 px-1 text-sm tracking-widest uppercase">Market Snapshot</h3>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
            
            <div className="glass-panel rounded-xl p-3 min-w-[140px] flex-shrink-0 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center border border-primary/10 shrink-0">
                <span className="material-symbols-outlined text-[16px] text-primary">spa</span>
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface">Soybean</p>
                <p className="font-label text-xs text-primary">₹4,200 <span className="text-[10px] text-on-surface-variant ml-1">↑</span></p>
              </div>
            </div>
            
            <div className="glass-panel rounded-xl p-3 min-w-[140px] flex-shrink-0 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center border border-primary/10 shrink-0">
                <span className="material-symbols-outlined text-[16px] text-primary">local_florist</span>
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface">Cotton</p>
                <p className="font-label text-xs text-primary">₹7,150 <span className="text-[10px] text-on-surface-variant ml-1">↑</span></p>
              </div>
            </div>
            
            <div className="glass-panel rounded-xl p-3 min-w-[140px] flex-shrink-0 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center border border-primary/10 shrink-0">
                <span className="material-symbols-outlined text-[16px] text-error">eco</span>
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface">Maize</p>
                <p className="font-label text-xs text-error">₹2,100 <span className="text-[10px] text-on-surface-variant ml-1">↓</span></p>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
