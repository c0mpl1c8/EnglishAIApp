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

export default db