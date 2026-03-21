import { Hono } from 'hono'
import { cors } from 'hono/cors'
import auth from './routes/auth'
import ai from './routes/ai'
import weather from './routes/weather'
import { VoiceSession } from './routes/voice'

type Bindings = {
  DB: D1Database
  NVIDIA_API_KEY: string
  SARVAM_API_KEY: string
  OPENWEATHER_API_KEY: string
  VOICE_SESSION: DurableObjectNamespace
  NEON_DB_URL: string
  AI: Ai
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors())

app.get('/api/v0/health', (c) =>
  c.json({ status: 'ok', service: 'KrishiMitra API v0 (Cloudflare Worker)' })
)

// Mount modular routes
app.route('/api/v0', auth)
app.route('/api/v0', ai)
app.route('/api/v0', weather)

// Voice WebSocket — always forward to a fresh Durable Object.
app.get('/api/v0/voice', async (c) => {
  try {
    const upgradeHeader = c.req.raw.headers.get('Upgrade')
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
      return c.text('Expected Upgrade: websocket', 426)
    }
    const id = c.env.VOICE_SESSION.newUniqueId()
    const stub = c.env.VOICE_SESSION.get(id)
    // Forward raw request directly — do NOT clone(), it breaks the WS upgrade
    return stub.fetch(c.req.raw)
  } catch (err: any) {
    console.error('[Voice Route Error]:', err?.message ?? err)
    return c.text('Internal Server Error', 500)
  }
})

// ── Diagnostic: tests Sarvam connectivity using fetch() with Upgrade:websocket
// This is IDENTICAL to the connectWS() helper used by voice.ts in the DO.
// Hit GET https://krishimitra.qzz.io/api/v0/voice/test
app.get('/api/v0/voice/test', async (c) => {
  const sarvamKey = c.env.SARVAM_API_KEY
  const nvidiaKey = c.env.NVIDIA_API_KEY
  const results: Record<string, any> = {
    sarvam_key_set: !!sarvamKey,
    sarvam_key_prefix: sarvamKey ? sarvamKey.substring(0, 8) + '...' : 'MISSING',
    nvidia_key_set: !!nvidiaKey,
    nvidia_key_prefix: nvidiaKey ? nvidiaKey.substring(0, 10) + '...' : 'MISSING',
    method: 'fetch() with Upgrade:websocket + Api-Subscription-Key header',
  }

  // ── STT: use fetch() exactly as connectWS() does in voice.ts ────────────
  try {
    const sttUrl =
      'https://api.sarvam.ai/speech-to-text/ws?language-code=unknown&model=saaras:v3&mode=codemix&input_audio_codec=pcm_s16le&vad_signals=true'

    const sttResp = await fetch(sttUrl, {
      headers: {
        Upgrade: 'websocket',
        'Api-Subscription-Key': sarvamKey,
      },
    })

    results.stt_http_status = sttResp.status
    const sttWs = sttResp.webSocket

    if (!sttWs) {
      results.stt_ws = `FAIL — no webSocket in response (HTTP ${sttResp.status})`
    } else {
      sttWs.accept()
      results.stt_ws = `OK — HTTP ${sttResp.status}, WebSocket upgrade succeeded`
      try { sttWs.close() } catch {}
    }
  } catch (e: any) {
    results.stt_ws = `EXCEPTION: ${e?.message}`
  }

  // ── TTS: use fetch() exactly as connectWS() does in voice.ts ────────────
  try {
    const ttsUrl = 'https://api.sarvam.ai/text-to-speech/ws?model=bulbul:v3&send_completion_event=true'

    const ttsResp = await fetch(ttsUrl, {
      headers: {
        Upgrade: 'websocket',
        'Api-Subscription-Key': sarvamKey,
      },
    })

    results.tts_http_status = ttsResp.status
    const ttsWs = ttsResp.webSocket

    if (!ttsWs) {
      results.tts_ws = `FAIL — no webSocket in response (HTTP ${ttsResp.status})`
    } else {
      ttsWs.accept()
      results.tts_ws = `OK — HTTP ${ttsResp.status}, WebSocket upgrade succeeded`
      try { ttsWs.close() } catch {}
    }
  } catch (e: any) {
    results.tts_ws = `EXCEPTION: ${e?.message}`
  }

  return c.json(results)
})

// IMPORTANT: Export the Durable Object class so Cloudflare can register it
export { VoiceSession }

export default app
