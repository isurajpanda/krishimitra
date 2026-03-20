import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import pkg from "pg";
const { Pool } = pkg;
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

// --- PostgreSQL Setup ---
const dbConfig = {
  user: "postgres",
  host: "localhost",
  database: "postgres", // Start with default postgres DB
  password: "password",
  port: 5432,
};

let pool = new Pool(dbConfig);

// Initialize database
async function initDb() {
  try {
    let client = await pool.connect();
    console.log("[DB] Connected to PostgreSQL (default)");

    // 1. Create the krishimitra database if it doesn't exist
    const dbName = "krishimitra";
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
    if (res.rowCount === 0) {
      console.log(`[DB] Creating database "${dbName}"...`);
      // CREATE DATABASE cannot be run in a transaction, and pg 'query' usually is.
      // We'll use the client directly.
      await client.query(`CREATE DATABASE ${dbName}`);
    }
    client.release();
    await pool.end();

    // 2. Reconnect to the krishimitra database
    pool = new Pool({ ...dbConfig, database: dbName });
    const finalClient = await pool.connect();
    console.log(`[DB] Connected to database "${dbName}"`);

    // 3. Initialize schema
    await finalClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone_number VARCHAR(15) UNIQUE NOT NULL,
        name VARCHAR(100),
        location VARCHAR(200),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await finalClient.query(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    finalClient.release();
    console.log("[DB] Schema initialized");
  } catch (err) {
    console.error("[DB] Error initializing database:", err.message);
    // Fallback: use 'postgres' database if 'krishimitra' fails
    console.log("[DB] Falling back to default 'postgres' database for tables...");
    pool = new Pool(dbConfig);
  }
}

initDb();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// --- API v0 Routes ---
const apiV0 = express.Router();

// Health check
apiV0.get("/health", (_req, res) => res.json({ status: "ok", service: "KrishiMitra API v0" }));

// Auth - Simple Login
apiV0.post("/auth/login", async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ error: "Phone number is required" });

  try {
    // Upsert user
    const result = await pool.query(
      "INSERT INTO users (phone_number) VALUES ($1) ON CONFLICT (phone_number) DO UPDATE SET phone_number = EXCLUDED.phone_number RETURNING *",
      [phoneNumber]
    );
    const user = result.rows[0];
    res.json({ success: true, user });
  } catch (err) {
    console.error("[Auth Error]:", err);
    res.status(500).json({ error: "Authentication failed" });
  }
});

// Text-only chat proxy
apiV0.post("/ai-chat", async (req, res) => {
  const { messages, userId } = req.body;
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

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const stripper = new StreamingThinkStripper();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const dataStr = line.slice(6).trim();
        if (dataStr === "[DONE]") {
          // Log history to DB if userId provided
          if (userId && fullText) {
             const userMsg = messages[messages.length - 1].content;
             await pool.query("INSERT INTO chat_history (user_id, role, message) VALUES ($1, $2, $3)", [userId, 'user', userMsg]);
             await pool.query("INSERT INTO chat_history (user_id, role, message) VALUES ($1, $2, $3)", [userId, 'ai', fullText]);
          }
          res.write("data: [DONE]\n\n");
          continue;
        }

        try {
          const json = JSON.parse(dataStr);
          const token = json.choices?.[0]?.delta?.content || "";
          const cleanToken = stripper.process(token);

          if (cleanToken) {
            fullText += cleanToken;
            const cleanJson = { choices: [{ delta: { content: cleanToken } }] };
            res.write(`data: ${JSON.stringify(cleanJson)}\n\n`);
          }
        } catch (e) { }
      }
    }
    res.end();
  } catch (err) {
    console.error("[Chat API Error]:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.use("/api/v0", apiV0);

// Root redirect or simple info
app.get("/", (_req, res) => res.json({ status: "ok", version: "v0", endpoints: "/api/v0" }));

const server = http.createServer(app);

// Updated WebSocket path to match v0
const wss = new WebSocketServer({ server, path: "/api/v0/voice" });

wss.on("connection", (browserWs, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`[Server] New voice session (v0) from ${ip}`);

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
  console.log(`\n🚀 KrishiMitra v0 server running at http://localhost:${PORT}`);
  console.log(`   API Base: http://localhost:${PORT}/api/v0`);
  console.log(`   WebSocket endpoint: ws://localhost:${PORT}/api/v0/voice\n`);
});
