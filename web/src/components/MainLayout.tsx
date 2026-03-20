import { Outlet, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { HomeScreen } from "./HomeScreen";
import { VoiceModeScreen } from "./VoiceModeScreen";
import { AnimatePresence, motion } from "framer-motion";

export function MainLayout() {
  const location = useLocation();
  const [chatView, setChatView] = useState<"none" | "home" | "voice">("none");

  // Navigation items based on the design
  const navItems = [
    { name: "Home", path: "/", icon: "home" },
    { name: "Crops", path: "/crops", icon: "eco" }, // Changed to eco since grass/grid_view mentioned
    { name: "Alerts", path: "/notifications", icon: "notifications" },
    { name: "Profile", path: "/profile", icon: "person" }
  ];

  return (
    <div className="relative min-h-screen w-full flex flex-col">
      {/* Route content */}
      <div className="flex-1 pb-[100px]">
        <Outlet />
      </div>

      {/* Chat FAB */}
      <button 
        onClick={() => setChatView("home")}
        className="fixed bottom-24 right-6 w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-[0_0_30px_rgba(0,255,65,0.4)] z-50 hover:scale-110 transition-transform active:scale-95"
      >
        <span className="material-symbols-outlined text-3xl font-bold" style={{ fontVariationSettings: "'FILL' 0" }}>forum</span>
      </button>

      {/* Glass Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 pb-safe">
        <div className="glass-panel border-t-0 rounded-t-3xl border-b-0 mx-2 mb-2 pb-2 shadow-2xl">
          <div className="flex justify-between items-center px-6 py-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link 
                  key={item.path} 
                  to={item.path}
                  className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
                >
                  <span 
                    className={`material-symbols-outlined ${isActive ? 'drop-shadow-[0_0_8px_rgba(0,255,65,0.5)]' : ''}`} 
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {item.icon}
                  </span>
                  <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chat UI Overlay Container - rendering above content but keeping it alive or overlapping */}
      <AnimatePresence>
        {chatView !== "none" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[60] bg-background flex flex-col"
          >
            {chatView === "home" && (
              <HomeScreen onStartVoice={() => setChatView("voice")} onClose={() => setChatView("none")} />
            )}
            {chatView === "voice" && (
              <VoiceModeScreen onClose={() => setChatView("home")} />
            )}
            {/* Provide a way to close from home if the HomeScreen doesn't have one */}
            {chatView === "home" && (
              <button 
                onClick={() => setChatView("none")}
                className="absolute top-4 right-4 z-[70] w-10 h-10 rounded-full flex items-center justify-center bg-surface-container text-on-surface border border-outline/50"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
