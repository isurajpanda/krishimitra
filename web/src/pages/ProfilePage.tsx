import { motion } from "framer-motion"
import { TopAppBar } from "@/components/TopAppBar"
import { useTheme } from "@/hooks/useTheme"
import { 
  Bell, 
  Sun, 
  Moon, 
  MapPin, 
  Tractor, 
  Sprout, 
  Leaf, 
  PlusCircle, 
  Waves, 
  Bug, 
  TrendingUp, 
  Landmark, 
  FlaskConical, 
  HelpCircle, 
  Share2, 
  Star, 
  LogOut, 
  ChevronRight 
} from "lucide-react"

export function ProfilePage() {
  const { toggleTheme, isDark } = useTheme()
  return (
    <div className="bg-transparent text-on-surface font-body selection:bg-primary selection:text-on-primary antialiased min-h-screen pb-12 overflow-x-hidden">

      <TopAppBar 
        actions={
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container border border-outline/50 text-on-surface hover:bg-on-surface/5 transition-colors">
            <Bell className="w-5 h-5 text-on-surface-variant" />
          </button>
        }
      />

      <main className="relative z-10 max-w-4xl w-full mx-auto px-4 pt-24 pb-8 flex flex-col md:grid md:grid-cols-2 md:grid-flow-row-dense gap-6">
        {/* Profile Hero */}
        <motion.section 
          className="col-span-1 md:col-span-2 glass-panel rounded-3xl p-6 group"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[60px] -mr-16 -mt-16"></div>
          <div className="absolute top-4 right-4">
            <button
              onClick={toggleTheme}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="px-3 py-1.5 rounded-full bg-surface-container border border-outline/50 flex items-center gap-2 text-[10px] font-label uppercase tracking-widest text-on-surface-variant hover:bg-primary/10 hover:border-primary/30 transition-all"
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{isDark ? "Light" : "Dark"}</span>
            </button>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"></div>
              <div className="relative w-24 h-24 rounded-full p-1 bg-gradient-to-b from-primary to-transparent">
                <img alt="Raju Singh Profile" className="w-full h-full rounded-full object-cover border-2 border-background shadow-xl" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvjdb6mKR8oUoKPiR4xJ1aq5p1xsIxLDy_EBAMSVil5JjSNOTsclyU-vY94_FKOZO8RnWxjCKPcEU_YI6UGvjHk_KwVESZizXxSy-pIdYwDre7TNQriIbkrx_Erqdd_JKR75XSBeP4dJQ3NvYnytQ4uGlcg2Ll2Xq0grGN83EUj2X0hGHcBUQBcJ_IKxqsl0dned7rOHTccjEY4L6EExSuzzYk66MnX3ujTWZ5l2Ydx7gVmbX7B9qxXM61-W2IIbXrBP0YMAhC2dXw"/>
              </div>
            </div>
            <h2 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight glow-text">Raju Singh</h2>
            <div className="flex items-center gap-2 mt-2">
              <div className="px-3 py-1 rounded-full bg-surface-container text-primary text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-primary/20">
                <MapPin className="w-3.5 h-3.5" />
                Hoshiarpur, Punjab
              </div>
            </div>
            <p className="mt-4 text-on-surface-variant text-sm font-medium">Member since Kharif 2023</p>
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
              <span className="font-label text-xl font-bold text-primary glow-text">12.5</span>
              <span className="text-[9px] font-label text-on-surface-variant uppercase mt-1 tracking-widest">Acres</span>
            </div>
            <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center text-center">
              <span className="font-label text-xl font-bold text-tertiary">A+</span>
              <span className="text-[9px] font-label text-on-surface-variant uppercase mt-1 tracking-widest">Soil</span>
            </div>
            <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center text-center">
              <span className="font-label text-xl font-bold text-primary/70">Opt</span>
              <span className="text-[9px] font-label text-on-surface-variant uppercase mt-1 tracking-widest">Water</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container border border-primary/10 hover:border-primary/30 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Sprout className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-on-surface">North Field</p>
                  <p className="text-xs text-on-surface-variant">Rice • 5.2 Acres</p>
                </div>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(0,255,65,0.2)]">Growing</div>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container border border-outline/20 opacity-80 hover:opacity-100 transition-opacity cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-on-surface/5 flex items-center justify-center border border-outline/20">
                  <Leaf className="w-5 h-5 text-on-surface-variant" />
                </div>
                <div>
                  <p className="font-bold text-on-surface">River Side</p>
                  <p className="text-xs text-on-surface-variant">Wheat • 7.3 Acres</p>
                </div>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-surface-container border border-outline/20 text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">Dormant</div>
            </div>
            
            <button className="w-full p-4 rounded-2xl border border-dashed border-primary/20 bg-primary/5 flex items-center justify-center gap-2 text-primary/70 hover:bg-primary/10 hover:text-primary transition-all active:scale-[0.98]">
              <PlusCircle className="w-5 h-5" />
              <span className="font-bold text-xs uppercase tracking-widest">Add New Field</span>
            </button>
          </div>
        </motion.section>

        {/* Preferences Section */}
        <motion.section 
          className="space-y-4 col-span-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="font-headline text-[10px] font-black tracking-[0.2em] text-on-surface-variant uppercase px-2">Preferences</h3>
          <div className="glass-panel rounded-3xl p-6 space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest">Preferred Language</label>
              <div className="flex gap-2">
                <button className="px-5 py-2 rounded-full bg-primary text-on-primary font-bold text-sm shadow-[0_0_15px_rgba(0,255,65,0.4)] transition-transform hover:scale-105">English</button>
                <button className="px-5 py-2 rounded-full bg-surface-container-high border border-outline/30 text-on-surface font-medium text-sm hover:bg-white/5 transition-colors">हिंदी</button>
                <button className="px-5 py-2 rounded-full bg-surface-container-high border border-outline/30 text-on-surface font-medium text-sm hover:bg-white/5 transition-colors">ਪੰਜਾਬੀ</button>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest">Units Display</label>
              <div className="grid grid-cols-2 p-1 bg-surface-container rounded-full border border-outline/20">
                <button className="py-2 rounded-full bg-primary/20 border border-primary/30 font-bold text-sm text-primary">Metric (kg, m)</button>
                <button className="py-2 rounded-full font-medium text-sm text-on-surface-variant hover:text-on-surface transition-colors">Imperial (lb, ft)</button>
              </div>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-primary/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Waves className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">Weather Alerts</span>
                </div>
                <div className="w-10 h-5 bg-primary/30 rounded-full relative p-0.5 border border-primary/50 cursor-pointer">
                  <div className="w-4 h-4 bg-primary rounded-full absolute right-0.5 shadow-[0_0_10px_rgba(0,255,65,0.6)]"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bug className="w-5 h-5 text-error" />
                  <span className="text-sm font-medium">Pest Warnings</span>
                </div>
                <div className="w-10 h-5 bg-error/30 rounded-full relative p-0.5 border border-error/50 cursor-pointer">
                  <div className="w-4 h-4 bg-error rounded-full absolute right-0.5 shadow-[0_0_10px_rgba(255,59,48,0.6)]"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-tertiary" />
                  <span className="text-sm font-medium">Market Trends</span>
                </div>
                <div className="w-10 h-5 bg-surface-container-high rounded-full relative p-0.5 border border-outline/50 cursor-pointer">
                  <div className="w-4 h-4 bg-on-surface-variant rounded-full absolute left-0.5"></div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Linked Services */}
        <motion.section 
          className="space-y-4 col-span-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="font-headline text-[10px] font-black tracking-[0.2em] text-on-surface-variant uppercase px-2">Linked Services</h3>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container border border-primary/10 hover:border-primary/30 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/5 border border-primary/20 flex items-center justify-center">
                  <Landmark className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-on-surface">PM-Kisan ID</p>
                  <p className="text-xs text-on-surface-variant">Linked to •••• 8892</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_5px_rgba(0,255,65,1)]"></div>
                <span className="text-[10px] font-bold text-primary tracking-widest uppercase">Connected</span>
              </div>
            </div>
            
            <div className="glass-panel p-5 rounded-3xl border border-primary/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-tertiary/10 border border-tertiary/20 flex items-center justify-center">
                    <FlaskConical className="w-5 h-5 text-tertiary" />
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">Soil Health Card</p>
                    <p className="text-xs text-on-surface-variant">Last tested: Dec 2023</p>
                  </div>
                </div>
                <button className="text-primary text-[10px] font-bold uppercase tracking-widest underline underline-offset-4 hover:text-tertiary transition-colors">View</button>
              </div>
              <div className="flex gap-2 h-12">
                <div className="flex-1 rounded-xl bg-surface-container border border-primary/20 flex items-center justify-center">
                  <span className="font-label text-xs font-bold text-primary">N</span>
                </div>
                <div className="flex-1 rounded-xl bg-surface-container border border-error/20 flex items-center justify-center">
                  <span className="font-label text-xs font-bold text-error">P</span>
                </div>
                <div className="flex-1 rounded-xl bg-surface-container border border-tertiary/20 flex items-center justify-center">
                  <span className="font-label text-xs font-bold text-tertiary">K</span>
                </div>
                <div className="flex-[3] flex flex-col justify-center px-2">
                  <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden border border-outline/50">
                    <div className="w-4/5 h-full bg-primary shadow-[0_0_8px_rgba(0,255,65,0.6)]"></div>
                  </div>
                  <span className="text-[8px] mt-1 text-on-surface-variant uppercase tracking-widest font-medium">Optimal Status</span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* App Section */}
        <motion.section 
          className="space-y-2 col-span-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-surface-container/50 border border-outline/20 hover:bg-surface-container hover:border-outline/40 transition-colors group">
            <div className="flex items-center gap-4">
              <HelpCircle className="w-5 h-5 text-on-surface-variant group-hover:text-primary transition-colors" />
              <span className="font-medium text-sm">Help &amp; Support</span>
            </div>
            <ChevronRight className="w-4 h-4 text-on-surface-variant group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-surface-container/50 border border-outline/20 hover:bg-surface-container hover:border-outline/40 transition-colors group">
            <div className="flex items-center gap-4">
              <Share2 className="w-5 h-5 text-on-surface-variant group-hover:text-primary transition-colors" />
              <span className="font-medium text-sm">Share with Farmers</span>
            </div>
            <ChevronRight className="w-4 h-4 text-on-surface-variant group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-surface-container/50 border border-outline/20 hover:bg-surface-container hover:border-outline/40 transition-colors group">
            <div className="flex items-center gap-4">
              <Star className="w-5 h-5 text-on-surface-variant group-hover:text-primary transition-colors" />
              <span className="font-medium text-sm">Rate Application</span>
            </div>
            <ChevronRight className="w-4 h-4 text-on-surface-variant group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button className="w-full flex items-center justify-between p-4 rounded-2xl border border-error/20 bg-error/5 hover:bg-error/10 transition-colors group mt-4">
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
