import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

const auth = new Hono<{ Bindings: Bindings }>()

async function hashPassword(password: string, salt: string) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + salt)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

auth.post('/auth/signup', async (c) => {
  const { name, email, password } = await c.req.json()

  if (!name) return c.json({ error: 'Name is required' }, 400)

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email)) {
    return c.json({ error: 'Invalid email format' }, 400)
  }
  if (!password || password.length < 6) {
    return c.json({ error: 'Password must be at least 6 characters' }, 400)
  }

  try {
    const salt = crypto.randomUUID()
    const hash = await hashPassword(password, salt)

    const result = await c.env.DB.prepare(
      'INSERT INTO users (name, email, password_hash, salt) VALUES (?, ?, ?, ?) RETURNING id, email, name'
    )
      .bind(name, email, hash, salt)
      .first()

    return c.json({ success: true, user: result })
  } catch (err: any) {
    if (err.message.includes('UNIQUE constraint failed: users.email')) {
      return c.json({ error: 'Email already exists' }, 400)
    }
    console.error('[Signup Error]:', err)
    return c.json({ error: 'Signup failed' }, 500)
  }
})

auth.post('/auth/login', async (c) => {
  const { email, password } = await c.req.json()
  if (!email || !password) return c.json({ error: 'Missing email or password' }, 400)

  try {
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<any>()
    if (!user) {
      return c.json({ error: 'Invalid email or password' }, 401)
    }

    const hash = await hashPassword(password, user.salt)

    if (hash === user.password_hash) {
      return c.json({
        success: true,
        user: { id: user.id, email: user.email, name: user.name, onboarded: user.onboarded },
      })
    } else {
      return c.json({ error: 'Invalid email or password' }, 401)
    }
  } catch (err) {
    console.error('[Login Error]:', err)
    return c.json({ error: 'Login failed' }, 500)
  }
})

auth.get('/auth/profile/:userId', async (c) => {
  const userId = c.req.param('userId')
  try {
    const user = await c.env.DB.prepare(
      'SELECT id, name, email, location, lat, lon, farm_type, primary_crops, preferred_language, state, district, units, weather_alerts, pest_warnings, market_trends, onboarded FROM users WHERE id = ?'
    )
      .bind(userId)
      .first()
    if (!user) return c.json({ error: 'User not found' }, 404)
    return c.json(user)
  } catch (err) {
    console.error('[Profile Fetch Error]:', err)
    return c.json({ error: 'Failed to fetch profile' }, 500)
  }
})

auth.patch('/auth/profile/:userId', async (c) => {
  const userId = c.req.param('userId')

  try {
    const {
      name,
      location,
      state,
      district,
      lat,
      lon,
      farmType,
      primaryCrops,
      preferredLanguage,
      units,
      weatherAlerts,
      pestWarnings,
      marketTrends,
    } = await c.req.json()

    // Dynamically build update query to handle partial updates
    const updates: string[] = []
    const values: any[] = []

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (location !== undefined) { updates.push('location = ?'); values.push(location); }
    if (state !== undefined) { updates.push('state = ?'); values.push(state); }
    if (district !== undefined) { updates.push('district = ?'); values.push(district); }
    if (lat !== undefined) { updates.push('lat = ?'); values.push(lat); }
    if (lon !== undefined) { updates.push('lon = ?'); values.push(lon); }
    if (farmType !== undefined) { updates.push('farm_type = ?'); values.push(farmType); }
    if (primaryCrops !== undefined) { updates.push('primary_crops = ?'); values.push(primaryCrops); }
    if (preferredLanguage !== undefined) { updates.push('preferred_language = ?'); values.push(preferredLanguage); }
    if (units !== undefined) { updates.push('units = ?'); values.push(units); }
    if (weatherAlerts !== undefined) { updates.push('weather_alerts = ?'); values.push(weatherAlerts); }
    if (pestWarnings !== undefined) { updates.push('pest_warnings = ?'); values.push(pestWarnings); }
    if (marketTrends !== undefined) { updates.push('market_trends = ?'); values.push(marketTrends); }

    // Always mark as onboarded if it was a profile update
    updates.push('onboarded = 1') // SQLite handles TRUE as 1

    if (updates.length === 0) return c.json({ error: 'No fields to update' }, 400)

    values.push(userId)
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ? RETURNING *`

    const user = await c.env.DB.prepare(query).bind(...values).first()
    if (!user) return c.json({ error: 'User not found' }, 404)
    return c.json({ success: true, user })
  } catch (err) {
    console.error('[Profile Update Error]:', err)
    return c.json({ error: 'Failed to update profile' }, 500)
  }
})

auth.get('/auth/chat-history/:userId', async (c) => {
  const userId = c.req.param('userId')
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT role, message as content, timestamp FROM chat_history WHERE user_id = ? ORDER BY timestamp ASC LIMIT 50'
    )
      .bind(userId)
      .all()
    return c.json(results)
  } catch (err) {
    console.error('[Chat History Error]:', err)
    return c.json({ error: 'Failed to fetch chat history' }, 500)
  }
})

export default auth
