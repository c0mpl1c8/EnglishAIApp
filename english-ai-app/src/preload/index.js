import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  assessPlacement: (data) => ipcRenderer.invoke('assess-placement', data),
  saveProfile: (data) => ipcRenderer.invoke('save-profile', data),
  sendChatMessage: (data) => ipcRenderer.invoke('send-chat-message', data),
  getMistakes: (data) => ipcRenderer.invoke('get-mistakes', data),
  getProfiles: () => ipcRenderer.invoke('get-profiles'),
  getChatHistory: (data) => ipcRenderer.invoke('get-chat-history', data),
  getDueMistakes: (data) => ipcRenderer.invoke('get-due-mistakes', data),
  generateReviewQuestion: (data) => ipcRenderer.invoke('generate-review-question', data),
  recordReviewResult: (data) => ipcRenderer.invoke('record-review-result', data),
  getConversations: (data) => ipcRenderer.invoke('get-conversations', data),
  getConversationMessages: (data) => ipcRenderer.invoke('get-conversation-messages', data),
  deleteConversation: (data) => ipcRenderer.invoke('delete-conversation', data),
  checkUsername: (data) => ipcRenderer.invoke('check-username', data),
  updateProfile: (data) => ipcRenderer.invoke('update-profile', data),
  getVocabulary: (data) => ipcRenderer.invoke('get-vocabulary', data),
  getDailyStats: (data) => ipcRenderer.invoke('get-daily-stats', data),
  addVocabularyWords: (data) => ipcRenderer.invoke('add-vocabulary-words', data),
  setLevel: (data) => ipcRenderer.invoke('set-level', data),
  getLearnerNotes: (data) => ipcRenderer.invoke('get-learner-notes', data),
  saveLearnerNotes: (data) => ipcRenderer.invoke('save-learner-notes', data),
  refreshLearnerNotes: (data) => ipcRenderer.invoke('refresh-learner-notes', data),
  generateQuiz: (data) => ipcRenderer.invoke('generate-quiz', data),
  getProgress: (data) => ipcRenderer.invoke('get-progress', data),
  getProgressInsight: (data) => ipcRenderer.invoke('get-progress-insight', data),
  recordSkillEvent: (data) => ipcRenderer.invoke('record-skill-event', data),
  generateAdaptiveQuiz: (data) => ipcRenderer.invoke('generate-adaptive-quiz', data),
  getVocabFolders: (data) => ipcRenderer.invoke('get-vocab-folders', data),
  createVocabFolder: (data) => ipcRenderer.invoke('create-vocab-folder', data),
  renameVocabFolder: (data) => ipcRenderer.invoke('rename-vocab-folder', data),
  deleteVocabFolder: (data) => ipcRenderer.invoke('delete-vocab-folder', data),
  moveVocabWords: (data) => ipcRenderer.invoke('move-vocab-words', data),
  deleteVocabWords: (data) => ipcRenderer.invoke('delete-vocab-words', data),
  aiOrganizeVocabulary: (data) => ipcRenderer.invoke('ai-organize-vocabulary', data),
  saveQuizAttempt: (data) => ipcRenderer.invoke('save-quiz-attempt', data),
  getQuizAttempts: (data) => ipcRenderer.invoke('get-quiz-attempts', data),
  getQuizAttempt: (data) => ipcRenderer.invoke('get-quiz-attempt', data),
  deleteQuizAttempt: (data) => ipcRenderer.invoke('delete-quiz-attempt', data),
  generateGameContent: (data) => ipcRenderer.invoke('generate-game-content', data),
  saveVocabEntries: (data) => ipcRenderer.invoke('save-vocab-entries', data),
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
