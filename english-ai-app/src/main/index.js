import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import {appendFileSync} from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { GoogleGenAI } from '@google/genai'
import { config } from 'dotenv'
import db from './db.js'

config({
  path: app.isPackaged ? join(process.resourcesPath, '.env') : join(app.getAppPath(), '.env')
})


function logError(label, error) {
  try {
    appendFileSync(
      join(app.getPath('userData'), 'error.log'),
      `[${new Date().toISOString()}] ${label}: ${error?.status || ''} ${error?.message || error}\n`
    )
  } catch {
   
  }
}

logError('startup', `GEMINI_API_KEY loaded = ${!!process.env.GEMINI_API_KEY}`)

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

async function generateWithRetry(params, maxRetries = 2) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await ai.models.generateContent(params)
    } catch (error) {
      if (error.status === 503 && i < maxRetries) {
        console.log(`Retry ${i + 1}/${maxRetries} sau lỗi 503...`)
        await new Promise(resolve => setTimeout(resolve, 2000)) // chờ 2 giây
        continue
      }
      logError('gemini', error)
      throw error
    }
  }
}

const REVIEW_LADDER = [0, 3, 7, 14]

const LEVEL_PROFILES = {
  A1: {
    language: 'Song ngữ: mỗi câu tiếng Anh kèm bản dịch tiếng mẹ đẻ trong ngoặc.',
    style: 'Chỉ dùng từ vựng 500-800 từ thông dụng nhất, câu tối đa 8 từ, thì hiện tại đơn.',
    topics: 'Chào hỏi, gia đình, đồ vật, thức ăn, thói quen hằng ngày.',
    correction: 'Chỉ sửa 1-2 lỗi quan trọng nhất mỗi lượt, bỏ qua lỗi nhỏ.'
  },
  A2: {
    language: 'Song ngữ, nhưng bản dịch chỉ cho từ hoặc cụm khó.',
    style: 'Câu đơn giản và ghép ngắn, thì hiện tại, quá khứ đơn, tương lai gần.',
    topics: 'Mua sắm, du lịch cơ bản, kể chuyện hôm qua, kế hoạch gần.',
    correction: 'Sửa tối đa 2-3 lỗi, ưu tiên lỗi ngữ pháp nền tảng.'
  },
  B1: {
    language: 'Chủ yếu tiếng Anh, chỉ dịch khi học viên hỏi.',
    style: 'Câu có mệnh đề phụ, các thì hoàn thành, từ nối thông dụng.',
    topics: 'Công việc, sở thích, kinh nghiệm, ý kiến đơn giản.',
    correction: 'Sửa lỗi ngữ pháp và chọn từ, gợi ý cách diễn đạt tự nhiên hơn.'
  },
  B2: {
    language: 'Hoàn toàn tiếng Anh.',
    style: 'Câu phức, câu điều kiện, thể bị động, thành ngữ phổ biến.',
    topics: 'Xã hội, công nghệ, tranh luận có lập luận.',
    correction: 'Sửa cả lỗi nhỏ, collocation và độ trang trọng.'
  },
  C1: {
    language: 'Hoàn toàn tiếng Anh, tốc độ và độ phức tạp như người bản xứ.',
    style: 'Từ vựng học thuật, cấu trúc đảo ngữ, sắc thái ý nghĩa tinh tế.',
    topics: 'Chủ đề trừu tượng, phân tích, tranh luận phản biện.',
    correction: 'Chú trọng văn phong, sắc thái, tính tự nhiên và register.'
  },
  C2: {
    language: 'Hoàn toàn tiếng Anh, không giảm tốc, không giải thích từ cơ bản.',
    style: 'Diễn đạt tinh tế, thành ngữ, ẩn dụ, hài hước, văn phong linh hoạt.',
    topics: 'Triết học, văn học, chuyên ngành, mọi chủ đề mở.',
    correction: 'Chỉ sửa khi thật sự sai hoặc thiếu tự nhiên; phản hồi như đồng nghiệp bản xứ.'
  }
}

const getProfile = (level) => LEVEL_PROFILES[level] || LEVEL_PROFILES.A1
const LEVELS = Object.keys(LEVEL_PROFILES)


