import { Outlet, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { HomeScreen } from "./HomeScreen";
import { VoiceModeScreen } from "./VoiceModeScreen";
import { AnimatePresence, motion } from "framer-motion";
import { Home, Leaf, Bell, User, MessageSquare } from "lucide-react";

export function MainLayout() {
  const location = useLocation();
  const [chatView, setChatView] = useState<"none" | "home" | "voice">("none");

  // Navigation items based on the design
  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Crops", path: "/crops", icon: Leaf },
    { name: "Alerts", path: "/notifications", icon: Bell },
    { name: "Profile", path: "/profile", icon: User }
  ];

  return (
    <div className="relative h-[100dvh] w-full flex flex-col overflow-hidden">
      {/* Route content */}
      <div className={`flex-1 min-h-0 ${chatView === "none" ? "overflow-y-auto pb-[100px]" : "overflow-hidden"}`}>
        <AnimatePresence mode="wait">
          {chatView === "none" ? (
            <motion.div
              key="page-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full w-full"
            >
              <Outlet />
            </motion.div>
          ) : (
            <motion.div
              key="chat-content"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="h-[100dvh] bg-background flex flex-col overflow-hidden z-50 w-full"
            >
              {chatView === "home" && (
                <HomeScreen onStartVoice={() => setChatView("voice")} onClose={() => setChatView("none")} />
              )}
              {chatView === "voice" && (
                <VoiceModeScreen onClose={() => setChatView("home")} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chat FAB */}
      <AnimatePresence>
        {chatView === "none" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.8 }} 
            className="fixed bottom-24 left-0 right-0 z-50 pointer-events-none flex justify-end px-6 max-w-7xl mx-auto"
          >
            <button 
              onClick={() => setChatView("home")}
              className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-[0_0_30px_rgba(0,255,65,0.4)] pointer-events-auto hover:scale-110 transition-transform active:scale-95"
            >
              <MessageSquare className="w-8 h-8 fill-current" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glass Bottom Navigation */}
      <AnimatePresence>
        {chatView === "none" && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 50 }} 
            className="fixed bottom-0 left-0 right-0 z-40 pb-safe pointer-events-none flex justify-center w-full"
          >
            <div className="glass-panel border-t-0 rounded-t-3xl border-b-0 w-full max-w-md mx-2 mb-2 pb-2 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] bg-surface/80 backdrop-blur-xl pointer-events-auto">
              <div className="flex justify-between items-center px-6 py-3">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link 
                      key={item.path} 
                      to={item.path}
                      className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
                    >
                      <Icon 
                        className={`w-6 h-6 ${isActive ? 'drop-shadow-[0_0_8px_rgba(0,255,65,0.5)]' : ''}`} 
                        fill={isActive ? "currentColor" : "none"}
                      />
                      <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
