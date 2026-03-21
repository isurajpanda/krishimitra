import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TopAppBar } from "@/components/TopAppBar"
import { 
  Sparkles, 
  Sprout, 
  FlaskConical, 
  Bug, 
  Search, 
  Bell, 
  Award, 
  TrendingUp, 
  Droplets, 
  Banknote, 
  ChevronRight, 
  Loader2,
  X,
  PlusCircle
} from "lucide-react"

import { indianLocations } from "@/lib/indianLocations"
import { API_BASE_URL } from "@/config"

export function CropsPage() {
  const [activeTab, setActiveTab] = useState("Recommend")
  const [userCrops, setUserCrops] = useState<string[]>([])

  const [soilInfo, setSoilInfo] = useState("")
  const [season, setSeason] = useState("Kharif")
  const [locState, setLocState] = useState(localStorage.getItem("userState") || "Maharashtra")
  const [district, setDistrict] = useState(localStorage.getItem("userDistrict") || "Pune")
  
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])

  useEffect(() => {
    const crops = (localStorage.getItem("userCrops") || "").split(", ").filter(Boolean)
    setUserCrops(crops)
  }, [])

  const handleRecommend = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`${API_BASE_URL}/crop-recommendation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ season, state: locState, district })
      })
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      if (data && data.recommendations) {
        setResults(data.recommendations)
        if (data.soilInfo) setSoilInfo(data.soilInfo)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveCrop = async (crop: string) => {
    const updated = userCrops.filter(c => c !== crop)
    setUserCrops(updated)
    localStorage.setItem("userCrops", updated.join(", "))
    // Save to DB
    const userId = localStorage.getItem("userId")
    if (userId) {
      try {
        await fetch(`${API_BASE_URL}/auth/profile/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ primaryCrops: updated })
        })
      } catch (e) { console.error(e) }
    }
  }

  const handleAddCropFromResult = async (cropName: string) => {
    if (userCrops.includes(cropName)) return
    const updated = [...userCrops, cropName]
    setUserCrops(updated)
    localStorage.setItem("userCrops", updated.join(", "))
    // Save to DB
    const userId = localStorage.getItem("userId")
    if (userId) {
      try {
        await fetch(`${API_BASE_URL}/auth/profile/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ primaryCrops: updated })
        })
      } catch (e) { console.error(e) }
    }
  }

  const tabs = [
    { id: "Recommend", icon: Sparkles, label: "Recommend" },
    { id: "My Crops", icon: Sprout, label: "My Crops" },
    { id: "Fertilizer", icon: FlaskConical, label: "Fertilizer" },
    { id: "Pests", icon: Bug, label: "Pests" },
  ]

  return (
    <div className="bg-transparent text-on-surface font-body selection:bg-primary/30 min-h-[100dvh] antialiased">
      <TopAppBar 
        actions={
          <>
            <button className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-on-surface-variant bg-surface-container rounded-full border border-outline/30 hover:bg-on-surface/5 transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <button className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-on-surface-variant bg-surface-container rounded-full border border-outline/30 relative hover:bg-on-surface/5 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></span>
            </button>
          </>
        }
      />

      <main className="pt-24 px-4 max-w-3xl w-full mx-auto pb-12">
        {/* Tab Bar */}
        <nav className="glass-panel rounded-2xl p-1 flex items-center justify-between mb-8 relative">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-1 rounded-xl flex flex-col items-center gap-1 transition-all z-10 ${
                  isActive 
                    ? "text-primary border border-primary/20" 
                    : "text-on-surface-variant hover:bg-on-surface/5"
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
                <Icon 
                  className="w-5 h-5 relative z-10" 
                  fill={isActive ? "currentColor" : "none"} 
                />
                <span className="text-[10px] font-label font-bold uppercase tracking-widest relative z-10">{tab.label}</span>
              </button>
            )
          })}
        </nav>

        <AnimatePresence mode="popLayout">
          {/* =============== RECOMMEND TAB =============== */}
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
                      <div className="flex gap-4 flex-col md:flex-row">
                        <div className="flex-1 bg-surface-container-highest rounded-2xl p-4 flex flex-col gap-1">
                          <label className="text-[10px] font-label text-on-surface-variant uppercase font-bold tracking-wider">Season</label>
                          <select className="bg-transparent border-none p-0 text-on-surface font-medium appearance-none outline-none w-full" value={season} onChange={e => setSeason(e.target.value)}>
                            <option className="bg-surface text-white">Kharif</option>
                            <option className="bg-surface text-white">Rabi</option>
                            <option className="bg-surface text-white">Zaid</option>
                            <option className="bg-surface text-white">Annual</option>
                          </select>
                        </div>
                        
                        <div className="flex-[2] flex gap-4">
                          <div className="flex-1 bg-surface-container-highest rounded-2xl p-4 flex flex-col gap-1">
                            <label className="text-[10px] font-label text-on-surface-variant uppercase font-bold tracking-wider">State</label>
                            <select className="bg-transparent border-none p-0 text-on-surface font-medium appearance-none outline-none w-full" value={locState} onChange={e => { setLocState(e.target.value); setDistrict(indianLocations[e.target.value][0]); }}>
                              {Object.keys(indianLocations).map(s => <option key={s} className="bg-surface text-white" value={s}>{s}</option>)}
                            </select>
                          </div>
                          
                          <div className="flex-1 bg-surface-container-highest rounded-2xl p-4 flex flex-col gap-1">
                            <label className="text-[10px] font-label text-on-surface-variant uppercase font-bold tracking-wider">District</label>
                            <select className="bg-transparent border-none p-0 text-on-surface font-medium appearance-none outline-none w-full" value={district} onChange={e => setDistrict(e.target.value)}>
                              {(indianLocations[locState] || []).map(d => <option key={d} className="bg-surface text-white" value={d}>{d}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <button 
                         onClick={handleRecommend}
                         disabled={isLoading}
                         className="w-full py-4 bg-primary text-on-primary font-bold rounded-full flex items-center justify-center gap-2 glow-box-primary active:scale-95 transition-transform mt-2 hover:scale-[1.02] disabled:opacity-75 disabled:active:scale-100 disabled:hover:scale-100"
                      >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 fill-current" />}
                        {isLoading ? "Analyzing Data..." : "Find Best Crops"}
                      </button>
                    </div>
                </div>
              </section>

              {/* Results Grid */}
              {results.length > 0 && (
                <section className="transition-all space-y-6" style={{ opacity: isLoading ? 0.5 : 1 }}>
                  {soilInfo && (
                    <div className="glass-panel p-4 rounded-2xl flex items-center gap-3 border-l-[4px] border-tertiary">
                      <Sprout className="text-tertiary w-6 h-6 shrink-0" />
                      <p className="text-sm font-medium text-on-surface-variant">
                        <span className="text-on-surface font-bold">Region Insight: </span>
                        {soilInfo}
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {results.map((crop, idx) => (
                      <div key={`crop-${idx}`} className="glass-panel rounded-3xl overflow-hidden relative flex flex-col group border border-outline/10 hover:border-primary/30 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10">
                        <div className="h-44 w-full relative bg-surface-container-highest overflow-hidden shrink-0">
                          <img 
                            src={`https://loremflickr.com/400/300/${encodeURIComponent(crop.cropName)},farm,crop`} 
                            alt={crop.cropName} 
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent opacity-100"></div>
                          
                          <div className="absolute top-4 left-4 flex gap-2">
                            <div className="bg-primary/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] text-on-primary font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg">
                              <Award className="w-3.5 h-3.5" /> Rank #{crop.rank || idx + 1}
                            </div>
                            <div className="bg-surface/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] text-primary font-bold shadow-lg uppercase tracking-wider">
                              {crop.matchPercentage || 90}% Match
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-6 flex-1 flex flex-col relative z-10 -mt-12 pt-0">
                          <div className="flex justify-between items-end mb-4">
                            <h3 className="font-headline text-3xl font-bold text-on-surface drop-shadow-md glow-text leading-none">{crop.cropName}</h3>
                            {!userCrops.includes(crop.cropName) ? (
                              <button 
                                onClick={() => handleAddCropFromResult(crop.cropName)} 
                                className="w-10 h-10 shrink-0 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all border border-primary/30 shadow-lg hover:rotate-90"
                                title="Add to my crops"
                              >
                                <PlusCircle className="w-5 h-5" />
                              </button>
                            ) : (
                              <div className="w-10 h-10 shrink-0 rounded-full bg-surface-container border border-outline/30 flex items-center justify-center text-primary shadow-inner">
                                <ChevronRight className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mb-4">
                             {crop.badge && <span className="text-[9px] uppercase font-bold px-2.5 py-1 rounded bg-tertiary/20 text-tertiary border border-tertiary/20 tracking-wider shadow-sm">{crop.badge}</span>}
                             {crop.waterNeed && <span className="text-[9px] uppercase font-bold px-2.5 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/20 tracking-wider flex items-center shadow-sm"><Droplets className="w-2.5 h-2.5 inline mr-1" />{crop.waterNeed} Water</span>}
                          </div>
                          
                          <p className="text-sm text-on-surface-variant font-medium mb-5 flex-1 line-clamp-3 leading-relaxed">
                            {crop.reason}
                          </p>
                          
                          <div className="grid grid-cols-2 gap-3 mb-5">
                             <div className="bg-surface-container-low rounded-xl p-3 border border-outline/10 shadow-sm">
                               <div className="text-[9px] text-on-surface-variant uppercase tracking-widest font-bold mb-1 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5"/> Expected Yield</div>
                               <div className="text-sm font-bold text-on-surface truncate">{crop.expectedYield || "Avg Yield"}</div>
                             </div>
                             <div className="bg-primary/5 rounded-xl p-3 border border-primary/20 shadow-sm glow-box-primary/10">
                               <div className="text-[9px] text-primary uppercase tracking-widest font-bold mb-1 flex items-center gap-1"><Banknote className="w-3.5 h-3.5"/> Potential Profit</div>
                               <div className="text-sm font-bold text-primary truncate">{crop.potentialProfit || "High Return"}</div>
                             </div>
                             <div className="bg-surface-container-low rounded-xl p-3 border border-outline/10 col-span-2 flex justify-between items-center shadow-sm">
                               <div>
                                 <div className="text-[9px] text-on-surface-variant uppercase tracking-widest font-bold mb-1 flex items-center gap-1"><Sprout className="w-3.5 h-3.5"/> Duration</div>
                                 <div className="text-sm font-bold text-on-surface">{crop.growingDuration || "120-150 days"}</div>
                               </div>
                               <div className="text-right">
                                 <div className="text-[9px] text-on-surface-variant uppercase tracking-widest font-bold mb-1 flex justify-end gap-1">Optimal Planting</div>
                                 <div className="text-sm font-bold text-on-surface">{crop.optimalPlanting || "Within 15 days"}</div>
                               </div>
                             </div>
                          </div>
                          
                          {crop.tips && (
                            <div className="bg-surface-container-highest p-4 rounded-xl border-l-[3px] border-secondary text-xs font-medium text-on-surface-variant shadow-sm flex gap-2">
                              <Sparkles className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                              <p><span className="text-secondary font-bold mr-1">Pro Tip:</span>{crop.tips}</p>
                            </div>
                          )}
                          
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </motion.div>
          )}

          {/* =============== MY CROPS TAB =============== */}
          {activeTab === "My Crops" && (
            <motion.div 
              key="MyCrops"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-6">
                  <span className="w-1.5 h-6 bg-primary rounded-full glow-box-primary"></span>
                  <h2 className="font-headline text-xl text-on-surface">Your Active Crops</h2>
                  <span className="ml-auto text-xs text-on-surface-variant">{userCrops.length} crop{userCrops.length !== 1 ? "s" : ""}</span>
                </div>

                {userCrops.length === 0 ? (
                  <div className="glass-panel rounded-[28px] p-12 text-center">
                    <Sprout className="w-16 h-16 text-primary/20 mx-auto mb-4" />
                    <h3 className="font-headline text-xl text-on-surface mb-2">No Crops Yet</h3>
                    <p className="text-on-surface-variant text-sm mb-6">Use the Recommend tab to find the best crops for your farm, or add them from your Profile.</p>
                    <button
                      onClick={() => setActiveTab("Recommend")}
                      className="px-6 py-3 bg-primary text-on-primary rounded-full font-bold flex items-center justify-center gap-2 mx-auto hover:scale-105 transition-transform"
                    >
                      <Sparkles className="w-4 h-4" />
                      Get Recommendations
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userCrops.map((crop, idx) => (
                      <motion.div 
                        key={crop}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="glass-panel rounded-[28px] p-5 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Sprout className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-headline font-bold text-on-surface">{crop}</h4>
                            <p className="text-xs text-on-surface-variant">Active Crop</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="px-2.5 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(0,255,65,0.2)]">Growing</div>
                          <button 
                            onClick={() => handleRemoveCrop(crop)}
                            className="text-on-surface-variant hover:text-error transition-colors p-1"
                            title="Remove crop"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* =============== COMING SOON TABS =============== */}
          {(activeTab === "Fertilizer" || activeTab === "Pests") && (
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="mt-12 text-center"
            >
              <div className="glass-panel rounded-[28px] p-12 max-w-md mx-auto">
                <div className="flex justify-center mb-6">
                  {(() => {
                    const Icon = tabs.find(t => t.id === activeTab)?.icon || Sparkles
                    return <Icon className="w-20 h-20 text-primary/20" />
                  })()}
                </div>
                <h2 className="font-headline text-2xl text-on-surface mb-2">Coming Soon</h2>
                <p className="text-on-surface-variant mt-2 text-sm">
                  {activeTab === "Fertilizer" 
                    ? "AI-powered fertilizer recommendations based on your soil and crops will be available soon."
                    : "Real-time pest detection and prevention advisories are being developed."
                  }
                </p>
                <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  <span className="text-xs text-primary font-bold uppercase tracking-widest">In Development</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
