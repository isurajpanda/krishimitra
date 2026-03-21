import { useState, useRef, useCallback, useEffect } from "react";
import { WS_BASE_URL } from "@/config";

const SERVER_WS_URL = `${WS_BASE_URL}/voice`;
const PLAYBACK_PREBUFFER_COUNT = 10;
const AUDIO_START_OFFSET = 0.3;

// Globally cache greetings so they play with absolutely zero network/decoding latency
const GREETINGS_CACHE: Record<string, HTMLAudioElement> = {
  en: new Audio("/audio/greeting_en.mp3"),
  hi: new Audio("/audio/greeting_hi.mp3"),
  or: new Audio("/audio/greeting_or.mp3"),
};
(Object.values(GREETINGS_CACHE)).forEach(a => a.preload = "auto");

export function useVoiceChat() {
  const [isListening, setIsListeningState] = useState(false);
  const isListeningRef = useRef(false);
  const isSpeakingRef = useRef(false);
  
  const setIsListening = useCallback((val: boolean) => {
     isListeningRef.current = val;
     setIsListeningState(val);
  }, []);

  const [isSpeaking, setIsSpeakingState] = useState(false);
  const setIsSpeaking = useCallback((val: boolean) => {
      isSpeakingRef.current = val;
      setIsSpeakingState(val);
  }, []);

  const [isProcessing, setIsProcessingState] = useState(false);
  const isProcessingRef = useRef(false);
  const setIsProcessing = useCallback((val: boolean) => {
       isProcessingRef.current = val;
       setIsProcessingState(val);
  }, []);

  const [isGreeting, setIsGreeting] = useState(false);

  const [transcript, setTranscript] = useState("");
  const [fullText, setFullText] = useState("");
  const [shouldAutoStart, setShouldAutoStart] = useState(false);

  // Derive a single stable phase string for the UI
  const phase = isGreeting ? 'greeting' 
              : isSpeaking ? 'speaking' 
              : isProcessing ? 'processing' 
              : isListening ? 'listening' 
              : 'idle';

  const ttsDoneRef = useRef(false);
  const chunksPlayingRef = useRef(0);
  const micVolumeRef = useRef(0);
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const latestTranscriptRef = useRef("");
  const activeSourcesRef = useRef<(AudioBufferSourceNode | HTMLAudioElement)[]>([]);
  const activeGreetingRef = useRef<HTMLAudioElement | null>(null);
  const prebufferRef = useRef<AudioBuffer[]>([]);
  const prebufferStartedRef = useRef(false);

  // ── Helpers ───────────────────────────────────────────────────────────────
  
  const _log = useCallback((level: 'info'|'warn'|'error', msg: string, data?: any) => {
      const ts = new Date().toISOString();
      const user = localStorage.getItem("userName") || localStorage.getItem("userId") || "unknown";
      const prefix = `[${ts}] [U:${user}] [VoiceChat]`;
      if (level === 'error') console.error(prefix, msg, data || '');
      else if (level === 'warn') console.warn(prefix, msg, data || '');
      else console.log(prefix, msg, data || '');
  }, []);

  const _ensureAudioCtx = async () => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioCtxRef.current = ctx;
      nextStartTimeRef.current = 0;
      
      const silentBuf = ctx.createBuffer(1, 1, 24000);
      const src = ctx.createBufferSource();
      src.buffer = silentBuf;
      src.connect(ctx.destination);
      src.start(0);
      _log('info', 'AudioContext warmed up');
    }
    
    if (audioCtxRef.current.state === "suspended") {
      await audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const stopPlayback = useCallback(() => {
    _log('info', `stopPlayback invoked (Manual stop)`);
    activeSourcesRef.current.forEach(source => {
      try {
        if (source instanceof AudioBufferSourceNode) {
          source.stop();
          source.disconnect();
        } else if (source instanceof HTMLAudioElement) {
          source.pause();
          source.currentTime = 0;
        }
      } catch (e) { /* ignore */ }
    });
    activeSourcesRef.current = [];
    prebufferRef.current = [];
    chunksPlayingRef.current = 0;
    if (activeGreetingRef.current) {
       activeGreetingRef.current.pause();
       activeGreetingRef.current = null;
    }
    setIsSpeaking(false);
  }, [setIsSpeaking, _log]);

  const playLocalGreeting = useCallback(() => {
    const lang = localStorage.getItem("userLanguage") || "en";
    let fileKey = "en";
    let text = "Hello! I am KrishiMitra. Your smart farming assistant. How can I help you today?";
    
    if (lang.includes("hi")) {
      fileKey = "hi";
      text = "नमस्ते! मैं कृषिमित्र हूँ। आपका स्मार्ट खेती सहायक। आज मैं आपकी कैसे मदद कर सकता हूँ?";
    } else if (lang.includes("or") || lang.includes("od")) {
      fileKey = "or";
      text = "ନମସ୍କାର! ମୁଁ କୃଷିମିତ୍ର। ଆପଣଙ୍କ ସ୍ୱାମାର୍ଟ ଚାଷ ସହାୟକ। ଆଜି ମୁଁ କିପରି ଆପଣଙ୍କୁ ସହାୟ କରିପାରିବି?";
    }
    
    setFullText(text);

    const audio = GREETINGS_CACHE[fileKey] || GREETINGS_CACHE["en"];
    audio.pause();
    audio.currentTime = 0;
    
    setIsGreeting(true);
    activeGreetingRef.current = audio;
    activeSourcesRef.current.push(audio);

    return new Promise<void>((resolve) => {
      audio.onended = () => {
        activeGreetingRef.current = null;
        activeSourcesRef.current = activeSourcesRef.current.filter(a => a !== audio);
        setIsGreeting(false);
        resolve();
      };
      audio.onerror = (e) => {
        _log('error', "Greeting play failed:", e);
        activeGreetingRef.current = null;
        activeSourcesRef.current = activeSourcesRef.current.filter(a => a !== audio);
        setIsGreeting(false);
        resolve();
      };
      audio.play().catch((e) => {
        _log('error', "Greeting play failed:", e);
        activeGreetingRef.current = null;
        setIsGreeting(false);
        resolve();
      });
    });
  }, [setFullText, setIsSpeaking, _log]);

  const _scheduleBuffer = (ctx: AudioContext, audioBuffer: AudioBuffer) => {
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    const startAt = Math.max(ctx.currentTime + 0.05, nextStartTimeRef.current);
    source.start(startAt);
    nextStartTimeRef.current = startAt + audioBuffer.duration;

    activeSourcesRef.current.push(source);
    chunksPlayingRef.current++;
    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
      chunksPlayingRef.current--;
      _checkAudioFinished();
    };
  };

  const _checkAudioFinished = useCallback(() => {
    if (ttsDoneRef.current && chunksPlayingRef.current === 0) {
        setIsSpeaking(false);
        setIsProcessing(false);
        setShouldAutoStart(true);
    }
  }, [setIsSpeaking]);

  const _flushPrebuffer = async () => {
    const ctx = await _ensureAudioCtx();
    const now = ctx.currentTime;
    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now + AUDIO_START_OFFSET);
    for (const buf of prebufferRef.current) {
      _scheduleBuffer(ctx, buf);
    }
    prebufferRef.current = [];
  };

  const _enqueueAudio = async (base64: string) => {
    try {
      const ctx = await _ensureAudioCtx();
      const binary = atob(base64);
      const buffer = new ArrayBuffer(binary.length);
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      const numSamples = binary.length / 2;
      const audioBuffer = ctx.createBuffer(1, numSamples, 24000);
      const channelData = audioBuffer.getChannelData(0);
      const dataView = new DataView(buffer);
      const gain = 3.5;
      for (let i = 0; i < numSamples; i++) {
        const floatSample = dataView.getInt16(i * 2, true) / 32768.0;
        channelData[i] = Math.max(-1, Math.min(1, floatSample * gain));
      }

      if (!prebufferStartedRef.current) {
        prebufferRef.current.push(audioBuffer);
        if (prebufferRef.current.length >= PLAYBACK_PREBUFFER_COUNT) {
          prebufferStartedRef.current = true;
          _flushPrebuffer();
        }
      } else {
        _scheduleBuffer(ctx, audioBuffer);
      }
    } catch (e) {
      _log('warn', 'Could not decode audio chunk:', e);
    }
  };

  // ── WebSocket Logic ───────────────────────────────────────────────────────

  const getWS = useCallback((): Promise<WebSocket> => {
    return new Promise((resolve) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        resolve(wsRef.current);
        return;
      }
      const ws = new WebSocket(SERVER_WS_URL);
      ws.onmessage = (event) => {
        let msg: any;
        try { msg = JSON.parse(event.data); } catch { return; }

        switch (msg.type) {
          case "llm_start":
            if (activeGreetingRef.current) {
                 activeGreetingRef.current.pause();
                 activeGreetingRef.current = null;
                 setIsGreeting(false);
            }
            setIsProcessing(true);
            setFullText("");
            ttsDoneRef.current = false;
            chunksPlayingRef.current = 0;
            prebufferRef.current = [];
            prebufferStartedRef.current = false;
            break;
          case "llm_token":
            if (activeGreetingRef.current) {
                 activeGreetingRef.current.pause();
                 activeGreetingRef.current = null;
                 setIsGreeting(false);
            }
            setIsProcessing(false);
            setIsSpeaking(true);
            setFullText((prev) => prev + msg.text);
            break;
          case "tts_done":
            if (!prebufferStartedRef.current && prebufferRef.current.length > 0) {
              prebufferStartedRef.current = true;
              _flushPrebuffer();
            }
            ttsDoneRef.current = true;
            _checkAudioFinished();
            break;
          case "llm_replace":
            setFullText(msg.text || "");
            break;
          case "stt_interim":
            setTranscript(msg.text);
            latestTranscriptRef.current = msg.text;
            break;
          case "audio_chunk":
            if (activeGreetingRef.current) {
                 activeGreetingRef.current.pause();
                 activeGreetingRef.current = null;
                 setIsGreeting(false);
            }
            _enqueueAudio(msg.audio);
            break;
          case "stt_auto_stop":
            _log('info', 'Received stt_auto_stop from server');
            handleAutoStop();
            setIsProcessing(true);
            break;
          case "error":
            _log('error', 'Server WS error:', msg.message);
            setIsProcessing(false);
            setIsSpeaking(false);
            if (msg.message) setFullText("⚠️ " + msg.message);
            break;
        }
      };
      ws.onerror = (e) => _log('error', 'Connection error', e);
      ws.onclose = () => { 
        _log('info', 'Connection closed');
        wsRef.current = null; 
      };
      ws.onopen = () => { 
        _log('info', 'Connection opened successfully');
        resolve(ws); 
      };
      wsRef.current = ws;
    });
  }, [_checkAudioFinished, _log]);

  // ── Interaction Logic ─────────────────────────────────────────────────────

  const micStreamRef = useRef<MediaStream | null>(null);
  const micAudioCtxRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);

  const startVoiceRecording = useCallback(async () => {
    // Rely on mic stream to prevent double starts
    if (micStreamRef.current?.active) return;
    
    // Explicitly lock state immediately to prevent multi-click races
    setIsListening(false);
    setIsProcessing(false);
    setIsSpeaking(false);
    setTranscript("");
    setFullText("");
    setShouldAutoStart(false);

    try {
      if (!window.isSecureContext) throw new Error("Requires HTTPS or localhost.");
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Mic not supported.");

      // Pre-seed the exact greeting text so the UI doesn't flash "Speaking..."
      const lang = localStorage.getItem("userLanguage") || "en";
      let text = "Hello! I am KrishiMitra. Your smart farming assistant. How can I help you today?";
      if (lang.includes("hi")) text = "नमस्ते! मैं कृषिमित्र हूँ। आपका स्मार्ट खेती सहायक। आज मैं आपकी कैसे मदद कर सकता हूँ?";
      else if (lang.includes("or") || lang.includes("od")) text = "ନମସ୍କାର! ମୁଁ କୃଷିମିତ୍ର। ଆପଣଙ୍କ ସ୍ୱାମାର୍ଟ ଚାଷ ସହାୟକ। ଆଜି ମୁଁ କିପରି ଆପଣଙ୍କୁ ସହାୟ କରିପାରିବି?";
      
      setFullText(text);

      // Force UI to greeting mask while OS provisions microphone
      setIsGreeting(true);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Start local greeting immediately AFTER hardware is locked so it doesn't get chopped by OS interrupts
      const greetingFinishedPromise = playLocalGreeting();

      await _ensureAudioCtx();
      ttsDoneRef.current = false;
      chunksPlayingRef.current = 0;
      prebufferRef.current = [];
      prebufferStartedRef.current = false;

      getWS(); // Pre-connect

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      micAudioCtxRef.current = audioCtx;
      micStreamRef.current = stream;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);

      const freqData = new Uint8Array(analyser.frequencyBinCount);
      const pollVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(freqData);
        let sum = 0;
        for (let i = 0; i < freqData.length; i++) sum += freqData[i];
        const rms = Math.min(1, (sum / freqData.length) / 128);
        micVolumeRef.current = rms;
        animFrameRef.current = requestAnimationFrame(pollVolume);
      };
      animFrameRef.current = requestAnimationFrame(pollVolume);

      const ws = await getWS();
      let sttStartedHere = false;
      
      // Let's handle processor logic first
      processor.onaudioprocess = (e) => {
        if (!isListeningRef.current) return;
        // Critically: Do not send mic data to STT backend while the local greeting is actively playing!
        // This prevents the silence timeout that was causing the "chopped" last bits.
        if (activeGreetingRef.current) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const buffer = new ArrayBuffer(inputData.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
        const binary = Array.from(new Uint8Array(buffer)).map(b => String.fromCharCode(b)).join('');
        const base64 = btoa(binary);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "stt_audio", audio: base64 }));
        }
      };

      const gainNode = audioCtx.createGain();
      gainNode.gain.value = 0;
      source.connect(processor);
      processor.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      // Now wait and trigger STT start after greeting (unless barge-in already did)
      await greetingFinishedPromise;
      if (!sttStartedHere && ws.readyState === WebSocket.OPEN && micStreamRef.current?.active) {
         sttStartedHere = true;
         _log('info', 'Sending stt_start after greeting completion');
         setIsListening(true);
         ws.send(JSON.stringify({ 
             type: "stt_start", 
             userId: localStorage.getItem("userId"),
             greetingText: text
         }));
      }

    } catch (e: any) {
      _log('error', 'Mic/STT error:', e);
      setIsListening(false);
      setIsGreeting(false);
      setIsSpeaking(false);
      if (e.name !== "NotAllowedError") alert(`Mic Error: ${e.message}`);
    }
  }, [getWS, playLocalGreeting, stopPlayback, setIsListening, _log]);

  const handleAutoStop = useCallback(() => {
    setIsListening(false);
    prebufferStartedRef.current = false;
    chunksPlayingRef.current = 0;
    prebufferRef.current = [];
  }, [setIsListening]);

  const teardownMic = useCallback(() => {
    setIsListening(false);
    setShouldAutoStart(false);
    cancelAnimationFrame(animFrameRef.current);
    micVolumeRef.current = 0;
    micStreamRef.current?.getTracks().forEach(t => t.stop());
    micStreamRef.current = null;
    scriptProcessorRef.current?.disconnect();
    scriptProcessorRef.current = null;
    analyserRef.current?.disconnect();
    analyserRef.current = null;
    micAudioCtxRef.current?.close();
    micAudioCtxRef.current = null;
  }, [setIsListening]);

  const stopVoiceRecording = useCallback(async () => {
    setShouldAutoStart(false);
    teardownMic();
    setIsProcessing(true);
    const ws = await getWS();
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "stt_stop" }));
    
    // Safety timeout: if server doesn't respond or errors silently, clear processing state
    setTimeout(() => {
        if (isProcessingRef.current) {
            _log('warn', 'Processing state timed out without response. Resetting.');
            setIsProcessing(false);
        }
    }, 10000);
  }, [getWS, teardownMic, setIsProcessing, _log]);

  const resumeVoiceRecording = useCallback(async () => {
       _log('info', 'Resuming STT active listening state for next turn');
       setIsListening(true);
       setIsProcessing(false);
       setIsSpeaking(false);
       setTranscript("");
       setFullText("");
       const ws = await getWS();
       if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "stt_start", userId: localStorage.getItem("userId") }));
       }
  }, [getWS, setIsListening, setIsProcessing, setIsSpeaking, _log]);
  
  const toggleRecording = useCallback(() => {
    const isSessionActive = !!micStreamRef.current && micStreamRef.current.active;
    if (isSessionActive) {
       if (isGreeting || isSpeaking || isProcessing) {
          _log('info', 'Manual barge-in via orb tap. Interrupting AI and going straight to listening.');
          stopPlayback();
          if (wsRef.current?.readyState === WebSocket.OPEN) {
             wsRef.current.send(JSON.stringify({ type: "interrupt", userId: localStorage.getItem("userId") }));
          }
          resumeVoiceRecording();
       } else {
          stopVoiceRecording();
       }
    } else {
       startVoiceRecording();
    }
  }, [isSpeaking, isProcessing, startVoiceRecording, stopVoiceRecording, stopPlayback, resumeVoiceRecording, _log]);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
      cancelAnimationFrame(animFrameRef.current);
      micStreamRef.current?.getTracks().forEach(t => t.stop());
      micAudioCtxRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (shouldAutoStart && !isSpeaking && !isListening && !isProcessing) {
      const timer = setTimeout(() => {
         setShouldAutoStart(false);
         if (micStreamRef.current && micStreamRef.current.active) {
            resumeVoiceRecording();
         } else {
            startVoiceRecording();
         }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [shouldAutoStart, isSpeaking, isListening, isProcessing, startVoiceRecording, resumeVoiceRecording]);

  return {
    isListening, isProcessing, isSpeaking, isGreeting, phase, transcript, fullText, micVolumeRef,
    startVoiceRecording, stopVoiceRecording, toggleRecording, stopPlayback,
  };
}
