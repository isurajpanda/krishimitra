import express from "express";
import OpenAI from "openai";
import { pool } from "../config/db.js";
import { StreamingThinkStripper } from "./voice.js";

const router = express.Router();

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

// AI Chat Endpoint (versioned)
router.post("/ai-chat", async (req, res) => {
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

// Crop Recommendation Endpoint
router.post("/crop-recommendation", async (req, res) => {
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
router.post("/notifications", async (req, res) => {
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
    if (jsonStr.startsWith("\`\`\`json")) {
      jsonStr = jsonStr.replace(/^\`\`\`json/i, "").replace(/\`\`\`$/i, "").trim();
    } else if (jsonStr.startsWith("\`\`\`")) {
      jsonStr = jsonStr.replace(/^\`\`\`/i, "").replace(/\`\`\`$/i, "").trim();
    }

    const data = JSON.parse(jsonStr);
    res.json(data);
  } catch (err) {
    console.error("[Notifications Error]:", err);
    res.status(500).json({ error: "Failed to generate notifications." });
  }
});

export default router;
