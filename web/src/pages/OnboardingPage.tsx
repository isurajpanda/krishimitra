import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useTheme } from "@/hooks/useTheme"
import { Sun, Moon, MapPin, Tractor, Sprout, ChevronRight, Loader2 } from "lucide-react"

export function OnboardingPage() {
  const { toggleTheme, isDark } = useTheme()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    location: "",
    farmType: "Small",
    primaryCrops: [] as string[]
  })

  const crops = ["Rice", "Wheat", "Sugarcane", "Cotton", "Corn", "Potatoes", "Other"]

  const handleToggleCrop = (crop: string) => {
    setFormData(prev => ({
      ...prev,
      primaryCrops: prev.primaryCrops.includes(crop)
        ? prev.primaryCrops.filter(c => c !== crop)
        : [...prev.primaryCrops, crop]
    }))
  }

  const handleDetectLocation = () => {
    if (!navigator.geolocation) return
    setIsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = `Farm Area (${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)})`
        setFormData({ ...formData, location: loc })
        setIsLoading(false)
      },
      (err) => {
        console.error(err)
        setIsLoading(false)
      }
    )
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    const userId = localStorage.getItem("userId")
    try {
      const res = await fetch(`http://10.0.2.16:3001/api/v0/auth/profile/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        localStorage.setItem("userLocation", formData.location)
        localStorage.setItem("userOnboarded", "true")
        navigate("/")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

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
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3].map(i => (
                <div key={i} className={`h-1 w-8 rounded-full transition-all ${step >= i ? "bg-primary" : "bg-primary/20"}`} />
              ))}
            </div>
          </div>

          {step === 1 && (
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6 text-left">
              <h2 className="text-2xl font-bold text-on-surface text-center">Where is your farm?</h2>
              <p className="text-on-surface-variant text-sm text-center">Knowing your location helps us provide local weather and market info.</p>
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                <input 
                  type="text"
                  placeholder="Tell us your Village or District"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  className="w-full bg-surface-container-highest border border-outline/50 rounded-2xl py-4 pl-12 pr-4 text-on-surface focus:outline-none focus:border-primary transition-all"
                />
                <button 
                  type="button"
                  onClick={handleDetectLocation}
                  className="mt-2 text-xs font-bold text-primary flex items-center gap-1 hover:underline px-4"
                >
                  <MapPin className="w-3 h-3" />
                  Detect My Location
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
              <h2 className="text-2xl font-bold text-on-surface">Farm Type</h2>
              <div className="grid grid-cols-1 gap-4">
                {["Small Scale (1-2 Acres)", "Medium Scale (3-10 Acres)", "Large Scale (10+ Acres)"].map(type => (
                  <button
                    key={type}
                    onClick={() => setFormData({...formData, farmType: type})}
                    className={`p-6 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                      formData.farmType === type ? "border-primary bg-primary/10" : "border-outline/30 bg-surface-container"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Tractor className={`w-6 h-6 ${formData.farmType === type ? "text-primary" : "text-on-surface-variant"}`} />
                      <span className={`font-bold ${formData.farmType === type ? "text-primary" : "text-on-surface"}`}>{type}</span>
                    </div>
                    {formData.farmType === type && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
              <h2 className="text-2xl font-bold text-on-surface">What do you grow?</h2>
              <div className="flex flex-wrap justify-center gap-3">
                {crops.map(crop => (
                  <button
                    key={crop}
                    onClick={() => handleToggleCrop(crop)}
                    className={`px-6 py-3 rounded-full border-2 transition-all font-medium ${
                      formData.primaryCrops.includes(crop) 
                        ? "bg-primary text-on-primary border-primary shadow-lg shadow-primary/20" 
                        : "bg-surface-container border-outline/30 text-on-surface hover:border-primary/50"
                    }`}
                  >
                    {crop}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <div className="mt-12">
            <button
              onClick={() => step < 3 ? setStep(step + 1) : handleSubmit()}
              disabled={isLoading || (step === 1 && !formData.location)}
              className="w-full bg-primary text-on-primary font-bold py-4 rounded-2xl shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {step === 3 ? "Start Farming" : "Continue"}
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="mt-4 text-on-surface-variant font-medium hover:text-primary transition-colors">
                Go Back
              </button>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
