import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";

import { VoiceSession } from "./routes/voice.js";
import { initDb } from "./config/db.js";

import authRoutes from "./routes/auth.js";
import aiRoutes from "./routes/ai.js";
import weatherRoutes from "./routes/weather.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8080; // Standard Railway port

// Initialize database
initDb();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// --- API v0 Routes ---
const apiV0 = express.Router();

// Health check
apiV0.get("/health", (_req, res) => res.json({ status: "ok", service: "KrishiMitra API v0" }));

// Mount routes
apiV0.use("/", authRoutes);
apiV0.use("/", aiRoutes);
apiV0.use("/", weatherRoutes);

app.use("/api/v0", apiV0);

// Serve Static React App
const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));

// Catch-all route to return index.html for SPA routing, except for API routes
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/v0")) {
    return res.status(404).json({ error: "Not found" });
  }
  res.sendFile(path.join(distPath, "index.html"));
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/api/v0/voice" });

wss.on("connection", (browserWs, req) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "unknown_ip";
  const session = new VoiceSession(browserWs, ip);
  console.log(`[${new Date().toISOString()}] [IP:${ip}] New WebSocket connection established.`);
  browserWs.on("message", (msg) => session.handleBrowserMessage(msg));
  browserWs.on("close", () => session.destroy());
});

server.listen(PORT, () => {
  console.log(`\n🚀 KrishiMitra Backend running at http://localhost:${PORT}`);
});
