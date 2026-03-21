import express from "express";

const router = express.Router();

// Weather Proxy Endpoint
router.get("/weather", async (req, res) => {
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
router.get("/forecast", async (req, res) => {
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

export default router;
