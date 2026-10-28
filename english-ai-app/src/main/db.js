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
addColumnIfMissing('mistakes', 'skill', 'TEXT')
addColumnIfMissing('mistakes', 'focus', 'TEXT')

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
addColumnIfMissing('chat_messages', 'structure_suggestion', 'TEXT')

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
addColumnIfMissing('conversations', 'pinned', 'INTEGER DEFAULT 0')
addColumnIfMissing('conversations', 'section_id', 'INTEGER')
db.exec(`
  CREATE TABLE IF NOT EXISTS conversation_sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)

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
db.exec(`
  CREATE TABLE IF NOT EXISTS skill_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER,
    skill TEXT,
    correct INTEGER,
    source TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)
addColumnIfMissing('skill_events', 'focus', 'TEXT')
addColumnIfMissing('skill_events', 'difficulty', 'TEXT')
addColumnIfMissing('skill_events', 'strategy', 'TEXT')
db.exec(`
  CREATE TABLE IF NOT EXISTS learning_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL,
    skill TEXT NOT NULL,
    focus TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    correct INTEGER NOT NULL DEFAULT 0,
    repetitions INTEGER NOT NULL DEFAULT 0,
    lapses INTEGER NOT NULL DEFAULT 0,
    interval_days INTEGER NOT NULL DEFAULT 0,
    next_review_at TEXT,
    last_outcome INTEGER,
    last_strategy TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(profile_id, skill, focus)
  )
`)
db.exec(`
  CREATE TABLE IF NOT EXISTS writing_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL,
    prompt TEXT,
    response TEXT NOT NULL,
    rubric TEXT NOT NULL,
    overall INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)
db.exec(`
  CREATE TABLE IF NOT EXISTS quiz_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER,
    question TEXT,
    skill TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)
db.exec(`
  CREATE TABLE IF NOT EXISTS vocab_folders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER,
    name TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)
addColumnIfMissing('vocabulary', 'folder_id', 'INTEGER')

db.exec(`
  CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER,
    mode TEXT,
    label TEXT,
    total INTEGER,
    correct INTEGER,
    details TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)
db.exec(`
  CREATE TABLE IF NOT EXISTS listening_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL,
    level TEXT NOT NULL,
    topic TEXT NOT NULL,
    title TEXT NOT NULL,
    total INTEGER NOT NULL,
    correct INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)
db.exec(`
  CREATE TABLE IF NOT EXISTS game_seen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER,
    kind TEXT,
    text TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)

// Keep profile-scoped history and flashcard lookups fast as learner data grows.
// The vocabulary index uses the same NOCASE collation as duplicate checks.
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_chat_profile_role_id ON chat_messages(profile_id, role, id DESC);
  CREATE INDEX IF NOT EXISTS idx_chat_conversation_id ON chat_messages(conversation_id, id);
  CREATE INDEX IF NOT EXISTS idx_conversations_profile_updated ON conversations(profile_id, updated_at DESC);
  CREATE INDEX IF NOT EXISTS idx_mistakes_profile_created ON mistakes(profile_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_mistakes_profile_skill_focus ON mistakes(profile_id, skill, lower(COALESCE(focus, category)));
  CREATE INDEX IF NOT EXISTS idx_vocabulary_profile_word ON vocabulary(profile_id, word COLLATE NOCASE);
  CREATE INDEX IF NOT EXISTS idx_skill_events_profile_id ON skill_events(profile_id, id DESC);
  CREATE INDEX IF NOT EXISTS idx_quiz_attempts_profile_mode_id ON quiz_attempts(profile_id, mode, id DESC);
  CREATE INDEX IF NOT EXISTS idx_game_seen_profile_kind_id ON game_seen(profile_id, kind, id DESC);
`)
export default db
