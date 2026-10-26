import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { createAudioSpeechCapture, decodeSpeechAudio, playSpeechAudio, speakText as speakSpeechText, speechErrorMessage, stopSpeechAudio } from './voice/speech.mjs'

const fs = (px) => `calc(${px}px * var(--fs))`

const fontScales = { small: '0.9', medium: '1', large: '1.15', xlarge: '1.3' }

const themes = {
  light: {
    '--bg': 'radial-gradient(circle at 30% 30%, #e9d5ff 0%, #ffffff 50%, #ffffff 100%)',
    '--surface': '#ffffff',
    '--surface-soft': '#fafafa',
    '--panel': 'rgba(255,255,255,0.65)',
    '--text': '#1a1a1a',
    '--text-strong': '#111111',
    '--text-soft': '#555555',
    '--text-muted': '#666666',
    '--border': '#d4d4d8',
    '--border-soft': '#eeeeee',
    '--btn-border': '#111111',
    '--btn-text': '#111111',
    '--bubble-user-bg': '#111111',
    '--bubble-user-text': '#ffffff',
    '--bubble-ai-bg': '#f0f0f0',
    '--accent': '#6366f1',
    '--accent-soft': '#eef2ff',
    '--accent-text': '#4f46e5',
    '--dot-off': '#e5e5e5',
    '--warn-bg': '#fff8e1',
    '--warn-border': '#ffe082',
    '--warn-text': '#5c4400',
    '--danger': '#c0392b',
    '--shadow': '0 8px 30px rgba(0, 0, 0, 0.08)'
  },
  dark: {
    '--bg': '#080809',
    '--surface': '#111113',
    '--surface-soft': '#1b1b1e',
    '--panel': '#0b0b0c',
    '--text': '#f0f0f2',
    '--text-strong': '#ffffff',
    '--text-soft': '#dedee3',
    '--text-muted': '#b5b5be',
    '--border': '#3e3e44',
    '--border-soft': '#2a2a2f',
    '--btn-border': '#66666f',
    '--btn-text': '#151517',
    '--bubble-user-bg': '#e4e4e7',
    '--bubble-user-text': '#151517',
    '--bubble-ai-bg': '#1b1b1e',
    '--accent': '#e4e4e7',
    '--accent-soft': '#29292e',
    '--accent-text': '#ffffff',
    '--dot-off': '#39393f',
    '--warn-bg': '#211c12',
    '--warn-border': '#514323',
    '--warn-text': '#eadba9',
    '--danger': '#ff7777',
    '--shadow': '0 16px 44px rgba(0, 0, 0, 0.3)'
  }
}

const defaultSettings = { theme: 'light', fontSize: 'medium', showInlineMistakes: true, speechVoice: 'af_heart' }
const speechVoiceReplacements = { af_nova: 'af_nicole', am_fenrir: 'am_puck' }
const speechVoices = new Set(['af_heart', 'af_bella', 'af_nicole', 'am_puck', 'am_michael', 'bf_emma', 'bm_george'])

function loadSettings() {
  try {
    const saved = localStorage.getItem('appSettings')
    if (!saved) return defaultSettings
    const settings = { ...defaultSettings, ...JSON.parse(saved) }
    const speechVoice = speechVoiceReplacements[settings.speechVoice] || settings.speechVoice
    return { ...settings, speechVoice: speechVoices.has(speechVoice) ? speechVoice : defaultSettings.speechVoice }
  } catch {
    return defaultSettings
  }
}

const iconPaths = {
  book: ['M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z', 'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  settings: ['M21 4h-7', 'M10 4H3', 'M21 12h-9', 'M8 12H3', 'M21 20h-5', 'M12 20H3', 'M14 2v4', 'M8 10v4', 'M16 18v4'],
  sun: [
    'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8z',
    'M12 2v2', 'M12 20v2', 'm4.93 4.93 1.41 1.41', 'm17.66 17.66 1.41 1.41',
    'M2 12h2', 'M20 12h2', 'm6.34 17.66-1.41 1.41', 'm19.07 4.93-1.41 1.41'
  ],
  moon: ['M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z'],
  monitor: ['M4 3h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'M8 21h8', 'M12 17v4'],
  close: ['M18 6 6 18', 'm6 6 12 12'],
  warning: ['m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3', 'M12 9v4', 'M12 17h.01'],
  back: ['m12 19-7-7 7-7', 'M19 12H5'],
  next: ['M5 12h14', 'm12 5 7 7-7 7'],
  repeat: ['m17 2 4 4-4 4', 'M3 11v-1a4 4 0 0 1 4-4h14', 'm7 22-4-4 4-4', 'M21 13v1a4 4 0 0 1-4 4H3'],
  check: ['M20 6 9 17l-5-5'],
  send: ['m5 12 7-7 7 7', 'M12 19V5'],
  plus: ['M12 5v14', 'M5 12h14'],
  minus: ['M5 12h14'],
  chevron: ['m6 9 6 6 6-6'],
  sparkle: ['M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z'],
  trend: ['m22 7-8.5 8.5-5-5L2 17', 'M16 7h6v6'],
  folder: ['M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z'],
  clock: ['M12 6v6l4 2', 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z'],
  layers: ['m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z', 'm22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65', 'm22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65'],
  search: ['M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16z', 'm21 21-4.3-4.3'],
  trash: ['M3 6h18', 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2', 'M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6'],
  user: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  edit: ['M12 20h9', 'M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z'],
  mic: ['M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z', 'M19 10v1a7 7 0 0 1-14 0v-1', 'M12 18v4', 'M8 22h8'],
  speaker: ['M11 5 6 9H2v6h4l5 4V5z', 'M19.07 4.93a10 10 0 0 1 0 14.14', 'M15.54 8.46a5 5 0 0 1 0 7.07'],
  cards: ['M3 9h14v10H3z', 'M7 9V5a2 2 0 0 1 2-2h12v14h-2'],
  flame: ['M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z']
}

function Icon({ name, size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
      aria-hidden="true"
    >
      {iconPaths[name].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  )
}


const fadeStyle = `
  .fade-in {
    transform: translate3d(40px, 0, 0);
    animation: slideIn 1000ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    will-change: transform;
  }

  @keyframes slideIn {
    from {
      transform: translate3d(40px, 0, 0);
    }
    to {
      transform: translate3d(0, 0, 0);
    }
  }
`;

const typingStyle = `
  @keyframes typingBounce {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
    30% { transform: translateY(-5px); opacity: 1; }
  }
  .typing-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--text-muted);
    display: inline-block;
    animation: typingBounce 1.2s infinite ease-in-out;
  }
  .typing-dot:nth-child(2) { animation-delay: 0.15s; }
  .typing-dot:nth-child(3) { animation-delay: 0.3s; }
`

const layoutCss = `
  @media (max-width: 1100px) { .right-panel { display: none !important; } }
  @media (max-width: 800px) { .sidebar { display: none !important; } }
`

const sidebarCss = `
  .conv-item {
    transition: background 120ms ease;
  }
  .conv-item:hover {
    background: var(--surface-soft) !important;
  }
  .conv-item .conv-delete {
    opacity: 0;
    transition: opacity 120ms ease;
  }
  .conv-item:hover .conv-delete {
    opacity: 0.6;
  }
  .conv-item .conv-delete:hover {
    opacity: 1 !important;
    color: #ef4444 !important;
  }
  .nav-item { transition: background 120ms ease; }
  .nav-item:hover { background: var(--surface-soft) !important; }
  .profile-bar { transition: background 120ms ease; }
  .profile-bar:hover { background: var(--surface-soft) !important; }
`
const scrollbarStyle = `
  * {
    scrollbar-width: thin; /* Firefox / dự phòng */
    scrollbar-color: var(--border) transparent;
  }
  *::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  *::-webkit-scrollbar-track {
    background: transparent;
  }
  *::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 999px;
    border: 2px solid transparent;
    background-clip: content-box;
  }
  *::-webkit-scrollbar-thumb:hover {
    background: var(--text-muted);
    background-clip: content-box;
  }
  *::-webkit-scrollbar-button {
    display: none; /* bỏ mũi tên trên/dưới */
  }
`
const buttonCss = `
  button:disabled:not(.quiz-opt) { opacity: 1; cursor: not-allowed; }
`
const loginCss = `
  .account-row { transition: background 120ms ease; }
  .account-row:hover { background: var(--surface-soft); }
`

const goalLabels = {
  travel: 'Du lịch',
  work: 'Công việc',
  exam: 'Thi cử',
  general: 'Giao tiếp chung'
}

const chatSuggestions = ['Hello, my name is...', 'Can you help me practice ordering food?', 'Let\'s talk about my day']

function toSpeechLang(name) {
  const n = (name || '').toLowerCase()
  if (n.includes('anh') || n.includes('english')) return 'en-US'
  if (n.includes('việt') || n.includes('viet')) return 'vi-VN'
  if (n.includes('pháp') || n.includes('french')) return 'fr-FR'
  if (n.includes('nhật') || n.includes('japan')) return 'ja-JP'
  if (n.includes('hàn') || n.includes('korea')) return 'ko-KR'
  if (n.includes('trung') || n.includes('chinese')) return 'zh-CN'
  if (n.includes('đức') || n.includes('german')) return 'de-DE'
  if (n.includes('tây ban nha') || n.includes('spanish')) return 'es-ES'
  return 'en-US'
}

function speakText(text, lang, onEnd, voice = 'af_heart') {
  return speakNaturalText(text, lang, onEnd, voice)
}

let naturalSpeechRequest = 0
function cancelNaturalSpeech() {
  naturalSpeechRequest += 1
  stopSpeechAudio(window)
}

async function speakNaturalText(text, lang, onEnd, voice = 'af_heart', onFallback) {
  const requestId = ++naturalSpeechRequest
  stopSpeechAudio(window)
  if (/^en(?:-|$)/i.test(lang)) {
    if (window.api?.synthesizeSpeechLocal) {
      try {
        const result = await window.api.synthesizeSpeechLocal({ text, voice })
        if (requestId !== naturalSpeechRequest) return false
        if (result?.success && result.audio?.length) {
          return playSpeechAudio({ environment: window, audio: result.audio, sampleRate: result.sampleRate, onEnd })
        }
        const error = result?.error || 'LOCAL_TTS_FAILED'
        console.warn('Local AI speech synthesis failed; using the device voice.', error)
        onFallback?.()
      } catch (error) {
        console.warn('Local AI speech synthesis failed; using the device voice.', error)
        onFallback?.()
      }
    } else {
      console.warn('Local AI speech synthesis is unavailable; using the device voice.')
      onFallback?.()
    }
  }
  if (requestId !== naturalSpeechRequest) return false
  return speakSpeechText({ environment: window, text, lang, onEnd })
}

async function previewKokoroVoice(text, voice, onEnd) {
  const requestId = ++naturalSpeechRequest
  stopSpeechAudio(window)
  if (!window.api?.synthesizeSpeechLocal) {
    return { success: false, error: 'LOCAL_TTS_UNAVAILABLE' }
  }

  try {
    const result = await window.api.synthesizeSpeechLocal({ text, voice })
    if (requestId !== naturalSpeechRequest) return { success: false, cancelled: true }
    if (!result?.success || !result.audio?.length) {
      return { success: false, error: result?.error || 'LOCAL_TTS_FAILED' }
    }
    const started = playSpeechAudio({
      environment: window,
      audio: result.audio,
      sampleRate: result.sampleRate,
      onEnd
    })
    return started ? { success: true } : { success: false, error: 'AUDIO_PLAYBACK_FAILED' }
  } catch (error) {
    console.error('Kokoro voice preview failed.', error)
    return { success: false, error: 'LOCAL_TTS_FAILED' }
  }
}

function getVoiceSpeechText(text, nativeLanguage) {
  const lines = String(text ?? '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const isVietnameseNative = /việt|viet/i.test(nativeLanguage || '')
  if (!isVietnameseNative) return lines.join(' ')

  const vietnameseText = /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/iu
  const commonVietnamese = /\b(bạn|mình|chào|tiếng|được|không|rất|vui|tên|là|gì|có|phải|xin|nhé|nha|một|và|của|này|đó)\b/iu
  return lines.filter((line) => !vietnameseText.test(line) && !commonVietnamese.test(line)).join(' ')
}

const topicOptions = [
  { id: 'free', label: 'Tự do (không chủ đề)' },
  { id: 'gọi món ăn ở nhà hàng', label: '🍽️ Gọi món ăn' },
  { id: 'hỏi đường và đi du lịch', label: '🧭 Hỏi đường & du lịch' },
  { id: 'phỏng vấn xin việc', label: '💼 Phỏng vấn xin việc' },
  { id: 'trò chuyện xã giao hàng ngày', label: '💬 Giao tiếp hàng ngày' },
  { id: 'mua sắm ở cửa hàng', label: '🛍️ Mua sắm' }
]

const voiceRoleplayScenarios = [
  {
    id: 'directions',
    title: 'Hỏi đường',
    icon: '🧭',
    description: 'Hỏi người địa phương cách đến một địa điểm.',
    prompt: 'You are a visitor who has just arrived at a train station. The learner is a local resident helping you. Ask the learner for directions to the city center. The learner should explain the route and you should ask brief natural follow-up questions as a traveler. Do not act as the local giving directions.',
    openingLine: 'Hi, I just got off the train. Could you tell me how to get to the city center?'
  },
  {
    id: 'cafe',
    title: 'Ở quán cà phê',
    icon: '☕',
    description: 'Gọi đồ uống và trao đổi với nhân viên.',
    prompt: 'You are a friendly barista at a cafe. The learner is a customer. Keep the ordering conversation natural and ask only one question at a time.',
    openingLine: 'Hi there! What can I get for you today?'
  },
  {
    id: 'restaurant',
    title: 'Nhà hàng',
    icon: '🍽️',
    description: 'Đặt bàn, gọi món và hỏi về món ăn.',
    prompt: 'You are a friendly restaurant server. The learner is a guest. Continue naturally through seating and ordering, one short question at a time.',
    openingLine: 'Good evening! Do you have a reservation?'
  },
  {
    id: 'shopping',
    title: 'Mua sắm',
    icon: '🛍️',
    description: 'Hỏi giá, kích cỡ và thanh toán.',
    prompt: 'You are a helpful shop assistant. The learner is a customer looking for an item. Help them compare options, sizes, and prices through a natural short conversation.',
    openingLine: 'Hello! Are you looking for anything in particular?'
  },
  {
    id: 'hotel',
    title: 'Nhận phòng khách sạn',
    icon: '🛎️',
    description: 'Làm thủ tục nhận phòng và hỏi thông tin.',
    prompt: 'You are a hotel receptionist. The learner is a guest checking in. Continue with a realistic check-in conversation, one short question at a time.',
    openingLine: 'Welcome to the hotel! Do you have a reservation?'
  },
  {
    id: 'new-friend',
    title: 'Làm quen',
    icon: '👋',
    description: 'Bắt chuyện và tìm hiểu về một người mới.',
    prompt: 'You have just met the learner at a casual social event. Have a natural getting-to-know-you conversation without turning it into a lesson.',
    openingLine: "Hi, I'm Alex. Is this your first time here?"
  }
]

const DAILY_GOAL = 5

const SESSION_SIZE = 10

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const levelOptions = [
  { id: 'A1', desc: 'Mới bắt đầu, hiểu câu rất đơn giản' },
  { id: 'A2', desc: 'Sơ cấp, giao tiếp tình huống quen thuộc' },
  { id: 'B1', desc: 'Trung cấp, kể chuyện và nêu ý kiến đơn giản' },
  { id: 'B2', desc: 'Trung cấp cao, trao đổi trôi chảy nhiều chủ đề' },
  { id: 'C1', desc: 'Nâng cao, diễn đạt linh hoạt và tự nhiên' },
  { id: 'C2', desc: 'Thành thạo, gần như người bản xứ' }
]

const levelDropdownOptions = levelOptions.map((l) => ({ value: l.id, label: `${l.id} · ${l.desc.split(',')[0]}` }))

const toOptions = (arr) => arr.map((n) => ({ value: n, label: n }))

const nativeLanguageOptions = toOptions([
  'Tiếng Việt', 'Tiếng Anh', 'Tiếng Trung', 'Tiếng Nhật', 'Tiếng Hàn',
  'Tiếng Pháp', 'Tiếng Đức', 'Tiếng Tây Ban Nha'
])

const targetLanguageOptions = toOptions([
  'Tiếng Anh', 'Tiếng Pháp', 'Tiếng Nhật', 'Tiếng Hàn',
  'Tiếng Trung', 'Tiếng Đức', 'Tiếng Tây Ban Nha'
])

const goalOptions = [
  { value: 'travel', label: 'Du lịch' },
  { value: 'work', label: 'Công việc' },
  { value: 'exam', label: 'Thi cử (IELTS/TOEFL...)' },
  { value: 'general', label: 'Giao tiếp chung' }
]

const dropdownCss = `
  .dd-option:hover { background: var(--surface-soft) !important; }
  .level-card:hover { border-color: var(--accent) !important; }
`

const dropdownStyles = {
  trigger: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1.5px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    fontSize: fs(15),
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    textAlign: 'left',
    boxSizing: 'border-box'
  },
  overlay: { position: 'fixed', inset: 0, zIndex: 1050 },
  menu: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    width: '100%',
    maxHeight: '220px',
    overflowY: 'auto',
    padding: '6px',
    borderRadius: '12px',
    background: 'var(--surface)',
    border: '1.5px solid var(--border-soft)',
    boxShadow: 'var(--shadow)',
    zIndex: 1060,
    boxSizing: 'border-box'
  },
  option: {
    width: '100%',
    padding: '9px 10px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text)',
    fontSize: fs(14),
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
    textAlign: 'left'
  },
  optionActive: { background: 'var(--accent-soft)', color: 'var(--accent-text)', fontWeight: '600' }
}

const onboardStyles = {
  card: {
    width: '420px',
    maxWidth: '92vw',
    padding: '24px',
    borderRadius: '20px',
    background: 'var(--surface)',
    border: '1.5px solid var(--border-soft)',
    boxShadow: 'var(--shadow)',
    boxSizing: 'border-box',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  actions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginTop: '4px' },
  fieldLabel: {
    fontSize: fs(12),
    fontWeight: '700',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px'
  },
  levelGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  levelCard: {
    padding: '10px 12px',
    borderRadius: '12px',
    border: '1.5px solid var(--border-soft)',
    background: 'var(--surface-soft)',
    color: 'var(--text)',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  },
  levelCardActive: { border: '1.5px solid var(--accent)', background: 'var(--accent-soft)' },
  levelCode: { fontSize: fs(15), fontWeight: '700' },
  levelDesc: { fontSize: fs(11), color: 'var(--text-muted)', lineHeight: 1.35 },
  levelBar: { display: 'inline-flex', alignItems: 'center', gap: '8px' },
    fieldInput: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1.5px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    fontSize: fs(15),
    outline: 'none',
    boxSizing: 'border-box',
    textAlign: 'left'
  },
  chips: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' },
  chip: {
    padding: '5px 10px',
    borderRadius: '999px',
    border: '1.5px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-soft)',
    fontSize: fs(12),
    cursor: 'pointer'
  },
  levelStep: {
    padding: '6px 12px',
    borderRadius: '999px',
    border: '1.5px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    fontSize: fs(12),
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px'
  },
  levelPill: {
    padding: '5px 12px',
    borderRadius: '999px',
    background: 'var(--accent-soft)',
    color: 'var(--accent-text)',
    fontWeight: '700',
    fontSize: fs(13)
  }
}

const notesStyles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '20px 24px 16px',
    borderBottom: '1px solid var(--border-soft)'
  },
  headIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    background: 'var(--accent-soft)',
    color: 'var(--accent-text)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  title: { fontSize: fs(17), fontWeight: '700', color: 'var(--text-strong)' },
  subtitle: { fontSize: fs(12), color: 'var(--text-muted)', marginTop: '2px' },
  body: { padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  toggleCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 14px',
    borderRadius: '14px',
    background: 'var(--surface-soft)',
    border: '1px solid var(--border-soft)'
  },
  labelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '8px' },
  label: {
    fontSize: fs(12),
    fontWeight: '700',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  actions: { display: 'flex', gap: '6px' },
  smallAction: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '5px 10px',
    borderRadius: '999px',
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-soft)',
    fontSize: fs(12),
    fontWeight: '500',
    cursor: 'pointer'
  },
  textarea: {
    width: '100%',
    height: '140px',
    padding: '12px 14px',
    borderRadius: '14px',
    border: '1.5px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    fontSize: fs(14),
    lineHeight: 1.5,
    fontFamily: "'Segoe UI', sans-serif",
    outline: 'none',
    resize: 'none',
    boxSizing: 'border-box'
  },
  hint: { fontSize: fs(12), color: 'var(--text-muted)', lineHeight: 1.5 },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 24px',
    borderTop: '1px solid var(--border-soft)',
    background: 'var(--surface-soft)'
  },
  ghostBtn: {
    padding: '9px 18px',
    borderRadius: '999px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: fs(14),
    fontWeight: '600',
    cursor: 'pointer'
  },
  primaryBtn: {
    padding: '9px 26px',
    borderRadius: '999px',
    border: 'none',
    background: 'var(--accent)',
    color: 'var(--btn-text)',
    fontSize: fs(14),
    fontWeight: '600',
    cursor: 'pointer'
  }
}

const hubStyles = {
  card: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px',
    borderRadius: '14px',
    border: '1.5px solid var(--border-soft)',
    background: 'var(--surface-soft)',
    color: 'var(--text)',
    cursor: 'pointer',
    textAlign: 'left',
    boxSizing: 'border-box'
  },
  icon: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    background: 'var(--accent-soft)',
    color: 'var(--accent-text)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  text: { display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 },
  title: { fontSize: fs(15), fontWeight: '700' },
  desc: { fontSize: fs(12), color: 'var(--text-muted)', lineHeight: 1.4 }
}

const quizStyles = {
  option: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1.5px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    fontSize: fs(15),
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
    boxSizing: 'border-box'
  },
    modeRow: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '12px',
    border: '1.5px solid var(--border-soft)',
    background: 'var(--surface-soft)',
    color: 'var(--text)',
    cursor: 'pointer',
    textAlign: 'left',
    boxSizing: 'border-box'
  },
  modeRowActive: { border: '1.5px solid var(--accent)', background: 'var(--accent-soft)' },
  modeIcon: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    background: 'var(--surface)',
    color: 'var(--accent-text)',
    border: '1px solid var(--border-soft)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  radio: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    border: '1.5px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: 'var(--btn-text)'
  },
  radioOn: { background: 'var(--accent)', border: '1.5px solid var(--accent)' },
  chip: {
    padding: '7px 12px',
    borderRadius: '999px',
    border: '1.5px solid var(--border-soft)',
    background: 'var(--surface-soft)',
    color: 'var(--text-soft)',
    fontSize: fs(13),
    cursor: 'pointer'
  },
 chipOn: { background: 'var(--accent)', border: '1.5px solid var(--accent)', color: 'var(--btn-text)' },
  primary: {
    padding: '11px 26px',
    borderRadius: '999px',
    border: 'none',
    background: 'var(--accent)',
    color: 'var(--btn-text)',
    fontSize: fs(15),
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  },
  ghost: {
    padding: '11px 16px',
    borderRadius: '999px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: fs(14),
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px'
  },
  tag: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '999px',
    background: 'var(--accent-soft)',
    color: 'var(--accent-text)',
    fontSize: fs(11),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  answerInput: {
    width: '100%',
    maxWidth: '520px',
    padding: '14px 18px',
    borderRadius: '14px',
    border: '1.5px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    fontSize: fs(16),
    outline: 'none',
    textAlign: 'left',
    boxSizing: 'border-box'
  },

  letter: { fontWeight: '700', color: 'var(--text-muted)', minWidth: '18px' },
  correct: { border: '1.5px solid #27ae60', background: 'rgba(39,174,96,0.12)' },
  wrong: { border: '1.5px solid #c0392b', background: 'rgba(192,57,43,0.12)' },
  dim: { opacity: 0.55 },
  chipActive: { border: '1.5px solid var(--accent)', background: 'var(--accent-soft)', color: 'var(--accent-text)' },
  disabled: { opacity: 0.45, cursor: 'not-allowed' }
}


function Dropdown({ value, options, onChange, placeholder = 'Chọn...', up = false }) {
  const [open, setOpen] = useState(false)
  const hasValue = options.some((o) => o.value === value)
  const list = value && !hasValue ? [{ value, label: value }, ...options] : options
  const current = list.find((o) => o.value === value)

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <style>{dropdownCss}</style>
      <button
        type="button"
        style={dropdownStyles.trigger}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span style={{ color: current ? 'var(--text)' : 'var(--text-muted)' }}>
          {current ? current.label : placeholder}
        </span>
        <Icon name="chevron" size={16} />
      </button>

      {open && (
        <>
          <div style={dropdownStyles.overlay} onClick={() => setOpen(false)} />
          <div
            role="listbox"
            style={{ ...dropdownStyles.menu, ...(up ? { top: 'auto', bottom: 'calc(100% + 6px)' } : {}) }}
          >
            {list.map((o) => (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={o.value === value}
                className="dd-option"
                style={{ ...dropdownStyles.option, ...(o.value === value ? dropdownStyles.optionActive : {}) }}
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
              >
                <span>{o.label}</span>
                {o.value === value && <Icon name="check" size={15} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function StepCard({ current, title, subtitle, children }) {
  return (
    <div style={{ ...styles.container, justifyContent: 'safe center', overflowY: 'auto' }} className="fade-in">
      <style>{fadeStyle}</style>
      {current && <ProgressDots current={current} total={4} />}
      <div>
        <h2 style={styles.question}>{title}</h2>
        {subtitle && (
          <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: fs(14), maxWidth: '420px' }}>
            {subtitle}
          </p>
        )}
      </div>
      <div style={onboardStyles.card}>{children}</div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <div style={onboardStyles.fieldLabel}>{label}</div>
      {children}
    </div>
  )
}
const occupationSuggestions = ['Sinh viên', 'Lập trình viên', 'Y tế', 'Kinh doanh', 'Giáo viên', 'Thiết kế']

function ProfileExtras({ occupation, interests, onChange }) {
  return (
    <>
      <Field label="Nghề nghiệp / lĩnh vực (không bắt buộc)">
        <input
          style={onboardStyles.fieldInput}
          maxLength={60}
          value={occupation || ''}
          onChange={(e) => onChange('occupation', e.target.value)}
          placeholder="Ví dụ: kỹ sư xây dựng"
        />
        <div style={onboardStyles.chips}>
          {occupationSuggestions.map((s) => (
            <button key={s} type="button" style={onboardStyles.chip} onClick={() => onChange('occupation', s)}>
              {s}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Mối quan tâm (không bắt buộc)">
        <input
          style={onboardStyles.fieldInput}
          maxLength={200}
          value={interests || ''}
          onChange={(e) => onChange('interests', e.target.value)}
          placeholder="Ví dụ: bóng đá, du lịch, nấu ăn"
        />
      </Field>
    </>
  )
}

function FamiliarityBar({ total, fam }) {
  if (!fam) return null
  const pct = fam.nextAt ? Math.min(100, ((total - fam.min) / (fam.nextAt - fam.min)) * 100) : 100
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: fs(12), color: 'var(--text-muted)', marginBottom: '4px' }}>
        <span>Mức thân quen: <strong style={{ color: 'var(--text)' }}>{fam.name}</strong></span>
        <span>{fam.nextAt ? `${total}/${fam.nextAt} tin` : 'Cao nhất'}</span>
      </div>
      <div style={{ width: '100%', height: '6px', borderRadius: '999px', background: 'var(--border-soft)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', borderRadius: '999px' }} />
      </div>
    </div>
  )
}

const todayLocal = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}


function ProgressDots({ current, total }) {
  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === current - 1 ? '24px' : '8px',
            height: '8px',
            borderRadius: '999px',
            background: i <= current - 1 ? 'var(--accent)' : 'var(--dot-off)',
            transition: 'all 0.3s ease'
          }}
        />
      ))}
    </div>
  )
}

function TypingIndicator() {
  return (
    <div style={{ alignSelf: 'flex-start' }}>
      <style>{typingStyle}</style>
      <div
        style={{
          display: 'inline-flex',
          gap: '5px',
          alignItems: 'center',
          padding: '14px 16px',
          borderRadius: '16px',
          background: 'var(--bubble-ai-bg)'
        }}
        aria-label="Đang trả lời"
      >
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  )
}

function useSpeechInput(onResult, onSpeechDetected) {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const [transcribing, setTranscribing] = useState(false)
  const [modelProgress, setModelProgress] = useState(null)
  const captureRef = useRef(null)
  const onResultRef = useRef(onResult)
  const onSpeechDetectedRef = useRef(onSpeechDetected)
  const supported = typeof window !== 'undefined' && Boolean(
    window.navigator?.mediaDevices?.getUserMedia && window.MediaRecorder &&
    (window.AudioContext || window.webkitAudioContext)
  )

  useEffect(() => {
    onResultRef.current = onResult
  }, [onResult])

  useEffect(() => {
    onSpeechDetectedRef.current = onSpeechDetected
  }, [onSpeechDetected])

  useEffect(() => window.api?.onLocalSpeechProgress?.(setModelProgress), [])

  const start = useCallback(() => {
    if (!supported) return false
    setError('')
    setTranscribing(false)
    setModelProgress(null)
    onSpeechDetectedRef.current?.(false)
    const capture = createAudioSpeechCapture({
      environment: window,
      shouldTranscribeInterim: () => false,
      onTranscript: (transcript) => onResultRef.current?.(transcript),
      onSpeechDetected: (detected) => onSpeechDetectedRef.current?.(detected),
      onTranscribing: setTranscribing,
      onStateChange: setListening,
      onError: setError,
      transcribe: async ({ blob }) => {
        const { audio, sampleRate } = await decodeSpeechAudio(blob, { environment: window })
        const result = await window.api.transcribeSpeechLocal({ audio, sampleRate })
        if (!result.success) throw new Error(result.error)
        return result.transcript
      }
    })
    captureRef.current = capture
    return capture.start()
  }, [supported])

  const stop = useCallback(() => {
    captureRef.current?.stop()
  }, [])

  return { supported, listening, error, transcribing, modelProgress, start, stop }
}

