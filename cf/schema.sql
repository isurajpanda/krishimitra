-- D1 Schema for KrishiMitra

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    location TEXT,
    lat REAL,
    lon REAL,
    farm_type TEXT,
    primary_crops TEXT,
    preferred_language TEXT,
    state TEXT,
    district TEXT,
    units TEXT,
    weather_alerts INTEGER DEFAULT 0, -- 0 for false, 1 for true
    pest_warnings INTEGER DEFAULT 0,
    market_trends INTEGER DEFAULT 0,
    onboarded INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Conversation sessions (like ChatGPT/Gemini panels)
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,              -- random UUID
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Chat',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'user' or 'ai'
    message TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
