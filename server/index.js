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
import OpenAI from "openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SARVAM_API_KEY = process.env.SARVAM_API_KEY;
const openai = new OpenAI({
  apiKey: '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',
  baseURL: 'https://integrate.api.nvidia.com/v1',
});
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
  max: 20, // Increase pool size
  idleTimeoutMillis: 30000,
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
        preferred_language VARCHAR(50) DEFAULT 'English',
        lat DECIMAL(10, 8),
        lon DECIMAL(11, 8),
        units VARCHAR(10) DEFAULT 'Metric',
        weather_alerts BOOLEAN DEFAULT TRUE,
        pest_warnings BOOLEAN DEFAULT TRUE,
        market_trends BOOLEAN DEFAULT TRUE,
        state VARCHAR(100) DEFAULT 'Maharashtra',
        district VARCHAR(100) DEFAULT 'Pune',
        onboarded BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Add new columns if they don't exist (for existing DBs)
    const newCols = [
      { name: 'lon', type: 'DOUBLE PRECISION' },
      { name: 'preferred_language', type: "VARCHAR(20) DEFAULT 'English'" },
      { name: 'units', type: "VARCHAR(20) DEFAULT 'Metric'" },
      { name: 'weather_alerts', type: 'BOOLEAN DEFAULT TRUE' },
      { name: 'pest_warnings', type: 'BOOLEAN DEFAULT TRUE' },
      { name: 'district', type: "VARCHAR(100) DEFAULT 'Pune'" },
      { name: 'state', type: "VARCHAR(100) DEFAULT 'Maharashtra'" },
      { name: 'market_trends', type: 'BOOLEAN DEFAULT FALSE' },
    ];
    for (const col of newCols) {
      try {
        await finalClient.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
      } catch (e) { /* column already exists */ }
    }
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

