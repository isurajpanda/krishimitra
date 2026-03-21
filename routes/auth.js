import express from "express";
import crypto from "crypto";
import { pool } from "../config/db.js";

const router = express.Router();

// --- Helper: Password Hashing ---
function hashPassword(password, salt) {
  return crypto.createHash("sha256").update(password + salt).digest("hex");
}

// Signup Endpoint
router.post("/auth/signup", async (req, res) => {
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
router.post("/auth/login", async (req, res) => {
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
router.get("/auth/profile/:userId", async (req, res) => {
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
router.patch("/auth/profile/:userId", async (req, res) => {
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
router.get("/auth/chat-history/:userId", async (req, res) => {
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

export default router;
