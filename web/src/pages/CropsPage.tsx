import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export function CropsPage() {
  const [activeTab, setActiveTab] = useState("Recommend")

  const tabs = [
    { id: "Recommend", icon: "auto_awesome", label: "Recommend" },
    { id: "My Crops", icon: "potted_plant", label: "My Crops" },
    { id: "Fertilizer", icon: "science", label: "Fertilizer" },
    { id: "Pests", icon: "pest_control", label: "Pests" },
  ]

  return (
    <div className="bg-background text-on-surface font-body selection:bg-primary/30 min-h-[100dvh] antialiased">
      {/* Top Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center max-w-lg mx-auto rounded-full mt-4 px-4 py-2 glass-panel shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-high border border-primary/20">
            <img alt="Farmer Profile Picture" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB8co6hnZPQzuwm57Rb3mWqL-pCFnYiHakTLmoOyjHBmEswzhIoy6Xh7oK2uuW8F43fhACN8VinpJ_VAQmAQdS9v40XEk3izpHwazq4BunWQjJQgl5yNii2A_ZuhfjxNjJZhC59d3foq88D5IdPb1qHwI9CoUVQxR_A3NXgSXgwTN_y3P_mQl4mnIegRDFvOHdZSrgn8ISDZaq8HrGq486-i1HCg9lQJ94TGAEJANDwzKJ0oybRM-yGoOYAygjx59gBWDtRRLzt7IFy" />
          </div>
          <div>
            <h1 className="font-headline font-bold text-sm tracking-tight text-on-surface">Namaste, Raju <span className="text-primary">🌿</span></h1>
            <div className="flex items-center gap-1 text-[10px] text-on-surface-variant font-medium">
              <span className="material-symbols-outlined text-[12px]">location_on</span>
              Nashik, MH
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 flex items-center justify-center text-on-surface-variant bg-surface-container rounded-full border border-outline/30">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </button>
          <button className="w-9 h-9 flex items-center justify-center text-on-surface-variant bg-surface-container rounded-full border border-outline/30 relative">
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full"></span>
          </button>
        </div>
      </header>

      <main className="pt-24 px-4 max-w-lg mx-auto pb-12">
        {/* Tab Bar */}
        <nav className="glass-panel rounded-2xl p-1 flex items-center justify-between mb-8 relative">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-1 rounded-xl flex flex-col items-center gap-1 transition-all z-10 ${
                  isActive 
                    ? "text-primary border border-primary/20" 
                    : "text-on-surface-variant hover:bg-white/5"
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="crops-active-tab"
                    className="absolute inset-y-1 bg-primary/10 rounded-xl"
                    style={{ width: "24%", left: `${tabs.findIndex(t => t.id === tab.id) * 25 + 0.5}%` }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="material-symbols-outlined relative z-10" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                  {tab.icon}
                </span>
                <span className="text-[10px] font-label font-bold uppercase tracking-widest relative z-10">{tab.label}</span>
              </button>
            )
          })}
        </nav>

        <AnimatePresence mode="popLayout">
          {activeTab === "Recommend" && (
            <motion.div 
              key="Recommend"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              {/* Search & Input Bento Cell */}
              <section className="mb-8">
                <div className="glass-panel rounded-[28px] p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <span className="w-1.5 h-6 bg-primary rounded-full glow-box-primary"></span>
                    <h2 className="font-headline text-xl text-on-surface">Crop Intelligence Hub</h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-surface-container-highest rounded-2xl p-4 flex flex-col gap-1 border-l-4 border-primary/40">
                      <label className="text-[10px] font-label text-primary uppercase font-bold tracking-wider">Soil Composition</label>
                      <input className="bg-transparent border-none p-0 text-on-surface focus:ring-0 font-medium placeholder:text-on-surface/40 outline-none w-full" type="text" defaultValue="Loamy-Clay (Red)"/>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex-1 bg-surface-container-highest rounded-2xl p-4 flex flex-col gap-1">
                        <label className="text-[10px] font-label text-on-surface-variant uppercase font-bold tracking-wider">Season</label>
                        <select className="bg-transparent border-none p-0 text-on-surface font-medium appearance-none outline-none w-full">
                          <option className="bg-surface text-white">Kharif</option>
                          <option className="bg-surface text-white">Rabi</option>
                          <option className="bg-surface text-white">Zaid</option>
                        </select>
                      </div>
                      
                      <div className="flex-1 bg-surface-container-highest rounded-2xl p-4 flex flex-col gap-1">
                        <label className="text-[10px] font-label text-on-surface-variant uppercase font-bold tracking-wider">District</label>
                        <input className="bg-transparent border-none p-0 text-on-surface focus:ring-0 font-medium outline-none w-full" type="text" defaultValue="Pune, MH"/>
                      </div>
                    </div>
                    
                    <button className="w-full py-4 bg-primary text-on-primary font-bold rounded-full flex items-center justify-center gap-2 glow-box-primary active:scale-95 transition-transform mt-2 hover:scale-[1.02]">
                      <span className="material-symbols-outlined font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>search_spark</span>
                      Find Best Crops
                    </button>
                  </div>
                </div>
              </section>

              {/* Results Bento Grid */}
              <section className="grid grid-cols-2 gap-4">
                {/* Hero Match Tile (Rank 1) */}
                <div className="col-span-2 glass-panel rounded-[28px] p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4">
                    <div className="bg-primary/20 backdrop-blur-md px-3 py-1 rounded-full border border-primary/30 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                      <span className="font-label text-[12px] font-bold text-primary">RANK #1</span>
                    </div>
                  </div>
                  
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-headline text-3xl mb-1 text-on-surface">Basmati Rice</h3>
                      <p className="text-primary font-medium text-sm flex items-center gap-1 glow-text">
                        <span className="material-symbols-outlined text-sm">trending_up</span>
                        Market demand is high
                      </p>
                    </div>
                    
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle className="text-white/5" cx="50" cy="50" fill="transparent" r="40" strokeWidth="6"></circle>
                        <circle 
                          className="text-primary drop-shadow-[0_0_8px_rgba(0,255,65,0.6)]" 
                          cx="50" cy="50" fill="transparent" r="40" 
                          stroke="currentColor" strokeDasharray="251.2" strokeDashoffset="15" strokeLinecap="round" strokeWidth="6">
                        </circle>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="font-label text-xl font-bold glow-text">94%</span>
                        <span className="text-[8px] uppercase font-bold opacity-60">Match</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex gap-3">
                    <div className="flex-1 bg-surface-container-low rounded-2xl p-3 border border-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-tertiary text-sm">water_drop</span>
                        <span className="font-label text-[10px] text-on-surface-variant uppercase font-bold">Water Need</span>
                      </div>
                      <p className="text-sm font-bold">High (Seasonal)</p>
                    </div>
                    
                    <div className="flex-1 bg-surface-container-low rounded-2xl p-3 border border-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-secondary text-sm">payments</span>
                        <span className="font-label text-[10px] text-on-surface-variant uppercase font-bold">Potential Profit</span>
                      </div>
                      <p className="text-sm font-bold">₹42k/Acre</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs text-on-surface-variant font-medium">Optimal Planting: 15-20 June</span>
                    <button className="text-primary flex items-center gap-1 text-sm font-bold">
                      Details <span className="material-symbols-outlined text-sm">expand_more</span>
                    </button>
                  </div>
                </div>

                {/* Tile 2 */}
                <div className="glass-panel rounded-[28px] p-4 flex flex-col justify-between aspect-square relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-20 h-20 bg-primary/5 rounded-full blur-2xl"></div>
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">#2 Rank</span>
                      <div className="bg-primary/20 px-2 py-0.5 rounded-full text-[9px] text-primary font-bold uppercase">High Yield</div>
                    </div>
                    <h4 className="font-headline text-lg leading-tight">Sugarcane<br/>(Co 86032)</h4>
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="font-label text-xl font-bold glow-text">88%</div>
                    <span className="material-symbols-outlined text-primary">arrow_forward_ios</span>
                  </div>
                </div>

                {/* Tile 3 */}
                <div className="glass-panel rounded-[28px] p-4 flex flex-col justify-between aspect-square relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-20 h-20 bg-tertiary/5 rounded-full blur-2xl"></div>
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">#3 Rank</span>
                    </div>
                    <h4 className="font-headline text-lg leading-tight">Soybean<br/>(JS 335)</h4>
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="font-label text-xl font-bold glow-text">81%</div>
                    <span className="material-symbols-outlined text-primary">arrow_forward_ios</span>
                  </div>
                </div>
              </section>

              {/* Fertilizer Intelligence (Teaser) */}
              <section className="mt-8 mb-8">
                <div className="glass-panel rounded-[28px] p-6 border-l-4 border-primary/40">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="font-headline text-xl text-on-surface">Fertilizer Health</h2>
                      <p className="text-xs text-on-surface-variant">Soil NPK Ratios for Basmati Rice</p>
                    </div>
                    <span className="material-symbols-outlined text-primary glow-text">science</span>
                  </div>
                  
                  <div className="flex justify-around items-end h-32 gap-4">
                    <div className="flex flex-col items-center flex-1 gap-2">
                      <div className="w-full bg-surface-container-high rounded-full relative overflow-hidden h-24 border border-white/5">
                        <div className="absolute bottom-0 w-full bg-primary/30 h-[65%] shadow-[0_0_10px_rgba(0,255,65,0.3)]"></div>
                      </div>
                      <span className="font-label font-bold text-primary">N</span>
                      <span className="text-[10px] font-medium text-on-surface-variant">65%</span>
                    </div>
                    <div className="flex flex-col items-center flex-1 gap-2">
                      <div className="w-full bg-surface-container-high rounded-full relative overflow-hidden h-24 border border-white/5">
                        <div className="absolute bottom-0 w-full bg-secondary/30 h-[40%]"></div>
                      </div>
                      <span className="font-label font-bold text-secondary">P</span>
                      <span className="text-[10px] font-medium text-on-surface-variant">40%</span>
                    </div>
                    <div className="flex flex-col items-center flex-1 gap-2">
                      <div className="w-full bg-surface-container-high rounded-full relative overflow-hidden h-24 border border-white/5">
                        <div className="absolute bottom-0 w-full bg-tertiary/30 h-[80%] shadow-[0_0_10px_rgba(128,255,180,0.3)]"></div>
                      </div>
                      <span className="font-label font-bold text-tertiary">K</span>
                      <span className="text-[10px] font-medium text-on-surface-variant">80%</span>
                    </div>
                  </div>
                  
                  <div className="mt-8 space-y-4">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-primary glow-box-primary"></div>
                        <div className="w-px h-full bg-primary/20 my-1"></div>
                      </div>
                      <div className="pb-4">
                        <h5 className="text-sm font-bold text-primary">Apply Urea (45-0-0)</h5>
                        <p className="text-xs text-on-surface-variant font-medium">Dosage: 50kg/acre • 2 days from now</p>
                      </div>
                    </div>
                    <div className="flex gap-4 opacity-40">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-on-surface-variant"></div>
                        <div className="w-px h-full bg-outline-variant my-1"></div>
                      </div>
                      <div className="pb-4">
                        <h5 className="text-sm font-bold">DAP Application</h5>
                        <p className="text-xs font-medium">Completed 12 days ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Pests & Diseases (Teaser) */}
              <section className="mb-8">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h2 className="font-headline text-xl text-on-surface">Local Pest Alerts</h2>
                  <button className="text-primary text-sm font-bold glow-text">View all</button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-panel rounded-[28px] p-4 border border-error/30">
                    <div className="w-full h-24 bg-surface-container-highest rounded-2xl mb-3 overflow-hidden border border-white/5 relative">
                      <img alt="Yellow Stem Borer" className="w-full h-full object-cover grayscale brightness-125 contrast-125 absolute inset-0" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDdyLxgEd7FKIl3n8r6DvFnC9D8UixIFidcQ_3cVflOo-D2VcMm88OyVC5Mmq54chzwp4y_YozP9OTn3r7T3t-zQxuhXnQcJin19keulJrUe-nGw_cXA9jXIBAMap7ynS-vt67KqXHQDJt83WPcG5h62lVxwfCRU9aIOw0HYbRzwQhXWiNgE5RgU-uI1DljnQBSkl0kxqjaahlSWzP1qJ9vibE19-p8Q3x7OXjXh7u80ARnIxm6m6Y99PbDyivaQCq_G3IpIWD2IQrM" />
                    </div>
                    <span className="bg-error/20 text-error text-[9px] px-2 py-0.5 rounded-full font-bold uppercase mb-1 inline-block border border-error/30">High Risk</span>
                    <h5 className="font-headline text-sm">Yellow Stem Borer</h5>
                    <p className="text-[10px] text-on-surface-variant mt-1 font-medium">Reported in 12 farms nearby</p>
                  </div>
                  
                  <div className="glass-panel rounded-[28px] p-4 border border-primary/20">
                    <div className="w-full h-24 bg-surface-container-highest rounded-2xl mb-3 overflow-hidden border border-white/5 relative">
                      <img alt="Blight Disease" className="w-full h-full object-cover absolute inset-0" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA434yi0pX8fA7i_EeTsr0uubFkih6qhY2BUYQBKqQpZuWr-XXwgxFCeY1rzmgWjJDWeg4OplKTXeNjwtx0yKk4T6E9TrngN8dlRZ18_nOUJS_GTlqSbliZWIQ3Nsp0Ytcu-bJjsMLVEW8mtCrAWN1LR7gRq1QytnbpNsyo9plYDlmsEjwILe3rm-C0svFZ_r77cGevDTj8sDj-QXqihTg7V5vvK1qp0hXNX5l_9TMCot22-PPiEbiB_pnD6cgcBLyWU8B1boZ0n0KF" />
                    </div>
                    <span className="bg-primary/20 text-primary text-[9px] px-2 py-0.5 rounded-full font-bold uppercase mb-1 inline-block border border-primary/30">Preventive</span>
                    <h5 className="font-headline text-sm">Leaf Blight</h5>
                    <p className="text-[10px] text-on-surface-variant mt-1 font-medium">Optimal weather for fungus</p>
                  </div>
                  
                  <button className="col-span-2 glass-panel rounded-2xl p-4 flex items-center justify-center gap-2 border-dashed border-primary/40 text-primary font-bold active:scale-[0.98] transition-all hover:bg-primary/5">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add_a_photo</span>
                    Report a Pest
                  </button>
                </div>
              </section>
            </motion.div>
          )}

          {/* Stubs for other tabs to show animation */}
          {activeTab !== "Recommend" && (
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="mt-12 text-center"
            >
              <span className="material-symbols-outlined text-6xl text-primary/30 mb-4">{tabs.find(t=>t.id === activeTab)?.icon}</span>
              <h2 className="font-headline text-2xl text-on-surface">Coming Soon</h2>
              <p className="text-on-surface-variant mt-2">{activeTab} intelligence is being processed...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
