import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { API_BASE_URL } from "@/config"
import { motion } from "framer-motion"
import { TopAppBar } from "@/components/TopAppBar"
import { useTheme } from "@/hooks/useTheme"
import { 
  Sun, Moon, MapPin, Tractor, Sprout, PlusCircle, 
  Check, X, Pencil, Loader2, User, Mail, LogOut
} from "lucide-react"

import { indianLocations } from "@/lib/indianLocations"

interface ProfileData {
  name: string;
  location: string;
  farmType: string;
  primaryCrops: string[];
  preferredLanguage: string;
  state: string;
  district: string;
  units: string;
  weatherAlerts: boolean;
  pestWarnings: boolean;
  marketTrends: boolean;
}

export function ProfilePage() {
  const { toggleTheme, isDark } = useTheme()
  const navigate = useNavigate()
  
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSavingPref, setIsSavingPref] = useState(false)
  const [newCrop, setNewCrop] = useState("")

  const [formData, setFormData] = useState<ProfileData>({
    name: localStorage.getItem("userName") || "",
    location: localStorage.getItem("userLocation") || "",
    farmType: localStorage.getItem("userFarmType") || "Small Scale",
    primaryCrops: (localStorage.getItem("userCrops") || "").split(", ").filter(Boolean),
    preferredLanguage: localStorage.getItem("userLanguage") || "English",
    state: localStorage.getItem("userState") || "Maharashtra",
    district: localStorage.getItem("userDistrict") || "Pune",
    units: localStorage.getItem("userUnits") || "Metric",
    weatherAlerts: localStorage.getItem("userWeatherAlerts") !== "false",
    pestWarnings: localStorage.getItem("userPestWarnings") !== "false",
    marketTrends: localStorage.getItem("userMarketTrends") === "true"
  })

  useEffect(() => {
    const fetchProfile = async () => {
      const userId = localStorage.getItem("userId")
      if (!userId) return
      try {
         const res = await fetch(`${API_BASE_URL}/auth/profile/${userId}`)
         if (res.ok) {
           const data = await res.json()
           const updated: ProfileData = {
              name: data.name || "",
              location: data.location || "",
              farmType: data.farm_type || "Small Scale",
              primaryCrops: data.primary_crops || [],
              preferredLanguage: data.preferred_language || "English",
              state: data.state || "Maharashtra",
              district: data.district || "Pune",
              units: data.units || "Metric",
              weatherAlerts: data.weather_alerts !== false,
              pestWarnings: data.pest_warnings !== false,
              marketTrends: data.market_trends === true
           }
           setFormData(updated)
           // Sync to localStorage
           localStorage.setItem("userName", updated.name)
           localStorage.setItem("userLocation", updated.location)
           localStorage.setItem("userFarmType", updated.farmType)
           localStorage.setItem("userCrops", updated.primaryCrops.join(", "))
           localStorage.setItem("userLanguage", updated.preferredLanguage)
           localStorage.setItem("userState", updated.state)
           localStorage.setItem("userDistrict", updated.district)
           localStorage.setItem("userUnits", updated.units)
           localStorage.setItem("userWeatherAlerts", String(updated.weatherAlerts))
           localStorage.setItem("userPestWarnings", String(updated.pestWarnings))
           localStorage.setItem("userMarketTrends", String(updated.marketTrends))
         }
      } catch (e) { console.error(e) }
    }
    fetchProfile()
  }, [])
  
  const handleLogout = () => {
    localStorage.clear()
    navigate("/auth")
  }

  const saveToServer = async (updates: Partial<Record<string, any>>) => {
    const userId = localStorage.getItem("userId")
    try {
      const res = await fetch(`${API_BASE_URL}/auth/profile/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      return res.ok
    } catch (err) {
      console.error(err)
      return false
    }
  }

  const handleSave = async () => {
    const userId = localStorage.getItem("userId")
    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/auth/profile/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: formData.name, 
          location: formData.location,
          state: formData.state,
          district: formData.district,
          farmType: formData.farmType,
          primaryCrops: formData.primaryCrops
        }),
      })
      
      if (res.ok) {
        localStorage.setItem("userName", formData.name)
        localStorage.setItem("userLocation", formData.location)
        localStorage.setItem("userState", formData.state)
        localStorage.setItem("userDistrict", formData.district)
        localStorage.setItem("userFarmType", formData.farmType)
        localStorage.setItem("userCrops", formData.primaryCrops.join(", "))
        setIsEditing(false)
        window.dispatchEvent(new Event('storage')) 
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTogglePref = async (key: "weatherAlerts" | "pestWarnings" | "marketTrends") => {
    const newValue = !formData[key]
    setFormData(prev => ({ ...prev, [key]: newValue }))
    setIsSavingPref(true)
    
    const serverKey = key === "weatherAlerts" ? "weatherAlerts" : key === "pestWarnings" ? "pestWarnings" : "marketTrends"
    const localKey = key === "weatherAlerts" ? "userWeatherAlerts" : key === "pestWarnings" ? "userPestWarnings" : "userMarketTrends"
    
    localStorage.setItem(localKey, String(newValue))
    await saveToServer({ [serverKey]: newValue })
    setIsSavingPref(false)
  }

  const handleLanguageChange = async (lang: string) => {
    setFormData(prev => ({ ...prev, preferredLanguage: lang }))
    localStorage.setItem("userLanguage", lang)
    await saveToServer({ preferredLanguage: lang })
  }

  const handleUnitsChange = async (newUnits: string) => {
    setFormData(prev => ({ ...prev, units: newUnits }))
    localStorage.setItem("userUnits", newUnits)
    await saveToServer({ units: newUnits })
  }

  const handleAddCrop = async () => {
    if (!newCrop.trim()) return
    const updated = [...formData.primaryCrops, newCrop.trim()]
    setFormData(prev => ({ ...prev, primaryCrops: updated }))
    setNewCrop("")
    localStorage.setItem("userCrops", updated.join(", "))
    await saveToServer({ primaryCrops: updated })
  }

  const handleRemoveCrop = async (crop: string) => {
    const updated = formData.primaryCrops.filter(c => c !== crop)
    setFormData(prev => ({ ...prev, primaryCrops: updated }))
    localStorage.setItem("userCrops", updated.join(", "))
    await saveToServer({ primaryCrops: updated })
  }

  const userName = formData.name || "Farmer"
  const userEmail = localStorage.getItem("userEmail") || ""
  const languages = ["English", "हिंदी", "ਪੰਜਾਬੀ", "தமிழ்", "తెలుగు", "ಕನ್ನಡ", "ଓଡ଼ିଆ", "বাংলা", "মराठी"]
  
  return (
    <div className="bg-transparent text-on-surface font-body selection:bg-primary selection:text-on-primary antialiased min-h-screen pb-12 overflow-x-hidden">
      <TopAppBar />
      <main className="relative z-10 max-w-4xl w-full mx-auto px-4 pt-24 pb-8 flex flex-col md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Profile Hero */}
        <motion.section 
          className="col-span-full glass-panel rounded-3xl p-8 group relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -mr-32 -mt-32 transition-transform group-hover:scale-110 duration-700"></div>
          
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"></div>
              <div className="relative w-32 h-32 rounded-full p-1 bg-gradient-to-b from-primary to-transparent shadow-2xl">
                <div className="w-full h-full rounded-full bg-surface-container-highest flex items-center justify-center border-4 border-background overflow-hidden text-primary">
                  <User className="w-16 h-16" />
                </div>
              </div>
            </div>

            <div className="text-center md:text-left flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-primary font-bold">Name</label>
                    <input 
                      className="bg-surface-container border border-primary/30 rounded-xl px-4 py-2 text-2xl font-bold w-full text-on-surface"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-primary font-bold">State</label>
                      <select 
                        className="bg-surface-container border border-primary/30 rounded-xl px-4 py-2 text-sm w-full text-on-surface"
                        value={formData.state}
                        onChange={e => {
                          const newState = e.target.value
                          setFormData({...formData, state: newState, district: indianLocations[newState][0]})
                        }}
                      >
                        {Object.keys(indianLocations).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-primary font-bold">District</label>
                      <select 
                        className="bg-surface-container border border-primary/30 rounded-xl px-4 py-2 text-sm w-full text-on-surface"
                        value={formData.district}
                        onChange={e => setFormData({...formData, district: e.target.value})}
                      >
                        {(indianLocations[formData.state] || []).map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-primary font-bold">Village / Area Name</label>
                    <input 
                      className="bg-surface-container border border-primary/30 rounded-xl px-4 py-2 text-sm w-full text-on-surface"
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                      placeholder="Village Name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-primary font-bold">Farm Type</label>
                    <select 
                      className="bg-surface-container border border-primary/30 rounded-xl px-4 py-2 text-sm w-full text-on-surface"
                      value={formData.farmType}
                      onChange={e => setFormData({...formData, farmType: e.target.value})}
                    >
                      <option>Small Scale (1-2 Acres)</option>
                      <option>Medium Scale (3-10 Acres)</option>
                      <option>Large Scale (10+ Acres)</option>
                    </select>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight glow-text mb-2">
                    {userName}
                  </h2>
                  <p className="text-on-surface-variant font-medium flex items-center justify-center md:justify-start gap-2 mb-4">
                    <Mail className="w-4 h-4" />
                    {userEmail}
                  </p>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <div className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-primary/20 backdrop-blur-sm">
                      <MapPin className="w-4 h-4" />
                      {formData.location}, {formData.district}, {formData.state}
                    </div>
                    <button
                      onClick={toggleTheme}
                      className="px-4 py-1.5 rounded-full bg-surface-container border border-outline/30 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:bg-primary/10 transition-all shadow-sm"
                    >
                      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {isEditing ? (
                <>
                  <button 
                    onClick={handleSave}
                    disabled={isLoading}
                    className="px-6 py-3 rounded-2xl bg-primary text-on-primary font-bold flex items-center gap-2 hover:bg-primary-dark transition-all disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    Save
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 rounded-2xl bg-surface-container border border-outline/30 font-bold flex items-center gap-2 hover:bg-on-surface/5 transition-all"
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary font-bold flex items-center gap-2 hover:bg-primary/20 transition-all"
                  >
                    <Pencil className="w-5 h-5" />
                    Edit Profile
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="px-6 py-3 rounded-2xl bg-error/10 border border-error/20 text-error font-bold flex items-center gap-2 hover:bg-error transition-all hover:text-white"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.section>

        {/* My Farm Section */}
        <motion.section 
          className="space-y-4 col-span-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center justify-between px-2">
            <h3 className="font-headline text-[10px] font-black tracking-[0.2em] text-on-surface-variant uppercase">My Farm</h3>
            <Tractor className="w-5 h-5 text-primary/40" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center text-center">
              <span className="font-label text-xl font-bold text-primary glow-text">
                {formData.farmType.includes("Small") ? "1-2" : formData.farmType.includes("Medium") ? "3-10" : "10+"}
              </span>
              <span className="text-[9px] font-label text-on-surface-variant uppercase mt-1 tracking-widest">Acres</span>
            </div>
            <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center text-center">
              <span className="font-label text-xl font-bold text-primary">{formData.primaryCrops.length}</span>
              <span className="text-[9px] font-label text-on-surface-variant uppercase mt-1 tracking-widest">Crops</span>
            </div>
            <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center text-center">
              <span className="font-label text-lg font-bold text-tertiary">{formData.preferredLanguage.slice(0, 3)}</span>
              <span className="text-[9px] font-label text-on-surface-variant uppercase mt-1 tracking-widest">Lang</span>
            </div>
          </div>
          
          <div className="space-y-3">
            {formData.primaryCrops.map((crop, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-surface-container border border-primary/10 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Sprout className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">{crop}</p>
                    <p className="text-xs text-on-surface-variant">Active Crop</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleRemoveCrop(crop)}
                  className="text-on-surface-variant hover:text-error transition-colors p-1"
                  title="Remove crop"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {formData.primaryCrops.length === 0 && (
               <div className="text-center py-4 text-on-surface-variant text-sm italic">No crops listed</div>
            )}
            
            {/* Add Crop Input */}
            <div className="flex gap-2">
              <input 
                type="text"
                value={newCrop}
                onChange={e => setNewCrop(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddCrop()}
                placeholder="Add a crop..."
                className="flex-1 p-3 rounded-2xl border border-dashed border-primary/20 bg-primary/5 text-sm text-on-surface placeholder:text-primary/50 focus:outline-none focus:border-primary/40"
              />
              <button 
                onClick={handleAddCrop}
                disabled={!newCrop.trim()}
                className="px-4 rounded-2xl bg-primary/10 border border-primary/20 text-primary font-bold flex items-center gap-1 hover:bg-primary/20 transition-all disabled:opacity-30"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.section>

        {/* Preferences Section - All Connected to DB */}
        <motion.section 
          className="space-y-4 col-span-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="font-headline text-[10px] font-black tracking-[0.2em] text-on-surface-variant uppercase px-2">Preferences</h3>
          <div className="glass-panel rounded-3xl p-6 space-y-6">
            {/* Language */}
            <div className="space-y-3">
              <label className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest">Preferred Language</label>
              <div className="flex flex-wrap gap-2">
                {languages.map(lang => (
                  <button 
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    className={lang === formData.preferredLanguage 
                      ? "px-4 py-1.5 rounded-full bg-primary text-on-primary font-bold text-sm shadow-[0_0_15px_rgba(0,255,65,0.4)] transition-transform hover:scale-105"
                      : "px-4 py-1.5 rounded-full bg-surface-container-high border border-outline/30 text-on-surface font-medium text-sm hover:bg-white/5 transition-colors"
                    }
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Units */}
            <div className="space-y-3">
              <label className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest">Units Display</label>
              <div className="grid grid-cols-2 p-1 bg-surface-container rounded-full border border-outline/20">
                <button 
                  onClick={() => handleUnitsChange("Metric")}
                  className={formData.units === "Metric" 
                    ? "py-2 rounded-full bg-primary/20 border border-primary/30 font-bold text-sm text-primary"
                    : "py-2 rounded-full font-medium text-sm text-on-surface-variant hover:text-on-surface transition-colors"
                  }
                >Metric (kg, m)</button>
                <button 
                  onClick={() => handleUnitsChange("Imperial")}
                  className={formData.units === "Imperial" 
                    ? "py-2 rounded-full bg-primary/20 border border-primary/30 font-bold text-sm text-primary"
                    : "py-2 rounded-full font-medium text-sm text-on-surface-variant hover:text-on-surface transition-colors"
                  }
                >Imperial (lb, ft)</button>
              </div>
            </div>
            
            {/* Alert Toggles - Connected to DB */}
            <div className="space-y-4 pt-4 border-t border-primary/10">
              {isSavingPref && (
                <div className="flex items-center gap-2 text-[10px] text-primary">
                  <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                </div>
              )}
              
              {/* Weather Alerts */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sun className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">Weather Alerts</span>
                </div>
                <button 
                  onClick={() => handleTogglePref("weatherAlerts")}
                  className={`w-10 h-5 rounded-full relative p-0.5 border cursor-pointer transition-all ${
                    formData.weatherAlerts 
                      ? "bg-primary/30 border-primary/50" 
                      : "bg-surface-container-high border-outline/50"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full absolute transition-all ${
                    formData.weatherAlerts 
                      ? "bg-primary right-0.5 shadow-[0_0_10px_rgba(0,255,65,0.6)]" 
                      : "bg-on-surface-variant left-0.5"
                  }`}></div>
                </button>
              </div>
              
              {/* Pest Warnings */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sprout className="w-5 h-5 text-error" />
                  <span className="text-sm font-medium">Pest Warnings</span>
                </div>
                <button 
                  onClick={() => handleTogglePref("pestWarnings")}
                  className={`w-10 h-5 rounded-full relative p-0.5 border cursor-pointer transition-all ${
                    formData.pestWarnings 
                      ? "bg-error/30 border-error/50" 
                      : "bg-surface-container-high border-outline/50"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full absolute transition-all ${
                    formData.pestWarnings 
                      ? "bg-error right-0.5 shadow-[0_0_10px_rgba(255,59,48,0.6)]" 
                      : "bg-on-surface-variant left-0.5"
                  }`}></div>
                </button>
              </div>
              
              {/* Market Trends */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Tractor className="w-5 h-5 text-tertiary" />
                  <span className="text-sm font-medium">Market Trends</span>
                </div>
                <button 
                  onClick={() => handleTogglePref("marketTrends")}
                  className={`w-10 h-5 rounded-full relative p-0.5 border cursor-pointer transition-all ${
                    formData.marketTrends 
                      ? "bg-tertiary/30 border-tertiary/50" 
                      : "bg-surface-container-high border-outline/50"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full absolute transition-all ${
                    formData.marketTrends 
                      ? "bg-tertiary right-0.5 shadow-[0_0_10px_rgba(128,255,180,0.6)]" 
                      : "bg-on-surface-variant left-0.5"
                  }`}></div>
                </button>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Logout Section */}
        <motion.section 
          className="space-y-2 col-span-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="font-headline text-[10px] font-black tracking-[0.2em] text-on-surface-variant uppercase px-2">Account</h3>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 rounded-2xl border border-error/20 bg-error/5 hover:bg-error/10 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <LogOut className="w-5 h-5 text-error" />
              <span className="font-bold text-error uppercase tracking-widest text-xs">Logout</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-error shadow-[0_0_10px_rgba(255,59,48,0.6)]"></div>
          </button>
        </motion.section>
      </main>
    </div>
  )
}
