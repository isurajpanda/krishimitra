import { Hono } from 'hono'

type Bindings = {
  OPENWEATHER_API_KEY: string
}

const weather = new Hono<{ Bindings: Bindings }>()

weather.get('/weather', async (c) => {
  const { lat, lon } = c.req.query()
  const apiKey = c.env.OPENWEATHER_API_KEY

  if (!lat || !lon) return c.json({ error: 'Missing latitude or longitude' }, 400)

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    )
    if (!response.ok) return c.json(await response.json(), response.status as any)
    const data = await response.json()
    return c.json(data)
  } catch (err) {
    console.error('[Weather Proxy Error]:', err)
    return c.json({ error: 'Failed to fetch weather data' }, 500)
  }
})

weather.get('/forecast', async (c) => {
  const { lat, lon } = c.req.query()
  const apiKey = c.env.OPENWEATHER_API_KEY

  if (!lat || !lon) return c.json({ error: 'Missing latitude or longitude' }, 400)

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&cnt=8`
    )
    if (!response.ok) return c.json(await response.json(), response.status as any)
    const data = await response.json()
    return c.json(data)
  } catch (err) {
    console.error('[Forecast Proxy Error]:', err)
    return c.json({ error: 'Failed to fetch forecast data' }, 500)
  }
})

export default weather
