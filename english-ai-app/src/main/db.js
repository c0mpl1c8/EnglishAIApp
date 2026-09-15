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
} catch (e) {
  // cột đã tồn tại rồi, bỏ qua lỗi này
}

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

db.exec(`
  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER,
    role TEXT,
    text TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)

export default db