import WebSocket from "ws";
import OpenAI from "openai";

const SARVAM_API_KEY = process.env.SARVAM_API_KEY;

const openai = new OpenAI({
  apiKey: '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',
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

const SYSTEM_PROMPT =
  "You are KrishiMitra, a friendly AI voice assistant for Indian farmers. You are operating in a LIVE VOICE CONVERSATION. " +
  "LANGUAGE: Auto-detect and respond in the user's language using native script only (no transliteration). Hindi → Devanagari, Odia → Odia script, etc. " +
  "VOICE STYLE: Natural, conversational, and speech-friendly. No markdown, bullets, emojis, or special characters. " +
  "ENGAGEMENT & LENGTH: Since this is a voice call, keep your responses concise, punchy, and highly manageable. Avoid long monologues. Talk and engage directly with the farmer, show empathy for their issues, and proactively ask short follow-up questions to understand their situation better. " +
  "EXPERTISE: Crop advice, soil health, fertilizers, pesticides, weather, government schemes, market prices. Keep advice practical, local, and simple. " +
  "CONVERSATION: Handle topic switches smoothly. Remember context within the session. " +
  "SAFETY: Never guess. If unsure, say so and suggest a local agricultural expert. Be cautious with chemical or medical guidance. " +
  "OUTPUT: Direct answers only. No reasoning steps or filler phrases.";

/**
 * Manages one voice session per browser client.
 * 
 * STT:  Done in the browser via webkitSpeechRecognition (codemix achieved by language setting)
 * LLM:  Sarvam /v1/chat/completions (streaming SSE) — server-side, API key hidden
 * TTS:  Sarvam /text-to-speech/ws (WebSocket streaming) — server-side, API key hidden
 * 
 * Browser → sends { type: "run_llm", transcript: "..." }
 * Server  → streams { type: "llm_token" } and { type: "audio_chunk" } back
 */
export class VoiceSession {
  constructor(browserWs, ip) {
    this.browserWs = browserWs;
    this.ip = ip;
    this.userId = "unknown_user";
    this.ttsWs = null;
    this.ttsReady = false;
    this.ttsQueue = [];
    this.sttWs = null;
    this.latestTranscript = "";
    this.finalizedTranscripts = "";
    this.currentInterim = "";
    this.sttAudioBuffer = [];
    this.history = []; // Persists for the life of the voice session
    this.profileContext = ""; 
    this.sessionId = Math.random().toString(36).substring(7);
    this._log('info', `Created new voice session`);
  }

  _log(level, ...args) {
    const ts = new Date().toISOString();
    const prefix = `[${ts}] [IP:${this.ip}] [U:${this.userId}] [S:${this.sessionId}]`;
    if (level === 'error') console.error(prefix, ...args);
    else if (level === 'warn') console.warn(prefix, ...args);
    else console.log(prefix, ...args);
  }

  // ─── TTS WebSocket ────────────────────────────────────────────────────────

  _setupTTS() {
    const url = "wss://api.sarvam.ai/text-to-speech/ws?model=bulbul:v3&send_completion_event=true";

    this.ttsWs = new WebSocket(url, {
      headers: { "Api-Subscription-Key": SARVAM_API_KEY },
    });

    this.ttsWs.on("open", () => {
      console.log(`[TTS:${this.sessionId}] Connected`);
      this.ttsWs.send(
        JSON.stringify({
          type: "config",
          data: {
            model: "bulbul:v3",
            target_language_code: "hi-IN",
            speaker: "shubh",
            pace: 1.1,
            speech_sample_rate: 24000,
            output_audio_codec: "linear16",
          },
        })
      );
      this.ttsReady = true;
      this.ttsQueue.forEach((t) => this._sendToTTS(t));
      this.ttsQueue = [];
    });

    this.ttsWs.on("message", (rawData) => {
      let msg;
      try {
        msg = JSON.parse(rawData.toString());
      } catch {
        return;
      }

      console.log(`[TTS:${this.sessionId}] msg type:`, msg.type);

      if (msg.type === "audio" && msg.data?.audio) {
        this._sendToBrowser({
          type: "audio_chunk",
          audio: msg.data.audio,
          content_type: msg.data.content_type || "audio/pcm",
        });
      } else if ((msg.type === "events" || msg.type === "event") && (msg.data?.event_type === "END_OF_AUDIO" || msg.data?.event_type === "final")) {
        this._sendToBrowser({ type: "tts_done" });
      } else if (msg.type === "error") {
        console.error(`[TTS:${this.sessionId}] Remote error:`, JSON.stringify(msg.data));
        this._sendToBrowser({ type: "tts_done" }); // unblock client
      }
    });

    this.ttsWs.on("error", (err) => {
      console.error(`[TTS:${this.sessionId}] WS error:`, err.message);
    });

    this.ttsWs.on("close", (code, reason) => {
      console.log(`[TTS:${this.sessionId}] Disconnected (${code}) ${reason}`);
      this.ttsReady = false;
      this.ttsWs = null;
    });
  }

  // ─── Browser message routing ──────────────────────────────────────────────

  handleBrowserMessage(message) {
    let msg;
    try {
      msg = JSON.parse(message.toString());
    } catch {
      this._log('warn', 'Failed to parse incoming browser WebSocket message');
      return;
    }
    
    // Attempt extreme verbose extraction 
    if (msg.userId && this.userId === "unknown_user") {
       this.userId = msg.userId;
       this._log('info', `Assigned user ID to session context`);
    }

    this._log('info', `[Browser->Server] Received message type: ${msg.type}`);

    switch (msg.type) {
      case "interrupt":
        this._log('info', `[INTERRUPT] User clicked orb. Halting TTS and dropping queue.`);
        this._isLLMRunning = false;
        this.ttsQueue = [];
        if (this.ttsWs?.readyState === WebSocket.OPEN) {
          this.ttsWs.close();
        }
        break;

      case "stt_start":
        this._log('info', `[STT] Initializing new STT turn.`);
        this._isLLMRunning = false;
        this.latestTranscript = "";
        this.finalizedTranscripts = "";
        this.currentInterim = "";
        this.sttAudioBuffer = [];
        clearTimeout(this.vadAutoStopTimer);
        
        // Inject initial greeting context so the AI remembers introducing itself
        if (msg.greetingText && this.history.length === 0) {
            this._log('info', `[STT] Injecting initial greeting history context`);
            this.history.push({ role: "user", content: "hi" });
            this.history.push({ role: "assistant", content: msg.greetingText });
        }

        this._setupSTT();
        break;

      case "stt_audio":
        if (this.sttWs?.readyState === WebSocket.OPEN) {
           this.sttWs.send(JSON.stringify({ audio: { data: msg.audio, sample_rate: "16000", encoding: "audio/wav" } }));
        } else {
           this.sttAudioBuffer.push(msg);
        }
        break;

      case "stt_stop":
        this._triggerSttStop();
        break;

      case "run_llm":
        if (msg.profileContext) {
           this.profileContext = msg.profileContext;
        }
        if (msg.transcript?.trim()) {
          this._runLLM(msg.transcript.trim());
        } else {
          this._sendToBrowser({ type: "error", message: "Empty transcript" });
        }
        break;

      default:
        console.warn(`[Session:${this.sessionId}] Unknown message type:`, msg.type);
    }
  }

  // ─── STT WebSocket ────────────────────────────────────────────────────────

  _setupSTT() {
    console.log(`[STT:${this.sessionId}] Starting WS setup...`);
    if (this.sttWs?.readyState === WebSocket.OPEN) {
       console.log(`[STT:${this.sessionId}] WS already open`);
       return;
    }
    const url = "wss://api.sarvam.ai/speech-to-text/ws?language-code=unknown&model=saaras:v3&mode=codemix&input_audio_codec=pcm_s16le&vad_signals=true";
    
    this.sttWs = new WebSocket(url, {
      headers: { "Api-Subscription-Key": SARVAM_API_KEY },
    });

    this.sttWs.on("open", () => {
      console.log(`[STT:${this.sessionId}] Connected`);
      this.sttAudioBuffer.forEach((msg) => {
         if (this.sttWs.readyState === WebSocket.OPEN) {
            this.sttWs.send(JSON.stringify({ audio: { data: msg.audio, sample_rate: "16000", encoding: "audio/wav" } }));
         }
      });
      this.sttAudioBuffer = [];
    });

    this.sttWs.on("message", (rawData) => {
      let msg;
      try { msg = JSON.parse(rawData.toString()); } catch { return; }
      
      if (msg.type === "data" && msg.data?.transcript) {
         const incoming = msg.data.transcript.trim();

         // Check if the STT engine reset its text buffer (e.g. after a tiny pause)
         if (this.currentInterim && incoming) {
             const lenDrop = incoming.length < this.currentInterim.length * 0.5;
             const prefixA = incoming.substring(0, 4);
             const prefixB = this.currentInterim.substring(0, 4);
             
             if (lenDrop || (prefixA.length >= 2 && prefixA !== prefixB)) {
                 this.finalizedTranscripts += (this.finalizedTranscripts ? " " : "") + this.currentInterim;
                 this.currentInterim = "";
             }
         }

         this.currentInterim = incoming;
         const displayTranscript = (this.finalizedTranscripts + " " + this.currentInterim).trim();

         if (this.latestTranscript !== displayTranscript) {
             console.log(`[STT:${this.sessionId}] Interim: "${displayTranscript}"`);
         }
         this.latestTranscript = displayTranscript;
         this._sendToBrowser({ type: "stt_interim", text: displayTranscript });

         if (msg.data.is_final) {
             this.finalizedTranscripts += (this.finalizedTranscripts ? " " : "") + this.currentInterim;
             this.currentInterim = "";
         }

         // Custom Auto-Stop based on 800ms of silence after speech (optimized for snappy conversation)
         clearTimeout(this.vadAutoStopTimer);
         this.vadAutoStopTimer = setTimeout(() => {
             this._log('info', `[STT] Custom Auto-Stop silence threshold (800ms) reached.`);
             this._triggerSttStop();
         }, 800);

      } else if (msg.type === "events" && msg.data?.event_type === "END_SPEECH") {
         console.log(`[STT:${this.sessionId}] VAD END_SPEECH detected. Current Transcript: "${this.latestTranscript}"`);
         this._triggerSttStop();
      } else if (msg.type === "error") {
         console.error(`[STT:${this.sessionId}] Remote error:`, msg.data);
      }
    });

    this.sttWs.on("error", (err) => {
      console.error(`[STT:${this.sessionId}] WS error:`, err.message);
    });
  }

  // ─── STT Helper ───────────────────────────────────────────────────────────
  _triggerSttStop() {
    this._log('info', `[STT] Triggering Auto-Stop. Finalizing transcripts.`);
    clearTimeout(this.vadAutoStopTimer);
    if (!this.latestTranscript && !this.finalizedTranscripts) {
        this._log('warn', `[STT] Ignored stop: transcript was entirely empty.`);
        return; 
    }
    
    this._log('info', `[STT] Sending stt_auto_stop to browser to pause microphone sending.`);
    this._sendToBrowser({ type: "stt_auto_stop" });
    if (this.sttWs?.readyState === WebSocket.OPEN) {
       this.sttWs.send(JSON.stringify({ type: "flush" }));
    }
    setTimeout(() => {
      const finalWords = this.latestTranscript?.trim() || this.finalizedTranscripts.trim();
      
      // Clear them so we don't trigger twice
      this.latestTranscript = ""; 
      this.finalizedTranscripts = "";
      this.currentInterim = "";

      if (finalWords) {
        this._runLLM(finalWords);
      } else {
        this._sendToBrowser({ type: "error", message: "Didn't catch that." });
        this._sendToBrowser({ type: "audio_done" }); 
      }
      
      if (this.sttWs?.readyState === WebSocket.OPEN) {
         this.sttWs.close();
      }
    }, 50);
  }

  // ─── LLM → TTS pipeline ───────────────────────────────────────────────────

  async _runLLM(transcript) {
    if (this._isLLMRunning) {
       this._log('warn', `[LLM] Ignored trigger: LLM already running for previous turn.`);
       return;
    }
    this._isLLMRunning = true;

    this._log('info', `[LLM] Starting generation for query: "${transcript}"`);
    this._sendToBrowser({ type: "llm_start" });

    const startTime = Date.now();
    let firstTokenTime = null;

    // Reset or setup TTS connection
    if (!this.ttsWs || this.ttsWs.readyState !== WebSocket.OPEN) {
      this._setupTTS();
    } else {
      // Send a new config to restart TTS buffer cleanly
      this.ttsWs.send(JSON.stringify({
        type: "config",
        data: {
          model: "bulbul:v3",
          target_language_code: "hi-IN",
          speaker: "shubh",
          pace: 1.1,
          speech_sample_rate: 24000,
          output_audio_codec: "linear16",
          send_completion_event: true,
        },
      }));
    }

    console.log(`[LLM:${this.sessionId}] Sending ${this.history.length / 2} turns of history + current prompt.`);
    // console.log("[LLM] Messages:", JSON.stringify(this.history.slice(-10), null, 2));

    try {
      const completion = await openai.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
          { 
            role: "system", 
            content: this.profileContext 
              ? `${SYSTEM_PROMPT} USER PROFILE: ${this.profileContext}` 
              : SYSTEM_PROMPT 
          },
          ...this.history.slice(-10),
          { role: "user", content: transcript },
        ],
        temperature: 1,
        top_p: 1,
        max_tokens: 4096,
        stream: true
      });

      let fullText = "";
      const stripper = new StreamingThinkStripper();
      let sentenceBuffer = "";

      for await (const chunk of completion) {
        if (!this._isLLMRunning) {
           console.log(`[LLM:${this.sessionId}] Stream interrupted by user orb tap. Canceling chunk loop.`);
           break;
        }

        const textToken = chunk.choices[0]?.delta?.content || "";
        
        if (!textToken) continue;

        if (!firstTokenTime) {
           firstTokenTime = Date.now();
           console.log(`[LLM:${this.sessionId}] First token latency: ${firstTokenTime - startTime}ms`);
        }

        fullText += textToken;
        this._sendToBrowser({ type: "llm_token", text: textToken });
        
        const cleanToken = stripper.process(textToken);
        if (cleanToken) {
           sentenceBuffer += cleanToken;
           
           const match = sentenceBuffer.match(/^(.*?[।.!?\n])\s+(.*)$/s) || 
                        (sentenceBuffer.length > 100 ? sentenceBuffer.match(/^(.*?[।.!?\n])(.*)$/s) : null);
           
           if (match) {
              const sentence = match[1].trim();
              sentenceBuffer = match[2] || "";
              
              if (sentence.length >= 5) {
                 this._sendToTTS(sentence);
              } else {
                 sentenceBuffer = sentence + " " + sentenceBuffer;
              }
           }
        }
      }

      // Flush remaining buffers
      const finalClean = stripper.flush();
      if (finalClean) sentenceBuffer += finalClean;
      
      if (sentenceBuffer.trim()) {
        const chunks = _splitIntoTTSChunks(sentenceBuffer.trim(), 400);
        chunks.forEach((chunk) => this._sendToTTS(chunk));
      }

      if (this.ttsWs?.readyState === WebSocket.OPEN) {
        this.ttsWs.send(JSON.stringify({ type: "flush" }));
      }

      const cleanText = stripThinkTags(fullText);
      this._sendToBrowser({ type: "llm_replace", text: cleanText });

      console.log(`[LLM] Done streaming. Total latency: ${Date.now() - startTime}ms. Final length: ${cleanText.length}`);
      
      // Save to history after successful generation
      this.history.push({ role: "user", content: transcript });
      this.history.push({ role: "assistant", content: cleanText });
      // Keep history manageable
      if (this.history.length > 20) this.history = this.history.slice(-20);

      this._sendToBrowser({ type: "llm_done" });
    } catch (err) {
      console.error(`[LLM:${this.sessionId}] Fatal Error:`, err.message, err.stack);
      this._sendToBrowser({ type: "error", message: err.message });
    } finally {
      this._isLLMRunning = false;
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  _sendToTTS(text) {
    if (!text.trim()) return;
    if (this.ttsReady && this.ttsWs?.readyState === WebSocket.OPEN) {
      console.log(`[TTS:${this.sessionId}] Sending to TTS: "${text.substring(0, 15)}..."`);
      this.ttsWs.send(JSON.stringify({ type: "text", data: { text } }));
    } else {
      console.log(`[TTS:${this.sessionId}] Queuing for TTS: "${text.substring(0, 15)}..."`);
      this.ttsQueue.push(text);
      if (!this.ttsWs || this.ttsWs.readyState === WebSocket.CLOSED) {
         this._setupTTS();
      }
    }
  }

  _sendToBrowser(obj) {
    if (this.browserWs.readyState === WebSocket.OPEN) {
      this.browserWs.send(JSON.stringify(obj));
    }
  }

  destroy() {
    console.log(`[Session:${this.sessionId}] Destroying session`);
    if (this.ttsWs?.readyState === WebSocket.OPEN) this.ttsWs.close();
    if (this.sttWs?.readyState === WebSocket.OPEN) this.sttWs.close();
  }
}

/**
 * Splits text into chunks at sentence boundaries, each under maxLen chars.
 * Prevents exceeding Sarvam TTS per-message limits.
 */
function _splitIntoTTSChunks(text, maxLen = 400) {
  const sentences = text.split(/(?<=[।.!?\n])\s*/);
  const chunks = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + sentence).length > maxLen) {
      if (current) chunks.push(current.trim());
      // If a single sentence is too long, hard-split it
      let s = sentence;
      while (s.length > maxLen) {
        chunks.push(s.slice(0, maxLen).trim());
        s = s.slice(maxLen);
      }
      current = s;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(Boolean);
}

