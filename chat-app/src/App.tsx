import { useState } from "react"
import { HomeScreen } from "./components/HomeScreen"
import { VoiceModeScreen } from "./components/VoiceModeScreen"

export default function App() {
  const [view, setView] = useState<"home" | "voice">("home")

  return (
    <div className="w-full h-[100dvh] bg-black text-white relative font-['DM_Sans'] flex justify-center items-center">
      {/* Full width layout without max constraints */}
      <div className="w-full h-full relative overflow-hidden bg-black flex flex-col">
        {view === "home" && <HomeScreen onStartVoice={() => setView("voice")} />}
        {view === "voice" && <VoiceModeScreen onClose={() => setView("home")} />}
      </div>
    </div>
  )
}
