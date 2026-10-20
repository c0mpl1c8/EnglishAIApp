import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";

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
    '--shadow': '0 8px 30px rgba(0, 0, 0, 0.08)'
  },
  dark: {
    '--bg': 'radial-gradient(circle at 30% 30%, #2e1f5e 0%, #12111a 55%, #0b0b10 100%)',
    '--surface': '#1c1b26',
    '--surface-soft': '#22212e',
    '--panel': 'rgba(28,27,38,0.7)',
    '--text': '#ececf1',
    '--text-strong': '#ffffff',
    '--text-soft': '#b8b8c4',
    '--text-muted': '#9a9aab',
    '--border': '#3a3948',
    '--border-soft': '#2c2b3a',
    '--btn-border': '#ececf1',
    '--btn-text': '#ececf1',
    '--bubble-user-bg': '#6366f1',
    '--bubble-user-text': '#ffffff',
    '--bubble-ai-bg': '#2a2937',
    '--accent': '#818cf8',
    '--accent-soft': '#26254a',
    '--accent-text': '#a5b4fc',
    '--dot-off': '#3a3948',
    '--warn-bg': '#3a3115',
    '--warn-border': '#6b5a1e',
    '--warn-text': '#f5e6b0',
    '--shadow': '0 8px 30px rgba(0, 0, 0, 0.5)'
  }
}

const defaultSettings = { theme: 'light', fontSize: 'medium', showInlineMistakes: true }

