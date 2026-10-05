import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

const dbPath = join(app.getPath('userData'), 'app.db')
const db = new Database(dbPath)

// Thêm cột nếu chưa có (kiểm tra thật, không nuốt lỗi)
function addColumnIfMissing(table, column, type) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all()
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`)
    console.log(`Đã thêm cột ${table}.${column}`)
  }
}

// ===== profile =====
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
addColumnIfMissing('profile', 'username', 'TEXT')
addColumnIfMissing('profile', 'level_source', 'TEXT')
addColumnIfMissing('profile', 'occupation', 'TEXT')
addColumnIfMissing('profile', 'interests', 'TEXT')
addColumnIfMissing('profile', 'learner_notes', 'TEXT')
addColumnIfMissing('profile', 'notes_at_count', 'INTEGER DEFAULT 0')
addColumnIfMissing('profile', 'notes_enabled', 'INTEGER DEFAULT 1')

// ===== level_history =====
db.exec(`
  CREATE TABLE IF NOT EXISTS level_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER,
    old_level TEXT,
    new_level TEXT,
    source TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)

// ===== mistakes =====
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
addColumnIfMissing('mistakes', 'next_review_at', 'TEXT')
addColumnIfMissing('mistakes', 'interval_days', 'INTEGER DEFAULT 0')

// ===== chat_messages =====
db.exec(`
  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER,
    role TEXT,
    text TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)
addColumnIfMissing('chat_messages', 'conversation_id', 'INTEGER')

// ===== conversations =====
db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER,
    title TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)
addColumnIfMissing('conversations', 'topic', 'TEXT')

// ===== vocabulary =====
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