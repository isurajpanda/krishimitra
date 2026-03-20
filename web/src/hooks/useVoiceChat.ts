import { useState, useRef, useCallback, useEffect } from "react";

const SERVER_WS_URL = "ws://localhost:3001/api/v0/voice";
// Number of chunks to accumulate before starting playback (gapless warmup)
const PLAYBACK_PREBUFFER_COUNT = 10;
// Startup scheduling offset in seconds — gives AudioContext time to warm up
const AUDIO_START_OFFSET = 0.3;

export function useVoiceChat() {
  const [isListening, setIsListeningState] = useState(false);
  const isListeningRef = useRef(false);
  const setIsListening = useCallback((val: boolean) => {
     isListeningRef.current = val;
     setIsListeningState(val);
  }, []);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [fullText, setFullText] = useState("");
  const [shouldAutoStart, setShouldAutoStart] = useState(false);

  const ttsDoneRef = useRef(false);
  const chunksPlayingRef = useRef(0);

  // Mic volume: 0-1, updated ~every 40ms while listening
  const micVolumeRef = useRef(0);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const latestTranscriptRef = useRef("");

  // Pre-buffer system: collect decoded AudioBuffers until we have enough to start gapless playback
  const prebufferRef = useRef<AudioBuffer[]>([]);
  const prebufferStartedRef = useRef(false);

  // ── WebSocket connection ──────────────────────────────────────────────────
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

        if (msg.type !== "stt_interim" && msg.type !== "audio_chunk" && msg.type !== "llm_token") {
            console.log(`[WS] Server Message: ${msg.type}`, msg);
        }

        const checkAudioFinished = () => {
           if (ttsDoneRef.current && chunksPlayingRef.current === 0) {
               console.log("[useVoiceChat] All audio chunks finished playing. Triggering auto-start.");
               setIsSpeaking(false);
               setIsProcessing(false);
               setShouldAutoStart(true);
           }
        };

        switch (msg.type) {
          case "llm_start":
            setIsProcessing(true);
            setFullText("");
            ttsDoneRef.current = false;
            chunksPlayingRef.current = 0;
            prebufferRef.current = [];
            prebufferStartedRef.current = false;
            break;

          case "llm_token":
            setIsProcessing(false);
            setIsSpeaking(true);
            setFullText((prev) => prev + msg.text);
            break;

          case "llm_done":
            break;

          case "tts_done":
            // Flush any remaining prebuffered audio that hasn't started yet
            if (!prebufferStartedRef.current && prebufferRef.current.length > 0) {
              console.log(`[Audio] tts_done flush: playing remaining ${prebufferRef.current.length} prebuffered chunks`);
              prebufferStartedRef.current = true;
              _flushPrebuffer();
            }
            ttsDoneRef.current = true;
            checkAudioFinished();
            break;

          case "llm_replace":
            setFullText(msg.text || "");
            break;

          case "stt_interim":
            setTranscript(msg.text);
            latestTranscriptRef.current = msg.text;
            break;

          case "audio_chunk":
            _enqueueAudio(msg.audio);
            break;

          case "audio_done":
            // Legacy fallback: if server sends audio_done, treat as tts_done
            ttsDoneRef.current = true;
            checkAudioFinished();
            break;

          case "stt_auto_stop":
            handleAutoStop();
            setIsProcessing(true);
            break;

          case "error":
            console.error("[WS] Server error:", msg.message);
            setIsProcessing(false);
            setIsSpeaking(false);
            if (msg.message) setFullText("⚠️ " + msg.message);
            break;
        }
      };

      ws.onerror = (e) => console.error("[WS] Connection error", e);
      ws.onclose = () => { console.log("[WS] Connection closed"); wsRef.current = null; };
      ws.onopen = () => { console.log("[WS] Connection opened"); resolve(ws); };
      wsRef.current = ws;
    });
  }, []);

  // ── AudioContext gapless playback ─────────────────────────────────────────
  // We keep one AudioContext alive for the lifetime of the hook to avoid
  // the browser's mandatory silent warm-up period on newly created contexts.
  const _ensureAudioCtx = () => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      const ctx = new AudioContext({ sampleRate: 24000 });
      audioCtxRef.current = ctx;
      nextStartTimeRef.current = 0;

      // Play a 1-frame silent buffer to warm up the audio stack immediately.
      // Without this, the first real audio chunk outputs at reduced quality.
      const silentBuf = ctx.createBuffer(1, 1, 24000);
      const src = ctx.createBufferSource();
      src.buffer = silentBuf;
      src.connect(ctx.destination);
      src.start(0);
      console.log("[Audio] AudioContext warmed up");
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Pre-warm the AudioContext immediately when the hook mounts, not lazily.
  useEffect(() => {
    // Trigger warmup on first user gesture or immediately in modern browsers.
    const ctx = new AudioContext({ sampleRate: 24000 });
    audioCtxRef.current = ctx;
    nextStartTimeRef.current = 0;
    const silentBuf = ctx.createBuffer(1, 1, 24000);
    const src = ctx.createBufferSource();
    src.buffer = silentBuf;
    src.connect(ctx.destination);
    src.start(0);
    console.log("[Audio] AudioContext pre-warmed on mount");
    // Do NOT close it here — keep it alive.
  }, []);

  const _scheduleBuffer = (ctx: AudioContext, audioBuffer: AudioBuffer) => {
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    // Ensure we always stay ahead of the playhead (50ms lead time)
    const startAt = Math.max(ctx.currentTime + 0.05, nextStartTimeRef.current);
    source.start(startAt);
    nextStartTimeRef.current = startAt + audioBuffer.duration;

    chunksPlayingRef.current++;
    source.onended = () => {
      chunksPlayingRef.current--;
      if (ttsDoneRef.current && chunksPlayingRef.current === 0) {
        console.log("[useVoiceChat] All audio chunks finished. Triggering auto-start.");
        setIsSpeaking(false);
        setIsProcessing(false);
        setShouldAutoStart(true);
      }
    };
  };

  const _flushPrebuffer = () => {
    const ctx = _ensureAudioCtx();
    // Anchor all prebuffered chunks at a comfortable offset so AudioContext is ready
    nextStartTimeRef.current = ctx.currentTime + AUDIO_START_OFFSET;
    console.log(`[Audio] Flushing ${prebufferRef.current.length} prebuffered chunks at t=${ctx.currentTime.toFixed(3)}+${AUDIO_START_OFFSET}`);
    for (const buf of prebufferRef.current) {
      _scheduleBuffer(ctx, buf);
    }
    prebufferRef.current = [];
  };

  const _enqueueAudio = async (base64: string) => {
    try {
      const ctx = _ensureAudioCtx();
      const binary = atob(base64);

      const buffer = new ArrayBuffer(binary.length);
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const numSamples = binary.length / 2;
      const audioBuffer = ctx.createBuffer(1, numSamples, 24000);
      const channelData = audioBuffer.getChannelData(0);
      const dataView = new DataView(buffer);
      for (let i = 0; i < numSamples; i++) {
        channelData[i] = dataView.getInt16(i * 2, true) / 32768.0;
      }

      if (!prebufferStartedRef.current) {
        // Accumulate until we have enough chunks for gapless warmup
        prebufferRef.current.push(audioBuffer);
        console.log(`[Audio] Prebuffering chunk ${prebufferRef.current.length}/${PLAYBACK_PREBUFFER_COUNT}`);

        if (prebufferRef.current.length >= PLAYBACK_PREBUFFER_COUNT) {
          console.log("[Audio] Prebuffer full — flushing to playback");
          prebufferStartedRef.current = true;
          _flushPrebuffer();
        }
      } else {
        // Prebuffer has started, schedule directly
        _scheduleBuffer(ctx, audioBuffer);
      }
    } catch (e) {
      console.warn("[Audio] Could not decode chunk:", e);
    }
  };

  // ── STT via AI WebSocket ──────────────────────────────────────────────
  const micStreamRef = useRef<MediaStream | null>(null);
  const micAudioCtxRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);

  const startVoiceRecording = useCallback(async () => {
    console.log("[useVoiceChat] Attempting to start voice recording. isListeningRef =", isListeningRef.current);
    if (isListeningRef.current) return;
    setShouldAutoStart(false);

    ttsDoneRef.current = false;
    chunksPlayingRef.current = 0;
    prebufferRef.current = [];
    prebufferStartedRef.current = false;

    try {
      console.log("[useVoiceChat] Requesting mic access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("[useVoiceChat] Mic access granted");
      setIsListening(true);
      setTranscript("");
      setFullText("");
      latestTranscriptRef.current = "";

      const audioCtx = new AudioContext({ sampleRate: 16000 });
      micAudioCtxRef.current = audioCtx;
      micStreamRef.current = stream;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      // Analyser for live mic volume
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.6;
      analyserRef.current = analyser;
      source.connect(analyser);

      // Poll the analyser for RMS volume at ~25fps
      const freqData = new Uint8Array(analyser.frequencyBinCount);
      const pollVolume = () => {
        analyser.getByteFrequencyData(freqData);
        let sum = 0;
        for (let i = 0; i < freqData.length; i++) sum += freqData[i];
        const rms = Math.min(1, (sum / freqData.length) / 128);
        micVolumeRef.current = rms;
        animFrameRef.current = requestAnimationFrame(pollVolume);
      };
      animFrameRef.current = requestAnimationFrame(pollVolume);

      const ws = await getWS();
      ws.send(JSON.stringify({ type: "stt_start" }));

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const buffer = new ArrayBuffer(inputData.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }

        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
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
    } catch (e: any) {
      console.error("[STT] Microphone error:", e);
      alert("Microphone access denied or error occurred.");
      setIsListening(false);
    }
  }, [getWS, setIsListening]);

  const handleAutoStop = useCallback(() => {
    console.log("[useVoiceChat] handleAutoStop invoked");
    setIsListening(false);
    cancelAnimationFrame(animFrameRef.current);
    micVolumeRef.current = 0;
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (micAudioCtxRef.current) {
      micAudioCtxRef.current.close();
      micAudioCtxRef.current = null;
    }
  }, [setIsListening]);

  const stopVoiceRecording = useCallback(async () => {
    console.log("[useVoiceChat] stopVoiceRecording invoked manually");
    setShouldAutoStart(false);
    if (!isListeningRef.current) return;
    handleAutoStop();
    setIsProcessing(true);

    const ws = await getWS();
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "stt_stop" }));
    }
  }, [getWS, handleAutoStop]);

  const toggleRecording = useCallback(() => {
    if (isListening) stopVoiceRecording();
    else startVoiceRecording();
  }, [isListening, startVoiceRecording, stopVoiceRecording]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      wsRef.current?.close();
      // NOTE: We intentionally do NOT close audioCtxRef here.
      // Keeping it alive prevents the browser warm-up glitch on next TTS.
      cancelAnimationFrame(animFrameRef.current);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      micAudioCtxRef.current?.close();
    };
  }, []);

  // Auto-Start Loop: only fires when NOT speaking and NOT processing
  useEffect(() => {
    if (shouldAutoStart && !isSpeaking && !isListening && !isProcessing) {
      const timer = setTimeout(() => {
         setShouldAutoStart(false);
         startVoiceRecording();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [shouldAutoStart, isSpeaking, isListening, isProcessing, startVoiceRecording]);

  return {
    isListening,
    isProcessing,
    isSpeaking,
    transcript,
    fullText,
    micVolumeRef,   // <-- expose for Orb visualizer
    startVoiceRecording,
    stopVoiceRecording,
    toggleRecording,
  };
}
