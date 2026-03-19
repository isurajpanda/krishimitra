import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer } from "ws";
import { VoiceSession, StreamingThinkStripper } from "./voice-session.js";

const SARVAM_API_KEY = process.env.SARVAM_API_KEY;
const SYSTEM_PROMPT = 
  "You are KrishiMitra, a friendly AI assistant for Indian farmers. " +
  "Always respond in the same language the user writes in, using that language's native characters and script only. " +
  "Keep responses helpful, practical and friendly. " +
  "Do not use markdown formatting like bold, headers or bullet points. " +
  "Respond directly without reasoning steps.";

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// Health check
app.get("/", (_req, res) => res.json({ status: "ok", service: "KrishiMitra Server" }));

// Text-only chat proxy (securely uses API key on server)
app.post("/chat", async (req, res) => {
  const { messages } = req.body;
  if (!messages) return res.status(400).json({ error: "Missing messages" });

  try {
    const response = await fetch("https://api.sarvam.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "API-Subscription-Key": SARVAM_API_KEY,
      },
      body: JSON.stringify({
        model: "sarvam-105b",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    // Set headers for streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const stripper = new StreamingThinkStripper();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const dataStr = line.slice(6).trim();
        if (dataStr === "[DONE]") {
          res.write("data: [DONE]\n\n");
          continue;
        }

        try {
          const json = JSON.parse(dataStr);
          const token = json.choices?.[0]?.delta?.content || "";
          const cleanToken = stripper.process(token);

          if (cleanToken) {
            // Re-wrap the clean token in SSE format
            const cleanJson = { choices: [{ delta: { content: cleanToken } }] };
            res.write(`data: ${JSON.stringify(cleanJson)}\n\n`);
          }
        } catch (e) {
          // Ignore malformed chunks
        }
      }
    }
    res.end();
  } catch (err) {
    console.error("[Chat API Error]:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create HTTP server (WebSocket needs raw http.Server)
const server = http.createServer(app);

// Attach WebSocket server at /voice path
const wss = new WebSocketServer({ server, path: "/voice" });

wss.on("connection", (browserWs, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`[Server] New voice session from ${ip}`);

  const session = new VoiceSession(browserWs);

  browserWs.on("message", (message) => {
    session.handleBrowserMessage(message);
  });

  browserWs.on("close", () => {
    console.log(`[Server] Session closed from ${ip}`);
    session.destroy();
  });

  browserWs.on("error", (err) => {
    console.error(`[Server] Browser WS error: ${err.message}`);
    session.destroy();
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 KrishiMitra server running at http://localhost:${PORT}`);
  console.log(`   WebSocket endpoint: ws://localhost:${PORT}/voice\n`);
});
