import type { ReactNode } from "react";
import { useTheme } from "@/hooks/useTheme";
import { MapPin, Sun, Moon, Bell } from "lucide-react";

interface TopAppBarProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  leftAction?: ReactNode;
  className?: string;
  showProfilePic?: boolean;
}

export function TopAppBar({ title, subtitle, actions, leftAction, className = "", showProfilePic = true }: TopAppBarProps) {
  const { toggleTheme, isDark } = useTheme();

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 p-4 max-w-5xl mx-auto w-full pointer-events-none transition-all duration-300 ${className}`}>
      <div className="glass-panel rounded-full px-4 py-3 flex items-center justify-between shadow-lg pointer-events-auto backdrop-blur-xl border border-outline/30 bg-surface/80">
        <div className="flex items-center gap-3">
          {leftAction}
          {showProfilePic && (
            <div 
              className="bg-surface-container rounded-full w-10 h-10 bg-center bg-cover border border-primary/20 shrink-0" 
              style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB8co6hnZPQzuwm57Rb3mWqL-pCFnYiHakTLmoOyjHBmEswzhIoy6Xh7oK2uuW8F43fhACN8VinpJ_VAQmAQdS9v40XEk3izpHwazq4BunWQjJQgl5yNii2A_ZuhfjxNjJZhC59d3foq88D5IdPb1qHwI9CoUVQxR_A3NXgSXgwTN_y3P_mQl4mnIegRDFvOHdZSrgn8ISDZaq8HrGq486-i1HCg9lQJ94TGAEJANDwzKJ0oybRM-yGoOYAygjx59gBWDtRRLzt7IFy')" }}
            >
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-headline font-bold text-sm tracking-wide text-on-surface truncate">
              {title || <><span className="text-on-surface">Namaste, Raju</span> <span className="text-primary">🌿</span></>}
            </h1>
            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-on-surface-variant font-medium mt-0.5 truncate">
              {subtitle || (
                <>
                  <MapPin className="w-3.5 h-3.5" />
                  Nashik, MH
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {actions || (
            <>
              <button
                onClick={toggleTheme}
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-surface-container text-on-surface border border-outline/50 hover:bg-primary/10 hover:border-primary/30 transition-all"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-surface-container text-on-surface relative border border-outline/50 hover:bg-on-surface/5 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

