import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TopAppBar } from "@/components/TopAppBar"
import { useTheme } from "@/hooks/useTheme"
import { 
  Sun, 
  Moon, 
  AlertTriangle, 
  CloudSun,
  Sprout, 
  Lightbulb, 
  Loader2,
  RefreshCw,
  Check,
  AlertCircle,
  Leaf,
  Droplets
} from "lucide-react"
import { API_BASE_URL } from "@/config"

interface Notification {
  id: number;
  category: string;
  priority: string;
  title: string;
  body: string;
  timeAgo: string;
}

const categoryIcons: Record<string, any> = {
  weather: CloudSun,
  crop: Sprout,
  advisory: Lightbulb,
  seasonal: Leaf,
  irrigation: Droplets
}

const priorityStyles: Record<string, { border: string, badge: string, icon: string }> = {
  high: { border: "border-l-error", badge: "bg-error/10 text-error border-error/20", icon: "text-error" },
  medium: { border: "border-l-primary", badge: "bg-primary/10 text-primary border-primary/20", icon: "text-primary" },
  low: { border: "border-l-outline", badge: "bg-surface-container text-on-surface-variant border-outline/20", icon: "text-on-surface-variant" }
}

export function NotificationsPage() {
  const [activeFilter, setActiveFilter] = useState("All")
  const { toggleTheme, isDark } = useTheme()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [readIds, setReadIds] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("readNotifications") || "[]")
    } catch { return [] }
  })

  const filters = ["All", "Weather", "Crop", "Advisory", "Seasonal"]

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Gather context for AI
      const lat = localStorage.getItem("userLat")
      const lon = localStorage.getItem("userLon")
      const crops = (localStorage.getItem("userCrops") || "").split(", ").filter(Boolean)
      const location = localStorage.getItem("userLocation") || ""

      let weatherContext = {}
      if (lat && lon) {
        try {
          const weatherRes = await fetch(`${API_BASE_URL}/weather?lat=${lat}&lon=${lon}`)
          if (weatherRes.ok) {
            const data = await weatherRes.json()
            weatherContext = {
              temp: Math.round(data.main.temp),
              humidity: data.main.humidity,
              description: data.weather[0].main,
              wind: Math.round(data.wind.speed * 3.6),
              rain: data.rain ? data.rain["1h"] || 0 : 0
            }
          }
        } catch { /* proceed without weather */ }
      }

      const res = await fetch(`${API_BASE_URL}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weather: weatherContext,
          crops,
          location
        })
      })

      if (!res.ok) throw new Error("Failed to load advisories")
      const data = await res.json()
      setNotifications(data.notifications || [])
    } catch (err) {
      console.error(err)
      setError("Unable to load advisories. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const toggleRead = (id: number) => {
    const newReadIds = readIds.includes(id) ? readIds.filter(r => r !== id) : [...readIds, id]
    setReadIds(newReadIds)
    localStorage.setItem("readNotifications", JSON.stringify(newReadIds))
  }

  const markAllRead = () => {
    const allIds = notifications.map(n => n.id)
    setReadIds(allIds)
    localStorage.setItem("readNotifications", JSON.stringify(allIds))
  }

  const filtered = activeFilter === "All" 
    ? notifications 
    : notifications.filter(n => n.category.toLowerCase() === activeFilter.toLowerCase())

  return (
    <div className="bg-transparent text-on-surface font-body min-h-screen pb-12 overflow-x-hidden antialiased">

      <TopAppBar 
        showProfilePic={false}
        leftAction={
          <div className="flex items-center gap-3 pl-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary shadow-[0_0_8px_rgba(0,255,65,1)]"></span>
            </span>
            <h1 className="font-headline font-bold text-lg tracking-tight text-primary glow-text">ADVISORIES</h1>
          </div>
        }
        title={<></>}
        subtitle={<></>}
        actions={
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchNotifications}
              disabled={isLoading}
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-surface-container flex items-center justify-center cursor-pointer border border-outline/50 hover:bg-primary/10 hover:border-primary/30 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button 
              onClick={markAllRead}
              className="text-[10px] sm:text-xs font-label tracking-widest text-on-surface-variant hover:text-primary transition-colors font-bold"
            >
              MARK ALL READ
            </button>
            <button
              onClick={toggleTheme}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-surface-container flex items-center justify-center cursor-pointer border border-outline/50 hover:bg-primary/10 hover:border-primary/30 transition-all"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        }
      />

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

        {/* AI Badge */}
        <div className="mb-6 flex items-center gap-2 px-1">
          <Lightbulb className="w-4 h-4 text-primary" />
          <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
            AI-Generated Advisories based on your location, weather & crops
          </span>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <div className="text-center">
              <p className="text-on-surface font-bold">Analyzing your farm conditions...</p>
              <p className="text-on-surface-variant text-sm mt-1">Generating personalized advisories with AI</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <AlertCircle className="w-10 h-10 text-error" />
            <p className="text-error font-bold">{error}</p>
            <button 
              onClick={fetchNotifications}
              className="px-6 py-2 rounded-full bg-primary text-on-primary font-bold text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {/* Notifications List */}
        {!isLoading && !error && (
          <AnimatePresence>
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 }
                }
              }}
            >
              {filtered.length === 0 && (
                <motion.div 
                  className="col-span-full text-center py-12"
                  variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                >
                  <Lightbulb className="w-12 h-12 text-primary/30 mx-auto mb-4" />
                  <p className="text-on-surface-variant">No {activeFilter.toLowerCase()} advisories right now.</p>
                </motion.div>
              )}

              {filtered.map((notif) => {
                const IconComponent = categoryIcons[notif.category] || Lightbulb
                const styles = priorityStyles[notif.priority] || priorityStyles.low
                const isRead = readIds.includes(notif.id)

                return (
                  <motion.div 
                    key={notif.id}
                    variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
                    className={`glass-panel rounded-2xl p-4 flex gap-4 border-l-4 ${styles.border} ${isRead ? "opacity-60" : ""} transition-opacity`}
                  >
                    <div className={`h-12 w-12 shrink-0 bg-surface-container rounded-xl flex items-center justify-center border ${notif.priority === "high" ? "border-error/20" : "border-primary/10"}`}>
                      <IconComponent className={`w-6 h-6 ${styles.icon}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border ${styles.badge} shrink-0`}>
                          {notif.category}
                        </span>
                        <span className="font-label text-[10px] text-on-surface-variant font-medium shrink-0">{notif.timeAgo}</span>
                      </div>
                      <h5 className="font-headline font-bold text-on-surface text-sm mt-2 line-clamp-2">{notif.title}</h5>
                      <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{notif.body}</p>
                      <div className="flex justify-between items-center mt-3">
                        {notif.priority === "high" && (
                          <div className="flex items-center gap-1 text-error">
                            <AlertTriangle className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase">Action Needed</span>
                          </div>
                        )}
                        <button 
                          onClick={() => toggleRead(notif.id)}
                          className={`text-[11px] font-bold flex items-center gap-1 ml-auto ${isRead ? "text-on-surface-variant" : "text-primary"} hover:underline uppercase tracking-wide`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          {isRead ? "Read" : "Mark read"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  )
}