export function stripThinkTags(text) {
  // Removes complete <think>...</think> blocks
  let c = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  // Removes incomplete <think>... blocks at the end
  c = c.replace(/<think>[\s\S]*$/gi, "");
  return c.trim();
}

/**
 * Strips <think> tags from a continuous stream of tokens.
 */
export class StreamingThinkStripper {
  constructor() {
    this.buffer = "";
    this.inThink = false;
  }
  
  process(token) {
    this.buffer += token;
    let output = "";
    
    while (this.buffer.length > 0) {
      if (this.inThink) {
        const endIdx = this.buffer.indexOf("</think>");
        if (endIdx !== -1) {
          this.inThink = false;
          this.buffer = this.buffer.slice(endIdx + 8);
        } else {
          // keep buffering until </think> arrives
          break; 
        }
      } else {
        const startIdx = this.buffer.indexOf("<think>");
        if (startIdx !== -1) {
          output += this.buffer.slice(0, startIdx);
          this.inThink = true;
          this.buffer = this.buffer.slice(startIdx + 7);
        } else {
          // Check if a partial <think> is forming at the end
          const match = this.buffer.match(/<[^>]*$/); 
          if (match && "<think>".startsWith(match[0])) {
            output += this.buffer.slice(0, match.index);
            this.buffer = this.buffer.slice(match.index);
            break; // wait for more tokens
          } else {
            output += this.buffer;
            this.buffer = "";
          }
        }
      }
    }
    return output;
  }

  flush() {
    return this.inThink ? "" : this.buffer;
  }
}
