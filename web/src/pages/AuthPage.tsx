import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "@/hooks/useTheme"
import { Sun, Moon, Leaf, Mail, Lock, Eye, EyeOff, Loader2, User } from "lucide-react"

export function AuthPage() {
  const [isSignup, setIsSignup] = useState(false)
  const { toggleTheme, isDark } = useTheme()
  const navigate = useNavigate()
  
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const validate = () => {
    if (isSignup && !name.trim()) {
      setError("Name is required")
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address")
      return false
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return false
    }
    return true
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    
    setIsLoading(true)
    setError("")

    const endpoint = isSignup ? "/auth/signup" : "/auth/login"
    try {
      const res = await fetch(`http://10.0.2.16:3001/api/v0${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: isSignup ? name : undefined, email, password }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed")
      }

      if (data.success) {
        localStorage.setItem("userId", data.user.id)
        localStorage.setItem("userEmail", data.user.email)
        localStorage.setItem("userName", data.user.name)
        
        if (isSignup || !data.user.onboarded) {
          navigate("/onboarding")
        } else {
          navigate("/")
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-transparent text-on-surface font-body overflow-hidden selection:bg-primary selection:text-on-primary antialiased min-h-[100dvh] flex flex-col">
      {/* Hero Background Layer */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="firefly top-1/4 left-1/4 opacity-40"></div>
        <div className="firefly top-1/3 right-1/4 opacity-50"></div>
        <div className="firefly top-1/2 left-1/2 opacity-30"></div>
      </div>

      <header className="relative z-20 flex justify-end p-6 max-w-lg mx-auto w-full">
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container text-on-surface border border-outline/50 shadow-lg hover:bg-primary/10 transition-all"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 max-w-lg md:max-w-4xl mx-auto text-center w-full">
        {/* Responsive Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center w-full">
          {/* Left Side: Brand/Value Prop (Desktop Only) */}
          <div className="hidden md:flex flex-col items-start text-left space-y-6">
            <div className="relative">
              <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full"></div>
              <div className="relative w-20 h-20 flex items-center justify-center bg-surface-container border border-primary/20 rounded-[28px] rotate-45 transform glow-aura">
                <Leaf className="w-10 h-10 text-primary -rotate-45 fill-primary" />
              </div>
            </div>
            <div>
              <h1 className="font-brand text-6xl font-bold tracking-tight text-on-surface glow-text mb-4">
                KrishiMitra
              </h1>
              <p className="text-xl text-on-surface-variant font-medium max-w-sm">
                Empowering India's Farmers with AI-Driven Intelligence and Real-Time Insights.
              </p>
            </div>
            <div className="flex gap-4">
               <div className="flex flex-col p-4 glass-panel rounded-2xl border-primary/10">
                  <span className="text-2xl font-bold text-primary">1M+</span>
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">Active Farmers</span>
               </div>
               <div className="flex flex-col p-4 glass-panel rounded-2xl border-primary/10">
                  <span className="text-2xl font-bold text-primary">24/7</span>
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">Expert Support</span>
               </div>
            </div>
          </div>

          {/* Right Side: Auth Form */}
          <div className="w-full">
            <div className="md:hidden relative mb-8 flex flex-col items-center">
              <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full"></div>
              <div className="relative w-20 h-20 flex items-center justify-center bg-surface-container border border-primary/20 rounded-[28px] rotate-45 transform glow-aura mb-4">
                <Leaf className="w-10 h-10 text-primary -rotate-45 fill-primary" />
              </div>
              <h1 className="font-brand text-4xl font-bold tracking-tight text-on-surface glow-text mb-2">
                KrishiMitra
              </h1>
              <p className="text-on-surface-variant font-medium">
                Empowering Farmers with Intelligence
              </p>
            </div>

        <motion.div 
          className="w-full glass-panel rounded-[40px] p-8 shadow-2xl border border-primary/10 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <form onSubmit={handleAuth} className="space-y-6">
            <h2 className="text-2xl font-bold text-on-surface mb-2">
              {isSignup ? "Create Account" : "Welcome Back"}
            </h2>
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-error/10 border border-error/20 text-error text-sm rounded-xl py-2 px-4"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-4">
              {/* Name Input (Signup only) */}
              <AnimatePresence>
                {isSignup && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="relative text-left group overflow-hidden"
                  >
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                    <input 
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full bg-surface-container-highest border border-outline/50 rounded-2xl py-4 pl-12 pr-4 text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                      required={isSignup}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Input */}
              <div className="relative text-left group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full bg-surface-container-highest border border-outline/50 rounded-2xl py-4 pl-12 pr-4 text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="relative text-left group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-surface-container-highest border border-outline/50 rounded-2xl py-4 pl-12 pr-12 text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-4 flex items-center text-on-surface-variant hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-on-primary font-bold py-4 rounded-2xl shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isSignup ? "Creating Account..." : "Signing In..."}
                </>
              ) : (
                isSignup ? "Create Account" : "Sign In"
              )}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-2 text-sm">
            <span className="text-on-surface-variant">
              {isSignup ? "Already have an account?" : "Don't have an account?"}
            </span>
            <button 
              onClick={() => {
                setIsSignup(!isSignup)
                setError("")
              }}
              className="text-primary font-bold hover:underline underline-offset-4"
            >
              {isSignup ? "Sign In" : "Sign Up"}
            </button>
          </div>
            </motion.div>
          </div>
        </div>

        <p className="text-[10px] text-on-surface-variant/60 max-w-[280px]">
          By continuing, you agree to KrishiMitra's 
          <a href="#" className="hover:text-primary transition-colors mx-1">Terms</a> & 
          <a href="#" className="hover:text-primary transition-colors mx-1">Privacy</a>
        </p>
      </main>
    </div>
  )
}
