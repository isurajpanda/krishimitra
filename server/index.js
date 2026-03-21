import "dotenv/config";
import https from "https";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "pg";
import crypto from "crypto";
const { Pool } = pkg;
import { WebSocketServer } from "ws";
import { VoiceSession, StreamingThinkStripper } from "./voice-session.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SARVAM_API_KEY = process.env.SARVAM_API_KEY;
const SYSTEM_PROMPT = 
  "You are KrishiMitra, a friendly AI assistant for Indian farmers. " +
  "Always respond in the same language the user writes in, using that language's native characters and script only. " +
  "Keep responses helpful, practical and friendly. " +
  "Do not use markdown formatting like bold, headers or bullet points. " +
  "Respond directly without reasoning steps.";

const PORT = process.env.PORT || 3001;

// --- Helper: Passowrd Hashing ---
function hashPassword(password, salt) {
  return crypto.createHash("sha256").update(password + salt).digest("hex");
}

// --- PostgreSQL Setup ---
const dbConfig = {
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "password",
  port: 5432,
};

let pool = new Pool(dbConfig);

// Initialize database
async function initDb() {
  try {
    let client = await pool.connect();
    console.log("[DB] Connected to PostgreSQL (default)");

    // Ensure krishimitra database exists
    const dbName = "krishimitra";
    const dbCheck = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
    if (dbCheck.rowCount === 0) {
      console.log(`[DB] Creating database "${dbName}"...`);
      await client.query(`CREATE DATABASE ${dbName}`);
    }
    client.release();
    await pool.end();

    // Reconnect to krishimitra
    pool = new Pool({ ...dbConfig, database: dbName });
    const finalClient = await pool.connect();
    
    // FORCED RESET IF SCHEMA IS OLD (Dev phase)
    const checkEmail = await finalClient.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='users' AND column_name='email'
    `);

    if (checkEmail.rowCount === 0) {
      console.log("[DB] Outdated schema detected. RESETTING tables...");
      await finalClient.query("DROP TABLE IF EXISTS chat_history CASCADE");
      await finalClient.query("DROP TABLE IF EXISTS users CASCADE");
    }

    // Modern Schema
    await finalClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        location VARCHAR(200),
        farm_type VARCHAR(100),
        primary_crops TEXT[],
        onboarded BOOLEAN DEFAULT FALSE,
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
    console.log("[DB] Database and Schema Ready");
  } catch (err) {
    console.error("[DB] Error initializing database:", err.message);
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

// Signup Endpoint
apiV0.post("/auth/signup", async (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name) return res.status(400).json({ error: "Name is required" });
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    const salt = crypto.randomUUID();
    const hash = hashPassword(password, salt);
    
    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash, salt) VALUES ($1, $2, $3, $4) RETURNING id, email, name",
      [name, email, hash, salt]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: "Email already exists" });
    }
    console.error("[Signup Error]:", err);
    res.status(500).json({ error: "Signup failed" });
  }
});

// Login Endpoint
apiV0.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Missing email or password" });

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rowCount === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];
    const hash = hashPassword(password, user.salt);
    
    if (hash === user.password_hash) {
      res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, onboarded: user.onboarded } });
    } else {
      res.status(401).json({ error: "Invalid email or password" });
    }
  } catch (err) {
    console.error("[Login Error]:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Update Profile (Onboarding)
apiV0.patch("/auth/profile/:userId", async (req, res) => {
  const { userId } = req.params;
  const { location, farmType, primaryCrops } = req.body;

  try {
    const result = await pool.query(
      "UPDATE users SET location = $1, farm_type = $2, primary_crops = $3, onboarded = TRUE WHERE id = $4 RETURNING *",
      [location, farmType, primaryCrops, userId]
    );
    
    if (result.rowCount === 0) return res.status(404).json({ error: "User not found" });
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error("[Profile Update Error]:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// AI Chat Endpoint (versioned)
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

app.get("/", (_req, res) => res.json({ status: "ok", version: "v0" }));

const certsPath = path.join(__dirname, "..", "certs");
const options = {
  key: fs.readFileSync(path.join(certsPath, "key.pem")),
  cert: fs.readFileSync(path.join(certsPath, "cert.pem")),
};

const server = https.createServer(options, app);
const wss = new WebSocketServer({ server, path: "/api/v0/voice" });

wss.on("connection", (browserWs, req) => {
  const session = new VoiceSession(browserWs);
  browserWs.on("message", (msg) => session.handleBrowserMessage(msg));
  browserWs.on("close", () => session.destroy());
});

server.listen(PORT, () => {
  console.log(`\n🚀 KrishiMitra v0 running at https://10.254.238.20:${PORT}`);
});
