import { Link } from "react-router-dom"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export function AuthPage() {
  const [activeLang, setActiveLang] = useState("English")
  const [otpVisible, setOtpVisible] = useState(false)
  const languages = ["हिंदी", "मराठी", "ਪੰਜਾਬੀ", "தமிழ்", "English"]

  return (
    <div className="bg-background text-on-surface font-body overflow-hidden selection:bg-primary selection:text-on-primary antialiased min-h-[100dvh]">
      {/* Hero Background Layer */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="firefly top-1/4 left-1/4" style={{ opacity: 0.4 }}></div>
        <div className="firefly top-1/3 right-1/4" style={{ opacity: 0.5 }}></div>
        <div className="firefly top-1/2 left-1/2" style={{ opacity: 0.3 }}></div>
        <div className="firefly bottom-1/3 left-10" style={{ opacity: 0.4 }}></div>
        <div className="firefly bottom-1/4 right-20" style={{ opacity: 0.2 }}></div>
      </div>

      {/* Top Utility Area */}
      <header className="relative z-20 flex flex-col gap-4 p-6 max-w-lg mx-auto">
        <div className="flex justify-between items-center">
          <div className="w-10"></div>
          {/* Dark Mode Toggle */}
          <button className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container text-on-surface border border-outline/50 shadow-lg">
            <span className="material-symbols-outlined text-[20px]">dark_mode</span>
          </button>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
          {languages.map((lang) => (
            <button 
              key={lang}
              onClick={() => setActiveLang(lang)}
              className={`flex-none px-5 py-2 glass-panel rounded-full text-sm font-medium transition-all ${
                activeLang === lang 
                  ? "border-primary/40 bg-primary/10 text-primary glow-aura" 
                  : "text-on-surface-variant hover:bg-white/5"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </header>

      {/* Main Branding Content */}
      <main className="relative z-10 flex flex-col items-center justify-center pt-8 px-6 max-w-lg mx-auto text-center h-[40vh]">
        {/* Logo */}
        <div className="relative mb-6">
          <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full"></div>
          <div className="relative w-24 h-24 flex items-center justify-center bg-surface-container border border-primary/20 rounded-[32px] rotate-45 transform glow-aura">
            <span className="material-symbols-outlined text-primary text-5xl -rotate-45" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
          </div>
        </div>

        {/* Wordmark */}
        <motion.h1 
          className="font-brand text-5xl font-bold tracking-tight text-on-surface glow-text mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          KrishiMitra
        </motion.h1>

        {/* Tagline */}
        <motion.p 
          className="font-hindi text-lg text-on-surface-variant tracking-wide font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          Your Smart Farming Companion
        </motion.p>
      </main>

      {/* Login Bottom Sheet */}
      <motion.section 
        className="fixed inset-x-0 bottom-0 z-50 max-w-lg mx-auto"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.5 }}
      >
        <div className="glass-panel rounded-t-[40px] px-8 pt-8 pb-10 flex flex-col gap-6 shadow-[0_-20px_80px_rgba(0,0,0,0.8)] border-t border-primary/20">
          {/* Handle Decor */}
          <div className="w-12 h-1.5 bg-primary/20 rounded-full mx-auto mb-2"></div>

          <div className="space-y-1 text-left">
            <h2 className="text-2xl font-headline font-bold text-on-surface">Welcome back</h2>
            <p className="text-on-surface-variant font-body">Enter your mobile number to get started</p>
          </div>

          {!otpVisible ? (
            <AnimatePresence mode="wait">
              <motion.div 
                key="phone"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Mobile Input Field */}
                <div className="relative group text-left">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-container rounded-lg text-sm font-label text-primary border border-primary/20">
                        +91
                    </span>
                  </div>
                  <input 
                    className="w-full bg-surface-container-highest border border-outline/50 rounded-2xl py-4 pl-24 pr-4 px-4 text-on-surface font-body focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-outline" 
                    maxLength={10} 
                    placeholder="Mobile Number" 
                    type="tel"
                  />
                  <label className="absolute -top-3 left-6 px-2 bg-surface text-[10px] font-bold uppercase tracking-widest font-label text-primary border border-primary/20 rounded">
                      Mobile Number
                  </label>
                </div>
                
                {/* Primary Action */}
                <button 
                  onClick={() => setOtpVisible(true)}
                  className="w-full bg-primary text-on-primary font-headline font-bold py-4 rounded-full shadow-[0_0_30px_rgba(0,255,65,0.4)] hover:scale-[1.02] active:scale-95 transition-transform"
                >
                    Get OTP
                </button>
              </motion.div>
            </AnimatePresence>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div 
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* OTP Entry Area */}
                <div className="space-y-4">
                  <div className="flex justify-between gap-2">
                    {[1,2,3,4,5,6].map(i => (
                      <input 
                        key={i}
                        className="w-[14%] aspect-[3/4] bg-surface-container-highest border border-outline/50 rounded-xl text-center text-xl font-label text-primary focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all px-0" 
                        maxLength={1} 
                        placeholder="-" 
                        type="text"
                      />
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-xs font-label px-1">
                    <span className="text-on-surface-variant font-medium">Resend OTP in <span className="text-primary font-bold">0:45</span></span>
                  </div>
                </div>

                <Link 
                  to="/"
                  className="block w-full text-center bg-primary text-on-primary font-headline font-bold py-4 rounded-full shadow-[0_0_30px_rgba(0,255,65,0.4)] hover:scale-[1.02] active:scale-95 transition-transform"
                >
                    Verify & Login
                </Link>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Links & Legal */}
          <div className="flex flex-col items-center gap-6 mt-2">
            <Link className="text-on-surface-variant font-medium hover:text-primary transition-colors text-sm underline underline-offset-4 decoration-outline" to="/">
                Continue as Guest
            </Link>
            <p className="text-[10px] text-center text-on-surface-variant/60 leading-relaxed max-w-[280px] font-medium">
                By continuing, you agree to KrishiMitra's 
                <a className="text-on-surface-variant hover:text-primary transition-colors ml-1" href="#">Terms of Service</a> &amp; 
                <a className="text-on-surface-variant hover:text-primary transition-colors ml-1" href="#">Privacy Policy</a>
            </p>
          </div>
        </div>
      </motion.section>
    </div>
  )
}
