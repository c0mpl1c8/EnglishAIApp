import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { GoogleGenAI } from '@google/genai'
import 'dotenv/config'
import db from './db.js'
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
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
      const response = await ai.models.generateContent({
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
      const stmt = db.prepare(`
        INSERT INTO profile (native_language, target_language, goal, cefr_level, feedback)
        VALUES (?, ?, ?, ?, ?)
      `)
      const result = stmt.run(
        profileData.nativeLanguage,
        profileData.targetLanguage,
        profileData.goal,
        profileData.cefrLevel,
        profileData.feedback
      )
      return { success: true, id: result.lastInsertRowid }
    } catch (error) {
      console.error('DB error:', error)
      return { success: false }
    }
  })

  ipcMain.handle('send-chat-message', async (event, { cefrLevel, targetLanguage, nativeLanguage, goal, history, message }) => {
    try {
      const systemContext = `Bạn là một gia sư dạy ${targetLanguage} cho học viên có tiếng mẹ đẻ là ${nativeLanguage}, trình độ CEFR ${cefrLevel}, mục tiêu học: ${goal}.

QUY TẮC NGÔN NGỮ (rất quan trọng):
- Nếu trình độ là A1 hoặc A2: LUÔN trả lời song ngữ — câu bằng ${targetLanguage} trước, kèm bản dịch ngắn gọn bằng ${nativeLanguage} ngay sau (trong ngoặc), để học viên hiểu được.
- Nếu trình độ là B1 trở lên: trả lời chủ yếu bằng ${targetLanguage}, chỉ dùng ${nativeLanguage} khi giải thích lỗi ngữ pháp phức tạp.

Điều chỉnh độ khó từ vựng/ngữ pháp phù hợp trình độ ${cefrLevel}. Nếu học viên mắc lỗi, nhẹ nhàng sửa lỗi đó ngay trong câu trả lời.`
      const contents = [
        { role: 'user', parts: [{ text: systemContext }] },
        { role: 'model', parts: [{ text: 'Đã hiểu, tôi sẽ trò chuyện phù hợp với trình độ học viên.' }] },
        ...history.map(h => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        })),
        { role: 'user', parts: [{ text: message }] }
      ]

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents
      })

      return { success: true, reply: response.text }
    } catch (error) {
      console.error('Chat error:', error)
      return { success: false, reply: 'Có lỗi xảy ra, thử lại sau.' }
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
