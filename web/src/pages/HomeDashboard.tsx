import { TopAppBar } from "@/components/TopAppBar"
import { 
  CloudSun, 
  Droplets, 
  Wind, 
  Droplet, 
  Cloud, 
  Sun, 
  CloudRain, 
  CloudSnow,
  CloudFog,
  CheckCircle2, 
  Sprout, 
  Loader2,
  AlertCircle,
  Sparkles
} from "lucide-react"
import { useState, useEffect } from "react"
import { API_BASE_URL } from "@/config"
import { useNavigate } from "react-router-dom"

interface WeatherData {
  temp: number;
  description: string;
  humidity: number;
  windSpeed: number;
  rain: number;
  icon: string;
}

interface ForecastItem {
  time: string;
  temp: number;
  description: string;
  icon: string;
}

// Map OpenWeatherMap icon codes to Lucide icons
function getWeatherIcon(iconCode: string, className: string) {
  if (iconCode.startsWith("01") || iconCode.startsWith("02")) return <Sun className={className} />
  if (iconCode.startsWith("03") || iconCode.startsWith("04")) return <Cloud className={className} />
  if (iconCode.startsWith("09") || iconCode.startsWith("10")) return <CloudRain className={className} />
  if (iconCode.startsWith("13")) return <CloudSnow className={className} />
  if (iconCode.startsWith("50")) return <CloudFog className={className} />
  return <CloudSun className={className} />
}

export function HomeDashboard() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [forecast, setForecast] = useState<ForecastItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userCrops, setUserCrops] = useState<string[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    // Load user crops from localStorage
    const crops = localStorage.getItem("userCrops")
    if (crops) {
      setUserCrops(crops.split(", ").filter(Boolean))
    }

    const fetchWeatherAndForecast = async () => {
      const lat = localStorage.getItem("userLat")
      const lon = localStorage.getItem("userLon")

      if (!lat || !lon) {
        setError("Location not found. Please complete onboarding.")
        setIsLoading(false)
        return
      }

      try {
        // Fetch current weather and forecast in parallel
        const [weatherRes, forecastRes] = await Promise.all([
          fetch(`${API_BASE_URL}/weather?lat=${lat}&lon=${lon}`),
          fetch(`${API_BASE_URL}/forecast?lat=${lat}&lon=${lon}`)
        ])

        if (!weatherRes.ok) throw new Error("Failed to fetch weather")
        const weatherData = await weatherRes.json()
        setWeather({
          temp: Math.round(weatherData.main.temp),
          description: weatherData.weather[0].main,
          humidity: weatherData.main.humidity,
          windSpeed: Math.round(weatherData.wind.speed * 3.6),
          rain: weatherData.rain ? weatherData.rain["1h"] || 0 : 0,
          icon: weatherData.weather[0].icon
        })

        if (forecastRes.ok) {
          const forecastData = await forecastRes.json()
          const items: ForecastItem[] = (forecastData.list || []).slice(0, 5).map((item: any) => ({
            time: new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
            temp: Math.round(item.main.temp),
            description: item.weather[0].main,
            icon: item.weather[0].icon
          }))
          setForecast(items)
        }
      } catch (err) {
        console.error(err)
        setError("Weather data unavailable")
      } finally {
        setIsLoading(false)
      }
    }

    fetchWeatherAndForecast()
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
                  {weather?.icon ? getWeatherIcon(weather.icon, "w-16 h-16 text-primary drop-shadow-[0_0_15px_rgba(0,255,65,0.4)] ml-4 shrink-0") : <CloudSun className="w-16 h-16 text-primary drop-shadow-[0_0_15px_rgba(0,255,65,0.4)] ml-4 shrink-0" />}
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
            
            {/* Real Forecast Row */}
            {forecast.length > 0 && (
              <div className="flex justify-between items-end border-t border-primary/10 pt-4 relative z-10 mt-auto">
                <div className="flex justify-between w-full">
                  {forecast.map((item, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <span className="text-xs text-on-surface-variant">{i === 0 ? "Next" : item.time}</span>
                      {getWeatherIcon(item.icon, "w-5 h-5 text-on-surface-variant")}
                      <span className="font-label text-sm">{item.temp}°</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Advisory Band */}
            {weather && (
              <div className="mt-6 bg-primary/10 rounded-xl p-3 flex items-center gap-3 border border-primary/30 glow-box-primary relative z-10 w-full">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span className="text-sm font-bold text-primary tracking-wide">
                  {weather.rain > 0 ? "Rain expected, pause irrigation" : weather.humidity > 80 ? "High humidity, watch for fungal growth" : "Good day to irrigate"}
                </span>
              </div>
            )}
          </div>

          {/* Tile B: My Crops (from DB) */}
          <div className="col-span-2 md:col-span-4 lg:col-span-2 glass-panel rounded-2xl p-5 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center border border-primary/10">
                  <Sprout className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-headline font-bold text-on-surface">My Crops</h3>
                  <p className="text-xs text-on-surface-variant">{userCrops.length} active crop{userCrops.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
            </div>
            
            {userCrops.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-4">
                {userCrops.map((crop, i) => (
                  <div key={i} className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-2">
                    <Sprout className="w-3.5 h-3.5 text-primary" />
                    <span className="text-sm font-bold text-primary">{crop}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-on-surface-variant text-sm">
                No crops listed yet.
                <button onClick={() => navigate("/profile")} className="text-primary font-bold ml-1 hover:underline">
                  Add crops →
                </button>
              </div>
            )}

            <button 
              onClick={() => navigate("/crops")}
              className="mt-auto w-full py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/20 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Get Crop Recommendations
            </button>
          </div>

        </div>

        {/* Quick Actions */}
        <div className="mt-2 text-left">
          <h3 className="font-headline font-bold text-on-surface mb-3 px-1 text-sm tracking-widest uppercase">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button 
              onClick={() => navigate("/crops")}
              className="glass-panel rounded-xl p-4 flex items-center gap-3 hover:bg-primary/5 transition-all active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-on-surface">Crop Intel</p>
                <p className="text-[10px] text-on-surface-variant">AI Recommendations</p>
              </div>
            </button>

            <button 
              onClick={() => navigate("/notifications")}
              className="glass-panel rounded-xl p-4 flex items-center gap-3 hover:bg-primary/5 transition-all active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center border border-tertiary/20 shrink-0">
                <AlertCircle className="w-5 h-5 text-tertiary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-on-surface">Advisories</p>
                <p className="text-[10px] text-on-surface-variant">AI Farm Alerts</p>
              </div>
            </button>

            <button 
              onClick={() => navigate("/profile")}
              className="glass-panel rounded-xl p-4 flex items-center gap-3 hover:bg-primary/5 transition-all active:scale-[0.98] col-span-2 md:col-span-1"
            >
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/20 shrink-0">
                <Sprout className="w-5 h-5 text-secondary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-on-surface">My Farm</p>
                <p className="text-[10px] text-on-surface-variant">Profile & Settings</p>
              </div>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
