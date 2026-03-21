import { DurableObject } from 'cloudflare:workers'
import OpenAI from 'openai'
import { neon } from '@neondatabase/serverless'
import { StreamingThinkStripper, stripThinkTags } from '../utils'

type Bindings = {
  DB: D1Database
  NVIDIA_API_KEY: string
  SARVAM_API_KEY: string
  NEON_DB_URL: string
  AI: Ai
}

const SYSTEM_PROMPT =
  'You are KrishiMitra, a friendly AI voice assistant for Indian farmers. You are operating in a LIVE VOICE CONVERSATION. ' +
  "LANGUAGE: Auto-detect and respond in the user's language using native script only (no transliteration). Hindi → Devanagari, Odia → Odia script, etc. " +
  'VOICE STYLE: Natural, conversational, and speech-friendly. No markdown, bullets, emojis, or special characters. ' +
  'ENGAGEMENT & LENGTH: Since this is a voice call, keep your responses concise, punchy, and highly manageable. Avoid long monologues. Talk and engage directly with the farmer, show empathy for their issues, and proactively ask short follow-up questions to understand their situation better. ' +
  'EXPERTISE: Crop advice, soil health, fertilizers, pesticides, weather, government schemes, market prices. Keep advice practical, local, and simple. ' +
  'CONVERSATION: Handle topic switches smoothly. Remember context within the session. ' +
  'SAFETY: Never guess. If unsure, say so and suggest a local agricultural expert. Be cautious with chemical or medical guidance. ' +
  'OUTPUT: Direct answers only. No reasoning steps or filler phrases.'

// ─── Outbound WebSocket helper ─────────────────────────────────────────────
// CRITICAL: CF Workers fetch() requires https:// NOT wss:// for outbound WebSocket.
// wss:// throws "Fetch API cannot load". Use https:// — the runtime upgrades
// automatically when Upgrade:websocket header is present. Custom headers like
// Api-Subscription-Key ARE forwarded correctly with this approach.
async function connectWS(url: string, headers: Record<string, string>): Promise<WebSocket> {
  const resp = await fetch(url, {
    headers: {
      Upgrade: 'websocket',
      ...headers,
    },
  })
  const ws = resp.webSocket
  if (!ws) {
    throw new Error(`WebSocket upgrade failed for ${url} — HTTP ${resp.status}, no webSocket in response`)
  }
  // accept() tells the CF runtime we are handling this socket in JS
  ws.accept()
  return ws
}

export class VoiceSession extends DurableObject<Bindings> {
  private browserWs: WebSocket | null = null
  private ip: string = 'unknown'
  private userId: string = 'unknown_user'
  private ttsWs: WebSocket | null = null
  private ttsReady = false
  private ttsQueue: string[] = []
  private ttsPingTimer: ReturnType<typeof setInterval> | null = null
  private sttWs: WebSocket | null = null
  private latestTranscript = ''
  private finalizedTranscripts = ''
  private currentInterim = ''
  private sttAudioBuffer: any[] = []
  private history: any[] = []
  private profileContext = ''
  private sessionId = Math.random().toString(36).substring(7)
  private _isLLMRunning = false
  private vadAutoStopTimer: ReturnType<typeof setTimeout> | null = null

  constructor(state: DurableObjectState, env: Bindings) {
    super(state, env)
  }

