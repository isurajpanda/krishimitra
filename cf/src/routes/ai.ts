import { Hono } from 'hono'
import { stream } from 'hono/streaming'
import { neon } from '@neondatabase/serverless'
import OpenAI from 'openai'
import { StreamingThinkStripper } from '../utils'

type Bindings = {
  DB: D1Database
  NVIDIA_API_KEY: string
  SARVAM_API_KEY: string
  NEON_DB_URL: string
  AI: Ai
}

const ai = new Hono<{ Bindings: Bindings }>()

const SYSTEM_PROMPT =
  'You are KrishiMitra, a friendly AI assistant for Indian farmers. ' +
  "Always respond in the same language the user writes in, using that language's native characters and script only. " +
  'Keep responses helpful, practical and friendly. ' +
  'Do not use markdown formatting like bold, headers or bullet points. ' +
  'Respond directly without reasoning steps.'

ai.post('/ai-chat', async (c) => {
  const { messages, userId, profileContext } = await c.req.json()
  if (!messages) return c.json({ error: 'Missing messages' }, 400)

  const openai = new OpenAI({
    apiKey: c.env.NVIDIA_API_KEY,
    baseURL: 'https://integrate.api.nvidia.com/v1',
  })

  // --- RAG PIPELINE START ---
  let ragContext = ""
  try {
    const userMsg = messages[messages.length - 1]?.content
    if (userMsg && c.env.NEON_DB_URL && c.env.AI) {
      // 1. Generate Embedding using native Cloudflare Workers AI with BAAI/bge-base-en-v1.5 (768 dims)
      const embeddingRes = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', {
        text: [userMsg]
      }) as any
      
      const embedding = embeddingRes.data[0]
      const embedStr = `[${embedding.join(",")}]`

      // 2. Compute similarity & retrieve from Neon PG database
      const sql = neon(c.env.NEON_DB_URL)
      const matches = await sql`
        SELECT answer, 1 - (embedding <=> ${embedStr}::vector) as similarity
        FROM knowledge_base
        ORDER BY embedding <=> ${embedStr}::vector
        LIMIT 3
      `
      if (matches && matches.length > 0) {
        ragContext = "\n\nRELEVANT KNOWLEDGE BASE CONTEXT (Use this to answer the user's question if applicable):\n" + 
          matches.map((m: any, idx: number) => `Fact ${idx + 1}: ${m.answer}`).join("\n\n")
      }
    }
  } catch (err) {
    console.error("[RAG Pipeline Error]:", err)
    // Non-fatal error, we still proceed to chat
  }
  // --- RAG PIPELINE END ---

  return stream(c, async (stream) => {
    c.header('Content-Type', 'text/event-stream')
    c.header('Cache-Control', 'no-cache')
    c.header('Connection', 'keep-alive')

    try {
      const completion = await openai.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: profileContext ? `${SYSTEM_PROMPT} USER PROFILE: ${profileContext}${ragContext}` : `${SYSTEM_PROMPT}${ragContext}`,
          },
          ...messages,
        ],
        stream: true,
        temperature: 1,
        top_p: 1,
        max_tokens: 4096,
      })

      const stripper = new StreamingThinkStripper()
      let fullText = ''

      for await (const chunk of completion) {
        const token = chunk.choices?.[0]?.delta?.content || ''
        if (!token) continue

        const cleanToken = stripper.process(token)
        if (cleanToken) {
          fullText += cleanToken
          const cleanJson = { choices: [{ delta: { content: cleanToken } }] }
          await stream.write(`data: ${JSON.stringify(cleanJson)}\n\n`)
        }
      }

      const finalClean = stripper.flush()
      if (finalClean) {
        fullText += finalClean
        const cleanJson = { choices: [{ delta: { content: finalClean } }] }
        await stream.write(`data: ${JSON.stringify(cleanJson)}\n\n`)
      }

      if (userId && fullText) {
        const userMsg = messages[messages.length - 1].content
        await c.env.DB.prepare('INSERT INTO chat_history (user_id, role, message) VALUES (?, ?, ?)')
          .bind(userId, 'user', userMsg)
          .run()
        await c.env.DB.prepare('INSERT INTO chat_history (user_id, role, message) VALUES (?, ?, ?)')
          .bind(userId, 'ai', fullText)
          .run()
      }

      await stream.write('data: [DONE]\n\n')
    } catch (err: any) {
      console.error('[Chat API Error]:', err)
      await stream.write(`data: ${JSON.stringify({ error: 'Internal server error' })}\n\n`)
    }
  })
})

ai.post('/crop-recommendation', async (c) => {
  const { season, state, district } = await c.req.json()
  if (!season || !state || !district) {
    return c.json({ error: 'Missing season, state, or district' }, 400)
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
  `

  const openai = new OpenAI({
    apiKey: c.env.NVIDIA_API_KEY,
    baseURL: 'https://integrate.api.nvidia.com/v1',
  })

  try {
    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      top_p: 1,
      max_tokens: 1500,
    })

    const outputRaw = completion.choices[0]?.message?.content || ''
    let jsonStr = outputRaw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
    if (jsonStr.startsWith('\`\`\`json')) {
      jsonStr = jsonStr.replace(/^\`\`\`json/i, '').replace(/\`\`\`$/i, '').trim()
    } else if (jsonStr.startsWith('\`\`\`')) {
      jsonStr = jsonStr.replace(/^\`\`\`/i, '').replace(/\`\`\`$/i, '').trim()
    }

    const data = JSON.parse(jsonStr)
    return c.json(data)
  } catch (err: any) {
    console.error('[Crop Recommendation Error]:', err)
    return c.json({ error: 'Failed to generate recommendations.' }, 500)
  }
})

ai.post('/notifications', async (c) => {
  const { weather, crops, location } = await c.req.json()

  const prompt = `
You are KrishiMitra, an AI farming advisor for Indian farmers.
Generate 4-6 short practical farming notifications/advisories based on the current conditions:
- Weather: ${JSON.stringify(weather || {})}
- Crops being grown: ${JSON.stringify(crops || [])}
- Location: ${location || 'India'}

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
  `

  const openai = new OpenAI({
    apiKey: c.env.NVIDIA_API_KEY,
    baseURL: 'https://integrate.api.nvidia.com/v1',
  })

  try {
    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 1024,
    })

    const outputRaw = completion.choices[0]?.message?.content || ''
    let jsonStr = outputRaw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
    if (jsonStr.startsWith('\`\`\`json')) {
      jsonStr = jsonStr.replace(/^\`\`\`json/i, '').replace(/\`\`\`$/i, '').trim()
    } else if (jsonStr.startsWith('\`\`\`')) {
      jsonStr = jsonStr.replace(/^\`\`\`/i, '').replace(/\`\`\`$/i, '').trim()
    }

    const data = JSON.parse(jsonStr)
    return c.json(data)
  } catch (err: any) {
    console.error('[Notifications Error]:', err)
    return c.json({ error: 'Failed to generate notifications.' }, 500)
  }
})

export default ai
