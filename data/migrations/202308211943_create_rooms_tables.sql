CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_name TEXT UNIQUE NOT NULL,
    session_id TEXT NOT NULL,
    owner_id INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS room_users (
    room_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    UNIQUE(room_id, user_id) ON CONFLICT REPLACE
);