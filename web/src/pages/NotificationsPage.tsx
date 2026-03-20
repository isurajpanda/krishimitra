import { useState } from "react"
import { motion } from "framer-motion"

export function NotificationsPage() {
  const [activeFilter, setActiveFilter] = useState("All")
  const filters = ["All", "Weather", "Pest", "Market", "Schemes", "Advisory"]

  return (
    <div className="text-on-surface font-body min-h-screen pb-12 overflow-x-hidden antialiased">
      {/* Background Decoration */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]"></div>
      </div>

      {/* TopAppBar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center max-w-4xl w-[calc(100%-2rem)] mx-auto glass-panel rounded-full mt-4 px-6 py-3 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary shadow-[0_0_8px_rgba(0,255,65,1)]"></span>
          </span>
          <h1 className="font-headline font-bold text-lg tracking-tight text-primary glow-text">ALERTS</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-[10px] font-label tracking-widest text-on-surface-variant hover:text-primary transition-colors font-bold">MARK ALL READ</button>
          <div className="h-9 w-9 rounded-full bg-surface-container flex items-center justify-center cursor-pointer border border-outline/50 hover:bg-primary/10 transition-all">
            <span className="material-symbols-outlined text-on-surface text-lg">dark_mode</span>
          </div>
        </div>
      </header>

      {/* Content Canvas */}
      <main className="relative z-10 pt-28 px-4 max-w-4xl w-full mx-auto">
        {/* Filter Strip */}
        <div className="flex overflow-x-auto gap-3 pb-6 scrollbar-hide -mx-4 px-4 relative z-20">
          {filters.map((filter) => (
            <button 
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={
                activeFilter === filter 
                ? "bg-primary text-on-primary px-6 py-2 rounded-full font-label text-sm font-bold whitespace-nowrap shadow-[0_0_15px_rgba(0,255,65,0.4)] transition-all"
                : "bg-surface-container text-on-surface-variant px-5 py-2 rounded-full font-label text-sm font-medium whitespace-nowrap border border-outline/30 hover:bg-surface-bright transition-colors"
              }
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Bento Priority Alerts */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Critical Alert Tile */}
          <div className="col-span-2 glass-panel rounded-2xl p-6 border-l-4 border-l-error relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-error/5 blur-3xl pointer-events-none"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-error/10 rounded-xl flex items-center justify-center border border-error/30">
                  <span className="material-symbols-outlined text-error animate-pulse">warning</span>
                </div>
                <span className="font-label text-error text-[10px] tracking-widest uppercase font-bold">Critical Weather</span>
              </div>
              <span className="font-label text-on-surface-variant text-[10px]">Just Now</span>
            </div>
            <h2 className="font-headline font-bold text-xl text-on-surface mb-2 leading-tight relative z-10">Flash Flood Warning: Heavy precipitation expected in 2 hours.</h2>
            <p className="font-body text-on-surface-variant text-sm mb-6 relative z-10">Secure irrigation equipment and clear drainage channels in North-East blocks.</p>
            <div className="flex items-center justify-between relative z-10">
              <button className="bg-error/20 text-error border border-error/30 px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-transform active:scale-95 hover:bg-error/30">Emergency Action</button>
              <div className="w-1/3 h-1 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-error w-3/4 rounded-full shadow-[0_0_8px_rgba(255,59,48,0.5)]"></div>
              </div>
            </div>
          </div>

          {/* Scheme Spotlight */}
          <div className="col-span-2 glass-panel rounded-2xl p-6 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-primary text-lg">auto_awesome</span>
                  <span className="font-label text-primary text-[10px] tracking-widest uppercase font-bold">Spotlight</span>
                </div>
                <h3 className="font-headline font-bold text-lg text-on-surface">PM-Kisan 15th Installment Enrollment</h3>
                <p className="font-label text-primary text-xs mt-2 font-bold tracking-tight glow-text uppercase">18 DAYS LEFT</p>
              </div>
              <button className="mt-6 w-fit bg-primary text-on-primary px-6 py-2 rounded-full font-bold text-sm shadow-[0_0_15px_rgba(0,255,65,0.4)] transition-all active:scale-95 hover:scale-[1.02]">Apply Now</button>
            </div>
            <div className="absolute right-[-10px] bottom-[-10px] opacity-10 pointer-events-none">
              <span className="material-symbols-outlined text-[140px] text-primary rotate-12">description</span>
            </div>
          </div>

          {/* Market Flash Tile */}
          <div className="col-span-1 md:col-span-2 glass-panel rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <span className="font-label text-primary text-[10px] tracking-widest uppercase font-bold">Wheat Market</span>
              <div className="flex items-baseline gap-1 mt-1">
                <h4 className="font-headline font-bold text-2xl text-on-surface tracking-tighter">₹2,450</h4>
                <span className="font-label text-primary text-[10px] font-bold">+12%</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              <span className="text-[10px] font-label font-medium uppercase">Record High</span>
            </div>
          </div>

          {/* Advisory Quick Link */}
          <div className="col-span-1 md:col-span-2 glass-panel rounded-2xl p-5 flex flex-col justify-between">
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center mb-2 border border-primary/20">
              <span className="material-symbols-outlined text-primary">lightbulb</span>
            </div>
            <div>
              <h4 className="font-headline font-bold text-sm text-on-surface">AI Soil Insight</h4>
              <p className="font-body text-[11px] text-on-surface-variant mt-1 leading-tight">Nitrogen levels optimal for Rabi...</p>
            </div>
          </div>
        </motion.div>

        {/* Linear Feed */}
        <h3 className="font-label text-[10px] tracking-widest text-on-surface-variant uppercase font-bold mb-4 px-1">Recent Updates</h3>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1, delayChildren: 0.3 }
            }
          }}
        >
          {/* Update Card 1 */}
          <motion.div 
            variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
            className="glass-panel rounded-2xl p-4 flex gap-4 border-l-4 border-l-primary/40"
          >
            <div className="h-12 w-12 shrink-0 bg-surface-container rounded-xl flex items-center justify-center border border-primary/10">
              <span className="material-symbols-outlined text-primary">psychiatry</span>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <span className="font-label text-[10px] text-on-surface-variant font-medium">45 mins ago</span>
                <span className="bg-primary/10 text-primary text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-primary/20">Crops</span>
              </div>
              <h5 className="font-headline font-bold text-on-surface text-sm mt-1">Soya Bean pest control window opening soon.</h5>
              <div className="flex justify-between items-center mt-3">
                <button className="text-primary font-bold text-[11px] hover:underline uppercase tracking-wide">Read more</button>
                <span className="material-symbols-outlined text-on-surface-variant text-lg">more_horiz</span>
              </div>
            </div>
          </motion.div>

          {/* Update Card 2 */}
          <motion.div 
            variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
            className="glass-panel rounded-2xl p-4 flex gap-4 border-l-4 border-l-secondary/40"
          >
            <div className="h-12 w-12 shrink-0 bg-surface-container rounded-xl flex items-center justify-center border border-secondary/10">
              <span className="material-symbols-outlined text-secondary">storefront</span>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <span className="font-label text-[10px] text-on-surface-variant font-medium">3 hours ago</span>
                <span className="bg-secondary/10 text-secondary text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-secondary/20">Market</span>
              </div>
              <h5 className="font-headline font-bold text-on-surface text-sm mt-1">Mandi price fluctuation alert: Mustard seeds up by ₹40.</h5>
              <div className="flex justify-between items-center mt-3">
                <button className="text-secondary font-bold text-[11px] hover:underline uppercase tracking-wide">Read more</button>
                <span className="material-symbols-outlined text-on-surface-variant text-lg">more_horiz</span>
              </div>
            </div>
          </motion.div>

          {/* Update Card 3 */}
          <motion.div 
            variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
            className="glass-panel rounded-2xl p-4 flex gap-4 border-l-4 border-l-primary/20"
          >
            <div className="h-12 w-12 shrink-0 bg-surface-container rounded-xl flex items-center justify-center border border-outline/30">
              <span className="material-symbols-outlined text-on-surface-variant">info</span>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <span className="font-label text-[10px] text-on-surface-variant font-medium">Yesterday</span>
                <span className="bg-surface-container text-on-surface-variant text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-outline/30">System</span>
              </div>
              <h5 className="font-headline font-bold text-on-surface text-sm mt-1">Monthly harvest report is now available for download.</h5>
              <div className="flex justify-between items-center mt-3">
                <button className="text-on-surface-variant font-bold text-[11px] hover:underline uppercase tracking-wide">Read more</button>
                <span className="material-symbols-outlined text-on-surface-variant text-lg">more_horiz</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