function PracticeScreen({ profileId, profile,cefrLevel, onExit }) {
  const [queue, setQueue] = useState([])
  const [index, setIndex] = useState(0)
  // loadingList | loadingQuestion | answering | checking | feedback | error | empty | done
  const [phase, setPhase] = useState('loadingList')
  const [question, setQuestion] = useState(null)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [notice, setNotice] = useState('')

  const loadQuestion = async (mistake) => {
    setPhase('loadingQuestion')
    setAnswer('')
    setResult(null)
    setNotice('')
    const res = await window.api.generateReviewQuestion({
      mistake,
      targetLanguage: profile.targetLanguage,
      nativeLanguage: profile.nativeLanguage,
      cefrLevel
    })
    if (res.success) {
      setQuestion(res.question)
      setPhase('answering')
    } else {
      setPhase('error')
    }
  }

  useEffect(() => {
    let cancelled = false
    window.api.getDueMistakes({ profileId }).then((res) => {
      if (cancelled) return
      const list = (res.mistakes || []).slice(0, SESSION_SIZE)
      if (list.length === 0) {
        setPhase('empty')
        return
      }
      setQueue(list)
      loadQuestion(list[0])
    })
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async () => {
    if (!answer.trim() || phase !== 'answering') return
    setPhase('checking')
    setNotice('')
    const res = await window.api.recordReviewResult({
      mistakeId: queue[index].id,
      sentence: question.sentence,
      expectedAnswer: question.answer,
      userAnswer: answer,
      targetLanguage: profile.targetLanguage
    })
    if (!res.success) {
      setNotice('Không chấm được lúc này (có thể AI đang quá tải). Bạn thử nộp lại nhé.')
      setPhase('answering')
      return
    }
    if (res.correct) setCorrectCount((c) => c + 1)
    setResult(res)
    setPhase('feedback')
  }

  const handleNext = () => {
    if (index + 1 >= queue.length) {
      setPhase('done')
      return
    }
    setIndex(index + 1)
    loadQuestion(queue[index + 1])
  }

  const wrap = (children) => (
    <div style={styles.container} className="fade-in">
      <style>{fadeStyle}</style>
      <style>{quizCss}</style>
      {children}
    </div>
  )

  if (phase === 'loadingList') return wrap(<p>Đang tải danh sách ôn tập...</p>)

   if (phase === 'empty') {
    return wrap(
      <>
        <h2 style={styles.question}>Không có lỗi nào cần ôn</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '380px', margin: 0 }}>
          Hôm nay bạn đã ôn hết rồi. Hãy quay lại vào ngày mai, hoặc trò chuyện thêm để AI ghi nhận thêm lỗi nhé.
        </p>
        <button className="qprimary" style={quizStyles.primary} onClick={onExit}>Quay lại</button>
      </>
    )
  }

  if (phase === 'done') {
    return wrap(
      <>
        <h2 style={styles.question}>Hoàn thành phiên ôn tập</h2>
        <div style={{ fontSize: fs(40), fontWeight: '700', color: 'var(--accent)' }}>
          {correctCount}/{queue.length}
        </div>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>câu trả lời đúng</p>
        <button className="qprimary" style={quizStyles.primary} onClick={onExit}>Quay lại</button>
      </>
    )
  }

  const current = queue[index]
  const nextText = result
    ? result.nextInterval === 0
      ? 'Lỗi này sẽ quay lại trong lần ôn tập tới.'
      : `Bạn sẽ gặp lại lỗi này sau ${result.nextInterval} ngày.`
    : ''

   return wrap(
    <>
      <ProgressDots current={index + 1} total={queue.length} />
      <div>
        <h2 style={styles.question}>Ôn lỗi cũ</h2>
        <p style={{ margin: '6px 0 0', fontSize: fs(13), color: 'var(--text-muted)' }}>
          Câu {index + 1}/{queue.length}
        </p>
      </div>

      <div style={practiceStyles.card}>
        <span style={quizStyles.tag}>{current.category}</span>
        {phase === 'loadingQuestion' && <p style={{ margin: '12px 0 0' }}>Đang tạo câu hỏi...</p>}
        {phase === 'error' && (
          <p style={{ margin: '12px 0 0' }}>Không tạo được câu hỏi (có thể AI đang quá tải).</p>
        )}
        {question && phase !== 'loadingQuestion' && phase !== 'error' && (
          <>
            <p style={{ margin: '12px 0 8px', fontSize: fs(14), color: 'var(--text-soft)', lineHeight: 1.5 }}>
              {question.instruction}
            </p>
            <div style={practiceStyles.sentence}>{question.sentence}</div>
          </>
        )}
      </div>

      {(phase === 'answering' || phase === 'checking' || phase === 'feedback') && (
        <input
          className="qinput"
          style={{ ...quizStyles.answerInput, ...(phase !== 'answering' ? { opacity: 0.7 } : {}) }}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Viết lại câu đã sửa..."
          disabled={phase !== 'answering'}
          autoFocus
        />
      )}

      {notice && <p style={{ margin: 0, color: 'var(--danger)', fontSize: fs(14) }}>{notice}</p>}

      {phase === 'feedback' && result && (
        <div style={{ ...practiceStyles.feedback, ...(result.correct ? practiceStyles.ok : practiceStyles.bad) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
            <Icon name={result.correct ? 'check' : 'close'} size={16} />
            {result.correct ? 'Chính xác!' : 'Chưa đúng'}
          </div>
          {!result.correct && (
            <div style={{ marginTop: '6px' }}>Đáp án: <strong>{result.expectedAnswer}</strong></div>
          )}
          {result.feedback && <div style={{ marginTop: '6px', fontSize: fs(13) }}>{result.feedback}</div>}
          <div style={{ marginTop: '6px', fontSize: fs(13), color: 'var(--text-muted)' }}>{nextText}</div>
        </div>
      )}

      <div style={{ width: '100%', maxWidth: '520px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="qghost" style={quizStyles.ghost} onClick={onExit}>
          <Icon name="back" size={16} /> Thoát
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {phase === 'error' && (
            <>
              <button className="qghost" style={quizStyles.ghost} onClick={handleNext}>Bỏ qua</button>
              <button className="qprimary" style={quizStyles.primary} onClick={() => loadQuestion(current)}>Thử lại</button>
            </>
          )}
          {(phase === 'answering' || phase === 'checking') && (
            <button
              className="qprimary"
              style={{
                ...quizStyles.primary,
                ...(!answer.trim() || phase === 'checking' ? { opacity: 0.5, cursor: 'not-allowed' } : {})
              }}
              onClick={handleSubmit}
              disabled={!answer.trim() || phase === 'checking'}
            >
              {phase === 'checking' ? 'Đang chấm...' : 'Kiểm tra'} <Icon name="check" size={16} />
            </button>
          )}
          {phase === 'feedback' && (
            <button className="qprimary" style={quizStyles.primary} onClick={handleNext}>
              {index + 1 >= queue.length ? 'Xem kết quả' : 'Câu tiếp theo'} <Icon name="next" size={16} />
            </button>
          )}
        </div>
      </div>
    </>
  )
}

const quizPresetTopics = ['Thì động từ', 'Giới từ', 'Mạo từ (a/an/the)', 'Câu điều kiện', 'Từ vựng hằng ngày', 'Cụm động từ']
const quizCss = `
  .qrow { transition: border-color 120ms ease, background 120ms ease; }
  .qrow:not(:disabled):hover { border-color: var(--accent) !important; }
  .qchip { transition: background 120ms ease, border-color 120ms ease; }
  .qchip:hover { border-color: var(--accent) !important; }
  .qprimary { transition: filter 120ms ease; }
  .qprimary:hover:not(:disabled) { filter: brightness(1.08); }
  .qghost:hover { color: var(--text) !important; }
  .qinput:focus { border-color: var(--accent) !important; }
`
function QuizSetup({ profile, mistakeCount, onBack, onStart }) {
  const [selected, setSelected] = useState('weak')
  const [custom, setCustom] = useState('')
  const [count, setCount] = useState(5)
  const hasInfo = !!((profile.occupation || '').trim() || (profile.interests || '').trim())
  const usingCustom = !!custom.trim()

  const start = () => {
    if (!usingCustom && selected === 'weak') return onStart({ adaptive: true, label: 'Luyện điểm yếu', count })
    if (usingCustom) return onStart({ topic: { type: 'custom', value: custom.trim() }, label: custom.trim(), count })
    if (selected === 'random') return onStart({ topic: { type: 'random' }, label: 'Ngẫu nhiên', count })
    if (selected === 'mistakes') return onStart({ topic: { type: 'mistakes' }, label: 'Từ lỗi của bạn', count })
    if (selected === 'job') return onStart({ topic: { type: 'job' }, label: 'Theo nghề/sở thích của bạn', count })
    return onStart({ topic: { type: 'preset', value: selected }, label: selected, count })
  }

  const modes = [
    { id: 'weak', icon: 'trend', title: 'Luyện điểm yếu của tôi', desc: 'AI chọn 2-3 kỹ năng yếu nhất, độ khó thay đổi theo từng câu', ok: true },
    { id: 'random', icon: 'cards', title: 'Ngẫu nhiên', desc: 'Đa dạng ngữ pháp và từ vựng', ok: true },
    {
      id: 'mistakes',
      icon: 'warning',
      title: 'Từ lỗi của tôi',
      desc: mistakeCount ? 'Dựa trên loại lỗi bạn hay mắc' : 'Chưa có lỗi nào được ghi nhận',
      ok: mistakeCount > 0
    },
    {
      id: 'job',
      icon: 'user',
      title: 'Theo nghề / sở thích',
      desc: hasInfo ? 'Từ vựng và tình huống thuộc lĩnh vực của bạn' : 'Điền nghề/sở thích ở "Chỉnh sửa thông tin"',
      ok: hasInfo
    }
  ]

  return (
    <StepCard title="Bài tập trắc nghiệm" subtitle="Chọn kiểu bài bạn muốn AI soạn.">
      <style>{quizCss}</style>

      <Field label="Kiểu bài tập">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {modes.map((m) => {
            const active = !usingCustom && selected === m.id
            return (
              <button
                key={m.id}
                className="qrow"
                disabled={!m.ok}
                style={{
                  ...quizStyles.modeRow,
                  ...(active ? quizStyles.modeRowActive : {}),
                  ...(!m.ok ? { opacity: 0.55, cursor: 'not-allowed' } : {})
                }}
                onClick={() => {
                  setSelected(m.id)
                  setCustom('')
                }}
              >
                <span style={quizStyles.modeIcon}><Icon name={m.icon} size={16} /></span>
                <span style={hubStyles.text}>
                  <span style={{ ...hubStyles.title, fontSize: fs(14) }}>{m.title}</span>
                  <span style={hubStyles.desc}>{m.desc}</span>
                </span>
                <span style={{ ...quizStyles.radio, ...(active ? quizStyles.radioOn : {}) }}>
                  {active && <Icon name="check" size={12} />}
                </span>
              </button>
            )
          })}
        </div>
      </Field>

      <Field label="Hoặc chọn chủ đề cụ thể">
        <div style={onboardStyles.chips}>
          {quizPresetTopics.map((t) => (
            <button
              key={t}
              type="button"
              className="qchip"
              style={{ ...quizStyles.chip, ...(!usingCustom && selected === t ? quizStyles.chipOn : {}) }}
              onClick={() => {
                setSelected(t)
                setCustom('')
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          style={{ ...onboardStyles.fieldInput, marginTop: '10px', ...(usingCustom ? { border: '1.5px solid var(--accent)' } : {}) }}
          maxLength={80}
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Hoặc tự nhập chủ đề, ví dụ: đặt phòng khách sạn"
        />
      </Field>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <span style={{ ...onboardStyles.fieldLabel, marginBottom: 0 }}>Số câu</span>
        <SegmentedControl
          value={count}
          onChange={setCount}
          options={[
            { value: 5, label: '5 câu' },
            { value: 10, label: '10 câu' }
          ]}
        />
      </div>

      <div style={{ ...onboardStyles.actions, marginTop: '8px' }}>
        <button className="qghost" style={quizStyles.ghost} onClick={onBack}>
          <Icon name="back" size={16} /> Quay lại
        </button>
        <button className="qprimary" style={quizStyles.primary} onClick={start}>
          Bắt đầu <Icon name="next" size={16} />
        </button>
      </div>
    </StepCard>
  )
}

 function QuizScreen({ profileId, profile, cefrLevel, topic, label, count, preset, loader, attemptMode = 'quiz', previousAssessment, onPracticeWeakness, onExit }) {
  // loading | question | answered | done | error
  const [phase, setPhase] = useState('loading')
  const [questions, setQuestions] = useState([])
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const [errMsg, setErrMsg] = useState('')
  const [log, setLog] = useState([])
  const savedRef = useRef(false)

  const load = async () => {
    setPhase('loading')
    setErrMsg('')
    setLog([])
    savedRef.current = false
    if (preset) {
      setQuestions(shuffleArr(preset).map(reshuffleQuestion))
      setIndex(0)
      setPicked(null)
      setScore(0)
      setPhase('question')
      return
    }
       const res = loader
      ? await loader()
      : await window.api.generateQuiz({
          profileId,
          targetLanguage: profile.targetLanguage,
          nativeLanguage: profile.nativeLanguage,
          cefrLevel,
          topic,
          count
        })
    if (res.success && res.questions.length > 0) {
      setQuestions(res.questions)
      setIndex(0)
      setPicked(null)
      setScore(0)
      setPhase('question')
    } else {
      setErrMsg(res.message || 'Không tạo được bộ câu hỏi.')
      setPhase('error')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const choose = (i) => {
    if (phase !== 'question') return
    const q = questions[index]
    const ok = i === q.answer
    const focus = q.focus || q.structure || (
      ['preset', 'custom'].includes(topic?.type) ? topic.value : q.skillLabel || q.skill
    )
    window.api.recordSkillEvent({
      profileId,
      skill: q.skill,
      correct: ok,
      source: preset ? 'retry' : attemptMode === 'assessment' ? 'assessment' : 'quiz',
      question: preset ? undefined : q.question,
      focus
    })
    setLog((l) => [
      ...l,
      { question: q.question, options: q.options, answer: q.answer, picked: i, explanation: q.explanation, skill: q.skill, focus, difficulty: q.difficulty }
    ])
    setPicked(i)
    if (ok) setScore((s) => s + 1)
    setPhase('answered')
  }

  const finish = async () => {
    if (!preset && !savedRef.current && log.length > 0) {
      savedRef.current = true
      let saved
      try { saved = await window.api.saveQuizAttempt({ profileId, mode: attemptMode, label, details: log }) } catch { saved = null }
      if (!saved?.success) {
        savedRef.current = false
        setErrMsg('Chưa lưu được kết quả. Câu trả lời vẫn còn trên màn hình; hãy thử lưu lại trước khi rời bài.')
        setPhase('save-error')
        return
      }
    }
    setPhase('done')
  }

  const next = async () => {
    if (index + 1 >= questions.length) {
      await finish()
      return
    }
    const nextIndex = index + 1
    const previousAnswer = log[nextIndex]
    setIndex(nextIndex)
    setPicked(previousAnswer?.picked ?? null)
    setPhase(previousAnswer ? 'answered' : 'question')
  }

  const goToPreviousQuestion = () => {
    if (index <= 0) return
    const previousIndex = index - 1
    const previousAnswer = log[previousIndex]
    setIndex(previousIndex)
    setPicked(previousAnswer?.picked ?? null)
    setPhase(previousAnswer ? 'answered' : 'question')
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' && phase === 'answered') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const wrap = (children, scrollable = false) => (
    <div
      style={{
        ...styles.container,
        ...(scrollable ? { justifyContent: 'flex-start', overflowY: 'auto', paddingTop: '32px', paddingBottom: '32px' } : {})
      }}
      className="fade-in"
    >
      <style>{fadeStyle}</style>
      <style>{quizCss}</style>
      {children}
    </div>
  )

  if (phase === 'loading') {
    return wrap(
      <>
        <h2 style={styles.question}>Đang soạn câu hỏi...</h2>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Chủ đề: {label}. Có thể mất vài giây.</p>
      </>
    )
  }

  if (phase === 'error') {
    return wrap(
      <>
        <h2 style={styles.question}>Chưa tạo được bộ câu hỏi</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '380px', margin: 0 }}>{errMsg}</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="qghost" style={quizStyles.ghost} onClick={onExit}>Quay lại</button>
          <button className="qprimary" style={quizStyles.primary} onClick={load}>Thử lại</button>
        </div>
      </>
    )
  }

  if (phase === 'save-error') {
    return wrap(
      <>
        <h2 style={styles.question}>Chưa lưu được kết quả</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '460px', margin: 0 }}>{errMsg}</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="qghost" style={quizStyles.ghost} onClick={onExit}>Rời bài</button>
          <button className="qprimary" style={quizStyles.primary} onClick={finish}>Thử lưu lại</button>
        </div>
      </>
    )
  }

  if (phase === 'done') {
    const pct = Math.round((score / questions.length) * 100)
    const msg = pct >= 80 ? 'Rất tốt!' : pct >= 50 ? 'Khá ổn, luyện thêm một chút nhé.' : 'Chưa vững, hãy xem lại phần giải thích và thử lại.'
    const assessmentSkillResults = attemptMode === 'assessment'
      ? [...new Set(log.map((item) => item.skill))].map((skill) => {
          const items = log.filter((item) => item.skill === skill)
          const correct = items.filter((item) => item.picked === item.answer).length
          return {
            skill,
            label: questions.find((q) => q.skill === skill)?.skillLabel || skill,
            focus: [...new Set(items.filter((item) => item.picked !== item.answer).map((item) => item.focus).filter(Boolean))].join(', ') || [...new Set(items.map((item) => item.focus).filter(Boolean))].join(', '),
            correct,
            total: items.length,
            status: items.length < 2 ? 'Chưa đủ câu để kết luận' : correct / items.length <= 0.5 ? 'Nên củng cố' : 'Tạm ổn, tiếp tục theo dõi',
            needsPractice: items.length >= 2 && correct / items.length <= 0.5
          }
        })
      : []
    return wrap(
      <>
        <h2 style={styles.question}>Kết quả</h2>
        <div style={{ fontSize: fs(40), fontWeight: '700', color: 'var(--accent)' }}>{score}/{questions.length}</div>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>{msg}</p>
        {attemptMode === 'assessment' && (
          <div style={{ ...progressStyles.card, width: '100%', maxWidth: '640px', textAlign: 'left' }}>
            <div style={progressStyles.cardTitle}>Kết quả theo chủ điểm</div>
            {assessmentSkillResults.map((item) => (
              <div key={item.skill} style={progressStyles.catRow}>
                <span style={{ flex: 1 }}>
                  <strong>{item.label}</strong>
                  <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: fs(12) }}>{item.status}{item.focus ? ` · ${item.focus}` : ''}</span>
                </span>
                <strong style={{ color: item.total < 2 ? 'var(--text-muted)' : scoreColor(item.correct, item.total) }}>{item.correct}/{item.total}</strong>
              </div>
            ))}
            {assessmentSkillResults.some((item) => item.needsPractice) && <button className="qprimary" style={{ ...quizStyles.primary, marginTop: '10px' }} onClick={() => {
              const weakest = assessmentSkillResults.filter((item) => item.needsPractice).sort((a, b) => a.correct / a.total - b.correct / b.total)[0]
              onPracticeWeakness?.(weakest.skill, weakest.focus.split(', ')[0] || weakest.label)
            }}>Luyện chủ điểm cần củng cố</button>}
            {previousAssessment && <p style={{ margin: '10px 0 0', color: 'var(--text-muted)', fontSize: fs(13) }}>So với lần trước: {previousAssessment.correct}/{previousAssessment.total} ({Math.round(previousAssessment.correct / previousAssessment.total * 100)}%) · {pct - Math.round(previousAssessment.correct / previousAssessment.total * 100) > 0 ? '+' : ''}{pct - Math.round(previousAssessment.correct / previousAssessment.total * 100)} điểm phần trăm</p>}
          </div>
        )}
        <div style={{ width: '100%', maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {log.map((d, i) => <ReviewCard key={i} d={d} n={i + 1} />)}
        </div>
        {!preset && (
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: fs(12) }}>
            Kết quả đã được lưu trong mục “Xem lại bài đã làm” ở Ôn tập.
          </p>
        )}
        {attemptMode === 'assessment' && <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: fs(12), maxWidth: '640px' }}>Đây là thang tham khảo nội bộ của ứng dụng, chưa được chuẩn hóa hoặc chứng nhận như bài thi CEFR. Bài này đánh giá ngữ pháp, từ vựng và cấu trúc; chưa đo kỹ năng nghe/nói.</p>}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="qghost" style={quizStyles.ghost} onClick={onExit}>Quay lại</button>
          <button className="qprimary" style={quizStyles.primary} onClick={load}>
            {preset ? 'Làm lại' : 'Bộ câu hỏi mới'}
          </button>
        </div>
      </>,
      true
    )
  }

  const q = questions[index]
  const answered = phase === 'answered'

  return wrap(
    <>
      <ProgressDots current={index + 1} total={questions.length} />
      <p style={{ margin: 0, fontSize: fs(13), color: 'var(--text-muted)' }}>
        Câu {index + 1}/{questions.length} · {label}
      </p>
      {attemptMode === 'assessment' && <span style={quizStyles.tag}>{DIFF_LABEL[q.difficulty] || 'Vừa'}</span>}
      {q.structure && <span style={quizStyles.tag}>{q.structure}</span>}
      <QuestionBlock q={q} picked={picked} answered={answered} onChoose={choose} />

      <div style={{ width: '100%', maxWidth: '520px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="qghost" style={quizStyles.ghost} onClick={onExit}>
            <Icon name="back" size={16} /> Thoát
          </button>
          {index > 0 && (
            <button className="qghost" style={quizStyles.ghost} onClick={goToPreviousQuestion}>
              <Icon name="back" size={16} /> Câu trước
            </button>
          )}
        </div>
        {answered && (
          <button className="qprimary" style={quizStyles.primary} onClick={next}>
            {index + 1 >= questions.length ? 'Xem kết quả' : 'Câu tiếp theo'} <Icon name="next" size={16} />
          </button>
        )}
      </div>
    </>
  )
}

const DIFF_ORDER = ['easy', 'medium', 'hard']

// Xáo lại thứ tự đáp án để người học không nhớ vị trí khi làm lại
function reshuffleQuestion(q) {
  const order = shuffleArr(q.options.map((_, i) => i))
  return { ...q, options: order.map((i) => q.options[i]), answer: order.indexOf(q.answer) }
}

const fmtAt = (at) => (at ? `${at.slice(8, 10)}/${at.slice(5, 7)} ${at.slice(11, 16)}` : '')
const scoreColor = (c, t) => {
  const p = t ? c / t : 0
  return p >= 0.8 ? '#27ae60' : p >= 0.5 ? '#e0a100' : 'var(--danger)'
}

const DIFF_LABEL = { easy: 'Dễ', medium: 'Vừa', hard: 'Khó' }

// Chọn câu kế tiếp: gần độ khó mục tiêu nhất, rồi ưu tiên kỹ năng đã hỏi ít, tránh lặp kỹ năng vừa hỏi
function pickNextQuestion(pool, used, target, askedBySkill, lastSkill) {
  const cands = pool.map((q, i) => ({ q, i })).filter(({ i }) => !used.has(i))
  if (cands.length === 0) return null
  const dist = (q) => Math.abs(DIFF_ORDER.indexOf(q.difficulty) - target)
  cands.sort(
    (a, b) =>
      dist(a.q) - dist(b.q) ||
      (askedBySkill[a.q.skill] || 0) - (askedBySkill[b.q.skill] || 0) ||
      Number(a.q.skill === lastSkill) - Number(b.q.skill === lastSkill)
  )
  return cands[0]
}

function QuestionBlock({ q, picked, answered, onChoose }) {
  const letters = ['A', 'B', 'C', 'D', 'E']
  return (
    <>
      <div style={practiceStyles.card}>
        <div style={practiceStyles.sentence}>{q.question}</div>
      </div>

      <div style={{ width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {q.options.map((o, i) => {
          const isCorrect = i === q.answer
          const isPicked = i === picked
          const extra = !answered ? {} : isCorrect ? quizStyles.correct : isPicked ? quizStyles.wrong : quizStyles.dim
          return (
            <button
              key={i}
              className="quiz-opt"
              style={{ ...quizStyles.option, ...extra, ...(answered ? { cursor: 'default' } : {}) }}
              onClick={() => onChoose(i)}
              disabled={answered}
            >
              <span style={quizStyles.letter}>{letters[i]}</span>
              <span style={{ flex: 1 }}>{o}</span>
              {answered && isCorrect && <Icon name="check" size={16} />}
              {answered && isPicked && !isCorrect && <Icon name="close" size={16} />}
            </button>
          )
        })}
      </div>

      {answered && (
        <div style={{ ...practiceStyles.feedback, ...(picked === q.answer ? practiceStyles.ok : practiceStyles.bad) }}>
          <div style={{ fontWeight: '700' }}>
            {picked === q.answer ? q.okText || 'Chính xác!' : q.badText || `Đáp án đúng: ${q.options[q.answer]}`}
          </div>
          {q.explanation && <div style={{ marginTop: '6px', fontSize: fs(13) }}>{q.explanation}</div>}
        </div>
      )}
    </>
  )
}

function AdaptiveQuizScreen({ profileId, profile, cefrLevel, count, targetSkill, targetFocus, onExit }) {
  // loading | intro | question | answered | done | error
  const [phase, setPhase] = useState('loading')
  const [pool, setPool] = useState([])
  const [plan, setPlan] = useState([])
  const [used, setUsed] = useState(new Set())
  const [asked, setAsked] = useState([])
  const [current, setCurrent] = useState(null)
  const [target, setTarget] = useState(1) // 0 dễ, 1 vừa, 2 khó
  const [picked, setPicked] = useState(null)
  const [note, setNote] = useState('')
  const [total, setTotal] = useState(count)
  const [errMsg, setErrMsg] = useState('')
  const [saveError, setSaveError] = useState('')
  const savedRef = useRef(false)

  const saveAttempt = async (list) => {
    if (savedRef.current) return true
    if (list.length === 0) return false
    savedRef.current = true
    let result
    try {
      result = await window.api.saveQuizAttempt({
      profileId,
      mode: 'adaptive',
      label: 'Luyện điểm yếu',
      details: list.map((a) => ({
        question: a.question,
        options: a.options,
        answer: a.answer,
        picked: a.picked,
        explanation: a.explanation,
        skill: a.skill,
        focus: a.focus,
        difficulty: a.difficulty
      }))
      })
    } catch {
      result = null
    }
    if (!result?.success) {
      savedRef.current = false
      setSaveError('Chưa lưu được kết quả luyện tập. Câu trả lời của bài này vẫn còn; hãy thử lưu lại.')
      return false
    }
    return true
  }
  const load = async () => {
    setPhase('loading')
    setErrMsg('')
    savedRef.current = false
    const res = await window.api.generateAdaptiveQuiz({
      profileId,
      targetLanguage: profile.targetLanguage,
      nativeLanguage: profile.nativeLanguage,
      cefrLevel,
      targetSkill,
      targetFocus
    })
    if (res.success && res.questions.length >= 3) {
      setPool(res.questions)
      setPlan(res.plan || [])
      setTotal(Math.min(count, res.questions.length))
      setUsed(new Set())
      setAsked([])
      setCurrent(null)
      setTarget(1)
      setPicked(null)
      setNote('')
      setPhase('intro')
    } else {
      setErrMsg(res.message || 'Không tạo được bộ câu hỏi.')
      setPhase('error')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const askedBySkill = () =>
    asked.reduce((acc, a) => {
      acc[a.skill] = (acc[a.skill] || 0) + 1
      return acc
    }, {})

  const start = () => {
    const first = pickNextQuestion(pool, new Set(), 1, {}, null)
    if (!first) {
      setErrMsg('Bộ câu hỏi trống.')
      setPhase('error')
      return
    }
    setCurrent(first)
    setUsed(new Set([first.i]))
    setPhase('question')
  }

  const choose = (i) => {
    if (phase !== 'question' || !current) return
    const q = current.q
    const ok = i === q.answer
    const focus = q.focus || q.structure || q.skillLabel || q.skill
    window.api.recordSkillEvent({ profileId, skill: q.skill, correct: ok, source: 'adaptive', question: q.question, focus })
    setAsked((a) => [
      ...a,
      {
        skill: q.skill,
        skillLabel: q.skillLabel,
        focus,
        difficulty: q.difficulty,
        correct: ok,
        question: q.question,
        options: q.options,
        answer: q.answer,
        picked: i,
        explanation: q.explanation
      }
    ])
    setNote(
      ok
        ? target < 2
          ? 'Bạn trả lời đúng, câu này khó hơn một chút.'
          : 'Bạn trả lời đúng ở mức khó nhất, tiếp tục giữ mức này.'
        : target > 0
          ? 'Câu trước chưa đúng, câu này dễ hơn một chút để củng cố.'
          : 'Câu trước chưa đúng, giữ mức dễ để củng cố nền tảng.'
    )
    setTarget(ok ? Math.min(2, target + 1) : Math.max(0, target - 1))
    setPicked(i)
    setPhase('answered')
  }

  const next = async () => {
    if (asked.length >= total) {
      if (!(await saveAttempt(asked))) {
        setPhase('save-error')
        return
      }
      setPhase('done')
      return
    }
    const nx = pickNextQuestion(pool, used, target, askedBySkill(), current?.q.skill)
    if (!nx) {
      if (!(await saveAttempt(asked))) {
        setPhase('save-error')
        return
      }
      setPhase('done')
      return
    }
    setCurrent(nx)
    setUsed((u) => new Set(u).add(nx.i))
    setPicked(null)
    setPhase('question')
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' && phase === 'answered') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const wrap = (children, scrollable = false) => (
    <div
      style={{
        ...styles.container,
        ...(scrollable ? { justifyContent: 'flex-start', overflowY: 'auto', paddingTop: '32px', paddingBottom: '32px' } : {})
      }}
      className="fade-in"
    >
      <style>{fadeStyle}</style>
      <style>{quizCss}</style>
      {children}
    </div>
  )

  if (phase === 'loading') {
    return wrap(
      <>
        <h2 style={styles.question}>Đang chọn bài cho bạn...</h2>
        <p style={{ color: 'var(--text-muted)', margin: 0, maxWidth: '380px' }}>
          AI đang soạn bộ câu hỏi theo điểm yếu của bạn. Có thể mất 10 đến 30 giây.
        </p>
      </>
    )
  }

  if (phase === 'error') {
    return wrap(
      <>
        <h2 style={styles.question}>Chưa tạo được bộ câu hỏi</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '380px', margin: 0 }}>{errMsg}</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="qghost" style={quizStyles.ghost} onClick={onExit}>Quay lại</button>
          <button className="qprimary" style={quizStyles.primary} onClick={load}>Thử lại</button>
        </div>
      </>
    )
  }

  if (phase === 'save-error') {
    return wrap(
      <>
        <h2 style={styles.question}>Chưa lưu được kết quả luyện tập</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '460px', margin: 0 }}>{saveError}</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="qghost" style={quizStyles.ghost} onClick={onExit}>Rời bài</button>
          <button className="qprimary" style={quizStyles.primary} onClick={async () => {
            if (await saveAttempt(asked)) setPhase('done')
          }}>Thử lưu lại</button>
        </div>
      </>
    )
  }

  if (phase === 'intro') {
    return wrap(
      <>
        <h2 style={styles.question}>Luyện điểm yếu của tôi</h2>
        <div style={practiceStyles.card}>
          <div style={{ fontSize: fs(14), fontWeight: '700', marginBottom: '8px' }}>{targetFocus ? `Luyện theo kết quả đánh giá: ${targetFocus}` : 'Vì sao AI chọn bài này?'}</div>
          {plan.map((s) => (
            <div key={s.id} style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: fs(14), fontWeight: '600' }}>{s.label}</div>
              <div style={{ fontSize: fs(12), color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.reason}</div>
            </div>
          ))}
          <div style={{ fontSize: fs(12), color: 'var(--text-muted)', lineHeight: 1.5, borderTop: '1px solid var(--border-soft)', paddingTop: '10px' }}>
            Bộ gồm {total} câu. Độ khó thay đổi theo từng câu: bạn trả lời đúng thì câu sau khó hơn, sai thì dễ hơn.
          </div>
        </div>
        <div style={{ width: '100%', maxWidth: '520px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="qghost" style={quizStyles.ghost} onClick={onExit}>
            <Icon name="back" size={16} /> Quay lại
          </button>
          <button className="qprimary" style={quizStyles.primary} onClick={start}>
            Bắt đầu <Icon name="next" size={16} />
          </button>
        </div>
      </>
    )
  }

  if (phase === 'done') {
    const okCount = asked.filter((a) => a.correct).length
    const bySkill = {}
    asked.forEach((a) => {
      const e = bySkill[a.skillLabel] || { n: 0, ok: 0 }
      e.n++
      if (a.correct) e.ok++
      bySkill[a.skillLabel] = e
    })
    return wrap(
      <>
        <h2 style={styles.question}>Kết quả</h2>
        <div style={{ fontSize: fs(40), fontWeight: '700', color: 'var(--accent)' }}>{okCount}/{asked.length}</div>
        <div style={{ ...practiceStyles.card, maxWidth: '420px' }}>
          {Object.entries(bySkill).map(([label, e]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: fs(14), padding: '4px 0' }}>
              <span>{label}</span>
              <strong>{e.ok}/{e.n} đúng</strong>
            </div>
          ))}
          <div style={{ fontSize: fs(12), color: 'var(--text-muted)', marginTop: '8px' }}>
            Kết quả đã được cộng vào bản đồ kỹ năng và sẽ ảnh hưởng đến các gợi ý luyện tiếp theo. Sau vài lượt luyện, hãy làm lại bài đánh giá tổng quát để so sánh.
          </div>
        </div>
        <div style={{ width: '100%', maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {asked.map((d, i) => <ReviewCard key={i} d={d} n={i + 1} />)}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="qghost" style={quizStyles.ghost} onClick={onExit}>Quay lại</button>
          <button className="qprimary" style={quizStyles.primary} onClick={load}>Bộ mới</button>
        </div>
      </>,
      true
    )
  }

  const q = current.q
  const answered = phase === 'answered'

  return wrap(
    <>
      <ProgressDots current={asked.length + (answered ? 0 : 1)} total={total} />
      <p style={{ margin: 0, fontSize: fs(13), color: 'var(--text-muted)' }}>
        Câu {Math.min(asked.length + (answered ? 0 : 1), total)}/{total}
      </p>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={quizStyles.tag}>{q.skillLabel}</span>
        <span style={{ ...quizStyles.tag, background: 'var(--surface-soft)', color: 'var(--text-soft)' }}>
          {DIFF_LABEL[q.difficulty]}
        </span>
      </div>
      {!answered && asked.length > 0 && note && (
        <p style={{ margin: 0, fontSize: fs(12), color: 'var(--text-muted)' }}>{note}</p>
      )}

      <QuestionBlock q={q} picked={picked} answered={answered} onChoose={choose} />

      <div style={{ width: '100%', maxWidth: '520px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="qghost" style={quizStyles.ghost} onClick={onExit}>
          <Icon name="back" size={16} /> Thoát
        </button>
        {answered && (
          <button className="qprimary" style={quizStyles.primary} onClick={next}>
            {asked.length >= total ? 'Xem kết quả' : 'Câu tiếp theo'} <Icon name="next" size={16} />
          </button>
        )}
      </div>
    </>
  )
}

function ReviewCard({ d, n }) {
  const letters = ['A', 'B', 'C', 'D', 'E']
  const ok = d.picked === d.answer
  return (
    <div style={{ ...practiceStyles.card, maxWidth: '640px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={quizStyles.tag}>Câu {n}</span>
          {d.difficulty && (
            <span style={{ ...quizStyles.tag, background: 'var(--surface-soft)', color: 'var(--text-soft)' }}>
              {DIFF_LABEL[d.difficulty]}
            </span>
          )}
        </span>
        <strong style={{ fontSize: fs(12), color: ok ? '#27ae60' : 'var(--danger)' }}>
          {ok ? 'Đúng' : d.picked == null ? 'Chưa trả lời' : 'Sai'}
        </strong>
      </div>
      <div style={{ ...practiceStyles.sentence, fontSize: fs(17), marginBottom: '10px' }}>{d.question}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {d.options.map((o, i) => {
          const isCorrect = i === d.answer
          const isPicked = i === d.picked
          const extra = isCorrect ? quizStyles.correct : isPicked ? quizStyles.wrong : quizStyles.dim
          return (
            <div key={i} style={{ ...quizStyles.option, ...extra, cursor: 'default', padding: '9px 12px', fontSize: fs(14) }}>
              <span style={quizStyles.letter}>{letters[i]}</span>
              <span style={{ flex: 1 }}>{o}</span>
              {isCorrect && <Icon name="check" size={15} />}
              {isPicked && !isCorrect && <Icon name="close" size={15} />}
            </div>
          )
        })}
      </div>
      {d.explanation && (
        <div style={{ marginTop: '10px', fontSize: fs(13), color: 'var(--text-soft)', lineHeight: 1.5 }}>{d.explanation}</div>
      )}
    </div>
  )
}

function QuizHistory({ profileId, onBack, onRetry }) {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)
  const [onlyWrong, setOnlyWrong] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  const loadList = async () => {
    const res = await window.api.getQuizAttempts({ profileId })
    setList(res.attempts || [])
    setLoading(false)
  }

  useEffect(() => {
    loadList()
  }, [])

  const open = async (id) => {
    const res = await window.api.getQuizAttempt({ profileId, id })
    if (res.success) {
      setDetail(res.attempt)
      setOnlyWrong(false)
    }
  }

  const remove = async () => {
    await window.api.deleteQuizAttempt({ profileId, id: detail.id })
    setConfirmDel(false)
    setDetail(null)
    loadList()
  }

  const wrap = (children) => (
    <div style={{ ...styles.container, justifyContent: 'flex-start', overflowY: 'auto', paddingTop: '32px' }} className="fade-in">
      <style>{fadeStyle}</style>
      <style>{quizCss}</style>
      <style>{dropdownCss}</style>
      {children}
    </div>
  )

  if (loading) return wrap(<p>Đang tải...</p>)

  if (detail) {
    const items = detail.details || []
    const wrongItems = items.filter((d) => d.picked !== d.answer)
    const shown = onlyWrong ? wrongItems : items
    return wrap(
      <>
        <div>
          <h2 style={styles.question}>{detail.label || 'Bài trắc nghiệm'}</h2>
          <p style={{ margin: '6px 0 0', fontSize: fs(13), color: 'var(--text-muted)' }}>
            {fmtAt(detail.at)} ·{' '}
            <strong style={{ color: scoreColor(detail.correct, detail.total) }}>{detail.correct}/{detail.total} đúng</strong>
          </p>
        </div>

        <SegmentedControl
          value={onlyWrong ? 'wrong' : 'all'}
          onChange={(v) => setOnlyWrong(v === 'wrong')}
          options={[
            { value: 'all', label: `Tất cả (${items.length})` },
            { value: 'wrong', label: `Câu sai (${wrongItems.length})` }
          ]}
        />

        {shown.length === 0 && <p style={{ color: 'var(--text-muted)', margin: 0 }}>Không có câu sai nào, làm tốt lắm!</p>}
        {shown.map((d) => {
          const n = items.indexOf(d) + 1
          return <ReviewCard key={n} d={d} n={n} />
        })}

        <div style={{ width: '100%', maxWidth: '640px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <button className="qghost" style={quizStyles.ghost} onClick={() => setDetail(null)}>
            <Icon name="back" size={16} /> Danh sách
          </button>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button className="qghost" style={{ ...quizStyles.ghost, color: '#ef4444' }} onClick={() => setConfirmDel(true)}>
              <Icon name="trash" size={14} /> Xoá bài
            </button>
            <button
              className="qprimary"
              style={{ ...quizStyles.primary, ...(wrongItems.length === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}) }}
              disabled={wrongItems.length === 0}
              onClick={() =>
                onRetry(
                  wrongItems.map((d) => ({
                    question: d.question,
                    options: d.options,
                    answer: d.answer,
                    explanation: d.explanation,
                    skill: d.skill
                  }))
                )
              }
            >
              <Icon name="repeat" size={15} /> Làm lại câu sai
            </button>
          </div>
        </div>

        {confirmDel && (
          <div style={settingsStyles.overlay} onClick={() => setConfirmDel(false)}>
            <div style={{ ...settingsStyles.modal, width: '360px' }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 10px', fontSize: fs(18), fontWeight: '700' }}>Xoá bài này?</h3>
              <p style={{ margin: '0 0 20px', fontSize: fs(13), color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Bài sẽ biến mất khỏi danh sách. Điểm kỹ năng đã tính từ bài này vẫn được giữ.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button className="qghost" style={quizStyles.ghost} onClick={() => setConfirmDel(false)}>Huỷ</button>
                <button style={styles.dangerButton} onClick={remove}>Xoá</button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  return wrap(
    <>
      <div>
        <h2 style={styles.question}>Bài đã làm</h2>
        <p style={{ margin: '6px 0 0', fontSize: fs(13), color: 'var(--text-muted)' }}>50 bài gần nhất</p>
      </div>

      {list.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', maxWidth: '380px', margin: 0 }}>
          Chưa có bài nào. Làm một bài trắc nghiệm, bài sẽ được lưu ở đây để bạn xem lại.
        </p>
      ) : (
        <div style={{ width: '100%', maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {list.map((a) => (
            <button key={a.id} className="level-card" style={hubStyles.card} onClick={() => open(a.id)}>
              <span style={hubStyles.text}>
                <span style={hubStyles.title}>{a.label || 'Bài trắc nghiệm'}</span>
                <span style={hubStyles.desc}>
                  {fmtAt(a.at)} · {a.mode === 'adaptive' ? 'Luyện điểm yếu' : a.mode === 'assessment' ? 'Đánh giá tổng quát' : 'Trắc nghiệm'}
                </span>
              </span>
              <strong style={{ color: scoreColor(a.correct, a.total), fontSize: fs(16) }}>{a.correct}/{a.total}</strong>
            </button>
          ))}
        </div>
      )}

      <button className="qghost" style={{ ...quizStyles.ghost, marginBottom: '16px' }} onClick={onBack}>
        <Icon name="back" size={16} /> Quay lại
      </button>
    </>
  )
}

// ===== Trò chơi ôn tập: dùng dữ liệu có sẵn, không gọi AI =====
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const normText = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim()

// --- Điền từ vào câu ---
function buildCloze(words) {
  const items = []
  for (const w of words) {
    const word = String(w.word || '').trim()
    const sent = String(w.example_sentence || '').trim()
    if (!word || !sent) continue
    const re = new RegExp(`(^|[^\\p{L}\\p{N}])(${escapeRe(word)})(?![\\p{L}\\p{N}])`, 'iu')
    const m = sent.match(re)
    if (!m) continue
    const start = m.index + m[1].length
    items.push({
      id: w.id,
      word,
      meaning: w.meaning,
      full: sent,
      sentence: sent.slice(0, start) + '_____' + sent.slice(start + m[2].length)
    })
  }
  return items
}

function makeClozeQuestions(items, allWords, n) {
  return shuffleArr(items)
    .slice(0, n)
    .map((it) => {
      const sentLower = it.sentence.toLowerCase()
      const seen = new Set([it.word.toLowerCase()])
      const distractors = []
      for (const o of shuffleArr(allWords)) {
        const k = String(o.word || '').toLowerCase()
        if (!k || seen.has(k) || sentLower.includes(k)) continue
        seen.add(k)
        distractors.push(o.word)
        if (distractors.length === 3) break
      }
      if (distractors.length < 3) return null
      const options = shuffleArr([it.word, ...distractors])
      return { ...it, options, answer: options.indexOf(it.word) }
    })
    .filter(Boolean)
}

const fetchGameContent = ({ kind, profileId, profile, cefrLevel, topic, count }) =>
  window.api.generateGameContent({
    kind,
    profileId,
    targetLanguage: profile.targetLanguage,
    nativeLanguage: profile.nativeLanguage,
    cefrLevel,
    topic,
    count
  })

function buildSpotFromItems(items) {
  return items
    .map((it, i) => {
      const others = items.filter((_, j) => j !== i).map((o) => o.correct).filter((s) => normText(s) !== normText(it.correct))
      const third = shuffleArr(others)[0]
      if (!third) return null
      const options = shuffleArr([it.wrong, it.correct, third])
      return {
        skill: it.skill || 'other',
        focus: it.focus || it.skill || 'Nhận diện lỗi trong câu',
        explanation: it.explanation || '',
        wrong: it.wrong,
        correct: it.correct,
        options,
        answer: options.indexOf(it.wrong)
      }
    })
    .filter(Boolean)
}

function GameSetup({ title, intro, reviewTitle, reviewDesc, reviewReady, newTitle, newDesc, topicLabel, profile, onStart, onBack }) {
  const [mode, setMode] = useState(reviewReady ? 'review' : 'new')
  const [topicSel, setTopicSel] = useState('random')
  const [custom, setCustom] = useState('')
  const hasInfo = !!((profile.occupation || '').trim() || (profile.interests || '').trim())
  const usingCustom = !!custom.trim()

  const start = () =>
    onStart({
      mode,
      topic: usingCustom
        ? { type: 'custom', value: custom.trim() }
        : topicSel === 'job' && hasInfo
          ? { type: 'job' }
          : { type: 'random' }
    })

  const rows = [
    { id: 'review', icon: 'repeat', title: reviewTitle, desc: reviewDesc, ok: reviewReady },
    { id: 'new', icon: 'sparkle', title: newTitle, desc: newDesc, ok: true }
  ]

  return (
    <StepCard title={title} subtitle={intro}>
      <style>{quizCss}</style>

      <Field label="Chế độ">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {rows.map((r) => {
            const active = mode === r.id
            return (
              <button
                key={r.id}
                className="qrow"
                disabled={!r.ok}
                style={{
                  ...quizStyles.modeRow,
                  ...(active ? quizStyles.modeRowActive : {}),
                  ...(!r.ok ? { opacity: 0.55, cursor: 'not-allowed' } : {})
                }}
                onClick={() => setMode(r.id)}
              >
                <span style={quizStyles.modeIcon}><Icon name={r.icon} size={16} /></span>
                <span style={hubStyles.text}>
                  <span style={{ ...hubStyles.title, fontSize: fs(14) }}>{r.title}</span>
                  <span style={hubStyles.desc}>{r.desc}</span>
                </span>
                <span style={{ ...quizStyles.radio, ...(active ? quizStyles.radioOn : {}) }}>
                  {active && <Icon name="check" size={12} />}
                </span>
              </button>
            )
          })}
        </div>
      </Field>

      {mode === 'new' && (
        <Field label={topicLabel || 'Chủ đề'}>
          <div style={onboardStyles.chips}>
            <button
              className="qchip"
              style={{ ...quizStyles.chip, ...(!usingCustom && topicSel === 'random' ? quizStyles.chipOn : {}) }}
              onClick={() => {
                setTopicSel('random')
                setCustom('')
              }}
            >
              Ngẫu nhiên
            </button>
            <button
              className="qchip"
              disabled={!hasInfo}
              style={{
                ...quizStyles.chip,
                ...(!usingCustom && topicSel === 'job' ? quizStyles.chipOn : {}),
                ...(!hasInfo ? quizStyles.disabled : {})
              }}
              onClick={() => {
                setTopicSel('job')
                setCustom('')
              }}
              title={hasInfo ? '' : 'Điền nghề/sở thích ở "Chỉnh sửa thông tin"'}
            >
              Theo nghề / sở thích
            </button>
          </div>
          <input
            style={{ ...onboardStyles.fieldInput, marginTop: '10px', ...(usingCustom ? { border: '1.5px solid var(--accent)' } : {}) }}
            maxLength={80}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Hoặc tự nhập chủ đề, ví dụ: du lịch Nhật Bản"
          />
        </Field>
      )}

      <div style={{ ...onboardStyles.actions, marginTop: '8px' }}>
        <button className="qghost" style={quizStyles.ghost} onClick={onBack}>
          <Icon name="back" size={16} /> Quay lại
        </button>
        <button className="qprimary" style={quizStyles.primary} onClick={start}>
          Tiếp tục <Icon name="next" size={16} />
        </button>
      </div>
    </StepCard>
  )
}

// Màn chờ AI tạo nội dung và màn lỗi dùng chung cho cả ba trò
function GameWait({ text }) {
  return (
    <div style={styles.container}>
      <h2 style={styles.question}>{text}</h2>
      <p style={{ color: 'var(--text-muted)', margin: 0, maxWidth: '380px' }}>Có thể mất 10 đến 30 giây.</p>
    </div>
  )
}

function GameError({ message, onRetry, onBack }) {
  return (
    <div style={styles.container}>
      <style>{quizCss}</style>
      <h2 style={styles.question}>Chưa tạo được nội dung</h2>
      <p style={{ color: 'var(--text-muted)', margin: 0, maxWidth: '380px' }}>{message || 'AI có thể đang bận.'}</p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="qghost" style={quizStyles.ghost} onClick={onBack}>Chọn lại</button>
        <button className="qprimary" style={quizStyles.primary} onClick={onRetry}>Thử lại</button>
      </div>
    </div>
  )
}

function ClozeGame({ profileId, profile, cefrLevel, onExit }) {
  // loading | setup | generating | genError | question | answered | done
  const [phase, setPhase] = useState('loading')
  const [source, setSource] = useState('review')
  const [qs, setQs] = useState([])
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const [hint, setHint] = useState(false)
  const [eligible, setEligible] = useState(0)
  const [saveMsg, setSaveMsg] = useState('')
  const [genErr, setGenErr] = useState('')
  const wordsRef = useRef([])
  const cfgRef = useRef(null)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  useEffect(() => {
    window.api.getVocabulary({ profileId }).then((res) => {
      if (!alive.current) return
      wordsRef.current = res.vocabulary || []
      setEligible(buildCloze(wordsRef.current).length)
      setPhase('setup')
    })
  }, [])

  const begin = (list, src) => {
    setSource(src)
    setQs(list)
    setIndex(0)
    setPicked(null)
    setScore(0)
    setHint(false)
    setSaveMsg('')
    setPhase('question')
  }

  const run = async (cfg) => {
    cfgRef.current = cfg
    if (cfg.mode === 'review') {
      const list = makeClozeQuestions(buildCloze(wordsRef.current), wordsRef.current, 10)
      if (list.length < 3) {
        setGenErr('Chưa đủ từ có câu ví dụ chứa đúng từ đó. Hãy chọn chế độ từ mới.')
        setPhase('genError')
        return
      }
      begin(list, 'review')
      return
    }
    setPhase('generating')
    setGenErr('')
    const res = await fetchGameContent({ kind: 'words', profileId, profile, cefrLevel, topic: cfg.topic, count: 14 })
    if (!alive.current) return
    if (!res.success) {
      setGenErr(res.message || '')
      setPhase('genError')
      return
    }
    const items = buildCloze(res.words.map((w, i) => ({ id: `n${i}`, word: w.word, meaning: w.meaning, example_sentence: w.example })))
    const list = makeClozeQuestions(items, res.words, 10)
    if (list.length < 3) {
      setGenErr('AI trả về quá ít câu dùng được.')
      setPhase('genError')
      return
    }
    begin(list, 'new')
  }

  const choose = (i) => {
    if (phase !== 'question') return
    const ok = i === qs[index].answer
    window.api.recordSkillEvent({
      profileId,
      skill: 'vocabulary',
      correct: ok,
      source: 'cloze',
      focus: 'Từ vựng trong ngữ cảnh'
    })
    setPicked(i)
    if (ok) setScore((s) => s + 1)
    setPhase('answered')
  }

  const next = () => {
    if (index + 1 >= qs.length) {
      setPhase('done')
      return
    }
    setIndex(index + 1)
    setPicked(null)
    setHint(false)
    setPhase('question')
  }

  const saveNew = async () => {
    const res = await window.api.saveVocabEntries({
      profileId,
      entries: qs.map((q) => ({ word: q.word, meaning: q.meaning, example: q.full }))
    })
    setSaveMsg(
      res.success ? (res.added > 0 ? `Đã lưu ${res.added} từ vào flashcard.` : 'Các từ này đã có trong flashcard.') : 'Chưa lưu được, bạn thử lại nhé.'
    )
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' && phase === 'answered') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const wrap = (children) => (
    <div style={styles.container} className="fade-in">
      <style>{fadeStyle}</style>
      <style>{quizCss}</style>
      {children}
    </div>
  )

  if (phase === 'loading') return wrap(<p>Đang chuẩn bị...</p>)

  if (phase === 'setup') {
    return (
      <GameSetup
        title="Điền từ vào câu"
        intro="Chọn từ đúng cho chỗ trống trong câu ví dụ."
        reviewTitle="Ôn từ của tôi"
        reviewDesc={`Dùng câu ví dụ trong flashcard (${eligible} từ dùng được)`}
        reviewReady={eligible >= 3 && wordsRef.current.length >= 4}
        newTitle="Từ mới (AI tạo)"
        newDesc="AI tạo từ chưa có trong flashcard của bạn, kèm câu ví dụ"
        topicLabel="Chủ đề từ mới"
        profile={profile}
        onStart={run}
        onBack={onExit}
      />
    )
  }

  if (phase === 'generating') return <GameWait text="AI đang tạo từ mới..." />

  if (phase === 'genError') {
    return <GameError message={genErr} onRetry={() => run(cfgRef.current)} onBack={() => setPhase('setup')} />
  }

  if (phase === 'done') {
    return wrap(
      <>
        <h2 style={styles.question}>Kết quả</h2>
        <div style={{ fontSize: fs(40), fontWeight: '700', color: 'var(--accent)' }}>{score}/{qs.length}</div>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
          {score / qs.length >= 0.8 ? 'Rất tốt!' : score / qs.length >= 0.5 ? 'Khá ổn, thử thêm một lượt nhé.' : 'Hãy ôn lại các từ này trong mục Từ vựng.'}
        </p>

        {source === 'new' && (
          <div style={{ ...practiceStyles.card, maxWidth: '420px' }}>
            <div style={{ fontSize: fs(13), fontWeight: '700', marginBottom: '6px' }}>Từ trong bài này</div>
            {qs.map((q, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: fs(13), padding: '3px 0' }}>
                <strong>{q.word}</strong>
                <span style={{ color: 'var(--text-muted)', textAlign: 'right' }}>{q.meaning}</span>
              </div>
            ))}
            <button
              className="qghost"
              style={{ ...quizStyles.ghost, marginTop: '8px', border: '1.5px solid var(--border)', ...(saveMsg ? { opacity: 0.6 } : {}) }}
              onClick={saveNew}
              disabled={!!saveMsg}
            >
              <Icon name="plus" size={14} /> Lưu {qs.length} từ vào flashcard
            </button>
            {saveMsg && <div style={{ fontSize: fs(12), color: 'var(--text-muted)', marginTop: '6px' }}>{saveMsg}</div>}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="qghost" style={quizStyles.ghost} onClick={() => setPhase('setup')}>Đổi chế độ</button>
          <button className="qprimary" style={quizStyles.primary} onClick={() => run(cfgRef.current)}>
            {source === 'new' ? 'Bộ từ mới khác' : 'Chơi lại'}
          </button>
        </div>
      </>
    )
  }

  const cur = qs[index]
  const answered = phase === 'answered'
  const q = {
    question: cur.sentence,
    options: cur.options,
    answer: cur.answer,
    explanation: `Câu đầy đủ: "${cur.full}" · ${cur.word}: ${cur.meaning}`
  }

  return wrap(
    <>
      <ProgressDots current={index + 1} total={qs.length} />
      <p style={{ margin: 0, fontSize: fs(13), color: 'var(--text-muted)' }}>
        Điền từ vào câu · {source === 'new' ? 'Từ mới' : 'Từ của bạn'} · Câu {index + 1}/{qs.length}
      </p>

      {!answered && (
        <div style={{ minHeight: '22px' }}>
          {hint ? (
            <span style={{ fontSize: fs(13), color: 'var(--text-soft)' }}>Gợi ý nghĩa: {cur.meaning}</span>
          ) : (
            <button className="qghost" style={{ ...quizStyles.ghost, padding: '4px 10px', fontSize: fs(13) }} onClick={() => setHint(true)}>
              <Icon name="sparkle" size={13} /> Xem gợi ý nghĩa
            </button>
          )}
        </div>
      )}

      <QuestionBlock q={q} picked={picked} answered={answered} onChoose={choose} />

      <div style={{ width: '100%', maxWidth: '520px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="qghost" style={quizStyles.ghost} onClick={onExit}>
          <Icon name="back" size={16} /> Thoát
        </button>
        {answered && (
          <button className="qprimary" style={quizStyles.primary} onClick={next}>
            {index + 1 >= qs.length ? 'Xem kết quả' : 'Câu tiếp theo'} <Icon name="next" size={16} />
          </button>
        )}
      </div>
    </>
  )
}


// --- Tìm câu sai ---
function buildSpotRounds(mistakes, vocab, n) {
  const seen = new Set()
  const base = []
  for (const m of mistakes) {
    const o = String(m.original_text || '').trim()
    const c = String(m.corrected_text || '').trim()
    if (!o || !c || normText(o) === normText(c) || seen.has(normText(o))) continue
    seen.add(normText(o))
    base.push(m)
  }
  const correctPool = [
    ...base.map((m) => String(m.corrected_text).trim()),
    ...vocab.map((v) => String(v.example_sentence || '').trim()).filter(Boolean)
  ]
  const rounds = []
  for (const m of shuffleArr(base).slice(0, n)) {
    const o = String(m.original_text).trim()
    const c = String(m.corrected_text).trim()
    const third = shuffleArr(correctPool.filter((s) => normText(s) !== normText(c) && normText(s) !== normText(o)))[0]
    if (!third) continue
    const options = shuffleArr([o, c, third])
    rounds.push({
      skill: m.skill || 'other',
      focus: m.category || m.skill || 'Nhận diện lỗi trong câu',
      explanation: m.explanation || '',
      wrong: o,
      correct: c,
      options,
      answer: options.indexOf(o)
    })
  }
  return rounds
}

function SpotGame({ profileId, profile, cefrLevel, onExit }) {
  // loading | setup | generating | genError | question | answered | done
  const [phase, setPhase] = useState('loading')
  const [source, setSource] = useState('review')
  const [rounds, setRounds] = useState([])
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const [genErr, setGenErr] = useState('')
  const [reviewCount, setReviewCount] = useState(0)
  const dataRef = useRef({ mistakes: [], vocab: [] })
  const cfgRef = useRef(null)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  useEffect(() => {
    Promise.all([window.api.getMistakes({ profileId }), window.api.getVocabulary({ profileId })]).then(([m, v]) => {
      if (!alive.current) return
      dataRef.current = { mistakes: m.mistakes || [], vocab: v.vocabulary || [] }
      setReviewCount(buildSpotRounds(dataRef.current.mistakes, dataRef.current.vocab, 10).length)
      setPhase('setup')
    })
  }, [])

  const begin = (list, src) => {
    setSource(src)
    setRounds(list)
    setIndex(0)
    setPicked(null)
    setScore(0)
    setPhase('question')
  }

  const run = async (cfg) => {
    cfgRef.current = cfg
    if (cfg.mode === 'review') {
      const list = buildSpotRounds(dataRef.current.mistakes, dataRef.current.vocab, 10)
      if (list.length === 0) {
        setGenErr('Chưa đủ lỗi sai để chơi. Hãy chọn chế độ câu mới.')
        setPhase('genError')
        return
      }
      begin(list, 'review')
      return
    }
    setPhase('generating')
    setGenErr('')
    const res = await fetchGameContent({ kind: 'spot', profileId, profile, cefrLevel, topic: cfg.topic, count: 10 })
    if (!alive.current) return
    const list = res.success ? buildSpotFromItems(res.items) : []
    if (list.length < 3) {
      setGenErr(res.message || 'AI trả về quá ít bộ câu dùng được.')
      setPhase('genError')
      return
    }
    begin(list, 'new')
  }

  const choose = (i) => {
    if (phase !== 'question') return
    const r = rounds[index]
    const ok = i === r.answer
    window.api.recordSkillEvent({
      profileId,
      skill: r.skill,
      correct: ok,
      source: 'spot',
      focus: r.focus || r.skillLabel || 'Nhận diện lỗi trong câu'
    })
    setPicked(i)
    if (ok) setScore((s) => s + 1)
    setPhase('answered')
  }

  const next = () => {
    if (index + 1 >= rounds.length) {
      setPhase('done')
      return
    }
    setIndex(index + 1)
    setPicked(null)
    setPhase('question')
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' && phase === 'answered') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const wrap = (children) => (
    <div style={styles.container} className="fade-in">
      <style>{fadeStyle}</style>
      <style>{quizCss}</style>
      {children}
    </div>
  )

  if (phase === 'loading') return wrap(<p>Đang chuẩn bị...</p>)

  if (phase === 'setup') {
    return (
      <GameSetup
        title="Tìm câu sai"
        intro="Trong ba câu, tìm câu có lỗi."
        reviewTitle="Lỗi của tôi"
        reviewDesc={reviewCount > 0 ? 'Dùng các câu bạn từng viết sai khi trò chuyện' : 'Chưa đủ lỗi sai được ghi nhận'}
        reviewReady={reviewCount > 0}
        newTitle="Câu mới (AI tạo)"
        newDesc="AI viết câu đúng và câu có một lỗi thường gặp ở trình độ của bạn"
        topicLabel="Chủ đề câu"
        profile={profile}
        onStart={run}
        onBack={onExit}
      />
    )
  }

  if (phase === 'generating') return <GameWait text="AI đang viết câu mới..." />

  if (phase === 'genError') {
    return <GameError message={genErr} onRetry={() => run(cfgRef.current)} onBack={() => setPhase('setup')} />
  }

  if (phase === 'done') {
    return wrap(
      <>
        <h2 style={styles.question}>Kết quả</h2>
        <div style={{ fontSize: fs(40), fontWeight: '700', color: 'var(--accent)' }}>{score}/{rounds.length}</div>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
          {score / rounds.length >= 0.8 ? 'Mắt bạn tinh đấy!' : 'Xem lại phần giải thích và thử một lượt nữa nhé.'}
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="qghost" style={quizStyles.ghost} onClick={() => setPhase('setup')}>Đổi chế độ</button>
          <button className="qprimary" style={quizStyles.primary} onClick={() => run(cfgRef.current)}>
            {source === 'new' ? 'Bộ câu mới khác' : 'Chơi lại'}
          </button>
        </div>
      </>
    )
  }

  const r = rounds[index]
  const answered = phase === 'answered'
  const q = {
    question: 'Câu nào dưới đây có lỗi?',
    options: r.options,
    answer: r.answer,
    okText: 'Chính xác! Đó là câu có lỗi.',
    badText: `Câu có lỗi là: "${r.wrong}"`,
    explanation: `Câu đúng: "${r.correct}"${r.explanation ? `. ${r.explanation}` : ''}`
  }

  return wrap(
    <>
      <ProgressDots current={index + 1} total={rounds.length} />
      <p style={{ margin: 0, fontSize: fs(13), color: 'var(--text-muted)' }}>
        Tìm câu sai · {source === 'new' ? 'Câu mới' : 'Lỗi của bạn'} · Câu {index + 1}/{rounds.length}
      </p>

      <QuestionBlock q={q} picked={picked} answered={answered} onChoose={choose} />

      <div style={{ width: '100%', maxWidth: '520px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="qghost" style={quizStyles.ghost} onClick={onExit}>
          <Icon name="back" size={16} /> Thoát
        </button>
        {answered && (
          <button className="qprimary" style={quizStyles.primary} onClick={next}>
            {index + 1 >= rounds.length ? 'Xem kết quả' : 'Câu tiếp theo'} <Icon name="next" size={16} />
          </button>
        )}
      </div>
    </>
  )
}

// --- Ghép từ với nghĩa trong 60 giây ---
const MATCH_ROUND = 6
const MATCH_SECONDS = 60

function MatchGame({ profileId, profile, cefrLevel, onExit }) {
  // loading | setup | generating | genError | ready | playing | done
  const [phase, setPhase] = useState('loading')
  const [source, setSource] = useState('review')
  const [pairs, setPairs] = useState([])
  const [meanings, setMeanings] = useState([])
  const [matched, setMatched] = useState(new Set())
  const [selW, setSelW] = useState(null)
  const [selM, setSelM] = useState(null)
  const [flash, setFlash] = useState(null)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [bestCombo, setBestCombo] = useState(0)
  const [right, setRight] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [timeLeft, setTimeLeft] = useState(MATCH_SECONDS)
  const [best, setBest] = useState(0)
  const [newBest, setNewBest] = useState(false)
  const [reviewCount, setReviewCount] = useState(0)
  const [genErr, setGenErr] = useState('')
  const [saveMsg, setSaveMsg] = useState('')
  const vocabRef = useRef([])
  const cardsRef = useRef([])
  const deckRef = useRef([])
  const posRef = useRef(0)
  const seenRef = useRef(new Map())
  const cfgRef = useRef(null)
  const alive = useRef(true)
  const bestKey = `matchBest_${profileId}`

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const uniqueByMeaning = (list) => {
    const seen = new Set()
    return list.filter((w) => {
      const k = normText(w.meaning)
      if (!String(w.word || '').trim() || !k || seen.has(k)) return false
      seen.add(k)
      return true
    })
  }

  useEffect(() => {
    window.api.getVocabulary({ profileId }).then((res) => {
      if (!alive.current) return
      vocabRef.current = res.vocabulary || []
      setReviewCount(uniqueByMeaning(vocabRef.current).length)
      try {
        setBest(Number(localStorage.getItem(bestKey) || 0))
      } catch {
        setBest(0)
      }
      setPhase('setup')
    })
  }, [])

  const run = async (cfg) => {
    cfgRef.current = cfg
    setGenErr('')
    setSaveMsg('')
    if (cfg.mode === 'review') {
      const cards = uniqueByMeaning(vocabRef.current)
      if (cards.length < MATCH_ROUND) {
        setGenErr(`Cần ít nhất ${MATCH_ROUND} từ có nghĩa khác nhau. Hãy chọn chế độ từ mới.`)
        setPhase('genError')
        return
      }
      cardsRef.current = cards
      setSource('review')
      setPhase('ready')
      return
    }
    setPhase('generating')
    const res = await fetchGameContent({ kind: 'words', profileId, profile, cefrLevel, topic: cfg.topic, count: 42 })
    if (!alive.current) return
    const cards = res.success
      ? uniqueByMeaning(res.words.map((w, i) => ({ id: `n${i}`, word: w.word, meaning: w.meaning, example_sentence: w.example })))
      : []
    if (cards.length < MATCH_ROUND) {
      setGenErr(res.message || 'AI trả về quá ít từ dùng được.')
      setPhase('genError')
      return
    }
    cardsRef.current = cards
    setSource('new')
    setPhase('ready')
  }

  const deal = () => {
    if (posRef.current + MATCH_ROUND > deckRef.current.length) {
      deckRef.current = shuffleArr(cardsRef.current)
      posRef.current = 0
    }
    const slice = deckRef.current.slice(posRef.current, posRef.current + MATCH_ROUND)
    posRef.current += MATCH_ROUND
    slice.forEach((c) => seenRef.current.set(c.id, c))
    setPairs(slice)
    setMeanings(shuffleArr(slice))
    setMatched(new Set())
    setSelW(null)
    setSelM(null)
  }

  const startGame = () => {
    deckRef.current = shuffleArr(cardsRef.current)
    posRef.current = 0
    seenRef.current = new Map()
    setScore(0)
    setCombo(0)
    setBestCombo(0)
    setRight(0)
    setWrong(0)
    setNewBest(false)
    setSaveMsg('')
    setFlash(null)
    setTimeLeft(MATCH_SECONDS)
    deal()
    setPhase('playing')
  }

  useEffect(() => {
    if (phase !== 'playing') return
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  useEffect(() => {
    if (phase === 'playing' && timeLeft <= 0) {
      try {
        const prev = Number(localStorage.getItem(bestKey) || 0)
        if (score > prev) {
          localStorage.setItem(bestKey, String(score))
          setBest(score)
          setNewBest(true)
        }
      } catch {
        // bỏ qua nếu không lưu được
      }
      setPhase('done')
    }
  }, [timeLeft, phase])

  const pick = (side, id) => {
    if (phase !== 'playing' || flash || matched.has(id)) return
    const w = side === 'w' ? id : selW
    const m = side === 'm' ? id : selM
    if (side === 'w') setSelW(id)
    else setSelM(id)
    if (w == null || m == null) return

    if (w === m) {
      window.api.recordSkillEvent({
        profileId,
        skill: 'vocabulary',
        correct: true,
        source: 'match',
        focus: 'Ghép từ với nghĩa'
      })
      const done = new Set(matched).add(w)
      setMatched(done)
      setScore((s) => s + 10 + Math.min(combo, 5) * 2)
      setCombo(combo + 1)
      setBestCombo((b) => Math.max(b, combo + 1))
      setRight((r) => r + 1)
      setSelW(null)
      setSelM(null)
      if (done.size === pairs.length) setTimeout(deal, 450)
    } else {
      window.api.recordSkillEvent({
        profileId,
        skill: 'vocabulary',
        correct: false,
        source: 'match',
        focus: 'Ghép từ với nghĩa'
      })
      setCombo(0)
      setWrong((x) => x + 1)
      setTimeLeft((t) => Math.max(0, t - 2))
      setFlash({ w, m })
      setTimeout(() => {
        setFlash(null)
        setSelW(null)
        setSelM(null)
      }, 350)
    }
  }

  const saveSeen = async () => {
    const entries = [...seenRef.current.values()].map((c) => ({ word: c.word, meaning: c.meaning, example: c.example_sentence }))
    const res = await window.api.saveVocabEntries({ profileId, entries })
    setSaveMsg(
      res.success ? (res.added > 0 ? `Đã lưu ${res.added} từ vào flashcard.` : 'Các từ này đã có trong flashcard.') : 'Chưa lưu được, bạn thử lại nhé.'
    )
  }

  const tile = (id, side) => {
    const isMatched = matched.has(id)
    const isSel = side === 'w' ? selW === id : selM === id
    const isWrong = flash && (side === 'w' ? flash.w === id : flash.m === id)
    return {
      ...quizStyles.option,
      alignItems: 'center',
      minHeight: '48px',
      fontSize: side === 'w' ? fs(15) : fs(13),
      fontWeight: side === 'w' ? '600' : '400',
      ...(isMatched
        ? { ...quizStyles.correct, opacity: 0.5, cursor: 'default' }
        : isWrong
          ? quizStyles.wrong
          : isSel
            ? { border: '1.5px solid var(--accent)', background: 'var(--accent-soft)' }
            : {})
    }
  }

  const wrap = (children) => (
    <div style={styles.container} className="fade-in">
      <style>{fadeStyle}</style>
      <style>{quizCss}</style>
      {children}
    </div>
  )

  if (phase === 'loading') return wrap(<p>Đang chuẩn bị...</p>)

  if (phase === 'setup') {
    return (
      <GameSetup
        title="Ghép từ 60 giây"
        intro="Ghép từ với nghĩa đúng, càng nhanh càng nhiều điểm."
        reviewTitle="Ôn từ của tôi"
        reviewDesc={
          reviewCount >= MATCH_ROUND
            ? `Dùng ${reviewCount} từ trong flashcard${reviewCount < 18 ? ' (kho còn ít nên sẽ lặp lại)' : ''}`
            : `Cần ít nhất ${MATCH_ROUND} từ khác nghĩa (hiện có ${reviewCount})`
        }
        reviewReady={reviewCount >= MATCH_ROUND}
        newTitle="Từ mới (AI tạo)"
        newDesc="AI tạo khoảng 40 từ chưa có trong flashcard, không lặp lại các lần trước"
        topicLabel="Chủ đề từ mới"
        profile={profile}
        onStart={run}
        onBack={onExit}
      />
    )
  }

  if (phase === 'generating') return <GameWait text="AI đang tạo từ mới..." />

  if (phase === 'genError') {
    return <GameError message={genErr} onRetry={() => run(cfgRef.current)} onBack={() => setPhase('setup')} />
  }

  if (phase === 'ready') {
    return wrap(
      <>
        <h2 style={styles.question}>Sẵn sàng?</h2>
        <div style={{ ...practiceStyles.card, maxWidth: '420px', fontSize: fs(14), lineHeight: 1.7 }}>
          <div>Ghép mỗi từ ở cột trái với nghĩa đúng ở cột phải.</div>
          <div>Ghép đúng liên tiếp để nhận thêm điểm combo.</div>
          <div>Ghép sai sẽ mất 2 giây và reset combo.</div>
          <div style={{ marginTop: '8px', color: 'var(--text-muted)', fontSize: fs(12) }}>
            {source === 'new' ? `Bộ từ mới: ${cardsRef.current.length} từ` : `Kho của bạn: ${cardsRef.current.length} từ`} · Điểm cao nhất: {best}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="qghost" style={quizStyles.ghost} onClick={() => setPhase('setup')}>Đổi chế độ</button>
          <button className="qprimary" style={quizStyles.primary} onClick={startGame}>
            Bắt đầu <Icon name="next" size={16} />
          </button>
        </div>
      </>
    )
  }

  if (phase === 'done') {
    const total = right + wrong
    return wrap(
      <>
        <h2 style={styles.question}>Hết giờ!</h2>
        <div style={{ fontSize: fs(40), fontWeight: '700', color: 'var(--accent)' }}>{score} điểm</div>
        {newBest && <p style={{ color: '#27ae60', margin: 0, fontWeight: '700' }}>Kỷ lục mới!</p>}
        <div style={{ ...practiceStyles.card, maxWidth: '360px', fontSize: fs(14), lineHeight: 1.8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cặp ghép đúng</span><strong>{right}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Lần ghép sai</span><strong>{wrong}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Combo dài nhất</span><strong>{bestCombo}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Độ chính xác</span><strong>{total ? Math.round((right / total) * 100) : 0}%</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Điểm cao nhất</span><strong>{best}</strong></div>
        </div>

        {source === 'new' && (
          <div style={{ textAlign: 'center' }}>
            <button
              className="qghost"
              style={{ ...quizStyles.ghost, border: '1.5px solid var(--border)', ...(saveMsg ? { opacity: 0.6 } : {}) }}
              onClick={saveSeen}
              disabled={!!saveMsg}
            >
              <Icon name="plus" size={14} /> Lưu {seenRef.current.size} từ đã gặp vào flashcard
            </button>
            {saveMsg && <div style={{ fontSize: fs(12), color: 'var(--text-muted)', marginTop: '6px' }}>{saveMsg}</div>}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="qghost" style={quizStyles.ghost} onClick={onExit}>Quay lại</button>
          <button className="qghost" style={quizStyles.ghost} onClick={() => setPhase('setup')}>Đổi chế độ</button>
          <button className="qprimary" style={quizStyles.primary} onClick={startGame}>Chơi lại</button>
        </div>
      </>
    )
  }

  return wrap(
    <>
      <div style={{ width: '100%', maxWidth: '560px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: fs(14), marginBottom: '6px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: timeLeft <= 10 ? '#c0392b' : 'var(--text)' }}>
            <Icon name="clock" size={16} /> {timeLeft}s
          </span>
          <span style={{ fontWeight: '700' }}>Điểm: {score}</span>
          <span style={{ color: combo >= 3 ? 'var(--accent-text)' : 'var(--text-muted)', fontWeight: '700' }}>Combo x{combo}</span>
        </div>
        <div style={{ height: '6px', borderRadius: '999px', background: 'var(--border-soft)', overflow: 'hidden' }}>
          <div
            style={{
              width: `${(timeLeft / MATCH_SECONDS) * 100}%`,
              height: '100%',
              background: timeLeft <= 10 ? '#c0392b' : 'var(--accent)',
              transition: 'width 1s linear'
            }}
          />
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: '560px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {pairs.map((p) => (
            <button key={p.id} className="quiz-opt" style={tile(p.id, 'w')} onClick={() => pick('w', p.id)}>
              {p.word}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {meanings.map((p) => (
            <button key={p.id} className="quiz-opt" style={tile(p.id, 'm')} onClick={() => pick('m', p.id)}>
              {p.meaning}
            </button>
          ))}
        </div>
      </div>

      <button className="qghost" style={quizStyles.ghost} onClick={onExit}>
        <Icon name="back" size={16} /> Thoát
      </button>
    </>
  )
}

const STRUCTURES = [
  // ===== Các thì =====
  { id: 'present_simple', group: 'Các thì', level: 'A1', skill: 'tense', title: 'Hiện tại đơn',
    formula: ['S + V(s/es)', 'S + do/does not + V'],
    use: 'Thói quen, sự thật hiển nhiên, lịch trình cố định.',
    examples: [['She works in a bank every day.', 'Cô ấy làm việc ở ngân hàng mỗi ngày.'], ['Water boils at 100 degrees.', 'Nước sôi ở 100 độ.']] },
  { id: 'present_continuous', group: 'Các thì', level: 'A1', skill: 'tense', title: 'Hiện tại tiếp diễn',
    formula: ['S + am/is/are + V-ing'],
    use: 'Hành động đang diễn ra lúc nói, hoặc kế hoạch gần đã sắp xếp.',
    examples: [['I am studying English now.', 'Bây giờ tôi đang học tiếng Anh.'], ['We are meeting the client tomorrow.', 'Ngày mai chúng tôi gặp khách hàng.']] },
  { id: 'past_simple', group: 'Các thì', level: 'A2', skill: 'tense', title: 'Quá khứ đơn',
    formula: ['S + V2/V-ed', 'S + did not + V'],
    use: 'Hành động đã xảy ra và kết thúc trong quá khứ.',
    examples: [['I visited Hanoi last year.', 'Năm ngoái tôi đã đến Hà Nội.'], ["He didn't call me yesterday.", 'Hôm qua anh ấy không gọi cho tôi.']] },
  { id: 'past_continuous', group: 'Các thì', level: 'A2', skill: 'tense', title: 'Quá khứ tiếp diễn',
    formula: ['S + was/were + V-ing'],
    use: 'Hành động đang diễn ra tại một thời điểm trong quá khứ, hoặc bị một hành động khác cắt ngang.',
    examples: [['I was cooking when he called.', 'Tôi đang nấu ăn thì anh ấy gọi.'], ['They were watching TV at 8 p.m. last night.', 'Tối qua lúc 8 giờ họ đang xem tivi.']] },
  { id: 'future_forms', group: 'Các thì', level: 'A2', skill: 'tense', title: 'Tương lai: will và be going to',
    formula: ['will + V', 'S + am/is/are going to + V'],
    use: 'will: quyết định ngay lúc nói, lời hứa, dự đoán. be going to: dự định đã có từ trước, hoặc dự đoán có dấu hiệu.',
    examples: [["I'll help you carry that bag.", 'Để tôi giúp bạn xách cái túi đó.'], ['We are going to travel to Da Nang next month.', 'Tháng sau chúng tôi sẽ đi Đà Nẵng.']] },
  { id: 'present_perfect', group: 'Các thì', level: 'B1', skill: 'tense', title: 'Hiện tại hoàn thành',
    formula: ['S + have/has + V3'],
    use: 'Trải nghiệm, hoặc hành động bắt đầu trong quá khứ và còn liên quan đến hiện tại (for, since, already, yet, ever, never).',
    examples: [['I have lived here for five years.', 'Tôi đã sống ở đây được năm năm.'], ['She has never eaten sushi.', 'Cô ấy chưa bao giờ ăn sushi.']] },
  { id: 'past_perfect', group: 'Các thì', level: 'B2', skill: 'tense', title: 'Quá khứ hoàn thành',
    formula: ['S + had + V3'],
    use: 'Hành động xảy ra trước một hành động hoặc mốc khác trong quá khứ.',
    examples: [['When I arrived, the train had already left.', 'Khi tôi đến, tàu đã rời đi rồi.'], ['She said she had finished the report.', 'Cô ấy nói cô ấy đã làm xong báo cáo.']] },

  // ===== Câu điều kiện và ước muốn =====
  { id: 'cond_1', group: 'Câu điều kiện & ước muốn', level: 'A2', skill: 'structure', title: 'Câu điều kiện loại 1',
    formula: ['If + hiện tại đơn, S + will + V'],
    use: 'Điều kiện có thể xảy ra ở hiện tại hoặc tương lai.',
    examples: [['If it rains, we will stay at home.', 'Nếu trời mưa, chúng tôi sẽ ở nhà.'], ['If you study hard, you will pass the exam.', 'Nếu bạn học chăm, bạn sẽ đậu kỳ thi.']] },
  { id: 'cond_2', group: 'Câu điều kiện & ước muốn', level: 'B1', skill: 'structure', title: 'Câu điều kiện loại 2',
    formula: ['If + quá khứ đơn, S + would + V'],
    use: 'Điều kiện không có thật hoặc khó xảy ra ở hiện tại. Với to be thường dùng were cho mọi ngôi.',
    examples: [['If I had more time, I would learn Japanese.', 'Nếu có nhiều thời gian hơn, tôi sẽ học tiếng Nhật.'], ['If I were you, I would accept the offer.', 'Nếu tôi là bạn, tôi sẽ nhận lời đề nghị.']] },
  { id: 'cond_3', group: 'Câu điều kiện & ước muốn', level: 'B2', skill: 'structure', title: 'Câu điều kiện loại 3',
    formula: ['If + quá khứ hoàn thành, S + would have + V3'],
    use: 'Điều kiện không có thật trong quá khứ, nói về hệ quả đã không xảy ra.',
    examples: [['If she had studied, she would have passed the test.', 'Nếu cô ấy đã học, cô ấy đã đậu bài kiểm tra.'], ["If we had left earlier, we wouldn't have missed the flight.", 'Nếu chúng tôi đi sớm hơn, chúng tôi đã không lỡ chuyến bay.']] },
  { id: 'wish', group: 'Câu điều kiện & ước muốn', level: 'B1', skill: 'structure', title: 'Câu ước (wish)',
    formula: ['S + wish + quá khứ đơn  (điều trái với hiện tại)', 'S + wish + had + V3  (tiếc chuyện đã qua)'],
    use: 'Ước điều trái với hiện tại, hoặc tiếc nuối về chuyện đã xảy ra.',
    examples: [['I wish I lived near the sea.', 'Ước gì tôi sống gần biển.'], ['I wish I had called her yesterday.', 'Giá mà hôm qua tôi đã gọi cho cô ấy.']] },

  // ===== Bị động và câu gián tiếp =====
  { id: 'passive', group: 'Bị động & câu gián tiếp', level: 'B1', skill: 'structure', title: 'Câu bị động',
    formula: ['S + be + V3 (+ by + O)'],
    use: 'Nhấn mạnh hành động hoặc đối tượng chịu tác động, khi người thực hiện không quan trọng hoặc không rõ.',
    examples: [['English is spoken all over the world.', 'Tiếng Anh được nói trên khắp thế giới.'], ['The window was broken by a boy.', 'Cửa sổ bị một cậu bé làm vỡ.']] },
  { id: 'causative', group: 'Bị động & câu gián tiếp', level: 'B2', skill: 'structure', title: 'Nhờ ai làm gì (have/get)',
    formula: ['S + have + O + V3', 'S + get + O + V3'],
    use: 'Nói về việc nhờ hoặc thuê người khác làm giúp một việc.',
    examples: [['I had my car repaired yesterday.', 'Hôm qua tôi đã đem xe đi sửa.'], ['She gets her hair cut every month.', 'Tháng nào cô ấy cũng đi cắt tóc.']] },
  { id: 'reported', group: 'Bị động & câu gián tiếp', level: 'B1', skill: 'structure', title: 'Câu gián tiếp',
    formula: ['S + said (that) + mệnh đề lùi một thì'],
    use: 'Thuật lại lời người khác: thường lùi một thì, đổi đại từ và trạng từ chỉ thời gian.',
    examples: [['She said (that) she was tired.', 'Cô ấy nói cô ấy mệt.'], ['He told me that he would call me later.', 'Anh ấy bảo anh ấy sẽ gọi cho tôi sau.']] },

  // ===== So sánh và mức độ =====
  { id: 'comparative', group: 'So sánh & mức độ', level: 'A2', skill: 'structure', title: 'So sánh hơn',
    formula: ['S + be + adj-er + than', 'S + be + more + adj + than'],
    use: 'Tính từ ngắn thêm -er, tính từ dài dùng more.',
    examples: [['This bag is cheaper than that one.', 'Cái túi này rẻ hơn cái kia.'], ['She is more careful than her brother.', 'Cô ấy cẩn thận hơn anh trai.']] },
  { id: 'superlative', group: 'So sánh & mức độ', level: 'A2', skill: 'structure', title: 'So sánh nhất',
    formula: ['S + be + the + adj-est', 'S + be + the most + adj'],
    use: 'So sánh một người hoặc vật với cả nhóm.',
    examples: [['He is the tallest student in the class.', 'Cậu ấy là học sinh cao nhất lớp.'], ['This is the most interesting book I have read.', 'Đây là cuốn sách thú vị nhất tôi từng đọc.']] },
  { id: 'as_as', group: 'So sánh & mức độ', level: 'A2', skill: 'structure', title: 'So sánh bằng',
    formula: ['S + be + as + adj + as', 'S + be + not as/so + adj + as'],
    use: 'Hai đối tượng ngang nhau hoặc không ngang nhau về một đặc điểm.',
    examples: [['He runs as fast as his brother.', 'Anh ấy chạy nhanh như anh trai.'], ['This test was not as difficult as I expected.', 'Bài kiểm tra này không khó như tôi nghĩ.']] },
  { id: 'too_enough', group: 'So sánh & mức độ', level: 'B1', skill: 'structure', title: 'too và enough',
    formula: ['too + adj + (for O) + to V', 'adj + enough + (for O) + to V'],
    use: 'too: quá … đến mức không thể. enough: đủ … để.',
    examples: [["It's too hot to go outside.", 'Trời nóng quá nên không ra ngoài được.'], ['She is old enough to drive.', 'Cô ấy đủ tuổi để lái xe.']] },
  { id: 'so_such', group: 'So sánh & mức độ', level: 'B1', skill: 'structure', title: 'so … that và such … that',
    formula: ['so + adj/adv + that + mệnh đề', 'such + (a/an) + adj + N + that + mệnh đề'],
    use: 'Nhấn mạnh mức độ dẫn đến một kết quả.',
    examples: [['It was so cold that we stayed inside.', 'Trời lạnh đến nỗi chúng tôi ở trong nhà.'], ['It was such a good film that I watched it twice.', 'Bộ phim hay đến mức tôi xem hai lần.']] },
  { id: 'double_comparative', group: 'So sánh & mức độ', level: 'B2', skill: 'structure', title: 'The more … the more …',
    formula: ['The + so sánh hơn + S + V, the + so sánh hơn + S + V'],
    use: 'Hai sự việc thay đổi song song với nhau.',
    examples: [['The more you practice, the better you become.', 'Bạn càng luyện tập nhiều, bạn càng giỏi.'], ['The earlier we leave, the sooner we arrive.', 'Chúng ta đi càng sớm thì đến càng sớm.']] },

  // ===== Mệnh đề và dạng động từ =====
  { id: 'there_is', group: 'Mệnh đề & dạng động từ', level: 'A1', skill: 'structure', title: 'There is / There are',
    formula: ['There is + N số ít / không đếm được', 'There are + N số nhiều'],
    use: 'Giới thiệu sự tồn tại của người hoặc vật ở một nơi.',
    examples: [['There is a book on the table.', 'Có một cuốn sách trên bàn.'], ['There are two cats in the garden.', 'Có hai con mèo trong vườn.']] },
  { id: 'modals', group: 'Mệnh đề & dạng động từ', level: 'A2', skill: 'structure', title: 'Động từ khuyết thiếu',
    formula: ['can / could / should / must / might + V'],
    use: 'Khả năng, lời khuyên, sự bắt buộc, phỏng đoán.',
    examples: [['You should see a doctor.', 'Bạn nên đi khám bác sĩ.'], ['He might be late because of the traffic.', 'Có thể anh ấy sẽ đến muộn vì kẹt xe.']] },
  { id: 'used_to', group: 'Mệnh đề & dạng động từ', level: 'A2', skill: 'structure', title: 'used to và be used to',
    formula: ['S + used to + V', 'S + be used to + V-ing'],
    use: 'used to: thói quen trong quá khứ nay không còn. be used to: đã quen với điều gì.',
    examples: [['I used to play football every day.', 'Trước đây ngày nào tôi cũng chơi bóng đá.'], ['He is used to getting up early.', 'Anh ấy đã quen dậy sớm.']] },
  { id: 'it_takes', group: 'Mệnh đề & dạng động từ', level: 'A2', skill: 'structure', title: 'It takes … to …',
    formula: ['It takes + (O) + thời gian + to V'],
    use: 'Nói về khoảng thời gian cần để làm một việc.',
    examples: [['It takes me 30 minutes to get to work.', 'Tôi mất 30 phút để đến chỗ làm.'], ['How long does it take to learn French?', 'Học tiếng Pháp mất bao lâu?']] },
  { id: 'relative', group: 'Mệnh đề & dạng động từ', level: 'B1', skill: 'structure', title: 'Mệnh đề quan hệ',
    formula: ['N + who/which/that/whose/where + mệnh đề'],
    use: 'who cho người, which cho vật, that cho cả hai, whose chỉ sở hữu, where chỉ nơi chốn.',
    examples: [['The man who lives next door is a doctor.', 'Người đàn ông sống bên cạnh là bác sĩ.'], ['This is the book that I told you about.', 'Đây là cuốn sách tôi đã nói với bạn.']] },
  { id: 'gerund_inf', group: 'Mệnh đề & dạng động từ', level: 'B1', skill: 'structure', title: 'V-ing hay to V',
    formula: ['enjoy / avoid / finish + V-ing', 'want / decide / hope + to V'],
    use: 'Mỗi động từ đi kèm một dạng nhất định, cần học theo từng động từ.',
    examples: [['I enjoy reading before bed.', 'Tôi thích đọc sách trước khi ngủ.'], ['She decided to move to Hanoi.', 'Cô ấy quyết định chuyển ra Hà Nội.']] },
  { id: 'question_tags', group: 'Mệnh đề & dạng động từ', level: 'B1', skill: 'structure', title: 'Câu hỏi đuôi',
    formula: ['Mệnh đề khẳng định, trợ động từ phủ định + S?', 'Mệnh đề phủ định, trợ động từ khẳng định + S?'],
    use: 'Xác nhận lại thông tin hoặc mong người nghe đồng ý.',
    examples: [["You like coffee, don't you?", 'Bạn thích cà phê, đúng không?'], ["She isn't coming, is she?", 'Cô ấy không đến, phải không?']] },
  { id: 'would_rather', group: 'Mệnh đề & dạng động từ', level: 'B1', skill: 'structure', title: 'would rather và had better',
    formula: ['S + would rather + V', 'S + had better + V'],
    use: 'would rather: thích làm gì hơn. had better: nên làm (nếu không sẽ có hậu quả).',
    examples: [["I'd rather stay at home tonight.", 'Tối nay tôi thích ở nhà hơn.'], ['You had better leave now, or you will be late.', 'Bạn nên đi ngay, không thì sẽ muộn.']] },
  { id: 'although_despite', group: 'Mệnh đề & dạng động từ', level: 'B1', skill: 'structure', title: 'although và despite',
    formula: ['Although + mệnh đề', 'Despite / In spite of + N / V-ing'],
    use: 'Diễn tả sự tương phản giữa hai ý.',
    examples: [['Although it was raining, we went out.', 'Mặc dù trời mưa, chúng tôi vẫn ra ngoài.'], ['Despite the rain, we went out.', 'Bất chấp cơn mưa, chúng tôi vẫn ra ngoài.']] },
  { id: 'purpose', group: 'Mệnh đề & dạng động từ', level: 'B1', skill: 'structure', title: 'Chỉ mục đích',
    formula: ['to V', 'in order to V', 'so that + mệnh đề'],
    use: 'Nói lý do hoặc mục đích của một hành động.',
    examples: [['He left early in order to catch the bus.', 'Anh ấy đi sớm để kịp xe buýt.'], ['I study hard so that I can pass the exam.', 'Tôi học chăm để có thể đậu kỳ thi.']] },
  { id: 'correlative', group: 'Mệnh đề & dạng động từ', level: 'B2', skill: 'structure', title: 'Cặp liên từ',
    formula: ['both … and …', 'either … or …', 'neither … nor …', 'not only … but also …'],
    use: 'Nối hai thành phần cùng loại. Với neither … nor …, động từ chia theo chủ ngữ gần nhất.',
    examples: [['She speaks both English and French.', 'Cô ấy nói được cả tiếng Anh và tiếng Pháp.'], ['Neither my brother nor I like spicy food.', 'Cả anh tôi lẫn tôi đều không thích đồ cay.']] },
  { id: 'inversion', group: 'Mệnh đề & dạng động từ', level: 'C1', skill: 'structure', title: 'Đảo ngữ với trạng từ phủ định',
    formula: ['Never / Hardly / Not only + trợ động từ + S + V'],
    use: 'Nhấn mạnh ý, văn phong trang trọng.',
    examples: [['Never have I seen such a beautiful place.', 'Tôi chưa bao giờ thấy một nơi đẹp như vậy.'], ['Not only did he lose his job, but he also lost his house.', 'Anh ấy không chỉ mất việc mà còn mất cả nhà.']] }
]

const STRUCT_GROUPS = [...new Set(STRUCTURES.map((s) => s.group))]

const structStyles = {
  detail: { flex: 1, minWidth: 0, height: '100vh', overflowY: 'auto', padding: '28px 28px 48px', boxSizing: 'border-box', textAlign: 'left' },
  inner: { maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' },
  label: { fontSize: fs(12), fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' },
  formula: {
    padding: '14px 16px',
    borderRadius: '14px',
    background: 'var(--surface)',
    border: '1.5px solid var(--border-soft)',
    fontFamily: "Consolas, 'Courier New', monospace",
    fontSize: fs(15),
    lineHeight: 1.9,
    color: 'var(--accent-text)'
  },
  example: {
    padding: '10px 14px',
    borderRadius: '12px',
    background: 'var(--surface)',
    border: '1px solid var(--border-soft)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  practice: {
    padding: '16px 18px',
    borderRadius: '16px',
    background: 'var(--accent-soft)',
    border: '1.5px solid var(--border-soft)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  }
}

function StructureScreen({ profileId, profile, cefrLevel, speechVoice, onExit }) {
  const [selectedId, setSelectedId] = useState(STRUCTURES[0].id)
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState('library') // library | quiz
  const [quiz, setQuiz] = useState(null)
  const [count, setCount] = useState(5)
  const isEnglish = /anh|english/i.test(profile.targetLanguage || '')
  const speakLang = toSpeechLang(profile.targetLanguage)

  const q = search.trim().toLowerCase()
  const matches = (s) => !q || [s.title, s.use, ...s.formula, ...s.examples.flat()].join(' ').toLowerCase().includes(q)
  const groups = STRUCT_GROUPS.map((g) => ({ group: g, items: STRUCTURES.filter((s) => s.group === g && matches(s)) })).filter((g) => g.items.length > 0)
  const selected = STRUCTURES.find((s) => s.id === selectedId) || STRUCTURES[0]

  const startPractice = (list, label) => {
    setQuiz({
      label,
      structures: list.map((s) => ({ title: s.title, formula: s.formula.join(' / '), skill: s.skill })),
      count
    })
    setMode('quiz')
  }

  if (mode === 'quiz' && quiz) {
    return (
      <QuizScreen
        profileId={profileId}
        profile={profile}
        cefrLevel={cefrLevel}
        topic={{ type: 'random' }}
        label={quiz.label}
        count={quiz.count}
        loader={() =>
          window.api.generateStructureQuiz({
            profileId,
            targetLanguage: profile.targetLanguage,
            nativeLanguage: profile.nativeLanguage,
            cefrLevel,
            structures: quiz.structures,
            count: quiz.count
          })
        }
        onExit={() => setMode('library')}
      />
    )
  }

  const sameGroup = STRUCTURES.filter((s) => s.group === selected.group)

  return (
    <div style={exStyles.root}>
      <style>{explorerCss}</style>
      <style>{quizCss}</style>

      <aside style={{ ...exStyles.side, width: '290px' }}>
        <button className="qghost" style={{ ...quizStyles.ghost, alignSelf: 'flex-start', padding: '6px 10px' }} onClick={onExit}>
          <Icon name="back" size={16} /> Thoát
        </button>
        <div style={{ fontSize: fs(18), fontWeight: '700', color: 'var(--text-strong)', padding: '4px 10px 8px' }}>Cấu trúc câu</div>
        <div style={{ ...exStyles.searchBox, margin: '0 4px 6px' }}>
          <Icon name="search" size={14} />
          <input style={{ ...exStyles.searchInput, width: '100%' }} placeholder="Tìm cấu trúc..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {groups.length === 0 && (
            <div style={{ fontSize: fs(12), color: 'var(--text-muted)', padding: '8px 10px' }}>Không tìm thấy cấu trúc nào khớp.</div>
          )}
          {groups.map((g) => (
            <div key={g.group}>
              <div style={exStyles.sectionLabel}>{g.group}</div>
              {g.items.map((s) => (
                <div
                  key={s.id}
                  className="vf-row"
                  role="button"
                  style={{ ...exStyles.row, ...(s.id === selected.id ? exStyles.rowActive : {}) }}
                  onClick={() => setSelectedId(s.id)}
                >
                  <span style={exStyles.rowName}>{s.title}</span>
                  <span style={exStyles.count}>{s.level}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </aside>

      <main style={structStyles.detail}>
        <div style={structStyles.inner}>
          <div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={quizStyles.tag}>{selected.group}</span>
              <span style={{ ...quizStyles.tag, background: 'var(--surface-soft)', color: 'var(--text-soft)' }}>{selected.level}</span>
            </div>
            <h2 style={{ ...styles.question, textAlign: 'left', fontSize: fs(28) }}>{selected.title}</h2>
          </div>

          <div>
            <div style={structStyles.label}>Công thức</div>
            <div style={structStyles.formula}>
              {selected.formula.map((f, i) => (
                <div key={i}>{f}</div>
              ))}
            </div>
          </div>

          <div>
            <div style={structStyles.label}>Cách dùng</div>
            <div style={{ fontSize: fs(15), lineHeight: 1.7, color: 'var(--text)' }}>{selected.use}</div>
          </div>

          <div>
            <div style={structStyles.label}>Ví dụ</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selected.examples.map(([en, vi], i) => (
                <div key={i} style={structStyles.example}>
                  <button style={vocabStyles.cardSpeak} onClick={() => speakText(en, speakLang, undefined, speechVoice)} title="Nghe đọc">
                    <Icon name="speaker" size={14} />
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: fs(15), fontWeight: '600', color: 'var(--text-strong)' }}>{en}</div>
                    <div style={{ fontSize: fs(13), color: 'var(--text-muted)', marginTop: '2px' }}>{vi}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={structStyles.practice}>
            <div>
              <div style={{ fontSize: fs(15), fontWeight: '700', color: 'var(--text-strong)' }}>Luyện tập với AI</div>
              <div style={{ fontSize: fs(12), color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.5 }}>
                AI tạo câu hỏi trắc nghiệm về cấu trúc này theo trình độ {cefrLevel} và lĩnh vực của bạn, không lặp lại các câu đã làm.
              </div>
            </div>
            {!isEnglish && (
              <div style={{ fontSize: fs(12), color: 'var(--danger)' }}>Thư viện cấu trúc hiện viết cho tiếng Anh nên chưa thể luyện tập với ngôn ngữ bạn đang học.</div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <SegmentedControl
                value={count}
                onChange={setCount}
                options={[
                  { value: 5, label: '5 câu' },
                  { value: 10, label: '10 câu' }
                ]}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="qghost"
                  style={{ ...quizStyles.ghost, border: '1.5px solid var(--border)' }}
                  disabled={!isEnglish}
                  onClick={() => startPractice(shuffleArr(sameGroup).slice(0, 5), `Nhóm: ${selected.group}`)}
                >
                  Luyện cả nhóm
                </button>
                <button
                  className="qprimary"
                  style={{ ...quizStyles.primary, ...(!isEnglish ? { opacity: 0.5, cursor: 'not-allowed' } : {}) }}
                  disabled={!isEnglish}
                  onClick={() => startPractice([selected], `Cấu trúc: ${selected.title}`)}
                >
                  <Icon name="sparkle" size={15} /> Luyện cấu trúc này
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function HubRow({ icon, title, desc, badge, onClick }) {
  return (
    <button className="qrow" style={quizStyles.modeRow} onClick={onClick}>
      <span style={quizStyles.modeIcon}><Icon name={icon} size={16} /></span>
      <span style={hubStyles.text}>
        <span style={{ ...hubStyles.title, fontSize: fs(14) }}>{title}</span>
        <span style={hubStyles.desc}>{desc}</span>
      </span>
      {badge > 0 && <span style={styles.dueBadge}>{badge > 99 ? '99+' : badge}</span>}
    </button>
  )
}

function ReviewHub({ profileId, profile, cefrLevel, dueCount, mistakeCount, onRefresh, onExit }) {
  const [mode, setMode] = useState('hub') // hub | mistakes | setup | quiz | history | retry | cloze | spot | match
  const [quiz, setQuiz] = useState(null)
  const [retryQs, setRetryQs] = useState([])
  const back = () => setMode('hub')

  if (mode === 'mistakes') {
    return (
      <PracticeScreen
        profileId={profileId}
        profile={profile}
        cefrLevel={cefrLevel}
        onExit={() => {
          onRefresh()
          setMode('hub')
        }}
      />
    )
  }

  if (mode === 'setup') {
    return (
      <QuizSetup
        profile={profile}
        mistakeCount={mistakeCount}
        onBack={back}
        onStart={(cfg) => {
          setQuiz(cfg)
          setMode('quiz')
        }}
      />
    )
  }

  if (mode === 'quiz' && quiz) {
    if (quiz.adaptive) {
      return (
        <AdaptiveQuizScreen
          profileId={profileId}
          profile={profile}
          cefrLevel={cefrLevel}
          count={quiz.count}
          onExit={() => setMode('setup')}
        />
      )
    }
    return (
      <QuizScreen
        profileId={profileId}
        profile={profile}
        cefrLevel={cefrLevel}
        topic={quiz.topic}
        label={quiz.label}
        count={quiz.count}
        onExit={() => setMode('setup')}
      />
    )
  }

  if (mode === 'history') {
    return (
      <QuizHistory
        profileId={profileId}
        onBack={back}
        onRetry={(qs) => {
          setRetryQs(qs)
          setMode('retry')
        }}
      />
    )
  }

  if (mode === 'retry') {
    return (
      <QuizScreen
        profileId={profileId}
        profile={profile}
        cefrLevel={cefrLevel}
        topic={{ type: 'random' }}
        label="Làm lại câu sai"
        count={retryQs.length}
        preset={retryQs}
        onExit={() => setMode('history')}
      />
    )
  }

  if (mode === 'cloze') return <ClozeGame profileId={profileId} profile={profile} cefrLevel={cefrLevel} onExit={back} />
  if (mode === 'spot') return <SpotGame profileId={profileId} profile={profile} cefrLevel={cefrLevel} onExit={back} />
  if (mode === 'match') return <MatchGame profileId={profileId} profile={profile} cefrLevel={cefrLevel} onExit={back} />

  return (
    <StepCard title="Ôn tập" subtitle="Chọn cách bạn muốn luyện hôm nay.">
      <style>{quizCss}</style>

      <div>
        <div style={onboardStyles.fieldLabel}>Ôn tập</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <HubRow
            icon="repeat"
            title="Ôn lỗi cũ"
            desc="AI đưa lại lỗi bạn từng mắc theo lịch giãn cách"
            badge={dueCount}
            onClick={() => setMode('mistakes')}
          />
          <HubRow
            icon="check"
            title="Bài tập trắc nghiệm"
            desc="AI tạo câu hỏi theo chủ đề, hoặc luyện điểm yếu của bạn"
            onClick={() => setMode('setup')}
          />
          <HubRow
            icon="book"
            title="Xem lại bài đã làm"
            desc="Xem từng câu, đáp án và giải thích của các bài trước"
            onClick={() => setMode('history')}
          />
        </div>
      </div>

      <div>
        <div style={onboardStyles.fieldLabel}>Trò chơi</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <HubRow icon="edit" title="Điền từ vào câu" desc="Từ của bạn hoặc từ mới do AI tạo" onClick={() => setMode('cloze')} />
          <HubRow icon="warning" title="Tìm câu sai" desc="Lỗi của bạn hoặc câu mới do AI tạo" onClick={() => setMode('spot')} />
          <HubRow icon="clock" title="Ghép từ 60 giây" desc="Từ của bạn hoặc từ mới do AI tạo, càng liên tiếp càng nhiều điểm" onClick={() => setMode('match')} />
        </div>
      </div>

      <div style={onboardStyles.actions}>
        <button style={{ ...styles.backButton, display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={onExit}>
          <Icon name="back" size={16} /> Quay lại luyện tập
        </button>
      </div>
    </StepCard>
  )
}

const progressStyles = {
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', width: '100%' },
  stat: {
    padding: '12px 14px',
    borderRadius: '14px',
    background: 'var(--surface)',
    border: '1.5px solid var(--border-soft)',
    textAlign: 'left'
  },
  statNum: { fontSize: fs(24), fontWeight: '700', color: 'var(--text-strong)', lineHeight: 1.2 },
  statLabel: { fontSize: fs(12), color: 'var(--text-muted)', marginTop: '2px' },
  card: {
    width: '100%',
    padding: '16px 18px',
    borderRadius: '16px',
    background: 'var(--surface)',
    border: '1.5px solid var(--border-soft)',
    boxShadow: 'var(--shadow)',
    boxSizing: 'border-box',
    textAlign: 'left'
  },
  cardTitle: { fontSize: fs(14), fontWeight: '700', color: 'var(--text-strong)' },
  cardSub: { fontSize: fs(12), color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.5 },
  bars: { display: 'flex', alignItems: 'flex-end', gap: '6px', marginTop: '12px' },
  col: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: 0 },
  val: { fontSize: fs(11), color: 'var(--text-soft)', fontWeight: '600' },
   barArea: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderBottom: '1px solid var(--border)'
  },
  valTop: {
    fontSize: fs(11),
    fontWeight: '600',
    color: 'var(--text-soft)',
    lineHeight: 1,
    marginBottom: '3px'
  },
  bar: { width: '100%', maxWidth: '34px', borderRadius: '6px 6px 0 0', background: 'var(--accent)', opacity: 0.5 },
  barLast: { opacity: 1 },
  lab: { fontSize: fs(11), color: 'var(--text-muted)' },
  emptyDot: { width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border)', marginBottom: '-2px' },
  zeroDot: { width: '8px', height: '8px', borderRadius: '50%', background: '#27ae60', marginBottom: '-4px' },
  barLow: {
    background: 'var(--accent-soft)',
    border: '1.5px dashed var(--accent)',
    borderBottom: 'none',
    opacity: 0.9
  },
  catRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    padding: '8px 0',
    borderBottom: '1px solid var(--border-soft)',
    fontSize: fs(13)
  }
}

const weekLabel = (w) => `${w.start.slice(8, 10)}/${w.start.slice(5, 7)}`

function BarChart({ data, height = 100, labelEvery = 1, showValues = true }) {
  const max = Math.max(1, ...data.map((d) => d.value ?? 0))
  const n = data.length
  return (
    <div style={progressStyles.bars}>
      {data.map((d, i) => {
        const has = d.value !== null && d.value !== undefined
        const isZero = has && d.value === 0
        const h = has && !isZero ? Math.max(6, (d.value / max) * height) : 0
        const isLast = i === n - 1
        const showLabel = (n - 1 - i) % labelEvery === 0
        return (
          <div key={i} style={progressStyles.col} title={d.tip || ''}>
            <div style={{ ...progressStyles.barArea, height: `${height + 16}px` }}>
              {showValues && has && <div style={progressStyles.valTop}>{d.value}</div>}
              {!has && <div style={progressStyles.emptyDot} />}
              {isZero && <div style={progressStyles.zeroDot} />}
              {has && !isZero && (
                <div
                  style={{
                    ...progressStyles.bar,
                    height: `${h}px`,
                    ...(d.low ? progressStyles.barLow : isLast ? progressStyles.barLast : {})
                  }}
                />
              )}
            </div>
            <div style={{ ...progressStyles.lab, whiteSpace: 'nowrap', visibility: showLabel ? 'visible' : 'hidden' }}>
              {d.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const masteryColor = (m) => (m === null ? 'var(--border)' : m >= 70 ? '#27ae60' : m >= 40 ? '#e0a100' : 'var(--danger)')

function SkillRadar({ skills }) {
  const cx = 170
  const cy = 145
  const R = 88
  const n = skills.length
  const pt = (i, v) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n
    return [cx + R * v * Math.cos(a), cy + R * v * Math.sin(a)]
  }
  const poly = (fn) => skills.map((s, i) => pt(i, fn(s)).join(',')).join(' ')

  return (
    <svg viewBox="0 0 340 290" width="100%" style={{ maxWidth: '340px', display: 'block', margin: '0 auto' }}>
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <polygon key={r} points={poly(() => r)} style={{ fill: 'none', stroke: 'var(--border)', strokeWidth: 1 }} />
      ))}
      {skills.map((s, i) => {
        const [x, y] = pt(i, 1)
        return <line key={s.id} x1={cx} y1={cy} x2={x} y2={y} style={{ stroke: 'var(--border-soft)', strokeWidth: 1 }} />
      })}
      <polygon
        points={poly((s) => (s.mastery ?? 0) / 100)}
        style={{ fill: 'var(--accent)', fillOpacity: 0.25, stroke: 'var(--accent)', strokeWidth: 2 }}
      />
      {skills.map((s, i) => {
        const [x, y] = pt(i, (s.mastery ?? 0) / 100)
        return (
          <circle
            key={s.id}
            cx={x}
            cy={y}
            r={3.5}
            style={s.mastery === null ? { fill: 'var(--surface)', stroke: 'var(--border)', strokeWidth: 1.5 } : { fill: 'var(--accent)' }}
          />
        )
      })}
      {skills.map((s, i) => {
        const [lx, ly] = pt(i, 1.25)
        const anchor = Math.abs(lx - cx) < 8 ? 'middle' : lx > cx ? 'start' : 'end'
        return (
          <text
            key={s.id}
            x={lx}
            y={ly}
            textAnchor={anchor}
            dominantBaseline="middle"
            style={{ fontSize: 11, fill: s.mastery === null ? 'var(--text-muted)' : 'var(--text-soft)', fontWeight: 600 }}
          >
            {s.short}
            {s.mastery !== null ? ` ${s.mastery}` : ''}
          </text>
        )
      })}
    </svg>
  )
}

function SkillMap({ skills, focuses = [] }) {
  const [expandedSkill, setExpandedSkill] = useState(null)
  const has = skills.some((s) => s.mastery !== null || s.chatErrors > 0) || focuses.length > 0
  if (!has) {
    return (
      <div style={{ ...progressStyles.cardSub, marginTop: '10px' }}>
        Chưa có dữ liệu. Làm bài tập hoặc trò chuyện bằng tiếng Anh để bắt đầu ghi nhận các chủ điểm.
      </div>
    )
  }
  const sorted = [...skills].sort((a, b) => (a.mastery ?? 101) - (b.mastery ?? 101) || b.chatErrors - a.chatErrors)
  return (
    <>
      <div style={{ marginTop: '10px' }}>
        <SkillRadar skills={skills} />
      </div>
      <div style={{ marginTop: '8px' }}>
        {sorted.map((s) => {
          const expanded = expandedSkill === s.id
          const topicResults = focuses.filter((item) => item.skill === s.id)
          return (
            <div key={s.id} style={{ padding: '4px 0', borderBottom: '1px solid var(--border-soft)' }}>
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setExpandedSkill(expanded ? null : s.id)}
                style={{
                  width: '100%',
                  padding: '7px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  border: 0,
                  background: 'transparent',
                  color: 'var(--text)',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <span style={{ width: '100%', display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: fs(13) }}>
                  <span style={{ fontWeight: '600' }}>{s.label}</span>
                  <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                    {s.mastery === null ? 'Chưa đủ dữ liệu' : `${s.mastery}/100 · ${s.correct}/${s.total} đúng`}
                    <span aria-hidden="true" style={{ marginLeft: '8px' }}>{expanded ? '⌃' : '⌄'}</span>
                  </span>
                </span>
                <span style={{ width: '100%', height: '6px', borderRadius: '999px', background: 'var(--border-soft)', marginTop: '4px', overflow: 'hidden' }}>
                  <span style={{ display: 'block', width: `${s.mastery ?? 0}%`, height: '100%', background: masteryColor(s.mastery), borderRadius: '999px' }} />
                </span>
              </button>
              {s.chatErrors > 0 && (
                <div style={{ fontSize: fs(11), color: 'var(--text-muted)', margin: '0 0 5px' }}>
                  {s.chatErrors} lỗi trong chat (30 ngày gần đây)
                </div>
              )}
              {expanded && (
                <div style={{ padding: '4px 10px 8px', borderLeft: '2px solid var(--border)', margin: '2px 0 8px 2px' }}>
                  {topicResults.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: fs(12) }}>
                      Chưa có dữ liệu theo chủ điểm. Kết quả bài tập và lỗi được nhận diện trong chat sẽ hiện ở đây.
                    </div>
                  ) : topicResults.map((item) => {
                    const status = item.total < 3 && item.chatErrors >= 3
                      ? 'Lỗi lặp lại trong chat · cần bài tập xác nhận'
                      : item.total < 3 && item.chatErrors > 0
                        ? 'Có lỗi trong chat · chưa đủ bài tập xác nhận'
                        : item.total < 3
                          ? 'Chưa đủ lượt đánh giá'
                          : item.needsPractice
                        ? 'Cần luyện thêm'
                        : item.accuracy >= 80
                          ? 'Đang vững'
                          : 'Đang cải thiện'
                    const statusColor = item.total < 3 && item.chatErrors >= 3
                      ? '#e9aa5f'
                      : item.total < 3
                      ? 'var(--text-muted)'
                      : item.needsPractice
                        ? '#e9aa5f'
                        : item.accuracy >= 80
                          ? '#70c99a'
                          : 'var(--text-soft)'
                    return (
                      <div key={`${item.skill}-${item.focus}`} style={{ padding: '7px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: 'var(--text-strong)', fontSize: fs(13), fontWeight: '600' }}>{item.focus}</div>
                          <div style={{ color: statusColor, fontSize: fs(11), marginTop: '2px' }}>{status}</div>
                        </div>
                        <div style={{ flexShrink: 0, color: 'var(--text-soft)', fontSize: fs(12), textAlign: 'right' }}>
                          {item.total > 0 ? `${item.correct}/${item.total} đúng` : 'Chưa có bài tập'}
                          {item.total >= 3 && <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>{item.accuracy}%</div>}
                          {item.chatErrors > 0 && <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>{item.chatErrors} lỗi chat</div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

function ProgressScreen({ profileId, profile, onExit, onStartAssessment, onStartFocusedPractice }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [insight, setInsight] = useState('')
  const [insightBusy, setInsightBusy] = useState(false)
  const [insightErr, setInsightErr] = useState('')
  const [showAssessmentHistory, setShowAssessmentHistory] = useState(false)

  useEffect(() => {
    window.api.getProgress({ profileId }).then((res) => {
      setData(res.success ? res : null)
      setLoading(false)
    })
  }, [])

  const askInsight = async () => {
    setInsightBusy(true)
    setInsightErr('')
    const res = await window.api.getProgressInsight({ profileId, nativeLanguage: profile.nativeLanguage })
    setInsightBusy(false)
    if (res.success) setInsight(res.text)
    else setInsightErr('Chưa tạo được nhận xét lúc này (AI có thể đang bận). Bạn thử lại nhé.')
  }

  const wrap = (children) => (
    <div style={{ ...styles.container, justifyContent: 'flex-start', overflowY: 'auto', paddingTop: '32px' }} className="fade-in">
      <style>{fadeStyle}</style>
      <style>{quizCss}</style>
      {children}
    </div>
  )

  if (loading) return wrap(<p>Đang tính số liệu...</p>)

  if (!data || (data.totals.messages === 0 && !(data.exerciseFocuses || []).length && !(data.assessments || []).length)) {
    return wrap(
      <>
        <h2 style={styles.question}>Tiến bộ của bạn</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '380px', margin: 0 }}>
          Chưa có dữ liệu học tập. Bạn có thể làm bài đánh giá tổng quát để bắt đầu theo dõi.
        </p>
        <button className="qprimary" style={quizStyles.primary} onClick={() => onStartAssessment(null)}>Làm bài đánh giá tổng quát</button>
        <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: 0, fontSize: fs(12) }}>15 câu từ dễ đến khó. Điểm chỉ là thang tham khảo nội bộ, không phải chứng chỉ CEFR; bài chưa đánh giá nghe/nói.</p>
        <button className="qprimary" style={quizStyles.primary} onClick={onExit}>Quay lại</button>
      </>
    )
  }

  const { weeks, categories, totals, levels } = data
  const assessments = data.assessments || []
  const wl = (w) => `${w.start.slice(8, 10)}/${w.start.slice(5, 7)}`
  const sourceLabel = (s) => (s === 'placement' ? 'bài đánh giá' : 'tự chọn')

  return wrap(
    <>
      <div>
        <h2 style={styles.question}>Tiến bộ của bạn</h2>
        <p style={{ margin: '6px 0 0', fontSize: fs(13), color: 'var(--text-muted)' }}>Tính theo tuần, bắt đầu từ thứ Hai</p>
      </div>

      {/* Lưới bốn thẻ số */}
      <div style={{ ...progressStyles.stats, maxWidth: '640px' }}>
        <div style={progressStyles.stat}>
          <div style={progressStyles.statNum}>{totals.messages}</div>
          <div style={progressStyles.statLabel}>tin nhắn đã gửi</div>
        </div>
        <div style={progressStyles.stat}>
          <div style={progressStyles.statNum}>{totals.streak}</div>
          <div style={progressStyles.statLabel}>ngày liên tiếp · học {totals.activeDays30}/30 ngày</div>
        </div>
        <div style={progressStyles.stat}>
          <div style={progressStyles.statNum}>{totals.words}</div>
          <div style={progressStyles.statLabel}>từ vựng đã lưu</div>
        </div>
        <div style={progressStyles.stat}>
          <div style={progressStyles.statNum}>{totals.mastered}/{totals.mistakes}</div>
          <div style={progressStyles.statLabel}>lỗi đã nhớ vững (ôn đúng từ 7 ngày)</div>
        </div>
      </div>

      <div style={{ ...progressStyles.card, maxWidth: '640px', padding: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <div style={progressStyles.cardTitle}>Bài đánh giá tổng quát</div>
            <div style={progressStyles.cardSub}>15 câu · cùng ma trận · từ dễ đến khó</div>
          </div>
          <button className="qprimary" style={{ ...quizStyles.primary, whiteSpace: 'nowrap', padding: '8px 13px', fontSize: fs(12), minHeight: 'unset' }} onClick={() => onStartAssessment(assessments[0] || null)}>
            {assessments.length ? 'Làm lại bài đánh giá' : 'Bắt đầu đánh giá'}
          </button>
        </div>

        {assessments.length === 0 ? (
          <div style={{ marginTop: '14px', padding: '12px 14px', borderRadius: '12px', background: 'var(--surface-soft)', color: 'var(--text-muted)', fontSize: fs(13) }}>
            Lần đầu làm bài sẽ tạo mốc ban đầu để theo dõi tiến bộ.
          </div>
        ) : (() => {
          const latest = assessments[0]
          const previous = assessments[1]
          const pct = Math.round(latest.correct / latest.total * 100)
          const change = previous ? pct - Math.round(previous.correct / previous.total * 100) : null
          const signals = [...(latest.signals || [])].sort((a, b) => {
            const priority = { practice: 0, limited: 1, monitor: 2 }
            return priority[a.status] - priority[b.status] || a.correct / a.total - b.correct / b.total
          })
          const practiceSignals = signals.filter((signal) => signal.status === 'practice')
          const weakest = practiceSignals[0]

          return <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '14px', padding: '12px 14px', borderRadius: '12px', background: 'var(--surface-soft)' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: fs(11), fontWeight: '600' }}>LẦN GẦN NHẤT · {latest.at?.slice(0, 10)}</div>
                {change !== null && <div style={{ color: change > 0 ? '#27ae60' : change < 0 ? 'var(--danger)' : 'var(--text-muted)', fontSize: fs(12), marginTop: '3px' }}>
                  {change > 0 ? `Tăng ${change}` : change < 0 ? `Giảm ${Math.abs(change)}` : 'Không đổi'} điểm phần trăm so với lần trước
                </div>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <strong style={{ display: 'block', color: scoreColor(latest.correct, latest.total), fontSize: fs(20) }}>{latest.correct}/{latest.total}</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: fs(12) }}>{pct}%</span>
              </div>
            </div>

            {signals.length > 0 && <div style={{ display: 'flex', flexDirection: 'column', marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                <div style={progressStyles.cardTitle}>Gợi ý luyện tập</div>
                <div style={{ color: 'var(--text-muted)', fontSize: fs(11) }}>Từ lần đánh giá gần nhất</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '7px' }}>
                {signals.map((signal) => {
                  const tone = signal.status === 'practice' ? 'var(--danger)' : 'var(--text-muted)'
                  const status = signal.status === 'practice' ? 'Cần củng cố' : signal.status === 'limited' ? 'Cần thêm dữ liệu' : 'Đang theo dõi'
                  return <div key={signal.skill} style={{ minWidth: 0, padding: '9px 11px', borderRadius: '10px', border: '1px solid var(--border-soft)', background: 'var(--surface)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: fs(12) }} title={signal.label}>{signal.label}</strong>
                      <span style={{ color: tone, fontSize: fs(11), whiteSpace: 'nowrap' }}>{signal.correct}/{signal.total}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: '4px', fontSize: fs(11) }}>
                      <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)' }} title={signal.focus}>{signal.focus}</span>
                      <span style={{ color: tone, flexShrink: 0 }}>{status}</span>
                    </div>
                  </div>
                })}
              </div>
              {weakest && <button className="qprimary" style={{ ...quizStyles.primary, display: 'flex', width: 'fit-content', alignSelf: 'flex-end', marginTop: '10px', padding: '8px 13px', fontSize: fs(12), minHeight: 'unset' }} onClick={() => onStartFocusedPractice?.(weakest.skill, weakest.focus)}>
                Luyện chủ điểm cần củng cố
              </button>}
            </div>}

            {assessments.length > 1 && <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-soft)', paddingTop: '8px' }}>
              <button className="qghost" style={{ ...quizStyles.ghost, padding: '5px 0', fontSize: fs(12) }} onClick={() => setShowAssessmentHistory((value) => !value)}>
                {showAssessmentHistory ? 'Ẩn lịch sử' : `Lịch sử ${assessments.length - 1} lần trước`}
              </button>
              {showAssessmentHistory && assessments.slice(1).map((attempt) => <div key={attempt.id} style={{ ...progressStyles.catRow, fontSize: fs(12) }}>
                <span>{attempt.at?.slice(0, 10)}</span>
                <span style={{ color: scoreColor(attempt.correct, attempt.total) }}>{attempt.correct}/{attempt.total} · {Math.round(attempt.correct / attempt.total * 100)}%</span>
              </div>)}
            </div>}
          </>
        })()}
        <div style={{ color: 'var(--text-muted)', fontSize: fs(11), marginTop: '12px' }}>Thang tham khảo nội bộ · không phải chứng chỉ CEFR · chưa đánh giá nghe/nói</div>
      </div>
     

      
      <div style={{ ...progressStyles.card, maxWidth: '640px' }}>
        <div style={progressStyles.cardTitle}>Bản đồ kỹ năng</div>
        <div style={progressStyles.cardSub}>
          Điểm làm chủ chỉ tính kết quả bài tập và ôn lỗi (tối đa 20 lượt mỗi kỹ năng). Lỗi nhận diện trong chat được hiển thị riêng như tín hiệu cần kiểm tra, không tự tính thành câu sai trong bài tập.
        </div>
        <SkillMap skills={data.skills || []} focuses={data.exerciseFocuses || []} />
      </div>

      <div style={{ ...progressStyles.card, maxWidth: '640px' }}>
        <div style={progressStyles.cardTitle}>Số tin nhắn mỗi tuần</div>
        <BarChart data={weeks.map((w) => ({ label: weekLabel(w), value: w.messages > 0 ? w.messages : null }))} />
      </div>

      <div style={{ ...progressStyles.card, maxWidth: '640px' }}>
        <div style={progressStyles.cardTitle}>Loại lỗi hay gặp</div>
        <div style={progressStyles.cardSub}>4 tuần gần đây so với 4 tuần trước đó</div>
        <div style={{ marginTop: '8px' }}>
          {categories.length === 0 && <div style={{ fontSize: fs(13), color: 'var(--text-muted)' }}>Chưa có dữ liệu loại lỗi.</div>}
          {categories.map((c) => {
            const diff = c.recent - c.previous
            const badge =
              c.previous === 0
                ? { text: 'Mới', color: 'var(--text-muted)' }
                : diff < 0
                  ? { text: 'Giảm', color: '#27ae60' }
                  : diff > 0
                    ? { text: 'Tăng', color: 'var(--danger)' }
                    : { text: 'Giữ nguyên', color: 'var(--text-muted)' }
            return (
              <div key={c.category} style={progressStyles.catRow}>
                <span style={{ flex: 1, minWidth: 0 }}>{c.category}</span>
                <span style={{ color: 'var(--text-muted)' }}>{c.previous} → {c.recent}</span>
                <span style={{ width: '78px', textAlign: 'right', fontWeight: '700', color: badge.color }}>{badge.text}</span>
              </div>
            )
          })}
        </div>
      </div>

      {levels.length > 0 && (
        <div style={{ ...progressStyles.card, maxWidth: '640px' }}>
          <div style={progressStyles.cardTitle}>Lịch sử trình độ</div>
          <div style={{ marginTop: '8px' }}>
            {levels.map((l, i) => (
              <div key={i} style={progressStyles.catRow}>
                <span>{l.old_level ? `${l.old_level} → ${l.new_level}` : `Bắt đầu ở ${l.new_level}`}</span>
                <span style={{ color: 'var(--text-muted)' }}>{l.day} · {sourceLabel(l.source)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ ...progressStyles.card, maxWidth: '640px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
          <div style={progressStyles.cardTitle}>Nhận xét của AI</div>
          <button
            className="qprimary"
            style={{ ...quizStyles.primary, padding: '8px 16px', fontSize: fs(13), ...(insightBusy ? { opacity: 0.5, cursor: 'not-allowed' } : {}) }}
            onClick={askInsight}
            disabled={insightBusy}
          >
            <Icon name="sparkle" size={14} /> {insightBusy ? 'Đang viết...' : insight ? 'Viết lại' : 'Nhờ AI nhận xét'}
          </button>
        </div>
        {insight && <div style={{ marginTop: '10px', fontSize: fs(14), lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{insight}</div>}
        {insightErr && <div style={{ marginTop: '10px', fontSize: fs(13), color: 'var(--danger)' }}>{insightErr}</div>}
        {!insight && !insightErr && (
          <div style={progressStyles.cardSub}>AI sẽ đọc các số liệu ở trên và viết vài câu nhận xét kèm một gợi ý cho tuần tới.</div>
        )}
      </div>

      <button className="qghost" style={{ ...quizStyles.ghost, marginBottom: '16px' }} onClick={onExit}>
        <Icon name="back" size={16} /> Quay lại
      </button>
    </>
  )
}

function ProgressPanel({ profileId, profile, refreshKey, onOpenFull }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [insight, setInsight] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    let cancelled = false
    window.api.getProgress({ profileId }).then((res) => {
      if (cancelled) return
      setData(res.success ? res : null)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [profileId, refreshKey])

  const askInsight = async () => {
    setBusy(true)
    setErr('')
    const res = await window.api.getProgressInsight({ profileId, nativeLanguage: profile.nativeLanguage })
    setBusy(false)
    if (res.success) setInsight(res.text)
    else setErr('Chưa tạo được nhận xét (AI có thể đang bận).')
  }

  if (loading) return <div style={{ fontSize: fs(13), color: 'var(--text-muted)' }}>Đang tính số liệu...</div>

  if (!data || data.totals.messages === 0) {
    return (
      <div style={{ ...styles.statCard, fontSize: fs(13), color: 'var(--text-muted)' }}>
        Chưa có đủ dữ liệu. Hãy trò chuyện vài ngày, số liệu tiến bộ sẽ xuất hiện ở đây.
      </div>
    )
  }

  const { weeks, categories, totals } = data
  const wl = (w) => `${w.start.slice(8, 10)}/${w.start.slice(5, 7)}`
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div className="stat-card" style={styles.statCard}>
          <div style={{ fontSize: fs(22), fontWeight: '700', color: 'var(--text-strong)' }}>{totals.messages}</div>
          <div style={{ fontSize: fs(11), color: 'var(--text-muted)' }}>tin nhắn đã gửi</div>
        </div>
        <div className="stat-card" style={styles.statCard}>
          <div style={{ fontSize: fs(22), fontWeight: '700', color: 'var(--text-strong)' }}>
            {totals.mastered}/{totals.mistakes}
          </div>
          <div style={{ fontSize: fs(11), color: 'var(--text-muted)' }}>lỗi đã nhớ vững</div>
        </div>
      </div>

      {/* Thẻ mới: Kỹ năng cần luyện */}
      {(() => {
        const sk = data.skills || []
        const scored = sk.filter((s) => s.mastery !== null).sort((a, b) => a.mastery - b.mastery).slice(0, 3)
        const chatOnly = sk.filter((s) => s.chatErrors > 0).sort((a, b) => b.chatErrors - a.chatErrors).slice(0, 3)
        const list = scored.length > 0 ? scored : chatOnly
        return (
          <div className="stat-card" style={styles.statCard}>
            <div style={{ fontSize: fs(13), fontWeight: '700' }}>Kỹ năng cần luyện</div>
            <div style={{ fontSize: fs(11), color: 'var(--text-muted)', margin: '2px 0 8px' }}>
              {scored.length > 0 ? 'Điểm thấp nhất từ quiz và ôn lỗi' : 'Dựa trên lỗi trong chat (chưa có điểm quiz)'}
            </div>
            {list.length === 0 && (
              <div style={{ fontSize: fs(12), color: 'var(--text-muted)' }}>Làm vài bài trắc nghiệm để có dữ liệu.</div>
            )}
            {list.map((s) => (
              <div key={s.id} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: fs(12) }}>
                  <span>{s.label}</span>
                  <strong>{s.mastery !== null ? s.mastery : `${s.chatErrors} lỗi`}</strong>
                </div>
                <div style={{ height: '5px', borderRadius: '999px', background: 'var(--border-soft)', marginTop: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${s.mastery ?? 0}%`, height: '100%', background: masteryColor(s.mastery), borderRadius: '999px' }} />
                </div>
              </div>
            ))}
          </div>
        )
      })()}

      <div className="stat-card" style={styles.statCard}>
        <div style={{ fontSize: fs(13), fontWeight: '700', marginBottom: '4px' }}>Loại lỗi hay gặp</div>
        <div style={{ fontSize: fs(11), color: 'var(--text-muted)', marginBottom: '6px' }}>4 tuần gần đây so với trước đó</div>
        {categories.length === 0 && <div style={{ fontSize: fs(12), color: 'var(--text-muted)' }}>Chưa có dữ liệu</div>}
        {categories.slice(0, 3).map((c) => {
          const diff = c.recent - c.previous
          const badge =
            c.previous === 0
              ? { text: 'Mới', color: 'var(--text-muted)' }
              : diff < 0
                ? { text: 'Giảm', color: '#27ae60' }
                : diff > 0
                  ? { text: 'Tăng', color: 'var(--danger)' }
                  : { text: 'Giữ', color: 'var(--text-muted)' }
          return (
            <div key={c.category} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: fs(12), marginBottom: '4px' }}>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.category}</span>
              <span style={{ color: 'var(--text-muted)' }}>{c.previous}→{c.recent}</span>
              <strong style={{ color: badge.color, minWidth: '34px', textAlign: 'right' }}>{badge.text}</strong>
            </div>
          )
        })}
      </div>

      <div className="stat-card" style={styles.statCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: fs(13), fontWeight: '700' }}>Nhận xét của AI</div>
          <button
            style={{ ...notesStyles.smallAction, ...(busy ? { opacity: 0.5, cursor: 'not-allowed' } : {}) }}
            onClick={askInsight}
            disabled={busy}
          >
            <Icon name="sparkle" size={12} /> {busy ? 'Đang viết...' : insight ? 'Viết lại' : 'Nhờ AI'}
          </button>
        </div>
        {insight && <div style={{ marginTop: '8px', fontSize: fs(12), lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{insight}</div>}
        {err && <div style={{ marginTop: '8px', fontSize: fs(12), color: 'var(--danger)' }}>{err}</div>}
      </div>

      <button
        style={{ ...notesStyles.smallAction, alignSelf: 'center', marginTop: '2px' }}
        onClick={onOpenFull}
      >
        Xem đầy đủ <Icon name="next" size={12} />
      </button>
    </>
  )
}


function AddWordBox({ profileId, profile, cefrLevel, folderId, onAdded }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const submit = async () => {
    if (!text.trim() || busy) return
    setBusy(true)
    setMsg('')
    const res = await window.api.addVocabularyWords({
      profileId,
      words: text,
      targetLanguage: profile.targetLanguage,
      nativeLanguage: profile.nativeLanguage,
      cefrLevel,
      folderId: folderId || null
    })
    setBusy(false)
    if (!res.success) {
      setMsg('Không thêm được lúc này (có thể AI đang quá tải). Bạn thử lại nhé.')
      return
    }
    const parts = []
    if (res.added.length) parts.push(`Đã thêm: ${res.added.join(', ')}`)
    if (res.skipped.length) parts.push(`Đã có sẵn: ${res.skipped.join(', ')}`)
    setMsg(parts.join(' · ') || 'Không có từ nào được thêm.')
    if (res.added.length) {
      setText('')
      onAdded && onAdded()
    }
  }

    return (
    <div style={{ width: '100%', maxWidth: '520px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          style={{ ...styles.input, width: '100%', textAlign: 'left' }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={busy ? 'Đang nhờ AI điền nghĩa...' : 'Thêm từ mới (cách nhau bằng dấu phẩy)'}
          disabled={busy}
        />
        <button
          style={{
            ...styles.sendButton,
            ...(busy || !text.trim() ? { opacity: 0.4, cursor: 'not-allowed' } : {})
          }}
          onClick={submit}
          disabled={busy || !text.trim()}
          title="Thêm từ"
          aria-label="Thêm từ"
        >
          <Icon name="plus" size={20} />
        </button>
      </div>
      {msg && <p style={{ margin: '8px 0 0', fontSize: fs(13), color: 'var(--text-muted)', textAlign: 'center' }}>{msg}</p>}
    </div>
  )
}

const shuffleArr = (a) => {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}

const explorerCss = `
  .vf-row { transition: background 120ms ease, border-color 120ms ease; }
  .vf-row:hover { background: var(--surface-soft); }
  .vf-row .vf-actions { display: none; gap: 2px; }
  .vf-row:hover .vf-actions { display: flex; }
  .vf-card { transition: border-color 120ms ease, background 120ms ease; }
  .vf-card:hover { border-color: var(--accent); }
`

const exStyles = {
  root: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    background: 'var(--bg)',
    color: 'var(--text)',
    fontFamily: "'Segoe UI', sans-serif",
    fontSize: fs(16),
    boxSizing: 'border-box'
  },
  side: {
    width: '250px',
    flexShrink: 0,
    height: '100vh',
    padding: '14px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    background: 'var(--panel)',
    borderRight: '1px solid var(--border-soft)',
    boxSizing: 'border-box'
  },
  sectionLabel: {
    fontSize: fs(11),
    fontWeight: '700',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    padding: '10px 10px 4px'
  },
  row: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 10px',
    borderRadius: '10px',
    border: '1.5px solid transparent',
    background: 'transparent',
    color: 'var(--text)',
    cursor: 'pointer',
    fontSize: fs(14),
    textAlign: 'left',
    boxSizing: 'border-box'
  },
  rowActive: { background: 'var(--accent-soft)', color: 'var(--accent-text)', fontWeight: '600' },
  rowDrop: { border: '1.5px solid var(--accent)', background: 'var(--accent-soft)' },
  rowName: { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  count: { fontSize: fs(11), color: 'var(--text-muted)' },
  iconBtn: { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex' },
  renameInput: {
    flex: 1,
    minWidth: 0,
    padding: '3px 6px',
    borderRadius: '6px',
    border: '1.5px solid var(--accent)',
    background: 'var(--surface)',
    color: 'var(--text)',
    fontSize: fs(13),
    outline: 'none'
  },
  main: { flex: 1, minWidth: 0, height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', boxSizing: 'border-box' },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    padding: '16px 72px 12px 20px',
    borderBottom: '1px solid var(--border-soft)'
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 12px',
    borderRadius: '999px',
    border: '1.5px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-muted)',
    minWidth: '160px'
  },
  searchInput: { border: 'none', outline: 'none', background: 'transparent', color: 'var(--text)', fontSize: fs(13), width: '140px' },
  selBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    padding: '8px 72px 8px 20px',
    background: 'var(--accent-soft)',
    borderBottom: '1px solid var(--border-soft)',
    fontSize: fs(13)
  },
  grid: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 20px 28px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
    gridAutoRows: 'min-content',
    alignContent: 'start',
    gap: '12px'
  },
  card: {
    padding: '12px 14px',
    borderRadius: '14px',
    border: '1.5px solid var(--border-soft)',
    background: 'var(--surface)',
    cursor: 'pointer',
    userSelect: 'none',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minHeight: '92px',
    boxSizing: 'border-box'
  },
  cardSel: { border: '1.5px solid var(--accent)', background: 'var(--accent-soft)' },
  cardWord: { fontSize: fs(16), fontWeight: '700', color: 'var(--text-strong)', wordBreak: 'break-word' },
  cardMeaning: {
    fontSize: fs(12),
    color: 'var(--text-muted)',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  tag: {
    alignSelf: 'flex-start',
    marginTop: 'auto',
    padding: '2px 8px',
    borderRadius: '999px',
    background: 'var(--surface-soft)',
    border: '1px solid var(--border-soft)',
    fontSize: fs(10),
    color: 'var(--text-soft)'
  },
  toast: {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '10px 16px',
    borderRadius: '12px',
    background: 'var(--surface)',
    border: '1.5px solid var(--border)',
    boxShadow: 'var(--shadow)',
    fontSize: fs(13),
    zIndex: 50,
    maxWidth: '80%'
  },
  empty: { gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', fontSize: fs(14), padding: '48px 16px', lineHeight: 1.6 }
}

function VocabStudy({ cards, title, speakLang, speechVoice, onBack }) {
  const [list, setList] = useState(cards)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const go = (d) => {
    if (list.length === 0) return
    setFlipped(false)
    setIndex((i) => (i + d + list.length) % list.length)
  }
  const mix = () => {
    setList(shuffleArr(list))
    setIndex(0)
    setFlipped(false)
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === ' ') {
        e.preventDefault()
        setFlipped((f) => !f)
      } else if (e.key === 'Escape') onBack()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (list.length === 0) {
    return (
      <div style={styles.container}>
        <h2 style={styles.question}>Không có thẻ để học</h2>
        <button className="qprimary" style={quizStyles.primary} onClick={onBack}>Quay lại</button>
      </div>
    )
  }

  const card = list[index]
  return (
    <div style={styles.container}>
      <style>{quizCss}</style>
      <div>
        <h2 style={styles.question}>{title}</h2>
        <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: fs(14) }}>{list.length} thẻ · phím ← → để chuyển, Space để lật</p>
      </div>

      <div style={vocabStyles.card} onClick={() => setFlipped(!flipped)} role="button" tabIndex={0}>
        <button
          style={vocabStyles.cardSpeak}
          onClick={(e) => {
            e.stopPropagation()
            speakText(card.word, speakLang, undefined, speechVoice)
          }}
          title="Nghe phát âm"
        >
          <Icon name="speaker" size={16} />
        </button>
        {!flipped ? (
          <div style={{ fontSize: fs(34), fontWeight: '700', color: 'var(--text-strong)' }}>{card.word}</div>
        ) : (
          <>
            <div style={{ fontSize: fs(22), fontWeight: '600' }}>{card.meaning}</div>
            {card.example_sentence && (
              <div style={{ fontSize: fs(14), color: 'var(--text-soft)', fontStyle: 'italic', maxWidth: '400px' }}>"{card.example_sentence}"</div>
            )}
          </>
        )}
        <div style={vocabStyles.hint}>{flipped ? 'Bấm để quay lại' : 'Bấm để lật thẻ'}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        <button style={vocabStyles.navBtn} onClick={() => go(-1)} aria-label="Thẻ trước"><Icon name="back" size={18} /></button>
        <span style={{ minWidth: '60px', textAlign: 'center', fontSize: fs(14), color: 'var(--text-muted)' }}>{index + 1} / {list.length}</span>
        <button style={vocabStyles.navBtn} onClick={() => go(1)} aria-label="Thẻ sau"><Icon name="next" size={18} /></button>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="qghost" style={quizStyles.ghost} onClick={onBack}><Icon name="back" size={16} /> Quay lại</button>
        <button className="qghost" style={quizStyles.ghost} onClick={mix}><Icon name="repeat" size={16} /> Xáo trộn</button>
      </div>
    </div>
  )
}

function VocabScreen({ profileId, profile, cefrLevel, speechVoice, onExit }) {
  const [words, setWords] = useState([])
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState('all') // 'all' | 'none' | id thư mục
  const [selected, setSelected] = useState(new Set())
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState(null)
  const [confirm, setConfirm] = useState(null) // { kind: 'words' | 'folder', ids?, id?, name? }
  const [showAdd, setShowAdd] = useState(false)
  const [mode, setMode] = useState('explorer')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [renaming, setRenaming] = useState(null) // { id, name }
  const [dropKey, setDropKey] = useState(null)
  const [aiBusy, setAiBusy] = useState(false)
  const [toast, setToast] = useState('')
  const dragIds = useRef([])
  const speakLang = toSpeechLang(profile?.targetLanguage)

  const flash = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 4000)
  }

  const reload = async () => {
    const [w, f] = await Promise.all([
      window.api.getVocabulary({ profileId }),
      window.api.getVocabFolders({ profileId })
    ])
    setWords(w.vocabulary || [])
    setFolders(f.folders || [])
    setLoading(false)
  }

  useEffect(() => {
    reload()
  }, [])

  // ----- dữ liệu suy ra -----
  const counts = {}
  let unclassified = 0
  words.forEach((w) => {
    if (w.folder_id) counts[w.folder_id] = (counts[w.folder_id] || 0) + 1
    else unclassified++
  })
  const folderName = (id) => folders.find((f) => f.id === id)?.name
  const inScope = words.filter((w) =>
    current === 'all' ? true : current === 'none' ? !w.folder_id : w.folder_id === current
  )
  const q = search.trim().toLowerCase()
  const visible = q
    ? inScope.filter((w) => w.word.toLowerCase().includes(q) || String(w.meaning || '').toLowerCase().includes(q))
    : inScope
  const title = current === 'all' ? 'Tất cả từ vựng' : current === 'none' ? 'Chưa phân loại' : folderName(current) || 'Thư mục'
  const folderOptions = [{ value: 'none', label: 'Chưa phân loại' }, ...folders.map((f) => ({ value: f.id, label: f.name }))]

  // ----- thao tác -----
  const moveWords = async (ids, folderId) => {
    const res = await window.api.moveVocabWords({ profileId, wordIds: ids, folderId })
    if (res.success) {
      await reload()
      setSelected(new Set())
      flash(
        folderId
          ? `Đã chuyển ${ids.length} thẻ vào "${folderName(folderId) || 'thư mục'}"`
          : `Đã chuyển ${ids.length} thẻ về "Chưa phân loại"`
      )
    } else {
      flash('Không chuyển được, bạn thử lại nhé.')
    }
  }

  const createFolder = async () => {
    const name = newName.trim()
    if (!name) {
      setCreating(false)
      return
    }
    const res = await window.api.createVocabFolder({ profileId, name })
    if (res.success) {
      await reload()
      setCurrent(res.id)
      setCreating(false)
      setNewName('')
    } else {
      flash(res.error === 'exists' ? 'Đã có thư mục tên này.' : 'Không tạo được thư mục.')
    }
  }

  const renameFolder = async () => {
    if (!renaming) return
    const name = renaming.name.trim()
    if (!name || name === folderName(renaming.id)) {
      setRenaming(null)
      return
    }
    const res = await window.api.renameVocabFolder({ profileId, folderId: renaming.id, name })
    if (res.success) {
      await reload()
      setRenaming(null)
    } else {
      flash(res.error === 'exists' ? 'Đã có thư mục tên này.' : 'Không đổi được tên.')
    }
  }

  const doDelete = async () => {
    if (!confirm) return
    if (confirm.kind === 'words') {
      await window.api.deleteVocabWords({ profileId, wordIds: confirm.ids })
      flash(`Đã xoá ${confirm.ids.length} thẻ`)
    } else {
      await window.api.deleteVocabFolder({ profileId, folderId: confirm.id })
      if (current === confirm.id) setCurrent('all')
      flash(`Đã xoá thư mục "${confirm.name}", các thẻ về "Chưa phân loại"`)
    }
    setConfirm(null)
    setSelected(new Set())
    setDetail(null)
    await reload()
  }

  const aiOrganize = async () => {
    if (aiBusy) return
    if (unclassified === 0) {
      flash('Không còn từ nào chưa phân loại.')
      return
    }
    setAiBusy(true)
    const res = await window.api.aiOrganizeVocabulary({
      profileId,
      nativeLanguage: profile.nativeLanguage,
      targetLanguage: profile.targetLanguage
    })
    setAiBusy(false)
    if (res.success) {
      await reload()
      flash(
        `AI đã xếp ${res.moved} từ vào ${res.foldersUsed} thư mục (tạo mới ${res.created}).` +
          (res.remaining ? ` Còn ${res.remaining} từ chưa xếp, bấm lại để tiếp tục.` : '')
      )
    } else {
      flash('AI chưa phân loại được lúc này, bạn thử lại nhé.')
    }
  }

  // ----- chọn thẻ và kéo thả -----
  const onCardClick = (e, w) => {
    e.stopPropagation()
    const multi = e.ctrlKey || e.metaKey
    setSelected((prev) => {
      const next = new Set(multi ? prev : [])
      if (multi && prev.has(w.id)) next.delete(w.id)
      else next.add(w.id)
      return next
    })
  }

  const onDragStart = (e, w) => {
    const ids = selected.has(w.id) ? [...selected] : [w.id]
    if (!selected.has(w.id)) setSelected(new Set([w.id]))
    dragIds.current = ids
    e.dataTransfer.setData('text/plain', ids.join(','))
    e.dataTransfer.effectAllowed = 'move'
  }

  const dropOn = async (e, target) => {
    e.preventDefault()
    setDropKey(null)
    const ids = dragIds.current.length
      ? dragIds.current
      : e.dataTransfer.getData('text/plain').split(',').map(Number).filter(Boolean)
    dragIds.current = []
    if (ids.length) await moveWords(ids, target)
  }

  const dropProps = (key, target) => ({
    onDragOver: (e) => {
      e.preventDefault()
      setDropKey(key)
    },
    onDragLeave: () => setDropKey((k) => (k === key ? null : k)),
    onDrop: (e) => dropOn(e, target)
  })

  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'Escape') {
        setSelected(new Set())
        setDetail(null)
        setConfirm(null)
      } else if (e.key === 'Delete' && selected.size > 0 && !confirm) {
        setConfirm({ kind: 'words', ids: [...selected] })
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        setSelected(new Set(visible.map((w) => w.id)))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (loading) {
    return (
      <div style={styles.container}>
        <p>Đang tải từ vựng...</p>
      </div>
    )
  }

  if (mode === 'study') {
    return <VocabStudy cards={visible} title={title} speakLang={speakLang} speechVoice={speechVoice} onBack={() => setMode('explorer')} />
  }

  return (
    <div style={exStyles.root}>
      <style>{explorerCss}</style>
      <style>{quizCss}</style>

      {/* ===== Cột trái: thư mục ===== */}
      <aside style={exStyles.side}>
        <button className="qghost" style={{ ...quizStyles.ghost, alignSelf: 'flex-start', padding: '6px 10px' }} onClick={onExit}>
          <Icon name="back" size={16} /> Thoát
        </button>

        <div
          className="vf-row"
          role="button"
          style={{ ...exStyles.row, ...(current === 'all' ? exStyles.rowActive : {}) }}
          onClick={() => setCurrent('all')}
        >
          <Icon name="cards" size={16} />
          <span style={exStyles.rowName}>Tất cả từ</span>
          <span style={exStyles.count}>{words.length}</span>
        </div>

        <div
          className="vf-row"
          role="button"
          style={{
            ...exStyles.row,
            ...(current === 'none' ? exStyles.rowActive : {}),
            ...(dropKey === 'none' ? exStyles.rowDrop : {})
          }}
          onClick={() => setCurrent('none')}
          {...dropProps('none', null)}
        >
          <Icon name="folder" size={16} />
          <span style={exStyles.rowName}>Chưa phân loại</span>
          <span style={exStyles.count}>{unclassified}</span>
        </div>

        <div style={exStyles.sectionLabel}>Thư mục</div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {folders.length === 0 && !creating && (
            <div style={{ fontSize: fs(12), color: 'var(--text-muted)', padding: '4px 10px', lineHeight: 1.5 }}>
              Chưa có thư mục. Tạo thủ công hoặc để AI phân loại giúp bạn.
            </div>
          )}

          {folders.map((f) => (
            <div
              key={f.id}
              className="vf-row"
              role="button"
              style={{
                ...exStyles.row,
                ...(current === f.id ? exStyles.rowActive : {}),
                ...(dropKey === f.id ? exStyles.rowDrop : {})
              }}
              onClick={() => setCurrent(f.id)}
              {...dropProps(f.id, f.id)}
            >
              <Icon name="folder" size={16} />
              {renaming?.id === f.id ? (
                <input
                  autoFocus
                  style={exStyles.renameInput}
                  value={renaming.name}
                  maxLength={40}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setRenaming({ ...renaming, name: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') renameFolder()
                    if (e.key === 'Escape') setRenaming(null)
                  }}
                  onBlur={renameFolder}
                />
              ) : (
                <span style={exStyles.rowName}>{f.name}</span>
              )}
              <span style={exStyles.count}>{counts[f.id] || 0}</span>
              <span className="vf-actions">
                <button
                  style={exStyles.iconBtn}
                  title="Đổi tên"
                  onClick={(e) => {
                    e.stopPropagation()
                    setRenaming({ id: f.id, name: f.name })
                  }}
                >
                  <Icon name="edit" size={13} />
                </button>
                <button
                  style={exStyles.iconBtn}
                  title="Xoá thư mục"
                  onClick={(e) => {
                    e.stopPropagation()
                    setConfirm({ kind: 'folder', id: f.id, name: f.name, count: counts[f.id] || 0 })
                  }}
                >
                  <Icon name="trash" size={13} />
                </button>
              </span>
            </div>
          ))}

          {creating && (
            <div style={{ ...exStyles.row, cursor: 'default' }}>
              <Icon name="folder" size={16} />
              <input
                autoFocus
                style={exStyles.renameInput}
                placeholder="Tên thư mục"
                value={newName}
                maxLength={40}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createFolder()
                  if (e.key === 'Escape') {
                    setCreating(false)
                    setNewName('')
                  }
                }}
                onBlur={createFolder}
              />
            </div>
          )}
        </div>

        <button className="qghost" style={{ ...quizStyles.ghost, justifyContent: 'flex-start' }} onClick={() => setCreating(true)}>
          <Icon name="plus" size={16} /> Thư mục mới
        </button>
        <button
          className="qprimary"
          style={{ ...quizStyles.primary, justifyContent: 'center', ...(aiBusy ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }}
          onClick={aiOrganize}
          disabled={aiBusy}
        >
          <Icon name="sparkle" size={16} /> {aiBusy ? 'AI đang xếp...' : `AI phân loại (${unclassified})`}
        </button>
      </aside>

      {/* ===== Khu vực giữa: các thẻ ===== */}
      <main style={exStyles.main}>
        <div style={exStyles.toolbar}>
          <div style={{ flex: 1, minWidth: '140px' }}>
            <div style={{ fontSize: fs(18), fontWeight: '700', color: 'var(--text-strong)' }}>{title}</div>
            <div style={{ fontSize: fs(12), color: 'var(--text-muted)' }}>
              {visible.length} thẻ{q ? ' (đang lọc)' : ''}
            </div>
          </div>

          <div style={exStyles.searchBox}>
            <Icon name="search" size={14} />
            <input style={exStyles.searchInput} placeholder="Tìm từ..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <button className="qghost" style={{ ...quizStyles.ghost, border: '1.5px solid var(--border)' }} onClick={() => setShowAdd((v) => !v)}>
            <Icon name="plus" size={15} /> Thêm từ
          </button>
          <button
            className="qprimary"
            style={{ ...quizStyles.primary, padding: '8px 18px', fontSize: fs(14), ...(visible.length === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}) }}
            onClick={() => setMode('study')}
            disabled={visible.length === 0}
          >
            <Icon name="cards" size={15} /> Học thẻ
          </button>
        </div>

        {showAdd && (
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'center' }}>
            <AddWordBox
              profileId={profileId}
              profile={profile}
              cefrLevel={cefrLevel}
              folderId={typeof current === 'number' ? current : null}
              onAdded={reload}
            />
          </div>
        )}

        {selected.size > 0 && (
          <div style={exStyles.selBar}>
            <strong>Đã chọn {selected.size} thẻ</strong>
            <div style={{ width: '210px' }}>
              <Dropdown
                value=""
                options={folderOptions}
                placeholder="Chuyển vào thư mục..."
                onChange={(v) => moveWords([...selected], v === 'none' ? null : v)}
              />
            </div>
            <button
              className="qghost"
              style={{ ...quizStyles.ghost, color: '#ef4444', padding: '8px 12px' }}
              onClick={() => setConfirm({ kind: 'words', ids: [...selected] })}
            >
              <Icon name="trash" size={14} /> Xoá
            </button>
            <button className="qghost" style={{ ...quizStyles.ghost, padding: '8px 12px' }} onClick={() => setSelected(new Set())}>
              Bỏ chọn
            </button>
          </div>
        )}

        <div style={exStyles.grid} onClick={() => setSelected(new Set())}>
          {visible.length === 0 && (
            <div style={exStyles.empty}>
              {words.length === 0
                ? 'Chưa có từ vựng nào. Trò chuyện với AI để tự ghi lại từ hay gặp, hoặc bấm "Thêm từ" ở trên.'
                : q
                  ? 'Không tìm thấy từ nào khớp.'
                  : current === 'none'
                    ? 'Mọi từ đã được phân loại.'
                    : 'Thư mục trống. Kéo thẻ vào đây, hoặc chọn thẻ rồi dùng "Chuyển vào thư mục".'}
            </div>
          )}

          {visible.map((w) => (
            <div
              key={w.id}
              className="vf-card"
              draggable
              onDragStart={(e) => onDragStart(e, w)}
              onDragEnd={() => {
                dragIds.current = []
                setDropKey(null)
              }}
              onClick={(e) => onCardClick(e, w)}
              onDoubleClick={() => setDetail(w)}
              title="Bấm đúp để xem chi tiết, kéo để chuyển thư mục"
              style={{ ...exStyles.card, ...(selected.has(w.id) ? exStyles.cardSel : {}) }}
            >
              <div style={exStyles.cardWord}>{w.word}</div>
              <div style={exStyles.cardMeaning}>{w.meaning}</div>
              {current === 'all' && w.folder_id && folderName(w.folder_id) && <span style={exStyles.tag}>{folderName(w.folder_id)}</span>}
            </div>
          ))}
        </div>

        {toast && <div style={exStyles.toast}>{toast}</div>}
      </main>

      {/* ===== Chi tiết thẻ ===== */}
      {detail && (
        <div style={settingsStyles.overlay} onClick={() => setDetail(null)}>
          <div style={{ ...settingsStyles.modal, width: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ fontSize: fs(24), fontWeight: '700', color: 'var(--text-strong)', flex: 1, wordBreak: 'break-word' }}>{detail.word}</div>
              <button style={vocabStyles.cardSpeak} onClick={() => speakText(detail.word, speakLang, undefined, speechVoice)} title="Nghe phát âm">
                <Icon name="speaker" size={16} />
              </button>
              <button style={{ ...settingsStyles.closeButton, display: 'flex' }} onClick={() => setDetail(null)}>
                <Icon name="close" />
              </button>
            </div>

            <div style={{ fontSize: fs(16), fontWeight: '600', marginBottom: '8px' }}>{detail.meaning}</div>
            {detail.example_sentence && (
              <div style={{ fontSize: fs(14), color: 'var(--text-soft)', fontStyle: 'italic', marginBottom: '16px', lineHeight: 1.5 }}>
                "{detail.example_sentence}"
              </div>
            )}

            <Field label="Thư mục">
              <Dropdown
                up
                value={detail.folder_id ?? 'none'}
                options={folderOptions}
                onChange={async (v) => {
                  const target = v === 'none' ? null : v
                  await moveWords([detail.id], target)
                  setDetail((d) => (d ? { ...d, folder_id: target } : d))
                }}
              />
            </Field>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px' }}>
              <button
                className="qghost"
                style={{ ...quizStyles.ghost, color: '#ef4444' }}
                onClick={() => setConfirm({ kind: 'words', ids: [detail.id] })}
              >
                <Icon name="trash" size={15} /> Xoá thẻ
              </button>
              <button className="qprimary" style={quizStyles.primary} onClick={() => setDetail(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Xác nhận xoá ===== */}
      {confirm && (
        <div style={{ ...settingsStyles.overlay, zIndex: 2100 }} onClick={() => setConfirm(null)}>
          <div style={{ ...settingsStyles.modal, width: '380px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 10px', fontSize: fs(18), fontWeight: '700' }}>
              {confirm.kind === 'folder' ? `Xoá thư mục "${confirm.name}"?` : `Xoá ${confirm.ids.length} thẻ?`}
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: fs(13), color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {confirm.kind === 'folder'
                ? `Chỉ xoá thư mục. ${confirm.count} thẻ bên trong không bị xoá mà quay về "Chưa phân loại".`
                : 'Các thẻ bị xoá sẽ không khôi phục được.'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="qghost" style={quizStyles.ghost} onClick={() => setConfirm(null)}>Huỷ</button>
              <button style={styles.dangerButton} onClick={doDelete}>Xoá</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AppContent({ settings, onOpenSettings, onLoggedInChange, onActiveProfileChange }) {
  const [step, setStep] = useState(0)
  const [profile, setProfile]= useState({
    nativeLanguage:'',
    targetLanguage:'',
    goal:'',
    occupation:'',
    interests:''
  })
  const [profileId, setProfileId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [placementResult, setPlacementResult] = useState(null)
  const [chatHistory, setChatHistory] = useState([])
  const [voiceChatHistory, setVoiceChatHistory] = useState([])
  const [voiceLiveTranscript, setVoiceLiveTranscript] = useState('')
  const [voiceSpeechDetected, setVoiceSpeechDetected] = useState(false)
  const [voicePendingTranscript, setVoicePendingTranscript] = useState('')
  const [autoSendVoice, setAutoSendVoice] = useState(() => {
    try { return window.localStorage.getItem('voiceAutoSend') === 'true' } catch { return false }
  })
  const [voiceAutoSendCountdown, setVoiceAutoSendCountdown] = useState(null)
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [voiceMode, setVoiceMode] = useState(false)
  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState(false)
  const [voiceError, setVoiceError] = useState('')
  const [voiceChatMode, setVoiceChatMode] = useState('free')
  const [selectedVoiceScenario, setSelectedVoiceScenario] = useState(voiceRoleplayScenarios[0].id)
  const [customVoiceScenario, setCustomVoiceScenario] = useState('')
  const [activeVoiceScenarioPrompt, setActiveVoiceScenarioPrompt] = useState('')
  const [activeVoiceScenarioTitle, setActiveVoiceScenarioTitle] = useState('')
  const voiceModeRef = useRef(false)
  const speechControlRef = useRef(null)
  const voiceRestartTimerRef = useRef(null)
  const [mistakes, setMistakes] = useState([])
  const [showReview, setShowReview] = useState(false)
  const [showPractice, setShowPractice] = useState(false)
  const [showVocab, setShowVocab] = useState(false)
  const [showStructures, setShowStructures] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const [showAssessment, setShowAssessment] = useState(false)
  const [assessmentBaseline, setAssessmentBaseline] = useState(null)
  const [focusedPractice, setFocusedPractice] = useState(null)
  const [showVoiceChat, setShowVoiceChat] = useState(false)
  const [rightTab, setRightTab] = useState('today') 
  const [username, setUsername] = useState('')
  const [existingProfiles, setExistingProfiles] = useState([])
  const [usernameError, setUsernameError] = useState('')
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [editForm, setEditForm] = useState({ nativeLanguage: '', targetLanguage: '', goal: '' })
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [conversations, setConversations] = useState([])
  const [currentConversationId, setCurrentConversationId] = useState(null)
  const [currentTopic, setCurrentTopic] = useState(null)
  const [showTopicPicker, setShowTopicPicker] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const speechLang = toSpeechLang(profile.targetLanguage)
  const [levelMode, setLevelMode] = useState('test')
  const [manualLevel, setManualLevel] = useState('')
  const [placementError, setPlacementError] = useState('')
  const [levelNotice, setLevelNotice] = useState('')
  const [dailyStats, setDailyStats] = useState({ messagesToday: 0, streak: 0, totalMessages: 0, familiarity: null })
  const [showNotes, setShowNotes] = useState(false)
  const [notesForm, setNotesForm] = useState({ notes: '', enabled: true })
  const [notesBusy, setNotesBusy] = useState(false)
  const [notesMsg, setNotesMsg] = useState('')
  const chatBoxRef = useRef(null)
  const prevLenRef = useRef(0)
  const prevVoiceLenRef = useRef(0)

  const stopVoicePractice = () => {
    voiceModeRef.current = false
    setVoiceMode(false)
    setIsVoiceSpeaking(false)
    setVoiceLiveTranscript('')
    setVoiceSpeechDetected(false)
    setVoicePendingTranscript('')
    setVoiceError('')
    window.clearTimeout(voiceRestartTimerRef.current)
    voiceRestartTimerRef.current = null
    speechControlRef.current?.stop()
    cancelNaturalSpeech()
  }

  const scheduleVoiceRestart = useCallback((delay = 350) => {
    window.clearTimeout(voiceRestartTimerRef.current)
    voiceRestartTimerRef.current = window.setTimeout(() => {
      voiceRestartTimerRef.current = null
      if (voiceModeRef.current) {
        setVoiceError('')
        speechControlRef.current?.start()
      }
    }, delay)
  }, [])

  useEffect(() => () => {
    voiceModeRef.current = false
    window.clearTimeout(voiceRestartTimerRef.current)
    speechControlRef.current?.stop()
    cancelNaturalSpeech()
  }, [])

  // Gắn vào khung chat: mỗi lần khung xuất hiện (vào app, quay về từ màn khác) tự cuộn xuống cuối
  const setChatBox = useCallback((el) => {
    chatBoxRef.current = el
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  // Có tin mới hoặc chấm "đang trả lời": cuộn xuống cuối (mượt khi thêm 1-2 tin, tức thì khi nạp cả đoạn chat)
  useEffect(() => {
    const el = chatBoxRef.current
    const grew = showVoiceChat
      ? voiceChatHistory.length - prevVoiceLenRef.current
      : chatHistory.length - prevLenRef.current
    prevLenRef.current = chatHistory.length
    prevVoiceLenRef.current = voiceChatHistory.length
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: grew > 0 && grew <= 2 ? 'smooth' : 'auto' })
  }, [chatHistory.length, voiceChatHistory.length, isChatLoading, showVoiceChat])

  useEffect(() => {
  window.api.getProfiles().then((res) => {
    setExistingProfiles(res.profiles || [])
  })
}, [])
  
const handleStartNewAccount = async () => {
  if (!username.trim()) return
  setUsernameError('')
  const res = await window.api.checkUsername({ username: username.trim() })
  if (!res.available) {
    setUsernameError('Tên này đã có người dùng, hãy chọn tên khác.')
    return
  }
  setStep(1)
}

  const handleLoginExisting = async (p) => {
  setUsername(p.username)  
  setProfileId(p.id)
  onActiveProfileChange?.(p.id)
  setVoiceChatHistory([])
  setProfile({
    nativeLanguage: p.native_language,
    targetLanguage: p.target_language,
    goal: p.goal,
    occupation: p.occupation || '',
    interests: p.interests || ''
  })
  setPlacementResult({ level: p.cefr_level, feedback: '' })

    const convs = await loadConversations(p.id)
  if (convs.length > 0) {
    await switchConversation(convs[0].id)
  } else {
    setCurrentConversationId(null)
    setChatHistory([])
  }

  setStep(5) // vào thẳng màn hình chat
}

  const handleNext = () => {
    setStep(step + 1)
  }
  const handleBack = () => {
  setStep(step - 1)
}
  const handleChange = (field, value) =>{
    setProfile({...profile,[field]:value})
  }
   const finishRegistration = async (level, feedback, source) => {
    const saveResult = await window.api.saveProfile({
      username: username,
      nativeLanguage: profile.nativeLanguage,
      targetLanguage: profile.targetLanguage,
      goal: profile.goal,
      cefrLevel: level,
      feedback: feedback || '',
      levelSource: source,
      occupation: profile.occupation,
      interests: profile.interests,
    })

    if (!saveResult.success) {
      alert('Tên tài khoản đã bị trùng, vui lòng quay lại và đổi tên khác.')
      return
    }

    setPlacementResult({ level, feedback: feedback || '' })
    setProfileId(saveResult.id)
    onActiveProfileChange?.(saveResult.id)
    setConversations([])
    setCurrentConversationId(null)
    handleNext()
  }

  const handleSubmitPlacement = async () => {
    setIsLoading(true)
    setPlacementError('')
    try {
      const result = await window.api.assessPlacement({
        targetLanguage: profile.targetLanguage,
        answer: profile.placementAnswer
      })
      if (!LEVELS.includes(result.level)) {
        setPlacementError('Chưa chấm được lúc này (AI có thể đang quá tải). Bạn thử lại, hoặc chuyển sang "Tự chọn trình độ".')
        return
      }
      await finishRegistration(result.level, result.feedback, 'placement')
    } catch (error) {
      console.error('Error:', error)
      setPlacementError('Có lỗi xảy ra, vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitManualLevel = async () => {
    setIsLoading(true)
    await finishRegistration(manualLevel, '', 'manual')
    setIsLoading(false)
  }

  const handleChangeLevel = async (delta) => {
    const current = placementResult?.level || 'A1'
    const next = LEVELS[LEVELS.indexOf(current) + delta]
    if (!next) return
    const res = await window.api.setLevel({ profileId, cefrLevel: next, source: 'manual' })
    if (res.success) {
      setPlacementResult({ ...placementResult, level: next })
      setLevelNotice(`Đã chuyển sang ${next}`)
      setTimeout(() => setLevelNotice(''), 3000)
    }
  }
  const handleOpenReview = async () => {
  stopVoicePractice()
  const result = await window.api.getMistakes({ profileId })
  setMistakes(result.mistakes || [])
  setShowReview(true)
}

const handleOpenEditProfile = () => {
  stopVoicePractice()
  setEditForm({
    nativeLanguage: profile.nativeLanguage,
    targetLanguage: profile.targetLanguage,
    goal: profile.goal,
    cefrLevel: placementResult?.level || 'A1',
    occupation: profile.occupation || '',
    interests: profile.interests || '',
  })
  setShowEditProfile(true)
}

const handleOpenNotes = async () => {
  stopVoicePractice()
  setNotesMsg('')
  const res = await window.api.getLearnerNotes({ profileId })
  setNotesForm({ notes: res.notes || '', enabled: res.enabled !== false })
  refreshDailyStats()
  setShowNotes(true)
}

const handleSaveNotes = async () => {
  setNotesBusy(true)
  await window.api.saveLearnerNotes({ profileId, notes: notesForm.notes, enabled: notesForm.enabled })
  setNotesBusy(false)
  setShowNotes(false)
}

const handleRefreshNotes = async () => {
  setNotesBusy(true)
  setNotesMsg('')
  // lưu bản đang sửa trước để AI cập nhật dựa trên đúng nội dung người học thấy
  await window.api.saveLearnerNotes({ profileId, notes: notesForm.notes, enabled: notesForm.enabled })
  const res = await window.api.refreshLearnerNotes({ profileId })
  setNotesBusy(false)
  if (res.success && res.updated) {
    setNotesForm((f) => ({ ...f, notes: res.notes }))
    setNotesMsg('Đã cập nhật ghi chú.')
  } else {
    setNotesMsg('Chưa cập nhật được (cần có tin nhắn, hoặc AI đang bận).')
  }
}

const handleSaveEditProfile = async () => {
  setIsSavingProfile(true)
  const res = await window.api.updateProfile({
    profileId,
    nativeLanguage: editForm.nativeLanguage,
    targetLanguage: editForm.targetLanguage,
    goal: editForm.goal,
    occupation: editForm.occupation,
    interests: editForm.interests,
  })
  if (res.success) {
    const { cefrLevel, ...rest } = editForm
    setProfile({ ...profile, ...rest })
    if (cefrLevel && cefrLevel !== placementResult?.level) {
      const lv = await window.api.setLevel({ profileId, cefrLevel, source: 'manual' })
      if (lv.success) setPlacementResult({ ...placementResult, level: cefrLevel })
    }
    setShowEditProfile(false)
  }
  setIsSavingProfile(false)
}


const refreshMistakes = async () => {
  if (!profileId) return
  const res = await window.api.getMistakes({ profileId })
  setMistakes(res.mistakes || [])
}

const refreshDailyStats = async () => {
  if (!profileId) return
  const res = await window.api.getDailyStats({ profileId })
    setDailyStats({
    messagesToday: res.messagesToday || 0,
    streak: res.streak || 0,
    totalMessages: res.totalMessages || 0,
    familiarity: res.familiarity || null
  })
}

useEffect(() => {
  refreshDailyStats()
}, [profileId])

useEffect(() => {
  refreshMistakes()
}, [profileId])

useEffect(() => {
  onLoggedInChange && onLoggedInChange(step >= 5)
}, [step])

const loadConversations = async (pid) => {
  const res = await window.api.getConversations({ profileId: pid })
  setConversations(res.conversations || [])
  return res.conversations || []
}

const switchConversation = async (convId) => {
  setCurrentConversationId(convId)
  const conv = conversations.find((c) => c.id === convId)
  setCurrentTopic(conv?.topic || null)
  const res = await window.api.getConversationMessages({ conversationId: convId })
  const loaded = (res.messages || []).map(m => ({ role: m.role, text: m.text }))
  setChatHistory(loaded)
}

const handleNewConversation = () => {
  stopVoicePractice()
  setShowTopicPicker(true)
}

const selectTopicAndStart = (topicId) => {
  setCurrentTopic(topicId === 'free' ? null : topicId)
  setCurrentConversationId(null)
  setChatHistory([])
  setShowTopicPicker(false)
}

const handleDeleteConversation = (conv, e) => {
  e.stopPropagation()
  setConfirmDelete(conv) 
}

const confirmDeleteConversation = async () => {
  if (!confirmDelete) return
  const convId = confirmDelete.id
  setConfirmDelete(null)
  await window.api.deleteConversation({ conversationId: convId })
  if (convId === currentConversationId) {
    setCurrentConversationId(null)
    setChatHistory([])
  }
  loadConversations(profileId)
}


const handleSendMessage = async (messageOverride, options = {}) => {
  const { voiceKickoff = false, voiceScenarioPrompt = activeVoiceScenarioPrompt } = options
  const message = typeof messageOverride === 'string' ? messageOverride : chatInput
  const trimmedMessage = message.trim()
  if ((!trimmedMessage && !voiceKickoff) || isChatLoading) return

  const isVoiceChat = voiceModeRef.current || showVoiceChat
  const userMessage = trimmedMessage ? { role: 'user', text: trimmedMessage } : null
  const activeHistory = isVoiceChat ? voiceChatHistory : chatHistory
  const newHistory = voiceKickoff ? [] : userMessage ? [...activeHistory, userMessage] : activeHistory
  if (isVoiceChat) setVoiceChatHistory(newHistory)
  else {
    setChatHistory(newHistory)
    setChatInput('')
  }
  setIsChatLoading(true)
  setVoiceError('')

  try {
    const result = await window.api.sendChatMessage({
      profileId: profileId,
      conversationId: isVoiceChat ? null : currentConversationId,
      topic: isVoiceChat ? null : currentTopic,
      cefrLevel: placementResult?.level || 'A1',
      targetLanguage: profile.targetLanguage,
      nativeLanguage: profile.nativeLanguage,
      goal: profile.goal,
      voiceChat: isVoiceChat,
      voiceScenarioPrompt: isVoiceChat ? voiceScenarioPrompt : '',
      history: voiceKickoff ? [] : activeHistory.slice(-6),
      message: userMessage?.text || 'Start the selected role-play now with one short in-character opening line and a natural question for the learner.'
    })
    const completedHistory = [...newHistory, { role: 'model', text: result.reply, mistakes: result.mistakes || [] }]
    if (isVoiceChat) setVoiceChatHistory(completedHistory)
    else setChatHistory(completedHistory)
    if (!isVoiceChat && result.conversationId && result.conversationId !== currentConversationId) {
      setCurrentConversationId(result.conversationId)
    }
    if (!isVoiceChat) {
      loadConversations(profileId)
      refreshMistakes()
      refreshDailyStats()
    }
    if (voiceModeRef.current) {
      setVoiceLiveTranscript('')
      const spokenReply = getVoiceSpeechText(result.reply, profile.nativeLanguage)
      if (spokenReply) {
        setIsVoiceSpeaking(true)
        speakNaturalText(spokenReply, speechLang, () => {
          setIsVoiceSpeaking(false)
          scheduleVoiceRestart()
        }, settings.speechVoice)
      } else {
        setIsVoiceSpeaking(false)
        scheduleVoiceRestart()
      }
    }
  } catch (error) {
    console.error('Error:', error)
    if (voiceModeRef.current) {
      setVoiceError('Chưa nhận được câu trả lời. Hãy thử nói lại.')
      scheduleVoiceRestart(500)
    }
  } finally {
    setIsChatLoading(false)
  }
}

const handleVoiceTranscript = (transcript) => {
  const phrase = transcript.trim()
  if (!voiceModeRef.current) return
  setVoiceLiveTranscript(phrase)
  if (!phrase) {
    scheduleVoiceRestart()
    return
  }
  setVoiceError('')
  setVoicePendingTranscript(phrase)
}

const voiceInput = useSpeechInput(handleVoiceTranscript, setVoiceSpeechDetected)

const sendVoiceTranscript = () => {
  const phrase = voicePendingTranscript.trim()
  if (!phrase || isChatLoading) return
  setVoicePendingTranscript('')
  setVoiceLiveTranscript('')
  setVoiceSpeechDetected(false)
  setVoiceAutoSendCountdown(null)
  handleSendMessage(phrase)
}

const retryVoiceTranscript = () => {
  setVoicePendingTranscript('')
  setVoiceLiveTranscript('')
  setVoiceSpeechDetected(false)
  setVoiceAutoSendCountdown(null)
  setVoiceError('')
  voiceInput.start()
}

const toggleVoiceAutoSend = (enabled) => {
  setAutoSendVoice(enabled)
  try { window.localStorage.setItem('voiceAutoSend', String(enabled)) } catch { /* storage is optional */ }
}

useEffect(() => {
  if (!autoSendVoice || !voicePendingTranscript) {
    setVoiceAutoSendCountdown(null)
    return undefined
  }
  let remaining = 5
  setVoiceAutoSendCountdown(remaining)
  const timer = window.setInterval(() => {
    remaining -= 1
    if (remaining <= 0) {
      window.clearInterval(timer)
      setVoiceAutoSendCountdown(0)
      sendVoiceTranscript()
    } else {
      setVoiceAutoSendCountdown(remaining)
    }
  }, 1000)
  return () => window.clearInterval(timer)
}, [autoSendVoice, voicePendingTranscript])

useEffect(() => {
  speechControlRef.current = voiceInput
}, [voiceInput])

useEffect(() => {
  if (voiceModeRef.current && voiceInput.error === 'no-speech') {
    setVoiceError(speechErrorMessage(voiceInput.error))
    scheduleVoiceRestart(700)
  }
}, [voiceInput.error, scheduleVoiceRestart])

const toggleVoicePractice = () => {
  if (voiceModeRef.current) {
    if (voiceInput.error) {
      setVoiceError('')
      voiceInput.start()
      return
    }
    stopVoicePractice()
    return
  }

  voiceModeRef.current = true
  setVoiceMode(true)
  setVoiceError('')
  setVoiceLiveTranscript('')
  voiceInput.start()
}

const startVoiceChatSession = () => {
  if (!voiceInput.supported) return
  if (voiceChatMode === 'free') {
    setActiveVoiceScenarioPrompt('')
    setActiveVoiceScenarioTitle('')
    toggleVoicePractice()
    return
  }

  let scenarioPrompt = ''
  let scenarioTitle = ''
  let scenarioOpeningLine = ''
  if (voiceChatMode === 'scenario') {
    const selected = voiceRoleplayScenarios.find((scenario) => scenario.id === selectedVoiceScenario)
    scenarioPrompt = selected?.prompt || ''
    scenarioTitle = selected?.title || 'Tình huống giao tiếp'
    scenarioOpeningLine = selected?.openingLine || ''
  } else {
    scenarioPrompt = customVoiceScenario.trim()
    scenarioTitle = 'Tình huống của bạn'
    if (!scenarioPrompt) {
      setVoiceError('Hãy mô tả tình huống bạn muốn luyện trước khi bắt đầu.')
      return
    }
  }

  setActiveVoiceScenarioPrompt(scenarioPrompt)
  setActiveVoiceScenarioTitle(scenarioTitle)
  setVoiceChatHistory([])
  setVoiceLiveTranscript('')
  setVoicePendingTranscript('')
  setVoiceSpeechDetected(false)
  setVoiceError('')
  voiceModeRef.current = true
  setVoiceMode(true)
  if (scenarioOpeningLine) {
    setVoiceChatHistory([{ role: 'model', text: scenarioOpeningLine, mistakes: [] }])
    setIsVoiceSpeaking(true)
    speakNaturalText(scenarioOpeningLine, speechLang, () => {
      setIsVoiceSpeaking(false)
      scheduleVoiceRestart()
    }, settings.speechVoice)
    return
  }
  handleSendMessage('', { voiceKickoff: true, voiceScenarioPrompt: scenarioPrompt })
}

const handleLogout = () => {
  stopVoicePractice()
  setStep(0)
  setProfileId(null)
  onActiveProfileChange?.(null)
  setProfile({ nativeLanguage: '', targetLanguage: '', goal: '', occupation: '', interests: '' })
  setPlacementResult(null)
  setChatHistory([])
  setVoiceChatHistory([])
  setMistakes([])
  setUsername('')
  setShowReview(false)
  setShowPractice(false)
  setConversations([])
  setCurrentConversationId(null)
  setCurrentTopic(null)
  setShowTopicPicker(false)
  setShowVocab(false)
  setLevelMode('test')
  setManualLevel('')
  setPlacementError('')
  setShowNotes(false)
  setShowProgress(false)
  setShowStructures(false)
  window.api.getProfiles().then((res) => setExistingProfiles(res.profiles || []))
}
const categoryCounts = Object.entries(
  mistakes.reduce((acc, m) => {
    acc[m.category] = (acc[m.category] || 0) + 1
    return acc
  }, {})
)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 3)


const dueCount = mistakes.filter((m) => !m.next_review_at || m.next_review_at <= todayLocal()).length

if (step === 0) {
  return (
    <div style={styles.container} className="fade-in" key="login">
      <style>{fadeStyle}</style>
      <style>{loginCss}</style>
      <h2 style={styles.question}>Chào mừng trở lại!</h2>

      <div style={styles.loginWrapper}>
        {existingProfiles.length > 0 && (
          <div style={styles.loginCard}>
            <div style={styles.loginCardTitle}>Tài khoản của bạn</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {existingProfiles.map((p) => (
                <button
                  key={p.id}
                  className="account-row"
                  style={styles.accountRow}
                  onClick={() => handleLoginExisting(p)}
                >
                  <span style={styles.accountAvatar}>{p.username.charAt(0).toUpperCase()}</span>
                  <span style={styles.accountInfo}>
                    <span style={styles.accountName}>{p.username}</span>
                    <span style={styles.accountLevel}>Trình độ {p.cefr_level}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={styles.loginCard}>
          <div style={styles.loginCardTitle}>Tạo tài khoản mới</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              style={{ ...styles.input, width: '100%' }}
              type="text"
              placeholder="Nhập tên của bạn"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setUsernameError('')
              }}
            />
            {usernameError && (
              <p style={{ color: 'var(--danger)', fontSize: fs(13), margin: 0 }}>{usernameError}</p>
            )}
            <button
              className="onboarding-primary"
              style={{ ...styles.button, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              onClick={handleStartNewAccount}
              disabled={!username.trim()}
            >
              <Icon name="user" size={16} /> Bắt đầu
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

if (step === 1) {
  return (
    <StepCard key={1} current={1} title="Bạn nói ngôn ngữ nào?" subtitle="AI sẽ dùng ngôn ngữ này để giải thích cho bạn.">
      <Dropdown
        value={profile.nativeLanguage}
        options={nativeLanguageOptions}
        onChange={(v) => handleChange('nativeLanguage', v)}
        placeholder="Chọn ngôn ngữ mẹ đẻ"
      />
      <div style={onboardStyles.actions}>
        <button style={{ ...styles.backButton, display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={handleBack}>
          <Icon name="back" size={16} /> Quay lại
        </button>
        <button style={styles.button} onClick={handleNext} disabled={!profile.nativeLanguage}>
          Tiếp theo
        </button>
      </div>
    </StepCard>
  )
}

if (step === 2) {
  return (
    <StepCard key={2} current={2} title="Bạn muốn học ngôn ngữ nào?">
      <Dropdown
        value={profile.targetLanguage}
        options={targetLanguageOptions.filter((o) => o.value !== profile.nativeLanguage)}
        onChange={(v) => handleChange('targetLanguage', v)}
        placeholder="Chọn ngôn ngữ muốn học"
      />
      <div style={onboardStyles.actions}>
        <button style={{ ...styles.backButton, display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={handleBack}>
          <Icon name="back" size={16} /> Quay lại
        </button>
        <button style={styles.button} onClick={handleNext} disabled={!profile.targetLanguage}>
          Tiếp theo
        </button>
      </div>
    </StepCard>
  )
}

if (step === 3) {
  return (
    <StepCard key={3} current={3} title="Mục tiêu học của bạn là gì?" subtitle="Thông tin thêm giúp AI chọn ví dụ và từ vựng đúng lĩnh vực của bạn.">
      <Dropdown
        value={profile.goal}
        options={goalOptions}
        onChange={(v) => handleChange('goal', v)}
        placeholder="Chọn mục tiêu"
      />
      <ProfileExtras
        occupation={profile.occupation}
        interests={profile.interests}
        onChange={handleChange}
      />
      <div style={onboardStyles.actions}>
        <button style={{ ...styles.backButton, display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={handleBack}>
          <Icon name="back" size={16} /> Quay lại
        </button>
        <button style={styles.button} onClick={handleNext} disabled={!profile.goal}>
          Tiếp theo
        </button>
      </div>
    </StepCard>
  )
}

if (step === 4) {
  return (
    <StepCard
      key={4}
      current={4}
      title="Trình độ của bạn"
      subtitle="Làm bài đánh giá ngắn hoặc tự chọn. Bạn có thể đổi lại bất cứ lúc nào."
    >
      <style>{dropdownCss}</style>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <SegmentedControl
          value={levelMode}
          onChange={setLevelMode}
          options={[
            { value: 'test', label: 'Làm bài đánh giá' },
            { value: 'manual', label: 'Tự chọn trình độ' }
          ]}
        />
      </div>

      {levelMode === 'test' ? (
        <>
          <p style={{ margin: 0, fontSize: fs(14), color: 'var(--text-soft)' }}>
            Hãy viết 2-3 câu bằng {profile.targetLanguage} mô tả một ngày bình thường của bạn.
          </p>
          <textarea
            style={{ ...styles.textarea, width: '100%', boxSizing: 'border-box' }}
            placeholder="Type your answer here..."
            value={profile.placementAnswer || ''}
            onChange={(e) => handleChange('placementAnswer', e.target.value)}
            disabled={isLoading}
          />
          {placementError && <p style={{ margin: 0, color: 'var(--danger)', fontSize: fs(13) }}>{placementError}</p>}
        </>
      ) : (
        <div style={onboardStyles.levelGrid}>
          {levelOptions.map((l) => (
            <button
              key={l.id}
              className="level-card"
              style={{ ...onboardStyles.levelCard, ...(manualLevel === l.id ? onboardStyles.levelCardActive : {}) }}
              onClick={() => setManualLevel(l.id)}
              disabled={isLoading}
            >
              <span style={onboardStyles.levelCode}>{l.id}</span>
              <span style={onboardStyles.levelDesc}>{l.desc}</span>
            </button>
          ))}
        </div>
      )}

      <div style={onboardStyles.actions}>
        <button
          style={{ ...styles.backButton, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          onClick={handleBack}
          disabled={isLoading}
        >
          <Icon name="back" size={16} /> Quay lại
        </button>
        {levelMode === 'test' ? (
          <button
            style={styles.button}
            onClick={handleSubmitPlacement}
            disabled={!profile.placementAnswer || isLoading}
          >
            {isLoading ? 'Đang chấm...' : 'Nộp bài'}
          </button>
        ) : (
          <button
            style={styles.button}
            onClick={handleSubmitManualLevel}
            disabled={!manualLevel || isLoading}
          >
            {isLoading ? 'Đang lưu...' : 'Bắt đầu'}
          </button>
        )}
      </div>
    </StepCard>
  )
}

if (showReview) {
  return (
    <div style={{ ...styles.container, justifyContent: 'flex-start', paddingTop: '30px' }} className="fade-in" key="review">
      <style>{fadeStyle}</style>
      <h2 style={styles.question}>Sổ tay lỗi sai</h2>
      <p style={{ fontSize: fs(14), color: 'var(--text-muted)' }}>
        {mistakes.length} lỗi đã ghi nhận
      </p>

      <div style={styles.reviewBox}>
        {mistakes.length === 0 && (
          <p style={{ color: 'var(--text-muted)' }}>Chưa có lỗi nào được ghi nhận. Hãy trò chuyện nhiều hơn!</p>
        )}
        {mistakes.map((m) => (
          <div key={m.id} style={styles.mistakeCard}>
            <div style={styles.mistakeCategory}>{m.category}</div>
            <div style={{ margin: '6px 0' }}>
              <span style={{ color: 'var(--danger)', textDecoration: 'line-through' }}>{m.original_text}</span>
              {' → '}
              <span style={{ color: '#27ae60', fontWeight: '600' }}>{m.corrected_text}</span>
            </div>
            <div style={{ fontSize: fs(13), color: 'var(--text-soft)' }}>{m.explanation}</div>
          </div>
        ))}
      </div>

      <button style={styles.button} onClick={() => setShowReview(false)}>
        Quay lại luyện tập
      </button>
    </div>
  )
}

if (showEditProfile) {
  return (
    <StepCard key="edit" title="Chỉnh sửa thông tin" subtitle="Thay đổi áp dụng từ tin nhắn tiếp theo. Lỗi sai và lịch ôn tập vẫn được giữ.">
      <Field label="Ngôn ngữ mẹ đẻ">
        <Dropdown
          value={editForm.nativeLanguage}
          options={nativeLanguageOptions}
          onChange={(v) => setEditForm({ ...editForm, nativeLanguage: v })}
        />
      </Field>
      <Field label="Ngôn ngữ đang học">
        <Dropdown
          value={editForm.targetLanguage}
          options={targetLanguageOptions}
          onChange={(v) => setEditForm({ ...editForm, targetLanguage: v })}
        />
      </Field>
      <Field label="Mục tiêu học">
        <Dropdown
          value={editForm.goal}
          options={goalOptions}
          onChange={(v) => setEditForm({ ...editForm, goal: v })}
        />
      </Field>
       <ProfileExtras
        occupation={editForm.occupation}
        interests={editForm.interests}
        onChange={(field, value) => setEditForm({ ...editForm, [field]: value })}
      />
      <Field label="Trình độ">
        <Dropdown
          up
          value={editForm.cefrLevel}
          options={levelDropdownOptions}
          onChange={(v) => setEditForm({ ...editForm, cefrLevel: v })}
        />
      </Field>

      <div style={onboardStyles.actions}>
        <button
          style={{ ...styles.backButton, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          onClick={() => setShowEditProfile(false)}
          disabled={isSavingProfile}
        >
          <Icon name="back" size={16} /> Huỷ
        </button>
        <button
          style={styles.button}
          onClick={handleSaveEditProfile}
          disabled={isSavingProfile || !editForm.nativeLanguage || !editForm.targetLanguage}
        >
          {isSavingProfile ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </StepCard>
  )
}


if (showVocab) {
  return (
    <VocabScreen
      profileId={profileId}
      profile={profile}
      cefrLevel={placementResult?.level || 'A1'}
      speechVoice={settings.speechVoice}
      onExit={() => setShowVocab(false)}
    />
  )
}

  if (showStructures) {
    return (
      <StructureScreen
        profileId={profileId}
        profile={profile}
        cefrLevel={placementResult?.level || 'A1'}
        speechVoice={settings.speechVoice}
        onExit={() => setShowStructures(false)}
      />
    )
  }

  if (focusedPractice) {
    return (
      <AdaptiveQuizScreen
        profileId={profileId}
        profile={profile}
        cefrLevel={placementResult?.level || 'A1'}
        count={8}
        targetSkill={focusedPractice.skill}
        targetFocus={focusedPractice.focus}
        onExit={() => setFocusedPractice(null)}
      />
    )
  }

  if (showAssessment) {
    return (
      <QuizScreen
        profileId={profileId}
        profile={profile}
        cefrLevel={placementResult?.level || 'A1'}
        label="Bài đánh giá tổng quát"
        count={15}
        attemptMode="assessment"
        previousAssessment={assessmentBaseline}
        onPracticeWeakness={(skill, focus) => {
          setShowAssessment(false)
          setFocusedPractice({ skill, focus })
        }}
        loader={() => window.api.generateAssessmentQuiz({
          profileId,
          targetLanguage: profile.targetLanguage,
          nativeLanguage: profile.nativeLanguage,
          cefrLevel: placementResult?.level || 'A1'
        })}
        onExit={() => setShowAssessment(false)}
      />
    )
  }

  if (showProgress) {
    return (
      <ProgressScreen
        profileId={profileId}
        profile={profile}
        onExit={() => setShowProgress(false)}
        onStartAssessment={(attempt) => {
          setAssessmentBaseline(attempt)
          setShowAssessment(true)
        }}
        onStartFocusedPractice={(skill, focus) => setFocusedPractice({ skill, focus })}
      />
    )
  }

if (showPractice) {
  return (
    <ReviewHub
      profileId={profileId}
      profile={profile}
      cefrLevel={placementResult?.level || 'A1'}
      dueCount={dueCount}
      mistakeCount={mistakes.length}
      onRefresh={refreshMistakes}
      onExit={() => {
        setShowPractice(false)
        refreshMistakes()
      }}
    />
  )
}

if (showVoiceChat) {
  return (
    <div className="app-shell voice-chat-screen">
      <main className="voice-chat-layout">
        <header className="voice-chat-topbar">
          <button className="voice-back-button" onClick={() => { stopVoicePractice(); setShowVoiceChat(false) }}>
            <Icon name="back" size={16} /> <span>Quay lại</span>
          </button>
          <div className="voice-top-title">
            <span>HỘI THOẠI BẰNG GIỌNG NÓI</span>
            <h1>{activeVoiceScenarioTitle || 'Nói chuyện tự nhiên'}</h1>
          </div>
          <div className="voice-language-pill"><span className="voice-language-dot" />{profile.targetLanguage || 'Trò chuyện bằng giọng nói'}</div>
        </header>

        <section ref={setChatBox} className="voice-transcript voice-transcript-center" role="log" aria-live="polite" aria-label="Phụ đề cuộc trò chuyện">
          {voiceChatHistory.slice(-6).map((msg, index) => (
            <div key={`${voiceChatHistory.length - 6 + index}-${msg.role}`} className={`voice-message ${msg.role === 'user' ? 'voice-message-user' : 'voice-message-ai'}`}>
              <div className="voice-message-avatar">{msg.role === 'user' ? (username?.slice(0, 1).toUpperCase() || 'B') : 'AI'}</div>
              <div className="voice-message-content">
                <div className="voice-message-label">{msg.role === 'user' ? 'Bạn' : 'AI'}</div>
                <div className="voice-message-text">{formatMessage(msg.text)}</div>
              </div>
            </div>
          ))}
          {voiceMode && (voiceInput.listening || voiceLiveTranscript || voicePendingTranscript || voiceInput.transcribing || voiceInput.error) && <div className="voice-live-caption" role="status" aria-live="polite">
            {voiceInput.error && !voicePendingTranscript ? <>
              <div className="voice-live-caption-heading"><span className="voice-live-dot" style={{ background: 'var(--danger)', boxShadow: 'none', animation: 'none' }} /> NHẬN DIỆN ĐANG GẶP LỖI</div>
              <div className="voice-live-caption-text">{speechErrorMessage(voiceInput.error)}</div>
              <div className="voice-review-actions">
                <button type="button" className="voice-review-again" onClick={retryVoiceTranscript}>
                  <Icon name="mic" size={14} /> Thử lại
                </button>
              </div>
              <div style={{ marginTop: '8px', color: 'var(--text-muted)', fontSize: '11px' }}>
                Nhận diện bằng Whisper cục bộ
              </div>
            </> : voiceInput.transcribing ? <>
              <div className="voice-live-caption-heading"><span className="voice-live-dot" /> ĐANG NHẬN DIỆN CỤC BỘ</div>
              <div className="voice-live-caption-text">
                {voiceInput.modelProgress?.status === 'progress' && Number.isFinite(voiceInput.modelProgress.progress)
                  ? `Đang tải mô hình lần đầu · ${Math.round(voiceInput.modelProgress.progress)}%`
                  : 'Đang xử lý giọng nói trên thiết bị…'}
              </div>
            </> : voicePendingTranscript ? <>
              <div className="voice-live-caption-heading"><span className="voice-live-dot" /> KIỂM TRA LỜI NHẬN DIỆN</div>
              <textarea
                className="voice-review-input"
                aria-label="Sửa câu nhận diện trước khi gửi"
                value={voicePendingTranscript}
                onChange={(event) => {
                  setVoicePendingTranscript(event.target.value)
                  setVoiceLiveTranscript(event.target.value)
                }}
                rows={2}
              />
              <div className="voice-review-actions">
                <button type="button" className="voice-review-again" onClick={retryVoiceTranscript}>
                  <Icon name="mic" size={14} /> Nói lại
                </button>
                <button type="button" className="voice-review-send" onClick={sendVoiceTranscript} disabled={!voicePendingTranscript.trim() || isChatLoading}>
                  Gửi cho AI{autoSendVoice && voiceAutoSendCountdown > 0 ? ` · ${voiceAutoSendCountdown}s` : ''}
                </button>
              </div>
              <label className="voice-auto-send-option">
                <input type="checkbox" checked={autoSendVoice} onChange={(event) => toggleVoiceAutoSend(event.target.checked)} />
                Tự gửi sau 5 giây
              </label>
              <div style={{ marginTop: '8px', color: 'var(--text-muted)', fontSize: '11px' }}>
                Nhận diện bằng Whisper cục bộ
              </div>
            </> : <>
              <div className="voice-live-caption-heading"><span className="voice-live-dot" /> {voiceSpeechDetected || voiceLiveTranscript ? 'ĐÃ NHẬN ĐƯỢC GIỌNG NÓI' : 'ĐANG CHỜ GIỌNG NÓI'}</div>
              <div className="voice-live-caption-text">{voiceLiveTranscript || 'Nói xong một câu, phần nhận diện sẽ hiện ở đây.'}</div>
              <div style={{ marginTop: '8px', color: 'var(--text-muted)', fontSize: '11px' }}>
                Nhận diện bằng Whisper cục bộ
              </div>
            </>}
          </div>}
          {isChatLoading && <div className="voice-thinking"><span /><span /><span /> AI đang suy nghĩ</div>}
          {!voiceChatHistory.length && !isChatLoading && !voiceMode && (
            <div className="voice-mode-picker">
              <div className="voice-mode-picker-kicker">CHỌN CÁCH LUYỆN NÓI</div>
              <h2>Bạn muốn trò chuyện thế nào?</h2>
              <div className="voice-mode-tabs" role="tablist" aria-label="Chế độ luyện nói">
                <button type="button" role="tab" aria-selected={voiceChatMode === 'free'} className={voiceChatMode === 'free' ? 'voice-mode-tab active' : 'voice-mode-tab'} onClick={() => { setVoiceChatMode('free'); setVoiceError('') }}>Tự do</button>
                <button type="button" role="tab" aria-selected={voiceChatMode === 'scenario'} className={voiceChatMode === 'scenario' ? 'voice-mode-tab active' : 'voice-mode-tab'} onClick={() => { setVoiceChatMode('scenario'); setVoiceError('') }}>Tình huống có sẵn</button>
                <button type="button" role="tab" aria-selected={voiceChatMode === 'custom'} className={voiceChatMode === 'custom' ? 'voice-mode-tab active' : 'voice-mode-tab'} onClick={() => { setVoiceChatMode('custom'); setVoiceError('') }}>Tạo tình huống</button>
              </div>

              {voiceChatMode === 'free' && <div className="voice-mode-detail">
                <strong>Trò chuyện tự do</strong>
                <span>Nói về bất cứ điều gì. AI sẽ bắt chuyện tự nhiên và phản hồi ngắn gọn.</span>
              </div>}

              {voiceChatMode === 'scenario' && <div className="voice-scenario-grid">
                {voiceRoleplayScenarios.map((scenario) => (
                  <button
                    type="button"
                    key={scenario.id}
                    className={selectedVoiceScenario === scenario.id ? 'voice-scenario-card selected' : 'voice-scenario-card'}
                    aria-pressed={selectedVoiceScenario === scenario.id}
                    onClick={() => { setSelectedVoiceScenario(scenario.id); setVoiceError('') }}
                  >
                    <span className="voice-scenario-icon" aria-hidden="true">{scenario.icon}</span>
                    <span className="voice-scenario-copy"><strong>{scenario.title}</strong><small>{scenario.description}</small></span>
                  </button>
                ))}
              </div>}

              {voiceChatMode === 'custom' && <div className="voice-custom-scenario">
                <label htmlFor="voice-custom-scenario-input">Mô tả tình huống bạn muốn luyện</label>
                <textarea
                  id="voice-custom-scenario-input"
                  value={customVoiceScenario}
                  onChange={(event) => { setCustomVoiceScenario(event.target.value); setVoiceError('') }}
                  maxLength={500}
                  placeholder="Ví dụ: Tôi đang ở sân bay và cần hỏi nhân viên về cổng lên máy bay."
                  rows={3}
                />
                <small>AI sẽ vào vai người đối thoại và bắt đầu bằng một câu hỏi.</small>
              </div>}

              <button type="button" className="voice-mode-start" onClick={startVoiceChatSession} disabled={!voiceInput.supported || (voiceChatMode === 'custom' && !customVoiceScenario.trim())}>
                {voiceChatMode === 'free' ? 'Bắt đầu trò chuyện' : 'Bắt đầu tình huống'}
                <Icon name="next" size={15} />
              </button>
            </div>
          )}
          {!voiceChatHistory.length && !isChatLoading && voiceMode && (
            <div className="voice-empty-state">
              <div className="voice-empty-icon"><Icon name="speaker" size={22} /></div>
              <strong>Cuộc trò chuyện sẽ hiện ở đây</strong>
              <span>Nói một điều bạn muốn chia sẻ để bắt đầu.</span>
            </div>
          )}
        </section>

        <footer className="voice-controls">
          <p>Nói bằng {profile.targetLanguage || 'tiếng Anh'} · AI sẽ chỉ đọc bằng ngôn ngữ này</p>
          <button
            type="button"
            className={`voice-mic-button ${voiceMode ? 'voice-mic-button-active' : ''} ${voiceInput.listening ? 'voice-mic-button-listening' : ''}`}
            onClick={voiceMode ? toggleVoicePractice : startVoiceChatSession}
            disabled={!voiceInput.supported}
            aria-pressed={voiceMode}
            aria-label={voiceMode ? 'Kết thúc trò chuyện bằng giọng nói' : 'Bắt đầu trò chuyện bằng giọng nói'}
            title={voiceMode ? 'Dừng trò chuyện' : 'Bắt đầu theo chế độ đã chọn'}
          >
            <span className="voice-mic-halo" />
            <span className="voice-mic-core"><Icon name={voiceMode && !voiceInput.error ? 'close' : 'mic'} size={24} /></span>
          </button>
          <div className={`voice-state-pill ${voiceInput.listening ? 'voice-state-pill-live' : ''}`} role="status" aria-live="polite">
            <span className="voice-state-indicator" aria-hidden="true" />
            <span>{!voiceInput.supported
              ? 'Thiết bị này không hỗ trợ micro.'
              : voiceError || (voiceInput.error
                ? speechErrorMessage(voiceInput.error)
                : voicePendingTranscript
                  ? 'Đã nhận diện giọng nói. Kiểm tra nội dung rồi chọn Gửi cho AI hoặc Nói lại.'
                  : voiceInput.transcribing
                    ? (voiceInput.modelProgress?.status === 'progress' && Number.isFinite(voiceInput.modelProgress.progress)
                      ? `Đang tải mô hình nhận diện lần đầu · ${Math.round(voiceInput.modelProgress.progress)}%`
                      : 'Đang nhận diện giọng nói trên thiết bị…')
                  : isChatLoading || isVoiceSpeaking
                    ? 'AI đang trả lời…'
                    : voiceInput.listening
                      ? voiceSpeechDetected || voiceLiveTranscript
                        ? 'Đã nhận được giọng nói · đang nhận diện thành chữ…'
                        : 'Micro đang nghe · chưa phát hiện giọng nói.'
                      : voiceMode ? 'Đang bật micro…' : 'Chọn cách luyện nói ở phía trên.')}</span>
          </div>
        </footer>
      </main>
    </div>
  )
}

return (
  <div style={styles.appLayout} className="app-shell fade-in" key={step}>
    <style>{fadeStyle}</style>
    <style>{layoutCss}</style>
    <style>{sidebarCss}</style>
    
    {showTopicPicker && (
      <div style={settingsStyles.overlay} onClick={() => setShowTopicPicker(false)}>
        <div style={settingsStyles.modal} onClick={(e) => e.stopPropagation()}>
          <div style={settingsStyles.header}>
            <h3 style={{ margin: 0, fontSize: fs(18), fontWeight: '700' }}>Chọn chủ đề luyện tập</h3>
            <button style={{ ...settingsStyles.closeButton, display: 'flex' }} onClick={() => setShowTopicPicker(false)}>
              <Icon name="close" />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topicOptions.map((t) => (
                <button
                key={t.id}
                className="level-card"
                style={{ ...styles.sidebarButton, background: 'var(--surface-soft)', fontWeight: '500' }}
                onClick={() => selectTopicAndStart(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    )}
        {confirmDelete && (
      <div style={settingsStyles.overlay} onClick={() => setConfirmDelete(null)}>
        <div style={{ ...settingsStyles.modal, width: '380px' }} onClick={(e) => e.stopPropagation()}>
          <h3 style={{ margin: '0 0 10px', fontSize: fs(18), fontWeight: '700' }}>Xoá đoạn chat này?</h3>
          <p style={{ margin: '0 0 6px', fontSize: fs(14), fontWeight: '600', color: 'var(--text-soft)', wordBreak: 'break-word' }}>
            "{confirmDelete.title || 'Đoạn chat mới'}"
          </p>
          <p style={{ margin: '0 0 20px', fontSize: fs(13), color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Toàn bộ tin nhắn trong đoạn chat này sẽ bị xoá và không khôi phục được. Lỗi sai và từ vựng đã ghi nhận vẫn được giữ lại.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              style={{ ...styles.backButton, padding: '10px 20px' }}
              onClick={() => setConfirmDelete(null)}
            >
              Huỷ
            </button>
            <button style={styles.dangerButton} onClick={confirmDeleteConversation}>
              Xoá
            </button>
          </div>
        </div>
      </div>
    )}

            {showNotes && (
      <div style={settingsStyles.overlay} onClick={() => setShowNotes(false)}>
        <div style={{ ...settingsStyles.modal, width: '480px', padding: 0 }} onClick={(e) => e.stopPropagation()}>
          <div style={notesStyles.header}>
            <div style={notesStyles.headIcon}>
              <Icon name="sparkle" size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={notesStyles.title}>AI biết gì về bạn</div>
              <div style={notesStyles.subtitle}>Những điều AI nhớ để trò chuyện sát với bạn hơn</div>
            </div>
            <button style={{ ...settingsStyles.closeButton, display: 'flex' }} onClick={() => setShowNotes(false)}>
              <Icon name="close" />
            </button>
          </div>

          <div style={notesStyles.body}>
            <div style={notesStyles.toggleCard}>
              <div style={rowStyles.textCol}>
                <div style={rowStyles.title}>Cho phép AI ghi nhớ</div>
                <div style={rowStyles.desc}>Tắt thì AI không tạo và không dùng ghi chú khi trò chuyện</div>
              </div>
              <ToggleSwitch checked={notesForm.enabled} onChange={(v) => setNotesForm({ ...notesForm, enabled: v })} />
            </div>

            <div>
              <div style={notesStyles.labelRow}>
                <span style={notesStyles.label}>Ghi chú của AI</span>
                <div style={notesStyles.actions}>
                  <button
                    style={{ ...notesStyles.smallAction, ...(notesBusy || !notesForm.notes ? { opacity: 0.45, cursor: 'not-allowed' } : {}) }}
                    onClick={() => setNotesForm({ ...notesForm, notes: '' })}
                    disabled={notesBusy || !notesForm.notes}
                  >
                    <Icon name="trash" size={12} /> Xoá hết
                  </button>
                  <button
                    style={{ ...notesStyles.smallAction, ...(notesBusy || !notesForm.enabled ? { opacity: 0.45, cursor: 'not-allowed' } : {}) }}
                    onClick={handleRefreshNotes}
                    disabled={notesBusy || !notesForm.enabled}
                  >
                    <Icon name="repeat" size={12} /> {notesBusy ? 'Đang xử lý...' : 'Cập nhật ngay'}
                  </button>
                </div>
              </div>

              <textarea
                style={{ ...notesStyles.textarea, ...(!notesForm.enabled ? { opacity: 0.55 } : {}) }}
                maxLength={600}
                value={notesForm.notes}
                onChange={(e) => setNotesForm({ ...notesForm, notes: e.target.value })}
                placeholder="Chưa có ghi chú. AI sẽ tự cập nhật sau mỗi khoảng 10 tin nhắn, hoặc bạn có thể tự viết ở đây."
                disabled={!notesForm.enabled || notesBusy}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '8px' }}>
                <span style={notesStyles.hint}>
                  {notesMsg || 'Bạn có thể sửa hoặc xoá bất cứ lúc nào. Ghi chú được lưu trên máy này.'}
                </span>
                <span style={{ ...notesStyles.hint, flexShrink: 0 }}>{notesForm.notes.length}/600</span>
              </div>
            </div>
          </div>

          <div style={notesStyles.footer}>
            <button style={notesStyles.ghostBtn} onClick={() => setShowNotes(false)} disabled={notesBusy}>
              Huỷ
            </button>
            <button
              style={{ ...notesStyles.primaryBtn, ...(notesBusy ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }}
              onClick={handleSaveNotes}
              disabled={notesBusy}
            >
              Lưu
            </button>
          </div>
        </div>
      </div>
    )}
    {/* Sidebar trái */}
        <aside className="sidebar" style={styles.sidebarV2}>
      <button className="new-chat-button" style={styles.newChatButton} onClick={handleNewConversation}>
        <Icon name="plus" size={16} /> Đoạn chat mới
      </button>

      <nav className="nav-list" style={styles.navList}>
        <button className="nav-item" style={styles.navItem} onClick={handleOpenReview}>
          <Icon name="book" size={17} /> Sổ tay lỗi sai
        </button>
        <button className="nav-item" style={{ ...styles.navItem, ...(showVoiceChat ? { background: 'var(--accent-soft)', color: 'var(--accent-text)' } : {}) }} onClick={() => { stopVoicePractice(); setVoiceChatHistory([]); setVoiceChatMode('free'); setActiveVoiceScenarioPrompt(''); setActiveVoiceScenarioTitle(''); setVoiceError(''); setShowVoiceChat(true) }}>
          <Icon name="mic" size={17} /> Trò chuyện bằng giọng nói
        </button>
        <button className="nav-item" style={styles.navItem} onClick={() => { stopVoicePractice(); setShowPractice(true) }}>
          <Icon name="repeat" size={17} /> <span style={{ flex: 1, textAlign: 'left' }}>Ôn tập</span>
          {dueCount > 0 && <span style={styles.dueBadge}>{dueCount > 99 ? '99+' : dueCount}</span>}
        </button>
        <button className="nav-item" style={styles.navItem} onClick={() => { stopVoicePractice(); setShowVocab(true) }}>
          <Icon name="cards" size={17} /> Từ vựng
        </button>
        <button className="nav-item" style={styles.navItem} onClick={() => { stopVoicePractice(); setShowStructures(true) }}>
          <Icon name="layers" size={17} /> Cấu trúc câu
        </button>
        <button className="nav-item" style={styles.navItem} onClick={() => { stopVoicePractice(); setShowProgress(true) }}>
          <Icon name="trend" size={17} /> Tiến bộ
        </button>
        <button className="nav-item" style={styles.navItem} onClick={handleOpenNotes}>
          <Icon name="user" size={17} /> AI biết gì về bạn
        </button>
      </nav>

      <div className="conversation-list" style={styles.convSectionV2}>
        {conversations.length > 0 && <div style={styles.sectionLabel}>Đoạn chat</div>}
        {conversations.map((c) => (
          <div
            key={c.id}
            className={`conv-item ${c.id === currentConversationId ? 'conv-item-active' : ''}`}
            style={{
              ...styles.convItem,
              ...(c.id === currentConversationId ? styles.convItemActive : {})
            }}
            onClick={() => { stopVoicePractice(); switchConversation(c.id) }}
          >
            <span style={styles.convTitle}>{c.title || 'Đoạn chat mới'}</span>
            <button
              className="conv-delete"
              style={styles.convDelete}
              onClick={(e) => handleDeleteConversation(c, e)}
              title="Xoá đoạn chat"
            >
              <Icon name="trash" size={13} />
            </button>
          </div>
        ))}
      </div>

      <div style={{ position: 'relative' }}>
        {showProfileMenu && (
          <>
            <div style={styles.menuOverlay} onClick={() => setShowProfileMenu(false)} />
            <div style={styles.profileMenu}>
              <button
                className="nav-item"
                style={styles.navItem}
                onClick={() => {
                  setShowProfileMenu(false)
                  stopVoicePractice()
                  onOpenSettings && onOpenSettings()
                }}
              >
                <Icon name="settings" size={15} /> Cài đặt
              </button>
              <button
                className="nav-item"
                style={styles.navItem}
                onClick={() => {
                  setShowProfileMenu(false)
                  handleOpenEditProfile()
                }}  
              >
                <Icon name="edit" size={15} /> Chỉnh sửa thông tin
              </button>
              <button
                className="nav-item"
                style={{ ...styles.navItem, color: '#ef4444' }}
                onClick={handleLogout}
              >
                <Icon name="logout" size={15} /> Đăng xuất
              </button>
            </div>
          </>
        )}

        <button
          className="profile-bar"
          style={styles.profileBar}
          onClick={() => setShowProfileMenu((v) => !v)}
        >
          <span className="profile-avatar-small" style={styles.profileAvatarSmall}>
            {username ? username.charAt(0).toUpperCase() : '?'}
          </span>
          <span style={styles.profileInfo}>
            <span style={styles.profileName}>{username || 'Học viên'}</span>
            <span style={styles.profileLevelText}>
              {placementResult?.level} · {goalLabels[profile.goal] || profile.goal}
            </span>
          </span>
        </button>
      </div>
    </aside>

    {/* Khu vực chat giữa */}
    <main style={styles.mainArea} className="chat-main">
            <div className="chat-toolbar" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <h2 className="chat-title" style={{ ...styles.question, fontSize: fs(26) }}>Luyện tập cùng AI</h2>
        <div style={onboardStyles.levelBar}>
          <button
            style={{ ...onboardStyles.levelStep, ...(placementResult?.level === 'A1' ? { opacity: 0.4, cursor: 'not-allowed' } : {}) }}
            onClick={() => handleChangeLevel(-1)}
            disabled={placementResult?.level === 'A1'}
            title="AI nói dễ hơn một bậc"
          >
            <Icon name="minus" size={13} /> Dễ hơn
          </button>
          <span style={onboardStyles.levelPill}>{placementResult?.level}</span>
          <button
            style={{ ...onboardStyles.levelStep, ...(placementResult?.level === 'C2' ? { opacity: 0.4, cursor: 'not-allowed' } : {}) }}
            onClick={() => handleChangeLevel(1)}
            disabled={placementResult?.level === 'C2'}
            title="AI nói khó hơn một bậc"
          >
            Khó hơn <Icon name="plus" size={13} />
          </button>
          {levelNotice && <span style={{ fontSize: fs(12), color: 'var(--text-muted)' }}>{levelNotice}</span>}
        </div>
      </div>

      <div ref={setChatBox} style={styles.chatBoxFull} className="chat-transcript">
        {chatHistory.length === 0 && !isChatLoading && (
          <div className="chat-empty-state" style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ marginBottom: '14px' }}>Bắt đầu cuộc trò chuyện — thử một gợi ý:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {chatSuggestions.map((s) => (
                <button key={s} className="suggestion-chip" style={styles.suggestionChip} onClick={() => setChatInput(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

       {chatHistory.map((msg, i) => (
  <div
    key={i}
    style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
      gap: '6px',
      alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
    }}
  >
       <div
         style={{
           display: 'flex',
           width: '100%',
           justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
           alignItems: 'flex-end',
           gap: '6px'
         }}
       >
      {msg.role === 'model' && (
        <button
          style={styles.speakButton}
          onClick={() => {
            if (!voiceModeRef.current) {
              speakNaturalText(msg.text, speechLang, undefined, settings.speechVoice)
              return
            }
            speechControlRef.current?.stop()
            setIsVoiceSpeaking(true)
            speakNaturalText(msg.text, speechLang, () => {
              setIsVoiceSpeaking(false)
              scheduleVoiceRestart()
            }, settings.speechVoice)
          }}
          title="Nghe đọc"
        >
          <Icon name="speaker" size={14} />
        </button>
      )}
      <div
        className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}
        style={{
          ...styles.chatBubble,
          background: 'var(--bubble-ai-bg)',
          color: 'var(--text)'
        }}
      >
        {formatMessage(msg.text)}
      </div>
    </div>
    {settings.showInlineMistakes && msg.mistakes && msg.mistakes.length > 0 && (
      <div style={styles.mistakeBox}>
        {msg.mistakes.map((m, j) => (
          <div key={j} style={{ marginBottom: j < msg.mistakes.length - 1 ? '8px' : 0 }}>
            <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
  <Icon name="warning" size={14} /> {m.category}:
</strong>{' '}
"{m.original}" → <strong>"{m.corrected}"</strong>
            <div style={{ fontSize: fs(13), color: 'var(--text-soft)', marginTop: '2px' }}>{m.explanation}</div>
          </div>
        ))}
      </div>
    )}
  </div>
))}
        {isChatLoading && <TypingIndicator />}
      </div>

           <div className="chat-composer" style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '980px' }}>
        <input
          className="chat-input"
          style={{ ...styles.input, width: '100%' }}
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Nhập tin nhắn..."
          disabled={isChatLoading}
        />
        <button
    className="chat-send"
    style={{
      ...styles.sendButton,
      ...(isChatLoading || !chatInput.trim() ? { opacity: 0.4, cursor: 'not-allowed' } : {})
    }}
    onClick={handleSendMessage}
    disabled={isChatLoading || !chatInput.trim()}
    title="Gửi"
    aria-label="Gửi"
  >
    <Icon name="send" size={20} />
  </button>
</div>
    </main>

      {/* Panel thống kê phải */}
    <aside className="right-panel" style={styles.rightPanel}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <SegmentedControl
          value={rightTab}
          onChange={setRightTab}
          options={[
            { value: 'today', label: 'Hôm nay' },
            { value: 'progress', label: 'Tiến bộ' }
          ]}
        />
      </div>

      {rightTab === 'progress' ? (
        <ProgressPanel
          profileId={profileId}
          profile={profile}
          refreshKey={`${dailyStats.totalMessages}-${mistakes.length}`}
          onOpenFull={() => setShowProgress(true)}
        />
      ) : (
        <>
          <div className="stat-card" style={styles.statCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Icon name="flame" size={18} />
              <span style={{ fontSize: fs(18), fontWeight: '700' }}>{dailyStats.streak}</span>
              <span style={{ fontSize: fs(12), color: 'var(--text-muted)' }}>ngày liên tiếp</span>
            </div>
            <div style={{ fontSize: fs(12), color: 'var(--text-muted)', marginBottom: '4px' }}>
              Mục tiêu hôm nay: {Math.min(dailyStats.messagesToday, DAILY_GOAL)}/{DAILY_GOAL} tin nhắn
            </div>
            <div style={{ width: '100%', height: '6px', borderRadius: '999px', background: 'var(--border-soft)', overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(100, (dailyStats.messagesToday / DAILY_GOAL) * 100)}%`,
                height: '100%',
                background: 'var(--accent)',
                borderRadius: '999px'
              }} />
            </div>
          </div>

          <div className="stat-card" style={styles.statCard}>
            <div style={{ fontSize: fs(32), fontWeight: '700', color: 'var(--accent)' }}>{mistakes.length}</div>
            <div style={{ fontSize: fs(13), color: 'var(--text-muted)' }}>lỗi đã ghi nhận</div>
          </div>

          <div className="stat-card" style={styles.statCard}>
            <div style={{ fontSize: fs(13), fontWeight: '700', marginBottom: '8px' }}>Lỗi hay gặp nhất</div>
            {categoryCounts.length === 0 && <div style={{ fontSize: fs(13), color: 'var(--text-muted)' }}>Chưa có dữ liệu</div>}
            {categoryCounts.map(([cat, count]) => (
              <div key={cat} style={{ fontSize: fs(13), display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>{cat}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>

          <div className="stat-card" style={styles.statCard}>
            <div style={{ fontSize: fs(13), fontWeight: '700', marginBottom: '8px' }}>Lỗi gần đây</div>
            {mistakes.length === 0 && <div style={{ fontSize: fs(13), color: 'var(--text-muted)' }}>Chưa có lỗi nào</div>}
            {mistakes.slice(0, 3).map((m) => (
              <div key={m.id} style={{ fontSize: fs(13), marginBottom: '8px' }}>
                <span style={{ color: 'var(--danger)', textDecoration: 'line-through' }}>{m.original_text}</span>
                {' → '}
                <span style={{ color: '#27ae60', fontWeight: '600' }}>{m.corrected_text}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </aside>
  </div>
)
}

function renderInline(str, prefix) {
  return str.split(/(\*\*.*?\*\*)/g).map((p, i) =>
    p.startsWith('**') && p.endsWith('**') && p.length > 4 ? <strong key={`${prefix}-${i}`}>{p.slice(2, -2)}</strong> : p
  )
}

function formatMessage(text) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    if (!line.trim()) return <div key={i} style={{ height: '8px' }} />
    const parts = line.split(/(\([^()]*\))/g)
    return (
      <div key={i} style={{ marginBottom: '4px' }}>
        {parts.map((part, j) =>
          part.startsWith('(') && part.endsWith(')') ? (
            <span key={j} style={{ opacity: 0.7, fontSize: '0.92em' }}>{renderInline(part, j)}</span>
          ) : (
            <span key={j}>{renderInline(part, j)}</span>
          )
        )}
      </div>
    )
  })
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100vw',
    gap: '24px',
    fontFamily: "'Segoe UI', sans-serif",
    fontSize: fs(16),
    background: 'var(--bg)',
    color: 'var(--text)',
    padding: '20px',
    boxSizing: 'border-box',
    textAlign: 'center'
  },
  question: {
    fontFamily: "'Segoe UI', sans-serif",
    fontSize: fs(32),
    fontWeight: '700',
    color: 'var(--text-strong)',
    margin: 0
  },
  input: {
    padding: '14px 20px',
    fontSize: fs(16),
    width: '320px',
    borderRadius: '999px',
    border: '1.5px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    outline: 'none',
    textAlign: 'center'
  },
  textarea: {
    padding: '14px 20px',
    fontSize: fs(16),
    width: '380px',
    height: '110px',
    borderRadius: '20px',
    border: '1.5px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    fontFamily: "'Segoe UI', sans-serif",
    outline: 'none',
    resize: 'none'
  },
    button: {
    padding: '11px 26px',
    fontSize: fs(15),
    fontWeight: '600',
    borderRadius: '999px',
    border: 'none',
    background: 'var(--accent)',
    color: 'var(--btn-text)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  backButton: {
    padding: '11px 16px',
    fontSize: fs(14),
    fontWeight: '600',
    borderRadius: '999px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px'
  },
  chatBubble: {
    padding: '10px 16px',
    lineHeight: '1.5',
    borderRadius: '16px',
    maxWidth: '75%',
    fontSize: fs(15),
    textAlign: 'center'
  },
  reviewBox: {
    width: '500px',
    maxHeight: '400px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  mistakeCard: {
    padding: '14px 18px',
    borderRadius: '14px',
    border: '1.5px solid var(--border-soft)',
    background: 'var(--surface-soft)',
    textAlign: 'left'
  },
  mistakeCategory: {
    fontSize: fs(12),
    fontWeight: '700',
    textTransform: 'uppercase',
    color: 'var(--accent)',
    letterSpacing: '0.5px'
  },
  reviewLink: {
    background: 'none',
    border: 'none',
    color: 'var(--accent)',
    fontSize: fs(14),
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: 0
  },
  appLayout: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    boxSizing: 'border-box',
    fontFamily: "'Segoe UI', sans-serif",
    fontSize: fs(16),
    background: 'var(--bg)',
    color: 'var(--text)'
  },
  sidebar: {
    width: '260px',
    flexShrink: 0,
    padding: '32px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    background: 'var(--panel)',
    borderRight: '1px solid var(--border-soft)',
    boxSizing: 'border-box'
  },
  avatar: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    background: 'var(--accent)',
    color: 'var(--btn-text)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '30px',
    fontWeight: '700'
  },
  levelBadge: {
    padding: '6px 14px',
    borderRadius: '999px',
    background: 'var(--accent-soft)',
    color: 'var(--accent-text)',
    fontWeight: '700',
    fontSize: fs(13)
  },
  sidebarButton: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1.5px solid var(--border-soft)',
    background: 'var(--surface)',
    color: 'var(--text)',
    cursor: 'pointer',
    fontSize: fs(14),
    fontWeight: '600',
    textAlign: 'left'
  },
  mainArea: {
    flex: 1,
    minWidth: 0,
    height: '100vh',
    boxSizing: 'border-box',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px'
  },
  chatBoxFull: {
    width: '100%',
    maxWidth: '980px',
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '20px',
    borderRadius: '20px',
    background: 'var(--surface)',
    boxShadow: 'var(--shadow)',
    boxSizing: 'border-box'
  },
    rightPanel: {
    width: '300px',
    flexShrink: 0,
    padding: '28px 20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    gap: '10px',
    background: 'var(--panel)',
    borderLeft: '1px solid var(--border-soft)',
    boxSizing: 'border-box',
    overflowY: 'auto'
  },
  statCard: {
    flexShrink: 0,
    padding: '12px 16px',
    borderRadius: '14px',
    background: 'var(--surface)',
    border: '1.5px solid var(--border-soft)',
    textAlign: 'left'
  },
  suggestionChip: {
    padding: '8px 14px',
    borderRadius: '999px',
    border: '1.5px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    cursor: 'pointer',
    fontSize: fs(13)
  },
  mistakeBox: {
    padding: '10px 14px',
    borderRadius: '10px',
    maxWidth: '75%',
    fontSize: fs(14),
    background: 'var(--warn-bg)',
    border: '1px solid var(--warn-border)',
    color: 'var(--warn-text)',
    textAlign: 'left'
  },
  
    dueBadge: {
    minWidth: '22px',
    height: '22px',
    padding: '0 7px',
    borderRadius: '999px',
    background: '#c0392b',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '700',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box'
  },
    dangerButton: {
    padding: '10px 24px',
    fontSize: fs(14),
    fontWeight: '700',
    borderRadius: '999px',
    border: 'none',
    background: '#c0392b',
    color: '#ffffff',
    cursor: 'pointer'
  },
    sendButton: {
    width: '48px',
    height: '48px',
    flexShrink: 0,
    borderRadius: '50%',
    border: 'none',
    background: 'var(--accent)',
    color: 'var(--btn-text)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.2s ease'
  },
    convSection: {
    flex: 1,
    width: '100%',
    minHeight: 0,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginTop: '8px'
  },
  newChatButton: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '12px',
    border: '1.5px dashed var(--border)',
    background: 'transparent',
    color: 'var(--text)',
    cursor: 'pointer',
    fontSize: fs(13),
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px'
  },
  convItem: {
    width: '100%',
    padding: '9px 10px',
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '6px',
    boxSizing: 'border-box'
  },
  convItemActive: {
    background: 'var(--accent-soft)'
  },
  convTitle: {
    fontSize: fs(13),
    color: 'var(--text)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textAlign: 'left',
    flex: 1
  },
  convDelete: {
    flexShrink: 0,
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    opacity: 0.6
  },
    loginWrapper: {
    width: '380px',
    maxWidth: '92vw',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  loginCard: {
    padding: '20px',
    borderRadius: '20px',
    background: 'var(--surface)',
    border: '1.5px solid var(--border-soft)',
    boxShadow: 'var(--shadow)',
    boxSizing: 'border-box',
    textAlign: 'left'
  },
  loginCardTitle: {
    fontSize: fs(13),
    fontWeight: '700',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '12px'
  },
  accountRow: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '14px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    textAlign: 'left',
    boxSizing: 'border-box'
  },
  accountAvatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: 'var(--accent)',
    color: 'var(--btn-text)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: fs(15),
    flexShrink: 0
  },
  accountInfo: { display: 'flex', flexDirection: 'column', gap: '2px' },
  accountName: { fontSize: fs(15), fontWeight: '600', color: 'var(--text)' },
  accountLevel: { fontSize: fs(12), color: 'var(--text-muted)' },

    speakButton: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: '1.5px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },

    sidebarV2: {
    width: '260px',
    flexShrink: 0,
    height: '100vh',
    padding: '14px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    background: 'var(--panel)',
    borderRight: '1px solid var(--border-soft)',
    boxSizing: 'border-box'
  },
  navList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    marginBottom: '8px'
  },
  navItem: {
    width: '100%',
    padding: '9px 10px',
    borderRadius: '10px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text)',
    cursor: 'pointer',
    fontSize: fs(14),
    fontWeight: '500',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    boxSizing: 'border-box'
  },
  sectionLabel: {
    fontSize: fs(11),
    fontWeight: '700',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    padding: '6px 10px 4px'
  },
  convSectionV2: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  profileBar: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '12px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    boxSizing: 'border-box',
    textAlign: 'left'
  },
  profileAvatarSmall: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'var(--accent)',
    color: 'var(--btn-text)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: fs(14),
    flexShrink: 0
  },
  profileInfo: { display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 },
  profileName: {
    fontSize: fs(14),
    fontWeight: '600',
    color: 'var(--text)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  profileLevelText: {
    fontSize: fs(11),
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  profileMenu: {
    position: 'absolute',
    bottom: 'calc(100% + 6px)',
    left: 0,
    width: '100%',
    padding: '6px',
    borderRadius: '12px',
    background: 'var(--surface)',
    border: '1.5px solid var(--border-soft)',
    boxShadow: 'var(--shadow)',
    zIndex: 1100,
    boxSizing: 'border-box'
  },
  menuOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1050
  },
}

const practiceStyles = {
  card: {
    width: '100%',
    maxWidth: '520px',
    padding: '16px 20px',
    borderRadius: '16px',
    border: '1.5px solid var(--border-soft)',
    background: 'var(--surface)',
    boxShadow: 'var(--shadow)',
    textAlign: 'left',
    boxSizing: 'border-box'
  },
  sentence: {
    fontSize: fs(20),
    fontWeight: '600',
    color: 'var(--text-strong)',
    lineHeight: 1.4
  },
  feedback: {
    width: '100%',
    maxWidth: '520px',
    padding: '12px 16px',
    borderRadius: '12px',
    textAlign: 'left',
    boxSizing: 'border-box'
  },
  ok: { background: 'rgba(39,174,96,0.12)', border: '1px solid rgba(39,174,96,0.5)' },
  bad: { background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.5)' }
}

const vocabStyles = {
  card: {
    position: 'relative',
    width: '100%',
    maxWidth: '520px',
    minHeight: '220px',
    padding: '28px 24px 40px',
    borderRadius: '20px',
    border: '1.5px solid var(--border-soft)',
    background: 'var(--surface)',
    boxShadow: 'var(--shadow)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    cursor: 'pointer',
    boxSizing: 'border-box',
    textAlign: 'center'
  },
  hint: {
    position: 'absolute',
    bottom: '12px',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: fs(12),
    color: 'var(--text-muted)'
  },
  cardSpeak: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '1.5px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  navBtn: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    border: '1.5px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
}

const settingsStyles = {
  gear: {
    position: 'fixed',
    top: '12px',
    right: '16px',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '1.5px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    fontSize: '18px',
    cursor: 'pointer',
    zIndex: 1000,
    boxShadow: 'var(--shadow)'
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000
  },
  modal: {
    width: '440px',
    maxWidth: '92vw',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '24px',
    borderRadius: '20px',
    background: 'var(--surface)',
    color: 'var(--text)',
    boxShadow: 'var(--shadow)',
    fontFamily: "'Segoe UI', sans-serif",
    textAlign: 'left',
    boxSizing: 'border-box'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '18px',
    cursor: 'pointer'
  },
  group: { marginBottom: '20px' },
  label: { fontSize: fs(14), fontWeight: '700', marginBottom: '8px' },
  optionRow: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  optionButton: {
    padding: '8px 14px',
    borderRadius: '999px',
    border: '1.5px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text)',
    fontSize: fs(13),
    cursor: 'pointer'
  },
  optionActive: {
    background: 'var(--accent)',
    borderColor: 'var(--accent)',
    color: 'var(--btn-text)'
  },
  preview: {
    marginTop: '12px',
    padding: '10px 14px',
    borderRadius: '12px',
    background: 'var(--surface-soft)',
    border: '1.5px solid var(--border-soft)',
    fontSize: fs(15)
  },
  toggleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px'
  }
}

const rowStyles = {
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 0',
    borderBottom: '1px solid var(--border-soft)'
  },
  rowLast: { borderBottom: 'none', paddingBottom: '4px' },
  textCol: { minWidth: 0, flex: 1 },
  title: { fontSize: fs(14), fontWeight: '600', color: 'var(--text)' },
  desc: { fontSize: fs(12), color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.4 },
  segmented: {
    display: 'inline-flex',
    padding: '3px',
    gap: '2px',
    borderRadius: '10px',
    background: 'var(--surface-soft)',
    border: '1px solid var(--border-soft)',
    flexShrink: 0
  },
  segment: {
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid transparent',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: fs(13),
    fontWeight: '500',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
  },
  segmentActive: {
    background: 'var(--border)',
    color: 'var(--text-strong)'
  }
}

function SegmentedControl({ value, options, onChange }) {
  return (
    <div style={rowStyles.segmented} role="group">
      {options.map((o) => (
        <button
          key={o.value}
          title={o.title || o.label}
          aria-pressed={value === o.value}
          style={{ ...rowStyles.segment, ...(value === o.value ? rowStyles.segmentActive : {}) }}
          onClick={() => onChange(o.value)}
        >
          {o.icon && <Icon name={o.icon} size={15} />}
          {o.label}
        </button>
      ))}
    </div>
  )
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: '40px',
        height: '22px',
        borderRadius: '999px',
        border: 'none',
        padding: 0,
        position: 'relative',
        cursor: 'pointer',
        flexShrink: 0,
        background: checked ? 'var(--accent)' : 'var(--border)',
        transition: 'background 0.2s ease'
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '3px',
          left: checked ? '21px' : '3px',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: '#ffffff',
          transition: 'left 0.2s ease'
        }}
      />
    </button>
  )
}


function MicrophoneTest() {
  const [active, setActive] = useState(false)
  const [level, setLevel] = useState(0)
  const [message, setMessage] = useState('')
  const streamRef = useRef(null)
  const contextRef = useRef(null)
  const frameRef = useRef(null)

  const stop = useCallback(() => {
    if (frameRef.current != null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    contextRef.current?.close().catch(() => {})
    contextRef.current = null
    setActive(false)
    setLevel(0)
  }, [])

  useEffect(() => () => {
    if (frameRef.current != null) cancelAnimationFrame(frameRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    contextRef.current?.close().catch(() => {})
  }, [])

  const start = async () => {
    setMessage('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const AudioContext = window.AudioContext || window.webkitAudioContext
      const context = new AudioContext()
      contextRef.current = context
      const analyser = context.createAnalyser()
      analyser.fftSize = 512
      context.createMediaStreamSource(stream).connect(analyser)
      const samples = new Uint8Array(analyser.fftSize)
      setActive(true)
      const measure = () => {
        analyser.getByteTimeDomainData(samples)
        const rms = Math.sqrt(samples.reduce((sum, value) => sum + ((value - 128) / 128) ** 2, 0) / samples.length)
        setLevel(Math.min(100, Math.round(rms * 500)))
        frameRef.current = requestAnimationFrame(measure)
      }
      measure()
    } catch (error) {
      setMessage(error?.name === 'NotAllowedError'
        ? 'Hãy cho phép ứng dụng truy cập micro trong cài đặt quyền của Windows.'
        : 'Không tìm thấy micro hoặc không thể mở thiết bị âm thanh.')
      stop()
    }
  }

  return (
    <div style={{ ...rowStyles.row, alignItems: 'flex-start', flexDirection: 'column', gap: '10px' }}>
      <div style={rowStyles.textCol}>
        <div style={rowStyles.title}>Kiểm tra micro</div>
        <div style={rowStyles.desc}>Nói thử để xem ứng dụng có nhận được âm thanh từ micro không.</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
        <button
          type="button"
          onClick={active ? stop : start}
          style={{ ...notesStyles.primaryBtn, padding: '8px 14px' }}
        >
          {active ? 'Dừng kiểm tra' : 'Bắt đầu kiểm tra'}
        </button>
        <div style={{ flex: 1, height: '9px', borderRadius: '999px', background: 'var(--border-soft)', overflow: 'hidden' }}>
          <div style={{ width: `${level}%`, height: '100%', borderRadius: 'inherit', background: 'var(--accent)', transition: 'width 80ms linear' }} />
        </div>
      </div>
      <div role="status" aria-live="polite" style={{ ...rowStyles.desc, color: message ? 'var(--warn-text)' : 'var(--text-muted)' }}>
        {message || (active ? (level > 2 ? 'Micro đang nhận âm thanh.' : 'Đang mở micro… hãy nói thử.') : '')}
      </div>
    </div>
  )
}

function SettingsModal({ settings, onChange, onClose, profileId }) {
  const [confirmClearMemory, setConfirmClearMemory] = useState(false)
  const [clearingMemory, setClearingMemory] = useState(false)
  const [memoryMessage, setMemoryMessage] = useState('')
  const [voicePreview, setVoicePreview] = useState('')

  const previewVoice = async () => {
    setVoicePreview('Đang tải và phát giọng AI Kokoro… lần đầu có thể mất một chút thời gian.')
    const result = await previewKokoroVoice(
      'Hi! It is nice to meet you. What would you like to talk about today?',
      settings.speechVoice || 'af_heart',
      () => setVoicePreview('Đã phát xong giọng AI Kokoro.')
    )
    if (!result.success && !result.cancelled) {
      console.error('Kokoro voice preview failed:', result.error)
      setVoicePreview(`Không phát được giọng AI Kokoro (${result.error}). Không dùng giọng TTS mặc định.`)
    }
  }

  const clearMemory = async () => {
    if (!profileId || clearingMemory) return
    setClearingMemory(true)
    setMemoryMessage('')
    try {
      const current = await window.api.getLearnerNotes({ profileId })
      const result = await window.api.saveLearnerNotes({
        profileId,
        notes: '',
        enabled: current.enabled !== false
      })
      if (!result.success) throw new Error('Could not clear learner memory')
      setMemoryMessage('Đã xoá bộ nhớ AI.')
      setConfirmClearMemory(false)
    } catch {
      setMemoryMessage('Chưa xoá được bộ nhớ. Vui lòng thử lại.')
    } finally {
      setClearingMemory(false)
    }
  }

  return (
    <>
      <div style={settingsStyles.overlay} onClick={onClose}>
      <div style={{ ...settingsStyles.modal, width: '520px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ ...settingsStyles.header, marginBottom: '4px' }}>
          <h3 style={{ margin: 0, fontSize: fs(20), fontWeight: '700' }}>Cài đặt</h3>
          <button style={{ ...settingsStyles.closeButton, display: 'flex', alignItems: 'center' }} onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>

        <div style={rowStyles.row}>
          <div style={rowStyles.textCol}>
            <div style={rowStyles.title}>Giao diện</div>
          </div>
          <SegmentedControl
            value={settings.theme}
            onChange={(v) => onChange({ theme: v })}
            options={[
              { value: 'system', icon: 'monitor', title: 'Theo hệ thống' },
              { value: 'light', icon: 'sun', title: 'Sáng' },
              { value: 'dark', icon: 'moon', title: 'Tối' }
            ]}
          />
        </div>

        <div style={rowStyles.row}>
          <div style={rowStyles.textCol}>
            <div style={rowStyles.title}>Cỡ chữ</div>
            <div style={{ ...rowStyles.desc, fontSize: fs(14) }}>I like learning English every day.</div>
          </div>
          <SegmentedControl
            value={settings.fontSize}
            onChange={(v) => onChange({ fontSize: v })}
            options={[
              { value: 'small', label: 'Nhỏ' },
              { value: 'medium', label: 'Vừa' },
              { value: 'large', label: 'Lớn' },
              { value: 'xlarge', label: 'Rất lớn' }
            ]}
          />
        </div>

        <div style={{ ...rowStyles.row, ...rowStyles.rowLast }}>
          <div style={rowStyles.textCol}>
            <div style={rowStyles.title}>Gợi ý sửa lỗi trong khung chat</div>
            <div style={rowStyles.desc}>Lỗi vẫn được lưu vào Sổ tay dù tắt</div>
          </div>
          <ToggleSwitch
            checked={settings.showInlineMistakes}
            onChange={(v) => onChange({ showInlineMistakes: v })}
          />
        </div>
        <div style={{ ...rowStyles.row, alignItems: 'flex-start' }}>
          <div style={rowStyles.textCol}>
            <div style={rowStyles.title}>Giọng nói AI</div>
            <div style={rowStyles.desc}>Tạo giọng tiếng Anh tự nhiên ngay trên thiết bị. Tải model một lần khi dùng lần đầu.</div>
            {voicePreview && <div role="status" style={{ ...rowStyles.desc, marginTop: 6 }}>{voicePreview}</div>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 155 }}>
            <select
              aria-label="Chọn giọng nói AI"
              value={settings.speechVoice || 'af_heart'}
              onChange={(event) => onChange({ speechVoice: event.target.value })}
              style={{ padding: '9px 10px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: fs(13) }}
            >
              <option value="af_heart">Heart · Mỹ, nữ</option>
              <option value="af_bella">Bella · Mỹ, nữ</option>
              <option value="af_nicole">Nicole · Mỹ, nữ</option>
              <option value="am_puck">Puck · Mỹ, nam</option>
              <option value="am_michael">Michael · Mỹ, nam</option>
              <option value="bf_emma">Emma · Anh, nữ</option>
              <option value="bm_george">George · Anh, nam</option>
            </select>
            <button type="button" className="qghost" style={{ ...quizStyles.ghost, padding: '8px 12px', fontSize: fs(13) }} onClick={previewVoice}>
              Nghe thử giọng
            </button>
          </div>
        </div>
        <MicrophoneTest />
        <div style={{ ...rowStyles.row, ...rowStyles.rowLast, alignItems: 'flex-start' }}>
          <div style={rowStyles.textCol}>
            <div style={rowStyles.title}>Bộ nhớ AI</div>
            <div style={rowStyles.desc}>Xoá ghi chú AI đã lưu về bạn. Lịch sử tin nhắn sẽ không bị xoá.</div>
            {memoryMessage && <div role="status" style={{ ...rowStyles.desc, color: 'var(--text)' }}>{memoryMessage}</div>}
          </div>
          <button
            type="button"
            style={{ ...styles.dangerButton, padding: '8px 14px', fontSize: fs(13), flexShrink: 0, opacity: !profileId || clearingMemory ? 0.55 : 1 }}
            onClick={() => setConfirmClearMemory(true)}
            disabled={!profileId || clearingMemory}
          >
            <Icon name="trash" size={14} /> Xoá bộ nhớ
          </button>
        </div>
      </div>
      </div>
      {confirmClearMemory && (
        <div style={{ ...settingsStyles.overlay, zIndex: 2100 }} onClick={() => !clearingMemory && setConfirmClearMemory(false)}>
          <div style={{ ...settingsStyles.modal, width: '380px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 10px', fontSize: fs(18), fontWeight: '700' }}>Xoá bộ nhớ AI?</h3>
            <p style={{ margin: '0 0 20px', fontSize: fs(13), color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Ghi chú cá nhân AI đã lưu sẽ bị xoá. Tin nhắn và lịch sử trò chuyện vẫn được giữ.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="qghost" style={quizStyles.ghost} onClick={() => setConfirmClearMemory(false)} disabled={clearingMemory}>Huỷ</button>
              <button style={styles.dangerButton} onClick={clearMemory} disabled={clearingMemory}>
                {clearingMemory ? 'Đang xoá...' : 'Xoá bộ nhớ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function App() {
  const [settings, setSettings] = useState(loadSettings)
  const [showSettings, setShowSettings] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [activeProfileId, setActiveProfileId] = useState(null)
  useLayoutEffect(() => {
    const apply = () => {
      const isDark =
        settings.theme === 'dark' ||
        (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      const root = document.documentElement
      root.dataset.theme = isDark ? 'dark' : 'light'
      root.style.colorScheme = isDark ? 'dark' : 'light'
      Object.entries(isDark ? themes.dark : themes.light).forEach(([k, v]) =>
        root.style.setProperty(k, v)
      )
      root.style.setProperty('--fs', fontScales[settings.fontSize] || '1')
    }

    apply()
    try {
      localStorage.setItem('appSettings', JSON.stringify(settings))
    } catch {
      // bỏ qua nếu không lưu được
    }

    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [settings])

  const updateSettings = (patch) => setSettings((prev) => ({ ...prev, ...patch }))

 return (
    <>
      <style>{scrollbarStyle}</style>
      <AppContent
        settings={settings}
        onOpenSettings={() => setShowSettings(true)}
        onLoggedInChange={setLoggedIn}
        onActiveProfileChange={setActiveProfileId}
      />
      {!loggedIn && (
        <button
          style={{ ...settingsStyles.gear, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowSettings(true)}
          title="Cài đặt"
        >
          <Icon name="settings" size={20} />
        </button>
      )}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onChange={updateSettings}
          onClose={() => setShowSettings(false)}
          profileId={activeProfileId}
        />
      )}
    </>
  )
}

export default App
