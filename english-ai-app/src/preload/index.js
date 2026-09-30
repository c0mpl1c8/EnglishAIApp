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
  deleteConversation: (data) => ipcRenderer.invoke('delete-conversation', data)
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
