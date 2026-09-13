CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visitor_id TEXT,
    name TEXT,
    age INTEGER,
    city TEXT,
    interests TEXT,
    about TEXT,
    age_range TEXT,
    personality TEXT,
    relationship_goal TEXT,
    activities TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contacts_created_at
ON contacts(created_at);

CREATE INDEX IF NOT EXISTS idx_profiles_visitor_id
ON profiles(visitor_id);