function loadSettings() {
  try {
    const saved = localStorage.getItem('appSettings')
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings
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
  button:disabled:not(.quiz-opt) { opacity: 0.5; cursor: not-allowed; }
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

function cleanForSpeech(text) {
  return text.replace(/\*\*/g, '').replace(/\([^()]*\)/g, '').replace(/\s+/g, ' ').trim()
}

function speakText(text, lang) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(cleanForSpeech(text))
  utter.lang = lang
  window.speechSynthesis.speak(utter)
}

const topicOptions = [
  { id: 'free', label: 'Tự do (không chủ đề)' },
  { id: 'gọi món ăn ở nhà hàng', label: '🍽️ Gọi món ăn' },
  { id: 'hỏi đường và đi du lịch', label: '🧭 Hỏi đường & du lịch' },
  { id: 'phỏng vấn xin việc', label: '💼 Phỏng vấn xin việc' },
  { id: 'trò chuyện xã giao hàng ngày', label: '💬 Giao tiếp hàng ngày' },
  { id: 'mua sắm ở cửa hàng', label: '🛍️ Mua sắm' }
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
    color: '#ffffff',
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
    color: '#ffffff'
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
 chipOn: { background: 'var(--accent)', border: '1.5px solid var(--accent)', color: '#ffffff' },
  primary: {
    padding: '11px 26px',
    borderRadius: '999px',
    border: 'none',
    background: 'var(--accent)',
    color: '#ffffff',
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

function useSpeechInput(lang, onResult) {
  const [listening, setListening] = useState(false)
  const recRef = useRef(null)
  const supported = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

  const start = () => {
    if (!supported) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = lang
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onresult = (e) => onResult(e.results[0][0].transcript)
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recRef.current = rec
    rec.start()
    setListening(true)
  }

  const stop = () => {
    recRef.current?.stop()
    setListening(false)
  }

  return { supported, listening, start, stop }
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

      {notice && <p style={{ margin: 0, color: '#c0392b', fontSize: fs(14) }}>{notice}</p>}

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

function QuizScreen({ profileId, profile, cefrLevel, topic, label, count, preset, onExit }) {
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
    const res = await window.api.generateQuiz({
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
    window.api.recordSkillEvent({
      profileId,
      skill: q.skill,
      correct: ok,
      source: preset ? 'retry' : 'quiz',
      question: preset ? undefined : q.question
    })
    setLog((l) => [
      ...l,
      { question: q.question, options: q.options, answer: q.answer, picked: i, explanation: q.explanation, skill: q.skill }
    ])
    setPicked(i)
    if (ok) setScore((s) => s + 1)
    setPhase('answered')
  }

  const finish = () => {
    if (!preset && !savedRef.current && log.length > 0) {
      savedRef.current = true
      window.api.saveQuizAttempt({ profileId, mode: 'quiz', label, details: log })
    }
    setPhase('done')
  }

  const next = () => {
    if (index + 1 >= questions.length) {
      finish()
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

  if (phase === 'done') {
    const pct = Math.round((score / questions.length) * 100)
    const msg = pct >= 80 ? 'Rất tốt!' : pct >= 50 ? 'Khá ổn, luyện thêm một chút nhé.' : 'Chưa vững, hãy xem lại phần giải thích và thử lại.'
    return wrap(
      <>
        <h2 style={styles.question}>Kết quả</h2>
        <div style={{ fontSize: fs(40), fontWeight: '700', color: 'var(--accent)' }}>{score}/{questions.length}</div>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>{msg}</p>
        {!preset && (
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: fs(12) }}>
            Bài này đã được lưu, xem lại ở mục "Xem lại bài đã làm" trong Ôn tập.
          </p>
        )}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="qghost" style={quizStyles.ghost} onClick={onExit}>Quay lại</button>
          <button className="qprimary" style={quizStyles.primary} onClick={load}>
            {preset ? 'Làm lại' : 'Bộ câu hỏi mới'}
          </button>
        </div>
      </>
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

      <QuestionBlock q={q} picked={picked} answered={answered} onChoose={choose} />

      <div style={{ width: '100%', maxWidth: '520px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="qghost" style={quizStyles.ghost} onClick={onExit}>
          <Icon name="back" size={16} /> Thoát
        </button>
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
  return p >= 0.8 ? '#27ae60' : p >= 0.5 ? '#e0a100' : '#c0392b'
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
          <div style={{ fontWeight: '700' }}>{picked === q.answer ? 'Chính xác!' : `Đáp án đúng: ${q.options[q.answer]}`}</div>
          {q.explanation && <div style={{ marginTop: '6px', fontSize: fs(13) }}>{q.explanation}</div>}
        </div>
      )}
    </>
  )
}

function AdaptiveQuizScreen({ profileId, profile, cefrLevel, count, onExit }) {
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
  const savedRef = useRef(false)

  const saveAttempt = (list) => {
    if (savedRef.current || list.length === 0) return
    savedRef.current = true
    window.api.saveQuizAttempt({
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
        difficulty: a.difficulty
      }))
    })
  }
  const load = async () => {
    setPhase('loading')
    setErrMsg('')
    savedRef.current = false
    const res = await window.api.generateAdaptiveQuiz({
      profileId,
      targetLanguage: profile.targetLanguage,
      nativeLanguage: profile.nativeLanguage,
      cefrLevel
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
     window.api.recordSkillEvent({ profileId, skill: q.skill, correct: ok, source: 'adaptive', question: q.question })
    setAsked((a) => [
      ...a,
      {
        skill: q.skill,
        skillLabel: q.skillLabel,
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

  const next = () => {
    if (asked.length >= total) {
      saveAttempt(asked)
      setPhase('done')
      return
    }
    const nx = pickNextQuestion(pool, used, target, askedBySkill(), current?.q.skill)
    if (!nx) {
      saveAttempt(asked)
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

  const wrap = (children) => (
    <div style={styles.container} className="fade-in">
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

  if (phase === 'intro') {
    return wrap(
      <>
        <h2 style={styles.question}>Luyện điểm yếu của tôi</h2>
        <div style={practiceStyles.card}>
          <div style={{ fontSize: fs(14), fontWeight: '700', marginBottom: '8px' }}>Vì sao AI chọn bài này?</div>
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
            Kết quả đã được cộng vào bản đồ kỹ năng trong mục Tiến bộ.
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="qghost" style={quizStyles.ghost} onClick={onExit}>Quay lại</button>
          <button className="qprimary" style={quizStyles.primary} onClick={load}>Bộ mới</button>
        </div>
      </>
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
        <strong style={{ fontSize: fs(12), color: ok ? '#27ae60' : '#c0392b' }}>
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
                  {fmtAt(a.at)} · {a.mode === 'adaptive' ? 'Luyện điểm yếu' : 'Trắc nghiệm'}
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

function ReviewHub({ profileId, profile, cefrLevel, dueCount, mistakeCount, onRefresh, onExit }) {
  const [mode, setMode] = useState('hub') // hub | mistakes | setup | quiz | history | retry
  const [quiz, setQuiz] = useState(null)
  const [retryQs, setRetryQs] = useState([])

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
        onBack={() => setMode('hub')}
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
        onBack={() => setMode('hub')}
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

  return (
    <StepCard title="Ôn tập" subtitle="Chọn cách bạn muốn luyện hôm nay.">
      <style>{dropdownCss}</style>

      <button className="level-card" style={hubStyles.card} onClick={() => setMode('mistakes')}>
        <span style={hubStyles.icon}><Icon name="repeat" size={20} /></span>
        <span style={hubStyles.text}>
          <span style={hubStyles.title}>Ôn lỗi cũ</span>
          <span style={hubStyles.desc}>AI đưa lại những lỗi bạn từng mắc theo lịch giãn cách</span>
        </span>
        {dueCount > 0 && <span style={styles.dueBadge}>{dueCount > 99 ? '99+' : dueCount}</span>}
      </button>

      <button className="level-card" style={hubStyles.card} onClick={() => setMode('setup')}>
        <span style={hubStyles.icon}><Icon name="check" size={20} /></span>
        <span style={hubStyles.text}>
          <span style={hubStyles.title}>Bài tập trắc nghiệm</span>
          <span style={hubStyles.desc}>AI tạo câu hỏi theo chủ đề bạn chọn, hoặc luyện điểm yếu của bạn</span>
        </span>
      </button>

      <button className="level-card" style={hubStyles.card} onClick={() => setMode('history')}>
        <span style={hubStyles.icon}><Icon name="book" size={20} /></span>
        <span style={hubStyles.text}>
          <span style={hubStyles.title}>Xem lại bài đã làm</span>
          <span style={hubStyles.desc}>Xem từng câu, đáp án và giải thích của các bài trắc nghiệm trước</span>
        </span>
      </button>

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

const MIN_SAMPLE = 3 // tuần có ít hơn số tin nhắn này thì coi là chưa đáng tin
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

// Dữ liệu cho biểu đồ "lỗi trên mỗi 10 tin nhắn"
function rateData(weeks) {
  return weeks.map((w) => ({
    label: weekLabel(w),
    value: w.rate,
    low: w.messages < MIN_SAMPLE,
    tip: w.rate === null ? `Tuần ${weekLabel(w)}: không có tin nhắn` : `Tuần ${weekLabel(w)}: ${w.rate} lỗi/10 tin (${w.messages} tin nhắn)`
  }))
}

function RateSummary({ weeks }) {
  const ok = weeks.filter((w) => w.rate !== null && w.messages >= MIN_SAMPLE)
  let text
  let color = 'var(--text-muted)'
  if (ok.length < 2) {
    text = `Chưa đủ dữ liệu để so sánh: cần ít nhất 2 tuần có từ ${MIN_SAMPLE} tin nhắn trở lên.`
  } else {
    const a = ok[ok.length - 1]
    const b = ok[ok.length - 2]
    const diff = Math.round((a.rate - b.rate) * 10) / 10
    const trend = diff < 0 ? `giảm ${Math.abs(diff)}` : diff > 0 ? `tăng ${diff}` : 'không đổi'
    color = diff < 0 ? '#27ae60' : diff > 0 ? '#c0392b' : 'var(--text-muted)'
    text = `Tuần ${weekLabel(a)}: ${a.rate} lỗi/10 tin, ${trend} so với tuần ${weekLabel(b)} (${b.rate}).`
  }
  const hasLow = weeks.some((w) => w.rate !== null && w.messages < MIN_SAMPLE)
  return (
    <>
      <div style={{ fontSize: fs(12), fontWeight: '600', color, marginTop: '8px', lineHeight: 1.5 }}>{text}</div>
      {hasLow && (
        <div style={{ fontSize: fs(11), color: 'var(--text-muted)', marginTop: '2px' }}>
          Cột nét đứt: tuần có dưới {MIN_SAMPLE} tin nhắn, số liệu chưa đáng tin.
        </div>
      )}
    </>
  )
}

const masteryColor = (m) => (m === null ? 'var(--border)' : m >= 70 ? '#27ae60' : m >= 40 ? '#e0a100' : '#c0392b')

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

function SkillMap({ skills }) {
  const has = skills.some((s) => s.mastery !== null || s.chatErrors > 0)
  if (!has) {
    return (
      <div style={{ ...progressStyles.cardSub, marginTop: '10px' }}>
        Chưa có dữ liệu. Làm vài bài trắc nghiệm hoặc ôn lỗi cũ, bản đồ kỹ năng sẽ hiện ra ở đây.
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
        {sorted.map((s) => (
          <div key={s.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-soft)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: fs(13) }}>
              <span style={{ fontWeight: '600' }}>{s.label}</span>
              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                {s.mastery === null ? 'Chưa đủ dữ liệu' : `${s.mastery}/100 · ${s.correct}/${s.total} đúng`}
              </span>
            </div>
            <div style={{ height: '6px', borderRadius: '999px', background: 'var(--border-soft)', marginTop: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${s.mastery ?? 0}%`, height: '100%', background: masteryColor(s.mastery), borderRadius: '999px' }} />
            </div>
            {s.chatErrors > 0 && (
              <div style={{ fontSize: fs(11), color: 'var(--text-muted)', marginTop: '4px' }}>
                {s.chatErrors} lỗi trong chat (30 ngày gần đây)
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

function ProgressScreen({ profileId, profile, onExit }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [insight, setInsight] = useState('')
  const [insightBusy, setInsightBusy] = useState(false)
  const [insightErr, setInsightErr] = useState('')

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

  if (!data || data.totals.messages === 0) {
    return wrap(
      <>
        <h2 style={styles.question}>Tiến bộ của bạn</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '380px', margin: 0 }}>
          Chưa có đủ dữ liệu. Hãy trò chuyện với AI vài ngày, số liệu sẽ xuất hiện ở đây.
        </p>
        <button className="qprimary" style={quizStyles.primary} onClick={onExit}>Quay lại</button>
      </>
    )
  }

  const { weeks, categories, totals, levels } = data
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
     

      
      <div style={{ ...progressStyles.card, maxWidth: '640px' }}>
        <div style={progressStyles.cardTitle}>Bản đồ kỹ năng</div>
        <div style={progressStyles.cardSub}>
          Điểm làm chủ = tỷ lệ đúng trong quiz và ôn lỗi gần đây (tối đa 20 câu mỗi kỹ năng, có làm mượt). Kỹ năng dưới 3 câu chưa được tính (hiện vòng rỗng). Nhãn kỹ năng do AI gán nên có thể có sai số.
        </div>
        <SkillMap skills={data.skills || []} />
      </div>

      <div style={{ ...progressStyles.card, maxWidth: '640px' }}>
        <div style={progressStyles.cardTitle}>Lỗi trên mỗi 10 tin nhắn</div>
        <div style={progressStyles.cardSub}>
          Thấp hơn là tốt hơn. Tuần không có tin nhắn được để trống. Đây chỉ là chỉ báo gần đúng, vì còn phụ thuộc độ khó chủ đề và độ dài tin nhắn.
        </div>
        <RateSummary weeks={weeks} />
        <BarChart data={rateData(weeks)} />
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
                    ? { text: 'Tăng', color: '#c0392b' }
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
        {insightErr && <div style={{ marginTop: '10px', fontSize: fs(13), color: '#c0392b' }}>{insightErr}</div>}
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
        <div style={styles.statCard}>
          <div style={{ fontSize: fs(22), fontWeight: '700', color: 'var(--text-strong)' }}>{totals.messages}</div>
          <div style={{ fontSize: fs(11), color: 'var(--text-muted)' }}>tin nhắn đã gửi</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ fontSize: fs(22), fontWeight: '700', color: 'var(--text-strong)' }}>
            {totals.mastered}/{totals.mistakes}
          </div>
          <div style={{ fontSize: fs(11), color: 'var(--text-muted)' }}>lỗi đã nhớ vững</div>
        </div>
      </div>

      <div style={styles.statCard}>
        <div style={{ fontSize: fs(13), fontWeight: '700' }}>Lỗi trên mỗi 10 tin nhắn</div>
        <div style={{ fontSize: fs(11), color: 'var(--text-muted)', marginTop: '2px' }}>
          8 tuần gần đây · thấp hơn là tốt hơn
        </div>
        <RateSummary weeks={weeks} />
        <BarChart height={70} labelEvery={2} data={rateData(weeks)} />
      </div>

      {/* Thẻ mới: Kỹ năng cần luyện */}
      {(() => {
        const sk = data.skills || []
        const scored = sk.filter((s) => s.mastery !== null).sort((a, b) => a.mastery - b.mastery).slice(0, 3)
        const chatOnly = sk.filter((s) => s.chatErrors > 0).sort((a, b) => b.chatErrors - a.chatErrors).slice(0, 3)
        const list = scored.length > 0 ? scored : chatOnly
        return (
          <div style={styles.statCard}>
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

      <div style={styles.statCard}>
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
                  ? { text: 'Tăng', color: '#c0392b' }
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

      <div style={styles.statCard}>
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
        {err && <div style={{ marginTop: '8px', fontSize: fs(12), color: '#c0392b' }}>{err}</div>}
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

function VocabStudy({ cards, title, speakLang, onBack }) {
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
            speakText(card.word, speakLang)
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

function VocabScreen({ profileId, profile, cefrLevel, onExit }) {
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
    return <VocabStudy cards={visible} title={title} speakLang={speakLang} onBack={() => setMode('explorer')} />
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
              <button style={vocabStyles.cardSpeak} onClick={() => speakText(detail.word, speakLang)} title="Nghe phát âm">
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

function AppContent({ settings, onOpenSettings, onLoggedInChange }) {
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
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [mistakes, setMistakes] = useState([])
  const [showReview, setShowReview] = useState(false)
  const [showPractice, setShowPractice] = useState(false)
  const [showVocab, setShowVocab] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
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

  // Gắn vào khung chat: mỗi lần khung xuất hiện (vào app, quay về từ màn khác) tự cuộn xuống cuối
  const setChatBox = useCallback((el) => {
    chatBoxRef.current = el
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  // Có tin mới hoặc chấm "đang trả lời": cuộn xuống cuối (mượt khi thêm 1-2 tin, tức thì khi nạp cả đoạn chat)
  useEffect(() => {
    const el = chatBoxRef.current
    const grew = chatHistory.length - prevLenRef.current
    prevLenRef.current = chatHistory.length
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: grew > 0 && grew <= 2 ? 'smooth' : 'auto' })
  }, [chatHistory.length, isChatLoading])

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
  const result = await window.api.getMistakes({ profileId })
  setMistakes(result.mistakes || [])
  setShowReview(true)
}

const handleOpenEditProfile = () => {
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


const handleSendMessage = async () => {
  if (!chatInput.trim()) return

  const userMessage = { role: 'user', text: chatInput }
  const newHistory = [...chatHistory, userMessage]
  setChatHistory(newHistory)
  setChatInput('')
  setIsChatLoading(true)

  try {
    const result = await window.api.sendChatMessage({
      profileId: profileId,
      conversationId: currentConversationId,
      topic: currentTopic,
      cefrLevel: placementResult?.level || 'A1',
      targetLanguage: profile.targetLanguage,
      nativeLanguage: profile.nativeLanguage,
      goal: profile.goal,
      history: chatHistory.slice(-6),
      message: userMessage.text
    })
    setChatHistory([...newHistory, { role: 'model', text: result.reply, mistakes: result.mistakes || [] }])
    if (result.conversationId && result.conversationId !== currentConversationId) {
      setCurrentConversationId(result.conversationId)
    }
    loadConversations(profileId)
    refreshMistakes()
    refreshDailyStats()
  } catch (error) {
    console.error('Error:', error)
  } finally {
    setIsChatLoading(false)
  }
}

const handleLogout = () => {
  setStep(0)
  setProfileId(null)
  setProfile({ nativeLanguage: '', targetLanguage: '', goal: '', occupation: '', interests: '' })
  setPlacementResult(null)
  setChatHistory([])
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
              <p style={{ color: '#c0392b', fontSize: fs(13), margin: 0 }}>{usernameError}</p>
            )}
            <button
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
          {placementError && <p style={{ margin: 0, color: '#c0392b', fontSize: fs(13) }}>{placementError}</p>}
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
              <span style={{ color: '#c0392b', textDecoration: 'line-through' }}>{m.original_text}</span>
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
      onExit={() => setShowVocab(false)}
    />
  )
}

  if (showProgress) {
    return (
      <ProgressScreen
        profileId={profileId}
        profile={profile}
        onExit={() => setShowProgress(false)}
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
return (
  <div style={styles.appLayout} className="fade-in" key={step}>
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
      <button style={styles.newChatButton} onClick={handleNewConversation}>
        <Icon name="plus" size={16} /> Đoạn chat mới
      </button>

      <nav style={styles.navList}>
        <button className="nav-item" style={styles.navItem} onClick={handleOpenReview}>
          <Icon name="book" size={17} /> Sổ tay lỗi sai
        </button>
        <button className="nav-item" style={styles.navItem} onClick={() => setShowPractice(true)}>
          <Icon name="repeat" size={17} /> <span style={{ flex: 1, textAlign: 'left' }}>Ôn tập</span>
          {dueCount > 0 && <span style={styles.dueBadge}>{dueCount > 99 ? '99+' : dueCount}</span>}
        </button>
        <button className="nav-item" style={styles.navItem} onClick={() => setShowVocab(true)}>
          <Icon name="cards" size={17} /> Từ vựng
        </button>
        <button className="nav-item" style={styles.navItem} onClick={() => setShowProgress(true)}>
          <Icon name="trend" size={17} /> Tiến bộ
        </button>
        <button className="nav-item" style={styles.navItem} onClick={handleOpenNotes}>
          <Icon name="user" size={17} /> AI biết gì về bạn
        </button>
      </nav>

      <div style={styles.convSectionV2}>
        {conversations.length > 0 && <div style={styles.sectionLabel}>Đoạn chat</div>}
        {conversations.map((c) => (
          <div
            key={c.id}
            className="conv-item"
            style={{
              ...styles.convItem,
              ...(c.id === currentConversationId ? styles.convItemActive : {})
            }}
            onClick={() => switchConversation(c.id)}
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
          <span style={styles.profileAvatarSmall}>
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
    <main style={styles.mainArea}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <h2 style={{ ...styles.question, fontSize: fs(26) }}>Luyện tập cùng AI</h2>
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

      <div ref={setChatBox} style={styles.chatBoxFull}>
        {chatHistory.length === 0 && !isChatLoading && (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ marginBottom: '14px' }}>Bắt đầu cuộc trò chuyện — thử một gợi ý:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {chatSuggestions.map((s) => (
                <button key={s} style={styles.suggestionChip} onClick={() => setChatInput(s)}>
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
      gap: '6px',
      alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
    }}
  >
       <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
      {msg.role === 'model' && (
        <button
          style={styles.speakButton}
          onClick={() => speakText(msg.text, speechLang)}
          title="Nghe đọc"
        >
          <Icon name="speaker" size={14} />
        </button>
      )}
      <div
        style={{
          ...styles.chatBubble,
          background: msg.role === 'user' ? 'var(--bubble-user-bg)' : 'var(--bubble-ai-bg)',
          color: msg.role === 'user' ? 'var(--bubble-user-text)' : 'var(--text)'
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

           <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '980px' }}>
        <input
          style={{ ...styles.input, width: '100%' }}
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Nhập tin nhắn..."
          disabled={isChatLoading}
        />
         <button
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
          <div style={styles.statCard}>
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

          <div style={styles.statCard}>
            <div style={{ fontSize: fs(32), fontWeight: '700', color: 'var(--accent)' }}>{mistakes.length}</div>
            <div style={{ fontSize: fs(13), color: 'var(--text-muted)' }}>lỗi đã ghi nhận</div>
          </div>

          <div style={styles.statCard}>
            <div style={{ fontSize: fs(13), fontWeight: '700', marginBottom: '8px' }}>Lỗi hay gặp nhất</div>
            {categoryCounts.length === 0 && <div style={{ fontSize: fs(13), color: 'var(--text-muted)' }}>Chưa có dữ liệu</div>}
            {categoryCounts.map(([cat, count]) => (
              <div key={cat} style={{ fontSize: fs(13), display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>{cat}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>

          <div style={styles.statCard}>
            <div style={{ fontSize: fs(13), fontWeight: '700', marginBottom: '8px' }}>Lỗi gần đây</div>
            {mistakes.length === 0 && <div style={{ fontSize: fs(13), color: 'var(--text-muted)' }}>Chưa có lỗi nào</div>}
            {mistakes.slice(0, 3).map((m) => (
              <div key={m.id} style={{ fontSize: fs(13), marginBottom: '8px' }}>
                <span style={{ color: '#c0392b', textDecoration: 'line-through' }}>{m.original_text}</span>
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

function formatMessage(text) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    if (!line.trim()) return <div key={i} style={{ height: '8px' }} />
    const parts = line.split(/(\*\*.*?\*\*|\([^()]*\))/g)
    return (
      <div key={i} style={{ marginBottom: '4px' }}>
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j}>{part.slice(2, -2)}</strong>
          }
          if (part.startsWith('(') && part.endsWith(')')) {
            return <span key={j} style={{ opacity: 0.7, fontSize: '0.92em' }}>{part}</span>
          }
          return part
        })}
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
    color: '#ffffff',
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
    textAlign: 'left'
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
    background: '#6366f1',
    color: '#ffffff',
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
    background: '#ef4444',
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
    background: '#ef4444',
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
    color: '#ffffff',
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
    color: '#ffffff',
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
    background: '#6366f1',
    color: '#ffffff',
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
    color: '#ffffff'
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


function SettingsModal({ settings, onChange, onClose }) {
  return (
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
      </div>
    </div>
  )
}

function App() {
  const [settings, setSettings] = useState(loadSettings)
  const [showSettings, setShowSettings] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  useLayoutEffect(() => {
    const apply = () => {
      const isDark =
        settings.theme === 'dark' ||
        (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      const root = document.documentElement
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
        />
      )}
    </>
  )
}

export default App