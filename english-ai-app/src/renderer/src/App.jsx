import { useState ,useEffect,useLayoutEffect,useRef } from "react";

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
  levelCardActive: { borderColor: 'var(--accent)', background: 'var(--accent-soft)' },
  levelCode: { fontSize: fs(15), fontWeight: '700' },
  levelDesc: { fontSize: fs(11), color: 'var(--text-muted)', lineHeight: 1.35 },
  levelBar: { display: 'inline-flex', alignItems: 'center', gap: '8px' },
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
    <div style={styles.container} className="fade-in">
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
      {children}
    </div>
  )

  if (phase === 'loadingList') return wrap(<p>Đang tải danh sách ôn tập...</p>)

  if (phase === 'empty') {
    return wrap(
      <>
        <h2 style={styles.question}>Không có lỗi nào cần ôn</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '380px' }}>
          Hôm nay bạn đã ôn hết rồi. Hãy quay lại vào ngày mai, hoặc trò chuyện thêm để AI ghi nhận thêm lỗi nhé.
        </p>
        <button style={styles.button} onClick={onExit}>Quay lại luyện tập</button>
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
        <p style={{ color: 'var(--text-muted)' }}>câu trả lời đúng</p>
        <button style={styles.button} onClick={onExit}>Quay lại luyện tập</button>
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
      <h2 style={styles.question}>Ôn tập lỗi cũ</h2>

      <div style={practiceStyles.card}>
        <div style={styles.mistakeCategory}>{current.category}</div>
        {phase === 'loadingQuestion' && <p style={{ margin: '12px 0 0' }}>Đang tạo câu hỏi...</p>}
        {phase === 'error' && (
          <p style={{ margin: '12px 0 0' }}>Không tạo được câu hỏi (có thể AI đang quá tải).</p>
        )}
        {question && phase !== 'loadingQuestion' && phase !== 'error' && (
          <>
            <p style={{ margin: '10px 0', fontSize: fs(14), color: 'var(--text-soft)' }}>{question.instruction}</p>
            <div style={practiceStyles.sentence}>{question.sentence}</div>
          </>
        )}
      </div>

      {(phase === 'answering' || phase === 'checking' || phase === 'feedback') && (
        <input
          style={{ ...styles.input, width: '100%', maxWidth: '520px' }}
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

      <div style={{ display: 'flex', gap: '10px' }}>
        <button style={{ ...styles.backButton, display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={onExit}>
          <Icon name="back" size={16} /> Thoát
        </button>

        {(phase === 'answering' || phase === 'checking') && (
          <button style={styles.button} onClick={handleSubmit} disabled={!answer.trim() || phase === 'checking'}>
            {phase === 'checking' ? 'Đang chấm...' : 'Kiểm tra'}
          </button>
        )}
        {phase === 'feedback' && (
          <button style={styles.button} onClick={handleNext}>
            {index + 1 >= queue.length ? 'Xem kết quả' : 'Câu tiếp theo'}
          </button>
        )}
        {phase === 'error' && (
          <>
            <button style={styles.button} onClick={() => loadQuestion(current)}>Thử lại</button>
            <button style={styles.backButton} onClick={handleNext}>Bỏ qua</button>
          </>
        )}
      </div>
    </>
  )
}

function AddWordBox({ profileId, profile, cefrLevel, onAdded }) {
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
      cefrLevel
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
function VocabScreen({ profileId, profile, cefrLevel, onExit }) {
  const [list, setList] = useState([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadVocabulary = async () => {
    const res = await window.api.getVocabulary({ profileId })
    setList(res.vocabulary || [])
    setLoading(false)
  }

  useEffect(() => {
    loadVocabulary()
  }, [])

  const handleAdded = async () => {
    await loadVocabulary()
    setIndex(0) // từ mới nằm đầu danh sách
    setFlipped(false)
  }

  const wrap = (children) => (
    <div style={styles.container} className="fade-in">
      <style>{fadeStyle}</style>
      {children}
    </div>
  )

  if (loading) return wrap(<p>Đang tải từ vựng...</p>)

  if (list.length === 0) {
    return wrap(
      <>
        <h2 style={styles.question}>Chưa có từ vựng nào</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '380px' }}>
          Trò chuyện với AI để tự ghi lại từ hay gặp, hoặc tự thêm từ bên dưới.
        </p>
        <AddWordBox
          profileId={profileId}
          profile={profile}
          cefrLevel={cefrLevel}
          onAdded={handleAdded}
        />
        <button style={styles.button} onClick={onExit}>Quay lại</button>
      </>
    )
  }

  const card = list[index]
  const next = () => {
    setFlipped(false)
    setIndex((i) => (i + 1) % list.length)
  }
  const prev = () => {
    setFlipped(false)
    setIndex((i) => (i - 1 + list.length) % list.length)
  }
   const speakLang = toSpeechLang(profile?.targetLanguage)
    return wrap(
    <>
      <div>
        <h2 style={styles.question}>Flashcard từ vựng</h2>
        <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: fs(14) }}>
          {list.length} từ đã lưu
        </p>
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
          <div style={{ fontSize: fs(34), fontWeight: '700', color: 'var(--text-strong)' }}>
            {card.word}
          </div>
        ) : (
          <>
            <div style={{ fontSize: fs(22), fontWeight: '600' }}>{card.meaning}</div>
            {card.example_sentence && (
              <div style={{ fontSize: fs(14), color: 'var(--text-soft)', fontStyle: 'italic', maxWidth: '400px' }}>
                "{card.example_sentence}"
              </div>
            )}
          </>
        )}
        <div style={vocabStyles.hint}>{flipped ? 'Bấm để quay lại' : 'Bấm để lật thẻ'}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        <button style={vocabStyles.navBtn} onClick={prev} title="Từ trước" aria-label="Từ trước">
          <Icon name="back" size={18} />
        </button>
        <span style={{ minWidth: '60px', textAlign: 'center', fontSize: fs(14), color: 'var(--text-muted)' }}>
          {index + 1} / {list.length}
        </span>
        <button style={vocabStyles.navBtn} onClick={next} title="Từ tiếp theo" aria-label="Từ tiếp theo">
          <Icon name="next" size={18} />
        </button>
      </div>

      <AddWordBox
        profileId={profileId}
        profile={profile}
        cefrLevel={cefrLevel}
        onAdded={handleAdded}
      />

      <button style={{ ...styles.backButton, display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={onExit}>
        <Icon name="back" size={16} /> Thoát
      </button>
    </>
  )
}


function AppContent({ settings }) {
  const [step, setStep] = useState(0)
  const [profile, setProfile]= useState({
    nativeLanguage:'',
    targetLanguage:'',
    goal:''
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
  const [dailyStats, setDailyStats] = useState({ messagesToday: 0, streak: 0 })
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
    goal: p.goal
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
      levelSource: source
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
    cefrLevel: placementResult?.level || 'A1'
  })
  setShowEditProfile(true)
}

const handleSaveEditProfile = async () => {
  setIsSavingProfile(true)
  const res = await window.api.updateProfile({
    profileId,
    nativeLanguage: editForm.nativeLanguage,
    targetLanguage: editForm.targetLanguage,
    goal: editForm.goal
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
  setDailyStats({ messagesToday: res.messagesToday || 0, streak: res.streak || 0 })
}

useEffect(() => {
  refreshDailyStats()
}, [profileId])

useEffect(() => {
  refreshMistakes()
}, [profileId])

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
  setProfile({ nativeLanguage: '', targetLanguage: '', goal: '' })
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
    <StepCard key={3} current={3} title="Mục tiêu học của bạn là gì?">
      <Dropdown
        value={profile.goal}
        options={goalOptions}
        onChange={(v) => handleChange('goal', v)}
        placeholder="Chọn mục tiêu"
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

if (showPractice) {
  return (
    <PracticeScreen
      profileId={profileId}
      profile={profile}
      cefrLevel={placementResult?.level || 'A1'}
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
                style={{ ...styles.sidebarButton, textAlign: 'left' }}
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

      <div style={styles.chatBoxFull}>
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
      <h3 style={{ margin: 0, fontSize: fs(16), fontWeight: '700' }}>Thống kê của bạn</h3>
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
    padding: '14px 36px',
    fontSize: fs(15),
    fontWeight: '700',
    letterSpacing: '0.5px',
    borderRadius: '999px',
    border: '1.5px solid var(--btn-border)',
    background: 'var(--surface)',
    color: 'var(--btn-text)',
    cursor: 'pointer',
    textTransform: 'uppercase'
  },
  backButton: {
    padding: '14px 24px',
    fontSize: fs(15),
    fontWeight: '600',
    borderRadius: '999px',
    border: '1.5px solid transparent',
    background: 'transparent',
    color: 'var(--text-muted)',
    cursor: 'pointer'
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
      <AppContent settings={settings} />
      <button style={{ ...settingsStyles.gear, display: 'flex', alignItems: 'center', justifyContent: 'center', }} onClick={() => setShowSettings(true)} title="Cài đặt">
        <Icon name="settings" size={20} />
      </button>
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