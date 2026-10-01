import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

const dbPath = join(app.getPath('userData'), 'app.db')
const db = new Database(dbPath)

db.exec(`
  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    native_language TEXT,
    target_language TEXT,
    goal TEXT,
    cefr_level TEXT,
    feedback TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)

try {
  db.exec(`ALTER TABLE profile ADD COLUMN username TEXT`)
} catch (e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS mistakes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER,
    category TEXT,
    original_text TEXT,
    corrected_text TEXT,
    explanation TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)

try {
  db.exec(`ALTER TABLE mistakes ADD COLUMN next_review_at TEXT`)
} catch (e) {}
try {
  db.exec(`ALTER TABLE mistakes ADD COLUMN interval_days INTEGER DEFAULT 0`)
} catch (e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER,
    role TEXT,
    text TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)

try {
  db.exec(`ALTER TABLE chat_messages ADD COLUMN conversation_id INTEGER`)
} catch (e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER,
    title TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)

try {
  db.exec(`ALTER TABLE conversations ADD COLUMN topic TEXT`)
} catch (e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS vocabulary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER,
    word TEXT,
    meaning TEXT,
    example_sentence TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)

export default db