// Get Profile
apiV0.get("/auth/profile/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      "SELECT id, name, email, location, lat, lon, farm_type, primary_crops, preferred_language, state, district, units, weather_alerts, pest_warnings, market_trends, onboarded FROM users WHERE id = $1",
      [userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("[Profile Fetch Error]:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Update Profile (Onboarding & Profile Page)
apiV0.patch("/auth/profile/:userId", async (req, res) => {
  const { userId } = req.params;
  const { name, location, state, district, lat, lon, farmType, primaryCrops, preferredLanguage, units, weatherAlerts, pestWarnings, marketTrends } = req.body;

  try {
    // Dynamically build update query to handle partial updates
    const updates = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) { updates.push(`name = $${idx++}`); values.push(name); }
    if (location !== undefined) { updates.push(`location = $${idx++}`); values.push(location); }
    if (state !== undefined) { updates.push(`state = $${idx++}`); values.push(state); }
    if (district !== undefined) { updates.push(`district = $${idx++}`); values.push(district); }
    if (lat !== undefined) { updates.push(`lat = $${idx++}`); values.push(lat); }
    if (lon !== undefined) { updates.push(`lon = $${idx++}`); values.push(lon); }
    if (farmType !== undefined) { updates.push(`farm_type = $${idx++}`); values.push(farmType); }
    if (primaryCrops !== undefined) { updates.push(`primary_crops = $${idx++}`); values.push(primaryCrops); }
    if (preferredLanguage !== undefined) { updates.push(`preferred_language = $${idx++}`); values.push(preferredLanguage); }
    if (units !== undefined) { updates.push(`units = $${idx++}`); values.push(units); }
    if (weatherAlerts !== undefined) { updates.push(`weather_alerts = $${idx++}`); values.push(weatherAlerts); }
    if (pestWarnings !== undefined) { updates.push(`pest_warnings = $${idx++}`); values.push(pestWarnings); }
    if (marketTrends !== undefined) { updates.push(`market_trends = $${idx++}`); values.push(marketTrends); }
    
    // Always mark as onboarded if it was a profile update
    updates.push(`onboarded = TRUE`);

    if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });

    values.push(userId);
    const query = `UPDATE users SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`;
    
    const result = await pool.query(query, values);
    if (result.rowCount === 0) return res.status(404).json({ error: "User not found" });
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error("[Profile Update Error]:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Get Chat History
apiV0.get("/auth/chat-history/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      "SELECT role, message as content, timestamp FROM chat_history WHERE user_id = $1 ORDER BY timestamp ASC LIMIT 50",
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("[Chat History Error]:", err);
    res.status(500).json({ error: "Failed to fetch chat history" });
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
        messages: [
          { 
            role: "system", 
            content: req.body.profileContext 
              ? `${SYSTEM_PROMPT} USER PROFILE: ${req.body.profileContext}` 
              : SYSTEM_PROMPT 
          }, 
          ...messages
        ],
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
    let streamBuffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      streamBuffer += decoder.decode(value, { stream: true });
      const lines = streamBuffer.split("\n");
      streamBuffer = lines.pop() || "";

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

// Weather Proxy Endpoint
apiV0.get("/weather", async (req, res) => {
  const { lat, lon } = req.query;
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!lat || !lon) {
    return res.status(400).json({ error: "Missing latitude or longitude" });
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    );
    
    if (!response.ok) {
      const errData = await response.json();
      return res.status(response.status).json(errData);
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("[Weather Proxy Error]:", err);
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

// Forecast Proxy Endpoint (5-day/3-hour forecast, free tier)
apiV0.get("/forecast", async (req, res) => {
  const { lat, lon } = req.query;
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!lat || !lon) {
    return res.status(400).json({ error: "Missing latitude or longitude" });
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&cnt=8`
    );
    
    if (!response.ok) {
      const errData = await response.json();
      return res.status(response.status).json(errData);
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("[Forecast Proxy Error]:", err);
    res.status(500).json({ error: "Failed to fetch forecast data" });
  }
});

// Crop Recommendation Endpoint
apiV0.post("/crop-recommendation", async (req, res) => {
  const { season, state, district } = req.body;
  if (!season || !state || !district) {
    return res.status(400).json({ error: "Missing season, state, or district" });
  }

  const prompt = `
You are an expert Indian agricultural scientist. A farmer has requested crop recommendations.
Details:
- Season: ${season}
- Location: ${district}, ${state}, India

Based on the typical soil composition, climate, water availability, and market demand for this region, provide the top 5 best crop recommendations.
You MUST output your response strictly as a JSON object matching this schema exactly:
{
  "soilInfo": "Brief description of typical soil here (e.g., 'Red laterite soil')",
  "recommendations": [
    {
      "rank": 1,
      "cropName": "Name of crop",
      "matchPercentage": 95,
      "reason": "Short reason why",
      "waterNeed": "High/Medium/Low",
      "potentialProfit": "e.g., ₹40k/Acre",
      "investmentCost": "e.g., ₹15k/Acre",
      "expectedYield": "e.g., 25 q/Acre",
      "growingDuration": "e.g., 120 days",
      "optimalPlanting": "e.g., 15-20 June",
      "badge": "e.g., High Yield",
      "tips": "One practical tip"
    }
  ]
}
Return ONLY valid JSON. Do not include markdown formatting like \`\`\`json.
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      top_p: 1,
      max_tokens: 1500,
    });

    const outputRaw = completion.choices[0]?.message?.content || "";
    let jsonStr = outputRaw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    if (jsonStr.startsWith("\`\`\`json")) {
        jsonStr = jsonStr.replace(/^\`\`\`json/i, "").replace(/\`\`\`$/i, "").trim();
    } else if (jsonStr.startsWith("\`\`\`")) {
        jsonStr = jsonStr.replace(/^\`\`\`/i, "").replace(/\`\`\`$/i, "").trim();
    }

    const data = JSON.parse(jsonStr);
    res.json(data);
  } catch (err) {
    console.error("[Crop Recommendation Error]:", err);
    res.status(500).json({ error: "Failed to generate recommendations." });
  }
});

// AI-powered Notifications/Advisories Endpoint
apiV0.post("/notifications", async (req, res) => {
  const { weather, crops, location } = req.body;

  const prompt = `
You are KrishiMitra, an AI farming advisor for Indian farmers.
Generate 4-6 short practical farming notifications/advisories based on the current conditions:
- Weather: ${JSON.stringify(weather || {})}
- Crops being grown: ${JSON.stringify(crops || [])}
- Location: ${location || "India"}

Categories: "weather", "crop", "advisory", "seasonal"
Priorities: "high", "medium", "low"

Return ONLY valid JSON:
{
  "notifications": [
    {
      "id": 1,
      "category": "weather",
      "priority": "high",
      "title": "Brief alert title",
      "body": "1-2 sentence actionable advice",
      "timeAgo": "Just now"
    }
  ]
}
Do not include markdown formatting. Return ONLY JSON.
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 1024,
    });

    const outputRaw = completion.choices[0]?.message?.content || "";
    let jsonStr = outputRaw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.replace(/^```json/i, "").replace(/```$/i, "").trim();
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```/i, "").replace(/```$/i, "").trim();
    }

    const data = JSON.parse(jsonStr);
    res.json(data);
  } catch (err) {
    console.error("[Notifications Error]:", err);
    res.status(500).json({ error: "Failed to generate notifications." });
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
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "unknown_ip";
  const session = new VoiceSession(browserWs, ip);
  console.log(`[${new Date().toISOString()}] [IP:${ip}] New WebSocket connection established.`);
  browserWs.on("message", (msg) => session.handleBrowserMessage(msg));
  browserWs.on("close", () => session.destroy());
});

server.listen(PORT, () => {
  console.log(`\n🚀 KrishiMitra v0 running at https://10.254.238.20:${PORT}`);
});