function normalizeAnswer(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    icon: icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))
    ipcMain.handle('assess-placement', async (event, { targetLanguage, answer }) => {
    try {
      const response = await generateWithRetry({
        model: 'gemini-3.6-flash',
        contents: `Học viên đang học ${targetLanguage}. Đây là bài viết mẫu của họ: "${answer}".
Hãy đánh giá trình độ CEFR (A1-C2) dựa trên ngữ pháp, từ vựng, độ phức tạp câu.
Trả lời CHỈ bằng JSON theo format: {"level": "A1/A2/B1/B2/C1/C2", "feedback": "nhận xét ngắn gọn bằng tiếng Việt"}`
      })

      const text = response.text.replace(/```json|```/g, '').trim()
      return JSON.parse(text)
    } catch (error) {
      console.error('Gemini error:', error)
      return { level: 'unknown', feedback: 'Có lỗi xảy ra, thử lại sau.' }
    }
  })

    ipcMain.handle('save-profile', async (event, profileData) => {
    try {
      const existing = db.prepare(`
        SELECT id FROM profile WHERE username = ? COLLATE NOCASE LIMIT 1
      `).get(profileData.username)

      if (existing) {
        return { success: false, error: 'username_taken' }
      }

      const source = profileData.levelSource || 'placement'
      const stmt = db.prepare(`
        INSERT INTO profile (username, native_language, target_language, goal, cefr_level, feedback, level_source)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      const result = stmt.run(
        profileData.username,
        profileData.nativeLanguage,
        profileData.targetLanguage,
        profileData.goal,
        profileData.cefrLevel,
        profileData.feedback || '',
        source
      )
      db.prepare(`
        INSERT INTO level_history (profile_id, old_level, new_level, source) VALUES (?, NULL, ?, ?)
      `).run(result.lastInsertRowid, profileData.cefrLevel, source)
      return { success: true, id: result.lastInsertRowid }
    } catch (error) {
      console.error('DB error:', error)
      return { success: false, error: 'db_error' }
    }
  })


      ipcMain.handle('update-profile', async (event, { profileId, nativeLanguage, targetLanguage, goal }) => {
    try {
      db.prepare(`
        UPDATE profile
        SET native_language = ?, target_language = ?, goal = ?
        WHERE id = ?
      `).run(nativeLanguage, targetLanguage, goal, profileId)
      return { success: true }
    } catch (error) {
      console.error('DB error:', error)
      return { success: false }
    }
  })
        ipcMain.handle('set-level', async (event, { profileId, cefrLevel, source }) => {
    try {
      if (!LEVELS.includes(cefrLevel)) return { success: false }
      const row = db.prepare(`SELECT cefr_level FROM profile WHERE id = ?`).get(profileId)
      if (!row) return { success: false }
      if (row.cefr_level !== cefrLevel) {
        const src = source || 'manual'
        db.prepare(`UPDATE profile SET cefr_level = ?, level_source = ? WHERE id = ?`).run(cefrLevel, src, profileId)
        db.prepare(`
          INSERT INTO level_history (profile_id, old_level, new_level, source) VALUES (?, ?, ?, ?)
        `).run(profileId, row.cefr_level, cefrLevel, src)
      }
      return { success: true, cefrLevel }
    } catch (error) {
      console.error('DB error:', error)
      return { success: false }
    }
  })
          ipcMain.handle('send-chat-message', async (event, {profileId, conversationId, topic, cefrLevel, targetLanguage, nativeLanguage, goal, history, message }) => {
    try {
      const p = getProfile(cefrLevel)

      const topicLine = topic && topic !== 'free'
        ? `\nCHỦ ĐỀ BÀI HỌC: Hãy xoay toàn bộ cuộc hội thoại quanh chủ đề "${topic}". Dẫn dắt học viên luyện tập từ vựng và tình huống liên quan đến chủ đề này, câu hỏi/gợi ý tiếp theo luôn bám sát chủ đề.`
        : ''

      const systemContext = `Bạn là một gia sư dạy ${targetLanguage} cho học viên có tiếng mẹ đẻ là ${nativeLanguage}, trình độ CEFR ${cefrLevel}, mục tiêu học: ${goal}.${topicLine}

CÁCH BẠN NÓI CHUYỆN VỚI TRÌNH ĐỘ ${cefrLevel} (bắt buộc tuân theo):
- Ngôn ngữ: ${p.language}
- Độ khó: ${p.style}
- Chủ đề phù hợp: ${p.topics}
- Cách sửa lỗi: ${p.correction}
Luôn giữ đúng độ khó này, không nói đơn giản hơn hoặc phức tạp hơn trình độ đã nêu.

QUY TẮC TRÌNH BÀY "reply" (bắt buộc, để dễ đọc):
- Chia thành các đoạn ngắn, mỗi đoạn tối đa 1-2 câu, ngăn cách bằng ký tự xuống dòng. Trong JSON hãy viết đúng chuỗi \\n, KHÔNG xuống dòng thật bên trong chuỗi.
- Nếu trả lời song ngữ: câu bằng ${targetLanguage} nằm trên một dòng riêng, bản dịch ${nativeLanguage} trong ngoặc nằm ngay dòng bên dưới.
- Ví dụ minh hoạ đặt trên dòng riêng, bắt đầu bằng "Example:".
- Câu hỏi hoặc yêu cầu luyện tập cuối cùng đặt trên dòng riêng ở cuối.
- Dùng **in đậm** cho từ hoặc cấu trúc quan trọng.

QUY TẮC PHẢN HỒI (bắt buộc):
Luôn trả lời CHỈ bằng JSON theo đúng format sau, không thêm chữ nào khác ngoài JSON:
{
  "reply": "câu trả lời trò chuyện với học viên (theo các quy tắc ở trên)",
  "mistakes": [
    {
      "category": "loại lỗi (ví dụ: thì động từ, trật tự từ, từ vựng, chính tả)",
      "original": "phần học viên viết sai",
      "corrected": "phần đã sửa đúng",
      "explanation": "giải thích ngắn gọn bằng tiếng Việt"
    }
  ],
  "newVocabulary": [
    { "word": "từ/cụm từ mới đáng học xuất hiện trong phần reply của bạn (không phải lỗi)", "meaning": "nghĩa ngắn gọn bằng tiếng Việt", "example": "một câu ví dụ ngắn dùng từ này" }
  ]
}
Nếu học viên KHÔNG mắc lỗi nào, để mảng "mistakes" rỗng: []. Tối đa 2 mục trong "newVocabulary" mỗi lượt, để rỗng nếu không có từ nào đặc biệt.`

      const contents = [
        { role: 'user', parts: [{ text: systemContext }] },
        { role: 'model', parts: [{ text: '{"reply": "Đã hiểu, tôi sẽ trả lời đúng định dạng JSON.", "mistakes": [], "newVocabulary": []}' }] },
        ...history.map(h => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.role === 'user' ? h.text : JSON.stringify({ reply: h.text, mistakes: [], newVocabulary: [] }) }]
        })),
        { role: 'user', parts: [{ text: message }] }
      ]

      const response = await generateWithRetry({
        model: 'gemini-3.6-flash',
        contents
      })

      const text = response.text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(text)

      let convId = conversationId
      if (!convId) {
        const title = message.length > 40 ? message.slice(0, 40) + '…' : message
        const created = db.prepare(`
          INSERT INTO conversations (profile_id, title, topic) VALUES (?, ?, ?)
        `).run(profileId, title, topic || null)
        convId = created.lastInsertRowid
      }

      if (parsed.mistakes && parsed.mistakes.length > 0) {
        const stmt = db.prepare(`
          INSERT INTO mistakes (profile_id, category, original_text, corrected_text, explanation)
          VALUES (?, ?, ?, ?, ?)
        `)
        for (const m of parsed.mistakes) {
         stmt.run(profileId, m.category, m.original, m.corrected, m.explanation)
        }
      }

      if (parsed.newVocabulary && parsed.newVocabulary.length > 0) {
        const checkStmt = db.prepare(`SELECT id FROM vocabulary WHERE profile_id = ? AND word = ? COLLATE NOCASE`)
        const insStmt = db.prepare(`INSERT INTO vocabulary (profile_id, word, meaning, example_sentence) VALUES (?, ?, ?, ?)`)
        for (const v of parsed.newVocabulary) {
          if (!v.word) continue
          const exists = checkStmt.get(profileId, v.word)
          if (!exists) insStmt.run(profileId, v.word, v.meaning || '', v.example || '')
        }
      }

      const saveMsgStmt = db.prepare(`
        INSERT INTO chat_messages (profile_id, conversation_id, role, text) VALUES (?, ?, ?, ?)
      `)
      saveMsgStmt.run(profileId, convId, 'user', message)
      saveMsgStmt.run(profileId, convId, 'model', parsed.reply)

      db.prepare(`UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(convId)

      return { success: true, reply: parsed.reply, mistakes: parsed.mistakes || [], conversationId: convId }
    } catch (error) {
      console.error('Chat error:', error)
      return { success: false, reply: 'Có lỗi xảy ra, thử lại sau.', mistakes: [] }
    }
  })

    ipcMain.handle('get-mistakes', async (event, { profileId }) => {
    try {
      const stmt = db.prepare(`
        SELECT * FROM mistakes WHERE profile_id = ? ORDER BY created_at DESC
      `)
      const rows = stmt.all(profileId)
      return { success: true, mistakes: rows }
    } catch (error) {
      console.error('DB error:', error)
      return { success: false, mistakes: [] }
    }
  })
  
  ipcMain.handle('get-profiles', async () => {
    try {
      const stmt = db.prepare(`
        SELECT id, username, native_language, target_language, goal, cefr_level
        FROM profile
        WHERE id IN (SELECT MAX(id) FROM profile WHERE username IS NOT NULL GROUP BY username)
        ORDER BY id DESC
      `)
      return { success: true, profiles: stmt.all() }
    } catch (error) {
      console.error('DB error:', error)
      return { success: false, profiles: [] }
    }
  })

    ipcMain.handle('check-username', async (event, { username }) => {
    try {
      const existing = db.prepare(`
        SELECT id FROM profile WHERE username = ? COLLATE NOCASE LIMIT 1
      `).get(username)
      return { success: true, available: !existing }
    } catch (error) {
      console.error('DB error:', error)
      return { success: false, available: true }
    }
  })

  ipcMain.handle('get-chat-history', async (event, { profileId }) => {
    try {
      const stmt = db.prepare(`
        SELECT * FROM chat_messages WHERE profile_id = ? ORDER BY created_at ASC
      `)
      return { success: true, messages: stmt.all(profileId) }
    } catch (error) {
      console.error('DB error:', error)
      return { success: false, messages: [] }
    }
  })

  ipcMain.handle('save-chat-message', async (event, { profileId, role, text }) => {
    try {
      const stmt = db.prepare(`
        INSERT INTO chat_messages (profile_id, role, text)
        VALUES (?, ?, ?)
      `)
      stmt.run(profileId, role, text)
      return { success: true }
    } catch (error) {
      console.error('DB error:', error)
      return { success: false }
    }
  })

    // ===== Đoạn chat (conversations) =====

   ipcMain.handle('get-conversations', async (event, { profileId }) => {
    try {
      const rows = db.prepare(`
        SELECT * FROM conversations WHERE profile_id = ? ORDER BY updated_at DESC
      `).all(profileId)
      return { success: true, conversations: rows }
    } catch (error) {
      console.error('DB error:', error)
      return { success: false, conversations: [] }
    }
  })

  ipcMain.handle('get-conversation-messages', async (event, { conversationId }) => {
    try {
      const rows = db.prepare(`
        SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC
      `).all(conversationId)
      return { success: true, messages: rows }
    } catch (error) {
      console.error('DB error:', error)
      return { success: false, messages: [] }
    }
  })

  ipcMain.handle('delete-conversation', async (event, { conversationId }) => {
    try {
      db.prepare(`DELETE FROM chat_messages WHERE conversation_id = ?`).run(conversationId)
      db.prepare(`DELETE FROM conversations WHERE id = ?`).run(conversationId)
      return { success: true }
    } catch (error) {
      console.error('DB error:', error)
      return { success: false }
    }
  })

  ipcMain.handle('get-vocabulary', async (event, { profileId }) => {
    try {
      const rows = db.prepare(`
        SELECT * FROM vocabulary WHERE profile_id = ? ORDER BY created_at DESC
      `).all(profileId)
      return { success: true, vocabulary: rows }
    } catch (error) {
      console.error('DB error:', error)
      return { success: false, vocabulary: [] }
    }
  })

  ipcMain.handle('add-vocabulary-words', async (event, { profileId, words, targetLanguage, nativeLanguage, cefrLevel }) => {
    try {
      const list = [...new Set(
        String(words || '').split(/[,;\n]/).map((w) => w.trim()).filter(Boolean)
      )].slice(0, 10)
      if (list.length === 0) return { success: false, error: 'empty' }

      const checkStmt = db.prepare(`SELECT id FROM vocabulary WHERE profile_id = ? AND word = ? COLLATE NOCASE`)
      const fresh = list.filter((w) => !checkStmt.get(profileId, w))
      const skipped = list.filter((w) => !fresh.includes(w))
      if (fresh.length === 0) return { success: true, added: [], skipped }

      const p = getProfile(cefrLevel)
      const response = await generateWithRetry({
        model: 'gemini-3.6-flash',
        contents: `Học viên có tiếng mẹ đẻ là ${nativeLanguage}, đang học ${targetLanguage}, trình độ CEFR ${cefrLevel}. Họ muốn thêm các từ sau vào flashcard: ${JSON.stringify(fresh)}.
Với mỗi từ: nếu viết sai chính tả thì sửa lại; "meaning" là nghĩa phổ biến nhất bằng ${nativeLanguage}, ngắn gọn; "example" là một câu ví dụ bằng ${targetLanguage} có chứa từ đó, độ khó phù hợp: ${p.style}
Trả lời CHỈ bằng một mảng JSON, cùng thứ tự với danh sách: [{"word": "...", "meaning": "...", "example": "..."}]`
      })

      const text = response.text.replace(/```json|```/g, '').trim()
      const match = text.match(/\[[\s\S]*\]/)
      const items = JSON.parse(match ? match[0] : text)

      const insStmt = db.prepare(`INSERT INTO vocabulary (profile_id, word, meaning, example_sentence) VALUES (?, ?, ?, ?)`)
      const added = []
      for (const v of items) {
        if (!v.word || checkStmt.get(profileId, v.word)) continue
        insStmt.run(profileId, v.word, v.meaning || '', v.example || '')
        added.push(v.word)
      }
      return { success: true, added, skipped }
    } catch (error) {
      console.error('Add vocabulary error:', error)
      return { success: false, error: 'ai_failed' }
    }
  })


  ipcMain.handle('get-daily-stats', async (event, { profileId }) => {
    try {
      const dates = db.prepare(`
        SELECT DISTINCT date(created_at) as day
        FROM chat_messages
        WHERE profile_id = ? AND role = 'user'
      `).all(profileId).map(r => r.day)

      const todayRow = db.prepare(`
        SELECT COUNT(*) as c FROM chat_messages
        WHERE profile_id = ? AND role = 'user' AND date(created_at) = date('now','localtime')
      `).get(profileId)

      const dateSet = new Set(dates)
      const toKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      let cursor = new Date()
      if (!dateSet.has(toKey(cursor))) cursor.setDate(cursor.getDate() - 1)
      let streak = 0
      while (dateSet.has(toKey(cursor))) {
        streak++
        cursor.setDate(cursor.getDate() - 1)
      }

      return { success: true, messagesToday: todayRow?.c || 0, streak }
    } catch (error) {
      console.error('DB error:', error)
      return { success: false, messagesToday: 0, streak: 0 }
    }
  })

  // ===== Spaced repetition =====

  ipcMain.handle('get-due-mistakes', async (event, { profileId }) => {
    try {
      const rows = db.prepare(`
        SELECT * FROM mistakes
        WHERE profile_id = ?
          AND (next_review_at IS NULL OR next_review_at <= date('now','localtime'))
        ORDER BY COALESCE(next_review_at, '0000-00-00') ASC, created_at ASC
      `).all(profileId)
      return { success: true, mistakes: rows }
    } catch (error) {
      console.error('DB error:', error)
      return { success: false, mistakes: [] }
    }
  })

    ipcMain.handle('generate-review-question', async (event, { mistake, targetLanguage, nativeLanguage, cefrLevel }) => {
    try {
      const p = getProfile(cefrLevel)
      const response = await generateWithRetry({
        model: 'gemini-3.6-flash',
        contents: `Bạn là gia sư dạy ${targetLanguage} cho học viên có tiếng mẹ đẻ là ${nativeLanguage}, trình độ CEFR ${cefrLevel}.
Học viên từng mắc lỗi sau:
- Loại lỗi: ${mistake.category}
- Câu sai: "${mistake.original_text}"
- Sửa đúng: "${mistake.corrected_text}"
- Giải thích: ${mistake.explanation}

Hãy tạo MỘT bài tập ôn lại đúng quy tắc này: viết một câu MỚI bằng ${targetLanguage} (khác câu gốc, ngắn, đời thường) có chứa cùng kiểu lỗi đó. Học viên sẽ phải viết lại cả câu cho đúng. Câu phải chỉ có một cách sửa rõ ràng.
Độ khó của câu mới phải phù hợp trình độ ${cefrLevel}: ${p.style}
Trả lời CHỈ bằng JSON: {"instruction": "yêu cầu ngắn bằng tiếng Việt", "sentence": "câu có lỗi", "answer": "câu đã sửa đúng hoàn chỉnh"}`
      })

      const text = response.text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(text)
      if (!parsed.sentence || !parsed.answer) throw new Error('Thiếu trường trong JSON')

      return {
        success: true,
        question: {
          instruction: parsed.instruction || 'Sửa lỗi sai trong câu sau và viết lại cả câu:',
          sentence: parsed.sentence,
          answer: parsed.answer
        }
      }
    } catch (error) {
      console.error('Review question error:', error)
      return { success: false }
    }
  })

  ipcMain.handle('record-review-result', async (event, { mistakeId, sentence, expectedAnswer, userAnswer, targetLanguage }) => {
    try {
      // 1) Chấm: khớp đáp án thì đúng luôn, không tốn quota; khác thì nhờ AI xét
      let correct = normalizeAnswer(userAnswer) === normalizeAnswer(expectedAnswer)
      let feedback = ''

      if (!correct) {
        const response = await generateWithRetry({
          model: 'gemini-3.6-flash',
          contents: `Học viên đang học ${targetLanguage}. Bài tập: sửa câu sau cho đúng: "${sentence}"
Đáp án mẫu: "${expectedAnswer}"
Câu trả lời của học viên: "${userAnswer}"
Hãy xác định câu trả lời của học viên có đúng không. Chấp nhận nếu câu đã hết lỗi ngữ pháp và giữ nguyên ý nghĩa, dù khác đáp án mẫu. Không chấp nhận nếu vẫn còn lỗi ban đầu.
Trả lời CHỈ bằng JSON: {"correct": true hoặc false, "feedback": "nhận xét ngắn bằng tiếng Việt"}`
        })
        const text = response.text.replace(/```json|```/g, '').trim()
        const judged = JSON.parse(text)
        correct = judged.correct === true
        feedback = judged.feedback || ''
      }

      // 2) Cập nhật lịch ôn
      const row = db.prepare(`SELECT interval_days FROM mistakes WHERE id = ?`).get(mistakeId)
      const current = row?.interval_days ?? 0
      const nextInterval = correct
        ? (REVIEW_LADDER.find((d) => d > current) ?? REVIEW_LADDER[REVIEW_LADDER.length - 1])
        : 0

      db.prepare(`
        UPDATE mistakes
        SET interval_days = ?, next_review_at = date('now','localtime', ?)
        WHERE id = ?
      `).run(nextInterval, `+${nextInterval} days`, mistakeId)

      return { success: true, correct, feedback, expectedAnswer, nextInterval }
    } catch (error) {
      // Lỗi khi chấm (vd. hết quota): KHÔNG đụng vào lịch ôn để khỏi phạt oan
      console.error('Record review error:', error)
      return { success: false }
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
