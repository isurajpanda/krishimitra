import WebSocket from "ws";

const SARVAM_API_KEY = process.env.SARVAM_API_KEY;

const SYSTEM_PROMPT =
  "You are KrishiMitra, a friendly AI voice assistant for Indian farmers. " +
  "LANGUAGE: Auto-detect and respond in the user's language using native script only (no transliteration). Hindi → Devanagari, Odia → Odia script, etc. " +
  "VOICE STYLE: Natural and speech-friendly. No markdown, bullets, emojis, or special characters. " +
  "LENGTH: Be flexible. Keep it concise for simple greetings or confirmations, but provide detailed, step-by-step explanations for complex agricultural queries (e.g., how to grow a crop, pest control). " +
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
  constructor(browserWs) {
    this.browserWs = browserWs;
    this.ttsWs = null;
    this.ttsReady = false;
    this.ttsQueue = [];
    this.sttWs = null;
    this.latestTranscript = "";
    this.finalizedTranscripts = "";
    this.currentInterim = "";
    this.sttAudioBuffer = [];
    this.history = []; // Persists for the life of the voice session
    this._isLLMRunning = false;
  }

  // ─── TTS WebSocket ────────────────────────────────────────────────────────

  _setupTTS() {
    const url = "wss://api.sarvam.ai/text-to-speech/ws?model=bulbul:v3&send_completion_event=true";

    this.ttsWs = new WebSocket(url, {
      headers: { "Api-Subscription-Key": SARVAM_API_KEY },
    });

    this.ttsWs.on("open", () => {
      console.log("[TTS] Connected");
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

      console.log("[TTS] msg type:", msg.type);

      if (msg.type === "audio" && msg.data?.audio) {
        this._sendToBrowser({
          type: "audio_chunk",
          audio: msg.data.audio,
          content_type: msg.data.content_type || "audio/pcm",
        });
      } else if ((msg.type === "events" || msg.type === "event") && (msg.data?.event_type === "END_OF_AUDIO" || msg.data?.event_type === "final")) {
        this._sendToBrowser({ type: "tts_done" });
      } else if (msg.type === "error") {
        console.error("[TTS] Remote error:", JSON.stringify(msg.data));
        this._sendToBrowser({ type: "tts_done" }); // unblock client
      }
    });

    this.ttsWs.on("error", (err) => {
      console.error("[TTS] WS error:", err.message);
    });

    this.ttsWs.on("close", (code, reason) => {
      console.log(`[TTS] Disconnected (${code}) ${reason}`);
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
      return;
    }

    switch (msg.type) {
      case "stt_start":
        this.latestTranscript = "";
        this.finalizedTranscripts = "";
        this.currentInterim = "";
        this.sttAudioBuffer = [];
        clearTimeout(this.vadAutoStopTimer);
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
        if (msg.transcript?.trim()) {
          this._runLLM(msg.transcript.trim());
        } else {
          this._sendToBrowser({ type: "error", message: "Empty transcript" });
        }
        break;

      default:
        console.warn("[Session] Unknown message type:", msg.type);
    }
  }

  // ─── STT WebSocket ────────────────────────────────────────────────────────

  _setupSTT() {
    console.log("[STT] Starting WS setup...");
    if (this.sttWs?.readyState === WebSocket.OPEN) {
       console.log("[STT] WS already open");
       return;
    }
    const url = "wss://api.sarvam.ai/speech-to-text/ws?language-code=unknown&model=saaras:v3&mode=codemix&input_audio_codec=pcm_s16le&vad_signals=true";
    
    this.sttWs = new WebSocket(url, {
      headers: { "Api-Subscription-Key": SARVAM_API_KEY },
    });

    this.sttWs.on("open", () => {
      console.log("[STT] Connected");
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
             console.log(`[STT] Interim: "${displayTranscript}"`);
         }
         this.latestTranscript = displayTranscript;
         this._sendToBrowser({ type: "stt_interim", text: displayTranscript });

         if (msg.data.is_final) {
             this.finalizedTranscripts += (this.finalizedTranscripts ? " " : "") + this.currentInterim;
             this.currentInterim = "";
         }

         // Custom Auto-Stop based on 1.5s of silence after speech
         clearTimeout(this.vadAutoStopTimer);
         this.vadAutoStopTimer = setTimeout(() => {
             console.log(`[STT] Custom Auto-Stop silence threshold reached.`);
             this._triggerSttStop();
         }, 1800);

      } else if (msg.type === "events" && msg.data?.event_type === "END_SPEECH") {
         console.log(`[STT] VAD END_SPEECH detected. Current Transcript: "${this.latestTranscript}"`);
         this._triggerSttStop();
      } else if (msg.type === "error") {
         console.error("[STT] Remote error:", msg.data);
      }
    });

    this.sttWs.on("error", (err) => {
      console.error("[STT] WS error:", err.message);
    });
  }

  // ─── STT Helper ───────────────────────────────────────────────────────────
  _triggerSttStop() {
    clearTimeout(this.vadAutoStopTimer);
    if (!this.latestTranscript && !this.finalizedTranscripts) return; // Prevent double trigger
    
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
      if (this.sttWs?.readyState === WebSocket.OPEN) this.sttWs.close();
    }, 500);
  }

  // ─── LLM → TTS pipeline ───────────────────────────────────────────────────

  async _runLLM(transcript) {
    if (this._isLLMRunning) {
       console.log("[LLM] Ignored trigger: LLM already running.");
       return;
    }
    this._isLLMRunning = true;

    console.log(`[LLM] Starting generation for: "${transcript}"`);
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

    console.log(`[LLM] Sending ${this.history.length / 2} turns of history + current prompt.`);
    // console.log("[LLM] Messages:", JSON.stringify(this.history.slice(-10), null, 2));

    try {
      const res = await fetch("https://api.sarvam.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "API-Subscription-Key": SARVAM_API_KEY,
        },
        body: JSON.stringify({
          model: "sarvam-105b",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...this.history.slice(-10), // Send last 10 messages for context
            { role: "user", content: transcript },
          ],
          temperature: 0.6,
          stream: true,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[LLM] API error (${res.status}):`, errText);
        this._sendToBrowser({ type: "error", message: "LLM API error: " + errText });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      
      const stripper = new StreamingThinkStripper();
      let sentenceBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        const lines = chunkText.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const json = JSON.parse(data);
            const token = json.choices?.[0]?.delta?.content || "";
            if (!token) continue;

            if (!firstTokenTime) {
               firstTokenTime = Date.now();
               console.log(`[LLM] First token latency: ${firstTokenTime - startTime}ms`);
            }

            fullText += token;
            this._sendToBrowser({ type: "llm_token", text: token });
            
            const cleanToken = stripper.process(token);
            if (cleanToken) {
              sentenceBuffer += cleanToken;
              
              // split when encountering a punctuation mark followed by a space or end of token
              // Split when encountering punctuation followed by space, or if the buffer is getting long (100+ chars)
              const match = sentenceBuffer.match(/^(.*?[।.!?\n])\s+(.*)$/s) || 
                           (sentenceBuffer.length > 100 ? sentenceBuffer.match(/^(.*?[।.!?\n])(.*)$/s) : null);
              
              if (match) {
                 const sentence = match[1].trim();
                 sentenceBuffer = match[2] || "";
                 
                 // Only send if it's a reasonably sized chunk (e.g. at least 5 chars)
                 // to avoid sending tiny snippets that cause jitter.
                 if (sentence.length >= 5) {
                    this._sendToTTS(sentence);
                 } else {
                    // Put it back to accumulate with next tokens
                    sentenceBuffer = sentence + " " + sentenceBuffer;
                 }
              }
            }
          } catch {
            // skip malformed SSE line
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
      console.error("[LLM] Fatal Error:", err.message, err.stack);
      this._sendToBrowser({ type: "error", message: err.message });
    } finally {
      this._isLLMRunning = false;
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  _sendToTTS(text) {
    if (!text.trim()) return;
    if (this.ttsReady && this.ttsWs?.readyState === WebSocket.OPEN) {
      console.log(`[TTS] Sending to TTS: "${text.substring(0, 15)}..."`);
      this.ttsWs.send(JSON.stringify({ type: "text", data: { text } }));
    } else {
      console.log(`[TTS] Queuing for TTS: "${text.substring(0, 15)}..."`);
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
