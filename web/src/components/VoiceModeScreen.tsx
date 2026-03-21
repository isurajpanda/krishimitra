import { ArrowLeft } from "lucide-react"
import { TopAppBar } from "@/components/TopAppBar"
import { useVoiceChat } from "../hooks/useVoiceChat"
import { useEffect, useMemo, useRef } from "react"

const CSS = `
@keyframes idle-breathe {
  0%   { transform: scaleX(0.15) scaleY(1); opacity: 0.15; }
  100% { transform: scaleX(0.4)  scaleY(1); opacity: 0.4; }
}
@keyframes speaking-pulse {
  0%   { transform: scaleX(0.4) scaleY(1); opacity: 0.6; }
  100% { transform: scaleX(1.0) scaleY(1); opacity: 1.0; }
}
.bar-idle {
  animation: idle-breathe var(--dur) ease-in-out infinite alternate;
}
.bar-speaking {
  animation: speaking-pulse var(--dur) ease-in-out infinite alternate;
}
`;

interface VoiceModeScreenProps {
  onClose: () => void
}

export function VoiceModeScreen({ onClose }: VoiceModeScreenProps) {
  const {
    isListening,
    isProcessing,
    isSpeaking,
    transcript,
    fullText,
    micVolumeRef,
    startVoiceRecording,
    stopVoiceRecording
  } = useVoiceChat()

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVoiceRecording()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleRecording = () => {
    if (isListening) stopVoiceRecording();
    else startVoiceRecording();
  }

  const userName = localStorage.getItem("userName") || "Farmer";
  const displayTitle = fullText || transcript || "Listening..."
  const orbState = isSpeaking ? 'speaking' : isListening ? 'listening' : 'idle';

  // Fixed per-bar offsets for randomized look that stays stable across renders
  const NUM_BARS = 48;
  const barMeta = useMemo(() => Array.from({ length: NUM_BARS }).map(() => ({
    baseLen: 8 + Math.random() * 14,   // base length in px when quiet
    maxLen:  32 + Math.random() * 28,  // max length in px when loud
    delay:   Math.random() * -1 + 's',
    dur:     0.25 + Math.random() * 0.35 + 's',
    phase:   Math.random() * Math.PI * 2,
  })), []);

  // Canvas-based orb bars driven by live mic volume
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef   = useRef<number>(0);

  useEffect(() => {
    let t = 0;
    const paint = () => {
      t += 0.05;
      const vol = micVolumeRef.current;          // 0..1 live mic RMS

      barRefs.current.forEach((el, i) => {
        if (!el) return;
        const meta = barMeta[i];
        let w: number;

        if (isListening) {
          // React to mic: each bar wobbles at its own phase based on mic volume
          const wave = 0.5 + 0.5 * Math.sin(t + meta.phase);
          w = meta.baseLen + (meta.maxLen - meta.baseLen) * (vol * 0.8 + wave * 0.2 * vol);
          w = Math.max(meta.baseLen * 0.3, w);
        } else if (isSpeaking) {
          // Speaking: animated cos wave — each bar gets its own pseudo-random bounce
          const wave = 0.5 + 0.5 * Math.cos(t * 1.5 + meta.phase);
          w = meta.baseLen + (meta.maxLen - meta.baseLen) * wave;
        } else {
          // Idle: very soft breathe
          const wave = 0.5 + 0.5 * Math.sin(t * 0.4 + meta.phase);
          w = 4 + wave * 8;
        }

        el.style.width = `${w}px`;
      });

      rafRef.current = requestAnimationFrame(paint);
    };

    rafRef.current = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isListening, isSpeaking, barMeta, micVolumeRef]);

  return (
    <div className="flex flex-col h-full w-full relative z-[65] px-4 py-8 md:px-12 lg:px-16 pt-24 md:pt-28 max-w-[1400px] mx-auto overflow-hidden">
      <style>{CSS}</style>

      {/* Universal TopAppBar */}
      <TopAppBar 
        className="z-[70]"
        showProfilePic={false}
        title={<></>}
        subtitle={<></>}
        leftAction={
          <button
            onClick={onClose}
            className="w-10 h-10 shrink-0 rounded-full bg-surface-container border border-outline/50 flex flex-col items-center justify-center hover:bg-on-surface/10 transition-colors mr-2 text-on-surface"
          >
            <ArrowLeft className="w-5 h-5 flex-shrink-0" />
          </button>
        }
        actions={
          <div className="flex items-center gap-3">
             <div className="text-right">
               <div className="text-sm font-bold tracking-wide">Namaste, {userName}</div>
               <div className="text-[10px] text-primary tracking-widest uppercase">{orbState}</div>
             </div>
             <div 
               className="bg-surface-container rounded-full w-10 h-10 bg-center bg-cover border border-primary/20 shrink-0 shadow-[0_0_15px_rgba(0,255,65,0.2)]" 
               style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB8co6hnZPQzuwm57Rb3mWqL-pCFnYiHakTLmoOyjHBmEswzhIoy6Xh7oK2uuW8F43fhACN8VinpJ_VAQmAQdS9v40XEk3izpHwazq4BunWQjJQgl5yNii2A_ZuhfjxNjJZhC59d3foq88D5IdPb1qHwI9CoUVQxR_A3NXgSXgwTN_y3P_mQl4mnIegRDFvOHdZSrgn8ISDZaq8HrGq486-i1HCg9lQJ94TGAEJANDwzKJ0oybRM-yGoOYAygjx59gBWDtRRLzt7IFy')" }}
             >
             </div>
          </div>
        }
      />

      {/* Flowing Text Area */}
      <div className="flex-1 overflow-y-auto w-full pt-4 md:pt-10 md:max-w-4xl md:mx-auto z-20 scrollbar-thin flex flex-col items-center justify-start text-center">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-light leading-[1.6] md:leading-[1.7] tracking-wide text-on-surface transition-all duration-300">
          {displayTitle}
        </h1>
        {isProcessing && !fullText && (
           <p className="mt-4 md:mt-8 text-lg md:text-xl text-primary font-medium leading-[1.4] animate-pulse">
             Processing...
           </p>
        )}
      </div>

      {/* Listening status and Orb */}
      <div className="h-[250px] md:h-[350px] w-full flex flex-col items-center justify-end relative pb-10 md:pb-16 mt-auto shrink-0">
        <div className={`text-on-surface/60 text-sm md:text-base font-medium mb-12 md:mb-16 transition-opacity duration-300 ${isListening ? 'animate-pulse opacity-100' : 'opacity-0'}`}>
          {isProcessing ? 'Thinking...' : 'Tap orb to stop'}
        </div>

        {/* Glow behind orb */}
        <div className={`absolute top-[40%] md:top-[30%] w-[150px] md:w-[250px] h-[150px] md:h-[250px] rounded-full blur-[80px] md:blur-[100px] mix-blend-screen pointer-events-none transition-all duration-[2s] ${orbState === 'speaking' ? 'bg-primary opacity-30 scale-125' : orbState === 'listening' ? 'bg-primary opacity-20 scale-100' : 'bg-primary opacity-10 scale-90'}`} />

        {/* Central Orb */}
        <button
          onClick={toggleRecording}
          className="relative w-24 h-24 md:w-32 md:h-32 rounded-full z-10 flex items-center justify-center transition-all duration-300 outline-none group cursor-pointer"
        >
           {/* Inner Sphere */}
           <div className={`absolute inset-0 rounded-full transition-all duration-1000 ${orbState === 'speaking' ? 'shadow-[0_0_60px_rgba(0,255,65,0.6)]' : orbState === 'listening' ? 'shadow-[0_0_40px_rgba(0,255,65,0.4)] animate-pulse' : 'opacity-60 grayscale'}`}
             style={{
               background: orbState === 'speaking'
                  ? 'radial-gradient(circle at 30% 30%, #80FFB4 0%, #00FF41 40%, #003d10 100%)'
                  : 'radial-gradient(circle at 30% 30%, #D0FFD0 0%, #00FF41 40%, #003d10 100%)',
               boxShadow: 'inset -15px -15px 30px rgba(0,0,0,0.6), inset 15px 15px 30px rgba(255,255,255,0.8)'
             }}
           />

           {/* Audio Lines Radiating Outward — driven by live mic volume */}
           <div className="absolute w-[300%] h-[300%] pointer-events-none origin-center">
             {barMeta.map((bar, i) => (
               <div key={i} className="absolute top-1/2 left-1/2 origin-left" style={{
                 transform: `rotate(${i * (360 / NUM_BARS)}deg) translate(${orbState === 'idle' ? '40px' : '52px'}, -50%)`,
               }}>
                  <div
                    ref={(el) => { barRefs.current[i] = el; }}
                    className={`h-[2px] md:h-[3px] rounded-full transition-colors duration-500 origin-left
                      ${orbState === 'idle' ? 'bg-on-surface/20' :
                        orbState === 'listening' ? 'bg-primary shadow-[0_0_8px_rgba(0,255,65,0.9)]' :
                        'bg-tertiary shadow-[0_0_12px_rgba(128,255,180,0.9)]'}
                    `}
                    style={{
                      width: `${bar.baseLen}px`,
                      animationDelay: bar.delay,
                      '--dur': bar.dur,
                    } as React.CSSProperties}
                  />
               </div>
             ))}
           </div>
        </button>
      </div>
    </div>
  )
}
