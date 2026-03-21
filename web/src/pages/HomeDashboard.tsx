import { TopAppBar } from "@/components/TopAppBar"
import { 
  CloudSun, 
  Droplets, 
  Wind, 
  Droplet, 
  Cloud, 
  Sun, 
  CloudRain, 
  CheckCircle2, 
  Sprout, 
  Tractor, 
  TrendingUp, 
  Bug, 
  ArrowRight,
  Flower2,
  Flower,
  Leaf,
  Loader2,
  AlertCircle
} from "lucide-react"
import { useState, useEffect } from "react"
import { API_BASE_URL } from "@/config"

interface WeatherData {
  temp: number;
  description: string;
  humidity: number;
  windSpeed: number;
  rain: number;
}

export function HomeDashboard() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWeather = async () => {
      const lat = localStorage.getItem("userLat")
      const lon = localStorage.getItem("userLon")

      if (!lat || !lon) {
        setError("Location not found. Please complete onboarding.")
        setIsLoading(false)
        return
      }

      try {
        const res = await fetch(
          `${API_BASE_URL}/weather?lat=${lat}&lon=${lon}`
        )
        if (!res.ok) throw new Error("Failed to fetch weather")
        const data = await res.json()
        setWeather({
          temp: Math.round(data.main.temp),
          description: data.weather[0].main,
          humidity: data.main.humidity,
          windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
          rain: data.rain ? data.rain["1h"] || 0 : 0
        })
      } catch (err) {
        console.error(err)
        setError("Weather data unavailable")
      } finally {
        setIsLoading(false)
      }
    }

    fetchWeather()
  }, [])
  return (
    <div className="font-body text-on-surface flex flex-col antialiased max-w-5xl mx-auto w-full pt-20">
      {/* Top Bar */}
      <TopAppBar />

      <main className="flex-1 p-4 flex flex-col gap-4">
        {/* Bento Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Tile A: Weather (Full Width) */}
          <div className="col-span-2 md:col-span-4 lg:col-span-2 glass-panel rounded-2xl p-6 group relative overflow-hidden min-h-[250px] flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[60px] -mr-20 -mt-20"></div>
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-4 py-8">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-on-surface-variant animate-pulse">Fetching real-time weather...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 relative z-10">
                <AlertCircle className="w-8 h-8 text-error" />
                <p className="text-error font-bold">{error}</p>
                <p className="text-on-surface-variant text-xs mt-2 text-center">Backend weather service unavailable</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div>
                    <h2 className="font-headline text-[80px] leading-none font-bold text-primary glow-text tracking-tighter shrink-0">
                      {weather?.temp}°
                    </h2>
                    <p className="font-headline text-xl font-medium text-on-surface mt-2">{weather?.description}</p>
                  </div>
                  <CloudSun className="w-16 h-16 text-primary drop-shadow-[0_0_15px_rgba(0,255,65,0.4)] ml-4 shrink-0" />
                </div>
                
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide relative z-10 w-full">
                  <div className="bg-surface-container/50 rounded-lg px-3 py-2 flex items-center gap-2 border border-primary/10 shrink-0">
                    <Droplets className="w-4 h-4 text-primary" />
                    <span className="font-label text-sm text-on-surface">{weather?.humidity}% Hum</span>
                  </div>
                  <div className="bg-surface-container/50 rounded-lg px-3 py-2 flex items-center gap-2 border border-primary/10 shrink-0">
                    <Wind className="w-4 h-4 text-primary" />
                    <span className="font-label text-sm text-on-surface">{weather?.windSpeed} km/h</span>
                  </div>
                  <div className="bg-surface-container/50 rounded-lg px-3 py-2 flex items-center gap-2 border border-primary/10 shrink-0">
                    <Droplet className="w-4 h-4 text-primary" />
                    <span className="font-label text-sm text-on-surface">{weather?.rain}mm Rain</span>
                  </div>
                </div>
              </>
            )}
            
            <div className="flex justify-between items-end border-t border-primary/10 pt-4 relative z-10 mt-auto">
              <div className="flex justify-between w-full">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-on-surface-variant">Now</span>
                  <Cloud className="w-5 h-5 text-on-surface-variant" />
                  <span className="font-label text-sm">{weather?.temp}°</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-on-surface-variant">12 PM</span>
                  <Sun className="w-5 h-5 text-on-surface-variant" />
                  <span className="font-label text-sm">{weather ? weather.temp + 2 : "--"}°</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-on-surface-variant">3 PM</span>
                  <Sun className="w-5 h-5 text-on-surface-variant" />
                  <span className="font-label text-sm">{weather ? weather.temp + 3 : "--"}°</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-on-surface-variant text-primary">6 PM</span>
                  <CloudRain className="w-5 h-5 text-primary" />
                  <span className="font-label text-sm text-primary">{weather ? weather.temp - 1 : "--"}°</span>
                </div>
              </div>
            </div>
            
            {/* Advisory Band */}
            <div className="mt-6 bg-primary/10 rounded-xl p-3 flex items-center gap-3 border border-primary/30 glow-box-primary relative z-10 w-full">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span className="text-sm font-bold text-primary tracking-wide">
                {weather && weather.rain > 0 ? "Rain expected, pause irrigation" : "Good day to irrigate"}
              </span>
            </div>
          </div>

          {/* Tile B: My Field (Left) */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1 glass-panel rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center border border-primary/10">
                <Sprout className="w-5 h-5 text-primary" />
              </div>
              <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Wheat</span>
            </div>
            
            <div className="relative w-24 h-24 mx-auto mb-4">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle className="text-on-surface/5" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
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
                <Tractor className="w-5 h-5 text-primary" />
              </div>
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse mt-1"></div>
            </div>
            
            <div>
              <h3 className="font-headline text-sm font-medium text-on-surface-variant mb-1">Wheat (Lokwan)</h3>
              <p className="font-label text-2xl font-bold text-on-surface mb-2 tracking-tight">₹2,450</p>
              <p className="text-xs text-on-surface-variant mb-4">per quintal</p>
            </div>
            
            <div className="flex items-center gap-1 text-primary bg-primary/10 self-start px-2 py-1 rounded-md text-xs font-bold border border-primary/20">
              <TrendingUp className="w-3.5 h-3.5" />
              +2.4%
            </div>
          </div>

          {/* Tile D: Pest Alert (Full Width) */}
          <div className="col-span-2 md:col-span-4 glass-panel rounded-2xl p-5 border-l-4 border-l-error relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-error/10 to-transparent pointer-events-none"></div>
            <div className="flex items-center justify-between relative z-10 w-full">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-error/20 flex items-center justify-center border border-error/30 shrink-0 text-error">
                  <Bug className="w-6 h-6" />
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
                <ArrowRight className="w-5 h-5" />
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
                <Flower2 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface">Soybean</p>
                <p className="font-label text-xs text-primary">₹4,200 <span className="text-[10px] text-on-surface-variant ml-1">↑</span></p>
              </div>
            </div>
            
            <div className="glass-panel rounded-xl p-3 min-w-[140px] flex-shrink-0 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center border border-primary/10 shrink-0">
                <Flower className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface">Cotton</p>
                <p className="font-label text-xs text-primary">₹7,150 <span className="text-[10px] text-on-surface-variant ml-1">↑</span></p>
              </div>
            </div>
            
            <div className="glass-panel rounded-xl p-3 min-w-[140px] flex-shrink-0 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center border border-primary/10 shrink-0">
                <Leaf className="w-4 h-4 text-error" />
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