  // ─── Browser WebSocket entry point ─────────────────────────────────────────

  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade')
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 })
    }

    this.ip = request.headers.get('CF-Connecting-IP') || 'unknown'

    const { 0: client, 1: server } = new WebSocketPair()
    this.browserWs = server
    server.accept()

    server.addEventListener('message', (event: MessageEvent) => {
      const p = this.handleBrowserMessage(event.data).catch((err) => {
        this._log('error', 'Unhandled error in handleBrowserMessage:', err?.message ?? err)
      })
      this.ctx.waitUntil(p)
    })

    server.addEventListener('close', () => this.destroy())
    server.addEventListener('error', (err: any) => {
      this._log('error', 'Browser WS error:', err)
      this.destroy()
    })

    return new Response(null, { status: 101, webSocket: client })
  }

  _log(level: string, ...args: any[]) {
    const ts = new Date().toISOString()
    const prefix = `[${ts}][S:${this.sessionId}][IP:${this.ip}][U:${this.userId}][DO]`
    if (level === 'error') console.error(prefix, ...args)
    else if (level === 'warn') console.warn(prefix, ...args)
    else console.log(prefix, ...args)
  }

  // ─── TTS WebSocket ─────────────────────────────────────────────────────────

  async _initTTS(): Promise<void> {
    const url = 'https://api.sarvam.ai/text-to-speech/ws?model=bulbul:v3&send_completion_event=true'
    try {
      this._log('info', '[TTS] Connecting via fetch() upgrade...')

      const ws = await connectWS(url, {
        'Api-Subscription-Key': this.env.SARVAM_API_KEY,
      })

      this.ttsWs = ws

      ws.addEventListener('message', (event: MessageEvent) => {
        let msg: any
        try { msg = JSON.parse(event.data.toString()) } catch { return }

        if (msg.type === 'audio' && msg.data?.audio) {
          this._sendToBrowser({
            type: 'audio_chunk',
            audio: msg.data.audio,
            // spec: content_type e.g. 'audio/mp3', 'audio/wav'
            content_type: msg.data.content_type || 'audio/pcm',
          })
        } else if (
          // Per spec: type=="event", data.event_type=="final"
          // Also handle legacy "events" / "END_OF_AUDIO" from older API versions
          (msg.type === 'event' || msg.type === 'events') &&
          (msg.data?.event_type === 'final' || msg.data?.event_type === 'END_OF_AUDIO')
        ) {
          this._sendToBrowser({ type: 'tts_done' })
        } else if (msg.type === 'error') {
          this._log('error', '[TTS] Remote error:', JSON.stringify(msg.data))
          this._sendToBrowser({ type: 'tts_done' })
        }
      })

      ws.addEventListener('close', () => {
        this._log('info', '[TTS] WS closed')
        this.ttsReady = false
        this.ttsWs = null
        if (this.ttsPingTimer !== null) {
          clearInterval(this.ttsPingTimer)
          this.ttsPingTimer = null
        }
      })

      ws.addEventListener('error', (err: any) => {
        this._log('error', '[TTS] WS error:', err)
        this.ttsReady = false
        this.ttsWs = null
        if (this.ttsPingTimer !== null) {
          clearInterval(this.ttsPingTimer)
          this.ttsPingTimer = null
        }
      })

      // Per spec: ConfigureConnection must be first message.
      // speech_sample_rate MUST be a string (spec enum: '8000'|'16000'|'22050'|'24000')
      ws.send(JSON.stringify({
        type: 'config',
        data: {
          model: 'bulbul:v3',
          target_language_code: 'hi-IN',
          speaker: 'shubh',
          pace: 1.1,
          speech_sample_rate: '24000',   // string, not number!
          output_audio_codec: 'linear16',
        },
      }))

      this.ttsReady = true

      // Per spec: connection closes after 1 min of inactivity — ping every 45s
      this.ttsPingTimer = setInterval(() => {
        if (this.ttsWs) {
          try {
            this.ttsWs.send(JSON.stringify({ type: 'ping' }))
            this._log('info', '[TTS] Sent keepalive ping')
          } catch {}
        } else {
          if (this.ttsPingTimer !== null) clearInterval(this.ttsPingTimer)
          this.ttsPingTimer = null
        }
      }, 45000) as any

      this._log('info', `[TTS] Ready. Flushing ${this.ttsQueue.length} queued items.`)
      const queued = this.ttsQueue.splice(0)
      queued.forEach((t) => this._sendToTTS(t))
    } catch (err: any) {
      this._log('error', '[TTS] Init failed:', err.message)
    }
  }

  // ─── STT WebSocket ─────────────────────────────────────────────────────────
  // Per Sarvam AsyncAPI spec:
  // - URL: wss://api.sarvam.ai/speech-to-text/ws?<params>
  // - Auth: Api-Subscription-Key header
  // - Audio msg: { audio: { data: base64, sample_rate: "16000", encoding: "audio/wav" } }
  // - Flush msg: { type: "flush" }
  // - Response: { type: "data"|"error"|"events", data: { ... } }

  async _setupSTT(): Promise<void> {
    if (this.sttWs) {
      this._log('info', '[STT] Already connected, skipping setup')
      return
    }

    const url =
      'https://api.sarvam.ai/speech-to-text/ws' +
      '?language-code=unknown' +
      '&model=saaras:v3' +
      '&mode=codemix' +
      '&input_audio_codec=pcm_s16le' +
      '&vad_signals=true'

    try {
      this._log('info', '[STT] Connecting via fetch() upgrade...')

      const ws = await connectWS(url, {
        'Api-Subscription-Key': this.env.SARVAM_API_KEY,
      })

      this._log('info', '[STT] Connected successfully')
      this.sttWs = ws

      ws.addEventListener('message', (event: MessageEvent) => {
        let msg: any
        try { msg = JSON.parse(event.data.toString()) } catch { return }

        this._log('info', '[STT] msg type:', msg.type)

        if (msg.type === 'data' && msg.data?.transcript) {
          const incoming = msg.data.transcript.trim()

          // Detect when Sarvam resets its buffer after a micro-pause
          if (this.currentInterim && incoming) {
            const lenDrop = incoming.length < this.currentInterim.length * 0.5
            const prefixA = incoming.substring(0, 4)
            const prefixB = this.currentInterim.substring(0, 4)
            if (lenDrop || (prefixA.length >= 2 && prefixA !== prefixB)) {
              this.finalizedTranscripts += (this.finalizedTranscripts ? ' ' : '') + this.currentInterim
              this.currentInterim = ''
            }
          }

          this.currentInterim = incoming
          const display = (this.finalizedTranscripts + ' ' + this.currentInterim).trim()
          this.latestTranscript = display
          this._sendToBrowser({ type: 'stt_interim', text: display })

          if (msg.data.is_final) {
            this.finalizedTranscripts += (this.finalizedTranscripts ? ' ' : '') + this.currentInterim
            this.currentInterim = ''
          }

          // 800ms silence auto-stop
          if (this.vadAutoStopTimer !== null) clearTimeout(this.vadAutoStopTimer)
          this.vadAutoStopTimer = setTimeout(() => {
            this._log('info', '[STT] 800ms silence threshold — auto-stopping')
            const p = this._triggerSttStop().catch((e) => this._log('error', 'stt stop error', e))
            this.ctx.waitUntil(p)
          }, 800) as any

        } else if (msg.type === 'events' && msg.data?.event_type === 'END_SPEECH') {
          this._log('info', '[STT] VAD END_SPEECH signal received')
          const p = this._triggerSttStop().catch((e) => this._log('error', 'stt stop error', e))
          this.ctx.waitUntil(p)

        } else if (msg.type === 'error') {
          this._log('error', '[STT] Remote error:', JSON.stringify(msg.data))
        }
      })

      ws.addEventListener('close', () => {
        this._log('info', '[STT] WS closed')
        this.sttWs = null
      })

      ws.addEventListener('error', (err: any) => {
        this._log('error', '[STT] WS error:', err)
        this.sttWs = null
      })

      // Flush any audio frames that arrived during STT setup
      const buffered = this.sttAudioBuffer.splice(0)
      this._log('info', `[STT] Flushing ${buffered.length} buffered audio frames`)
      for (const m of buffered) {
        ws.send(JSON.stringify({
          audio: { data: m.audio, sample_rate: '16000', encoding: 'audio/wav' },
        }))
      }
    } catch (err: any) {
      this._log('error', '[STT] Init failed:', err.message)
    }
  }

  // ─── Browser message router ────────────────────────────────────────────────

  async handleBrowserMessage(message: any): Promise<void> {
    let msg: any
    try {
      msg = JSON.parse(message.toString())
    } catch {
      this._log('warn', 'Failed to parse browser message')
      return
    }

    if (msg.userId && this.userId === 'unknown_user') {
      this.userId = msg.userId
    }

    this._log('info', `[Browser→DO] type: ${msg.type}`)

    switch (msg.type) {
      case 'interrupt':
        this._log('info', '[INTERRUPT] Halting LLM + TTS')
        this._isLLMRunning = false
        this.ttsQueue = []
        if (this.ttsWs) {
          try { this.ttsWs.close() } catch {}
          this.ttsWs = null
          this.ttsReady = false
        }
        break

      case 'stt_start':
        this._log('info', '[STT] Starting new turn')
        this._isLLMRunning = false
        this.latestTranscript = ''
        this.finalizedTranscripts = ''
        this.currentInterim = ''
        this.sttAudioBuffer = []
        if (this.vadAutoStopTimer !== null) {
          clearTimeout(this.vadAutoStopTimer)
          this.vadAutoStopTimer = null
        }
        if (msg.greetingText && this.history.length === 0) {
          this.history.push({ role: 'user', content: 'hi' })
          this.history.push({ role: 'assistant', content: msg.greetingText })
        }
        await this._setupSTT()
        break

      case 'stt_audio':
        if (this.sttWs) {
          // Per Sarvam spec: { audio: { data, sample_rate, encoding } }
          this.sttWs.send(JSON.stringify({
            audio: { data: msg.audio, sample_rate: '16000', encoding: 'audio/wav' },
          }))
        } else {
          this.sttAudioBuffer.push(msg)
        }
        break

      case 'stt_stop':
        await this._triggerSttStop()
        break

      case 'run_llm':
        if (msg.profileContext) this.profileContext = msg.profileContext
        if (msg.transcript?.trim()) {
          await this._runLLM(msg.transcript.trim())
        }
        break

      default:
        this._log('warn', `Unknown message type: ${msg.type}`)
    }
  }

  // ─── STT stop + LLM trigger ────────────────────────────────────────────────

  async _triggerSttStop(): Promise<void> {
    if (this.vadAutoStopTimer !== null) {
      clearTimeout(this.vadAutoStopTimer)
      this.vadAutoStopTimer = null
    }

    if (!this.latestTranscript && !this.finalizedTranscripts) {
      this._log('warn', '[STT] Stop ignored — no transcript available')
      return
    }

    this._log('info', `[STT] Stopping. Final: "${this.latestTranscript}"`)
    this._sendToBrowser({ type: 'stt_auto_stop' })

    if (this.sttWs) {
      // Per spec: { type: "flush" }
      try { this.sttWs.send(JSON.stringify({ type: 'flush' })) } catch {}
      await new Promise<void>((r) => setTimeout(r, 50))
      try { this.sttWs.close() } catch {}
      this.sttWs = null
    }

    const finalWords = this.latestTranscript?.trim() || this.finalizedTranscripts.trim()
    this.latestTranscript = ''
    this.finalizedTranscripts = ''
    this.currentInterim = ''

    if (finalWords) {
      await this._runLLM(finalWords)
    } else {
      this._sendToBrowser({ type: 'error', message: "Didn't catch that." })
      this._sendToBrowser({ type: 'audio_done' })
    }
  }

  // ─── LLM → TTS pipeline ────────────────────────────────────────────────────

  async _runLLM(transcript: string): Promise<void> {
    if (this._isLLMRunning) {
      this._log('warn', '[LLM] Already running, ignoring duplicate call')
      return
    }
    this._isLLMRunning = true

    this._log('info', `[LLM] Starting for: "${transcript}"`)
    this._sendToBrowser({ type: 'llm_start' })

    const startTime = Date.now()
    let firstTokenTime: number | null = null

    // Ensure TTS is ready before streaming
    if (!this.ttsWs || !this.ttsReady) {
      await this._initTTS()
    } else {
      // Reset TTS for new turn
      try { this.ttsWs.send(JSON.stringify({
          type: 'config',
          data: {
            model: 'bulbul:v3',
            target_language_code: 'hi-IN',
            speaker: 'shubh',
            pace: 1.1,
            speech_sample_rate: '24000',  // string per spec
            output_audio_codec: 'linear16',
            send_completion_event: true,
          },
        })) } catch {}
    }

    try {
      const openai = new OpenAI({
        apiKey: this.env.NVIDIA_API_KEY,
        baseURL: 'https://integrate.api.nvidia.com/v1',
      })

      // ── RAG: embed the user's transcript, fetch top-3 matching facts ─────────
      let ragContext = ''
      try {
        if (this.env.NEON_DB_URL && this.env.AI) {
          const embRes = await this.env.AI.run('@cf/baai/bge-base-en-v1.5', {
            text: [transcript],
          }) as any
          const embedStr = `[${embRes.data[0].join(',')}]`
          const sql = neon(this.env.NEON_DB_URL)
          const matches = await sql`
            SELECT answer
            FROM knowledge_base
            ORDER BY embedding <=> ${embedStr}::vector
            LIMIT 3
          `
          if (matches?.length) {
            ragContext = '\n\nRELEVANT KNOWLEDGE BASE (use this if applicable):\n' +
              matches.map((m: any, i: number) => `Fact ${i + 1}: ${m.answer}`).join('\n\n')
          }
        }
      } catch (ragErr: any) {
        this._log('warn', '[RAG] Context retrieval failed (non-fatal):', ragErr?.message)
      }
      // ── RAG end ────────────────────────────────────────────────────────────────

      const completion = await openai.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: this.profileContext
              ? `${SYSTEM_PROMPT} USER PROFILE: ${this.profileContext}${ragContext}`
              : `${SYSTEM_PROMPT}${ragContext}`,
          },
          ...this.history.slice(-10),
          { role: 'user', content: transcript },
        ],
        temperature: 1,
        top_p: 1,
        max_tokens: 4096,
        stream: true,
      })

      let fullText = ''
      const stripper = new StreamingThinkStripper()
      let sentenceBuffer = ''

      for await (const chunk of completion) {
        if (!this._isLLMRunning) {
          this._log('info', '[LLM] Interrupted. Stopping stream.')
          break
        }
        const textToken = chunk.choices[0]?.delta?.content || ''
        if (!textToken) continue

        if (!firstTokenTime) {
          firstTokenTime = Date.now()
          this._log('info', `[LLM] First token in ${firstTokenTime - startTime}ms`)
        }

        fullText += textToken
        this._sendToBrowser({ type: 'llm_token', text: textToken })

        const cleanToken = stripper.process(textToken)
        if (cleanToken) {
          sentenceBuffer += cleanToken
          const match =
            sentenceBuffer.match(/^(.*?[।.!?\n])\s+(.*)$/s) ||
            (sentenceBuffer.length > 100 ? sentenceBuffer.match(/^(.*?[।.!?\n])(.*)$/s) : null)

          if (match) {
            const sentence = match[1].trim()
            sentenceBuffer = match[2] || ''
            if (sentence.length >= 5) {
              this._sendToTTS(sentence)
            } else {
              sentenceBuffer = sentence + ' ' + sentenceBuffer
            }
          }
        }
      }

      // Flush remaining buffer
      const finalClean = stripper.flush()
      if (finalClean) sentenceBuffer += finalClean

      if (sentenceBuffer.trim()) {
        _splitIntoTTSChunks(sentenceBuffer.trim(), 400).forEach((c) => this._sendToTTS(c))
      }

      if (this.ttsWs) {
        try { this.ttsWs.send(JSON.stringify({ type: 'flush' })) } catch {}
      }

      const cleanText = stripThinkTags(fullText)
      this._sendToBrowser({ type: 'llm_replace', text: cleanText })
      this._log('info', `[LLM] Done in ${Date.now() - startTime}ms. Chars: ${cleanText.length}`)

      this.history.push({ role: 'user', content: transcript })
      this.history.push({ role: 'assistant', content: cleanText })
      if (this.history.length > 20) this.history = this.history.slice(-20)

      this._sendToBrowser({ type: 'llm_done' })
    } catch (err: any) {
      this._log('error', '[LLM] Fatal:', err.message, err.stack)
      this._sendToBrowser({ type: 'error', message: err.message })
    } finally {
      this._isLLMRunning = false
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  _sendToTTS(text: string) {
    if (!text.trim()) return
    if (this.ttsReady && this.ttsWs) {
      this._log('info', `[TTS→] "${text.substring(0, 30)}..."`)
      try { this.ttsWs.send(JSON.stringify({ type: 'text', data: { text } })) } catch {}
    } else {
      this._log('info', `[TTS queue] "${text.substring(0, 30)}..."`)
      this.ttsQueue.push(text)
      if (!this.ttsWs) {
        const p = this._initTTS().catch((e) => this._log('error', 'TTS init error', e))
        this.ctx.waitUntil(p)
      }
    }
  }

  _sendToBrowser(obj: any) {
    if (this.browserWs) {
      try { this.browserWs.send(JSON.stringify(obj)) } catch (err: any) {
        this._log('error', 'Send to browser failed:', err?.message)
      }
    }
  }

  destroy() {
    this._log('info', 'Destroying session')
    if (this.vadAutoStopTimer !== null) clearTimeout(this.vadAutoStopTimer)
    if (this.ttsPingTimer !== null) { clearInterval(this.ttsPingTimer); this.ttsPingTimer = null }
    if (this.ttsWs) { try { this.ttsWs.close() } catch {} }
    if (this.sttWs) { try { this.sttWs.close() } catch {} }
    if (this.browserWs) { try { this.browserWs.close() } catch {} }
    this.ttsWs = null
    this.sttWs = null
    this.browserWs = null
  }
}

// ─── Utilities ─────────────────────────────────────────────────────────────

function _splitIntoTTSChunks(text: string, maxLen = 400) {
  const sentences = text.split(/(?<=[।.!?\n])\s*/)
  const chunks: string[] = []
  let current = ''
  for (const sentence of sentences) {
    if ((current + sentence).length > maxLen) {
      if (current) chunks.push(current.trim())
      let s = sentence
      while (s.length > maxLen) {
        chunks.push(s.slice(0, maxLen).trim())
        s = s.slice(maxLen)
      }
      current = s
    } else {
      current += sentence
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks.filter(Boolean)
}
