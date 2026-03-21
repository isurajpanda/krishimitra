import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { API_BASE_URL } from "@/config"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "@/hooks/useTheme"
import { Sun, Moon, MapPin, Tractor, Sprout, ChevronRight, ChevronLeft, Loader2, AlertCircle, Globe } from "lucide-react"

import { indianLocations } from "@/lib/indianLocations"

export function OnboardingPage() {
  const { toggleTheme, isDark } = useTheme()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  const [formData, setFormData] = useState({
    location: "",
    state: "Maharashtra",
    district: "Pune",
    lat: null as number | null,
    lon: null as number | null,
    farmType: "",
    primaryCrops: [] as string[],
    preferredLanguage: "English"
  })

  const crops = [
    "Rice", "Wheat", "Sugarcane", "Cotton", "Corn", "Potatoes",
    "Soybean", "Mustard", "Groundnut", "Tomato", "Onion", "Chili",
    "Turmeric", "Mango", "Banana", "Tea", "Coffee", "Jute"
  ]

  const languages = ["English", "हिंदी", "ਪੰਜਾਬੀ", " தமிழ்", "తెలుగు", "ಕನ್ನಡ", "ଓଡ଼ିଆ", "বাংলা", "मराठी"]

  const farmTypes = [
    { label: "Small Scale (1-2 Acres)", icon: "🌱" },
    { label: "Medium Scale (3-10 Acres)", icon: "🌾" },
    { label: "Large Scale (10+ Acres)", icon: "🚜" }
  ]

  const handleToggleCrop = (crop: string) => {
    setFormData(prev => ({
      ...prev,
      primaryCrops: prev.primaryCrops.includes(crop)
        ? prev.primaryCrops.filter(c => c !== crop)
        : [...prev.primaryCrops, crop]
    }))
  }

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      return
    }
    setIsLoading(true)
    setError("")
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        // Try reverse geocoding for a human-readable name
        try {
          const res = await fetch(
            `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=7745e785f5e629e2fa325113e948625a`
          )
          const data = await res.json()
          const place = data[0]
          
          if (place) {
            const detectedState = Object.keys(indianLocations).find(s => 
              s.toLowerCase().includes(place.state?.toLowerCase()) || 
              place.state?.toLowerCase().includes(s.toLowerCase())
            )
            const newState = detectedState || formData.state
            const districts = indianLocations[newState] || []
            const detectedDistrict = districts.find(d => 
              d.toLowerCase().includes(place.name?.toLowerCase()) || 
              place.name?.toLowerCase().includes(d.toLowerCase())
            )
            
            setFormData(prev => ({ 
              ...prev, 
              location: place.name || prev.location,
              state: newState,
              district: detectedDistrict || districts[0] || prev.district,
              lat: latitude, 
              lon: longitude 
            }))
          } else {
            setFormData(prev => ({ ...prev, lat: latitude, lon: longitude }))
          }
        } catch {
          setFormData(prev => ({ ...prev, lat: latitude, lon: longitude }))
        }
        localStorage.setItem("userLat", latitude.toString())
        localStorage.setItem("userLon", longitude.toString())
        setIsLoading(false)
      },
      (err) => {
        console.error(err)
        setError("Could not detect location. Please enter it manually.")
        setIsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const validateStep = () => {
    setError("")
    if (step === 1 && !formData.location.trim()) {
      setError("Please enter your farm location or detect it automatically")
      return false
    }
    if (step === 2 && !formData.farmType) {
      setError("Please select your farm type")
      return false
    }
    if (step === 3 && formData.primaryCrops.length === 0) {
      setError("Please select at least one crop")
      return false
    }
    return true
  }

  const handleNext = () => {
    if (!validateStep()) return
    setError("")
    setStep(step + 1)
  }

  const handleSubmit = async () => {
    if (!validateStep()) return
    setIsLoading(true)
    setError("")
    const userId = localStorage.getItem("userId")
    try {
      const res = await fetch(`${API_BASE_URL}/auth/profile/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: formData.location,
          state: formData.state,
          district: formData.district,
          lat: formData.lat,
          lon: formData.lon,
          farmType: formData.farmType,
          primaryCrops: formData.primaryCrops,
          preferredLanguage: formData.preferredLanguage
        }),
      })
      if (res.ok) {
        await res.json()
        localStorage.setItem("userLocation", formData.location)
        localStorage.setItem("userState", formData.state)
        localStorage.setItem("userDistrict", formData.district)
        if (formData.lat) localStorage.setItem("userLat", formData.lat.toString())
        if (formData.lon) localStorage.setItem("userLon", formData.lon.toString())
        localStorage.setItem("userFarmType", formData.farmType)
        localStorage.setItem("userCrops", formData.primaryCrops.join(", "))
        localStorage.setItem("userLanguage", formData.preferredLanguage)
        localStorage.setItem("userOnboarded", "true")
        navigate("/")
      } else {
        const data = await res.json()
        setError(data.error || "Failed to save profile. Please try again.")
      }
    } catch (err) {
      console.error(err)
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const totalSteps = 4

  return (
    <div className="bg-transparent text-on-surface font-body overflow-hidden selection:bg-primary selection:text-on-primary antialiased min-h-[100dvh] flex flex-col">
      <header className="relative z-20 flex justify-between p-6 max-w-lg mx-auto w-full">
        <div className="flex items-center gap-2">
           <Sprout className="w-6 h-6 text-primary" />
           <span className="font-brand font-bold text-xl">KrishiMitra</span>
        </div>
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container text-on-surface border border-outline/50 shadow-lg hover:bg-primary/10 transition-all"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 max-w-lg mx-auto text-center w-full">
        <motion.div 
          className="w-full glass-panel rounded-[40px] p-8 shadow-2xl border border-primary/10 mb-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="mb-8">
            <div className="flex justify-center gap-2 mb-2">
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map(i => (
                <div key={i} className={`h-1 w-8 rounded-full transition-all ${step >= i ? "bg-primary shadow-[0_0_6px_rgba(0,255,65,0.4)]" : "bg-primary/20"}`} />
              ))}
            </div>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Step {step} of {totalSteps}</p>
          </div>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-error/10 border border-error/20 text-error text-sm rounded-xl py-2 px-4 mb-4 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-6 text-left">
                <h2 className="text-2xl font-bold text-on-surface text-center">Where is your farm?</h2>
                <p className="text-on-surface-variant text-sm text-center">Knowing your location helps us provide local weather, crop advice and market info.</p>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text"
                    placeholder="Village, District, or City name"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    className="w-full bg-surface-container-highest border border-outline/50 rounded-2xl py-4 pl-12 pr-4 text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                  />
                </div>
                <button 
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isLoading}
                  className="w-full py-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/20 transition-all disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                  {isLoading ? "Detecting..." : "Detect My Location Automatically"}
                </button>
                {formData.lat && formData.lon && (
                  <p className="text-xs text-primary text-center font-medium">
                    📍 GPS coordinates saved ({formData.lat.toFixed(4)}, {formData.lon.toFixed(4)})
                  </p>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-6">
                <h2 className="text-2xl font-bold text-on-surface">What type of farm?</h2>
                <p className="text-on-surface-variant text-sm">This helps us tailor advice to your scale of farming.</p>
                <div className="grid grid-cols-1 gap-4">
                  {farmTypes.map(type => (
                    <button
                      key={type.label}
                      onClick={() => setFormData({...formData, farmType: type.label})}
                      className={`p-6 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                        formData.farmType === type.label ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(0,255,65,0.15)]" : "border-outline/30 bg-surface-container hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{type.icon}</span>
                        <div className="flex items-center gap-3">
                          <Tractor className={`w-5 h-5 ${formData.farmType === type.label ? "text-primary" : "text-on-surface-variant"}`} />
                          <span className={`font-bold ${formData.farmType === type.label ? "text-primary" : "text-on-surface"}`}>{type.label}</span>
                        </div>
                      </div>
                      {formData.farmType === type.label && <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(0,255,65,0.6)]" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-6">
                <h2 className="text-2xl font-bold text-on-surface">What do you grow?</h2>
                <p className="text-on-surface-variant text-sm">Select all crops you currently grow or plan to grow.</p>
                <div className="flex flex-wrap justify-center gap-3 max-h-[280px] overflow-y-auto pb-2">
                  {crops.map(crop => (
                    <button
                      key={crop}
                      onClick={() => handleToggleCrop(crop)}
                      className={`px-5 py-2.5 rounded-full border-2 transition-all font-medium text-sm ${
                        formData.primaryCrops.includes(crop) 
                          ? "bg-primary text-on-primary border-primary shadow-lg shadow-primary/20" 
                          : "bg-surface-container border-outline/30 text-on-surface hover:border-primary/50"
                      }`}
                    >
                      {crop}
                    </button>
                  ))}
                </div>
                {formData.primaryCrops.length > 0 && (
                  <p className="text-xs text-primary text-center font-bold">
                    {formData.primaryCrops.length} crop{formData.primaryCrops.length > 1 ? "s" : ""} selected
                  </p>
                )}
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-6">
                <h2 className="text-2xl font-bold text-on-surface">Preferred Language</h2>
                <p className="text-on-surface-variant text-sm">KrishiMitra will respond in your preferred language.</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {languages.map(lang => (
                    <button
                      key={lang}
                      onClick={() => setFormData({...formData, preferredLanguage: lang})}
                      className={`px-5 py-2.5 rounded-full border-2 transition-all font-medium text-sm ${
                        formData.preferredLanguage === lang 
                          ? "bg-primary text-on-primary border-primary shadow-lg shadow-primary/20" 
                          : "bg-surface-container border-outline/30 text-on-surface hover:border-primary/50"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>

                {/* Summary preview */}
                <div className="glass-panel rounded-2xl p-4 text-left space-y-2 border border-primary/10 mt-4">
                  <h4 className="text-[10px] uppercase tracking-widest text-primary font-bold flex items-center gap-2">
                    <Globe className="w-3 h-3" /> Your Farm Profile
                  </h4>
                  <div className="text-sm space-y-1">
                    <p><span className="text-on-surface-variant">Location:</span> <span className="font-medium">{formData.location}</span></p>
                    <p><span className="text-on-surface-variant">Farm:</span> <span className="font-medium">{formData.farmType}</span></p>
                    <p><span className="text-on-surface-variant">Crops:</span> <span className="font-medium">{formData.primaryCrops.join(", ")}</span></p>
                    <p><span className="text-on-surface-variant">Language:</span> <span className="font-medium">{formData.preferredLanguage}</span></p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-10 flex flex-col gap-3">
            <button
              onClick={() => step < totalSteps ? handleNext() : handleSubmit()}
              disabled={isLoading}
              className="w-full bg-primary text-on-primary font-bold py-4 rounded-2xl shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {step === totalSteps ? "Let's Farm! 🌱" : "Continue"}
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
            {step > 1 && (
              <button onClick={() => { setStep(step - 1); setError(""); }} className="text-on-surface-variant font-medium hover:text-primary transition-colors flex items-center justify-center gap-1">
                <ChevronLeft className="w-4 h-4" />
                Go Back
              </button>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
