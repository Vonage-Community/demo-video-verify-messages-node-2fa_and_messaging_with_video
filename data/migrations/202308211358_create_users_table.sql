CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    admin INTEGER DEFAULT 0,
    phone_number TEXT
);

INSERT INTO users (username, password, admin) VALUES ('root', '$2b$10$SR7OXOC2JUaQi3YMPuV3a.m5hUeSx1zhb5xjMGZmCbCW/.4f/PCg6', 1);